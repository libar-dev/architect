import { z } from 'zod';

export interface BoundaryParseIssue {
  readonly path: readonly (string | number)[];
  readonly input: unknown;
  readonly expected: string;
  readonly received: string;
}

export type BoundaryParseErrorDetails = readonly BoundaryParseIssue[];

function describeReceived(input: unknown): string {
  if (input === null) {
    return 'null';
  }
  if (Array.isArray(input)) {
    return 'array';
  }
  return typeof input;
}

function toBoundaryParseIssue(issue: z.core.$ZodIssue): BoundaryParseIssue {
  const record = issue as z.core.$ZodIssue & Readonly<Record<string, unknown>>;
  const input = record.input;
  return {
    path: issue.path.filter((segment): segment is string | number => typeof segment !== 'symbol'),
    input,
    expected:
      typeof record.expected === 'string'
        ? record.expected
        : typeof record.code === 'string'
          ? record.code
          : 'unknown',
    received: typeof record['received'] === 'string' ? record['received'] : describeReceived(input),
  };
}

export class BoundaryParseError extends Error {
  readonly details: BoundaryParseErrorDetails;
  override readonly cause: z.ZodError;

  constructor(message: string, cause: z.ZodError) {
    super(message);
    this.name = 'BoundaryParseError';
    this.cause = cause;
    this.details = cause.issues.map(toBoundaryParseIssue);
  }
}

/**
 * Parse raw input once at an explicit trust boundary, then return typed data or
 * throw a stable error shape that callers can inspect without depending on Zod.
 */
export function parseAtBoundary<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
  context = 'Validation failed',
): z.infer<TSchema> {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }

  throw new BoundaryParseError(`${context}:\n${z.prettifyError(parsed.error)}`, parsed.error);
}
