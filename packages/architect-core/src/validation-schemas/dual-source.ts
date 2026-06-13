/**
 * @architect
 * @architect-pattern DualSourceSchemas
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:validation-schemas
 * @architect-uses DomainEnumSchemas, DeliverableStatusDomain, StatusValueDomain
 */
import { z } from 'zod';

import {
  DELIVERABLE_STATUS_VALUES,
  HIERARCHY_LEVELS,
  type AcceptedStatusValue,
  type HierarchyLevel as TaxonomyHierarchyLevel,
  type ProcessStatusValue,
} from '../taxonomy/index.js';
import { AcceptedStatusSchema } from '../domain-enums.js';

export type ProcessStatus = ProcessStatusValue;
export type AcceptedStatus = AcceptedStatusValue;

export const HierarchyLevelSchema = z.enum(HIERARCHY_LEVELS);
export type HierarchyLevel = TaxonomyHierarchyLevel;

export const ProcessMetadataSchema = z.strictObject({
  pattern: z.string().min(1),
  status: AcceptedStatusSchema,
  level: HierarchyLevelSchema.default('phase'),
  parent: z.string().optional(),
  team: z.string().optional(),
  workflow: z.string().optional(),
  productArea: z.string().optional(),
});

export type ProcessMetadata = z.infer<typeof ProcessMetadataSchema>;

export const DeliverableSchema = z.strictObject({
  name: z.string().min(1),
  status: z.enum(DELIVERABLE_STATUS_VALUES),
  tests: z.number().int().nonnegative(),
  location: z.string(),
  finding: z.string().optional(),
});

export type Deliverable = z.infer<typeof DeliverableSchema>;

export const ValidationSummarySchema = z.strictObject({
  isValid: z.boolean(),
  errors: z.array(z.string()).readonly(),
  warnings: z.array(z.string()).readonly(),
});

export type ValidationSummary = z.infer<typeof ValidationSummarySchema>;
