export type ProjectionErrorCode = 'UNMAPPED_PACKAGE';

export class ProjectionError extends Error {
  readonly code: ProjectionErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: ProjectionErrorCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {}
  ) {
    super(message);
    this.name = 'ProjectionError';
    this.code = code;
    this.details = details;
  }
}
