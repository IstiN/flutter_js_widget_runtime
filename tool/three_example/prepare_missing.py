#!/usr/bin/env python3
"""Batch-prepare official THREE examples that do not yet have widget output.

Results are written to /tmp/three_prepare_results.json and individual logs to
/tmp/three_prepare_logs/. Existing widget directories are never rebuilt unless
explicitly named with --examples or --all is supplied.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime
import json
import pathlib
import subprocess
import sys
import time

import generate_missing_examples as generator

ROOT = generator.ROOT
PREPARE = generator.PREPARE
RESULTS = pathlib.Path("/tmp/three_prepare_results.json")
LOGS = pathlib.Path("/tmp/three_prepare_logs")


def prepare(official: str, source: pathlib.Path) -> dict[str, object]:
    started = time.monotonic()
    command = ["node", str(PREPARE), official, "--source", str(source), "--offline"]
    try:
        completed = subprocess.run(
            command,
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=300,
            check=False,
        )
        output = completed.stdout + completed.stderr
        returncode = completed.returncode
    except subprocess.TimeoutExpired as error:
        chunks = [error.stdout or "", error.stderr or ""]
        output = "".join(
            chunk.decode(errors="replace") if isinstance(chunk, bytes) else chunk
            for chunk in chunks
        )
        output += "\nprepare timed out after 300 seconds\n"
        returncode = 124
    log = LOGS / f"{official}.log"
    log.write_text("$ " + " ".join(command) + "\n" + output)
    lines = [line.strip() for line in output.splitlines() if line.strip()]
    reason = "" if returncode == 0 else (lines[-1] if lines else f"exit {returncode}")
    return {
        "example": official,
        "status": "prepared" if returncode == 0 else "failed",
        "returncode": returncode,
        "seconds": round(time.monotonic() - started, 3),
        "reason": reason,
        "log": str(log),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, default=generator.DEFAULT_SOURCE)
    parser.add_argument("--jobs", type=int, default=2)
    parser.add_argument("--all", action="store_true", help="rebuild all defined official examples")
    parser.add_argument("--examples", nargs="*", help="prepare only these official IDs")
    parser.add_argument("--results", type=pathlib.Path, default=RESULTS)
    args = parser.parse_args()
    if args.jobs < 1:
        parser.error("--jobs must be positive")
    source = args.source.resolve()
    defined = generator.definitions()
    if args.examples is not None:
        unknown = sorted(set(args.examples) - set(defined))
        if unknown:
            parser.error(f"undefined examples: {', '.join(unknown)}")
        targets = list(args.examples)
    elif args.all:
        targets = [item for item in generator.official_examples(source) if item in defined]
    else:
        targets = [
            item
            for item in generator.official_examples(source)
            if item in defined
            and not (ROOT / "example/widgets" / defined[item][1] / "widget.js").is_file()
        ]
    LOGS.mkdir(parents=True, exist_ok=True)
    print(f"Preparing {len(targets)} examples with {args.jobs} jobs; logs: {LOGS}", flush=True)
    results: list[dict[str, object]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = {pool.submit(prepare, item, source): item for item in targets}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            results.append(result)
            print(f"[{len(results)}/{len(targets)}] {result['status']:8} {result['example']} ({result['seconds']}s)" + (f" — {result['reason']}" if result["reason"] else ""), flush=True)
            args.results.write_text(json.dumps({
                "startedTargets": len(targets),
                "completed": len(results),
                "results": sorted(results, key=lambda item: str(item["example"])),
            }, indent=2) + "\n")
    ordered = sorted(results, key=lambda item: str(item["example"]))
    failed = [item for item in ordered if item["status"] == "failed"]
    summary = {
        "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source": str(source),
        "offline": True,
        "targets": len(targets),
        "prepared": len(ordered) - len(failed),
        "failed": len(failed),
        "results": ordered,
    }
    args.results.write_text(json.dumps(summary, indent=2) + "\n")
    print(f"Done: {summary['prepared']} prepared, {summary['failed']} failed; results: {args.results}", flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
