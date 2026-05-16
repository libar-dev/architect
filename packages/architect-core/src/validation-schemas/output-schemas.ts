import { z } from 'zod';

import { SEVERITY_TYPES } from '../taxonomy/index.js';
import {
  EXTRACTION_DIAGNOSTIC_CODES,
  EXTRACTION_DIAGNOSTIC_SEVERITIES,
} from '../extractor/extraction-diagnostics.js';
import { LintSeveritySchema } from './lint.js';

export const LintViolationOutputSchema = z.object({
  rule: z.string(),
  severity: LintSeveritySchema,
  message: z.string(),
  line: z.number().int().nonnegative(),
});

export const LintResultOutputSchema = z.object({
  file: z.string(),
  violations: z.array(LintViolationOutputSchema),
});

export const LintSummaryStatsSchema = z.object({
  errors: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
  filesScanned: z.number().int().nonnegative(),
  directivesChecked: z.number().int().nonnegative(),
});

export const LintOutputSchema = z.object({
  results: z.array(LintResultOutputSchema),
  summary: LintSummaryStatsSchema,
});

export type LintOutput = z.infer<typeof LintOutputSchema>;

export const ValidationIssueSeveritySchema = z.enum(SEVERITY_TYPES);
export const ValidationIssueSourceSchema = z.enum(['typescript', 'gherkin', 'cross-source']);

export const ValidationIssueOutputSchema = z.object({
  severity: ValidationIssueSeveritySchema,
  message: z.string(),
  source: ValidationIssueSourceSchema,
  pattern: z.string().optional(),
  file: z.string().optional(),
});

export const ValidationStatsSchema = z.object({
  typescriptPatterns: z.number().int().nonnegative(),
  gherkinPatterns: z.number().int().nonnegative(),
  matched: z.number().int().nonnegative(),
  missingInGherkin: z.number().int().nonnegative(),
  missingInTypeScript: z.number().int().nonnegative(),
});

export const ValidationSummaryOutputSchema = z.object({
  issues: z.array(ValidationIssueOutputSchema),
  stats: ValidationStatsSchema,
});

export type ValidationSummaryOutput = z.infer<typeof ValidationSummaryOutputSchema>;

export const ExtractionDiagnosticOutputSchema = z.object({
  filePath: z.string(),
  severity: z.enum(EXTRACTION_DIAGNOSTIC_SEVERITIES),
  code: z.enum(EXTRACTION_DIAGNOSTIC_CODES),
  message: z.string(),
  suggestion: z.string().optional(),
});

export const ValidatePatternsOutputSchema = z.object({
  summary: ValidationSummaryOutputSchema,
  diagnostics: z.array(ExtractionDiagnosticOutputSchema).readonly().default([]),
});

export type ValidatePatternsOutput = z.infer<typeof ValidatePatternsOutputSchema>;

export const RegistryMetadataOutputSchema = z.object({
  version: z.string(),
  roleCount: z.number().int().nonnegative(),
  metadataTagCount: z.number().int().nonnegative(),
  aggregationTagCount: z.number().int().nonnegative(),
  tagPrefix: z.string(),
  fileOptInTag: z.string(),
});

export type ExtractionDiagnosticOutput = z.infer<typeof ExtractionDiagnosticOutputSchema>;
export type RegistryMetadataOutput = z.infer<typeof RegistryMetadataOutputSchema>;
