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
