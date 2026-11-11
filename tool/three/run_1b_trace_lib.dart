// run_1b_trace_lib.dart — part of run_1b_trace: trace container, ESM
// stripping, the trace-mode GL stub (int64 rc + scratch payload), G1 table
// loading and the a1b_gl_result FFI scratch lane.
part of 'run_1b_trace.dart';

const kRoot = '.';
const kTablePath = 'tool/three/webgl2_g1_methods.json';
const kPackerPath = 'tool/three/gen/g1_packer.js';
const kCorePath = 'example/web/three.core.js';
const kModulePath = 'example/web/jsr_three_web.js';
const kFacadePath = 'tool/three/src/webgl2_facade.js';
const kTraceOut = '/tmp/g1_trace.json';

// Canned scalar answers for the trace stub, keyed by GL pname.
const kScalarParams = <int, int>{
  0x0D33: 16384,
  0x851C: 16384,
  0x8073: 2048,
  0x88FF: 256,
  0x8B4C: 16,
  0x8872: 16,
  0x8B4D: 32,
  0x8869: 16,
  0x8DFB: 256,
  0x8DFC: 31,
  0x8DFD: 256,
  0x8A2F: 24,
  0x8D57: 4,
  0x80A9: 4,
  0x0D50: 4,
  0x84E8: 16384,
  0x8824: 8,
  0x8CDF: 8,
  0x86A2: 0,
  0x8B9A: 0x1908,
  0x8B9B: 0x1401,
  0x0D3A: 32767,
  0x9247: 0,
};

// GL pname groups for the getParameter stub.
const kStrParams = {0x1F00, 0x1F01, 0x1F02, 0x8B8C, 0x9245, 0x9246};
const kIntVecParams = {0x0BA2, 0x0C10, 0x0D3A};
const kFloatVecParams = {0x0B70, 0x0B12, 0x846D, 0x846E, 0x8005, 0x0C22};

String _nameOf(Map<int, String> opNames, int op) => opNames[op] ?? 'op_$op';

class Trace {
  final List<int> ops = [];
  final List<int> lengths = [];
  var totalBytes = 0;
  final histogram = SplayTreeMap<int, int>();

  void add(int op, int len) {
    ops.add(op);
    lengths.add(len);
    totalBytes += len;
    histogram[op] = (histogram[op] ?? 0) + 1;
  }

  Map<String, Object> toJson(Map<int, String> opNames) => {
    'totalCommands': ops.length,
    'totalBytes': totalBytes,
    'histogram': [
      for (final e
          in histogram.entries.toList()
            ..sort((a, b) => b.value.compareTo(a.value)))
        {'opcode': e.key, 'name': _nameOf(opNames, e.key), 'count': e.value},
    ],
    'sequence': [
      for (var i = 0; i < ops.length; i++)
        {
          'opcode': ops[i],
          'name': _nameOf(opNames, ops[i]),
          'bytes': lengths[i],
        },
    ],
  };
}

// ---------------------------------------------------------------------------
// ESM transform: three.core.js and jsr_three_web.js are two ES modules that
// declare colliding top-level `const` names (e.g. `_m1$1`), so a plain
// concat breaks. Deterministic textual transform: each file is wrapped in
// its own IIFE scope; the module's `import { ... } from './three.core.js'`
// list becomes a destructuring bridge off `globalThis.__threeCore`, and the
// module's own `export { ... };` list becomes `globalThis.THREE = {...}`.
// Verified shapes (r186 pin): core has exactly one `export {...};` line and
// no imports; the module has exactly one import line + one re-export
// (`export {...} from './three.core.js';`) + one final `export {...};`.
List<String> _braceList(String line, String open, String close) {
  final a = line.indexOf(open) + open.length;
  final b = line.lastIndexOf(close);
  if (a <= 0 || b < a)
    throw StateError('ESM list parse failed: ${line.substring(0, 60)}');
  return line
      .substring(a, b)
      .split(',')
      .map((s) => s.trim())
      .where((s) => s.isNotEmpty)
      .toList();
}

String _dropLines(String src, String tag) {
  final out = <String>[];
  var stripped = 0;
  for (final line in src.split('\n')) {
    final t = line.trimLeft();
    if (t.startsWith('import ') || t.startsWith('export {')) {
      stripped++;
      continue;
    }
    out.add(line);
  }
  stderr.writeln('[esm] $tag: stripped $stripped lines');
  return out.join('\n');
}

String wrapThreeCore(String core) {
  final exportLine = core
      .split('\n')
      .firstWhere(
        (l) => l.trimLeft().startsWith('export {'),
        orElse: () => throw StateError('three.core.js: no export line'),
      );
  final exports = _braceList(exportLine, 'export {', '};');
  return '(function () {\n${_dropLines(core, 'three.core.js')}\n'
      'globalThis.__threeCore = { ${exports.join(', ')} };\n})();';
}

String wrapThreeModule(String module) {
  final lines = module.split('\n');
  final importLine = lines.firstWhere(
    (l) => l.trimLeft().startsWith('import {'),
    orElse: () => throw StateError('jsr_three_web.js: no import line'),
  );
  final importNames = _braceList(importLine, 'import {', '} from');
  final exportLines = lines
      .where((l) => l.trimLeft().startsWith('export {'))
      .toList();
  final reExportLines = exportLines.where((l) => l.contains('} from')).toList();
  if (reExportLines.length != 1 || exportLines.length != 2) {
    throw StateError(
      'jsr_three_web.js: expected 1 re-export + 1 export, '
      'got ${exportLines.length} export lines',
    );
  }
  // Re-exported core names have NO local binding in the module scope, so
  // THREE must pull them from __threeCore explicitly.
  final reExportNames = _braceList(reExportLines.first, 'export {', '} from');
  final exportNames = _braceList(exportLines.last, 'export {', '};');
  final coreBridge = reExportNames
      .map((n) => '$n: __threeCore["$n"]')
      .join(', ');
  return '(function () {\nconst { ${importNames.join(', ')} } = globalThis.__threeCore;\n'
      '${_dropLines(module, 'jsr_three_web.js')}\n'
      'globalThis.THREE = Object.assign({ $coreBridge }, '
      '{ ${exportNames.join(', ')} });\n})();';
}

// ---------------------------------------------------------------------------
// Trace-mode GL stub: computes the int64 a real decoder would return and the
// scratch payload for data-returning commands. Deterministic.
class GlStub {
  final Map<int, String> opNames;
  var lastRc = 0;
  Uint8List lastPayload = Uint8List(0);
  String lastName = '';
  var nameCounter = 0;

  GlStub(this.opNames);

  int _argU32(Uint8List b, int i) => (b.length >= 4 + (i + 1) * 4)
      ? ByteData.sublistView(b).getUint32(4 + i * 4, Endian.little)
      : 0;

  String _argStr(Uint8List b, int i) {
    final len = _argU32(b, i);
    final off = 4 + (i + 1) * 4;
    if (off + len > b.length || len > 4096) return '';
    return utf8.decode(b.sublist(off, off + len), allowMalformed: true);
  }

  Uint8List _packActive(String name, int size, int type) {
    final nb = utf8.encode(name);
    final out = BytesCopy();
    out.u32(nb.length);
    out.bytes(nb);
    out.i32(size);
    out.u32(type);
    return out.take();
  }

  void compute(int op, Uint8List buf) {
    lastRc = 0;
    lastPayload = Uint8List(0);
    final name = opNames[op] ?? '';
    lastName = name;
    final p0 = _argU32(buf, 0), p1 = _argU32(buf, 1);
    switch (name) {
      case 'getError':
        lastRc = 0;
        break;
      case 'checkFramebufferStatus':
        lastRc = 0x8CD5; // FRAMEBUFFER_COMPLETE
        break;
      case 'isContextLost':
        lastRc = 0;
        break;
      case 'createBuffer':
      case 'createFramebuffer':
      case 'createProgram':
      case 'createQuery':
      case 'createRenderbuffer':
      case 'createSampler':
      case 'createShader':
      case 'createTexture':
      case 'createTransformFeedback':
      case 'createVertexArray':
      case 'fenceSync':
        lastRc = ++nameCounter; // deterministic pseudo GL name
        break;
      case 'isBuffer':
      case 'isFramebuffer':
      case 'isProgram':
      case 'isQuery':
      case 'isRenderbuffer':
      case 'isSampler':
      case 'isShader':
      case 'isSync':
      case 'isTexture':
      case 'isTransformFeedback':
      case 'isVertexArray':
      case 'isEnabled':
        lastRc = 1;
        break;
      case 'getShaderParameter':
        lastRc = p1 == 0x8B80 ? 0 : 1; // DELETE_STATUS -> false, rest true
        break;
      case 'getProgramParameter':
        if (p1 == 0x8B80) {
          lastRc = 0;
        } else if (p1 == 0x8B86) {
          lastRc = 8; // ACTIVE_UNIFORMS
        } else if (p1 == 0x8B89) {
          lastRc = 3; // ACTIVE_ATTRIBUTES
        } else {
          lastRc = 1; // LINK_STATUS, COMPLETION_STATUS_KHR, ...
        }
        break;
      case 'getUniformLocation':
        lastRc = 1;
        break;
      case 'getAttribLocation':
        const known = {'position': 0, 'normal': 1, 'uv': 2};
        final nm = _argStr(buf, 1);
        lastRc = known[nm] ?? (3 + nm.length % 8);
        break;
      case 'getFragDataLocation':
        lastRc = 0;
        break;
      case 'getActiveUniform':
        const names = [
          'modelMatrix',
          'modelViewMatrix',
          'projectionMatrix',
          'normalMatrix',
          'viewMatrix',
          'cameraPosition',
          'isOrthographic',
          'logDepthBufFC',
        ];
        const types = [
          0x8B5C, // FLOAT_MAT4 modelMatrix
          0x8B5C, // FLOAT_MAT4 modelViewMatrix
          0x8B5C, // FLOAT_MAT4 projectionMatrix
          0x8B5B, // FLOAT_MAT3 normalMatrix
          0x8B5C, // FLOAT_MAT4 viewMatrix
          0x8B52, // FLOAT_VEC3 cameraPosition
          0x8B56, // FLOAT isOrthographic
          0x1406, // FLOAT logDepthBufFC
        ];
        final i = p1 < 8 ? p1 : 7;
        lastPayload = _packActive(names[i], 1, types[i]);
        break;
      case 'getActiveAttrib':
        const names = ['position', 'normal', 'uv'];
        const types = [0x8B52, 0x8B52, 0x8B50];
        final i = p1 < 3 ? p1 : 2;
        lastPayload = _packActive(names[i], 1, types[i]);
        break;
      case 'getShaderInfoLog':
      case 'getProgramInfoLog':
      case 'getShaderSource':
      case 'getActiveUniformBlockName':
        lastPayload = Uint8List(0); // empty = success / no log
        break;
      case 'getShaderPrecisionFormat':
        final b = BytesCopy()
          ..i32(127)
          ..i32(127)
          ..i32(23);
        lastPayload = b.take();
        break;
      case 'getParameter':
        if (kStrParams.contains(p0)) {
          const strings = {
            0x1F00: 'JSR',
            0x1F01: 'ANGLE 1B G1 (Metal)',
            0x1F02: 'WebGL 2.0 (ANGLE 1B G1 trace)',
            0x8B8C: 'WebGL GLSL ES 3.00 (ANGLE 1B)',
            0x9245: 'Apple',
            0x9246: 'ANGLE Metal (1B trace stub)',
          };
          lastPayload = Uint8List.fromList(utf8.encode(strings[p0]!));
        } else if (kIntVecParams.contains(p0)) {
          final b = BytesCopy();
          for (var i = 0; i < (p0 == 0x0D3A ? 2 : 4); i++) b.i32(0);
          lastPayload = b.take();
        } else if (kFloatVecParams.contains(p0)) {
          final b = BytesCopy();
          for (var i = 0; i < 4; i++) b.f32(p0 == 0x0B70 ? i.toDouble() : 1.0);
          lastPayload = b.take();
        } else if (p0 == 0x86A3) {
          lastPayload = Uint8List(0); // COMPRESSED_TEXTURE_FORMATS: none
        } else {
          lastRc = kScalarParams[p0] ?? 1;
        }
        break;
      case 'getSyncParameter':
        lastRc = p1 == 0x9114 ? 0x911A : 0; // SYNC_STATUS -> ALREADY_SIGNALED
        break;
      case 'getQueryParameter':
        lastRc = 1; // QUERY_RESULT_AVAILABLE / boolean pnames
        break;
      case 'clientWaitSync':
        lastRc = 0x911C; // CONDITION_SATISFIED
        break;
      case 'getUniformBlockIndex':
        lastRc = 0;
        break;
      case 'getExtension':
        lastRc = 1;
        break;
      case 'readPixels':
        final w = _argU32(buf, 2), h = _argU32(buf, 3);
        lastPayload = Uint8List(w * h * 4); // zeroed RGBA8
        break;
      default:
        lastRc = 0;
    }
  }
}

class BytesCopy {
  final _b = BytesBuilder();
  void u32(int v) {
    final d = ByteData(4)..setUint32(0, v, Endian.little);
    _b.add(d.buffer.asUint8List());
  }

  void i32(int v) {
    final d = ByteData(4)..setInt32(0, v, Endian.little);
    _b.add(d.buffer.asUint8List());
  }

  void f32(double v) {
    final d = ByteData(4)..setFloat32(0, v, Endian.little);
    _b.add(d.buffer.asUint8List());
  }

  void bytes(List<int> v) => _b.add(v);
  Uint8List take() => _b.takeBytes();
}
