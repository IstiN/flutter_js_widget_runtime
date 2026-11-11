import 'dart:convert';
import 'dart:ffi';
import 'dart:typed_data';
import 'dart:io';
import 'package:ffi/ffi.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

class Shim {
  final DynamicLibrary lib = DynamicLibrary.open('native/angle/libangle_1b.dylib');
  late final int Function() init = lib.lookupFunction<Int32 Function(), int Function()>('a1b_init');
  late final int Function(int, int, Pointer<Uint32>) createSurface = lib.lookupFunction<Int64 Function(Int32, Int32, Pointer<Uint32>), int Function(int, int, Pointer<Uint32>)>('a1b_create_surface');
  late final int Function(int) makeCurrent = lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_make_current');
  late final int Function(Pointer<Uint8>, int) dispatch = lib.lookupFunction<Int64 Function(Pointer<Uint8>, Int32), int Function(Pointer<Uint8>, int)>('a1b_gl_dispatch');
  late final int Function(Pointer<Uint8>, int) result = lib.lookupFunction<Int32 Function(Pointer<Uint8>, Int32), int Function(Pointer<Uint8>, int)>('a1b_gl_result');
  late final void Function(int) destroySurface = lib.lookupFunction<Void Function(Int64), void Function(int)>('a1b_destroy_surface');
  late final void Function() shutdown = lib.lookupFunction<Void Function(), void Function()>('a1b_shutdown');
}

void main() {
  final shim = Shim();
  shim.init();
  final ios = calloc<Uint32>();
  final surface = shim.createSurface(320, 240, ios);
  shim.makeCurrent(surface);
  final rt = QuickjsRuntime();
  var lastRc = 0;
  rt.registerHostBytesFn('__jsr1b_gl_bytes', (name, data) {
    final buf = calloc<Uint8>(data.length);
    buf.asTypedList(data.length).setAll(0, data);
    lastRc = shim.dispatch(buf, data.length).toInt();
    calloc.free(buf);
  });
  rt.registerHostFunction('__jsr1b_gl_rc', (_) => '$lastRc');
  rt.registerHostFunction('__jsr1b_result_host', (_) {
    final len = shim.result(nullptr.cast(), 0);
    if (len <= 0) return jsonEncode('');
    final n = len > 262144 ? 262144 : len;
    final buf = calloc<Uint8>(n);
    final actual = shim.result(buf, n);
    final out = actual <= 0 ? '' : base64Encode(Uint8List.fromList(buf.asTypedList(actual > n ? n : actual).toList()));
    calloc.free(buf);
    return jsonEncode(out);
  });
  final err = <String?>[];
  final prelude = '''
  globalThis.__jsr1b_gl = function (bytes) { __jsr1b_gl_bytes('g1', bytes); return __jsr1b_gl_rc(); };
  globalThis.__jsr1b_result = function () { return __jsr1b_result_host(); };
  globalThis.atob = function (b64) {
    var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var str = String(b64).split('=')[0], out = '';
    for (var i = 0; i < str.length; i += 4) {
      var c0 = B64.indexOf(str[i]), c1 = B64.indexOf(str[i+1]);
      var c2 = i+2 < str.length ? B64.indexOf(str[i+2]) : 0;
      var c3 = i+3 < str.length ? B64.indexOf(str[i+3]) : 0;
      var n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
      out += String.fromCharCode((n >> 16) & 255);
      if (i+2 < str.length) out += String.fromCharCode((n >> 8) & 255);
      if (i+3 < str.length) out += String.fromCharCode(n & 255);
    }
    return out;
  };
  ''';
  rt.eval(prelude, filename: 'prelude.js', errMsg: err);
  rt.eval(File('tool/three/gen/g1_packer.js').readAsStringSync(), filename: 'packer.js', errMsg: err);
  rt.eval(File('tool/three/src/webgl2_facade.js').readAsStringSync(), filename: 'facade.js', errMsg: err);
  final r = rt.eval('''
  (function(){
    var g = globalThis;
    var cv = { width: 320, height: 240 };
    var gl = g.AngleWebGL2Facade.createFacade(cv, {});
    var names = ['EXT_texture_filter_anisotropic','EXT_texture_norm16','WEBGL_compressed_texture_s3tc','ANGLE_instanced_arrays','EXT_blend_minmax','EXT_depth_clamp','EXT_discard_framebuffer','OES_texture_npot','GL_OES_element_index_uint','OES_element_index_uint','EXT_sRGB','EXT_texture_storage','EXT_map_buffer_range','EXT_debug_marker','ANGLE_depth_texture','EXT_shader_texture_lod','OES_texture_float','OES_texture_half_float','OES_standard_derivatives','EXT_texture_rg','EXT_texture_type_2_10_10_10_REV','EXT_separate_shader_objects','EXT_shader_framebuffer_fetch','APPLE_framebuffer_multisample','EXT_multisampled_render_to_texture','OES_surfaceless_context','EGLImageOES','OES_EGL_image'];
    var extC = {};
    names.forEach(function (n) { extC[n] = g1.getExtension(n) | 0; });
    var ext = gl.getExtension('EXT_texture_filter_anisotropy');
    var maxA = 0;
    if (ext) maxA = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    var line = gl.getParameter(0x846E /* ALIASED_LINE_WIDTH_RANGE */);
    var sup = null; try { sup = gl.getSupportedExtensions(); } catch (e) { sup = 'THROW '+e; }
    gl.getError(); gl.getError();
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, 0x84FF /*TEXTURE_MAX_ANISOTROPY_EXT*/, 16);
    var errTex = gl.getError();
    gl.texParameterf(gl.TEXTURE_2D, 0x84FF, 8.0);
    var errTexF = gl.getError();
    var anisoVal = gl.getParameter(0x84FF);
    var sam = gl.createSampler();
    gl.samplerParameteri(sam, 0x84FF, 16);
    var errSam = gl.getError();
    var samAniso = gl.getSamplerParameter(sam, 0x84FF);
    return JSON.stringify({ extC: extC, ext: ext ? 'present' : 'null', maxAnisoQuery: maxA, anisoParamVal: anisoVal,
      errTexPi: '0x'+errTex.toString(16), errTexPf: '0x'+errTexF.toString(16),
      errSam: '0x'+errSam.toString(16), samAniso: samAniso,
      lineWidthRange: line, sup: sup, err: gl.getError() });
  })()
  ''', filename: 'probe.js', errMsg: err);
  print('RESULT: $r');
  if (err.isNotEmpty) print('ERR: $err');
  rt.close();
  shim.destroySurface(surface);
  shim.shutdown();
}
