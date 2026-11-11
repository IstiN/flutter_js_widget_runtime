---
id: "n_0179_tool"
type: "note"
tags: ["flutter","sdk","toolchain","environment"]
---
Toolchain state 2026-11-10 (supersedes n_0002_3e24 + n_0010_88ba): /opt/homebrew/share/flutter is a git checkout UPGRADED to Flutter 3.47.4 (Dart 3.13.3) — same release as ~/development/flutter; the old 3.47.1's Dart 3.13.1 native-build-hooks failure (exit 253, stale hooks_runner, hit in corpus phase 11) is GONE. Gates re-verified green under the upgraded SDK: angle1b_smoke PASS + compare_1b_render PASS_IDENTICAL (trio 0x5f1b7376). Fresh shell PATH may still resolve ~/development/flutter first — pin with PATH=/opt/homebrew/share/flutter/bin:$PATH when the Homebrew SDK is wanted. Goldens + CRAP ratchet still need <repo>/native/quickjs/libquickjs_bridge.so (build via bash ~/git/quickjs_runtime/tool/build_quickjs.sh; the repo copy carries the map_hash_key fix from quickjs_runtime 7df3b473). The 3.47.1 profile-AOT gen_snapshot hang note is likely obsolete too (same 3.47.4 release as ~/development now) — unverified for profile builds.
