/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern DualSourceSchemas
 * @libar-docs-status completed
 * @libar-docs-implements MvpWorkflowImplementation
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
import { type HierarchyLevel as TaxonomyHierarchyLevel, type ProcessStatusValue, type RiskLevel as TaxonomyRiskLevel } from '../taxonomy/index.js';
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
export declare const ProcessStatusSchema: z.ZodEnum<{
    roadmap: "roadmap";
    active: "active";
    completed: "completed";
    deferred: "deferred";
}>;
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
export declare const HierarchyLevelSchema: z.ZodEnum<{
    epic: "epic";
    phase: "phase";
    task: "task";
}>;
export type HierarchyLevel = TaxonomyHierarchyLevel;
/**
 * Risk level values from Gherkin @libar-docs-risk tag
 *
 * @see delivery-process/src/taxonomy/risk-levels.ts
 */
export declare const RiskLevelSchema: z.ZodEnum<{
    low: "low";
    medium: "medium";
    high: "high";
}>;
export type RiskLevel = TaxonomyRiskLevel;
/**
 * Process metadata from Gherkin feature tags (@libar-docs-*)
 *
 * Extracted from timeline feature files to provide temporal process data
 * (quarter, effort, team, workflow) that complements the timeless pattern
 * graph data from TypeScript code annotations.
 */
export declare const ProcessMetadataSchema: z.ZodObject<{
    pattern: z.ZodString;
    phase: z.ZodNumber;
    status: z.ZodEnum<{
        roadmap: "roadmap";
        active: "active";
        completed: "completed";
        deferred: "deferred";
    }>;
    level: z.ZodDefault<z.ZodEnum<{
        epic: "epic";
        phase: "phase";
        task: "task";
    }>>;
    parent: z.ZodOptional<z.ZodString>;
    quarter: z.ZodOptional<z.ZodString>;
    effort: z.ZodOptional<z.ZodString>;
    team: z.ZodOptional<z.ZodString>;
    workflow: z.ZodOptional<z.ZodString>;
    completed: z.ZodOptional<z.ZodString>;
    effortActual: z.ZodOptional<z.ZodString>;
    risk: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
    brief: z.ZodOptional<z.ZodString>;
    productArea: z.ZodOptional<z.ZodString>;
    userRole: z.ZodOptional<z.ZodString>;
    businessValue: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
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
export declare const DeliverableSchema: z.ZodObject<{
    name: z.ZodString;
    status: z.ZodString;
    tests: z.ZodNumber;
    location: z.ZodString;
    finding: z.ZodOptional<z.ZodString>;
    release: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type Deliverable = z.infer<typeof DeliverableSchema>;
/**
 * Cross-validation error when code and feature don't match
 *
 * Reports misalignment between TypeScript code annotations and
 * Gherkin feature tags (e.g., phase number mismatch).
 */
export declare const CrossValidationErrorSchema: z.ZodObject<{
    codeName: z.ZodString;
    featureName: z.ZodString;
    codePhase: z.ZodOptional<z.ZodNumber>;
    featurePhase: z.ZodNumber;
    sources: z.ZodObject<{
        code: z.ZodString;
        feature: z.ZodString;
    }, z.core.$strict>;
    message: z.ZodString;
}, z.core.$strict>;
export type CrossValidationError = z.infer<typeof CrossValidationErrorSchema>;
/**
 * Validation summary from dual-source consistency check
 *
 * Provides boolean validity flag and categorized errors/warnings.
 */
export declare const ValidationSummarySchema: z.ZodObject<{
    isValid: z.ZodBoolean;
    errors: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    warnings: z.ZodReadonly<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type ValidationSummary = z.infer<typeof ValidationSummarySchema>;
//# sourceMappingURL=dual-source.d.ts.map