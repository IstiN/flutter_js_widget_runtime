#!/usr/bin/env python3
"""Capture official three.js examples with headless Chrome's GPU backend.

Use --swiftshader only as a software fallback: it can produce false empty
references for GPU-heavy official examples.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import os
import shutil
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path
from typing import Any

from common import (
    Example,
    TMP_ROOT,
    add_selection_arguments,
    image_stats,
    now_iso,
    read_json,
    selected_examples,
    write_json,
)

CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
WEBGL_ERRORS = (
    "Error creating WebGL context",
    "WebGL context could not be created",
    "Failed to create WebGL",
)


def valid_png(path: Path) -> bool:
    if not path.is_file() or path.stat().st_size == 0:
        return False
    try:
        image_stats(path)
        return True
    except Exception:
        return False


def capture(
    example: Example,
    timeout: int,
    budget: int,
    force: bool,
    swiftshader: bool,
    real_wait_ms: int = 0,
) -> dict[str, Any]:
    directory = TMP_ROOT / example.widget_id
    output = directory / "reference.png"
    metadata_path = directory / "reference.json"
    log_path = directory / "reference.log"
    directory.mkdir(parents=True, exist_ok=True)
    if not force and valid_png(output) and metadata_path.is_file():
        previous = read_json(metadata_path)
        if previous.get("status") == "ok":
            result: dict[str, Any] = {"widget_id": example.widget_id, "resumed": True}
            result.update(previous)
            return result

    started = time.monotonic()
    # A server-root mistake otherwise produces a perfectly valid PNG of a 404
    # page, which image-stat checks alone cannot distinguish from a scene.
    try:
        with urllib.request.urlopen(example.url, timeout=10) as response:
            if response.status != 200:
                raise RuntimeError(f"Reference URL returned HTTP {response.status}")
    except Exception as exc:
        result = {
            "widget_id": example.widget_id,
            "official_id": example.official_id,
            "url": example.url,
            "status": "error",
            "error": f"Reference is unavailable: {exc}",
            "updated": now_iso(),
        }
        write_json(metadata_path, result)
        output.unlink(missing_ok=True)
        return result
    if real_wait_ms > 0:
        helper = Path(__file__).with_name("capture_reference.cjs")
        command = [
            "node",
            str(helper),
            example.url,
            str(output),
            str(real_wait_ms),
        ]
        environment = os.environ.copy()
        modules = Path("/tmp/three_visual_tools/node_modules")
        if modules.is_dir():
            environment["NODE_PATH"] = str(modules)
        try:
            completed = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                errors="replace",
                timeout=max(timeout, real_wait_ms // 1000 + 25),
                check=False,
                env=environment,
            )
            returncode = completed.returncode
            log = completed.stdout
            error = "" if returncode == 0 else f"Playwright exited with status {returncode}"
        except subprocess.TimeoutExpired as exc:
            returncode = -1
            error = f"Playwright timed out after {timeout}s"
            log = exc.stdout or ""
            if isinstance(log, bytes):
                log = log.decode(errors="replace")
            output.unlink(missing_ok=True)
        log_path.write_text(log, encoding="utf-8")
        if not error and not valid_png(output):
            error = "Playwright did not produce a valid reference.png"
        stats = image_stats(output) if output.is_file() and valid_png(output) else None
        result = {
            "widget_id": example.widget_id,
            "official_id": example.official_id,
            "url": example.url,
            "status": "ok" if not error else "error",
            "error": error,
            "returncode": returncode,
            "duration_seconds": round(time.monotonic() - started, 3),
            "capture_mode": "playwright-real-wall-clock",
            "real_wait_ms": real_wait_ms,
            "gpu_backend": "chrome-default",
            "performance": read_json(Path(str(output) + ".performance.json")),
            "updated": now_iso(),
            "stats": stats,
        }
        write_json(metadata_path, result)
        return result

    profile = tempfile.mkdtemp(prefix=f"three-visual-{os.getpid()}-")
    command = [
        str(CHROME),
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-extensions",
        "--disable-sync",
        "--hide-scrollbars",
        "--mute-audio",
        "--no-first-run",
        "--enable-logging=stderr",
        f"--user-data-dir={profile}",
        "--window-size=1280,800",
        "--force-device-scale-factor=1",
        f"--virtual-time-budget={budget}",
        f"--screenshot={output}",
        example.url,
    ]
    if swiftshader:
        command[1:1] = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    returncode = -1
    log = ""
    error = ""
    try:
        completed = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            errors="replace",
            timeout=timeout,
            check=False,
        )
        returncode = completed.returncode
        log = completed.stdout
    except subprocess.TimeoutExpired as exc:
        error = f"Chrome timed out after {timeout}s"
        output.unlink(missing_ok=True)
        if exc.stdout:
            log = exc.stdout.decode(errors="replace") if isinstance(exc.stdout, bytes) else exc.stdout
    finally:
        shutil.rmtree(profile, ignore_errors=True)

    log_path.write_text(log, encoding="utf-8")
    context_error = next((line for line in log.splitlines() if any(x in line for x in WEBGL_ERRORS)), "")
    if not error and context_error:
        error = f"WebGL context failure: {context_error.strip()}"
    if not error and returncode != 0:
        error = f"Chrome exited with status {returncode}"
    if not error and not valid_png(output):
        error = "Chrome did not produce a valid reference.png"

    stats = image_stats(output) if output.is_file() and valid_png(output) else None
    result = {
        "widget_id": example.widget_id,
        "official_id": example.official_id,
        "url": example.url,
        "status": "ok" if not error else "error",
        "error": error,
        "returncode": returncode,
        "duration_seconds": round(time.monotonic() - started, 3),
        "virtual_time_budget_ms": budget,
        "gpu_backend": "swiftshader" if swiftshader else "chrome-default",
        "updated": now_iso(),
        "stats": stats,
    }
    write_json(metadata_path, result)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--timeout", type=int, default=45)
    parser.add_argument("--budget", type=int, default=8000)
    parser.add_argument(
        "--real-wait-ms",
        type=int,
        default=0,
        help="Use Playwright wall-clock waits and record browser RAF FPS for slow GPU examples.",
    )
    parser.add_argument(
        "--swiftshader",
        action="store_true",
        help="Force software WebGL instead of Chrome's default GPU backend.",
    )
    add_selection_arguments(parser)
    args = parser.parse_args()
    if not CHROME.is_file():
        parser.error(f"Chrome not found: {CHROME}")
    items = selected_examples(args.only)
    TMP_ROOT.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {
            pool.submit(
                capture,
                item,
                args.timeout,
                args.budget,
                args.force,
                args.swiftshader,
                args.real_wait_ms,
            ): item
            for item in items
        }
        for count, future in enumerate(concurrent.futures.as_completed(futures), 1):
            item = futures[future]
            try:
                result = future.result()
            except Exception as exc:  # Keep the batch going and record the failure.
                result = {"widget_id": item.widget_id, "status": "error", "error": str(exc)}
            results.append(result)
            flags = ""
            stats = result.get("stats")
            if stats and (stats["black"] or stats["empty"]):
                flags = " BLACK/EMPTY"
            print(
                f"[{count:3}/{len(items)}] {item.widget_id}: "
                f"{result.get('status', 'error')}{flags} {result.get('error', '')}",
                flush=True,
            )
    if args.only:
        manifest_path = TMP_ROOT / "reference_manifest.json"
        previous = read_json(manifest_path).get("results", []) if manifest_path.is_file() else []
        captured_ids = {item.widget_id for item in items}
        results.extend(
            item for item in previous if item.get("widget_id") not in captured_ids
        )
    results.sort(key=lambda item: item["widget_id"])
    summary = {
        "total": len(results),
        "ok": sum(item.get("status") == "ok" for item in results),
        "errors": sum(item.get("status") != "ok" for item in results),
        "black_or_empty": sum(
            bool(item.get("stats")) and (item["stats"]["black"] or item["stats"]["empty"])
            for item in results
        ),
        "duration_seconds": round(time.monotonic() - started, 3),
        "updated": now_iso(),
        "results": results,
    }
    write_json(TMP_ROOT / "reference_manifest.json", summary)
    print(
        f"References: {summary['ok']} ok, {summary['errors']} errors, "
        f"{summary['black_or_empty']} black/empty in {summary['duration_seconds']}s"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
