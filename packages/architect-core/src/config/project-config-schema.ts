import { z } from 'zod';

import type { ArchitectProjectConfig } from './project-config.js';
import { PackageConfigSchema } from '../package/index.js';
import { DIAGRAM_SHAPE_VALUES } from '../taxonomy/diagram-shape-values.js';
import { FORMAT_TYPES } from '../taxonomy/format-types.js';

function hasParentTraversalSegment(pattern: string): boolean {
  return /(^|[\\/])\.\.([\\/]|$)/.test(pattern);
}

const GlobPatternSchema = z
  .string()
  .min(1, 'Glob pattern cannot be empty')
  .refine((pattern) => !hasParentTraversalSegment(pattern), {
    message: 'Glob patterns cannot contain parent directory traversal (..)',
  });

const GlobArraySchema = z.array(GlobPatternSchema).readonly();

export const SourcesConfigSchema = z.strictObject({
  typescript: z
    .array(GlobPatternSchema)
    .min(1, 'At least one TypeScript source glob is required')
    .readonly(),
  features: GlobArraySchema.optional(),
  stubs: GlobArraySchema.optional(),
  exclude: GlobArraySchema.optional(),
});

export const OutputConfigSchema = z.strictObject({
  directory: z.string().min(1, 'Output directory cannot be empty').optional(),
  overwrite: z.boolean().optional(),
});

export const GeneratorSourceOverrideSchema = z
  .strictObject({
    additionalFeatures: GlobArraySchema.optional(),
    additionalInput: GlobArraySchema.optional(),
    replaceFeatures: z
      .array(GlobPatternSchema)
      .min(1, 'replaceFeatures must have at least one pattern; omit the field to use base features')
      .readonly()
      .optional(),
    outputDirectory: z.string().min(1).optional(),
  })
  .refine(
    (override) => {
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

const ContextInferenceRuleSchema = z.strictObject({
  pattern: z.string().min(1),
  context: z.string().min(1),
});

const RegenerationCommandSchema = z.strictObject({
  label: z.string().min(1),
  command: z.string().min(1),
});

const ProjectMetadataSchema = z.strictObject({
  name: z.string().min(1).optional(),
  purpose: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  regeneration: z
    .strictObject({
      commands: z.array(RegenerationCommandSchema).readonly(),
      note: z.string().optional(),
    })
    .optional(),
});

const TagExampleOverrideSchema = z.strictObject({
  description: z.string().optional(),
  example: z.string().optional(),
});

const TagExampleOverridesSchema = z
  .record(z.enum(FORMAT_TYPES), TagExampleOverrideSchema.optional())
  .optional();

const RoleDefinitionSchema = z.strictObject({
  tag: z.string().min(1),
  domain: z.string().min(1),
  priority: z.number().int().positive(),
  description: z.string().optional(),
  aliases: z.array(z.string().min(1)).readonly().optional(),
  diagramShape: z.enum(DIAGRAM_SHAPE_VALUES).optional(),
});

export const ArchitectProjectConfigSchema = z.strictObject({
  tagPrefix: z.string().min(1).optional(),
  fileOptInTag: z.string().min(1).optional(),
  roles: z.array(RoleDefinitionSchema).readonly().optional(),
  productAreas: z.array(z.string().min(1)).readonly().optional(),
  sources: SourcesConfigSchema.optional(),
  output: OutputConfigSchema.optional(),
  generators: z.array(z.string().min(1)).readonly().optional(),
  generatorOverrides: z.record(z.string(), GeneratorSourceOverrideSchema).optional(),
  project: ProjectMetadataSchema.optional(),
  tagExampleOverrides: TagExampleOverridesSchema,
  contextInferenceRules: z.array(ContextInferenceRuleSchema).readonly().optional(),
  workflowPath: z.string().min(1).optional(),
  packages: z.array(PackageConfigSchema).readonly().optional(),
});

export function isProjectConfig(value: unknown): value is ArchitectProjectConfig {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;
  const projectConfigKeys = [
    'tagPrefix',
    'fileOptInTag',
    'roles',
    'productAreas',
    'sources',
    'output',
    'generators',
    'generatorOverrides',
    'project',
    'tagExampleOverrides',
    'contextInferenceRules',
    'workflowPath',
    'packages',
  ] as const;

  return projectConfigKeys.some((key) => key in obj);
}
