const MAX_DIMENSION = 4096;
const MAX_PIXELS = 16777216;

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
  const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)$/.exec(text);
  if (!match) return null;
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  const values = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (values.some(channel => channel > 255) || !(alpha >= 0 && alpha <= 1)) return null;
  return [...values, Math.round(alpha * 255)];
}

function checkedRect(x, y, width, height) {
  if (![x, y, width, height].every(Number.isFinite)) {
    throw new Error('three.invalid: example canvas rectangle must be finite');
  }
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

  drawImage(source, x, y, scaleX, scaleY) {
    checkedRect(x, y, scaleX, scaleY);
    if (!(source instanceof SoftwarePixels) || scaleX <= 0 || scaleY <= 0) {
      throw new Error('three.unsupported: software example canvas drawImage requires a local source and positive scale');
    }
    const width = Math.min(this.width - Math.floor(x), Math.ceil(source.width * scaleX));
    const height = Math.min(this.height - Math.floor(y), Math.ceil(source.height * scaleY));
    for (let py = Math.max(0, Math.floor(y)); py < Math.floor(y) + height; py++) {
      if (py >= this.height) break;
      const sourceY = Math.min(source.height - 1, Math.floor((py - y) / scaleY));
      for (let px = Math.max(0, Math.floor(x)); px < Math.floor(x) + width; px++) {
        if (px >= this.width) break;
        const sourceX = Math.min(source.width - 1, Math.floor((px - x) / scaleX));
        const from = (sourceY * source.width + sourceX) * 4;
        const to = (py * this.width + px) * 4;
        const alpha = source.data[from + 3] / 255;
        const inverse = 1 - alpha;
        this.data[to] = source.data[from] * alpha + this.data[to] * inverse;
        this.data[to + 1] = source.data[from + 1] * alpha + this.data[to + 1] * inverse;
        this.data[to + 2] = source.data[from + 2] * alpha + this.data[to + 2] * inverse;
        this.data[to + 3] = source.data[from + 3] + this.data[to + 3] * inverse;
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

  const facade = {
    get fillStyle() { return context.fillStyle; },
    set fillStyle(value) { context.fillStyle = value; },
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
    getImageData(x, y, width, height) { return ensureLocal().getImageData(x, y, width, height); },
    putImageData(image, x, y) { ensureLocal().putImageData(image, x, y); touch(); },
    scale(x, y) {
      checkedRect(x, y, 0, 0);
      if (!(x > 0 && y > 0)) throw new Error('three.unsupported: example canvas scale must be positive');
      scaleX *= x;
      scaleY *= y;
    },
    drawImage(source, x, y) {
      const local = ensureLocal();
      const sourcePixels = source && source._examplePixels;
      if (!sourcePixels) throw new Error('three.unsupported: example canvas drawImage source is not local RGBA');
      local.drawImage(sourcePixels, x, y, scaleX, scaleY);
      touch();
    },
    clearRect() { throw new Error('three.unsupported: example canvas clearRect is outside the bounded profile'); },
    fillText() { throw new Error('three.unsupported: example canvas fillText is outside the bounded profile'); }
  };
  Object.defineProperty(canvas, '_examplePixels', { get() { return pixels; } });
  return canvas;
}
