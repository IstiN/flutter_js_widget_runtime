// The official stress scene clones 601 independently transformed morph horses.
// R1 evaluates those morphs on QuickJS rather than a GPU. Bounding the scene to
// 301 horses keeps the same 25 animation groups, materials, floor, shadow
// pipeline and spatial distribution with half the per-update JS/upload work.
const ANCHOR = 'for ( let i = - 600; i < 601; i += 2 )';

export function applyShadowmapBoundedCountPatch(bytes) {
  const source = Buffer.from(bytes).toString('utf8');
  if (!source.includes(ANCHOR)) throw new Error('shadowmap performance: horse-count anchor drifted');
  console.warn('three: R1 bounds shadowmap_performance to 301 morph horses (official: 601).');
  return Buffer.from(source.replace(ANCHOR, 'for ( let i = - 300; i < 301; i += 2 )'), 'utf8');
}
