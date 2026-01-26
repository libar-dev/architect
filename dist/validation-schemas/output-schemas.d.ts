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
/**
 * Schema for individual lint violation in JSON output
 *
 * Simplified structure for external consumption (excludes `file` which is
 * on the parent result object).
 */
export declare const LintViolationOutputSchema: z.ZodObject<{
    rule: z.ZodString;
    severity: z.ZodEnum<{
        error: "error";
        warning: "warning";
        info: "info";
    }>;
    message: z.ZodString;
    line: z.ZodNumber;
}, z.core.$strip>;
/**
 * Schema for lint result per file in JSON output
 */
export declare const LintResultOutputSchema: z.ZodObject<{
    file: z.ZodString;
    violations: z.ZodArray<z.ZodObject<{
        rule: z.ZodString;
        severity: z.ZodEnum<{
            error: "error";
            warning: "warning";
            info: "info";
        }>;
        message: z.ZodString;
        line: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Schema for lint summary statistics in JSON output
 */
export declare const LintSummaryStatsSchema: z.ZodObject<{
    errors: z.ZodNumber;
    warnings: z.ZodNumber;
    info: z.ZodNumber;
    filesScanned: z.ZodNumber;
    directivesChecked: z.ZodNumber;
}, z.core.$strip>;
/**
 * Schema for complete lint JSON output
 *
 * This is the schema for the output of `lint-patterns --format json`
 */
export declare const LintOutputSchema: z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
        file: z.ZodString;
        violations: z.ZodArray<z.ZodObject<{
            rule: z.ZodString;
            severity: z.ZodEnum<{
                error: "error";
                warning: "warning";
                info: "info";
            }>;
            message: z.ZodString;
            line: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    summary: z.ZodObject<{
        errors: z.ZodNumber;
        warnings: z.ZodNumber;
        info: z.ZodNumber;
        filesScanned: z.ZodNumber;
        directivesChecked: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type LintOutput = z.infer<typeof LintOutputSchema>;
/**
 * Schema for validation issue severity
 *
 * @see src/taxonomy/severity-types.ts
 */
export declare const ValidationIssueSeveritySchema: z.ZodEnum<{
    error: "error";
    warning: "warning";
    info: "info";
}>;
/**
 * Schema for validation issue source
 */
export declare const ValidationIssueSourceSchema: z.ZodEnum<{
    gherkin: "gherkin";
    typescript: "typescript";
    "cross-source": "cross-source";
}>;
/**
 * Schema for individual validation issue in JSON output
 */
export declare const ValidationIssueOutputSchema: z.ZodObject<{
    severity: z.ZodEnum<{
        error: "error";
        warning: "warning";
        info: "info";
    }>;
    message: z.ZodString;
    source: z.ZodEnum<{
        gherkin: "gherkin";
        typescript: "typescript";
        "cross-source": "cross-source";
    }>;
    pattern: z.ZodOptional<z.ZodString>;
    file: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Schema for validation statistics
 */
export declare const ValidationStatsSchema: z.ZodObject<{
    typescriptPatterns: z.ZodNumber;
    gherkinPatterns: z.ZodNumber;
    matched: z.ZodNumber;
    missingInGherkin: z.ZodNumber;
    missingInTypeScript: z.ZodNumber;
}, z.core.$strip>;
/**
 * Schema for complete validation JSON output
 *
 * This is the schema for the output of `validate-patterns --format json`
 */
export declare const ValidationSummaryOutputSchema: z.ZodObject<{
    issues: z.ZodArray<z.ZodObject<{
        severity: z.ZodEnum<{
            error: "error";
            warning: "warning";
            info: "info";
        }>;
        message: z.ZodString;
        source: z.ZodEnum<{
            gherkin: "gherkin";
            typescript: "typescript";
            "cross-source": "cross-source";
        }>;
        pattern: z.ZodOptional<z.ZodString>;
        file: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    stats: z.ZodObject<{
        typescriptPatterns: z.ZodNumber;
        gherkinPatterns: z.ZodNumber;
        matched: z.ZodNumber;
        missingInGherkin: z.ZodNumber;
        missingInTypeScript: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ValidationSummaryOutput = z.infer<typeof ValidationSummaryOutputSchema>;
/**
 * Schema for registry metadata JSON output
 *
 * This is intentionally loose since generators can return arbitrary metadata.
 * The schema ensures it's a valid JSON-serializable object.
 */
export declare const RegistryMetadataOutputSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export type RegistryMetadataOutput = z.infer<typeof RegistryMetadataOutputSchema>;
//# sourceMappingURL=output-schemas.d.ts.map