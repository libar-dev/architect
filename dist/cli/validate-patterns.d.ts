#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern ValidatePatternsCLI
 * @libar-docs-status completed
 * @libar-docs-uses PatternScanner, GherkinScanner, DocExtractor, GherkinExtractor, MasterDataset, CodecUtils
 * @libar-docs-extract-shapes ValidateCLIConfig, ValidationIssue, ValidationSummary
 *
 * ## ValidatePatternsCLI - Cross-Source Pattern Validator
 *
 * Cross-validates TypeScript patterns vs Gherkin feature files.
 * Ensures consistency between code annotations and feature specifications.
 *
 * ### Exit Codes
 *
 * - `0` - No errors
 * - `1` - Errors found
 * - `2` - Warnings found (with --strict)
 *
 * ### When to Use
 *
 * - Pre-commit validation to ensure code and feature files stay in sync
 * - CI pipeline to catch documentation drift early
 * - Strict mode (`--strict`) for production readiness checks
 */
import type { RuntimeMasterDataset } from '../generators/pipeline/index.js';
/**
 * Validation issue severity
 */
export type IssueSeverity = 'error' | 'warning' | 'info';
/**
 * Validation issue
 */
export interface ValidationIssue {
    severity: IssueSeverity;
    message: string;
    source: 'typescript' | 'gherkin' | 'cross-source';
    pattern?: string;
    file?: string;
}
/**
 * Validation summary
 */
export interface ValidationSummary {
    issues: ValidationIssue[];
    stats: {
        typescriptPatterns: number;
        gherkinPatterns: number;
        matched: number;
        missingInGherkin: number;
        missingInTypeScript: number;
    };
}
/**
 * CLI configuration
 */
export interface ValidateCLIConfig {
    /** Glob patterns for TypeScript input files */
    input: string[];
    /** Glob patterns for Gherkin feature files */
    features: string[];
    /** Glob patterns to exclude */
    exclude: string[];
    /** Base directory for path resolution */
    baseDir: string;
    /** Treat warnings as errors */
    strict: boolean;
    /** Output format */
    format: 'pretty' | 'json';
    /** Show help */
    help: boolean;
    /** Enable DoD validation mode */
    dod: boolean;
    /** Specific phases to validate (empty = all completed phases) */
    phases: number[];
    /** Enable anti-pattern detection */
    antiPatterns: boolean;
    /** Override scenario bloat threshold */
    scenarioBloatThreshold: number;
    /** Override mega-feature line threshold */
    megaFeatureLineThreshold: number;
    /** Override magic comment threshold */
    magicCommentThreshold: number;
    /** Show version */
    version: boolean;
    /** Show info-level messages in pretty output */
    verbose: boolean;
}
/**
 * Parse command line arguments
 */
export declare function parseArgs(argv?: string[]): ValidateCLIConfig;
/**
 * Print usage information
 */
export declare function printHelp(): void;
/**
 * Validate cross-source consistency using the MasterDataset read model.
 *
 * Compares TypeScript patterns against Gherkin patterns to find:
 * - Missing patterns in either source (with implements-aware resolution)
 * - Phase number mismatches
 * - Status mismatches (after normalization)
 * - Missing deliverables for completed phases
 * - Invalid dependencies
 *
 * DD-2: Consumes RuntimeMasterDataset instead of raw scanner/extractor output.
 * DD-3: Two-phase matching — name-based first, then relationshipIndex fallback.
 *
 * @param dataset - The pre-computed MasterDataset read model
 * @returns Validation summary with issues and statistics
 */
export declare function validatePatterns(dataset: RuntimeMasterDataset): ValidationSummary;
//# sourceMappingURL=validate-patterns.d.ts.map