/**
 * @architect
 * @architect-pattern AnnotationCoverage
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * Defines the `AnnotationCoverage` fragment shape for source-file annotation coverage, including totals, unannotated files, and per-tag gaps.
 */
import { z } from 'zod';

import { GapsByTagSchema } from './supporting.js';

export const AnnotationCoverageSchema = z.strictObject({
  kind: z.literal('AnnotationCoverage'),
  totalSourceFiles: z.number().int().nonnegative(),
  annotatedFiles: z.number().int().nonnegative(),
  unannotatedFiles: z.array(z.string()),
  coveragePercentage: z.number().min(0).max(100),
  gapsByTag: GapsByTagSchema,
});

export type AnnotationCoverage = z.infer<typeof AnnotationCoverageSchema>;
