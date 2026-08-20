/**
 * @architect
 * @architect-pattern ProjectConfigContract
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:configuration
 * @architect-uses ArchitectConfigContract, ContextInference, PackageMatcherContract, FormatTypeDomain, TagRegistrySchemas
 */
import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';
import type { PackageConfig } from '../package/index.js';
import type { FormatType } from '../taxonomy/format-types.js';
import type { RoleDefinition } from '../validation-schemas/tag-registry.js';
import type { ArchitectInstance } from './types.js';

export interface SourcesConfig {
  readonly typescript: readonly string[];
  readonly features?: readonly string[];
  readonly stubs?: readonly string[];
  readonly exclude?: readonly string[];
}

export interface ResolvedSourcesConfig {
  readonly typescript: readonly string[];
  readonly features: readonly string[];
  readonly exclude: readonly string[];
}

export interface OutputConfig {
  readonly directory?: string;
  readonly overwrite?: boolean;
}

export interface RegenerationCommand {
  readonly label: string;
  readonly command: string;
}

export interface ProjectMetadata {
  readonly name?: string;
  readonly purpose?: string;
  readonly license?: string;
  readonly version?: string;
  readonly regeneration?: {
    readonly commands: readonly RegenerationCommand[];
    readonly note?: string;
  };
}

export interface GeneratorSourceOverride {
  readonly additionalFeatures?: readonly string[];
  readonly additionalInput?: readonly string[];
  readonly replaceFeatures?: readonly string[];
  readonly outputDirectory?: string;
}

export interface ArchitectProjectConfig {
  readonly tagPrefix?: string;
  readonly fileOptInTag?: string;
  readonly roles?: readonly RoleDefinition[];
  readonly productAreas?: readonly string[];
  readonly sources?: SourcesConfig;
  readonly output?: OutputConfig;
  readonly generators?: readonly string[];
  readonly generatorOverrides?: Readonly<Record<string, GeneratorSourceOverride>>;
  readonly contextInferenceRules?: readonly ContextInferenceRule[];
  readonly workflowPath?: string;
  readonly project?: ProjectMetadata;
  readonly tagExampleOverrides?: Partial<
    Record<FormatType, { description?: string; example?: string }>
  >;
  readonly packages?: readonly PackageConfig[];
}

export interface ResolvedProjectConfig {
  readonly sources: ResolvedSourcesConfig;
  readonly output: Readonly<Required<OutputConfig>>;
  readonly generators: readonly string[];
  readonly generatorOverrides: Readonly<Record<string, GeneratorSourceOverride>>;
  readonly contextInferenceRules: readonly ContextInferenceRule[];
  readonly workflowPath: string | null;
  readonly project?: ProjectMetadata;
  readonly tagExampleOverrides?: Partial<
    Record<FormatType, { description?: string; example?: string }>
  >;
  readonly packages: readonly PackageConfig[];
}

export type ResolvedConfig =
  | {
      readonly instance: ArchitectInstance;
      readonly project: ResolvedProjectConfig;
      readonly isDefault: true;
      readonly configPath?: undefined;
    }
  | {
      readonly instance: ArchitectInstance;
      readonly project: ResolvedProjectConfig;
      readonly isDefault: false;
      readonly configPath: string;
    };
