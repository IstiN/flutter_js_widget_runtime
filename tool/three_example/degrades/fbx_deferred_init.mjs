// Keep the official FBX module byte-exact, but do not assume its initial
// asset load is network-delayed. Native pinned assets may resolve in the same
// evaluation turn; the load callback reads GUI folders that init() creates
// later. A macrotask cannot be drained reentrantly by native host calls in
// the remainder of init(), unlike a Promise job on the QuickJS backend.
const LOAD_ANCHOR = `\t\t\t\tloader = new FBXLoader( manager );
\t\t\t\tloadAsset( params.asset );`;

const LOAD_REPLACEMENT = `\t\t\t\tloader = new FBXLoader( manager );
\t\t\t\tsetTimeout( function () {

\t\t\t\t\tloadAsset( params.asset );

\t\t\t\t}, 0 );`;

export function applyFbxDeferredInitPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  const first = source.indexOf(LOAD_ANCHOR);
  if (first < 0 || first !== source.lastIndexOf(LOAD_ANCHOR)) {
    throw new Error('fbx deferred init: load anchor drifted');
  }
  source = source.replace(LOAD_ANCHOR, LOAD_REPLACEMENT);
  return Buffer.from(source, 'utf8');
}
