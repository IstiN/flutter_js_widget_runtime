// webgl_loader_vrml switch-timing compat (JSR diagnostic lane).
//
// The deferred swap (see degrades/vrml_deferred_swap.mjs) keeps the old
// scene on screen while the next one loads; this compat bisects where the
// remaining wall time goes by timing the one huge JSON.parse (the prepared
// scene) and the first ObjectLoader construction on the QuickJS thread.
// Logs ride the widget console lane ([VRjsr] prefix, JSR_SWITCH_LOG).
export function installVrmlSwitchTiming() {
	if (globalThis.__jsrVrmlSwitchTiming) return;
	globalThis.__jsrVrmlSwitchTiming = true;
	const nativeParse = JSON.parse;
	JSON.parse = function (text, reviver) {
		if (typeof text === 'string' && text.length > 1000000) {
			const t0 = (globalThis.performance && performance.now()) || 0;
			const result = nativeParse.call(JSON, text, reviver);
			const ms = Math.round(((globalThis.performance && performance.now()) || 0) - t0);
			console.warn('[VRjsr] JSON.parse len=' + text.length + ' ms=' + ms);
			return result;
		}
		return nativeParse.call(JSON, text, reviver);
	};
}
