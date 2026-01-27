/**
 * Builder module exports.
 *
 * @module @libar-dev/modular-claude-md/builder
 */

export { loadMetadata, readModule, moduleExists, validateMetadata } from "./loader.js";
export {
  subsectionMatchesTags,
  subsectionMatchesVariation,
  subsectionMatchesAdditive,
  sectionHasMatchingContent,
  getMatchingSubsections,
  countMatchingModules,
} from "./matcher.js";
export { transformPaths, transformAdditiveLayerPaths } from "./transformer.js";
export { buildVariationContent, buildAdditiveContent } from "./renderer.js";
