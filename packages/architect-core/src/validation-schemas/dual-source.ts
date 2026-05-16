import { z } from 'zod';

import {
  DELIVERABLE_STATUS_VALUES,
  HIERARCHY_LEVELS,
  QUARTER_PATTERN,
  RISK_LEVELS,
  type AcceptedStatusValue,
  type HierarchyLevel as TaxonomyHierarchyLevel,
  type ProcessStatusValue,
  type RiskLevel as TaxonomyRiskLevel,
} from '../taxonomy/index.js';
import { AcceptedStatusSchema } from '../domain-enums.js';

export type ProcessStatus = ProcessStatusValue;
export type AcceptedStatus = AcceptedStatusValue;

export const HierarchyLevelSchema = z.enum(HIERARCHY_LEVELS);
export type HierarchyLevel = TaxonomyHierarchyLevel;

export const RiskLevelSchema = z.enum(RISK_LEVELS);
export type RiskLevel = TaxonomyRiskLevel;

export const ProcessMetadataSchema = z.strictObject({
  pattern: z.string().min(1),
  phase: z.number().int().positive(),
  status: AcceptedStatusSchema,
  level: HierarchyLevelSchema.default('phase'),
  parent: z.string().optional(),
  quarter: z.string().regex(QUARTER_PATTERN).optional(),
  effort: z.string().optional(),
  team: z.string().optional(),
  workflow: z.string().optional(),
  completed: z.string().optional(),
  effortActual: z.string().optional(),
  risk: RiskLevelSchema.optional(),
  productArea: z.string().optional(),
  userRole: z.string().optional(),
  businessValue: z.string().optional(),
});

export type ProcessMetadata = z.infer<typeof ProcessMetadataSchema>;

export const DeliverableSchema = z.strictObject({
  name: z.string().min(1),
  status: z.enum(DELIVERABLE_STATUS_VALUES),
  tests: z.number().int().nonnegative(),
  location: z.string(),
  finding: z.string().optional(),
  release: z.string().optional(),
});

export type Deliverable = z.infer<typeof DeliverableSchema>;

export const CrossValidationErrorSchema = z.strictObject({
  codeName: z.string(),
  featureName: z.string(),
  codePhase: z.number().int().positive().optional(),
  featurePhase: z.number().int().positive(),
  sources: z.strictObject({
    code: z.string(),
    feature: z.string(),
  }),
  message: z.string(),
});

export type CrossValidationError = z.infer<typeof CrossValidationErrorSchema>;

export const ValidationSummarySchema = z.strictObject({
  isValid: z.boolean(),
  errors: z.array(z.string()).readonly(),
  warnings: z.array(z.string()).readonly(),
});

export type ValidationSummary = z.infer<typeof ValidationSummarySchema>;
