#!/usr/bin/env python3
"""Shared registry, paths, and image checks for the THREE visual matrix."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "example/lib/three_example.dart"
TMP_ROOT = Path("/tmp/three_visual")
DOC_ROOT = ROOT / "doc/three_visual"
SCREENSHOT_APP = (
    ROOT
    / "example/build/macos/Build/Products/Release/"
    "js_widget_runtime_example.app/Contents/MacOS/js_widget_runtime_example"
)
QUICKJS_LIB = Path.home() / "git/quickjs_runtime/native/quickjs/libquickjs_bridge.so"


@dataclass(frozen=True)
class Example:
    official_id: str
    widget_id: str

    @property
    def url(self) -> str:
        return f"http://localhost:8080/examples/{self.official_id}.html"


def examples() -> list[Example]:
    source = REGISTRY.read_text(encoding="utf-8")
    pairs = re.findall(
        r"exampleId:\s*'([^']+)'[\s\S]*?widgetId:\s*'([^']+)'", source
    )
    result = [Example(official_id, widget_id) for official_id, widget_id in pairs]
    if len(result) != 303 or len({item.widget_id for item in result}) != len(result):
        raise RuntimeError(
            f"Expected 303 unique THREE registry entries, parsed {len(result)}"
        )
    return result


def selected_examples(only: list[str] | None = None) -> list[Example]:
    items = examples()
    if not only:
        return items
    requested = set(only)
    unknown = requested - {item.widget_id for item in items} - {
        item.official_id for item in items
    }
    if unknown:
        raise SystemExit(f"Unknown example ids: {', '.join(sorted(unknown))}")
    return [
        item for item in items if item.widget_id in requested or item.official_id in requested
    ]


def image_stats(path: Path) -> dict[str, Any]:
    with Image.open(path) as source:
        image = source.convert("RGB")
        stat = ImageStat.Stat(image)
        mean = [round(value, 3) for value in stat.mean]
        stddev = [round(value, 3) for value in stat.stddev]
        luma = sum(mean) / 3.0
        return {
            "width": image.width,
            "height": image.height,
            "mean": mean,
            "stddev": stddev,
            "black": luma < 2.0 and max(stddev) < 4.0,
            "empty": max(stddev) < 1.5,
        }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    temporary.replace(path)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def add_selection_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--only",
        nargs="+",
        help="Only capture these three-* or official ids (default: all 303).",
    )
    parser.add_argument(
        "--force", action="store_true", help="Recapture valid existing PNG files."
    )
