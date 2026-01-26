/**
 * @libar-docs
 * @libar-docs-validation @libar-docs-core
 * @libar-docs-pattern OutputSchemas
 * @libar-docs-status completed
 * @libar-docs-uses Zod, LintSeveritySchema
 * @libar-docs-used-by LintEngine, ValidatePatternsCLI, Orchestrator
 * @libar-docs-usecase "When serializing lint results to JSON"
 * @libar-docs-usecase "When serializing validation results to JSON"
 * @libar-docs-usecase "When writing registry metadata to JSON"
 *
 * ## OutputSchemas - JSON Output Format Schemas
 *
 * Zod schemas for JSON output formats used by CLI tools.
 * These schemas document the contract for JSON consumers (CI tools, IDE integrations)
 * and provide pre-serialization validation for type safety.
 *
 * ### When to Use
 *
 * - Use with createJsonOutputCodec() for type-safe JSON serialization
 * - Reference as documentation for tooling that consumes CLI JSON output
 *
 * ### Key Concepts
 *
 * - **Output Schemas**: Define the shape of JSON output for external consumers
 * - **Codec Pattern**: Validate before serialize, not just after parse
 */

import { z } from "zod";
import { SEVERITY_TYPES } from "../taxonomy/index.js";
import { LintSeveritySchema } from "./lint.js";

// ============================================================================
// Lint Engine Output (engine.ts formatJson)
// ============================================================================

/**
 * Schema for individual lint violation in JSON output
 *
 * Simplified structure for external consumption (excludes `file` which is
 * on the parent result object).
 */
export const LintViolationOutputSchema = z.object({
  /** Rule ID (e.g., 'missing-pattern-name') */
  rule: z.string(),
  /** Severity level */
  severity: LintSeveritySchema,
  /** Human-readable message */
  message: z.string(),
  /** Line number in source file */
  line: z.number().int().nonnegative(),
});

/**
 * Schema for lint result per file in JSON output
 */
export const LintResultOutputSchema = z.object({
  /** Source file path */
  file: z.string(),
  /** Violations found in this file */
  violations: z.array(LintViolationOutputSchema),
});

/**
 * Schema for lint summary statistics in JSON output
 */
export const LintSummaryStatsSchema = z.object({
  /** Total error count */
  errors: z.number().int().nonnegative(),
  /** Total warning count */
  warnings: z.number().int().nonnegative(),
  /** Total info count */
  info: z.number().int().nonnegative(),
  /** Total files scanned */
  filesScanned: z.number().int().nonnegative(),
  /** Total directives checked */
  directivesChecked: z.number().int().nonnegative(),
});

/**
 * Schema for complete lint JSON output
 *
 * This is the schema for the output of `lint-patterns --format json`
 */
export const LintOutputSchema = z.object({
  /** Results per file (only files with violations) */
  results: z.array(LintResultOutputSchema),
  /** Summary statistics */
  summary: LintSummaryStatsSchema,
});

export type LintOutput = z.infer<typeof LintOutputSchema>;

// ============================================================================
// Validate-Patterns Output (validate-patterns.ts formatJson)
// ============================================================================

/**
 * Schema for validation issue severity
 *
 * @see src/taxonomy/severity-types.ts
 */
export const ValidationIssueSeveritySchema = z.enum(SEVERITY_TYPES);

/**
 * Schema for validation issue source
 */
export const ValidationIssueSourceSchema = z.enum(["typescript", "gherkin", "cross-source"]);

/**
 * Schema for individual validation issue in JSON output
 */
export const ValidationIssueOutputSchema = z.object({
  /** Severity level */
  severity: ValidationIssueSeveritySchema,
  /** Human-readable message */
  message: z.string(),
  /** Source of the issue */
  source: ValidationIssueSourceSchema,
  /** Pattern name (optional) */
  pattern: z.string().optional(),
  /** File path (optional) */
  file: z.string().optional(),
});

/**
 * Schema for validation statistics
 */
export const ValidationStatsSchema = z.object({
  /** Number of TypeScript patterns found */
  typescriptPatterns: z.number().int().nonnegative(),
  /** Number of Gherkin patterns found */
  gherkinPatterns: z.number().int().nonnegative(),
  /** Number of matched patterns */
  matched: z.number().int().nonnegative(),
  /** Patterns in TypeScript missing from Gherkin */
  missingInGherkin: z.number().int().nonnegative(),
  /** Patterns in Gherkin missing from TypeScript */
  missingInTypeScript: z.number().int().nonnegative(),
});

/**
 * Schema for complete validation JSON output
 *
 * This is the schema for the output of `validate-patterns --format json`
 */
export const ValidationSummaryOutputSchema = z.object({
  /** All validation issues */
  issues: z.array(ValidationIssueOutputSchema),
  /** Validation statistics */
  stats: ValidationStatsSchema,
});

export type ValidationSummaryOutput = z.infer<typeof ValidationSummaryOutputSchema>;

// ============================================================================
// Registry Metadata Output (orchestrator.ts registry.json)
// ============================================================================

/**
 * Schema for registry metadata JSON output
 *
 * This is intentionally loose since generators can return arbitrary metadata.
 * The schema ensures it's a valid JSON-serializable object.
 */
export const RegistryMetadataOutputSchema = z.record(z.string(), z.unknown());

export type RegistryMetadataOutput = z.infer<typeof RegistryMetadataOutputSchema>;
