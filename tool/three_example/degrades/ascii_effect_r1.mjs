// R1 AsciiEffect for webgl_effects_ascii (three.js r186).
//
// Root cause of the "does not load at all" owner report: the official
// AsciiEffect constructor needs `document.createElement('canvas')` with a
// 2D context (`if (!oCanvas.getContext) return;`) and `getImageData` for its
// per-frame pixel sampling. The prepared widget document facade is the
// bounded xml_dom DOM (built for SVGLoader/Collada parsing) — canvas elements
// have no getContext and tables have no rows, so the constructor returned a
// HALF-BUILT effect, the module's `effect.setSize` threw, and the widget
// never mounted a frame.
//
// This drop-in keeps the official class contract (constructor(renderer,
// options), setSize, render, domElement) and the official module unmodified:
//   - renderer.render(scene, camera) runs the real R1 pipeline every tick
//     (frames present at full fps);
//   - the pixel sampling path is bounded: a neutral-RGBA buffer shaped like
//     ImageData (R1 keeps GPU pixels on the host — renderer._examplePixels),
//     so asciifyImage computes the same character mapping without crashing;
//   - the ASCII <table> output is maintained (rows/cells facade) but is not
//     a displayable R1 surface: the widget presents the scene directly.
// A one-time warn records the adaptation for the boot log.
const MAX_ASCII_PIXELS = 4096 * 4096;

function augmentElement(element) {
  // The xml_dom element style is a plain Proxy object; AsciiEffect writes
  // cursor/margin/letterSpacing/fontFamily/... through it — already fine.
  return element;
}

class BoundedAsciiContext {
  constructor(canvas) {
    this.canvas = canvas;
    this._buffer = null;
    this.fillStyle = '#000000';
  }

  _ensure(width, height) {
    if (!this._buffer || this._buffer.width !== width || this._buffer.height !== height) {
      if (width * height > MAX_ASCII_PIXELS) throw new Error('three.invalid: ascii pixel quota exceeded');
      this._buffer = { width, height, data: new Uint8ClampedArray(width * height * 4) };
    }
    return this._buffer;
  }

  clearRect() {
    if (this._buffer) this._buffer.data.fill(0);
  }

  // Official AsciiEffect: drawImage(renderer.domElement, 0, 0, iW, iH).
  // R1 readback (renderer._examplePixels) is a neutral RGBA buffer kept on
  // the host; scale-sample it into the ascii sampling buffer.
  drawImage(source, x, y, width, height) {
    const target = this._ensure(width, height);
    const readback = source && source._examplePixels;
    if (!readback || !readback.width || !readback.height) return;
    const sx = readback.width / width;
    const sy = readback.height / height;
    for (let ty = 0; ty < height; ty++) {
      const sourceY = Math.min(readback.height - 1, Math.floor((ty + 0.5) * sy));
      for (let tx = 0; tx < width; tx++) {
        const sourceX = Math.min(readback.width - 1, Math.floor((tx + 0.5) * sx));
        const so = (sourceY * readback.width + sourceX) * 4;
        const to = (ty * width + tx) * 4;
        target.data[to] = readback.data[so];
        target.data[to + 1] = readback.data[so + 1];
        target.data[to + 2] = readback.data[so + 2];
        target.data[to + 3] = 255;
      }
    }
  }

  getImageData(x, y, width, height) {
    const buffer = this._ensure(width, height);
    return { width, height, data: buffer.data };
  }
}

export class AsciiEffect {
  constructor(renderer, options = {}) {
    const fResolution = options['resolution'] || 0.15;
    const iScale = options['scale'] || 1;
    const bColor = options['color'] || false;
    const bAlpha = options['alpha'] || false;
    const bBlock = options['block'] || false;
    const bInvert = options['invert'] || false;
    const charSet = options['charset'];

    const document = renderer.domElement.ownerDocument || globalThis.document;
    const domElement = document.createElement('div');
    if (domElement.style) domElement.style.cursor = 'default';
    const oAscii = document.createElement('table');
    // Bounded table facade: the official initAsciiSize/asciifyImage lane
    // writes through rows[0].cells[0] and innerHTML.
    if (!oAscii.rows) {
      const cell = { style: {}, textContent: '' };
      const row = { cells: [cell] };
      oAscii.rows = [row];
      oAscii.cells = [cell];
    }
    domElement.appendChild(oAscii);

    let width = 0, height = 0;
    let iWidth = 0, iHeight = 0;

    const aCharList = charSet
      ? String(charSet).split('').map(ch => ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch)
      : (bColor ? ' CGO08@' : ' .,:;i1tfLCG08@').split('');
    const maxIdx = aCharList.length - 1;

    const oCanvasImg = renderer.domElement;
    const sampling = { width: 0, height: 0, data: null };

    this.setSize = function (w, h) {
      width = w;
      height = h;
      renderer.setSize(w, h);
      iWidth = Math.floor(width * fResolution);
      iHeight = Math.floor(height * fResolution);
      if (iWidth * iHeight > MAX_ASCII_PIXELS) throw new Error('three.invalid: ascii pixel quota exceeded');
      sampling.width = iWidth;
      sampling.height = iHeight;
      sampling.data = new Uint8ClampedArray(iWidth * iHeight * 4);
      const canvasStyle = oCanvasImg && oCanvasImg.style;
      if (canvasStyle && canvasStyle.backgroundColor) {
        const cell = oAscii.rows[0].cells[0];
        cell.style.backgroundColor = canvasStyle.backgroundColor;
        cell.style.color = canvasStyle.color;
      }
      oAscii.cellSpacing = '0';
      oAscii.cellPadding = '0';
      const style = oAscii.style || (oAscii.style = {});
      style.whiteSpace = 'pre';
      style.margin = '0px';
      style.padding = '0px';
      let fLetterSpacing = 0;
      if (iScale === 4) fLetterSpacing = -3.1;
      else if (iScale >= 5) fLetterSpacing = -4.15;
      else if (iScale === 2 || iScale === 3) fLetterSpacing = -2.1;
      style.letterSpacing = fLetterSpacing + 'px';
      style.fontFamily = 'courier new, monospace';
      style.fontSize = ((2 / fResolution) * iScale) + 'px';
      style.lineHeight = ((2 / fResolution) * iScale) + 'px';
      style.textAlign = 'left';
    };

    this.render = function (scene, camera) {
      renderer.render(scene, camera);
      asciifyImage();
    };

    function asciifyImage() {
      // Official brightness mapping over the bounded neutral readback.
      const readback = oCanvasImg && oCanvasImg._examplePixels;
      if (!readback || !readback.width || !readback.height || !sampling.data) return;
      const sx = readback.width / sampling.width;
      const sy = readback.height / sampling.height;
      for (let y = 0; y < sampling.height; y++) {
        const sourceY = Math.min(readback.height - 1, Math.floor((y + 0.5) * sy));
        for (let x = 0; x < sampling.width; x++) {
          const sourceX = Math.min(readback.width - 1, Math.floor((x + 0.5) * sx));
          const so = (sourceY * readback.width + sourceX) * 4;
          const to = (y * sampling.width + x) * 4;
          sampling.data[to] = readback.data[so];
          sampling.data[to + 1] = readback.data[so + 1];
          sampling.data[to + 2] = readback.data[so + 2];
          sampling.data[to + 3] = 255;
        }
      }
      let strChars = '';
      for (let y = 0; y < sampling.height; y += 2) {
        for (let x = 0; x < sampling.width; x++) {
          const offset = (y * sampling.width + x) * 4;
          const red = sampling.data[offset];
          const green = sampling.data[offset + 1];
          const blue = sampling.data[offset + 2];
          const brightness = (0.3 * red + 0.59 * green + 0.11 * blue) / 255;
          let charIdx = Math.round((1 - brightness) * maxIdx);
          if (bInvert) charIdx = maxIdx - charIdx;
          let ch = aCharList[charIdx];
          if (ch === undefined || ch === ' ') ch = '\u00a0';
          if (bColor) {
            strChars += '<span style=\'color:rgb(' + red + ',' + green + ',' + blue + ');\'>'
              + ch + '</span>';
          } else {
            strChars += ch;
          }
        }
        strChars += '<br/>';
      }
      oAscii.innerHTML = '<tr><td style="display:block;width:' + width
        + 'px;height:' + height + 'px;overflow:hidden">' + strChars + '</td></tr>';
    }

    this.domElement = augmentElement(domElement);
    // Bounded DOM shims the official module needs around the effect:
    //  - document.body (the module appends the effect div to it);
    //  - listener methods on the effect div (TrackballControls binds its
    //    pointer lanes to it; R1 has no DOM pointer transport — orbit is
    //    inert, the animation loop is unaffected).
    if (document && !document.body) {
      document.body = document.createElement('body');
    }
    if (!domElement.addEventListener) {
      domElement._r1AsciiListeners = new Map();
      domElement.addEventListener = (type, fn) => {
        const list = domElement._r1AsciiListeners.get(type) || [];
        list.push(fn);
        domElement._r1AsciiListeners.set(type, list);
      };
      domElement.removeEventListener = (type, fn) => {
        const list = domElement._r1AsciiListeners.get(type) || [];
        const index = list.indexOf(fn);
        if (index >= 0) list.splice(index, 1);
      };
      domElement.dispatchEvent = () => true;
    }
    console.warn(
      'three: R1 presents the scene directly; the ASCII text table needs JS pixel readback ' +
      'and DOM text display, which the bounded runtime does not provide (neutral readback).');
  }
}

export default AsciiEffect;
