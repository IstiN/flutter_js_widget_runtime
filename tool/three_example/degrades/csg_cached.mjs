import { Evaluator as BaseEvaluator } from '../vendor/three-bvh-csg/index.mjs';
import { createBoundedCSGEvaluator } from 'three';

export * from '../vendor/three-bvh-csg/index.mjs';
export const Evaluator = createBoundedCSGEvaluator(BaseEvaluator, { relativeTransforms: false });

console.warn('three: CSG uses a bounded rigid topology cache; exact CSG refreshes on structural changes and the cached result follows the base brush transform. Relative brush animation is approximated.');
