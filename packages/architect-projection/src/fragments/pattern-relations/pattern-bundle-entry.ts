/**
 * @architect-bounded-context:pattern-relations
 */
import { z } from 'zod';

import { BusinessRuleSchema } from '../governance/business-rule.js';

import { PatternSummarySchema } from './pattern-summary.js';
import { PatternRelationshipsSchema } from './supporting.js';

export const BundleModeSchema = z.enum(['plan', 'design', 'implement', 'review']);
export const BundleIncludeSchema = z.enum([
  'rules',
  'scenarios',
  'deps',
  'open-questions',
  'docstring',
]);

export const BundleTokenEstimateSchema = z.strictObject({
  method: z.literal('char/4'),
  chars: z.number().int().nonnegative(),
  tokens: z.number().int().nonnegative(),
});

export const BundleScenarioDigestSchema = z.strictObject({
  ruleName: z.string(),
  scenarios: z.array(z.string()),
  count: z.number().int().nonnegative(),
});

export const BundleBlockTokenEstimateSchema = z.strictObject({
  include: BundleIncludeSchema,
  estimate: BundleTokenEstimateSchema,
});

export const PatternBundleBlocksSchema = z.strictObject({
  docstring: z.string().optional(),
  rules: z.array(BusinessRuleSchema).optional(),
  scenarios: z.array(BundleScenarioDigestSchema).optional(),
  deps: PatternRelationshipsSchema.optional(),
  openQuestions: z.array(z.string()).optional(),
});

export const PatternBundleEntrySchema = z.strictObject({
  kind: z.literal('PatternBundleEntry'),
  entryRole: z.enum(['root', 'member']),
  mode: BundleModeSchema,
  includes: z.array(BundleIncludeSchema),
  pattern: PatternSummarySchema,
  blocks: PatternBundleBlocksSchema,
  members: z.array(z.string()).optional(),
  memberCount: z.number().int().nonnegative().optional(),
  tokenEstimate: BundleTokenEstimateSchema.optional(),
  bundleTokenEstimate: BundleTokenEstimateSchema.optional(),
  blockTokenEstimates: z.array(BundleBlockTokenEstimateSchema).optional(),
});

export type BundleMode = z.infer<typeof BundleModeSchema>;
export type BundleInclude = z.infer<typeof BundleIncludeSchema>;
export type BundleTokenEstimate = z.infer<typeof BundleTokenEstimateSchema>;
export type BundleScenarioDigest = z.infer<typeof BundleScenarioDigestSchema>;
export type BundleBlockTokenEstimate = z.infer<typeof BundleBlockTokenEstimateSchema>;
export type PatternBundleBlocks = z.infer<typeof PatternBundleBlocksSchema>;
export type PatternBundleEntry = z.infer<typeof PatternBundleEntrySchema>;
