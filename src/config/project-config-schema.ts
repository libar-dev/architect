/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ProjectConfigSchema
 * @libar-docs-status active
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-arch-context config
 * @libar-docs-arch-role infrastructure
 * @libar-docs-uses ProjectConfigTypes
 * @libar-docs-used-by ConfigLoader
 *
 * ## Project Configuration Schema
 *
 * Zod validation schema for `DeliveryProcessProjectConfig`.
 * Validates at load time (not at `defineConfig()` call time)
 * following the Vite/Vitest identity-function convention.
 *
 * ### Validation Rules
 *
 * - At least one TypeScript source glob when `sources` is provided
 * - No parent directory traversal in glob patterns (security)
 * - Preset name must be one of the known presets
 * - `replaceFeatures` and `additionalFeatures` are mutually exclusive
 *
 * **When to Use:** When loading and validating project configuration from `delivery-process.config.ts` at startup.
 */

import { z } from 'zod';
import type { DeliveryProcessProjectConfig } from './project-config.js';
import type { DeliveryProcessInstance } from './types.js';
import { DIAGRAM_SOURCE_VALUES } from '../renderable/codecs/reference.js';
import { SectionBlockSchema } from '../renderable/schema.js';

/**
 * Glob pattern validation — replicates the security rules from
 * `src/validation-schemas/config.ts` without importing to avoid
 * circular dependencies (that module imports from types that
 * depend on config).
 */
const GlobPatternSchema = z
  .string()
  .min(1, 'Glob pattern cannot be empty')
  .refine((pattern) => !pattern.includes('..'), {
    message: 'Glob patterns cannot contain parent directory traversal (..)',
  });

const GlobArraySchema = z.array(GlobPatternSchema).readonly();

/**
 * Schema for source file configuration.
 */
export const SourcesConfigSchema = z
  .object({
    typescript: z
      .array(GlobPatternSchema)
      .min(1, 'At least one TypeScript source glob is required')
      .readonly(),
    features: GlobArraySchema.optional(),
    stubs: GlobArraySchema.optional(),
    exclude: GlobArraySchema.optional(),
  })
  .strict();

/**
 * Schema for output configuration.
 */
export const OutputConfigSchema = z
  .object({
    directory: z.string().min(1, 'Output directory cannot be empty').optional(),
    overwrite: z.boolean().optional(),
  })
  .strict();

/**
 * Schema for per-generator source overrides.
 */
export const GeneratorSourceOverrideSchema = z
  .object({
    additionalFeatures: GlobArraySchema.optional(),
    additionalInput: GlobArraySchema.optional(),
    replaceFeatures: z
      .array(GlobPatternSchema)
      .min(1, 'replaceFeatures must have at least one pattern; omit the field to use base features')
      .readonly()
      .optional(),
    outputDirectory: z.string().min(1).optional(),
  })
  .strict()
  .refine(
    (override) => {
      // replaceFeatures and additionalFeatures are mutually exclusive
      const hasReplace =
        override.replaceFeatures !== undefined && override.replaceFeatures.length > 0;
      const hasAdditional =
        override.additionalFeatures !== undefined && override.additionalFeatures.length > 0;
      return !(hasReplace && hasAdditional);
    },
    {
      message:
        'replaceFeatures and additionalFeatures are mutually exclusive — use one or the other',
    }
  );

/**
 * Schema for context inference rules.
 */
const ContextInferenceRuleSchema = z
  .object({
    pattern: z.string().min(1),
    context: z.string().min(1),
  })
  .strict();

/**
 * Known preset names.
 */
const PresetNameSchema = z.enum(['generic', 'libar-generic', 'ddd-es-cqrs']);

/**
 * Schema for scoped diagram filter configuration.
 * Patterns matching the filter become diagram nodes; neighbors appear with distinct style.
 */
const DiagramScopeSchema = z
  .object({
    archContext: z.array(z.string().min(1)).readonly().optional(),
    patterns: z.array(z.string().min(1)).readonly().optional(),
    include: z.array(z.string().min(1)).readonly().optional(),
    archLayer: z.array(z.string().min(1)).readonly().optional(),
    direction: z.enum(['TB', 'LR']).optional(),
    title: z.string().min(1).optional(),
    diagramType: z
      .enum(['graph', 'sequenceDiagram', 'stateDiagram-v2', 'C4Context', 'classDiagram'])
      .optional(),
    showEdgeLabels: z.boolean().optional(),
    source: z.enum(DIAGRAM_SOURCE_VALUES).optional(),
  })
  .strict();

/**
 * Schema for reference document configuration.
 * Each config defines one reference document's content composition.
 */
const ReferenceDocConfigSchema = z
  .object({
    title: z.string().min(1),
    conventionTags: z.array(z.string().min(1)).readonly(),
    shapeSources: z.array(GlobPatternSchema).readonly(),
    behaviorCategories: z.array(z.string().min(1)).readonly(),
    diagramScope: DiagramScopeSchema.optional(),
    diagramScopes: z.array(DiagramScopeSchema).readonly().optional(),
    claudeMdSection: z.string().min(1),
    docsFilename: z.string().min(1),
    claudeMdFilename: z.string().min(1),
    // DD-6: Fine-grained shape selectors (structural discriminated union)
    shapeSelectors: z
      .array(
        z.union([
          z.object({ group: z.string().min(1) }).strict(),
          z
            .object({
              source: GlobPatternSchema,
              names: z.array(z.string().min(1)).readonly(),
            })
            .strict(),
          z.object({ source: GlobPatternSchema }).strict(),
        ])
      )
      .readonly()
      .optional(),
    // DD-1 (CrossCuttingDocumentInclusion): Include-tag values for cross-cutting content routing
    includeTags: z.array(z.string().min(1)).readonly().optional(),
    // Product area filter (ADR-001): pre-filters all content sources by product area
    productArea: z.string().min(1).optional(),
    // DD-4 (GeneratedDocQuality): render shapes section before conventions
    shapesFirst: z.boolean().optional(),
    // Exclude patterns by source path prefix (e.g., ephemeral planning specs)
    excludeSourcePaths: z.array(z.string().min(1)).readonly().optional(),
    // Static preamble sections prepended before all generated content
    preamble: z.array(SectionBlockSchema).readonly().optional(),
  })
  .strict();

/**
 * Full project configuration schema.
 *
 * Validated at config load time by `loadProjectConfig()`.
 * The `defineConfig()` identity function does NOT validate —
 * it only provides TypeScript type checking.
 */
export const DeliveryProcessProjectConfigSchema = z
  .object({
    // Taxonomy
    preset: PresetNameSchema.optional(),
    tagPrefix: z.string().min(1).optional(),
    fileOptInTag: z.string().min(1).optional(),
    categories: z
      .array(
        z
          .object({
            tag: z.string().min(1),
            domain: z.string().min(1),
            priority: z.number().int().positive(),
            description: z.string(),
            aliases: z.array(z.string()).readonly(),
          })
          .strict()
      )
      .readonly()
      .optional(),

    // Sources
    sources: SourcesConfigSchema.optional(),

    // Output
    output: OutputConfigSchema.optional(),

    // Generators
    generators: z.array(z.string().min(1)).readonly().optional(),
    generatorOverrides: z.record(z.string(), GeneratorSourceOverrideSchema).optional(),

    // Codec Options
    codecOptions: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),

    // Advanced
    contextInferenceRules: z.array(ContextInferenceRuleSchema).readonly().optional(),
    workflowPath: z.string().min(1).optional(),

    // Reference Documents
    referenceDocConfigs: z.array(ReferenceDocConfigSchema).readonly().optional(),
  })
  .strict();

/**
 * Type guard for raw project config objects.
 *
 * Used by `loadProjectConfig()` to distinguish between:
 * - New-style `DeliveryProcessProjectConfig` (has `sources`, `preset`, `output`, etc.)
 * - Legacy `DeliveryProcessInstance` (has `registry` + `regexBuilders`)
 */
export function isProjectConfig(value: unknown): value is DeliveryProcessProjectConfig {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  // New-style config has at least one of these top-level fields
  return (
    'sources' in obj ||
    'preset' in obj ||
    'output' in obj ||
    'generators' in obj ||
    'generatorOverrides' in obj
  );
}

/**
 * Type guard for legacy DeliveryProcessInstance objects.
 */
export function isLegacyInstance(value: unknown): value is DeliveryProcessInstance {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return 'registry' in obj && 'regexBuilders' in obj;
}

// ---------------------------------------------------------------------------
// Compile-time assertion: Zod schema output must be assignable to the interface.
// If this line errors, the schema and interface have drifted out of sync.
// ---------------------------------------------------------------------------

type _ZodOutput = z.output<typeof DeliveryProcessProjectConfigSchema>;

// Bidirectional key-set check: both types must have the same top-level keys.
// This catches added/removed fields without fighting readonly/refine variance.
type _AssertSameKeys = keyof _ZodOutput extends keyof DeliveryProcessProjectConfig
  ? keyof DeliveryProcessProjectConfig extends keyof _ZodOutput
    ? true
    : {
        error: 'Interface has keys not in Zod schema';
        extra: Exclude<keyof DeliveryProcessProjectConfig, keyof _ZodOutput>;
      }
  : {
      error: 'Zod schema has keys not in interface';
      extra: Exclude<keyof _ZodOutput, keyof DeliveryProcessProjectConfig>;
    };

const _schemaKeyCheck: _AssertSameKeys = true;

// Field-level assignability for simple scalar fields (preset, tagPrefix, etc.).
// Complex fields (sources, output, generatorOverrides) have known readonly/refine
// variance between Zod output and the interface — the `as DeliveryProcessProjectConfig`
// cast in loadProjectConfig() bridges this gap safely since Zod validates at runtime.
type _AssertScalarFields = _ZodOutput['preset'] extends DeliveryProcessProjectConfig['preset']
  ? _ZodOutput['tagPrefix'] extends DeliveryProcessProjectConfig['tagPrefix']
    ? _ZodOutput['fileOptInTag'] extends DeliveryProcessProjectConfig['fileOptInTag']
      ? _ZodOutput['workflowPath'] extends DeliveryProcessProjectConfig['workflowPath']
        ? true
        : { error: 'workflowPath drift' }
      : { error: 'fileOptInTag drift' }
    : { error: 'tagPrefix drift' }
  : { error: 'preset drift' };

const _scalarCheck: _AssertScalarFields = true;
