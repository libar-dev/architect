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

export const TaxonomyDigestCountSummarySchema = z.strictObject({
  roles: z.number().int().nonnegative(),
  metadata: z.number().int().nonnegative(),
  aggregation: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const TaxonomyDigestSchema = z.strictObject({
  kind: z.literal('TaxonomyDigest'),
  tags: z.array(TagGroupEntrySchema),
  formatTypes: z.array(FormatTypeEntrySchema),
  exampleOverrides: z.record(z.string(), z.string()).optional(),
});

export type TaxonomyDigest = z.infer<typeof TaxonomyDigestSchema>;
export type TaxonomyDigestCountSummary = z.infer<typeof TaxonomyDigestCountSummarySchema>;
