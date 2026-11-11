// p9_mapkey_probe.dart — phase-9 regression probe for the QuickJS int/double
// Map-key engine bug (FIXED in ~/git/quickjs_runtime/native/quickjs/quickjs.c
// map_hash_key: numbers now hash by their float64 VALUE with the float64 tag
// for both JS_TAG_INT and JS_TAG_FLOAT64, port of upstream master's
// invariant; quickjs 2024-01-13 hashed int*3163 ^ TAG_INT vs value ^ TAG_FLOAT64).
//
// Uses the SAME library resolution the 1B corpus uses (`dart run` from the
// flutter_js_widget_runtime repo root -> QuickjsFfi native-assets hook, or
// JSR_QUICKJS_LIB / native/quickjs/libquickjs_bridge.so fallback).
//
// Prints machine-parsable lines:
//   PROBE <name> <PASS|FAIL> detail
//   PROBE_SUMMARY <pass>/<total> PASS
// Exit 0 iff all probes pass.
//
// Tagging reference (why the shapes below):
//  - parseInt()/literals -> JS_NewFloat64 -> integral doubles NORMALIZED to
//    the int tag.
//  - FBXLoader getInt64 `high*4294967296+low` and the phase-8 workaround
//    `X+0.5-0.5` go through __JS_NewFloat64 -> integral doubles KEEP the
//    float64 tag.
//  - Map buckets hash the JSValue tag (pre-fix) -> equal numbers missed.
import 'dart:io';
import 'package:quickjs_runtime/quickjs_runtime.dart';

const kCases = <String, String>{
  // strict equality / SameValue across int/double JSValue tags (all intact)
  'strict_eq_int_vs_div': '(7481808 === 7481808/1) && (200*3+1481808 === 1482408)',
  'object_is_cross_rep': 'Object.is(7481808, 7481808/1)',
  'object_is_distinguishes_zeros': '!Object.is(0, -0)',
  'loose_and_lt_gt': '(7481808 == 7481808/1) && !((7481808/1) < 7481808) && !((7481808/1) > 7481808)',
  // THE BUG: getInt64-shaped keys (float64 tag) vs parseInt lookups (int tag)
  'fbx_getint64_set_parseint_get': '(function(){var m=new Map();var N=100,miss=0;for(var i=0;i<N;i++){var id=0*4294967296+(1481808+i*7);m.set(id,"v"+i);}for(var i=0;i<N;i++){if(!m.has(parseInt(String(0*4294967296+(1481808+i*7)))))miss++;}return miss;})()',
  'fbx_parseint_set_getint64_get': '(function(){var m=new Map();var N=100,miss=0;for(var i=0;i<N;i++){m.set(parseInt(String(1481808+i*7)),"v"+i);}for(var i=0;i<N;i++){if(!m.has(0*4294967296+(1481808+i*7)))miss++;}return miss;})()',
  // Map get/delete/forEach across reps
  'map_cross_rep_get': '(function(){var m=new Map();for(var i=0;i<64;i++)m.set(0*4294967296+(1481808+i),"v"+i);return m.get(parseInt("1481850"))==="v42"?1:0;})()',
  'map_cross_rep_delete': '(function(){var m=new Map();m.set(7481808+0.5-0.5,"v");return m.delete(parseInt("7481808"))&&m.size===0?1:0;})()',
  'map_arith_set_literal_has': '(function(){var m=new Map();m.set(200*3+1481808,"x");return m.has(1482408)?1:0;})()',
  // Set across reps
  'set_getint64_add_parseint_has': '(function(){var s=new Set();for(var i=0;i<100;i++)s.add(0*4294967296+(1481808+i));return s.has(parseInt("1481850"))?1:0;})()',
  // stress both directions at 200 records
  'stress_int_set_f64_has': '(function(){var m=new Map();for(var i=0;i<200;i++){m.set(i*7+1000,"v"+i);}var miss=0;for(var i=0;i<200;i++){if(!m.has((i*7+1000)+0.5-0.5))miss++;}return miss;})()',
  'stress_f64_set_int_has': '(function(){var m=new Map();for(var i=0;i<200;i++){m.set((i*7+1000)+0.5-0.5,"v"+i);}var miss=0;for(var i=0;i<200;i++){if(!m.has(i*7+1000))miss++;}return miss;})()',
  // out-of-int32 range (both sides float64 tag pre- and post-fix)
  'map_int32_overflow': '(function(){var m=new Map();m.set(2147483648,"v");return m.has(2147483648)&&m.has(2147483648/1)?1:0;})()',
  // JS-spec regressions that must NOT break
  'spec_neg_zero_sz': '(function(){var m=new Map();m.set(-0,"nz");return m.has(0)&&m.get(0)==="nz"?1:0;})()',
  'spec_nan_never_eq': '(function(){var m=new Map();m.set(NaN,"n");return m.has(NaN)&&!(NaN===NaN)?1:0;})()',
  'spec_weakmap_reject_primitive': '(function(){try{new WeakMap().set(7481808,"v");return 0;}catch(e){return 1;}})()',
  'spec_spec_object_keys_distinct': '(function(){var m=new Map();var o={};m.set(o,"a");return m.get(o)==="a"&&m.size===1?1:0;})()',
  'arr_includes_cross_rep': '(function(){var a=[7481808];return a.includes(7481808/1)&&a.indexOf(7481808/1)===0?1:0;})()',
};

void main(List<String> args) {
  final lib = QuickjsFfi.libraryPath;
  stderr.writeln('PROBE_LIB $lib');
  final rt = QuickjsRuntime();
  var fails = 0;
  kCases.forEach((name, code) {
    final r = rt.eval(code);
    // numeric probes expect 0 (misses); boolean probes expect true
    final expectsZero = name.startsWith('fbx_') || name.startsWith('stress_');
    final t = (r ?? '').trim();
    final bool ok;
    if (expectsZero) {
      final v = int.tryParse(t.replaceAll('"', ''));
      ok = v == 0;
    } else {
      ok = t == 'true' || t == '"true"' || t == '1';
    }
    if (!ok) fails++;
    stdout.writeln('PROBE $name ${ok ? 'PASS' : 'FAIL'} got=${r ?? '<exception>'}');
  });
  stdout.writeln('PROBE_SUMMARY ${kCases.length - fails}/${kCases.length} PASS');
  exit(fails == 0 ? 0 : 1);
}
