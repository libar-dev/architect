/**
 * @architect
 * @architect-core @architect-config
 * @architect-pattern ProjectConfigTypes
 * @architect-status active
 * @architect-arch-layer domain
 * @architect-arch-context config
 * @architect-uses ConfigurationTypes, ConfigurationPresets
 * @architect-used-by DefineConfig, ConfigLoader
 * @architect-extract-shapes ArchitectProjectConfig, SourcesConfig, OutputConfig, GeneratorSourceOverride, ResolvedConfig, ResolvedProjectConfig, ResolvedSourcesConfig
 *
 * ## Project Configuration Types
 *
 * Unified project configuration for the Architect package.
 * Replaces the fragmented system where taxonomy, source discovery,
 * and output config lived in three disconnected layers.
 *
 * ### Architecture
 *
 * ```
 * defineConfig() → raw ArchitectProjectConfig
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
 * - Define project config in `architect.config.ts` or `architect.config.js`
 * - Internal resolution via `resolveProjectConfig()`
 * - CLI override merging
 */

import type { PresetName } from './presets.js';
import type { ArchitectConfig, ArchitectInstance } from './types.js';
import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';
import type { FormatType } from '../taxonomy/index.js';
// ═══ Cross-Layer Imports: config → renderable ═══════════════════════════════
// Project configuration declares which reference documents to generate,
// requiring knowledge of renderer capability types (ReferenceDocConfig,
// CodecOptions). This is intentional — moving these types to a shared location
// would force renderable to import its own types from config (worse direction).
// See also: src/config/project-config-schema.ts (Zod schema uses
// DIAGRAM_SOURCE_VALUES and SectionBlockSchema from renderable).
// ═════════════════════════════════════════════════════════════════════════════
import type { ReferenceDocConfig } from '../renderable/codecs/reference.js';
import type { CodecOptions } from '../renderable/generate.js';

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
   * Stubs are TypeScript files that live outside `src/` (e.g., `architect/stubs/`).
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
  /** Output directory for generated docs (default: 'docs-live') */
  readonly directory?: string;
  /** Overwrite existing files (default: false) */
  readonly overwrite?: boolean;
}

/**
 * Regeneration command for documentation footer.
 */
export interface RegenerationCommand {
  /** Human-readable label (e.g., "Regenerate all docs") */
  readonly label: string;
  /** Shell command (e.g., "pnpm docs:all") */
  readonly command: string;
}

/**
 * Project identity metadata for generated documentation.
 *
 * Used by codecs (via CodecContext) to customize hardcoded project-specific
 * values like package name, purpose, and license in generated docs.
 * Falls back to package.json auto-read or hardcoded defaults when absent.
 */
export interface ProjectMetadata {
  /** Package name (e.g., "@libar-dev/architect") */
  readonly name?: string;
  /** One-line purpose description */
  readonly purpose?: string;
  /** License type (e.g., "MIT") */
  readonly license?: string;
  /** Package version */
  readonly version?: string;
  /** Regeneration commands for doc footer */
  readonly regeneration?: {
    readonly commands: readonly RegenerationCommand[];
    readonly note?: string;
  };
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
 * ### Mutual Exclusivity
 *
 * `replaceFeatures` and `additionalFeatures` are mutually exclusive when both are
 * non-empty. This constraint is enforced at runtime by the Zod `.refine()` in
 * {@link GeneratorSourceOverrideSchema} (in `project-config-schema.ts`).
 *
 * The TypeScript type intentionally permits both fields to coexist because
 * `mergeSourcesForGenerator()` treats an empty `replaceFeatures: []` as "no replace",
 * falling through to `additionalFeatures`. Encoding this length-dependent semantics
 * via `never` would reject valid runtime states.
 */
export interface GeneratorSourceOverride {
  /** Additional feature file globs appended to base features */
  readonly additionalFeatures?: readonly string[];
  /** Additional TypeScript globs appended to base TypeScript sources */
  readonly additionalInput?: readonly string[];
  /**
   * Feature globs used INSTEAD of base features.
   * Mutually exclusive with non-empty `additionalFeatures`.
   * @see GeneratorSourceOverrideSchema for runtime validation
   */
  readonly replaceFeatures?: readonly string[];
  /** Override output directory for this generator */
  readonly outputDirectory?: string;
}

/**
 * Unified project configuration for Architect.
 *
 * This is the shape users provide in `architect.config.ts` or `architect.config.js`.
 * `defineConfig()` is an identity function providing type safety.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@libar-dev/architect/config';
 *
 * export default defineConfig({
 *   preset: 'ddd-es-cqrs',
 *   sources: {
 *     typescript: ['packages/* /src/** /*.ts'],
 *     features: ['architect/specs/** /*.feature'],
 *     stubs: ['architect/stubs/** /*.ts'],
 *   },
 *   output: { directory: 'docs-living', overwrite: true },
 * });
 * ```
 */
export interface ArchitectProjectConfig {
  // --- Taxonomy ---

  /** Use a preset taxonomy configuration */
  readonly preset?: PresetName;

  /** Custom tag prefix (overrides preset, e.g., '@architect-') */
  readonly tagPrefix?: string;

  /** Custom file opt-in tag (overrides preset, e.g., '@architect') */
  readonly fileOptInTag?: string;

  /** Custom categories (replaces preset categories entirely) */
  readonly categories?: ArchitectConfig['categories'];

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

  // --- Project Identity ---

  /** Project metadata for customizing generated docs (package name, purpose, license) */
  readonly project?: ProjectMetadata;

  /** Override format type examples in TaxonomyCodec output */
  readonly tagExampleOverrides?: Partial<
    Record<FormatType, { description?: string; example?: string }>
  >;

  // --- Codec Options ---

  /**
   * Per-codec options for fine-tuning document generation.
   * Keys match codec names (e.g., 'business-rules', 'patterns').
   * Passed through to codec factories at generation time.
   */
  readonly codecOptions?: CodecOptions;

  // --- Reference Documents ---

  /**
   * Reference document configurations for convention-based doc generation.
   * Each config defines one reference document's content composition via
   * convention tags, shape selectors, behavior categories, and diagram scopes.
   *
   * When not specified, no reference generators are registered.
   * Import `LIBAR_REFERENCE_CONFIGS` from the generators module
   * to use the built-in set.
   */
  readonly referenceDocConfigs?: readonly ReferenceDocConfig[];
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
  /** Per-codec options for document generation (empty if none) */
  readonly codecOptions?: CodecOptions;
  /** Reference document configurations (empty array if none) */
  readonly referenceDocConfigs: readonly ReferenceDocConfig[];
  /** Project metadata (auto-read from package.json if not provided) */
  readonly project?: ProjectMetadata;
  /** Format type example overrides */
  readonly tagExampleOverrides?: Partial<
    Record<FormatType, { description?: string; example?: string }>
  >;
}

/**
 * Fully resolved configuration combining the taxonomy instance
 * and the project-level config.
 *
 * This is the primary type consumed by the orchestrator and CLIs.
 *
 * Discriminated union on `isDefault`:
 * - `isDefault: true` means no config file was found; `configPath` is `undefined`.
 * - `isDefault: false` means a config file was loaded; `configPath` is a `string`.
 */
export type ResolvedConfig =
  | {
      /** The taxonomy instance (registry + regexBuilders) */
      readonly instance: ArchitectInstance;
      /** The resolved project config with defaults applied */
      readonly project: ResolvedProjectConfig;
      /** Config was generated from defaults (no config file found) */
      readonly isDefault: true;
      /** No config file path when using defaults */
      readonly configPath?: undefined;
    }
  | {
      /** The taxonomy instance (registry + regexBuilders) */
      readonly instance: ArchitectInstance;
      /** The resolved project config with defaults applied */
      readonly project: ResolvedProjectConfig;
      /** Config was loaded from a file */
      readonly isDefault: false;
      /** Path to the config file that was loaded */
      readonly configPath: string;
    };
