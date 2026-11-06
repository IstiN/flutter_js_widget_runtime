---
id: "n_0168_eada"
type: "note"
title: "webgl_pmrem_test renders near-black BY DESIGN: spot1Lux.hdr contains exactly ONE non-zero RGBE pixel (sum ~79392 nits; the official example doc states \"PMREM on: HDR with a single bright pixel\", 1/(sin(phi)*(pi/512)^2) = 27490 nits target). Verified with three's own HDRLoader. R1's capture shows the expected specular glints on the metal+dielectric sphere rows; the residual delta vs the official screenshot (roughness-blurred gray spheres) is the documented R1 1B omission of PMREM CubeUV roughness prefiltering — honest engine gap, not a widget bug."
author: "agent"
date: "2026-11-05T18:24:32.954288Z"
area: "project"
topics: []
source: "agent"
accessCount: 0
importance: 0.5
tags: ["#note", "#source_agent", "pmrem", "hdr", "spot1lux", "three-widgets"]
---


# Note: n_0168_eada

webgl_pmrem_test renders near-black BY DESIGN: spot1Lux.hdr contains exactly ONE non-zero RGBE pixel (sum ~79392 nits; the official example doc states "PMREM on: HDR with a single bright pixel", 1/(sin(phi)*(pi/512)^2) = 27490 nits target). Verified with three's own HDRLoader. R1's capture shows the expected specular glints on the metal+dielectric sphere rows; the residual delta vs the official screenshot (roughness-blurred gray spheres) is the documented R1 1B omission of PMREM CubeUV roughness prefiltering — honest engine gap, not a widget bug.

**By:** [[agent]]
**Date:** 2026-11-05T18:24:32.954288Z
**Area:** [[project|project]]
