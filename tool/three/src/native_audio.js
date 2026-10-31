import { Audio as UpstreamAudio, AudioContext as UpstreamAudioContext } from 'three';
import { unsupported } from './errors.js';
import { encodeBase64 } from './runtime.js';

const ROOT = typeof globalThis !== 'undefined' ? globalThis : {};
const CHANNEL = 'three.audio';
const MAX_AUDIO_BYTES = 64 * 1024 * 1024;
let contextSequence = 0;

function clockMs() {
  return ROOT.performance && typeof ROOT.performance.now === 'function'
    ? ROOT.performance.now()
    : Date.now();
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function bytesOf(value) {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
  }
  throw new Error('three.invalid: audio data must be an ArrayBuffer or typed array');
}

function audioBuffer(context, data, mime = '') {
  const bytes = bytesOf(data);
  if (bytes.length === 0 || bytes.length > MAX_AUDIO_BYTES) {
    throw new Error('three.invalid: encoded audio must contain 1..67108864 bytes');
  }
  const measured = encodedDuration(bytes, mime);
  return {
    isJsrAudioBuffer: true,
    data: bytes,
    mime: mime || detectAudioMime(bytes),
    duration: measured.duration,
    sampleRate: measured.sampleRate,
    length: Math.floor(measured.duration * measured.sampleRate),
    numberOfChannels: 0,
    getChannelData() {
      unsupported('audioDecode', 'native THREE audio hands encoded bytes to the media host');
    },
    copyFromChannel() {
      unsupported('audioDecode', 'native THREE audio does not expose decoded PCM channels');
    },
    copyToChannel() {
      unsupported('audioDecode', 'native THREE audio does not expose decoded PCM channels');
    }
  };
}

function detectAudioMime(bytes) {
  if (bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.subarray(8, 12)) === 'WAVE') return 'audio/wav';
  if (bytes.length >= 4 && String.fromCharCode(...bytes.subarray(0, 4)) === 'OggS') return 'audio/ogg';
  if (bytes.length >= 4 && String.fromCharCode(...bytes.subarray(0, 4)) === 'fLaC') return 'audio/flac';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.subarray(4, 8)) === 'ftyp') return 'audio/mp4';
  if ((bytes.length >= 3 && bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) ||
      (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
  return 'application/octet-stream';
}

// Duration is needed only for Audio.onEnded bookkeeping. The host still gets
// the original encoded bytes; no JavaScript audio decoding takes place.
function encodedDuration(bytes, mime) {
  if (bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.subarray(8, 12)) === 'WAVE') {
    return wavDuration(bytes);
  }
  if (/mpeg|mp3/i.test(mime) || (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) ||
      (bytes.length >= 3 && bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51)) {
    return mp3Duration(bytes);
  }
  return { duration: 0, sampleRate: 0 };
}

function wavDuration(bytes) {
  let offset = 12;
  let byteRate = 0;
  let sampleRate = 0;
  let dataLength = 0;
  while (offset + 8 <= bytes.length) {
    const length = readUint32(bytes, offset + 4, true);
    const type = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    if (type === 'fmt ' && length >= 16 && offset + 8 + length <= bytes.length) {
      sampleRate = readUint32(bytes, offset + 12, true);
      byteRate = readUint32(bytes, offset + 16, true);
    } else if (type === 'data') {
      dataLength = Math.min(length, Math.max(0, bytes.length - offset - 8));
    }
    offset += 8 + length + (length & 1);
  }
  return {
    duration: byteRate > 0 ? dataLength / byteRate : 0,
    sampleRate: sampleRate || 0
  };
}

function readUint32(bytes, offset, littleEndian) {
  if (offset < 0 || offset + 4 > bytes.length) return 0;
  if (littleEndian) {
    return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
  }
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function mp3Duration(bytes) {
  let offset = 0;
  if (bytes.length >= 10 && bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) {
    const tagSize = ((bytes[6] & 127) << 21) | ((bytes[7] & 127) << 14) |
      ((bytes[8] & 127) << 7) | (bytes[9] & 127);
    offset = 10 + tagSize + ((bytes[5] & 16) ? 10 : 0);
  }
  let duration = 0;
  let sampleRate = 0;
  while (offset + 4 <= bytes.length) {
    const frame = mp3Frame(bytes, offset);
    if (!frame) {
      offset++;
      continue;
    }
    duration += frame.samples / frame.sampleRate;
    sampleRate = frame.sampleRate;
    offset += frame.length;
  }
  return { duration, sampleRate };
}

function mp3Frame(bytes, offset) {
  if (bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) return null;
  const version = (bytes[offset + 1] >> 3) & 3;
  const layer = (bytes[offset + 1] >> 1) & 3;
  const bitrateIndex = (bytes[offset + 2] >> 4) & 15;
  const rateIndex = (bytes[offset + 2] >> 2) & 3;
  if (version === 1 || layer === 0 || bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) return null;
  const baseRates = [44100, 48000, 32000];
  const sampleRate = Math.floor(baseRates[rateIndex] / (version === 2 ? 2 : version === 0 ? 4 : 1));
  const bitrate = mp3Bitrate(version, layer, bitrateIndex);
  if (!bitrate || !sampleRate) return null;
  const samples = layer === 3 ? 384 : layer === 2 ? 1152 : (version === 3 ? 1152 : 576);
  const padding = (bytes[offset + 2] >> 1) & 1;
  const length = layer === 3
    ? (Math.floor(12000 * bitrate / sampleRate) + padding) * 4
    : Math.floor((layer === 1 && version !== 3 ? 72000 : 144000) * bitrate / sampleRate) + padding;
  return length >= 4 && offset + length <= bytes.length ? { length, samples, sampleRate } : null;
}

function mp3Bitrate(version, layer, index) {
  const mpeg1 = version === 3;
  const table = mpeg1
    ? (layer === 3
      ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
      : layer === 2
        ? [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384]
        : [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448])
    : (layer === 3
      ? [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256]
      : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]);
  return table[index] || 0;
}

class NativeAudioParam {
  constructor(context, value, onChange) {
    this.context = context;
    this._value = value;
    this._onChange = onChange;
    this.defaultValue = value;
    this.minValue = -3.4028234663852886e38;
    this.maxValue = 3.4028234663852886e38;
    this.automationRate = 'a-rate';
  }

  get value() { return this._value; }
  set value(value) { this.setValueAtTime(value, this.context.currentTime); }
  setValueAtTime(value) {
    if (!Number.isFinite(value)) throw new TypeError('three.invalid: non-finite AudioParam value');
    this._value = value;
    if (this._onChange) this._onChange();
    return this;
  }
  linearRampToValueAtTime(value) { return this.setValueAtTime(value); }
  exponentialRampToValueAtTime(value) { return this.setValueAtTime(value); }
  setTargetAtTime(value) { return this.setValueAtTime(value); }
  cancelScheduledValues() { return this; }
  cancelAndHoldAtTime() { return this; }
}

class NativeAudioNode {
  constructor(context, kind) {
    this.context = context;
    this.kind = kind;
    this.outputs = new Set();
    this.channelCount = 2;
    this.channelCountMode = 'max';
    this.channelInterpretation = 'speakers';
  }

  connect(destination) {
    if (!destination || destination.context !== this.context || typeof destination.kind !== 'string') {
      throw new TypeError('three.invalid: audio nodes must belong to one native AudioContext');
    }
    this.outputs.add(destination);
    this.context._refresh();
    return destination;
  }

  disconnect(destination) {
    if (destination === undefined) this.outputs.clear();
    else this.outputs.delete(destination);
    this.context._refresh();
  }
}

class NativeGainNode extends NativeAudioNode {
  constructor(context) {
    super(context, 'gain');
    this.gain = new NativeAudioParam(context, 1, () => context._refresh());
  }
}

class NativeListener {
  constructor(context) {
    this.context = context;
    const changed = () => context._refresh();
    this.positionX = new NativeAudioParam(context, 0, changed);
    this.positionY = new NativeAudioParam(context, 0, changed);
    this.positionZ = new NativeAudioParam(context, 0, changed);
    this.forwardX = new NativeAudioParam(context, 0, changed);
    this.forwardY = new NativeAudioParam(context, 0, changed);
    this.forwardZ = new NativeAudioParam(context, -1, changed);
    this.upX = new NativeAudioParam(context, 0, changed);
    this.upY = new NativeAudioParam(context, 1, changed);
    this.upZ = new NativeAudioParam(context, 0, changed);
  }

  setPosition(x, y, z) {
    this.positionX.value = x;
    this.positionY.value = y;
    this.positionZ.value = z;
  }

  setOrientation(fx, fy, fz, ux, uy, uz) {
    this.forwardX.value = fx;
    this.forwardY.value = fy;
    this.forwardZ.value = fz;
    this.upX.value = ux;
    this.upY.value = uy;
    this.upZ.value = uz;
  }
}

class NativePannerNode extends NativeAudioNode {
  constructor(context) {
    super(context, 'panner');
    const changed = () => context._refresh();
    this.positionX = new NativeAudioParam(context, 0, changed);
    this.positionY = new NativeAudioParam(context, 0, changed);
    this.positionZ = new NativeAudioParam(context, 0, changed);
    this.orientationX = new NativeAudioParam(context, 1, changed);
    this.orientationY = new NativeAudioParam(context, 0, changed);
    this.orientationZ = new NativeAudioParam(context, 0, changed);
    this._refDistance = 1;
    this._maxDistance = 10000;
    this._rolloffFactor = 1;
    this._distanceModel = 'inverse';
    this._coneInnerAngle = 360;
    this._coneOuterAngle = 360;
    this._coneOuterGain = 0;
    this.panningModel = 'equalpower';
  }

  get refDistance() { return this._refDistance; }
  set refDistance(value) { this._refDistance = positive(value, 'refDistance'); this.context._refresh(); }
  get maxDistance() { return this._maxDistance; }
  set maxDistance(value) { this._maxDistance = positive(value, 'maxDistance'); this.context._refresh(); }
  get rolloffFactor() { return this._rolloffFactor; }
  set rolloffFactor(value) { this._rolloffFactor = positive(value, 'rolloffFactor'); this.context._refresh(); }
  get distanceModel() { return this._distanceModel; }
  set distanceModel(value) {
    if (!['linear', 'inverse', 'exponential'].includes(value)) {
      throw new TypeError('three.invalid: PannerNode distanceModel');
    }
    this._distanceModel = value;
    this.context._refresh();
  }
  get coneInnerAngle() { return this._coneInnerAngle; }
  set coneInnerAngle(value) { this._coneInnerAngle = clamp(finite(value), 0, 360); this.context._refresh(); }
  get coneOuterAngle() { return this._coneOuterAngle; }
  set coneOuterAngle(value) { this._coneOuterAngle = clamp(finite(value), 0, 360); this.context._refresh(); }
  get coneOuterGain() { return this._coneOuterGain; }
  set coneOuterGain(value) { this._coneOuterGain = clamp(finite(value), 0, 1); this.context._refresh(); }

  setPosition(x, y, z) {
    this.positionX.value = x;
    this.positionY.value = y;
    this.positionZ.value = z;
  }

  setOrientation(x, y, z) {
    this.orientationX.value = x;
    this.orientationY.value = y;
    this.orientationZ.value = z;
  }
}

function positive(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`three.invalid: PannerNode ${name} must be non-negative and finite`);
  }
  return value;
}

class NativeAnalyserNode extends NativeAudioNode {
  constructor(context) {
    super(context, 'analyser');
    this.fftSize = 2048;
    this.minDecibels = -100;
    this.maxDecibels = -30;
    this.smoothingTimeConstant = 0.8;
  }

  get frequencyBinCount() { return this.fftSize >> 1; }
  getByteFrequencyData(array) {
    this.context._warnAnalyser();
    array.fill(0);
  }
  getByteTimeDomainData(array) {
    this.context._warnAnalyser();
    array.fill(0);
  }
  getFloatFrequencyData(array) {
    this.context._warnAnalyser();
    array.fill(0);
  }
  getFloatTimeDomainData(array) {
    this.context._warnAnalyser();
    array.fill(0);
  }
}

class NativeBufferSourceNode extends NativeAudioNode {
  constructor(context) {
    super(context, 'bufferSource');
    this.buffer = null;
    this._loop = false;
    this.loopStart = 0;
    this.loopEnd = 0;
    this.onended = null;
    this.playbackRate = new NativeAudioParam(context, 1, () => this._transportChanged());
    this.detune = new NativeAudioParam(context, 0, () => this._transportChanged());
    this._started = false;
    this._stopped = false;
    this._sent = false;
    this._offset = 0;
    this._duration = undefined;
    this._delay = 0;
    this._endTimer = null;
    this._stopAction = 'stop';
    this._sourceId = `source-${++context._sourceSequence}`;
  }

  get loop() { return this._loop; }
  set loop(value) { this._loop = !!value; this._transportChanged(); }

  start(when = 0, offset = 0, duration) {
    if (this._started) throw new Error('three.invalid: AudioBufferSourceNode can only be started once');
    if (!this.buffer || !this.buffer.isJsrAudioBuffer) {
      throw new Error('three.invalid: AudioBufferSourceNode requires an AudioLoader buffer');
    }
    this._started = true;
    this._stopped = false;
    this._offset = Math.max(0, finite(offset));
    this._duration = duration;
    this._delay = Math.max(0, finite(when) - this.context.currentTime);
    this.context._sources.add(this);
    this.context._queue(this);
  }

  stop(when = 0) {
    if (!this._started || this._stopped) return;
    this._stopped = true;
    this._cancelEnd();
    this.context._sources.delete(this);
    if (this._sent) {
      this._sent = false;
      this.context._send(this._stopAction || 'stop', {
        sourceId: this._sourceId,
        delay: Math.max(0, finite(when) - this.context.currentTime),
        release: true
      });
    }
  }

  _flush() {
    if (!this._started || this._stopped || this._sent || this.context.state !== 'running') return;
    this._sent = true;
    this.context._send('play', this._playPayload());
    this._scheduleEnd();
  }

  _playPayload() {
    return Object.assign(this.context._spatialPayload(this), {
      sourceId: this._sourceId,
      data: encodeBase64(this.buffer.data),
      mime: this.buffer.mime,
      offset: this._offset,
      duration: this._duration,
      delay: this._delay,
      loop: this._loop,
      playbackRate: this._effectiveRate()
    });
  }

  _effectiveRate() {
    return Math.max(0.0001, this.playbackRate.value * Math.pow(2, this.detune.value / 1200));
  }

  _transportChanged() {
    if (!this._sent || this._stopped) return;
    this.context._send('update', Object.assign(this.context._spatialPayload(this), {
      sourceId: this._sourceId,
      loop: this._loop,
      playbackRate: this._effectiveRate()
    }));
    this._scheduleEnd();
  }

  _spatialChanged() {
    if (!this._sent || this._stopped) return;
    this.context._send('update', Object.assign(this.context._spatialPayload(this), {
      sourceId: this._sourceId,
      loop: this._loop,
      playbackRate: this._effectiveRate()
    }));
  }

  _scheduleEnd() {
    this._cancelEnd();
    if (!this._sent || this._loop || typeof ROOT.setTimeout !== 'function') return;
    const duration = this._duration === undefined ? this.buffer.duration : this._duration;
    if (!(duration > 0)) return;
    const remaining = Math.max(0, duration - this._offset) / this._effectiveRate() + this._delay;
    this._delay = 0;
    this._endTimer = ROOT.setTimeout(() => this._finish(), Math.min(2147483647, remaining * 1000));
  }

  _finish() {
    this._endTimer = null;
    if (!this._sent || this._stopped) return;
    this._sent = false;
    this._stopped = true;
    this.context._sources.delete(this);
    this.context._send('dispose', { sourceId: this._sourceId });
    if (typeof this.onended === 'function') this.onended();
  }

  _cancelEnd() {
    if (this._endTimer !== null && typeof ROOT.clearTimeout === 'function') ROOT.clearTimeout(this._endTimer);
    this._endTimer = null;
  }
}

class NativeMediaElementSourceNode extends NativeBufferSourceNode {
  constructor(context, element) {
    super(context);
    this.kind = 'mediaElementSource';
    this.element = element;
    this._loadPromise = null;
    this._sourceId = `media-${++context._sourceSequence}`;
    element._jsrNativePlay = () => this.start(0, finite(element.currentTime));
    element._jsrNativePause = () => this.stop(0);
    if (element._jsrMediaPlaying) this.start(0, finite(element.currentTime));
  }

  start(when = 0, offset = 0) {
    if (this._started && !this._stopped) return Promise.resolve();
    this._started = true;
    this._stopped = false;
    this._offset = Math.max(0, finite(offset));
    this._delay = Math.max(0, finite(when) - this.context.currentTime);
    this.context._sources.add(this);
    this.context._queue(this);
    return Promise.resolve();
  }

  stop() {
    this._stopAction = 'pause';
    if (this._sent) {
      this._sent = false;
      this.context._send('pause', { sourceId: this._sourceId, delay: 0, release: false });
    }
    this._stopped = true;
    this._cancelEnd();
    this.context._sources.delete(this);
  }

  _flush() {
    if (this.buffer) {
      super._flush();
      return;
    }
    if (this._loadPromise || typeof this.element._jsrAudioLoad !== 'function') {
      if (typeof this.element._jsrAudioLoad !== 'function') {
        this.context._report(new Error('three.assetFailure: native audio element has no registered source'));
      }
      return;
    }
    this._loadPromise = Promise.resolve(this.element._jsrAudioLoad()).then(record => {
      this.buffer = audioBuffer(this.context, record.bytes || record.data, record.mime);
      this._loadPromise = null;
      this.context._queue(this);
    }).catch(error => {
      this._loadPromise = null;
      this.context._report(error);
    });
  }

  _playPayload() {
    return Object.assign(super._playPayload(), { loop: !!this.element.loop });
  }

  _transportChanged() {
    if (this.buffer) super._transportChanged();
  }
}

class NativeOscillatorNode extends NativeBufferSourceNode {
  constructor(context) {
    super(context);
    this.kind = 'oscillator';
    this._type = 'sine';
    this.frequency = new NativeAudioParam(context, 440, () => this._frequencyChanged());
    this.loop = true;
  }

  get type() { return this._type; }
  set type(value) {
    if (!['sine', 'square', 'sawtooth', 'triangle'].includes(value)) {
      throw new TypeError('three.invalid: OscillatorNode type');
    }
    this._type = value;
    this._frequencyChanged();
  }

  start(when = 0) {
    this._replaceWave();
    super.start(when, 0);
  }

  _frequencyChanged() {
    if (!this._started || this._stopped) return;
    this._replaceWave();
    this._sent = false;
    this.context._queue(this);
  }

  _replaceWave() {
    this.buffer = audioBuffer(this.context, synthesizeWave(this.frequency.value, this._type), 'audio/wav');
  }
}

function synthesizeWave(frequency, type) {
  const sampleRate = 22050;
  const pcmLength = sampleRate * 2;
  const bytes = new Uint8Array(44 + pcmLength);
  const view = new DataView(bytes.buffer);
  writeAscii(bytes, 0, 'RIFF');
  view.setUint32(4, bytes.length - 8, true);
  writeAscii(bytes, 8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(bytes, 36, 'data');
  view.setUint32(40, pcmLength, true);
  const hz = clamp(Math.abs(finite(frequency, 440)), 1, sampleRate / 2);
  for (let index = 0; index < sampleRate; index++) {
    const phase = (index * hz / sampleRate) % 1;
    let sample = Math.sin(phase * Math.PI * 2);
    if (type === 'square') sample = phase < 0.5 ? 1 : -1;
    else if (type === 'sawtooth') sample = phase * 2 - 1;
    else if (type === 'triangle') sample = 1 - 4 * Math.abs(phase - 0.5);
    view.setInt16(44 + index * 2, Math.round(clamp(sample, -1, 1) * 32767), true);
  }
  return bytes;
}

function writeAscii(bytes, offset, value) {
  for (let index = 0; index < value.length; index++) bytes[offset + index] = value.charCodeAt(index);
}

export class NativeAudioContext {
  constructor(runtime) {
    this.runtime = runtime;
    this.contextId = ++contextSequence;
    this.state = 'suspended';
    this.sampleRate = 48000;
    this.baseLatency = 0;
    this.outputLatency = 0;
    this._time = 0;
    this._runningSince = 0;
    this._resumePromise = null;
    this._sourceSequence = 0;
    this._sources = new Set();
    this._queueScheduled = false;
    this._refreshScheduled = false;
    this._analyserWarned = false;
    this.hasAudioGraph = false;
    this.destination = new NativeAudioNode(this, 'destination');
    this.destination.maxChannelCount = 2;
    this.listener = new NativeListener(this);
  }

  get currentTime() {
    return this.state === 'running'
      ? this._time + Math.max(0, clockMs() - this._runningSince) / 1000
      : this._time;
  }

  createGain() { this.hasAudioGraph = true; return new NativeGainNode(this); }
  createPanner() { return new NativePannerNode(this); }
  createAnalyser() { return new NativeAnalyserNode(this); }
  createBufferSource() { return new NativeBufferSourceNode(this); }
  createOscillator() { return new NativeOscillatorNode(this); }
  createMediaElementSource(element) {
    if (!element) throw new TypeError('three.invalid: media element is required');
    return new NativeMediaElementSourceNode(this, element);
  }
  createMediaStreamSource() {
    return unsupported('mediaStreamAudio', 'native THREE supports encoded buffers and registered media elements');
  }

  decodeAudioData(data, successCallback, errorCallback) {
    return Promise.resolve().then(() => audioBuffer(this, data)).then(buffer => {
      if (typeof successCallback === 'function') successCallback(buffer);
      return buffer;
    }).catch(error => {
      if (typeof errorCallback === 'function') errorCallback(error);
      throw error;
    });
  }

  resume() {
    if (this.state === 'running') return Promise.resolve();
    if (this._resumePromise) return this._resumePromise;
    this._resumePromise = this._call('resume', {}).then(() => {
      this._runningSince = clockMs();
      this.state = 'running';
      this._refresh();
      for (const source of this._sources) this._queue(source);
    }).finally(() => {
      this._resumePromise = null;
    });
    return this._resumePromise;
  }

  close() {
    for (const source of Array.from(this._sources)) source.stop();
    this.state = 'closed';
    return this._call('disposeEngine', {});
  }

  _queue() {
    if (this._queueScheduled) return;
    this._queueScheduled = true;
    Promise.resolve().then(() => {
      this._queueScheduled = false;
      for (const source of Array.from(this._sources)) source._flush();
    });
  }

  _refresh() {
    if (this._refreshScheduled) return;
    this._refreshScheduled = true;
    Promise.resolve().then(() => {
      this._refreshScheduled = false;
      for (const source of this._sources) source._spatialChanged();
    });
  }

  _send(action, payload) {
    const promise = this._call(action, payload);
    promise.catch(error => this._report(error));
    return promise;
  }

  _call(action, payload) {
    const jsr = this.runtime && this.runtime.jsr;
    if (!jsr || typeof jsr.hostCall !== 'function') {
      return Promise.reject(new Error('three.unsupported: audio requires jsr.hostCall and a three.audio media host'));
    }
    return Promise.resolve(jsr.hostCall(CHANNEL, Object.assign({
      engineId: this.runtime.engineId,
      action
    }, payload)));
  }

  _report(error) {
    if (ROOT.console && typeof ROOT.console.error === 'function') ROOT.console.error(error);
  }

  _warnAnalyser() {
    if (this._analyserWarned) return;
    this._analyserWarned = true;
    if (ROOT.console && typeof ROOT.console.warn === 'function') {
      ROOT.console.warn('three: native AnalyserNode FFT is unavailable; frequency/time-domain data is explicitly zero-filled.');
    }
  }

  _spatialPayload(source) {
    let volume = 0;
    let balance = 0;
    const visited = new Set();
    const walk = (node, gain, panned) => {
      if (visited.has(node)) return;
      visited.add(node);
      if (node === this.destination) {
        volume += gain;
        balance = panned;
        return;
      }
      for (const output of node.outputs) {
        if (output.kind === 'gain') walk(output, gain * output.gain.value, panned);
        else if (output.kind === 'panner') {
          const spatial = this._pannerSpatial(output);
          walk(output, gain * spatial.volume, spatial.balance);
        } else walk(output, gain, panned);
      }
      visited.delete(node);
    };
    walk(source, 1, 0);
    return { volume: clamp(volume, 0, 1), balance: clamp(balance, -1, 1) };
  }

  _pannerSpatial(panner) {
    const listener = this.listener;
    const dx = panner.positionX.value - listener.positionX.value;
    const dy = panner.positionY.value - listener.positionY.value;
    const dz = panner.positionZ.value - listener.positionZ.value;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    let attenuation = distanceAttenuation(panner, distance);
    attenuation *= coneAttenuation(panner, listener, dx, dy, dz);
    const right = listenerRight(listener);
    const balance = distance > 0
      ? (dx * right[0] + dy * right[1] + dz * right[2]) / distance
      : 0;
    return { volume: attenuation, balance };
  }
}

function distanceAttenuation(panner, distance) {
  const reference = Math.max(0.000001, panner.refDistance);
  const rolloff = Math.max(0, panner.rolloffFactor);
  if (panner.distanceModel === 'linear') {
    const maximum = Math.max(reference, panner.maxDistance);
    if (maximum === reference) return distance <= reference ? 1 : 0;
    return clamp(1 - rolloff * (distance - reference) / (maximum - reference), 0, 1);
  }
  if (panner.distanceModel === 'exponential') {
    return Math.pow(Math.max(distance, reference) / reference, -rolloff);
  }
  return reference / (reference + rolloff * (Math.max(distance, reference) - reference));
}

function coneAttenuation(panner, listener, dx, dy, dz) {
  if (panner.coneInnerAngle >= 360 || panner.coneOuterAngle >= 360) return 1;
  const sourceLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const ox = panner.orientationX.value;
  const oy = panner.orientationY.value;
  const oz = panner.orientationZ.value;
  const orientationLength = Math.sqrt(ox * ox + oy * oy + oz * oz);
  if (sourceLength === 0 || orientationLength === 0) return 1;
  // Source -> listener, compared with the source orientation (WebAudio spec).
  const dot = clamp((-dx * ox - dy * oy - dz * oz) / (sourceLength * orientationLength), -1, 1);
  const angle = Math.acos(dot) * 180 / Math.PI;
  const inner = panner.coneInnerAngle / 2;
  const outer = panner.coneOuterAngle / 2;
  if (angle <= inner) return 1;
  if (angle >= outer) return panner.coneOuterGain;
  const fraction = (angle - inner) / Math.max(0.000001, outer - inner);
  return 1 + fraction * (panner.coneOuterGain - 1);
}

function listenerRight(listener) {
  const fx = listener.forwardX.value;
  const fy = listener.forwardY.value;
  const fz = listener.forwardZ.value;
  const ux = listener.upX.value;
  const uy = listener.upY.value;
  const uz = listener.upZ.value;
  const x = fy * uz - fz * uy;
  const y = fz * ux - fx * uz;
  const z = fx * uy - fy * ux;
  const length = Math.sqrt(x * x + y * y + z * z) || 1;
  return [x / length, y / length, z / length];
}

function installPauseTransport() {
  const prototype = UpstreamAudio.prototype;
  if (prototype.pause.__jsrNativeAudio) return;
  const upstreamPause = prototype.pause;
  const pause = function(...args) {
    const source = this.source;
    if (source && source.kind === 'bufferSource') source._stopAction = 'pause';
    try {
      return upstreamPause.apply(this, args);
    } finally {
      if (source && source.kind === 'bufferSource') source._stopAction = 'stop';
    }
  };
  Object.defineProperty(pause, '__jsrNativeAudio', { value: true });
  prototype.pause = pause;
}

/// Installs the WebAudio-compatible nodes beneath the real upstream Audio,
/// AudioListener and PositionalAudio classes. No facade copies their API.
export function installNativeAudio(runtime) {
  if (runtime._nativeAudioContext) return runtime._nativeAudioContext;
  const context = new NativeAudioContext(runtime);
  Object.defineProperty(runtime, '_nativeAudioContext', { value: context });
  UpstreamAudioContext.setContext(context);
  installPauseTransport();
  return context;
}
