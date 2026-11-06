// Post-build widget patch: linear ASCII text decode in the bundled binary
// text helper (JSR bounded degrade, applied to the PREPARED widget.js only).
//
// The bundled runtime helper that turns asset bytes into text decodes the
// ASCII fast path as
//   let a=""; for (let i=0;i<len;i+=CHUNK) a += String.fromCharCode.apply(null, chunk); return a
// QuickJS strings are flat (no ropes), so each 8KB chunk append copies the
// whole accumulated string: loading the 6.8MB prepared VRML JSON did
// ~2.7GB of quadratic memcpy on the QuickJS thread (measured in-app:
// `sample` shows the worker pinned in js_add_slow -> JS_ConcatString ->
// memmove inside the loadAsset promise job; the elevationGrid1 switch
// burned >6 CPU-minutes without finishing).
//
// Fix: same chunking, accumulate into an array and join once — linear.
// The non-ASCII path of the same helper already chunk-joins. The patch is
// a skeleton regex over the minified bundle (minifier symbol names shift
// between builds, so the identifiers are captured, not pinned); prepare
// throws unless exactly one match is found, so it can never silently miss.
export const WIDGET_TEXT_DECODE_PATTERN =
	/let ([A-Za-z$_][A-Za-z0-9$_]*)="";for\(let ([A-Za-z$_][A-Za-z0-9$_]*)=0;\2<([A-Za-z$_][A-Za-z0-9$_]*);\2\+=([A-Za-z$_][A-Za-z0-9$_]*)\)\1\+=String\.fromCharCode\.apply\(null,([A-Za-z$_][A-Za-z0-9$_]*)\.subarray\(\2,Math\.min\(\2\+\4,\3\)\)\);return \1/g;

export function applyWidgetTextDecodeJoinPatch(bytes) {
	const source = bytes.toString('utf8');
	const matches = [...source.matchAll(WIDGET_TEXT_DECODE_PATTERN)];
	if (matches.length !== 1) {
		throw new Error(
			`widget_text_decode_join: anchor drift (expected exactly 1 ASCII chunk-accumulate site, got ${matches.length})`
		);
	}
	const [full, acc, i, len, chunk, base] = matches[0];
	// Fresh counter names derived from the captured ones with a suffix no
	// minifier emits, so they cannot collide inside the helper's scope.
	const idxN = `${i}jsrN`;
	const replacement =
		`let ${acc}=new Array(1+(${len}/${chunk}|0)),${idxN}=0;` +
		`for(let ${i}=0;${i}<${len};${i}+=${chunk})` +
		`${acc}[${idxN}++]=String.fromCharCode.apply(null,${base}.subarray(${i},Math.min(${i}+${chunk},${len})));` +
		`return ${acc}.join("")`;
	return Buffer.from(source.replace(full, replacement), 'utf8');
}
