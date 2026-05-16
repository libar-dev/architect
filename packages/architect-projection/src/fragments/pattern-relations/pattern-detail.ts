/**
 * @architect
 * @architect-pattern PatternDetail
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { MaturitySchema } from '@libar-dev/architect-core';
import { z } from 'zod';

import {
  DeliverableManifestSchema,
  DeliverableSchema,
  EmbeddedRuleRefSchema,
  PatternHierarchySchema,
  PatternRelationshipsSchema,
  PatternSourceSchema,
  StubRefSchema,
} from './supporting.js';

export const PatternDetailSchema = z.strictObject({
  kind: z.literal('PatternDetail'),
  patternName: z.string(),
  status: z.string().optional(),
  maturity: MaturitySchema.optional(),
  role: z.string(),
  phase: z.number().int().optional(),
  file: z.string(),
  source: PatternSourceSchema,
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
