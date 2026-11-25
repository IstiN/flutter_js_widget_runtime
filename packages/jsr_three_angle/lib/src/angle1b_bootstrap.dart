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
if (typeof globalThis !== 'undefined' && typeof api !== 'undefined') {
  globalThis.__jsrAngle1bFacade = api;
}
${shimGlueJs}
''';
  }

  /// The canvas/document shim and the `__jsr1b_gl` bridge. The G1 packer
  /// calls `__jsr1b_gl(bytes)` synchronously and expects the int64 dispatch
  /// result; the wire crosses as the zero-copy `__jsr1b_dispatch` byte lane
  /// plus the parked-result readback `__jsr1b_rc()` (registered by the
  /// QuickJS backend for selected engines).
  static const String shimGlueJs = '''
(function () {
  'use strict';
  var root = typeof globalThis !== 'undefined' ? globalThis : this;
  root.__jsr1b_gl = function (bytes) {
    root.__jsr1b_dispatch(bytes);
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
