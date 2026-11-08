// ESM entry for the standalone cinematic bundle (cinematic_bundle.mjs).
// Re-exports the full deterministic-cinematic API surface used by
// example/web/cinematic_reference.html. Bundled UNminified by build.mjs;
// 'three' is aliased to the global shim at bundle time.

export {
  cinematicRandom,
  clockState,
  probeCapabilities,
  createCinematicPipeline,
  CinematicPipelineError,
  DEFAULT_PRESETS,
  PRESET_NAMES
} from './pipeline.js';

export {
  createShowcaseScene,
  updateShowcaseScene
} from './scene.js';
