/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ProjectConfigSchema
 * @libar-docs-status active
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
 */

import { z } from 'zod';

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
    replaceFeatures: GlobArraySchema.optional(),
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

    // Advanced
    contextInferenceRules: z.array(ContextInferenceRuleSchema).readonly().optional(),
    workflowPath: z.string().min(1).optional(),
  })
  .strict();

/**
 * Type guard for raw project config objects.
 *
 * Used by `loadProjectConfig()` to distinguish between:
 * - New-style `DeliveryProcessProjectConfig` (has `sources`, `preset`, `output`, etc.)
 * - Legacy `DeliveryProcessInstance` (has `registry` + `regexBuilders`)
 */
export function isProjectConfig(value: unknown): boolean {
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
export function isLegacyInstance(value: unknown): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return 'registry' in obj && 'regexBuilders' in obj;
}
