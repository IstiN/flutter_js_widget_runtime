// webgl_test_memory2 intentionally recreates hundreds of shader materials.
// Per-material adaptation warnings plus before/after program-count logs are
// therefore emitted again every frame; the console bridge, not the scene,
// becomes the bottleneck. Keep the first instance of each distinct diagnostic
// and suppress exact repeats. Values and material allocation stay unchanged.
export function installDedupWarnings() {
  for (const level of ['warn', 'log']) {
    const original = console[level];
    const seen = new Set();
    console[level] = function (...args) {
      const key = args.join('|');
      if (seen.has(key)) return;
      seen.add(key);
      original.apply(console, args);
    };
  }
}
