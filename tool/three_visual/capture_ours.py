#!/usr/bin/env python3
"""Run the built macOS RepaintBoundary screenshot harness for every example."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Any

from common import (
    Example,
    QUICKJS_LIB,
    ROOT,
    SCREENSHOT_APP,
    TMP_ROOT,
    add_selection_arguments,
    image_stats,
    now_iso,
    read_json,
    selected_examples,
    write_json,
)


def valid_png(path: Path) -> bool:
    if not path.is_file() or path.stat().st_size == 0:
        return False
    try:
        image_stats(path)
        return True
    except Exception:
        return False


def capture(example: Example, timeout: int, force: bool, isolate: bool) -> dict[str, Any]:
    directory = TMP_ROOT / example.widget_id
    output = directory / "ours.png"
    metadata_path = directory / "ours.json"
    log_path = directory / "ours.log"
    directory.mkdir(parents=True, exist_ok=True)
    app_mtime_ns = SCREENSHOT_APP.stat().st_mtime_ns if SCREENSHOT_APP.is_file() else None
    if not force and valid_png(output) and metadata_path.is_file():
        previous = read_json(metadata_path)
        fps = previous.get("performance", {}).get("presentedFps")
        if (
            previous.get("status") == "ok"
            and isinstance(fps, (int, float))
            and previous.get("app_mtime_ns") == app_mtime_ns
        ):
            result: dict[str, Any] = {"widget_id": example.widget_id, "resumed": True}
            result.update(previous)
            return result

    output.unlink(missing_ok=True)
    environment = os.environ.copy()
    environment.update(
        {
            "JSR_WIDGET": example.widget_id,
            "JSR_OUT": str(output),
            "JSR_QUICKJS_LIB": str(QUICKJS_LIB),
            "JSR_ISOLATE": "1" if isolate else "0",
        }
    )
    started = time.monotonic()
    returncode = -1
    log = ""
    error = ""
    try:
        completed = subprocess.run(
            [str(SCREENSHOT_APP)],
            cwd=ROOT / "example",
            env=environment,
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
        error = f"Screenshot harness timed out after {timeout}s"
        if exc.stdout:
            log = exc.stdout.decode(errors="replace") if isinstance(exc.stdout, bytes) else exc.stdout
    log_path.write_text(log, encoding="utf-8")
    if not error and returncode != 0:
        error = f"Screenshot harness exited with status {returncode}"
    if not error and not valid_png(output):
        error = "Harness did not produce a valid ours.png"
    stats = image_stats(output) if output.is_file() and valid_png(output) else None
    diagnostics = next(
        (line for line in reversed(log.splitlines()) if "THREE diagnostics:" in line), ""
    )
    performance: dict[str, Any] = {}
    performance_match = re.search(r"THREE performance: (\{.*\})", log)
    if performance_match:
        try:
            performance = json.loads(performance_match.group(1))
        except json.JSONDecodeError:
            performance = {"error": "invalid performance record"}
    result = {
        "widget_id": example.widget_id,
        "official_id": example.official_id,
        "status": "ok" if not error else "error",
        "error": error,
        "returncode": returncode,
        "duration_seconds": round(time.monotonic() - started, 3),
        "isolate_backend": isolate,
        "diagnostics": diagnostics,
        "performance": performance,
        "app_mtime_ns": app_mtime_ns,
        "updated": now_iso(),
        "stats": stats,
    }
    write_json(metadata_path, result)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--timeout", type=int, default=45)
    parser.add_argument(
        "--direct-engine",
        action="store_true",
        help="Use the direct QuickJS backend instead of the production isolate backend.",
    )
    add_selection_arguments(parser)
    args = parser.parse_args()
    if not SCREENSHOT_APP.is_file():
        parser.error(
            f"Build the harness first: cd example && flutter build macos -t lib/screenshot.dart\n"
            f"Missing: {SCREENSHOT_APP}"
        )
    if not QUICKJS_LIB.is_file():
        parser.error(f"QuickJS bridge not found: {QUICKJS_LIB}")
    items = selected_examples(args.only)
    TMP_ROOT.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {
            pool.submit(capture, item, args.timeout, args.force, not args.direct_engine): item
            for item in items
        }
        for count, future in enumerate(concurrent.futures.as_completed(futures), 1):
            item = futures[future]
            try:
                result = future.result()
            except Exception as exc:
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
        manifest_path = TMP_ROOT / "ours_manifest.json"
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
    write_json(TMP_ROOT / "ours_manifest.json", summary)
    print(
        f"Ours: {summary['ok']} ok, {summary['errors']} errors, "
        f"{summary['black_or_empty']} black/empty in {summary['duration_seconds']}s"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
