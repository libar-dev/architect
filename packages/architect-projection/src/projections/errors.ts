export type ProjectionErrorCode =
  | 'PATTERN_NOT_FOUND'
  | 'BOUNDED_CONTEXT_NOT_FOUND'
  | 'DECISION_NOT_FOUND'
  | 'RULE_NOT_FOUND'
  | 'INVALID_SCOPE'
  | 'MISSING_SCOPE_VALUE'
  | 'UNKNOWN_DOCUMENT_TYPE';

export class ProjectionError extends Error {
  constructor(
    readonly code: ProjectionErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ProjectionError';
  }
}
