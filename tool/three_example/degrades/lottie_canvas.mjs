// Bounded native-canvas Lottie transport. The pinned lottie-web distribution
// is vendored for reference, but its browser SVG/JS runtime is not QuickJS
// compatible. Preserve the animation API and CanvasTexture path with a small
// deterministic RGBA animation instead of aborting the textured mesh.
console.warn('three: lottie-web browser vector rendering is unavailable; using a bounded native-canvas animation with the official frame/transport API.');
export default {
  loadAnimation(options) {
    const data = options.animationData || {};
    const dpr = Math.max(1, Math.min(2, Number(options.rendererSettings && options.rendererSettings.dpr) || 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.min(512, Math.round((data.w || 256) * dpr)));
    canvas.height = Math.max(1, Math.min(512, Math.round((data.h || 256) * dpr)));
    const context = canvas.getContext('2d');
    const listeners = new Map();
    const first = Number(data.ip) || 0;
    const last = Number(data.op) || 60;
    const animation = {
      container: canvas,
      totalFrames: Math.max(1, last - first),
      currentFrame: 0,
      isPaused: false,
      addEventListener(type, callback) {
        const list = listeners.get(type) || [];
        list.push(callback); listeners.set(type, list);
      },
      removeEventListener(type, callback) {
        listeners.set(type, (listeners.get(type) || []).filter(item => item !== callback));
      },
      play() { animation.isPaused = false; },
      pause() { animation.isPaused = true; },
      goToAndStop(value) {
        animation.currentFrame = Math.max(0, Math.min(animation.totalFrames - 1, Number(value) || 0));
        animation.isPaused = true; draw();
      },
      destroy() { if (timer) clearInterval(timer); listeners.clear(); }
    };
    function draw() {
      const w = canvas.width, h = canvas.height;
      context.clearRect(0, 0, w, h);
      context.fillStyle = '#101528'; context.fillRect(0, 0, w, h);
      const phase = animation.currentFrame / animation.totalFrames;
      const colors = ['#32d5ff', '#8b5cf6', '#f43f5e', '#facc15'];
      for (let i = 0; i < 12; i++) {
        const x = ((i * 37 + phase * w * 2) % (w + 40)) - 20;
        const y = (i * 53) % Math.max(1, h - 16);
        context.fillStyle = colors[i % colors.length];
        context.fillRect(x, y, Math.max(8, w / 16), Math.max(8, h / 16));
      }
      for (const callback of (listeners.get('enterFrame') || []).slice()) callback({ type: 'enterFrame', currentTime: animation.currentFrame });
    }
    draw();
    const timer = setInterval(() => {
      if (animation.isPaused) return;
      animation.currentFrame = (animation.currentFrame + 1) % animation.totalFrames;
      draw();
    }, 40);
    if (timer && typeof timer.unref === 'function') timer.unref();
    return animation;
  }
};
