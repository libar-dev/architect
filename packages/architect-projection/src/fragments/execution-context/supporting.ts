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

/**
 * Severity level attached to a readiness check — informational, a warning, or
 * a blocking error.
 *
 * @architect-shape
 */
export const CheckSeveritySchema = z.enum(['info', 'warning', 'error']);

/**
 * Overall verdict for a scope-readiness report — passing, blocked, or passing
 * with warnings.
 *
 * @architect-shape
 */
export const ScopeVerdictSchema = z.enum(['PASS', 'BLOCKED', 'WARN']);

/**
 * Classifies a dependency edge as a planning-time or implementation-time
 * dependency.
 *
 * @architect-shape
 */
export const DepKindSchema = z.enum(['planning', 'implementation']);

/**
 * Protection level governing how strongly a pattern's scope is guarded —
 * unprotected, scope-protected, or hard-protected.
 *
 * @architect-shape
 */
export const ProtectionLevelSchema = z.enum(['none', 'scope', 'hard']);

/**
 * Per-pattern metadata carried in a session context bundle — the pattern's
 * name, status, phase, role, source file, and a short summary.
 *
 * @architect-shape
 */
export const PatternContextMetaSchema = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  phase: z.number().int().optional(),
  role: z.string(),
  file: z.string(),
  summary: z.string(),
});

/**
 * Reference to a code stub awaiting implementation — the stub file, its
 * intended target path, and the pattern name it backs.
 *
 * @architect-shape
 */
export const StubRefSchema = z.strictObject({
  stubFile: z.string(),
  targetPath: z.string(),
  name: z.string(),
});

/**
 * One dependency entry in a session bundle — the depended-on pattern's name,
 * status, source file, and whether the edge is a planning or implementation
 * dependency.
 *
 * @architect-shape
 */
export const DepEntrySchema = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  file: z.string(),
  kind: DepKindSchema,
});

/**
 * Architecture-neighbor entry in a session bundle — a nearby pattern's name,
 * status, role, bounded context, and source file.
 *
 * @architect-shape
 */
export const NeighborEntrySchema = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  role: z.string().optional(),
  archContext: z.string().optional(),
  file: z.string().optional(),
});

/**
 * FSM context for a pattern — its current lifecycle status, the transitions
 * currently legal from that status, and its protection level.
 *
 * @architect-shape
 */
export const FsmContextSchema = z.strictObject({
  currentStatus: z.string(),
  validTransitions: z.array(z.string()),
  protectionLevel: ProtectionLevelSchema,
});

/**
 * Pairs a pattern name with its FSM context, for the per-pattern FSM map in a
 * session bundle.
 *
 * @architect-shape
 */
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
