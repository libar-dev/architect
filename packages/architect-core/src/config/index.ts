export { createArchitect, type CreateArchitectOptions } from './factory.js';
export { createRegexBuilders } from './regex-builders.js';
export {
  DEFAULT_CONTEXT_INFERENCE_RULES,
  DEFAULT_FILE_OPT_IN_TAG,
  DEFAULT_OUTPUT_DIRECTORY,
  DEFAULT_REGEX_BUILDERS,
  DEFAULT_TAG_PREFIX,
} from './defaults.js';
export {
  applyProjectSourceDefaults,
  findConfigFile,
  formatConfigError,
  loadConfig,
  loadProjectConfig,
  type ConfigDiscoveryResult,
  type ConfigLoadError,
  type ConfigLoadResult,
  type ProjectConfigLoadResult,
} from './config-loader.js';
export { defineConfig } from './define-config.js';
export { mergeSourcesForGenerator } from './merge-sources.js';
export { createDefaultResolvedConfig, resolveProjectConfig } from './resolve-config.js';
export {
  ARCHITECT_PACKAGE_ROLES,
  PACKAGE_SELF_HOSTING_SOURCES,
  resolveWorkspaceSources,
  WORKSPACE_TAG_REGISTRY,
} from './self-hosting.js';
export type { LoadedWorkflow, WorkflowConfig, WorkflowLoadError } from './workflow-loader.js';
export {
  formatWorkflowLoadError,
  loadDefaultWorkflow,
  loadWorkflowFromPath,
} from './workflow-loader.js';
export {
  ArchitectProjectConfigSchema,
  SourcesConfigSchema,
  OutputConfigSchema,
  GeneratorSourceOverrideSchema,
  isProjectConfig,
} from './project-config-schema.js';
export * from './block.js';
export { BUILTIN_ROLES, type RoleDefinition } from './role-constants.js';
export { DEFAULT_GENERATORS, type DefaultGenerator } from './default-generators.js';
export type { ArchitectConfig, ArchitectInstance, RegexBuilders } from './types.js';
export type {
  ArchitectProjectConfig,
  GeneratorSourceOverride,
  OutputConfig,
  ProjectMetadata,
  RegenerationCommand,
  ResolvedConfig,
  ResolvedProjectConfig,
  ResolvedSourcesConfig,
  SourcesConfig,
} from './project-config.js';
export type {
  AggregationTagDefinition,
  MetadataTagDefinition,
  TagRegistry,
} from '../validation-schemas/tag-registry.js';
