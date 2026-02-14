/**
 * Configuration Module
 *
 * Unified project configuration for delivery-process. Use `defineConfig()` in
 * `delivery-process.config.ts` to centralize taxonomy, sources, output, and
 * generator overrides.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@libar-dev/delivery-process/config';
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
 * import { loadProjectConfig } from '@libar-dev/delivery-process/config';
 *
 * // Programmatic loading
 * const result = await loadProjectConfig(process.cwd());
 * if (result.ok) {
 *   const { instance, project } = result.value;
 * }
 * ```
 */
export { createDeliveryProcess, type CreateDeliveryProcessOptions } from './factory.js';
export type { DeliveryProcessConfig, DeliveryProcessInstance, RegexBuilders } from './types.js';
export { createRegexBuilders } from './regex-builders.js';
export { DEFAULT_TAG_PREFIX, DEFAULT_FILE_OPT_IN_TAG, DEFAULT_REGEX_BUILDERS } from './defaults.js';
export { GENERIC_PRESET, LIBAR_GENERIC_PRESET, DDD_ES_CQRS_PRESET, PRESETS, type PresetName, } from './presets.js';
export { loadConfig, loadProjectConfig, applyProjectSourceDefaults, findConfigFile, formatConfigError, type ConfigDiscoveryResult, type ConfigLoadError, type ConfigLoadResult, type ProjectConfigLoadResult, } from './config-loader.js';
export { loadWorkflowConfig, loadWorkflowFromPath, loadDefaultWorkflow, formatWorkflowLoadError, type WorkflowLoadError, type LoadedWorkflow, type WorkflowConfig, } from './workflow-loader.js';
export { defineConfig } from './define-config.js';
export type { DeliveryProcessProjectConfig, SourcesConfig, OutputConfig, GeneratorSourceOverride, ResolvedConfig, ResolvedProjectConfig, ResolvedSourcesConfig, } from './project-config.js';
export { DeliveryProcessProjectConfigSchema, SourcesConfigSchema, OutputConfigSchema, GeneratorSourceOverrideSchema, isProjectConfig, isLegacyInstance, } from './project-config-schema.js';
export { resolveProjectConfig, createDefaultResolvedConfig } from './resolve-config.js';
export { mergeSourcesForGenerator } from './merge-sources.js';
export type { ReferenceDocConfig, DiagramScope } from '../renderable/codecs/reference.js';
export type { ShapeSelector } from '../renderable/codecs/shape-matcher.js';
//# sourceMappingURL=index.d.ts.map