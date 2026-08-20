/**
 * @architect
 * @architect-pattern ProjectionError
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:projection
 *
 * ## ProjectionError - The Single Failure Contract Every Projection Throws
 *
 * The one typed error every projection raises on a domain failure: the
 * `ProjectionErrorCode` union (`PATTERN_NOT_FOUND`, `UNKNOWN_DOCUMENT_TYPE`,
 * `INVALID_SCOPE`, `MISSING_SCOPE_VALUE`, and the not-found variants for
 * bounded-context / decision / rule) plus the `ProjectionError` class that pairs
 * a machine-readable `code` with a human message. A root primitive of the
 * projection package with no outbound pattern edges; its inbound fan-in (the
 * projections that throw it) forms the explicit `usedBy` reverse-edge set.
 *
 * ### When to Use
 *
 * - Raising a recoverable, classified failure from inside a projection
 *   (missing pattern, unknown document type, invalid scope).
 * - Branching on a caught error's `code` to map a failure to an exit status,
 *   MCP error payload, or CLI message.
 */
export type ProjectionErrorCode =
  | 'PATTERN_NOT_FOUND'
  | 'PATTERN_RELATIONSHIP_INVARIANT'
  | 'BOUNDED_CONTEXT_NOT_FOUND'
  | 'DECISION_NOT_FOUND'
  | 'RULE_NOT_FOUND'
  | 'INVALID_SCOPE'
  | 'MISSING_SCOPE_VALUE'
  | 'UNKNOWN_DOCUMENT_TYPE';

export class ProjectionError extends Error {
  constructor(
    readonly code: ProjectionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ProjectionError';
  }
}
