/**
 * Zod schemas for lint types
 *
 * Provides validated schemas for lint severity levels and violations.
 * LintRule cannot be fully schematized (has function property) so
 * it remains as an interface in rules.ts.
 */
import { z } from 'zod';
import { type SeverityType } from '../taxonomy/index.js';
/**
 * Lint severity levels schema
 *
 * - error: Must be fixed before merging (CI fails)
 * - warning: Should be fixed (CI fails in strict mode)
 * - info: Informational only (CI never fails)
 *
 * @see src/taxonomy/severity-types.ts
 */
export declare const LintSeveritySchema: z.ZodEnum<{
    error: "error";
    warning: "warning";
    info: "info";
}>;
export type LintSeverity = SeverityType;
/**
 * Lint violation schema
 *
 * Represents a single lint violation found in a directive.
 */
export declare const LintViolationSchema: z.ZodObject<{
    rule: z.ZodString;
    severity: z.ZodEnum<{
        error: "error";
        warning: "warning";
        info: "info";
    }>;
    message: z.ZodString;
    file: z.ZodString;
    line: z.ZodNumber;
}, z.core.$strict>;
export type LintViolation = z.infer<typeof LintViolationSchema>;
/**
 * Type guard for LintViolation
 */
export declare function isLintViolation(value: unknown): value is LintViolation;
//# sourceMappingURL=lint.d.ts.map