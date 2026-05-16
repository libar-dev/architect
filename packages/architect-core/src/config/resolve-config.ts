import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';
import type {
  ArchitectProjectConfig,
  ResolvedConfig,
  ResolvedProjectConfig,
  ResolvedSourcesConfig,
} from './project-config.js';
import type { ArchitectInstance } from './types.js';

import { DEFAULT_CONTEXT_INFERENCE_RULES, DEFAULT_OUTPUT_DIRECTORY } from './defaults.js';
import { createArchitect, type CreateArchitectOptions } from './factory.js';

export function resolveProjectConfig(
  raw: ArchitectProjectConfig,
  options: { readonly configPath: string }
): ResolvedConfig {
  const instanceOptions: CreateArchitectOptions = {};
  if (raw.tagPrefix !== undefined) instanceOptions.tagPrefix = raw.tagPrefix;
  if (raw.fileOptInTag !== undefined) instanceOptions.fileOptInTag = raw.fileOptInTag;
  if (raw.roles !== undefined) instanceOptions.roles = raw.roles;
  if (raw.productAreas !== undefined) instanceOptions.productAreas = raw.productAreas;
  const instance: ArchitectInstance = createArchitect(instanceOptions);

  const sources: ResolvedSourcesConfig = {
    typescript: [...(raw.sources?.typescript ?? []), ...(raw.sources?.stubs ?? [])],
    features: raw.sources?.features ?? [],
    exclude: raw.sources?.exclude ?? [],
  };

  const project: ResolvedProjectConfig = {
    sources,
    output: {
      directory: raw.output?.directory ?? DEFAULT_OUTPUT_DIRECTORY,
      overwrite: raw.output?.overwrite ?? false,
    },
    generators: raw.generators ?? ['patterns'],
    generatorOverrides: raw.generatorOverrides ?? {},
    contextInferenceRules: [
      ...(raw.contextInferenceRules ?? []),
      ...DEFAULT_CONTEXT_INFERENCE_RULES,
    ] satisfies readonly ContextInferenceRule[],
    workflowPath: raw.workflowPath ?? null,
    ...(raw.project !== undefined && { project: raw.project }),
    ...(raw.tagExampleOverrides !== undefined && { tagExampleOverrides: raw.tagExampleOverrides }),
    packages: raw.packages ?? [],
  };

  return {
    instance,
    project,
    isDefault: false,
    configPath: options.configPath,
  };
}

export function createDefaultResolvedConfig(): ResolvedConfig {
  return {
    instance: createArchitect(),
    project: {
      sources: {
        typescript: [],
        features: [],
        exclude: [],
      },
      output: {
        directory: DEFAULT_OUTPUT_DIRECTORY,
        overwrite: false,
      },
      generators: ['patterns'],
      generatorOverrides: {},
      contextInferenceRules: DEFAULT_CONTEXT_INFERENCE_RULES,
      workflowPath: null,
      packages: [],
    },
    isDefault: true,
  };
}
