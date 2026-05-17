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

import { PatternSummarySchema } from './pattern-summary.js';
import {
  DeliverableManifestSchema,
  DeliverableSchema,
  EmbeddedRuleRefSchema,
  PatternHierarchySchema,
  PatternRelationshipsSchema,
  StubRefSchema,
} from './supporting.js';

export const PatternDetailSchema = PatternSummarySchema.extend({
  kind: z.literal('PatternDetail'),
  description: z.string().optional(),
  openQuestions: z.array(z.string()).optional(),
  deliverables: z.array(DeliverableSchema),
  relationships: PatternRelationshipsSchema,
  hierarchy: PatternHierarchySchema.optional(),
  rules: z.array(EmbeddedRuleRefSchema),
  stubs: z.array(StubRefSchema),
  deliverableManifest: DeliverableManifestSchema.optional(),
});

export type PatternDetail = z.infer<typeof PatternDetailSchema>;
