// Syntax-preserving, non-evaluating TSL expression objects. The native base
// materials deliberately ignore their *Node properties; no WebGPU shader or
// second THREE core is bundled. Fn does not invoke its callback, which keeps
// graph construction bounded and avoids pretending to compile arbitrary GLSL.
const cache = new WeakMap();
function expression() {
  const target = function() { return proxy; };
  const proxy = new Proxy(target, {
    get(_target, property) {
      if (property === 'isNode') return true;
      if (property === Symbol.toPrimitive) return () => 0;
      if (property === 'toString') return () => '[bounded TSL expression]';
      if (!cache.has(target)) cache.set(target, new Map());
      const values = cache.get(target);
      if (!values.has(property)) values.set(property, expression());
      return values.get(property);
    },
    set() { return true; },
    apply() { return expression(); }
  });
  return proxy;
}

export const positionLocal = expression();
export const positionWorld = expression();
export const normalLocal = expression();
export const normalWorld = expression();
export const time = expression();
export const deltaTime = expression();
export const instanceIndex = expression();
export const vertexIndex = expression();

export const Fn = () => () => expression();
export const color = expression;
export const float = expression;
export const int = expression;
export const uint = expression;
export const bool = expression;
export const vec2 = expression;
export const vec3 = expression;
export const vec4 = expression;
export const mat3 = expression;
export const mat4 = expression;
export const sin = expression;
export const cos = expression;
export const abs = expression;
export const add = expression;
export const sub = expression;
export const mul = expression;
export const div = expression;
export const mix = expression;
export const clamp = expression;
export const saturate = expression;
export const texture = expression;
export const cubeTexture = expression;
export const reference = expression;
export const context = expression;
export const fog = expression;
export const rangeFogFactor = expression;
export const densityFogFactor = expression;
export const workingToColorSpace = expression;
export const mx_fractal_noise_float = expression;
export const mx_fractal_noise_vec3 = expression;
