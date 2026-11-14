// Bounded CPU prefilter for sparse HDR equirectangular environments.
// flutter_gpu's R1 texture lane is RGBA8 and has no CubeUV/PMREM target. A
// single very bright HDR texel therefore lights almost no reflected pixels
// when sampled directly. Detect that case and spread its energy over a small
// equirectangular image before the native upload. This is deliberately not a
// full roughness-dependent PMREM chain: one shared prefiltered image is used
// for every roughness level.

function halfToFloat(bits) {
  const exponent = (bits >> 10) & 0x1f;
  const mantissa = bits & 0x3ff;
  let value;
  if (exponent === 0) value = mantissa / 16777216;
  else if (exponent === 31) value = mantissa || (bits & 0x8000) ? 0 : 1;
  else value = (1 + mantissa / 1024) * Math.pow(2, exponent - 15);
  return bits & 0x8000 ? -value : value;
}

/**
 * Return a small RGBA float image for a sparse HDR source, or null when the
 * source should retain the ordinary direct-equirectangular degrade.
 * `halfFloat` selects Uint16 IEEE-half decoding; otherwise Float32 data is
 * read directly. Only RGBA images are accepted by the native texture lane.
 */
export function prefilterSparseEquirect(image, halfFloat = false) {
  if (!image || !image.data || !image.width || !image.height) return null;
  const width = image.width | 0;
  const height = image.height | 0;
  const data = image.data;
  const count = width * height;
  if (width < 2 || height < 2 || data.length !== count * 4) return null;
  const byteData = !halfFloat && data instanceof Uint8Array;
  const read = byteData ? value => value / 255 : halfFloat ? halfToFloat : value => value;
  let maxLuminance = 0;
  let bright = 0;
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const offset = i * 4;
    const r = Math.max(0, read(data[offset]));
    const g = Math.max(0, read(data[offset + 1]));
    const b = Math.max(0, read(data[offset + 2]));
    const luminance = (r + g + b) / 3;
    if (!Number.isFinite(luminance)) continue;
    sum += luminance;
    if (luminance > maxLuminance) maxLuminance = luminance;
    if (luminance > 16) bright++;
  }
  // Restrict the extra CPU work to the pathological point-light HDR case.
  // The prepare-time RGBE lane is byte-based (its bright texel is clamped to
  // 255), so recognize both that representation and native half/float HDR.
  // Ordinary HDR environment photographs keep the existing direct sampler.
  const mean = sum / count;
  const sparse = byteData
    ? maxLuminance > 0.9 && mean < 0.01
    : maxLuminance > 16 && mean < maxLuminance * 0.05;
  if (!sparse || bright > Math.max(4, Math.floor(count * 0.002))) return null;
  const outWidth = Math.min(64, width);
  const outHeight = Math.min(32, height);
  const outCount = outWidth * outHeight;
  const filtered = new Float32Array(outCount * 4);
  // Area-average into a bounded image. Unlike nearest sampling this cannot
  // miss the one luminous texel that carries the whole environment.
  for (let y = 0; y < outHeight; y++) {
    const y0 = Math.floor(y * height / outHeight);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * height / outHeight));
    for (let x = 0; x < outWidth; x++) {
      const x0 = Math.floor(x * width / outWidth);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * width / outWidth));
      const offset = (y * outWidth + x) * 4;
      let samples = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const sourceOffset = (sy * width + sx) * 4;
          for (let c = 0; c < 3; c++) {
            const value = Math.max(0, read(data[sourceOffset + c]));
            filtered[offset + c] += Number.isFinite(value) ? value : 0;
          }
          samples++;
        }
      }
      for (let c = 0; c < 3; c++) filtered[offset + c] /= Math.max(1, samples);
      filtered[offset + 3] = 1;
    }
  }
  // Separable binomial blur, wrapping horizontally as an equirect map does.
  // Three passes give diffuse surfaces a useful response while retaining a
  // directional bright region for glossy surfaces.
  const kernel = [1, 4, 6, 4, 1];
  for (let pass = 0; pass < 3; pass++) {
    const horizontal = new Float32Array(filtered.length);
    for (let y = 0; y < outHeight; y++) {
      for (let x = 0; x < outWidth; x++) {
        const dst = (y * outWidth + x) * 4;
        for (let k = -2; k <= 2; k++) {
          const sx = (x + k + outWidth) % outWidth;
          const src = (y * outWidth + sx) * 4;
          const weight = kernel[k + 2] / 16;
          for (let c = 0; c < 3; c++) horizontal[dst + c] += filtered[src + c] * weight;
        }
        horizontal[dst + 3] = 1;
      }
    }
    const vertical = new Float32Array(filtered.length);
    for (let y = 0; y < outHeight; y++) {
      for (let x = 0; x < outWidth; x++) {
        const dst = (y * outWidth + x) * 4;
        for (let k = -2; k <= 2; k++) {
          const sy = Math.max(0, Math.min(outHeight - 1, y + k));
          const src = (sy * outWidth + x) * 4;
          const weight = kernel[k + 2] / 16;
          for (let c = 0; c < 3; c++) vertical[dst + c] += horizontal[src + c] * weight;
        }
        vertical[dst + 3] = 1;
      }
    }
    filtered.set(vertical);
  }
  let filteredMean = 0;
  for (let i = 0; i < outCount; i++) {
    const offset = i * 4;
    filteredMean += (filtered[offset] + filtered[offset + 1] + filtered[offset + 2]) / 3;
  }
  filteredMean /= outCount;
  // Native RGBA8 conversion clamps HDR values. Normalize the integrated
  // radiance to a useful diffuse level before that conversion; the original
  // source remains available for the scene background.
  const scale = filteredMean > 1e-8
    ? Math.min(byteData ? 1000000 : 64, 0.02 / filteredMean)
    : 1;
  // The byte RGBE preparation lane quantizes the very dim surround of
  // spot1Lux to zero. Restore a small neutral ambient floor so diffuse
  // dielectrics do not collapse to silhouettes; it is not added to native
  // half/float sources, which still carry that surround.
  const ambient = byteData ? 0.06 : 0;
  for (let i = 0; i < filtered.length; i += 4) {
    filtered[i] = filtered[i] * scale + ambient;
    filtered[i + 1] = filtered[i + 1] * scale + ambient;
    filtered[i + 2] = filtered[i + 2] * scale + ambient;
  }
  return { data: filtered, width: outWidth, height: outHeight, scale, ambient, sourceMean: mean };
}
