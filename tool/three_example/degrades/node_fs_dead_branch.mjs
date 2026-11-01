// opentype.js contains a Node-only Font.download branch behind a window check.
// TTFLoader uses opentype.parse exclusively; no filesystem API is reachable.
export default Object.freeze({});
export function writeFileSync() { throw new Error('opentype Node filesystem export is unavailable'); }
