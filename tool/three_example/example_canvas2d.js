const MAX_DIMENSION = 4096;
const MAX_PIXELS = 16777216;
const MAX_PATH_COMMANDS = 1024;

function dimension(value) {
  if (!Number.isFinite(value) || value < 0 || value > MAX_DIMENSION) {
    throw new Error('three.invalid: example canvas dimensions are outside 0..4096');
  }
  return Math.floor(value);
}

function rgba(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();
  if (text === 'black') return [0, 0, 0, 255];
  if (text === 'white') return [255, 255, 255, 255];
  if (text === 'transparent') return [0, 0, 0, 0];
  if (/^#[0-9a-f]{6}$/.test(text)) {
    return [
      parseInt(text.slice(1, 3), 16), parseInt(text.slice(3, 5), 16),
      parseInt(text.slice(5, 7), 16), 255
    ];
  }
  if (/^#[0-9a-f]{3}$/.test(text)) {
    return [
      parseInt(text[1] + text[1], 16), parseInt(text[2] + text[2], 16),
      parseInt(text[3] + text[3], 16), 255
    ];
  }
  const match = /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/.exec(text);
  if (!match) return null;
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  const values = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (values.some(channel => channel > 255) || !(alpha >= 0 && alpha <= 1)) return null;
  return [...values.map(channel => Math.round(channel)), Math.round(alpha * 255)];
}

// A tiny deterministic 3x5 uppercase face keeps canvas-generated labels
// local; no host font metrics or network font assets are involved.
const TEXT_GLYPHS = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3],
  D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4],
  G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7],
  J: [1, 1, 1, 5, 6], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7],
  M: [5, 7, 7, 5, 5], N: [5, 7, 7, 7, 5], O: [2, 5, 5, 5, 2],
  P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5],
  S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7],
  V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5],
  Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7],
  '2': [6, 1, 7, 4, 7], '3': [6, 1, 2, 1, 6],
  '4': [5, 5, 7, 1, 1], '5': [7, 4, 6, 1, 6],
  '6': [3, 4, 7, 5, 7], '7': [7, 1, 2, 2, 2],
  '8': [7, 5, 7, 5, 7], '9': [7, 5, 7, 1, 6],
  '-': [0, 0, 7, 0, 0], '.': [0, 0, 0, 0, 2]
};

function checkedRect(x, y, width, height) {
  if (![x, y, width, height].every(Number.isFinite)) {
    throw new Error('three.invalid: example canvas rectangle must be finite');
  }
}

function localPixels(source) {
  if (!source || !Number.isInteger(source.width) || !Number.isInteger(source.height) ||
      source.width <= 0 || source.height <= 0 ||
      source.width > MAX_DIMENSION || source.height > MAX_DIMENSION ||
      source.width * source.height > MAX_PIXELS ||
      !(source.data instanceof Uint8ClampedArray) ||
      source.data.length !== source.width * source.height * 4) {
    throw new Error('three.unsupported: example canvas drawImage source is not local RGBA');
  }
  return source;
}

class SoftwarePixels {
  constructor(width, height) {
    if (width * height > MAX_PIXELS) throw new Error('three.invalid: example canvas pixel quota exceeded');
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  resize(width, height) {
    if (width * height > MAX_PIXELS) throw new Error('three.invalid: example canvas pixel quota exceeded');
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  clearRect(x, y, width, height) {
    checkedRect(x, y, width, height);
    const left = Math.max(0, Math.floor(Math.min(x, x + width)));
    const right = Math.min(this.width, Math.ceil(Math.max(x, x + width)));
    const top = Math.max(0, Math.floor(Math.min(y, y + height)));
    const bottom = Math.min(this.height, Math.ceil(Math.max(y, y + height)));
    for (let py = top; py < bottom; py++) {
      for (let px = left; px < right; px++) {
        const offset = (py * this.width + px) * 4;
        this.data[offset] = 0;
        this.data[offset + 1] = 0;
        this.data[offset + 2] = 0;
        this.data[offset + 3] = 0;
      }
    }
  }

  fillRect(x, y, width, height, style) {
    checkedRect(x, y, width, height);
    const color = rgba(style);
    if (!color) throw new Error('three.unsupported: software example canvas requires a bounded CSS color fill');
    const left = Math.max(0, Math.floor(Math.min(x, x + width)));
    const right = Math.min(this.width, Math.ceil(Math.max(x, x + width)));
    const top = Math.max(0, Math.floor(Math.min(y, y + height)));
    const bottom = Math.min(this.height, Math.ceil(Math.max(y, y + height)));
    for (let py = top; py < bottom; py++) {
      for (let px = left; px < right; px++) {
        const offset = (py * this.width + px) * 4;
        this.data[offset] = color[0];
        this.data[offset + 1] = color[1];
        this.data[offset + 2] = color[2];
        this.data[offset + 3] = color[3];
      }
    }
  }

  fillText(text, x, y, style, font) {
    checkedRect(x, y, 0, 0);
    const color = rgba(style);
    if (!color) throw new Error('three.unsupported: example canvas text requires a bounded CSS color');
    const match = /([0-9]+(?:\.[0-9]+)?)\s*(px|pt)?/i.exec(String(font || ''));
    let size = match ? Number(match[1]) : 10;
    if (match && match[2] && match[2].toLowerCase() === 'pt') size *= 4 / 3;
    const scale = Math.max(1, Math.min(8, Math.round(size / 8)));
    const value = String(text).slice(0, 256).toUpperCase();
    let penX = Math.round(x);
    const top = Math.round(y) - 5 * scale;
    for (const character of value) {
      const glyph = TEXT_GLYPHS[character];
      if (glyph) {
        for (let row = 0; row < 5; row++) {
          for (let column = 0; column < 3; column++) {
            if ((glyph[row] & (1 << (2 - column))) !== 0) {
              this.fillRect(penX + column * scale, top + row * scale, scale, scale, style);
            }
          }
        }
      }
      penX += 4 * scale;
    }
  }

  getImageData(x, y, width, height) {
    checkedRect(x, y, width, height);
    width = dimension(width);
    height = dimension(height);
    const image = new Uint8ClampedArray(width * height * 4);
    for (let py = 0; py < height; py++) {
      const sourceY = Math.floor(y) + py;
      if (sourceY < 0 || sourceY >= this.height) continue;
      for (let px = 0; px < width; px++) {
        const sourceX = Math.floor(x) + px;
        if (sourceX < 0 || sourceX >= this.width) continue;
        const source = (sourceY * this.width + sourceX) * 4;
        const target = (py * width + px) * 4;
        image[target] = this.data[source];
        image[target + 1] = this.data[source + 1];
        image[target + 2] = this.data[source + 2];
        image[target + 3] = this.data[source + 3];
      }
    }
    return { data: image, width, height };
  }

  putImageData(image, x, y) {
    if (!image || !(image.data instanceof Uint8ClampedArray) ||
        !Number.isInteger(image.width) || !Number.isInteger(image.height) ||
        image.width < 0 || image.height < 0 || image.data.length !== image.width * image.height * 4) {
      throw new Error('three.invalid: invalid example canvas ImageData');
    }
    checkedRect(x, y, 0, 0);
    for (let py = 0; py < image.height; py++) {
      const targetY = Math.floor(y) + py;
      if (targetY < 0 || targetY >= this.height) continue;
      for (let px = 0; px < image.width; px++) {
        const targetX = Math.floor(x) + px;
        if (targetX < 0 || targetX >= this.width) continue;
        const source = (py * image.width + px) * 4;
        const target = (targetY * this.width + targetX) * 4;
        this.data[target] = image.data[source];
        this.data[target + 1] = image.data[source + 1];
        this.data[target + 2] = image.data[source + 2];
        this.data[target + 3] = image.data[source + 3];
      }
    }
  }

  drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh) {
    source = localPixels(source);
    checkedRect(sx, sy, sw, sh);
    checkedRect(dx, dy, dw, dh);
    if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0 ||
        sx < 0 || sy < 0 || sx + sw > source.width || sy + sh > source.height) {
      throw new Error('three.unsupported: example canvas drawImage requires a positive in-bounds source and destination');
    }
    if (dw * dh > MAX_PIXELS) throw new Error('three.invalid: example canvas drawImage output quota exceeded');
    const left = Math.max(0, Math.floor(dx));
    const right = Math.min(this.width, Math.ceil(dx + dw));
    const top = Math.max(0, Math.floor(dy));
    const bottom = Math.min(this.height, Math.ceil(dy + dh));
    const sourceLeft = Math.floor(sx);
    const sourceRight = Math.ceil(sx + sw) - 1;
    const sourceTop = Math.floor(sy);
    const sourceBottom = Math.ceil(sy + sh) - 1;
    // Bilinear resampling: browsers scale drawImage with image smoothing by
    // default, and the terrain-raycast example relies on it for its 4x
    // texture upscale (nearest-neighbour produced visibly faceted terrain).
    for (let py = top; py < bottom; py++) {
      const sampleY = sy + (py + 0.5 - dy) * sh / dh - 0.5;
      const clampedY = Math.max(sourceTop, Math.min(sourceBottom, sampleY));
      const y0 = Math.floor(clampedY);
      const y1 = Math.min(sourceBottom, y0 + 1);
      const fy = clampedY - y0;
      for (let px = left; px < right; px++) {
        const sampleX = sx + (px + 0.5 - dx) * sw / dw - 0.5;
        const clampedX = Math.max(sourceLeft, Math.min(sourceRight, sampleX));
        const x0 = Math.floor(clampedX);
        const x1 = Math.min(sourceRight, x0 + 1);
        const fx = clampedX - x0;
        const i00 = (y0 * source.width + x0) * 4;
        const i01 = (y0 * source.width + x1) * 4;
        const i10 = (y1 * source.width + x0) * 4;
        const i11 = (y1 * source.width + x1) * 4;
        const to = (py * this.width + px) * 4;
        const upper = 1 - fy;
        const alpha = (source.data[i00 + 3] * (1 - fx) * upper + source.data[i01 + 3] * fx * upper +
          source.data[i10 + 3] * (1 - fx) * fy + source.data[i11 + 3] * fx * fy) / 255;
        const inverse = 1 - alpha;
        for (let c = 0; c < 3; c++) {
          const value = source.data[i00 + c] * (1 - fx) * upper + source.data[i01 + c] * fx * upper +
            source.data[i10 + c] * (1 - fx) * fy + source.data[i11 + c] * fx * fy;
          this.data[to + c] = value * alpha + this.data[to + c] * inverse;
        }
        this.data[to + 3] = alpha * 255 + this.data[to + 3] * inverse;
      }
    }
  }

  blendPixel(x, y, color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const to = (y * this.width + x) * 4;
    const alpha = color[3] / 255;
    const inverse = 1 - alpha;
    for (let c = 0; c < 3; c++) this.data[to + c] = color[c] * alpha + this.data[to + c] * inverse;
    this.data[to + 3] = color[3] + this.data[to + 3] * inverse;
  }

  stroke(subpaths, style, lineWidth) {
    const color = rgba(style);
    if (!color) throw new Error('three.unsupported: example canvas stroke requires a bounded CSS color');
    if (!Number.isFinite(lineWidth) || lineWidth <= 0 || lineWidth > MAX_DIMENSION) {
      throw new Error('three.invalid: example canvas stroke width is outside the bounded range');
    }
    const radius = Math.max(0.5, lineWidth / 2);
    const radiusSquared = radius * radius;
    let visits = 0;
    for (const subpath of subpaths) {
      const points = subpath.points;
      const count = points.length + (subpath.closed && points.length > 1 ? 0 : -1);
      for (let index = 0; index < count; index++) {
        const a = points[index];
        const b = points[(index + 1) % points.length];
        const left = Math.max(0, Math.floor(Math.min(a.x, b.x) - radius));
        const right = Math.min(this.width, Math.ceil(Math.max(a.x, b.x) + radius));
        const top = Math.max(0, Math.floor(Math.min(a.y, b.y) - radius));
        const bottom = Math.min(this.height, Math.ceil(Math.max(a.y, b.y) + radius));
        visits += Math.max(0, right - left) * Math.max(0, bottom - top);
        if (visits > MAX_PIXELS) throw new Error('three.invalid: example canvas stroke raster quota exceeded');
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const lengthSquared = vx * vx + vy * vy;
        for (let py = top; py < bottom; py++) {
          for (let px = left; px < right; px++) {
            const wx = px + 0.5 - a.x;
            const wy = py + 0.5 - a.y;
            const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / lengthSquared));
            const ex = wx - t * vx;
            const ey = wy - t * vy;
            if (ex * ex + ey * ey <= radiusSquared) this.blendPixel(px, py, color);
          }
        }
      }
    }
  }

  fill(subpaths, style) {
    const color = rgba(style);
    if (!color) throw new Error('three.unsupported: example canvas path fill requires a bounded CSS color');
    const polygons = subpaths.filter(subpath => subpath.points.length >= 3);
    if (polygons.length === 0) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const polygon of polygons) {
      for (const point of polygon.points) {
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
    }
    const top = Math.max(0, Math.floor(minY));
    const bottom = Math.min(this.height, Math.ceil(maxY));
    const intersections = [];
    for (let py = top; py < bottom; py++) {
      intersections.length = 0;
      const sampleY = py + 0.5;
      for (const polygon of polygons) {
        const points = polygon.points;
        let a = points[points.length - 1];
        for (const b of points) {
          if ((a.y > sampleY) !== (b.y > sampleY)) {
            intersections.push(a.x + (sampleY - a.y) * (b.x - a.x) / (b.y - a.y));
          }
          a = b;
        }
      }
      intersections.sort((a, b) => a - b);
      for (let index = 0; index + 1 < intersections.length; index += 2) {
        const left = Math.max(0, Math.ceil(intersections[index] - 0.5));
        const right = Math.min(this.width, Math.ceil(intersections[index + 1] - 0.5));
        for (let px = left; px < right; px++) this.blendPixel(px, py, color);
      }
    }
  }
}

// Retain the real Flutter Canvas2D path for existing simple examples. Pixel
// readback switches this bounded wrapper to local RGBA storage synchronously.
export function createExampleCanvas2D(JSR, surfaceId, options) {
  const delegate = JSR.three.createCanvas2D(surfaceId, options);
  const context = delegate.getContext('2d');
  const listeners = new Set();
  let pixels = null;
  let version = 0;
  let scaleX = 1;
  let scaleY = 1;
  let font = '10px sans-serif';
  let strokeStyle = '#000000';
  let lineWidth = 1;
  let subpaths = [];
  let currentSubpath = null;
  let pathCommands = 0;
  let commands = [];

  const canvas = {
    isJsrNativeCanvas2D: true,
    isJsrThreeExampleLocal: true,
    style: delegate.style,
    get width() { return pixels ? pixels.width : delegate.width; },
    set width(value) {
      value = dimension(value);
      if (pixels) pixels.resize(value, pixels.height);
      else { delegate.width = value; commands = []; }
    },
    get height() { return pixels ? pixels.height : delegate.height; },
    set height(value) {
      value = dimension(value);
      if (pixels) pixels.resize(pixels.width, value);
      else { delegate.height = value; commands = []; }
    },
    get _ready() { return pixels ? true : delegate._ready; },
    get _rgba() { return pixels ? pixels.data : delegate._rgba; },
    get _readyVersion() { return pixels ? version : delegate._readyVersion; },
    getContext(type) {
      if (type !== '2d') throw new Error(`three.unsupported: example canvas context ${type}`);
      return facade;
    },
    _addReadyListener(callback) {
      listeners.add(callback);
      const unlisten = delegate._addReadyListener(() => callback(canvas));
      return () => { listeners.delete(callback); unlisten(); };
    },
    addEventListener(type, callback) { delegate.addEventListener(type, callback); },
    removeEventListener(type, callback) { delegate.removeEventListener(type, callback); },
    dispose() { listeners.clear(); delegate.dispose(); }
  };

  function ensureLocal() {
    if (pixels) return pixels;
    const local = new SoftwarePixels(delegate.width, delegate.height);
    for (const command of commands) {
      local.fillRect(command.x, command.y, command.width, command.height, command.style);
    }
    pixels = local;
    version = delegate._readyVersion + 1;
    return local;
  }

  function touch() {
    version++;
    for (const listener of Array.from(listeners)) listener(canvas);
  }

  function pathPoint(x, y) {
    checkedRect(x, y, 0, 0);
    if (++pathCommands > MAX_PATH_COMMANDS) {
      throw new Error('three.invalid: example canvas path command quota exceeded');
    }
    return { x: x * scaleX, y: y * scaleY };
  }

  const facade = {
    get fillStyle() { return context.fillStyle; },
    set fillStyle(value) { context.fillStyle = value; },
    get font() { return font; },
    set font(value) { font = String(value); },
    get strokeStyle() { return strokeStyle; },
    set strokeStyle(value) { strokeStyle = value; },
    get lineWidth() { return lineWidth; },
    set lineWidth(value) {
      if (!Number.isFinite(value) || value <= 0 || value > MAX_DIMENSION) {
        throw new Error('three.invalid: example canvas lineWidth is outside the bounded range');
      }
      lineWidth = value;
    },
    createRadialGradient(...args) { return context.createRadialGradient(...args); },
    fillRect(x, y, width, height) {
      checkedRect(x, y, width, height);
      if (pixels || scaleX !== 1 || scaleY !== 1) {
        ensureLocal().fillRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY, context.fillStyle);
        touch();
        return;
      }
      if (typeof context.fillStyle !== 'string') {
        // Simple gradients remain entirely on the existing Flutter path.
        context.fillRect(x, y, width, height);
        commands.push({ x, y, width, height, style: null });
        return;
      }
      if (!rgba(context.fillStyle)) throw new Error('three.unsupported: unsupported example canvas CSS color');
      context.fillRect(x, y, width, height);
      commands.push({ x, y, width, height, style: context.fillStyle });
    },
    clearRect(x, y, width, height) {
      checkedRect(x, y, width, height);
      ensureLocal().clearRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
      touch();
    },
    getImageData(x, y, width, height) { return ensureLocal().getImageData(x, y, width, height); },
    putImageData(image, x, y) { ensureLocal().putImageData(image, x, y); touch(); },
    scale(x, y) {
      checkedRect(x, y, 0, 0);
      if (!(x > 0 && y > 0)) throw new Error('three.unsupported: example canvas scale must be positive');
      scaleX *= x;
      scaleY *= y;
    },
    drawImage(source, ...args) {
      // Browsers ignore an image whose load has not completed. This matters
      // for official modules which draw once synchronously before img.onload.
      if (source && source.complete === false) return;
      const sourcePixels = localPixels(source && source._examplePixels);
      let sx = 0, sy = 0, sw = sourcePixels.width, sh = sourcePixels.height;
      let dx, dy, dw, dh;
      if (args.length === 2) {
        [dx, dy] = args; dw = sw; dh = sh;
      } else if (args.length === 4) {
        [dx, dy, dw, dh] = args;
      } else if (args.length === 8) {
        [sx, sy, sw, sh, dx, dy, dw, dh] = args;
      } else {
        throw new Error('three.unsupported: example canvas drawImage expects 2, 4, or 8 coordinates');
      }
      ensureLocal().drawImage(sourcePixels, sx, sy, sw, sh,
        dx * scaleX, dy * scaleY, dw * scaleX, dh * scaleY);
      touch();
    },
    beginPath() {
      subpaths = [];
      currentSubpath = null;
      pathCommands = 0;
    },
    moveTo(x, y) {
      currentSubpath = { points: [pathPoint(x, y)], closed: false };
      subpaths.push(currentSubpath);
    },
    lineTo(x, y) {
      const point = pathPoint(x, y);
      if (!currentSubpath) {
        currentSubpath = { points: [point], closed: false };
        subpaths.push(currentSubpath);
      } else currentSubpath.points.push(point);
    },
    closePath() { if (currentSubpath) currentSubpath.closed = true; },
    stroke() {
      ensureLocal().stroke(subpaths, strokeStyle, lineWidth * (scaleX + scaleY) / 2);
      touch();
    },
    fill() {
      ensureLocal().fill(subpaths, context.fillStyle);
      touch();
    },
    fillText(text, x, y) {
      ensureLocal().fillText(text, x, y, context.fillStyle, font);
      touch();
    }
  };
  Object.defineProperty(canvas, '_examplePixels', { get() { return pixels; } });
  return canvas;
}
