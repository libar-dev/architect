/**
 * @architect
 * @architect-pattern TaxonomyDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
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

export function summarizeTaxonomyDigest(digest: TaxonomyDigest): TaxonomyDigestCountSummary {
  const allEntries = digest.tags.flatMap((group) => group.entries);
  const roles = allEntries.filter((entry) => entry.kind === 'role').length;
  const metadata = allEntries.filter((entry) => entry.kind === 'metadata').length;
  const aggregation = allEntries.filter((entry) => entry.kind === 'aggregation').length;

  return {
    roles,
    metadata,
    aggregation,
    total: roles + metadata + aggregation,
  };
}
