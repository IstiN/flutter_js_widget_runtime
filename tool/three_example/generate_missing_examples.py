#!/usr/bin/env python3
"""Inventory and generate registrations for pinned official THREE examples.

Without flags this prints the coverage inventory. ``--write`` adds missing
prepare definitions and CLI prepare-registry entries. After batch preparation,
``--register-prepared`` adds only examples with a widget.js to the Flutter
runner and example pubspec. Existing entries are never rewritten.
"""
from __future__ import annotations

import argparse
import hashlib
import html as html_lib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PREPARE = ROOT / "tool/three_example/prepare.mjs"
RUNNER = ROOT / "example/lib/three_example.dart"
CLI = ROOT / "bin/jsr_three_example.dart"
PUBSPEC = ROOT / "example/pubspec.yaml"
DEFAULT_SOURCE = pathlib.Path("/tmp/jsr-three-r186")
DEFINITION_RE = re.compile(
    r"^ {0,2}((?:webgl|webaudio)_[a-z0-9_]+): \{[ \t]*\n"
    r"[ \t]+id: '([^']+)',[ \t]*\n"
    r"[ \t]+directory: '([^']+)'",
    re.MULTILINE,
)
SCRIPT_OPEN_RE = re.compile(rb"<script\b[^>]*>", re.IGNORECASE)
SCRIPT_CLOSE_RE = re.compile(rb"</script\s*>", re.IGNORECASE)
TYPE_RE = re.compile(
    rb"\btype\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s>]+))",
    re.IGNORECASE,
)
LABEL_WORDS = {
    "2d": "2D",
    "2darray": "2D Array",
    "3d": "3D",
    "3dm": "3DM",
    "3ds": "3DS",
    "3dtiles": "3D Tiles",
    "3mf": "3MF",
    "amf": "AMF",
    "ascii": "ASCII",
    "avif": "AVIF",
    "bvh": "BVH",
    "csg": "CSG",
    "csm": "CSM",
    "dds": "DDS",
    "dof": "DOF",
    "exr": "EXR",
    "fbx": "FBX",
    "fxaa": "FXAA",
    "gcode": "G-code",
    "gltf": "glTF",
    "gpgpu": "GPGPU",
    "gtao": "GTAO",
    "hdr": "HDR",
    "html": "HTML",
    "ifc": "IFC",
    "ik": "IK",
    "ktx": "KTX",
    "ktx2": "KTX2",
    "ldraw": "LDraw",
    "lod": "LOD",
    "lottie": "Lottie",
    "md2": "MD2",
    "mdd": "MDD",
    "nrrd": "NRRD",
    "obj": "OBJ",
    "pcd": "PCD",
    "pcss": "PCSS",
    "pdb": "PDB",
    "ply": "PLY",
    "pmrem": "PMREM",
    "pvrtc": "PVRTC",
    "raf": "RAF",
    "rgb": "RGB",
    "rgba": "RGBA",
    "rtt": "RTT",
    "sao": "SAO",
    "smaa": "SMAA",
    "ssaa": "SSAA",
    "ssao": "SSAO",
    "ssr": "SSR",
    "stl": "STL",
    "taa": "TAA",
    "tga": "TGA",
    "tsl": "TSL",
    "ttf": "TTF",
    "ubo": "UBO",
    "ultrahdr": "Ultra HDR",
    "usdz": "USDZ",
    "uv": "UV",
    "vox": "VOX",
    "vrml": "VRML",
    "vsm": "VSM",
    "webgl": "WebGL",
    "webaudio": "WebAudio",
    "xyz": "XYZ",
}


def official_examples(source: pathlib.Path) -> list[str]:
    examples = source / "examples"
    return sorted(
        path.stem
        for pattern in ("webgl_*.html", "webaudio_*.html")
        for path in examples.glob(pattern)
    )


def definitions() -> dict[str, tuple[str, str]]:
    return {
        match.group(1): (match.group(2), match.group(3))
        for match in DEFINITION_RE.finditer(PREPARE.read_text())
    }


def module_bytes(html: bytes, official: str) -> bytes:
    modules: list[bytes] = []
    position = 0
    while opening := SCRIPT_OPEN_RE.search(html, position):
        closing = SCRIPT_CLOSE_RE.search(html, opening.end())
        if closing is None:
            raise ValueError(f"{official}: unclosed script at byte {opening.start()}")
        match = TYPE_RE.search(opening.group())
        script_type = next((group for group in match.groups() if group is not None), b"") if match else b""
        if script_type.strip().lower() == b"module":
            modules.append(html[opening.end() : closing.start()])
        position = closing.end()
    if len(modules) != 1:
        raise ValueError(f"{official}: expected one module script, found {len(modules)}")
    return modules[0]


def label(official: str, source_root: pathlib.Path = DEFAULT_SOURCE) -> str:
    source_path = source_root / "examples" / f"{official}.html"
    if source_path.exists():
        source = source_path.read_text(errors="replace")
        title = re.search(r"<title>\s*three\.js\s+(?:webgl|webaudio)\s*-\s*(.*?)\s*</title>", source, re.DOTALL)
        if title:
            value = html_lib.unescape(title.group(1)).replace("/", " / ")
            return " ".join(value.split())
    tokens = official.split("_", 1)[1].split("_")
    return " ".join(LABEL_WORDS.get(token, token.capitalize()) for token in tokens)


def slug(official: str) -> str:
    stem = official.removeprefix("webgl_")
    return stem.replace("_", "-")


def enum_name(official: str) -> str:
    tokens = official.split("_", 1)[1].split("_")
    return tokens[0] + "".join(token[:1].upper() + token[1:] for token in tokens[1:])


def definition_text(official: str, source: pathlib.Path) -> str:
    html = (source / "examples" / f"{official}.html").read_bytes()
    module = module_bytes(html, official)
    widget_id = f"three-{slug(official)}"
    icon = "🔊" if official.startswith("webaudio_") else "🧊"
    return f"""  {official}: {{
    id: '{widget_id}',
    directory: '{widget_id}',
    name: '{label(official, source)} — three.js r186',
    description: 'Unmodified official {official} module on the JSR THREE R1/WebGL2 runtime.',
    icon: '{icon}',
    expected: {{
      html: '{hashlib.sha256(html).hexdigest()}',
      module: '{hashlib.sha256(module).hexdigest()}'
    }},
    assets: []
  }},
"""


def replace_once(path: pathlib.Path, old: str, new: str) -> None:
    text = path.read_text()
    if text.count(old) != 1:
        raise ValueError(f"{path}: expected one edit anchor, found {text.count(old)}")
    path.write_text(text.replace(old, new))


def write_definitions(source: pathlib.Path) -> None:
    existing = definitions()
    missing = [item for item in official_examples(source) if item not in existing]
    if missing:
        entries = "".join(definition_text(item, source) for item in missing)
        replace_once(PREPARE, "});\nconst slash", entries + "});\nconst slash")
    cli_text = CLI.read_text()
    registered = set(re.findall(r"^  '((?:webgl|webaudio)_[a-z0-9_]+)',$", cli_text, re.MULTILINE))
    cli_missing = [item for item in official_examples(source) if item not in registered]
    if cli_missing:
        entries = "".join(f"  '{item}',\n" for item in cli_missing)
        replace_once(CLI, "  'webgl_materials_modified',\n};", "  'webgl_materials_modified',\n" + entries + "};")
    print(f"Added {len(missing)} prepare definitions and {len(cli_missing)} CLI entries.")


def register_prepared(source: pathlib.Path) -> None:
    defined = definitions()
    runner_text = RUNNER.read_text()
    runner_ids = set(re.findall(r"exampleId: '([^']+)'", runner_text))
    enum_names = set(re.findall(r"^  ([a-z][a-zA-Z0-9]*)\(\s*\n\s+exampleId:", runner_text, re.MULTILINE))
    additions = []
    skipped = []
    for official in official_examples(source):
        if official in runner_ids:
            continue
        if official not in defined:
            skipped.append((official, "no prepare definition"))
            continue
        widget_id, directory = defined[official]
        if not (ROOT / "example/widgets" / directory / "widget.js").is_file():
            skipped.append((official, "no prepared widget.js"))
            continue
        name = enum_name(official)
        if name in enum_names:
            raise ValueError(f"{official}: generated enum name collides: {name}")
        enum_names.add(name)
        additions.append((official, name, widget_id, directory))
    if not additions:
        print(f"No prepared registrations to add; {len(skipped)} remain unprepared.")
        return
    enum_entries = "".join(
        f"  {name}(\n"
        f"    exampleId: '{official}',\n"
        f"    label: '{label(official, source).replace(chr(39), chr(92) + chr(39))}',\n"
        f"    widgetId: '{widget_id}',\n"
        f"    assetPath: 'widgets/{directory}/widget.js',\n"
        f"  ),\n"
        for official, name, widget_id, directory in additions
    )
    replace_once(RUNNER, "  audioTiming(\n", enum_entries + "  audioTiming(\n")
    sidebar_entries = "".join(f"    {name},\n" for _, name, _, _ in additions)
    replace_once(RUNNER, "  static final List<ThreeExampleSelection> sidebarOrder = [\n", "  static final List<ThreeExampleSelection> sidebarOrder = [\n" + sidebar_entries)
    pubspec_text = PUBSPEC.read_text()
    assets = set(re.findall(r"^    - (widgets/three-[^/]+/)$", pubspec_text, re.MULTILINE))
    asset_entries = "".join(
        f"    - widgets/{directory}/\n"
        for _, _, _, directory in additions
        if f"widgets/{directory}/" not in assets
    )
    if asset_entries:
        replace_once(PUBSPEC, "    - assets/models/\n", asset_entries + "    - assets/models/\n")
    print(f"Registered {len(additions)} prepared examples; {len(skipped)} remain unprepared.")
    for official, reason in skipped:
        print(f"UNPREPARED {official}: {reason}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, default=DEFAULT_SOURCE)
    parser.add_argument("--write", action="store_true", help="add missing prepare definitions and CLI entries")
    parser.add_argument("--register-prepared", action="store_true", help="register only successfully prepared widgets")
    parser.add_argument("--json", type=pathlib.Path, help="write the inventory as JSON")
    args = parser.parse_args()
    source = args.source.resolve()
    official = official_examples(source)
    defined = definitions()
    runner_ids = set(re.findall(r"exampleId: '([^']+)'", RUNNER.read_text()))
    inventory = {
        "official": len(official),
        "webgl": sum(item.startswith("webgl_") for item in official),
        "webaudio": sum(item.startswith("webaudio_") for item in official),
        "defined": len(set(official) & set(defined)),
        "registered": len(set(official) & runner_ids),
        "missing_definitions": [item for item in official if item not in defined],
        "unregistered": [item for item in official if item not in runner_ids],
    }
    if args.json:
        args.json.write_text(json.dumps(inventory, indent=2) + "\n")
    print(json.dumps({key: value if not isinstance(value, list) else len(value) for key, value in inventory.items()}, indent=2))
    if args.write:
        write_definitions(source)
    if args.register_prepared:
        register_prepared(source)
    return 0


if __name__ == "__main__":
    sys.exit(main())
