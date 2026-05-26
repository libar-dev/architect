/**
 * @architect
 * @architect-pattern ReleaseNotesDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - Defines the ReleaseNotesDigest fragment shape for changelog-style release
 *   bundles.
 */
import { z } from 'zod';

import { ReleaseEntrySchema } from './supporting.js';

/**
 * A changelog-style digest bundling one or more release entries.
 *
 * @architect-shape
 */
export const ReleaseNotesDigestSchema = z.strictObject({
  kind: z.literal('ReleaseNotesDigest'),
  releases: z.array(ReleaseEntrySchema),
});

export type ReleaseNotesDigest = z.infer<typeof ReleaseNotesDigestSchema>;
