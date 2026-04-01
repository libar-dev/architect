/**
 * @architect
 * @architect-core @architect-config
 * @architect-pattern ConfigResolver
 * @architect-status active
 * @architect-arch-layer application
 * @architect-arch-context config
 * @architect-arch-role service
 * @architect-uses ProjectConfigTypes, ArchitectFactory, ConfigurationDefaults
 * @architect-used-by ConfigLoader
 *
 * ## Config Resolution
 *
 * Resolves a raw `ArchitectProjectConfig` into a fully-resolved `ResolvedConfig`
 * with all defaults applied, stubs merged into TypeScript sources, and context inference
 * rules prepended to defaults.
 *
 * ### Architecture
 *
 * ```
 * ArchitectProjectConfig (user-authored)
 *     |
 *     v
 * resolveProjectConfig() -- creates instance, merges sources, applies defaults
 *     |
 *     v
 * ResolvedConfig { instance, project, isDefault, configPath }
 * ```
 *
 * ### When to Use
 *
 * - Called by `loadProjectConfig()` after Zod validation succeeds
 * - Called directly in tests to resolve a config without file I/O
 * - `createDefaultResolvedConfig()` provides a fallback when no config file exists
 */

import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';
import type {
  ArchitectProjectConfig,
  GeneratorSourceOverride,
  ResolvedConfig,
  ResolvedProjectConfig,
  ResolvedSourcesConfig,
} from './project-config.js';
import type { ArchitectInstance } from './types.js';

import { DEFAULT_CONTEXT_INFERENCE_RULES } from './defaults.js';
import { createArchitect, type CreateArchitectOptions } from './factory.js';

/**
 * Resolves a raw project config into a fully-resolved config with all defaults applied.
 *
 * Resolution steps:
 * 1. Create taxonomy instance from preset/override fields
 * 2. Merge stub globs into TypeScript sources
 * 3. Apply output defaults (directory, overwrite)
 * 4. Default generators to `['patterns']`
 * 5. Prepend user context inference rules before defaults
 * 6. Carry forward remaining fields with defaults
 *
 * @param raw - The raw project configuration (post-Zod validation)
 * @param options - Optional resolution options
 * @returns Fully resolved configuration ready for use by orchestrator and CLIs
 */
export function resolveProjectConfig(
  raw: ArchitectProjectConfig,
  options: { readonly configPath: string }
): ResolvedConfig {
  // 1. Create taxonomy instance from preset/override fields
  const instanceOptions: CreateArchitectOptions = {};
  if (raw.preset !== undefined) {
    instanceOptions.preset = raw.preset;
  }
  if (raw.tagPrefix !== undefined) {
    instanceOptions.tagPrefix = raw.tagPrefix;
  }
  if (raw.fileOptInTag !== undefined) {
    instanceOptions.fileOptInTag = raw.fileOptInTag;
  }
  if (raw.categories !== undefined) {
    instanceOptions.categories = raw.categories;
  }
  const instance: ArchitectInstance = createArchitect(instanceOptions);

  // 2. Resolve sources — merge stubs into typescript
  const typescript: readonly string[] = [
    ...(raw.sources?.typescript ?? []),
    ...(raw.sources?.stubs ?? []),
  ];
  const features: readonly string[] = raw.sources?.features ?? [];
  const exclude: readonly string[] = raw.sources?.exclude ?? [];

  const sources: ResolvedSourcesConfig = {
    typescript,
    features,
    exclude,
  };

  // 3. Resolve output — apply defaults
  const output: Readonly<Required<{ directory: string; overwrite: boolean }>> = {
    directory: raw.output?.directory ?? 'docs-live',
    overwrite: raw.output?.overwrite ?? false,
  };

  // 4. Resolve generators — default to ['patterns']
  const generators: readonly string[] = raw.generators ?? ['patterns'];

  // 5. Resolve context inference rules — prepend user rules to defaults
  const contextInferenceRules: readonly ContextInferenceRule[] = [
    ...(raw.contextInferenceRules ?? []),
    ...DEFAULT_CONTEXT_INFERENCE_RULES,
  ];

  // 6. Copy remaining fields with defaults
  const generatorOverrides: Readonly<Record<string, GeneratorSourceOverride>> =
    raw.generatorOverrides ?? {};
  const workflowPath: string | null = raw.workflowPath ?? null;

  // 7. Reference document configs (explicit opt-in, empty by default)
  const referenceDocConfigs = raw.referenceDocConfigs ?? [];

  const project: ResolvedProjectConfig = {
    sources,
    output,
    generators,
    generatorOverrides,
    contextInferenceRules,
    workflowPath,
    ...(raw.codecOptions !== undefined && { codecOptions: raw.codecOptions }),
    referenceDocConfigs,
    ...(raw.project !== undefined && { project: raw.project }),
    ...(raw.tagExampleOverrides !== undefined && { tagExampleOverrides: raw.tagExampleOverrides }),
  };

  return {
    instance,
    project,
    isDefault: false,
    configPath: options.configPath,
  };
}

/**
 * Creates a default resolved config for when no config file is found.
 *
 * Uses the libar-generic preset with empty sources and standard defaults.
 * The `isDefault` flag is set to `true` so consumers can detect that
 * no user config was loaded.
 *
 * @returns A default ResolvedConfig with empty sources and standard defaults
 */
export function createDefaultResolvedConfig(): ResolvedConfig {
  const instance: ArchitectInstance = createArchitect();

  const sources: ResolvedSourcesConfig = {
    typescript: [],
    features: [],
    exclude: [],
  };

  const project: ResolvedProjectConfig = {
    sources,
    output: {
      directory: 'docs-live',
      overwrite: false,
    },
    generators: ['patterns'],
    generatorOverrides: {},
    contextInferenceRules: [...DEFAULT_CONTEXT_INFERENCE_RULES],
    workflowPath: null,
    referenceDocConfigs: [],
  };

  return {
    instance,
    project,
    isDefault: true,
    configPath: undefined,
  };
}
