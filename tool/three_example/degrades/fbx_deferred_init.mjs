// Keep the official FBX module byte-exact, but do not assume its initial
// asset load is network-delayed. Native pinned assets may resolve in the same
// evaluation turn; the load callback reads GUI folders that init() creates
// later. Do not rely on Promise/macrotask ordering across native host calls:
// some QuickJS drains are reentrant. Rearm a zero-delay task until both GUI
// folders observably exist, then start the official load path.
const LOAD_ANCHOR = `\t\t\t\tloader = new FBXLoader( manager );
\t\t\t\tloadAsset( params.asset );`;

const LOAD_REPLACEMENT = `\t\t\t\tloader = new FBXLoader( manager );
\t\t\t\tsetTimeout( function loadInitialAssetWhenReady() {

\t\t\t\t\tif ( ! guiAnimationsFolder || ! guiMorphsFolder ) {

\t\t\t\t\t\tsetTimeout( loadInitialAssetWhenReady, 0 );
\t\t\t\t\t\treturn;

\t\t\t\t\t}

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
