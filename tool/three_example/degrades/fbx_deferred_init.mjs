// Keep the official FBX module byte-exact, but do not assume its asset load
// is network-delayed. Native pinned assets may call back before init() creates
// the Morphs/Animations GUI folders. Promise jobs and timers may also drain
// reentrantly during native host calls, so defer DELIVERY of the loaded group
// until both folders observably exist instead of relying on task ordering.
const CALLBACK_ANCHOR = `\t\t\t\tloader.load( 'models/fbx/' + asset + '.fbx', function ( group ) {`;
const CALLBACK_REPLACEMENT = `\t\t\t\tconst handleLoadedGroup = ( group ) => {`;
const COMPLETE_ANCHOR = `\t\t\t\t\tscene.add( object );\n\n\t\t\t\t} );`;
const COMPLETE_REPLACEMENT = `\t\t\t\t\tscene.add( object );\n\n\t\t\t\t};\n\n\t\t\t\tloader.load( 'models/fbx/' + asset + '.fbx', function ( group ) {\n\n\t\t\t\t\tfunction deliverGroup() {\n\n\t\t\t\t\t\tif ( ! guiAnimationsFolder || ! guiMorphsFolder ) {\n\n\t\t\t\t\t\t\tsetTimeout( deliverGroup, 0 );\n\t\t\t\t\t\t\treturn;\n\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\thandleLoadedGroup( group );\n\n\t\t\t\t\t}\n\n\t\t\t\t\tdeliverGroup();\n\n\t\t\t\t} );`;

export function applyFbxDeferredInitPatch(bytes) {
  let source = Buffer.from(bytes).toString('utf8');
  const callbackAt = source.indexOf(CALLBACK_ANCHOR);
  const completeAt = source.indexOf(COMPLETE_ANCHOR);
  if (callbackAt < 0 || callbackAt !== source.lastIndexOf(CALLBACK_ANCHOR) ||
      completeAt < 0 || completeAt !== source.lastIndexOf(COMPLETE_ANCHOR)) {
    throw new Error('fbx deferred init: load anchor drifted');
  }
  source = source.replace(CALLBACK_ANCHOR, CALLBACK_REPLACEMENT);
  source = source.replace(COMPLETE_ANCHOR, COMPLETE_REPLACEMENT);
  return Buffer.from(source, 'utf8');
}
