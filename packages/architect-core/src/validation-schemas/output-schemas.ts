import { z } from 'zod';

import { SEVERITY_TYPES } from '../taxonomy/index.js';
import {
  EXTRACTION_DIAGNOSTIC_CODES,
  EXTRACTION_DIAGNOSTIC_SEVERITIES,
} from '../extractor/extraction-diagnostics.js';
import { LintSeveritySchema } from './lint.js';

export const LintViolationOutputSchema = z.strictObject({
  rule: z.string(),
  severity: LintSeveritySchema,
  message: z.string(),
  line: z.number().int().nonnegative(),
});

export const LintResultOutputSchema = z.strictObject({
  file: z.string(),
  violations: z.array(LintViolationOutputSchema),
});

export const LintSummaryStatsSchema = z.strictObject({
  errors: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
  filesScanned: z.number().int().nonnegative(),
  directivesChecked: z.number().int().nonnegative(),
});

export const LintOutputSchema = z.strictObject({
  results: z.array(LintResultOutputSchema),
  summary: LintSummaryStatsSchema,
});

export type LintOutput = z.infer<typeof LintOutputSchema>;

export const ValidationIssueSeveritySchema = z.enum(SEVERITY_TYPES);
export const ValidationIssueSourceSchema = z.enum(['typescript', 'gherkin', 'cross-source']);

export const ValidationIssueOutputSchema = z.strictObject({
  severity: ValidationIssueSeveritySchema,
  message: z.string(),
  source: ValidationIssueSourceSchema,
  pattern: z.string().optional(),
  file: z.string().optional(),
});

export const ValidationStatsSchema = z.strictObject({
  typescriptPatterns: z.number().int().nonnegative(),
  gherkinPatterns: z.number().int().nonnegative(),
  matched: z.number().int().nonnegative(),
  missingInGherkin: z.number().int().nonnegative(),
  missingInTypeScript: z.number().int().nonnegative(),
});

export const ValidationSummaryOutputSchema = z.strictObject({
  issues: z.array(ValidationIssueOutputSchema),
  stats: ValidationStatsSchema,
});

export type ValidationSummaryOutput = z.infer<typeof ValidationSummaryOutputSchema>;

export const ExtractionDiagnosticOutputSchema = z.strictObject({
  filePath: z.string(),
  severity: z.enum(EXTRACTION_DIAGNOSTIC_SEVERITIES),
  code: z.enum(EXTRACTION_DIAGNOSTIC_CODES),
  message: z.string(),
  suggestion: z.string().optional(),
});

export const ValidatePatternsOutputSchema = z.strictObject({
  summary: ValidationSummaryOutputSchema,
  diagnostics: z.array(ExtractionDiagnosticOutputSchema).readonly().default([]),
});

export type ValidatePatternsOutput = z.infer<typeof ValidatePatternsOutputSchema>;

export const RegistryMetadataOutputSchema = z.strictObject({
  version: z.string(),
  roleCount: z.number().int().nonnegative(),
  metadataTagCount: z.number().int().nonnegative(),
  aggregationTagCount: z.number().int().nonnegative(),
  tagPrefix: z.string(),
  fileOptInTag: z.string(),
});

export type ExtractionDiagnosticOutput = z.infer<typeof ExtractionDiagnosticOutputSchema>;
export type RegistryMetadataOutput = z.infer<typeof RegistryMetadataOutputSchema>;
