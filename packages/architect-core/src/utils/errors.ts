/**
 * @architect
 * @architect-pattern ZodErrorBoundary
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:validation
 * @architect-uses TrustBoundaryParser
 */
import { z } from 'zod';
import { parseAtBoundary } from '../validation/boundary.js';

/**
 * Formats a Zod parse failure into the single multiline error shape used at
 * trust boundaries throughout the package family.
 */
export function formatZodError(error: z.ZodError, prefix = 'Validation failed'): string {
  return `${prefix}:\n${z.prettifyError(error)}`;
}

/**
 * Parse once at the boundary, then throw a plain Error with the shared
 * formatted message instead of leaking ZodError handling into callers.
 */
export function parseOrThrow<TSchema extends z.ZodType>(
  schema: TSchema,
  raw: unknown,
  context = 'Validation failed',
): z.infer<TSchema> {
  return parseAtBoundary(schema, raw, context);
}

export function exitWithErrorMessage(message: string, exitCode = 1): never {
  process.stderr.write(`${message}\n`);
  process.exit(exitCode);
}

export function exitWithProcessError(error: unknown, exitCode = 1): never {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n`);

  if (process.env['DEBUG'] && error instanceof Error && error.stack !== undefined) {
    process.stderr.write(`Stack trace: ${error.stack}\n`);
  }

  process.exit(exitCode);
}
