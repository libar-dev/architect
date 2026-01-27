/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern DualSourceSchemas
 * @libar-docs-status completed
 * @libar-docs-used-by DocExtractor, FeatureParser, CrossValidator
 *
 * ## DualSourceSchemas - Dual-Source Extraction Type Validation
 *
 * Zod schemas for dual-source extraction types.
 *
 * Following the project's schema-first pattern, all dual-source types
 * are defined as Zod schemas with TypeScript types inferred from them.
 *
 * ### When to Use
 *
 * - When validating process metadata from Gherkin feature tags
 * - When validating deliverables from Background tables
 * - When performing cross-validation between code and feature files
 */

import { z } from 'zod';
import {
  HIERARCHY_LEVELS,
  PROCESS_STATUS_VALUES,
  RISK_LEVELS,
  type HierarchyLevel as TaxonomyHierarchyLevel,
  type ProcessStatusValue,
  type RiskLevel as TaxonomyRiskLevel,
} from '../taxonomy/index.js';

/**
 * Process status values from Gherkin @libar-docs-status tag
 *
 * Per PDR-005 MVP Workflow State Machine:
 * - roadmap: Planned work, fully editable
 * - active: In progress, scope-locked
 * - completed: Done, hard-locked
 * - deferred: On hold, fully editable
 *
 * @see delivery-process/src/taxonomy/status-values.ts
 */
export const ProcessStatusSchema = z.enum(PROCESS_STATUS_VALUES);
export type ProcessStatus = ProcessStatusValue;

/**
 * Hierarchy level values from Gherkin @libar-docs-level tag
 *
 * Three-level hierarchy for organizing work:
 * - **epic**: Multi-quarter strategic initiatives
 * - **phase**: Standard work units (2-5 days)
 * - **task**: Fine-grained session-level work (1-4 hours)
 *
 * Default is "phase" for backward compatibility with existing feature files.
 *
 * @see delivery-process/src/taxonomy/hierarchy-levels.ts
 */
export const HierarchyLevelSchema = z.enum(HIERARCHY_LEVELS);
export type HierarchyLevel = TaxonomyHierarchyLevel;

/**
 * Risk level values from Gherkin @libar-docs-risk tag
 *
 * @see delivery-process/src/taxonomy/risk-levels.ts
 */
export const RiskLevelSchema = z.enum(RISK_LEVELS);
export type RiskLevel = TaxonomyRiskLevel;

/**
 * Process metadata from Gherkin feature tags (@libar-docs-*)
 *
 * Extracted from timeline feature files to provide temporal process data
 * (quarter, effort, team, workflow) that complements the timeless pattern
 * graph data from TypeScript code annotations.
 */
export const ProcessMetadataSchema = z
  .object({
    /** Pattern name (must match code) */
    pattern: z.string().min(1),
    /** Phase number (must match code) */
    phase: z.number().int().positive(),
    /** Process status */
    status: ProcessStatusSchema,
    /** Hierarchy level (default: "phase" for backward compatibility) */
    level: HierarchyLevelSchema.default('phase'),
    /** Parent pattern name for hierarchy (from @libar-docs-parent tag) */
    parent: z.string().optional(),
    /** Quarter assignment (e.g., "Q1-2025") */
    quarter: z.string().optional(),
    /** Effort estimate (e.g., "2w", "4d") */
    effort: z.string().optional(),
    /** Team assignment */
    team: z.string().optional(),
    /** Delivery workflow */
    workflow: z.string().optional(),
    /** Completion date (ISO format) */
    completed: z.string().optional(),
    /** Actual effort */
    effortActual: z.string().optional(),
    /** Risk level */
    risk: RiskLevelSchema.optional(),
    /** Pattern brief path */
    brief: z.string().optional(),
    /** Product area for PRD grouping */
    productArea: z.string().optional(),
    /** Target user persona */
    userRole: z.string().optional(),
    /** Business value statement */
    businessValue: z.string().optional(),
  })
  .strict();

export type ProcessMetadata = z.infer<typeof ProcessMetadataSchema>;

/**
 * Deliverable from Gherkin Background table
 *
 * Parsed from Background section tables with format:
 * | Deliverable | Status | Tests | Location |
 *
 * Optional columns for extended tracking:
 * | Deliverable | Status | Tests | Location | Finding | Release |
 *
 * - **Finding**: Review traceability ID (e.g., "CODE-001")
 * - **Release**: Semver version for changelog grouping (e.g., "v0.2.0")
 */
export const DeliverableSchema = z
  .object({
    /** Deliverable name/description */
    name: z.string().min(1),
    /** Status emoji or text */
    status: z.string(),
    /** Number of tests */
    tests: z.number().int().nonnegative(),
    /** Implementation location */
    location: z.string(),
    /** Optional finding ID for review traceability (e.g., "CODE-001", "ARCH-005") */
    finding: z.string().optional(),
    /** Optional release version for changelog grouping (e.g., "v0.2.0") */
    release: z.string().optional(),
  })
  .strict();

export type Deliverable = z.infer<typeof DeliverableSchema>;

/**
 * Cross-validation error when code and feature don't match
 *
 * Reports misalignment between TypeScript code annotations and
 * Gherkin feature tags (e.g., phase number mismatch).
 */
export const CrossValidationErrorSchema = z
  .object({
    /** Pattern name from code */
    codeName: z.string(),
    /** Pattern name from feature */
    featureName: z.string(),
    /** Phase from code (optional) */
    codePhase: z.number().int().positive().optional(),
    /** Phase from feature */
    featurePhase: z.number().int().positive(),
    /** Source file paths */
    sources: z
      .object({
        code: z.string(),
        feature: z.string(),
      })
      .strict(),
    /** Error description */
    message: z.string(),
  })
  .strict();

export type CrossValidationError = z.infer<typeof CrossValidationErrorSchema>;

/**
 * Validation summary from dual-source consistency check
 *
 * Provides boolean validity flag and categorized errors/warnings.
 */
export const ValidationSummarySchema = z
  .object({
    /** True if no errors (warnings don't fail validation) */
    isValid: z.boolean(),
    /** Critical errors (phase mismatches, etc.) */
    errors: z.array(z.string()).readonly(),
    /** Non-critical warnings (orphaned stubs, etc.) */
    warnings: z.array(z.string()).readonly(),
  })
  .strict();

export type ValidationSummary = z.infer<typeof ValidationSummarySchema>;
