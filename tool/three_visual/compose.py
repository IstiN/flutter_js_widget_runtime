#!/usr/bin/env python3
"""Build side-by-side JPEGs, seed verdicts, and generate the contact sheet."""

from __future__ import annotations

import argparse
import html
import json
import statistics
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps, ImageStat

from common import (
    DOC_ROOT,
    TMP_ROOT,
    Example,
    examples,
    image_stats,
    now_iso,
    read_json,
    write_json,
)

STATUSES = ("similar", "different", "blocked", "degraded-documented")


def load_capture(directory: Path, side: str) -> dict[str, Any]:
    path = directory / f"{side}.json"
    if path.is_file():
        return read_json(path)
    return {"status": "error", "error": f"Missing {side}.json capture record"}


def normalized_mae(reference: Path, ours: Path) -> float:
    size = (320, 200)
    with Image.open(reference) as ref_source, Image.open(ours) as our_source:
        ref = ref_source.convert("RGB").resize(size, Image.Resampling.LANCZOS)
        our = our_source.convert("RGB").resize(size, Image.Resampling.LANCZOS)
        means = ImageStat.Stat(ImageChops.difference(ref, our)).mean
        return round(sum(means) / (3.0 * 255.0), 6)


def fitted(path: Path, size: tuple[int, int], label: str) -> Image.Image:
    background = Image.new("RGB", size, "#111827")
    if not path.is_file():
        draw = ImageDraw.Draw(background)
        draw.text((24, size[1] // 2), f"{label}: capture unavailable", fill="#fca5a5")
        return background
    try:
        with Image.open(path) as source:
            contained = ImageOps.contain(source.convert("RGB"), size, Image.Resampling.LANCZOS)
        position = ((size[0] - contained.width) // 2, (size[1] - contained.height) // 2)
        background.paste(contained, position)
    except Exception as exc:
        ImageDraw.Draw(background).text((24, size[1] // 2), f"{label}: {exc}", fill="#fca5a5")
    return background


def make_pair(example: Example, mae: float | None) -> None:
    source = TMP_ROOT / example.widget_id
    output = DOC_ROOT / example.widget_id
    output.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGB", (1280, 440), "#0f172a")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default(size=16)
    small_font = ImageFont.load_default(size=12)
    metric = "n/a" if mae is None else f"{mae:.4f}"
    draw.text(
        (12, 2),
        f"{example.widget_id}  |  {example.official_id}",
        fill="#f8fafc",
        font=font,
    )
    draw.text((12, 23), "LEFT: REFERENCE (Chrome)", fill="#93c5fd", font=small_font)
    draw.text((330, 23), f"normalized MAE: {metric}", fill="#cbd5e1", font=small_font)
    draw.text((652, 23), "RIGHT: OURS (Flutter)", fill="#fda4af", font=small_font)
    canvas.paste(fitted(source / "reference.png", (640, 400), "REFERENCE"), (0, 40))
    canvas.paste(fitted(source / "ours.png", (640, 400), "OURS"), (640, 40))
    draw.rectangle((0, 40, 639, 439), outline="#475569", width=1)
    draw.rectangle((640, 40, 1279, 439), outline="#475569", width=1)
    canvas.save(output / "pair.jpg", "JPEG", quality=75, optimize=True)


def seed_verdict(
    example: Example,
    reference: dict[str, Any],
    ours: dict[str, Any],
    mae: float | None,
    threshold: float,
) -> dict[str, Any]:
    reasons = []
    for side, capture in (("reference", reference), ("ours", ours)):
        if capture.get("status") != "ok":
            reasons.append(f"{side}: {capture.get('error') or 'capture failed'}")
        stats = capture.get("stats")
        if stats and stats.get("black"):
            reasons.append(f"{side}: black capture")
        elif stats and stats.get("empty"):
            reasons.append(f"{side}: empty/near-uniform capture")
    if reasons:
        status = "blocked"
        summary = "; ".join(reasons)
    elif mae is None:
        status = "blocked"
        summary = "Pixel comparison unavailable"
    elif mae <= threshold:
        status = "similar"
        summary = ""
    else:
        status = "different"
        summary = (
            f"Automated normalized MAE {mae:.4f} exceeds {threshold:.4f}; "
            "visual review required to classify the rendering difference."
        )
    return {
        "status": status,
        "summary": summary,
        "updated": now_iso(),
        "official_id": example.official_id,
        "mae": mae,
        "performance": {
            "native": ours.get("performance", {}),
            "reference": reference.get("performance", {}),
        },
        "auto_seeded": True,
    }


def verdict_for(
    example: Example,
    reference: dict[str, Any],
    ours: dict[str, Any],
    mae: float | None,
    threshold: float,
    reset: bool,
) -> dict[str, Any]:
    path = DOC_ROOT / example.widget_id / "verdict.json"
    seeded = seed_verdict(example, reference, ours, mae, threshold)
    if path.is_file() and not reset:
        try:
            existing = read_json(path)
            # Human/agent review is sticky. Set auto_seeded=false (or remove it)
            # when editing a verdict; capture metrics still refresh below.
            if not existing.get("auto_seeded", False):
                seeded["status"] = existing.get("status", "")
                seeded["summary"] = existing.get("summary", "")
                seeded["updated"] = existing.get("updated", seeded["updated"])
                seeded["auto_seeded"] = False
        except (OSError, ValueError, TypeError):
            pass
    if seeded["status"] == "different" and (
        not isinstance(seeded["summary"], str) or not seeded["summary"].strip()
    ):
        seeded["summary"] = (
            f"Rendering differs (normalized MAE {mae}); manual review required."
        )
    return seeded


def write_index(records: list[dict[str, Any]], summary: dict[str, Any]) -> None:
    cards = []
    for record in records:
        widget_id = record["widget_id"]
        verdict = record["verdict"]
        mae = verdict.get("mae")
        metric = "n/a" if mae is None else f"{mae:.4f}"
        native_fps = verdict.get("performance", {}).get("native", {}).get("presentedFps")
        fps = "n/a" if not isinstance(native_fps, (int, float)) else f"{native_fps:.1f}"
        cards.append(
            f'<article id="{html.escape(widget_id)}" '
            f'class="card {html.escape(verdict["status"])}" '
            f'data-status="{html.escape(verdict["status"])}">'
            f'<h2>{html.escape(widget_id)}</h2>'
            f'<p><b>{html.escape(verdict["status"])}</b> · MAE {metric} · native {fps} FPS</p>'
            f'<a href="{widget_id}/pair.jpg"><img loading="lazy" '
            f'src="{widget_id}/pair.jpg" alt="{html.escape(widget_id)} reference and ours"></a>'
            f'<p>{html.escape(verdict.get("summary", ""))}</p></article>'
        )
    counts = summary["counts"]
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>THREE visual verification — 303 examples</title>
<style>
body{{margin:0;background:#0f172a;color:#e2e8f0;font:14px system-ui,sans-serif}}
header{{position:sticky;top:0;z-index:2;background:#020617ee;padding:16px 24px;border-bottom:1px solid #334155}}
h1{{margin:0 0 8px;font-size:24px}} main{{padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:20px}}
.card{{background:#1e293b;border:1px solid #475569;border-radius:8px;padding:12px;min-width:0}}
.card h2{{font-size:16px;margin:0}}.card p{{line-height:1.4;overflow-wrap:anywhere}}.card img{{display:block;width:100%;height:auto;background:#020617}}
.similar{{border-top:4px solid #22c55e}}.different{{border-top:4px solid #f97316}}.blocked{{border-top:4px solid #ef4444}}.degraded-documented{{border-top:4px solid #eab308}}
button{{margin:4px;padding:7px 12px}}a{{color:#93c5fd}}#worst li{{margin:4px}}
</style></head><body><header><h1>THREE visual verification</h1>
<div>303 registered · {summary['pixel_comparisons']} pixel comparisons · {counts['similar']} similar · {counts['different']} different · {counts['blocked']} blocked · {counts['degraded-documented']} degraded-documented</div>
<div>Stable native presented FPS measured for {summary['native_presented_fps']['measurements']} examples; median {summary['native_presented_fps']['median']}</div>
<div>Accounting generated {html.escape(summary['updated'])} · LEFT official Chrome / RIGHT native Flutter · MAE threshold {summary['threshold']}</div>
<div><button onclick="filterCards('all')">All</button><button onclick="filterCards('similar')">Similar</button><button onclick="filterCards('different')">Different</button><button onclick="filterCards('blocked')">Blocked</button></div>
<details><summary>Worst pixel diffs</summary><ol id="worst">{''.join(f'<li><a href="#{html.escape(item["widget_id"])}">{html.escape(item["widget_id"])}</a>: {item["mae"]:.4f}</li>' for item in summary['worst'])}</ol></details>
</header><main>{''.join(cards)}</main>
<script>function filterCards(status){{document.querySelectorAll('.card').forEach(card=>card.style.display=status==='all'||card.dataset.status===status?'block':'none')}}</script>
</body></html>"""
    (DOC_ROOT / "index.html").write_text(page, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--threshold", type=float, default=0.025)
    parser.add_argument(
        "--accounting-only",
        action="store_true",
        help="Rebuild only summary.json/index.html from surviving pairs and verdicts.",
    )
    parser.add_argument(
        "--reset-verdicts",
        action="store_true",
        help="Overwrite reviewed verdicts with fresh automatic seeds.",
    )
    args = parser.parse_args()
    DOC_ROOT.mkdir(parents=True, exist_ok=True)
    records = []
    for count, example in enumerate(examples(), 1):
        if args.accounting_only:
            output = DOC_ROOT / example.widget_id
            if not (output / "pair.jpg").is_file():
                raise FileNotFoundError(f"Missing {output / 'pair.jpg'}")
            verdict = read_json(output / "verdict.json")
            if verdict.get("status") not in STATUSES:
                raise ValueError(f"Invalid verdict status for {example.widget_id}")
            if verdict["status"] == "different" and not str(
                verdict.get("summary", "")
            ).strip():
                raise ValueError(f"Undocumented difference for {example.widget_id}")
            records.append({"widget_id": example.widget_id, "verdict": verdict})
            continue
        capture_dir = TMP_ROOT / example.widget_id
        reference = load_capture(capture_dir, "reference")
        ours = load_capture(capture_dir, "ours")
        mae = None
        if (capture_dir / "reference.png").is_file() and (capture_dir / "ours.png").is_file():
            try:
                # Validate both files even when capture metadata is unavailable.
                image_stats(capture_dir / "reference.png")
                image_stats(capture_dir / "ours.png")
                mae = normalized_mae(capture_dir / "reference.png", capture_dir / "ours.png")
            except Exception:
                mae = None
        verdict = verdict_for(example, reference, ours, mae, args.threshold, args.reset_verdicts)
        make_pair(example, mae)
        write_json(DOC_ROOT / example.widget_id / "verdict.json", verdict)
        records.append({"widget_id": example.widget_id, "verdict": verdict})
        if count % 25 == 0 or count == 303:
            print(f"Composited {count}/303", flush=True)
    counts = {status: sum(r["verdict"]["status"] == status for r in records) for status in STATUSES}
    worst = sorted(
        (
            {"widget_id": r["widget_id"], "mae": r["verdict"]["mae"]}
            for r in records
            if r["verdict"].get("mae") is not None
        ),
        key=lambda item: item["mae"],
        reverse=True,
    )[:30]
    native_fps_values = [
        value
        for record in records
        if isinstance(
            (value := record["verdict"].get("performance", {}).get("native", {}).get("presentedFps")),
            (int, float),
        )
    ]
    native_fps = {
        "measurements": len(native_fps_values),
        "min": min(native_fps_values) if native_fps_values else None,
        "median": statistics.median(native_fps_values) if native_fps_values else None,
        "max": max(native_fps_values) if native_fps_values else None,
    }
    summary = {
        "total": len(records),
        "counts": counts,
        "native_presented_fps": native_fps,
        "pixel_comparisons": sum(
            record["verdict"].get("mae") is not None for record in records
        ),
        "threshold": args.threshold,
        "accounting_only": args.accounting_only,
        "worst": worst,
        "updated": now_iso(),
    }
    write_json(DOC_ROOT / "summary.json", summary)
    write_index(records, summary)
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
