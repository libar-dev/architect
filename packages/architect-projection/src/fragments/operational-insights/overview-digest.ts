/**
 * @architect
 * @architect-pattern OverviewDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * Defines the `OverviewDigest` fragment shape for delivery progress, active phase counts, blocking patterns, a "start here" orientation block (high-signal docs + safe-to-start items), the role distribution, a high-level architecture glimpse, a generated-views index, and CLI hints.
 */
import { z } from 'zod';

import {
  ActivePhaseEntrySchema,
  BlockingEntrySchema,
  GeneratedViewEntrySchema,
  OverviewArchitectureSchema,
  OverviewOrientationSchema,
  OverviewProgressSchema,
  RoleCountSchema,
} from './supporting.js';

/**
 * Fragment shape for the delivery overview — progress totals, active-phase
 * counts, blocking patterns, an optional "start here" orientation block
 * (orientation doc references + the safe-to-start roadmap set), an optional
 * role distribution, an optional high-level architecture glimpse, an optional
 * generated-views index, and optional CLI hints.
 *
 * @architect-shape
 */
export const OverviewDigestSchema = z.strictObject({
  kind: z.literal('OverviewDigest'),
  progress: OverviewProgressSchema,
  activePhases: z.array(ActivePhaseEntrySchema),
  blocking: z.array(BlockingEntrySchema),
  orientation: OverviewOrientationSchema.optional(),
  roleDistribution: z.array(RoleCountSchema).optional(),
  architecture: OverviewArchitectureSchema.optional(),
  generatedViews: z.array(GeneratedViewEntrySchema).optional(),
  cliHints: z.array(z.string()).optional(),
});

export type OverviewDigest = z.infer<typeof OverviewDigestSchema>;
