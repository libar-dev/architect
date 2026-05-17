/**
 * @architect
 * @architect-pattern SessionContextBundle
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * Defines the `SessionContextBundle` fragment shape for the session-opening context across patterns, dependencies, stubs, deliverables, and FSM data.
 */
import { z } from 'zod';

import { DeliverableSchema } from './deliverable.js';
import {
  DepEntrySchema,
  FsmContextSchema,
  NeighborEntrySchema,
  PatternContextMetaSchema,
  PatternFsmEntrySchema,
  SessionTypeSchema,
  StubRefSchema,
} from './supporting.js';

export const SessionContextBundleSchema = z.strictObject({
  kind: z.literal('SessionContextBundle'),
  patterns: z.array(z.string()),
  sessionType: SessionTypeSchema,
  metadata: z.array(PatternContextMetaSchema),
  specFiles: z.array(z.string()),
  stubs: z.array(StubRefSchema),
  dependencies: z.array(DepEntrySchema),
  sharedDependencies: z.array(DepEntrySchema),
  consumers: z.array(DepEntrySchema),
  architectureNeighbors: z.array(NeighborEntrySchema),
  deliverables: z.array(DeliverableSchema),
  fsm: FsmContextSchema.optional(),
  fsmByPattern: z.array(PatternFsmEntrySchema),
  testFiles: z.array(z.string()),
});

export type SessionContextBundle = z.infer<typeof SessionContextBundleSchema>;
