// fixture-readback — E2E-EXAMPLES capture/readback fixture (AC6): renders an
// asymmetric quadrant pattern, reads it back with IN-SCENE gl.readPixels
// (the synchronous scratch lane on 1B), then draws the read values back into
// the frame. The final frame therefore shows the readback data as pixels —
// if the 1B readPixels path returned anything different from real Chrome
// WebGL2, the tier comparison fails. Tier gate: E2E-EXAMPLES-READBACK.
globalThis.__result = (function () {
  try {
    globalThis.__corpusBegin();
    globalThis.__corpusHookThree();
    var canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 240;
    var gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false });
    if (!gl) return { ok: false, error: 'no webgl2 context', ticks: 1 };
    gl.viewport(0, 0, 320, 240);
    // Pass 1: four distinct quadrants (scissor + clear, deterministic).
    var quads = [
      [0.65, 0.05, 0.20], [0.05, 0.65, 0.20],
      [0.20, 0.20, 0.80], [0.80, 0.80, 0.05],
    ];
    gl.enable(gl.SCISSOR_TEST);
    for (var i = 0; i < 4; i++) {
      gl.scissor(i & 1 ? 160 : 0, i & 2 ? 120 : 0, 160, 120);
      gl.clearColor(quads[i][0], quads[i][1], quads[i][2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.disable(gl.SCISSOR_TEST);
    // Pass 2: sample the quadrant centers through the documented readback
    // path and normalize to [0,1] floats.
    var samples = [[80, 60], [240, 60], [80, 180], [240, 180]];
    var u = new Float32Array(12);
    for (var s = 0; s < 4; s++) {
      var px = new Uint8Array(4);
      gl.readPixels(samples[s][0], samples[s][1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      u[s * 3] = px[0] / 255.0; u[s * 3 + 1] = px[1] / 255.0; u[s * 3 + 2] = px[2] / 255.0;
    }
    // Pass 3: full-screen quad writing the readback values back, colored by
    // quadrant. gl_FragCoord -> quadrant -> uColors[sample].
    var vs = '#version 300 es\n' +
      'void main() {\n' +
      '  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));\n' +
      '  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);\n' +
      '}';
    var fs2 = '#version 300 es\n' +
      'precision highp float;\n' +
      'uniform vec3 uColors[4];\n' +
      'out vec4 outColor;\n' +
      'void main() {\n' +
      '  ivec2 q = ivec2(gl_FragCoord.x >= 160.0 ? 1 : 0, gl_FragCoord.y >= 120.0 ? 1 : 0);\n' +
      '  outColor = vec4(uColors[q.y * 2 + q.x], 1.0);\n' +
      '}';
    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        return { error: 'shader: ' + gl.getShaderInfoLog(sh) };
      }
      return sh;
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
    gl.uniform3fv(gl.getUniformLocation(p, 'uColors'), u);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    var err = gl.getError();
    if (err !== gl.NO_ERROR) return { ok: false, error: 'gl error 0x' + err.toString(16), ticks: 1 };
    return { ok: true, ticks: 1 };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e), ticks: 1 };
  }
})();
