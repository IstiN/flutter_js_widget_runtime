// MediaPipe's WASM/GPU runtime and camera model are intentionally not bundled.
// Resolve the official initialization contract and retain the static Face Cap
// mesh, morph GUI, neutral pose and native animation loop.
console.warn('three: MediaPipe webcam tracking is unavailable offline; rendering the Face Cap model at its neutral pose with the existing video fallback.');
export const FilesetResolver = {
  forVisionTasks() { return { boundedStaticFallback: true }; }
};
export const FaceLandmarker = {
  createFromOptions() {
    return {
      detectForVideo() { return { faceBlendshapes: [], facialTransformationMatrixes: [] }; },
      close() {}
    };
  }
};
