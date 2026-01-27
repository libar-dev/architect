/**
 * Zod schemas for lint types
 *
 * Provides validated schemas for lint severity levels and violations.
 * LintRule cannot be fully schematized (has function property) so
 * it remains as an interface in rules.ts.
 */
import { z } from 'zod';
import { SEVERITY_TYPES, type SeverityType } from '../taxonomy/index.js';

/**
 * Lint severity levels schema
 *
 * - error: Must be fixed before merging (CI fails)
 * - warning: Should be fixed (CI fails in strict mode)
 * - info: Informational only (CI never fails)
 *
 * @see src/taxonomy/severity-types.ts
 */
export const LintSeveritySchema = z.enum(SEVERITY_TYPES);
export type LintSeverity = SeverityType;

/**
 * Lint violation schema
 *
 * Represents a single lint violation found in a directive.
 */
export const LintViolationSchema = z
  .object({
    /** Rule ID (e.g., 'missing-pattern-name') */
    rule: z.string(),
    /** Severity level */
    severity: LintSeveritySchema,
    /** Human-readable message */
    message: z.string(),
    /** Source file path */
    file: z.string(),
    /** Line number in source file */
    line: z.number(),
  })
  .strict();
export type LintViolation = z.infer<typeof LintViolationSchema>;

/**
 * Type guard for LintViolation
 */
export function isLintViolation(value: unknown): value is LintViolation {
  return LintViolationSchema.safeParse(value).success;
}
