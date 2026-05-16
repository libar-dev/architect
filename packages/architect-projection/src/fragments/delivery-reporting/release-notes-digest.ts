/**
 * @architect
 * @architect-pattern ReleaseNotesDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { ReleaseEntrySchema } from './supporting.js';

export const ReleaseNotesDigestSchema = z.strictObject({
  kind: z.literal('ReleaseNotesDigest'),
  releases: z.array(ReleaseEntrySchema),
});

export type ReleaseNotesDigest = z.infer<typeof ReleaseNotesDigestSchema>;
