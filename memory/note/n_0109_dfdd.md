---
id: "n_0109_dfdd"
type: "note"
title: "three example test practices: (1) adapter publishDiagnostics OVERWRITES jsr.exportState on its own schedule, so one-shot probe exports vanish — merge by wrapping jsr.exportState and adding a `probe` key to the adapter's own object. (2) exported renderer.frame/stats counters can stay 0 while real frames submit (adapter renderer capture) — assert harness.state.submittedFrameCount / plan.draws instead. (3) three.js r186 crate.gif now ships PNG bytes (119768, magic 89 50 4E 47), so old 'GIF rejected by the PNG/JPEG/raw gate' gap tests are obsolete — the texture loads and binds. (4) Minified-name probe anchors drift on every re-prepare; prefer structural regex or append-only probes."
author: "agent"
date: "2026-10-30T23:38:55.102516Z"
area: "project"
topics: []
source: "agent"
accessCount: 0
importance: 0.5
tags: ["#note", "#source_agent", "three", "testing"]
---


# Note: n_0109_dfdd

three example test practices: (1) adapter publishDiagnostics OVERWRITES jsr.exportState on its own schedule, so one-shot probe exports vanish — merge by wrapping jsr.exportState and adding a `probe` key to the adapter's own object. (2) exported renderer.frame/stats counters can stay 0 while real frames submit (adapter renderer capture) — assert harness.state.submittedFrameCount / plan.draws instead. (3) three.js r186 crate.gif now ships PNG bytes (119768, magic 89 50 4E 47), so old 'GIF rejected by the PNG/JPEG/raw gate' gap tests are obsolete — the texture loads and binds. (4) Minified-name probe anchors drift on every re-prepare; prefer structural regex or append-only probes.

**By:** [[agent]]
**Date:** 2026-10-30T23:38:55.102516Z
**Area:** [[project|project]]
