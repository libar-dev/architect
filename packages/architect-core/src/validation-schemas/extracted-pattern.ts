import { z } from 'zod';

import { ADR_CATEGORY_VALUES, ADR_STATUS_VALUES, QUARTER_PATTERN } from '../taxonomy/index.js';
import { asPatternId, asSourceFilePath } from '../types/branded.js';
import { slugify } from '../utils/string-utils.js';
import { DocDirectiveSchema, PatternStatusSchema } from './doc-directive.js';
import { DeliverableSchema, HierarchyLevelSchema } from './dual-source.js';
import { ExportInfoSchema } from './export-info.js';
import { ExtractedShapeSchema } from './extracted-shape.js';
import { PatternIdentifierSchema, PatternReferenceSchema } from './pattern-contract.js';
import { ScenarioRefSchema } from './scenario-ref.js';

export const BusinessRuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  scenarioCount: z.number().int().nonnegative(),
  scenarioNames: z.array(z.string()).readonly(),
  tags: z.array(z.string()).readonly().optional(),
});

export type BusinessRule = z.infer<typeof BusinessRuleSchema>;

const PatternIdSchema = z
  .string()
  .regex(/^pattern-[a-f0-9]{8}$/, 'Pattern ID must match format: pattern-{8-char-hex}')
  .transform((id) => asPatternId(id));

const RoleTagSchema = z
  .string()
  .min(1, 'Role tag cannot be empty')
  .transform((name) => name.toLowerCase())
  .refine((name) => /^[a-z0-9-]+$/.test(name), {
    message: 'Role tag must contain only lowercase letters, numbers, and hyphens',
  });

const SourceFilePathSchema = z
  .string()
  .min(1, 'File path cannot be empty')
  .refine(
    (path) => path.endsWith('.ts') || path.endsWith('.feature') || path.endsWith('.feature.md'),
    {
      message:
        'Source file must be a TypeScript file (.ts) or Gherkin feature file (.feature or .feature.md)',
    },
  )
  .transform((path) => asSourceFilePath(path));

export const SourceInfoSchema = z.strictObject({
  file: SourceFilePathSchema,
  lines: z
    .tuple([
      z.number().int().positive('Start line must be positive'),
      z.number().int().positive('End line must be positive'),
    ])
    .refine(([start, end]) => end >= start, {
      message: 'End line must be >= start line',
    })
    .readonly(),
});

export type SourceInfo = z.output<typeof SourceInfoSchema>;

const ExtractedPatternBaseSchema = z.strictObject({
  id: PatternIdSchema,
  name: PatternIdentifierSchema.refine((name) => slugify(name).length > 0, {
    message: 'Pattern name must produce a non-empty slug (at least one alphanumeric character)',
  }),
  role: RoleTagSchema.optional(),
  unlockReason: z.string().optional(),
  directive: DocDirectiveSchema,
  code: z.string(),
  source: SourceInfoSchema,
  exports: z.array(ExportInfoSchema).readonly().default([]),
  extractedAt: z.iso.datetime({ error: 'Must be valid ISO 8601 timestamp' }),
  patternName: PatternIdentifierSchema.optional(),
  status: PatternStatusSchema,
  boundedContext: z.string().optional(),
  useCases: z.array(z.string()).readonly().optional(),
  whenToUse: z.array(z.string()).readonly().optional(),
  uses: z.array(PatternReferenceSchema).readonly().optional(),
  scenarios: z.array(ScenarioRefSchema).readonly().optional(),
  phase: z.number().int().positive().optional(),
  release: z.string().optional(),
  implementsPatterns: z.array(z.string()).readonly().optional(),
  extendsPattern: z.string().optional(),
  targetPath: z.string().optional(),
  since: z.string().optional(),
  executableSpecs: z.array(z.string()).readonly().optional(),
  convention: z.array(z.string()).readonly().optional(),
  seeAlso: z.array(z.string()).readonly().optional(),
  apiRef: z.array(z.string()).readonly().optional(),
  quarter: z.string().regex(QUARTER_PATTERN).optional(),
  completed: z.string().optional(),
  effort: z.string().optional(),
  effortActual: z.string().optional(),
  team: z.string().optional(),
  productArea: z.string().optional(),
  userRole: z.string().optional(),
  businessValue: z.string().optional(),
  deliverables: z.array(DeliverableSchema).readonly().optional(),
  workflow: z.string().optional(),
  risk: z.string().optional(),
  priority: z.string().optional(),
  level: HierarchyLevelSchema.optional(),
  parent: z.string().optional(),
  children: z.array(z.string()).readonly().optional(),
  discoveredGaps: z.array(z.string()).readonly().optional(),
  discoveredImprovements: z.array(z.string()).readonly().optional(),
  discoveredRisks: z.array(z.string()).readonly().optional(),
  discoveredLearnings: z.array(z.string()).readonly().optional(),
  constraints: z.array(z.string()).readonly().optional(),
  adr: z.string().optional(),
  adrStatus: z.enum(ADR_STATUS_VALUES).optional(),
  adrCategory: z.enum(ADR_CATEGORY_VALUES).optional(),
  adrTheme: z.string().optional(),
  adrLayer: z.string().optional(),
  adrSupersedes: z.string().optional(),
  adrSupersededBy: z.string().optional(),
  title: z.string().optional(),
  behaviorFile: z.string().optional(),
  behaviorFileVerified: z.boolean().optional(),
  rules: z.array(BusinessRuleSchema).readonly().optional(),
  include: z.array(z.string().min(1)).readonly().optional(),
  extractedShapes: z.array(ExtractedShapeSchema).readonly().optional(),
});

export const ExtractedPatternSchema = ExtractedPatternBaseSchema;

export type ExtractedPattern = z.output<typeof ExtractedPatternBaseSchema>;

export function isExtractedPattern(value: unknown): value is ExtractedPattern {
  return ExtractedPatternSchema.safeParse(value).success;
}
