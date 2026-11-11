// node_builtin_stub.js — bundling placeholder for Node builtins referenced by
// vendored CJS deps (opentype.js requires 'fs' for Node font loading; the
// corpus path always parses from ArrayBuffers, so the real API is never
// exercised). ESM-named exports keep esbuild's CJS interop satisfied.
export const readFileSync = () => { throw new Error('fs stub'); };
export const readFile = () => { throw new Error('fs stub'); };
export const existsSync = () => false;
export const statSync = () => { throw new Error('fs stub'); };
export default {};
