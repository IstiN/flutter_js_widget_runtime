// fixture-rawgl — E2E-EXAMPLES raw-GL fixture (AC2): NO three.js — raw
// WebGL2 calls against the canvas the harness shims hand out. Both corpus
// legs evaluate this byte-identical scene: 1B (facade -> G1 -> ANGLE) and
// the web reference (real Chrome WebGL2). Tier gate: E2E-EXAMPLES-RAWGL.
//
// Scene driver shape (same contract as bundle_corpus_scene.mjs output):
// globalThis.__result published synchronously; the harness drains async
// work, drives __corpusTick(ticks), then reads back the frame.
globalThis.__result = (function () {
  try {
    globalThis.__corpusBegin();
    globalThis.__corpusHookThree();
    var canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 240;
    var gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false });
    if (!gl) return { ok: false, error: 'no webgl2 context', ticks: 1 };
    var vs = '#version 300 es\n' +
      'out vec3 vColor;\n' +
      'void main() {\n' +
      '  vec2 p = vec2(float((gl_VertexID << 1) & 2) - 1.0, float(gl_VertexID & 2) - 1.0);\n' +
      '  gl_Position = vec4(p, 0.0, 1.0);\n' +
      '  vColor = vec3(gl_VertexID == 1 ? 1.0 : 0.05, gl_VertexID == 2 ? 1.0 : 0.1, gl_VertexID == 0 ? 0.15 : 0.2);\n' +
      '}';
    var fs2 = '#version 300 es\n' +
      'precision highp float;\n' +
      'in vec3 vColor;\n' +
      'out vec4 outColor;\n' +
      'void main() { outColor = vec4(vColor, 1.0); }';
    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        return { error: 'shader: ' + gl.getShaderInfoLog(s) };
      }
      return s;
    }
    var v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs2);
    if (v && v.error) return { ok: false, error: v.error, ticks: 1 };
    if (f && f.error) return { ok: false, error: f.error, ticks: 1 };
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      return { ok: false, error: 'link: ' + gl.getProgramInfoLog(p), ticks: 1 };
    }
    gl.useProgram(p);
    gl.viewport(0, 0, 320, 240);
    gl.clearColor(0.05, 0.1, 0.15, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Attribute-less draw: geometry comes from gl_VertexID (ES3), so this
    // exercises raw program/shader/draw state with zero buffer traffic.
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    var err = gl.getError();
    if (err !== gl.NO_ERROR) return { ok: false, error: 'gl error 0x' + err.toString(16), ticks: 1 };
    return { ok: true, ticks: 1 };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e), ticks: 1 };
  }
})();
