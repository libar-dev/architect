/**
 * @architect
 * @architect-pattern OverviewDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * Defines the `OverviewDigest` fragment shape for delivery progress, active phase counts, blocking patterns, a generated-views index, and CLI hints.
 */
import { z } from 'zod';

import {
  ActivePhaseEntrySchema,
  BlockingEntrySchema,
  GeneratedViewEntrySchema,
  OverviewProgressSchema,
} from './supporting.js';

export const OverviewDigestSchema = z.strictObject({
  kind: z.literal('OverviewDigest'),
  progress: OverviewProgressSchema,
  activePhases: z.array(ActivePhaseEntrySchema),
  blocking: z.array(BlockingEntrySchema),
  generatedViews: z.array(GeneratedViewEntrySchema).optional(),
  cliHints: z.array(z.string()).optional(),
});

export type OverviewDigest = z.infer<typeof OverviewDigestSchema>;
