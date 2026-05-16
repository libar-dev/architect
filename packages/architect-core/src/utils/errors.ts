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
  context = 'Validation failed'
): z.infer<TSchema> {
  return parseAtBoundary(schema, raw, context);
}
