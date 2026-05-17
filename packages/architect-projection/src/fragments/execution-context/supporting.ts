/**
 * @architect
 * @architect-pattern ExecutionContextSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * Houses the shared execution-context helper schemas for session type, verdicts, dependencies, neighbors, FSM data, and related refs.
 */
import { z } from 'zod';
import { HandoffSessionTypeSchema, SessionTypeSchema } from '@libar-dev/architect-core';
import type { HandoffSessionType, SessionType } from '@libar-dev/architect-core';

export { HandoffSessionTypeSchema, SessionTypeSchema };

export const CheckSeveritySchema = z.enum(['info', 'warning', 'error']);

export const ScopeVerdictSchema = z.enum(['PASS', 'BLOCKED', 'WARN']);

export const DepKindSchema = z.enum(['planning', 'implementation']);

export const ProtectionLevelSchema = z.enum(['none', 'scope', 'hard']);

export const PatternContextMetaSchema = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  phase: z.number().int().optional(),
  role: z.string(),
  file: z.string(),
  summary: z.string(),
});

export const StubRefSchema = z.strictObject({
  stubFile: z.string(),
  targetPath: z.string(),
  name: z.string(),
});

export const DepEntrySchema = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  file: z.string(),
  kind: DepKindSchema,
});

export const NeighborEntrySchema = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  role: z.string().optional(),
  archContext: z.string().optional(),
  file: z.string().optional(),
});

export const FsmContextSchema = z.strictObject({
  currentStatus: z.string(),
  validTransitions: z.array(z.string()),
  protectionLevel: ProtectionLevelSchema,
});

export const PatternFsmEntrySchema = z.strictObject({
  pattern: z.string(),
  fsm: FsmContextSchema,
});

export type { HandoffSessionType, SessionType };
export type CheckSeverity = z.infer<typeof CheckSeveritySchema>;
export type ScopeVerdict = z.infer<typeof ScopeVerdictSchema>;
export type DepKind = z.infer<typeof DepKindSchema>;
export type ProtectionLevel = z.infer<typeof ProtectionLevelSchema>;
export type PatternContextMeta = z.infer<typeof PatternContextMetaSchema>;
export type StubRef = z.infer<typeof StubRefSchema>;
export type DepEntry = z.infer<typeof DepEntrySchema>;
export type NeighborEntry = z.infer<typeof NeighborEntrySchema>;
export type FsmContext = z.infer<typeof FsmContextSchema>;
export type PatternFsmEntry = z.infer<typeof PatternFsmEntrySchema>;
