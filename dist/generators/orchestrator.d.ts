/**
 * @libar-docs
 * @libar-docs-core @libar-docs-infra
 * @libar-docs-pattern Documentation Generation Orchestrator
 * @libar-docs-status completed
 * @libar-docs-uses Pattern Scanner, Doc Extractor, Gherkin Scanner, Gherkin Extractor, Generator Registry, JSON Output Codec
 * @libar-docs-used-by CLI, Programmatic API
 * @libar-docs-usecase "When running full documentation generation pipeline"
 * @libar-docs-usecase "When merging TypeScript and Gherkin patterns"
 *
 * ## Documentation Generation Orchestrator - Full Pipeline Coordination
 *
 * Orchestrates the complete documentation generation pipeline:
 * Scanner → Extractor → Generators → File Writer
 *
 * Extracts business logic from CLI for programmatic use and testing.
 *
 * ### When to Use
 *
 * - Running complete documentation generation programmatically
 * - Integrating doc generation into build scripts
 * - Testing the full pipeline without CLI overhead
 *
 * ### Key Concepts
 *
 * - **Dual-Source Merging**: Combines TypeScript and Gherkin patterns
 * - **Generator Registry**: Looks up registered generators by name
 * - **Result Monad**: Returns detailed errors for partial failures
 */
import type { TagRegistry, ExtractedPattern } from "../validation-schemas/index.js";
import type { Result } from "../types/index.js";
/**
 * Options for documentation generation
 */
export interface GenerateOptions {
    /** Glob patterns for TypeScript source files */
    input: string[];
    /** Glob patterns to exclude */
    exclude?: string[];
    /** Base directory for resolving relative paths */
    baseDir: string;
    /** Output directory for generated files */
    outputDir: string;
    /**
     * @deprecated Since v1.0.0 - Use `delivery-process.config.ts` files instead.
     * Config discovery now uses TypeScript configuration files.
     * This option is ignored.
     */
    tagRegistryPath?: string | null;
    /** Generator names to run (e.g., ['patterns', 'adrs']) */
    generators: string[];
    /** Overwrite existing files (default: false) */
    overwrite?: boolean;
    /** Glob patterns for .feature files (supports multiple patterns) */
    features?: string | string[] | null;
    /** Path to custom workflow config (loads default if not specified) */
    workflowPath?: string | null;
    /**
     * Git diff base branch for PR-scoped generators.
     * When provided, auto-detects changed files by comparing HEAD to this branch.
     * @example "main", "develop"
     */
    gitDiffBase?: string;
    /**
     * Explicit list of changed files. Overrides git detection when provided.
     * Useful for programmatic use or when git detection is not desired.
     */
    changedFiles?: string[];
    /**
     * Release version filter for PR Changes generator.
     * @example "v0.2.0"
     */
    releaseFilter?: string;
}
/**
 * Result of documentation generation
 */
export interface GenerateResult {
    /** Extracted patterns from source code */
    readonly patterns: readonly ExtractedPattern[];
    /** Generated files (path + content) */
    readonly files: readonly GeneratedFile[];
    /** Tag registry used for generation */
    readonly registry: TagRegistry;
    /** Errors encountered during generation */
    readonly errors: readonly GenerationError[];
    /** Warnings (non-fatal issues) */
    readonly warnings: readonly GenerationWarning[];
}
/**
 * Generated file with metadata
 */
export interface GeneratedFile {
    /** Relative path from outputDir */
    path: string;
    /** Full absolute path */
    fullPath: string;
    /** File content */
    content: string;
    /** Generator that created this file */
    generator: string;
    /** Whether file was written (false if skipped due to overwrite=false) */
    written: boolean;
}
/**
 * Generation error
 */
export interface GenerationError {
    type: "scan" | "extraction" | "generator" | "file-write";
    message: string;
    generator?: string;
    filePath?: string;
}
/**
 * Detail for a single error within a warning
 */
export interface WarningDetail {
    file: string;
    line?: number;
    column?: number;
    message: string;
}
/**
 * Generation warning
 */
export interface GenerationWarning {
    type: "scan" | "extraction" | "overwrite-skipped" | "config" | "cleanup";
    message: string;
    count?: number;
    filePath?: string;
    /** Detailed error information for each affected file */
    details?: WarningDetail[];
}
/**
 * Generate documentation from TypeScript source code
 *
 * Orchestrates the complete pipeline:
 * 1. Load tag registry
 * 2. Scan source files for @libar-docs directives
 * 3. Extract patterns from directives
 * 4. Run specified generators
 * 5. Write output files
 *
 * @param options - Generation options
 * @returns Result with patterns, files, and any errors/warnings
 *
 * @example
 * ```typescript
 * import { generateDocumentation } from '@libar-dev/delivery-process/generators';
 * import '@libar-dev/delivery-process/generators/built-in';
 *
 * const result = await generateDocumentation({
 *   input: ['src/**\/*.ts'],
 *   baseDir: process.cwd(),
 *   outputDir: 'docs',
 *   generators: ['patterns'],
 *   overwrite: true
 * });
 *
 * console.log(`Generated ${result.files.length} files`);
 * console.log(`Extracted ${result.patterns.length} patterns`);
 * ```
 */
export declare function generateDocumentation(options: GenerateOptions): Promise<Result<GenerateResult, string>>;
/**
 * Result from cleaning up orphaned session files.
 */
export interface CleanupResult {
    /** Files that were successfully deleted */
    readonly deleted: readonly string[];
    /** Errors encountered during cleanup (non-fatal) */
    readonly errors: readonly string[];
}
/**
 * Clean up orphaned session files in a directory.
 *
 * Deletes session files (phase-*.md) that are not in the preserve list.
 * This is used to clean up stale session files when phases complete.
 *
 * @param outputDir - Base output directory
 * @param sessionsDir - Subdirectory containing session files (e.g., "sessions/")
 * @param preserveFiles - Set of file basenames to preserve (e.g., "phase-39.md")
 * @returns Result with deleted files and any errors
 *
 * @example
 * ```typescript
 * const result = await cleanupOrphanedSessionFiles(
 *   "/output",
 *   "sessions/",
 *   new Set(["phase-39.md"])  // Keep active phase
 * );
 * console.log(`Deleted ${result.deleted.length} orphaned files`);
 * ```
 */
export declare function cleanupOrphanedSessionFiles(outputDir: string, sessionsDir: string, preserveFiles: Set<string>): Promise<CleanupResult>;
//# sourceMappingURL=orchestrator.d.ts.map