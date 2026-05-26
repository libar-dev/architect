/**
 * @architect
 * @architect-pattern TaxonomyDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - Defines the `TaxonomyDigest` fragment shape for summarized tag and format-type counts.
 */
import { z } from 'zod';

import { FormatTypeEntrySchema, TagGroupEntrySchema } from './supporting.js';

/**
 * Summarized tag counts by category (roles, metadata, aggregation) plus a total.
 *
 * @architect-shape
 */
export const TaxonomyDigestCountSummarySchema = z.strictObject({
  roles: z.number().int().nonnegative(),
  metadata: z.number().int().nonnegative(),
  aggregation: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

/**
 * A digest of the tag taxonomy — grouped tag entries, the supported format
 * types, and optional per-tag example overrides.
 *
 * @architect-shape
 */
export const TaxonomyDigestSchema = z.strictObject({
  kind: z.literal('TaxonomyDigest'),
  tags: z.array(TagGroupEntrySchema),
  formatTypes: z.array(FormatTypeEntrySchema),
  exampleOverrides: z.record(z.string(), z.string()).optional(),
});

export type TaxonomyDigest = z.infer<typeof TaxonomyDigestSchema>;
export type TaxonomyDigestCountSummary = z.infer<typeof TaxonomyDigestCountSummarySchema>;
