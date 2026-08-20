/**
 * @architect
 * @architect-pattern DomainEnumSchemas
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:domain
 *
 * ## DomainEnumSchemas - Cross-Package Zod Enum Hub
 *
 * The 20-importer cross-package Zod enum hub. Defines the canonical
 * enum-like value-domain schemas every package shares — `SessionType`,
 * `ScopeType`, `RenderFormat`, `StatusFilter`, and the status/maturity/
 * deliverable schemas — so the schemas themselves are the source of truth and
 * TS types are inferred. Composes raw taxonomy constants directly and carries
 * no owning-pattern imports; a root primitive whose weight is fan-in.
 *
 * Carries the StatusFilter-vs-AcceptedStatus distinction: `StatusFilterSchema`
 * widens the authored accepted values with the `planned` reporting bucket for
 * filtering only, while `AcceptedStatusSchema` and `ProcessStatusSchema` stay
 * narrow for authored-tag and FSM-transition validation.
 *
 * ### When to Use
 *
 * - Validating a CLI / MCP / projection input against a shared value domain.
 * - Choosing between filter-scoped and validation-scoped status schemas.
 * - Inferring a TS type from one of the canonical enum schemas.
 */
import { z } from 'zod';
import { ACCEPTED_STATUS_VALUES, PROCESS_STATUS_VALUES } from './taxonomy/status-values.js';
import { NORMALIZED_ONLY_STATUS_VALUES } from './taxonomy/normalized-status.js';
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
export const StatusValueSchema = AcceptedStatusSchema;
export const DeliverableStatusSchema = z.enum(DELIVERABLE_STATUS_VALUES);
export const MaturitySchema = z.enum(MATURITY_VALUES);

/**
 * Consumer-facing status FILTER vocabulary for catalog / list / search / MCP
 * status filtering only.
 *
 * The union of the authored accepted values (`candidate`, `roadmap`, `active`,
 * `completed`, `deferred`) plus the normalized-only bucket word `planned`
 * (= roadmap ∪ deferred), so every normalized status word exposed by
 * `g.graph.counts` or a `StatusDistribution` projection is a legal filter.
 *
 * DISTINCT from {@link AcceptedStatusSchema} (authored `@architect-status`
 * validation) and {@link ProcessStatusSchema} (FSM transition validation):
 * those must never widen to accept `planned`, or a non-FSM word could reach the
 * transition path. StatusFilterSchema is scoped to filtering, never to
 * authored-tag validation or FSM transitions.
 */
export const StatusFilterSchema = z.enum([
  ...ACCEPTED_STATUS_VALUES,
  ...NORMALIZED_ONLY_STATUS_VALUES,
]);
export type StatusFilterValue = z.infer<typeof StatusFilterSchema>;
