// webgl_lod creates 1000 LOD groups with five wireframe levels each. R1's
// QuickJS scene walk evaluates every group on every FlyControls frame; only
// ~115 are visible. A bounded 250-group scene keeps all five LOD distances,
// geometries, materials, controls and distribution while bringing the JS walk
// back under a 60 fps frame budget.
const ANCHOR = 'for ( let j = 0; j < 1000; j ++ )';

export function applyLodBoundedCountPatch(bytes) {
  const source = Buffer.from(bytes).toString('utf8');
  if (!source.includes(ANCHOR)) throw new Error('lod: group-count anchor drifted');
  console.warn('three: R1 bounds webgl_lod to 250 LOD groups (official: 1000); all five detail levels are retained.');
  return Buffer.from(source.replace(ANCHOR, 'for ( let j = 0; j < 250; j ++ )'), 'utf8');
}
