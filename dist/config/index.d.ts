/**
 * Configuration Module
 *
 * Provides the factory pattern and presets for creating delivery process instances.
 * This module enables open-sourcing by allowing users to configure their own
 * tag prefixes and taxonomies.
 *
 * @example
 * ```typescript
 * import {
 *   createDeliveryProcess,
 *   GENERIC_PRESET,
 *   DDD_ES_CQRS_PRESET
 * } from '@libar-dev/delivery-process/config';
 *
 * // Use generic preset for non-DDD projects
 * const genericDp = createDeliveryProcess({ preset: "generic" });
 *
 * // Use DDD preset with custom prefix
 * const customDp = createDeliveryProcess({
 *   preset: "ddd-es-cqrs",
 *   tagPrefix: "@my-docs-",
 *   fileOptInTag: "@my-docs"
 * });
 *
 * // Default: full DDD-ES-CQRS taxonomy
 * const defaultDp = createDeliveryProcess();
 * ```
 */
export { createDeliveryProcess, type CreateDeliveryProcessOptions } from "./factory.js";
export type { DeliveryProcessConfig, DeliveryProcessInstance, RegexBuilders } from "./types.js";
export { createRegexBuilders } from "./regex-builders.js";
export { DEFAULT_TAG_PREFIX, DEFAULT_FILE_OPT_IN_TAG, DEFAULT_REGEX_BUILDERS, } from "./defaults.js";
export { GENERIC_PRESET, LIBAR_GENERIC_PRESET, DDD_ES_CQRS_PRESET, PRESETS, type PresetName, } from "./presets.js";
export { loadConfig, findConfigFile, findConfigFileSync, formatConfigError, type ConfigDiscoveryResult, type ConfigLoadError, type ConfigLoadResult, } from "./config-loader.js";
export { loadTagRegistry, formatTagRegistryError, type TagRegistryLoadError, type TagRegistryResult, } from "./tag-registry-loader.js";
export { loadArtefactSet, listAvailableArtefactSets, formatArtefactSetError, type ArtefactSetLoadError, } from "./artefact-set-loader.js";
export { loadWorkflowConfig, loadWorkflowFromPath, loadDefaultWorkflow, formatWorkflowLoadError, getWorkflowStatusEmoji, getWorkflowStatusLabel, type WorkflowLoadError, type LoadedWorkflow, type WorkflowConfig, } from "./workflow-loader.js";
//# sourceMappingURL=index.d.ts.map