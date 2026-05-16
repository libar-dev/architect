/**
 * Canonical Zod 4 schemas for value domains that cross package boundaries.
 *
 * Every enum-like primitive that CLI, MCP, projection, and guard share lives
 * here so the schemas themselves are the source of truth; TS types are inferred.
 * Downstream modules must import from this file rather than redeclare inline.
 */
import { z } from 'zod';
import { ACCEPTED_STATUS_VALUES, PROCESS_STATUS_VALUES } from './taxonomy/status-values.js';
import { DELIVERABLE_STATUS_VALUES } from './taxonomy/deliverable-status.js';
import { MATURITY_VALUES } from './taxonomy/maturity-values.js';

export const SessionTypeSchema = z.enum(['planning', 'design', 'implement']);
export type SessionType = z.infer<typeof SessionTypeSchema>;

export const ScopeTypeSchema = z.enum(['design', 'implement']);
export type ScopeType = z.infer<typeof ScopeTypeSchema>;

export const HandoffSessionTypeSchema = z.enum(['planning', 'design', 'implement', 'review']);
export type HandoffSessionType = z.infer<typeof HandoffSessionTypeSchema>;

export const RenderFormatSchema = z.enum(['compact', 'json']);
export type RenderFormat = z.infer<typeof RenderFormatSchema>;

export const AcceptedStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);
export const ProcessStatusSchema = z.enum(PROCESS_STATUS_VALUES);
export const DeliverableStatusSchema = z.enum(DELIVERABLE_STATUS_VALUES);
export const MaturitySchema = z.enum(MATURITY_VALUES);
