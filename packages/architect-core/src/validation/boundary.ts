/**
 * @architect
 * @architect-pattern TrustBoundaryParser
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:validation
 *
 * ## TrustBoundaryParser - Parse-Once at the Trust Boundary (ADR-009)
 *
 * `parseAtBoundary()` plus `BoundaryParseError` make ADR-009's
 * parse-once-at-the-boundary primitive concrete: raw external input is parsed
 * exactly once against a Zod schema at an explicit seam, then either typed data
 * is returned or a stable, Zod-independent error shape (`BoundaryParseError`
 * with structured `details`) is thrown. A root primitive consumed across all
 * five packages; its weight is fan-in, not outbound edges.
 *
 * ### When to Use
 *
 * - Validating raw, untrusted input (CLI args, MCP payloads, file contents,
 *   external projection callers) at the point it enters the system.
 * - Converting Zod validation failures into a caller-stable error contract that
 *   does not leak the Zod dependency past the boundary.
 * - Guaranteeing the parse-once discipline so internal code can rely on cheap
 *   shape checks rather than re-parsing.
 */
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
