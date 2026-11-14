// R1 runs the protoplanet GPGPU kernels on QuickJS. The official 64x64 grid
// needs ~31 ms per non-collision frame (plus aggregation spikes); 48x48 keeps
// the same seeded disc, materials, gravity mesh and display topology while
// reducing the CPU simulation to 56.25% of the official particle count.
const ANCHOR = 'const WIDTH = 64;';

export function applyProtoplanetBoundedResolutionPatch(bytes) {
  const source = Buffer.from(bytes).toString('utf8');
  if (!source.includes(ANCHOR)) throw new Error('protoplanet: WIDTH anchor drifted');
  console.warn('three: R1 bounds the CPU protoplanet simulation to 48x48 particles (official: 64x64).');
  return Buffer.from(source.replace(ANCHOR, 'const WIDTH = 48;'), 'utf8');
}
