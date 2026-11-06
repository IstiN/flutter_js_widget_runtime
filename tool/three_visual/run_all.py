#!/usr/bin/env python3
"""Regenerate the complete 303-example visual verification matrix."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

from common import ROOT

HERE = Path(__file__).resolve().parent
FLUTTER = Path("/opt/homebrew/share/flutter/bin/flutter")


def run(command: list[str], cwd: Path = ROOT) -> None:
    print("+ " + " ".join(command), flush=True)
    environment = os.environ.copy()
    environment["PATH"] = f"{FLUTTER.parent}:{environment.get('PATH', '')}"
    subprocess.run(command, cwd=cwd, env=environment, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference-workers", type=int, default=6)
    parser.add_argument("--ours-workers", type=int, default=4)
    parser.add_argument("--force", action="store_true", help="Recapture existing PNGs")
    parser.add_argument("--reset-verdicts", action="store_true")
    parser.add_argument("--skip-references", action="store_true")
    parser.add_argument("--skip-ours", action="store_true")
    parser.add_argument("--no-build", action="store_true")
    args = parser.parse_args()
    force = ["--force"] if args.force else []
    if not args.skip_references:
        run(
            [
                sys.executable,
                str(HERE / "capture_references.py"),
                "--workers",
                str(args.reference_workers),
                *force,
            ]
        )
    if not args.skip_ours:
        if not args.no_build:
            run(
                [str(FLUTTER), "build", "macos", "-t", "lib/screenshot.dart"],
                cwd=ROOT / "example",
            )
        run(
            [
                sys.executable,
                str(HERE / "capture_ours.py"),
                "--workers",
                str(args.ours_workers),
                *force,
            ]
        )
    compose = [sys.executable, str(HERE / "compose.py")]
    if args.reset_verdicts:
        compose.append("--reset-verdicts")
    run(compose)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
