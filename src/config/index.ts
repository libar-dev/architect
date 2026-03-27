/**
 * Configuration Module
 *
 * Unified project configuration for Architect. Use `defineConfig()` in
 * `architect.config.ts` to centralize taxonomy, sources, output, and
 * generator overrides.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@libar-dev/architect/config';
 *
 * // Unified config file
 * export default defineConfig({
 *   preset: 'ddd-es-cqrs',
 *   sources: { typescript: ['src/** /*.ts'] },
 *   output: { directory: 'docs-generated', overwrite: true },
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { loadProjectConfig } from '@libar-dev/architect/config';
 *
 * // Programmatic loading
 * const result = await loadProjectConfig(process.cwd());
 * if (result.ok) {
 *   const { instance, project } = result.value;
 * }
 * ```
 */

// Factory function
export { createArchitect, type CreateArchitectOptions } from './factory.js';

// Types
export type { ArchitectConfig, ArchitectInstance, RegexBuilders } from './types.js';

// Regex builders (for advanced use cases)
export { createRegexBuilders } from './regex-builders.js';

// Default constants (for internal use and backward compatibility)
export { DEFAULT_TAG_PREFIX, DEFAULT_FILE_OPT_IN_TAG, DEFAULT_REGEX_BUILDERS } from './defaults.js';

// Presets
export {
  GENERIC_PRESET,
  LIBAR_GENERIC_PRESET,
  DDD_ES_CQRS_PRESET,
  PRESETS,
  type PresetName,
} from './presets.js';

// Config file discovery and loading
export {
  loadConfig,
  loadProjectConfig,
  applyProjectSourceDefaults,
  findConfigFile,
  formatConfigError,
  type ConfigDiscoveryResult,
  type ConfigLoadError,
  type ConfigLoadResult,
  type ProjectConfigLoadResult,
} from './config-loader.js';

export {
  loadWorkflowFromPath,
  loadDefaultWorkflow,
  formatWorkflowLoadError,
  type WorkflowLoadError,
  type LoadedWorkflow,
  type WorkflowConfig,
} from './workflow-loader.js';

// Unified project configuration
export { defineConfig } from './define-config.js';
export type {
  ArchitectProjectConfig,
  SourcesConfig,
  OutputConfig,
  GeneratorSourceOverride,
  ResolvedConfig,
  ResolvedProjectConfig,
  ResolvedSourcesConfig,
} from './project-config.js';
export {
  ArchitectProjectConfigSchema,
  SourcesConfigSchema,
  OutputConfigSchema,
  GeneratorSourceOverrideSchema,
  isProjectConfig,
} from './project-config-schema.js';

// Config resolution and source merging
export { resolveProjectConfig, createDefaultResolvedConfig } from './resolve-config.js';
export { mergeSourcesForGenerator } from './merge-sources.js';

// Reference document configuration types (for downstream repos)
export type { ReferenceDocConfig, DiagramScope } from '../renderable/codecs/reference.js';
export type { ShapeSelector } from '../renderable/codecs/shape-matcher.js';
