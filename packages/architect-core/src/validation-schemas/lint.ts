/**
 * @architect
 * @architect-pattern LintViolationContract
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:validation-schemas
 *
 * ## LintViolationContract - Canonical Lint-Violation Shape
 *
 * `LintViolationSchema` is the single Zod `strictObject` every linter emits and
 * every consumer reads, with `isLintViolation` as its companion guard. It pins
 * the cross-package shape of a lint finding (`rule`, `severity`, `message`,
 * `file`, `line`) so the guard lint subsystem and the output schemas share one
 * authoritative contract. A leaf contract with high fan-in across the lint
 * pipeline and no outbound pattern edges.
 *
 * ### When to Use
 *
 * - Emitting a violation from a linter or aggregating violations from many
 *   rules into a consistent shape.
 * - Validating or narrowing an unknown value to a lint violation at a boundary.
 * - Reading lint findings in output schemas, reporters, or downstream
 *   projections that depend on a stable violation shape.
 */
import { z } from 'zod';

import { SEVERITY_TYPES, type SeverityType } from '../taxonomy/index.js';

export const LintSeveritySchema = z.enum(SEVERITY_TYPES);
export type LintSeverity = SeverityType;

export const LintViolationSchema = z.strictObject({
  rule: z.string(),
  severity: LintSeveritySchema,
  message: z.string(),
  file: z.string(),
  line: z.number(),
});

export type LintViolation = z.infer<typeof LintViolationSchema>;

export function isLintViolation(value: unknown): value is LintViolation {
  return LintViolationSchema.safeParse(value).success;
}
