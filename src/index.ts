/**
 * @libar-dev/modular-claude-md
 *
 * Modular CLAUDE.md generator - build context-specific AI coding instructions
 * with additive composition for Claude Code's --add-dir feature.
 *
 * @example
 * ```typescript
 * import {
 *   loadMetadata,
 *   buildVariationContent,
 *   generateAllAdditiveLayers,
 *   validateMetadata,
 * } from '@libar-dev/modular-claude-md';
 *
 * // Load configuration
 * const metadata = loadMetadata('_claude-md/metadata.json');
 *
 * // Build a variation
 * const content = buildVariationContent(metadata, metadata.variations[0], '_claude-md');
 *
 * // Validate configuration
 * const { valid, errors } = validateMetadata(metadata, '_claude-md', '.');
 * ```
 *
 * @module @libar-dev/modular-claude-md
 */

// Types
export type {
  Metadata,
  DocumentMeta,
  Preamble,
  Section,
  Subsection,
  Variation,
  AdditiveVariation,
  BuildResult,
  ValidationResult,
  BuilderConfig,
} from "./types.js";

// Builder functions
export { loadMetadata, readModule, moduleExists, validateMetadata } from "./builder/loader.js";

export {
  subsectionMatchesTags,
  subsectionMatchesVariation,
  subsectionMatchesAdditive,
  sectionHasMatchingContent,
  getMatchingSubsections,
  countMatchingModules,
} from "./builder/matcher.js";

export { transformPaths, transformAdditiveLayerPaths } from "./builder/transformer.js";

export { buildVariationContent, buildAdditiveContent } from "./builder/renderer.js";

// Additive mode
export {
  generateAdditiveLayer,
  generateAllAdditiveLayers,
  getAdditiveLayer,
} from "./additive/generator.js";

export {
  generateManifestEntries,
  generateManifestContent,
  writeManifest,
  type ManifestEntry,
} from "./additive/manifest.js";

// Utilities
export { estimateTokens } from "./utils/tokens.js";
export {
  writeVariationFile,
  getVariationOutputPath,
  getAdditiveOutputPath,
  createBuildResult,
} from "./utils/writer.js";
export { log, logSection, colors, formatStatus, type ColorName } from "./utils/colors.js";

// Info command helpers
export {
  getModuleLines,
  getModuleHeadings,
  collectAllTags,
  getMatchingModules,
  validateModuleStructure,
  type HeadingInfo,
  type StructureIssue,
} from "./info/helpers.js";
