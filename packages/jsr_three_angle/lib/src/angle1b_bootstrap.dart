import 'dart:convert';

import 'package:flutter/services.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Composes the 1B facade bootstrap JS (ADR-0003 decision 4): the generated
/// G1 packer, the WebGL2 facade (exposed as
/// `globalThis.__jsrAngle1bFacade`), the canvas/document shim that routes
/// `getContext('webgl2')` to the facade, and the `__jsr1b_gl` bridge over
/// the zero-copy dispatch lane.
///
/// Evaluated by the engine wrapper after the THREE web bundle and before
/// the shader policy glue and the host bootstrap / widget code.
final class Angle1bBootstrap {
  Angle1bBootstrap._();

  static const String _packerAsset =
      'packages/jsr_three_angle/facade/g1_packer.js';
  static const String _facadeAsset =
      'packages/jsr_three_angle/facade/webgl2_facade.js';

  static String? _cached;

  /// Cached composition (asset loads are immutable for the process).
  static String loadSync() => _cached ??= _composeSyncGuarded();

  static String _composeSyncGuarded() {
    // facadeBootstrapJs is a sync interface member; the assets load once at
    // startup through a blocking rootBundle read is not available — hosts
    // and tests call [preload] first; loadSync throws a named error when
    // the bootstrap was not preloaded.
    if (_packer == null || _facade == null) {
      throw const JsThreeUnsupportedException(
        'angle1b.facade',
        'call jsr_three_angle preloadAngle1bBootstrap() before starting an '
            'angle1b engine (or use createAngleThreeHost with a host bootstrap '
            'that preloads)',
      );
    }
    return compose(packer: _packer!, facade: _facade!);
  }

  static String? _packer;
  static String? _facade;

  /// Loads the two facade assets once before engines start. The engine
  /// wrapper calls this when angle1b is selected (awaited in
  /// `_effectiveBootstrap`), so `loadSync` always finds them.
  static Future<void> preload([AssetBundle? bundle]) async {
    _packer ??= await _loadAsset(_packerAsset, bundle);
    _facade ??= await _loadAsset(_facadeAsset, bundle);
  }

  /// Test/override seam: supply the two sources directly.
  static void preloadSources({required String packer, required String facade}) {
    _packer = packer;
    _facade = facade;
  }

  static Future<String> _loadAsset(String key, AssetBundle? bundle) async {
    final resolved = bundle ?? rootBundle;
    try {
      return await resolved.loadString(key);
    } catch (_) {
      // Tests/apps running from the package itself index its own assets
      // without the `packages/<name>/` prefix.
      return resolved.loadString(
        key.replaceFirst('packages/jsr_three_angle/', ''),
      );
    }
  }

  /// Pure composition (unit-tested): packer + facade + export + shim glue.
  static String compose({required String packer, required String facade}) {
    final packerSource = packer;
    final facadeSource = facade;
    return '''
$packerSource
$facadeSource
// The facade IIFE publishes the api object as the global AngleWebGL2Facade
// (`api` itself stays closure-scoped); the shim glue resolves the context
// factory through __jsrAngle1bFacade, so alias it here.
if (typeof globalThis !== 'undefined' && typeof globalThis.AngleWebGL2Facade !== 'undefined') {
  globalThis.__jsrAngle1bFacade = globalThis.AngleWebGL2Facade;
}
${shimGlueJs}
''';
  }

  /// The canvas/document shim and the `__jsr1b_gl` bridge. The G1 packer
  /// calls `__jsr1b_gl(bytes)` synchronously and expects the int64 dispatch
  /// result; the wire crosses as the zero-copy `__jsr1b_dispatch` byte lane
  /// (name, bytes — the runtime bytes-lane calling convention) plus the
  /// parked-result readback `__jsr1b_rc()` (registered by the QuickJS backend
  /// for selected engines).
  static const String shimGlueJs = '''
(function () {
  'use strict';
  var root = typeof globalThis !== 'undefined' ? globalThis : this;
  // The real WebGL2 bundle probes browser globals at boot (the harnesses
  // provide the same minimal set); fill only what is genuinely missing so
  // the production web worker path keeps its own globals.
  if (typeof root.self === 'undefined') root.self = root;
  if (typeof root.window === 'undefined') root.window = root;
  if (typeof root.navigator === 'undefined') {
    root.navigator = { userAgent: 'JSR-1B QuickJS', maxTouchPoints: 0 };
  }
  if (typeof root.devicePixelRatio === 'undefined') root.devicePixelRatio = 1;
  if (typeof root.innerWidth === 'undefined') root.innerWidth = 300;
  if (typeof root.innerHeight === 'undefined') root.innerHeight = 150;
  if (typeof root.addEventListener === 'undefined') root.addEventListener = function () {};
  if (typeof root.removeEventListener === 'undefined') root.removeEventListener = function () {};
  if (typeof root.matchMedia === 'undefined') {
    root.matchMedia = function () {
      return { matches: false, addEventListener: function () {}, removeEventListener: function () {} };
    };
  }
  // QuickJS and bare JSC ship no atob; the facade's scratch lane
  // (base64ToBytes) decodes every data-returning result through it. The
  // bench prelude defines the same minimal decoder; hosts with a real atob
  // keep theirs.
  if (typeof root.atob === 'undefined') {
    var B64 = '';
    for (var ci = 65; ci <= 90; ci++) B64 += String.fromCharCode(ci);
    for (var ci = 97; ci <= 122; ci++) B64 += String.fromCharCode(ci);
    for (var ci = 48; ci <= 57; ci++) B64 += String.fromCharCode(ci);
    B64 += '+/';
    root.atob = function (input) {
      var str = String(input).replace(/=+\$/, '');
      var out = '';
      for (var i = 0; i < str.length; i += 4) {
        var c0 = B64.indexOf(str[i]);
        var c1 = B64.indexOf(str[i + 1]);
        var c2 = i + 2 < str.length ? B64.indexOf(str[i + 2]) : 0;
        var c3 = i + 3 < str.length ? B64.indexOf(str[i + 3]) : 0;
        var n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
        out += String.fromCharCode((n >> 16) & 255);
        if (i + 2 < str.length) out += String.fromCharCode((n >> 8) & 255);
        if (i + 3 < str.length) out += String.fromCharCode(n & 255);
      }
      return out;
    };
  }
  root.__jsr1b_gl = function (bytes) {
    root.__jsr1b_dispatch('1b', bytes);
    return root.__jsr1b_rc();
  };
  function shimCanvas() {
    var listeners = {};
    var canvas = {
      tagName: 'CANVAS', style: {}, width: 300, height: 150,
      addEventListener: function (t, fn) {
        (listeners[t] = listeners[t] || []).push(fn);
      },
      removeEventListener: function (t, fn) {
        var l = listeners[t];
        if (!l) return;
        var i = l.indexOf(fn);
        if (i >= 0) l.splice(i, 1);
      },
      dispatchEvent: function (e) {
        var l = listeners[e && e.type];
        if (l) for (var i = 0; i < l.length; i++) l[i].call(canvas, e);
        return true;
      },
      setAttribute: function (k, v) { canvas[k] = v; },
      getAttribute: function (k) { return canvas[k]; },
      removeAttribute: function (k) { delete canvas[k]; },
      focus: function () {},
      getBoundingClientRect: function () {
        return { left: 0, top: 0, width: canvas.width, height: canvas.height,
          right: canvas.width, bottom: canvas.height };
      },
      ownerDocument: null
    };
    canvas.getContext = function (type, attrs) {
      if (type !== 'webgl2' && type !== 'webgl') return null;
      if (!root.__jsrAngle1bFacade) {
        throw new Error('webgl.facade: ANGLE 1B facade not loaded');
      }
      return root.__jsrAngle1bFacade.createFacade(canvas, attrs);
    };
    return canvas;
  }
  if (typeof document === 'undefined') {
    var doc = {
      createElement: function (tag) {
        if (String(tag).toLowerCase() !== 'canvas') {
          throw new Error(
            'three.unsupported: the 1B host supports canvas elements only, ' +
            'got ' + tag);
        }
        return shimCanvas();
      },
      createElementNS: function (ns, tag) { return doc.createElement(tag); },
      addEventListener: function () {},
      removeEventListener: function () {},
      body: { appendChild: function () {}, removeChild: function () {}, style: {} },
      documentElement: { style: {} },
      hidden: false,
      visibilityState: 'visible',
      activeElement: null
    };
    root.document = doc;
  }
  // Engine hosts (QuickJS/bare JSC — no OffscreenCanvas) cannot run the
  // ImageBitmap present lane; on native 1B the ANGLE IOSurface IS the
  // presentation target, so JS-side present is a frame-already-presented
  // no-op. Browser workers keep their own transferToImageBitmap path.
  if (typeof root.OffscreenCanvas === 'undefined' &&
      typeof root.jsr !== 'undefined' && root.jsr.three &&
      typeof root.jsr.three.setPresentHook === 'function') {
    root.jsr.three.setPresentHook(function () { return true; });
  }
})();
''';
}

/// Loads the 1B facade assets before engines start. Hosts that select 1B
/// call this once during startup (the engine wrapper awaits it through the
/// wire; tests preload sources directly).
Future<void> preloadAngle1bBootstrap() => Angle1bBootstrap.preload();

/// Base64 helper kept beside the bootstrap for tests that verify the
/// `__jsr1b_result` lane shape without a live QuickJS runtime.
String angle1bBase64(Uint8List bytes) => base64Encode(bytes);
