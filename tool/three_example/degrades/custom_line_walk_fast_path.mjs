// Full-rate native random-walk lane for webgl_custom_attributes_lines.
// The official module remains pinned byte-for-byte. Native QuickJS evaluates
// the same uniform increments in Dart; every other engine keeps the official
// Math.random loop. No vertices, updates, or animation frames are skipped.
export function applyCustomLineWalkFastPath(bytes) {
  const source = Buffer.from(bytes).toString('utf8');
  const anchor = `\t\t\t\tfor ( let i = 0, l = array.length; i < l; i += 3 ) {

\t\t\t\t\tarray[ i ] += 0.3 * ( 0.5 - Math.random() );
\t\t\t\t\tarray[ i + 1 ] += 0.3 * ( 0.5 - Math.random() );
\t\t\t\t\tarray[ i + 2 ] += 0.3 * ( 0.5 - Math.random() );

\t\t\t\t}`;
  if (source.indexOf(anchor) < 0 || source.indexOf(anchor) !== source.lastIndexOf(anchor)) {
    throw new Error('custom line native random walk: update anchor drifted');
  }
  const replacement = `\t\t\t\tif ( typeof globalThis.__jsrLineWalkBytes === 'function' ) {

\t\t\t\t\tglobalThis.__jsrLineWalkBytes( 'three.lineWalk', new Uint8Array( array.buffer, array.byteOffset, array.byteLength ) );

\t\t\t\t} else {

${anchor.split('\n').map(line => `\t${line}`).join('\n')}

\t\t\t\t}`;
  return Buffer.from(source.replace(anchor, replacement), 'utf8');
}
