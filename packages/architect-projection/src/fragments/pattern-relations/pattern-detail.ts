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
  description: z.string().optional(),
  openQuestions: z.array(z.string()).optional(),
  deliverables: z.array(EmbeddedDeliverableSchema),
  relationships: PatternRelationshipsSchema,
  hierarchy: PatternHierarchySchema.optional(),
  rules: z.array(EmbeddedRuleRefSchema),
  stubs: z.array(StubRefSchema),
  deliverableManifest: EmbeddedDeliverableManifestSchema.optional(),
});

export type PatternDetail = z.infer<typeof PatternDetailSchema>;
