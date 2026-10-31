import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

const nativeAudioPath = new URL('../src/native_audio.js', import.meta.url).pathname;
const bundled = await build({
  stdin: {
    contents: `export * from '/tmp/jsr-three-r186/src/Three.js'; export * from '${nativeAudioPath}';`,
    resolveDir: process.cwd(),
    sourcefile: 'native-audio-test-entry.js'
  },
  bundle: true,
  write: false,
  format: 'esm',
  plugins: [{
    name: 'test-three',
    setup(builder) {
      builder.onResolve({ filter: /^three$/ }, () => ({ path: '/tmp/jsr-three-r186/src/Three.js' }));
    }
  }]
});
const native = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const {
  Audio,
  AudioListener,
  AudioLoader,
  AudioContext: UpstreamAudioContext,
  FileLoader,
  PositionalAudio,
  installNativeAudio,
} = native;

function fakeHost() {
  const calls = [];
  UpstreamAudioContext.setContext(null);
  const runtime = {
    engineId: 'fake-engine',
    jsr: {
      hostCall(name, args) {
        calls.push({ name, args });
        return { ok: true };
      }
    }
  };
  return { calls, runtime, context: installNativeAudio(runtime) };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

function close(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
}

test('bounded WebAudio nodes and AudioContext state', async () => {
  const { calls, context } = fakeHost();
  assert.equal(context.state, 'suspended');
  assert.equal(context.destination.context, context);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.25, 0);
  assert.equal(gain.gain.value, 0.25);
  gain.gain.linearRampToValueAtTime(0.75, 1);
  assert.equal(gain.gain.value, 0.75);
  gain.connect(context.destination);
  gain.disconnect();
  const panner = context.createPanner();
  assert.equal(panner.maxDistance, 10000);
  assert.equal(panner.panningModel, 'equalpower');
  panner.setPosition(1, 2, 3);
  panner.setOrientation(0, 0, -1);
  assert.equal(panner.positionX.value, 1);
  panner.positionY.setTargetAtTime(4, 0, 1);
  assert.equal(panner.positionY.value, 4);
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  const bins = new Float32Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(new Uint8Array(bins.length));
  analyser.getFloatTimeDomainData(bins);
  assert.ok(bins.every((v) => v === 0));
  analyser.getFloatFrequencyData(bins);
  assert.ok(bins.every((v) => v === 0));
  assert.equal(context.createBufferSource().playbackRate.value, 1);
  await context.resume();
  assert.equal(context.state, 'running');
  assert.ok(context.currentTime >= 0);
  assert.equal(calls[0].name, 'three.audio');
  assert.equal(calls[0].args.action, 'resume');
  await context.close();
  assert.equal(context.state, 'closed');
  assert.equal(calls.at(-1).args.action, 'disposeEngine');
});

test('upstream Audio API emits play/update/pause/stop transport', async () => {
  const { calls, context } = fakeHost();
  const listener = new AudioListener();
  const sound = new Audio(listener);
  sound.setBuffer(await context.decodeAudioData(new Uint8Array([1, 2, 3])));
  sound.setVolume(0.5).setLoop(true).setPlaybackRate(1.25);
  await context.resume();
  sound.play();
  await flush();
  const play = calls.find((call) => call.args.action === 'play');
  assert.ok(play);
  assert.equal(play.args.loop, true);
  assert.equal(play.args.playbackRate, 1.25);
  assert.equal(play.args.volume, 0.5);
  assert.equal(sound.isPlaying, true);
  assert.equal(sound.getOutput(), sound.gain);
  assert.equal(listener.getInput(), listener.gain);
  sound.setVolume(0.2);
  await flush();
  assert.equal(calls.at(-1).args.action, 'update');
  close(calls.at(-1).args.volume, 0.2);
  sound.pause();
  assert.equal(sound.isPlaying, false);
  assert.equal(calls.at(-1).args.action, 'pause');
  sound.play();
  await flush();
  assert.equal(calls.filter((call) => call.args.action === 'play').length, 2);
  sound.stop();
  assert.equal(sound.isPlaying, false);
  assert.equal(calls.at(-1).args.action, 'stop');
  listener.setMasterVolume(0.5);
  assert.equal(listener.getMasterVolume(), 0.5);
});

test('positional inverse, linear, exponential, cone and stereo pan formulas', async () => {
  const { context } = fakeHost();
  const listener = new AudioListener();
  const sound = new PositionalAudio(listener);
  sound.setBuffer(await context.decodeAudioData(new Uint8Array([1, 2, 3])));
  sound.play();
  listener.updateMatrixWorld(true);
  sound.position.set(6, 0, 0);
  sound.setRefDistance(2).setMaxDistance(10).setRolloffFactor(1);
  sound.updateMatrixWorld(true);
  assert.equal(sound.panner.positionX.value, 6);
  assert.equal(listener.context.listener.positionX.value, 0);
  sound.setDistanceModel('inverse');
  close(context._pannerSpatial(sound.panner).volume, 1 / 3);
  close(context._pannerSpatial(sound.panner).balance, 1);
  sound.setDistanceModel('linear');
  close(context._pannerSpatial(sound.panner).volume, 0.5);
  sound.setDistanceModel('exponential').setRolloffFactor(2);
  close(context._pannerSpatial(sound.panner).volume, 1 / 9);
  sound.position.set(0, 0, 2);
  sound.setRefDistance(1).setRolloffFactor(1).setDistanceModel('inverse');
  sound.setDirectionalCone(60, 120, 0.1);
  sound.updateMatrixWorld(true);
  close(context._pannerSpatial(sound.panner).volume, 0.05);
  close(context._pannerSpatial(sound.panner).balance, 0);
});

test('autoplay is gated until resume and then flushes the queued source', async () => {
  const { calls, context } = fakeHost();
  const listener = new AudioListener();
  const sound = new Audio(listener);
  sound.setBuffer(await context.decodeAudioData(new Uint8Array([1, 2, 3])));
  sound.play();
  await flush();
  assert.equal(calls.length, 0);
  await context.resume();
  await flush();
  assert.deepEqual(calls.map((call) => call.args.action), ['resume', 'play']);
});

test('missing media host rejects resume explicitly', async () => {
  UpstreamAudioContext.setContext(null);
  const context = installNativeAudio({ engineId: 'none', jsr: {} });
  await assert.rejects(context.resume(), /hostCall/);
});

test('AudioLoader preserves upstream callback and error contracts', async () => {
  fakeHost();
  const original = FileLoader.prototype.load;
  FileLoader.prototype.load = function(url, onLoad) {
    queueMicrotask(() => onLoad(new Uint8Array([1, 2, 3, 4]).buffer));
    return this;
  };
  try {
    const loaded = await new Promise((resolve, reject) => {
      new AudioLoader().load('fake.mp3', resolve, undefined, reject);
    });
    assert.equal(loaded.isJsrAudioBuffer, true);
    assert.deepEqual(Array.from(loaded.data), [1, 2, 3, 4]);
    assert.equal(loaded.mime, 'application/octet-stream');
  } finally {
    FileLoader.prototype.load = original;
  }
  const context = UpstreamAudioContext.getContext();
  let callbackError;
  await assert.rejects(context.decodeAudioData(new ArrayBuffer(0), () => {}, (error) => {
    callbackError = error;
  }));
  assert.match(callbackError.message, /encoded audio/);
});
