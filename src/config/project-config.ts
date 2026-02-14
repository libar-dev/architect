/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ProjectConfigTypes
 * @libar-docs-status active
 * @libar-docs-uses ConfigurationTypes, ConfigurationPresets
 * @libar-docs-used-by DefineConfig, ConfigLoader
 * @libar-docs-extract-shapes DeliveryProcessProjectConfig, SourcesConfig, OutputConfig, GeneratorSourceOverride, ResolvedConfig, ResolvedProjectConfig, ResolvedSourcesConfig
 *
 * ## Project Configuration Types
 *
 * Unified project configuration for the delivery-process package.
 * Replaces the fragmented system where taxonomy, source discovery,
 * and output config lived in three disconnected layers.
 *
 * ### Architecture
 *
 * ```
 * defineConfig() → raw DeliveryProcessProjectConfig
 *     ↓
 * loadProjectConfig() → validates (Zod) → resolveProjectConfig()
 *     ↓
 * ResolvedConfig { instance, project }
 *     ↓
 * mergeSourcesForGenerator() → per-generator effective sources
 * ```
 *
 * ### When to Use
 *
 * - Define project config in `delivery-process.config.ts`
 * - Internal resolution via `resolveProjectConfig()`
 * - CLI override merging
 */

import type { PresetName } from './presets.js';
import type { DeliveryProcessConfig, DeliveryProcessInstance } from './types.js';
import type { ContextInferenceRule } from '../generators/pipeline/transform-dataset.js';

/**
 * Source glob configuration for the project.
 * Centralizes what previously lived in CLI --input/--features flags.
 */
export interface SourcesConfig {
  /** Glob patterns for TypeScript source files (replaces --input) */
  readonly typescript: readonly string[];

  /**
   * Glob patterns for Gherkin feature files (replaces --features).
   * Includes both `.feature` and `.feature.md` files.
   */
  readonly features?: readonly string[];

  /**
   * Glob patterns for design stub files.
   * Stubs are TypeScript files that live outside `src/` (e.g., `delivery-process/stubs/`).
   * Merged into TypeScript sources at resolution time.
   */
  readonly stubs?: readonly string[];

  /** Glob patterns to exclude from all scanning */
  readonly exclude?: readonly string[];
}

/**
 * Resolved sources config where all optional fields have been applied with defaults.
 */
export interface ResolvedSourcesConfig {
  /** TypeScript source globs (includes merged stubs) */
  readonly typescript: readonly string[];
  /** Gherkin feature file globs */
  readonly features: readonly string[];
  /** Glob patterns to exclude from scanning */
  readonly exclude: readonly string[];
}

/**
 * Output configuration for generated documentation.
 */
export interface OutputConfig {
  /** Output directory for generated docs (default: 'docs/architecture') */
  readonly directory?: string;
  /** Overwrite existing files (default: false) */
  readonly overwrite?: boolean;
}

/**
 * Generator-specific source overrides.
 *
 * Some generators need different sources than the base config.
 * For example, `changelog` needs `decisions/*.feature` and `releases/*.feature`
 * in addition to the base feature set.
 *
 * ### Override Semantics
 *
 * - `additionalFeatures` / `additionalInput`: Appended to base sources
 * - `replaceFeatures`: Used INSTEAD of base features (for generators needing a different set)
 * - `outputDirectory`: Override the base output directory for this generator
 *
 * `replaceFeatures` and `additionalFeatures` are mutually exclusive.
 * If both are set, `replaceFeatures` takes precedence.
 */
export interface GeneratorSourceOverride {
  /** Additional feature file globs appended to base features */
  readonly additionalFeatures?: readonly string[];
  /** Additional TypeScript globs appended to base TypeScript sources */
  readonly additionalInput?: readonly string[];
  /** Feature globs used INSTEAD of base features (mutually exclusive with additionalFeatures) */
  readonly replaceFeatures?: readonly string[];
  /** Override output directory for this generator */
  readonly outputDirectory?: string;
}

/**
 * Unified project configuration for delivery-process.
 *
 * This is the shape users provide in `delivery-process.config.ts`.
 * `defineConfig()` is an identity function providing type safety.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@libar-dev/delivery-process/config';
 *
 * export default defineConfig({
 *   preset: 'ddd-es-cqrs',
 *   sources: {
 *     typescript: ['packages/* /src/** /*.ts'],
 *     features: ['delivery-process/specs/** /*.feature'],
 *     stubs: ['delivery-process/stubs/** /*.ts'],
 *   },
 *   output: { directory: 'docs-living', overwrite: true },
 * });
 * ```
 */
export interface DeliveryProcessProjectConfig {
  // --- Taxonomy ---

  /** Use a preset taxonomy configuration */
  readonly preset?: PresetName;

  /** Custom tag prefix (overrides preset, e.g., '@docs-') */
  readonly tagPrefix?: string;

  /** Custom file opt-in tag (overrides preset, e.g., '@docs') */
  readonly fileOptInTag?: string;

  /** Custom categories (replaces preset categories entirely) */
  readonly categories?: DeliveryProcessConfig['categories'];

  // --- Sources ---

  /** Source file glob configuration */
  readonly sources?: SourcesConfig;

  // --- Output ---

  /** Output configuration for generated docs */
  readonly output?: OutputConfig;

  // --- Generators ---

  /** Default generator names to run when CLI doesn't specify --generators */
  readonly generators?: readonly string[];

  /** Per-generator source and output overrides */
  readonly generatorOverrides?: Readonly<Record<string, GeneratorSourceOverride>>;

  // --- Advanced ---

  /** Rules for auto-inferring bounded context from file paths */
  readonly contextInferenceRules?: readonly ContextInferenceRule[];

  /** Path to custom workflow config JSON (relative to config file) */
  readonly workflowPath?: string;
}

/**
 * Fully resolved project configuration with all defaults applied.
 */
export interface ResolvedProjectConfig {
  /** Resolved source globs (stubs merged, defaults applied) */
  readonly sources: ResolvedSourcesConfig;
  /** Resolved output config with all defaults */
  readonly output: Readonly<Required<OutputConfig>>;
  /** Default generator names */
  readonly generators: readonly string[];
  /** Per-generator source overrides */
  readonly generatorOverrides: Readonly<Record<string, GeneratorSourceOverride>>;
  /** Context inference rules (user rules prepended to defaults) */
  readonly contextInferenceRules: readonly ContextInferenceRule[];
  /** Workflow config path (null if not specified) */
  readonly workflowPath: string | null;
}

/**
 * Fully resolved configuration combining the taxonomy instance
 * and the project-level config.
 *
 * This is the primary type consumed by the orchestrator and CLIs.
 */
export interface ResolvedConfig {
  /** The taxonomy instance (registry + regexBuilders) */
  readonly instance: DeliveryProcessInstance;
  /** The resolved project config with defaults applied */
  readonly project: ResolvedProjectConfig;
  /** Whether the config was loaded from a file or generated from defaults */
  readonly isDefault: boolean;
  /** Path to the config file, if one was found */
  readonly configPath: string | undefined;
}
