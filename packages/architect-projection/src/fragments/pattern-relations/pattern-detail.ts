/**
 * @architect
 * @architect-pattern PatternDetail
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Defines the `PatternDetail` fragment shape for the expanded per-pattern bundle, including summary, deliverables, relationships, rules, stubs, and manifest.
 */
import { z } from 'zod';

import { PatternIdentitySchema } from './pattern-summary.js';
import {
  EmbeddedDeliverableManifestSchema,
  EmbeddedDeliverableSchema,
  EmbeddedRuleRefSchema,
  PatternHierarchySchema,
  PatternRelationshipsSchema,
  StubRefSchema,
} from './supporting.js';

/**
 * The expanded per-pattern bundle — the pattern identity plus description, open
 * questions, deliverables, relationships, hierarchy, embedded rules, stubs, and
 * the deliverable manifest.
 *
 * @architect-shape
 */
export const PatternDetailSchema = PatternIdentitySchema.extend({
  kind: z.literal('PatternDetail'),
  // Classification axes beyond role (which PatternIdentity already carries):
  // bounded-context, product-area, and the hierarchy level. The source
  // ExtractedPattern carries all three; surfacing them here lets `pattern <Name>`
  // answer the full role · bounded-context · layer · product-area classification
  // in one call instead of forcing a stitch across `arch neighborhood` / `taxonomy`.
  boundedContext: z.string().optional(),
  productArea: z.string().optional(),
  level: z.string().optional(),
  description: z.string().optional(),
  // True when `description` is a head (first-sentence / Problem+Solution summary) and the
  // source directive carries more design prose that was not projected — a signaled boundary
  // (mirrors the dep-tree `truncated` precedent) so consumers know to read the source for full
  // context rather than silently treating the head as the whole directive.
  descriptionTruncated: z.boolean().optional(),
  openQuestions: z.array(z.string()).optional(),
  deliverables: z.array(EmbeddedDeliverableSchema),
  relationships: PatternRelationshipsSchema,
  hierarchy: PatternHierarchySchema.optional(),
  rules: z.array(EmbeddedRuleRefSchema),
  stubs: z.array(StubRefSchema),
  deliverableManifest: EmbeddedDeliverableManifestSchema.optional(),
});

export type PatternDetail = z.infer<typeof PatternDetailSchema>;
