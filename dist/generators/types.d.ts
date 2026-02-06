/**
 * @libar-docs
 */
import type { ExtractedPattern, TagRegistry } from '../validation-schemas';
import type { LoadedWorkflow } from '../validation-schemas/workflow-config.js';
import type { RuntimeMasterDataset } from './pipeline/index.js';
import type { CodecOptions } from '../renderable/generate.js';
/**
 * @libar-docs-generator
 * @libar-docs-pattern GeneratorTypes
 * @libar-docs-status completed
 * @libar-docs-used-by GeneratorRegistry, GeneratorFactory, Orchestrator, SectionRegistry
 * @libar-docs-extract-shapes DocumentGenerator, GeneratorContext, GeneratorOutput
 *
 * ## GeneratorTypes - Pluggable Document Generation Interface
 *
 * Minimal interface for pluggable generators that produce documentation from patterns.
 * Both JSON-configured built-in generators and TypeScript custom generators implement this.
 *
 * ### When to Use
 *
 * - Creating a new document format (ADRs, planning docs, API specs)
 * - Building custom generators in TypeScript
 * - Integrating with the unified CLI
 *
 * ### Key Concepts
 *
 * - **Generator:** Transforms patterns → document files
 * - **Context:** Runtime environment (base paths, registries, scenarios)
 * - **Output:** Map of file paths → content
 */
export interface DocumentGenerator {
    /** Unique generator name (e.g., "patterns", "adrs", "planning") */
    readonly name: string;
    /** Optional description shown in --list-generators */
    readonly description?: string;
    /**
     * Generate documentation from extracted patterns.
     *
     * @param patterns - Extracted patterns from source code
     * @param context - Runtime context (paths, registry, scenario map)
     * @returns Generated files with paths relative to outputDir
     */
    generate(patterns: readonly ExtractedPattern[], context: GeneratorContext): Promise<GeneratorOutput>;
}
/**
 * Runtime context provided to generators.
 */
export interface GeneratorContext {
    /** Base directory for resolving relative paths */
    readonly baseDir: string;
    /** Output directory for generated files */
    readonly outputDir: string;
    /** Tag registry with category/aggregation definitions */
    readonly registry: TagRegistry;
    /** Optional workflow configuration for status handling */
    readonly workflow?: LoadedWorkflow;
    /**
     * Pre-computed pattern views for efficient access.
     *
     * Contains patterns grouped by status, phase, quarter, category, and source,
     * computed in a single pass. Sections should use these pre-computed views
     * instead of filtering the raw patterns array.
     */
    readonly masterDataset?: RuntimeMasterDataset;
    /**
     * Optional codec-specific options for document generation.
     *
     * Used to pass runtime configuration (e.g., changedFiles for PR changes)
     * through the CLI → Orchestrator → Generator → Codec pipeline.
     *
     * @example
     * ```typescript
     * const context: GeneratorContext = {
     *   // ... other fields
     *   codecOptions: {
     *     "pr-changes": { changedFiles: ["src/foo.ts"], releaseFilter: "v0.2.0" }
     *   }
     * };
     * ```
     */
    readonly codecOptions?: CodecOptions;
}
/**
 * Output from generator execution.
 */
export interface GeneratorOutput {
    /** Files to write (path relative to outputDir) */
    readonly files: readonly OutputFile[];
    /** Files to delete for cleanup (path relative to outputDir) */
    readonly filesToDelete?: readonly string[];
    /** Optional metadata for registry.json or other purposes */
    readonly metadata?: Record<string, unknown>;
}
/**
 * Single output file.
 */
export interface OutputFile {
    /** Path relative to outputDir (e.g., "PATTERNS.md", "patterns/core.md") */
    readonly path: string;
    /** File content as string */
    readonly content: string;
}
//# sourceMappingURL=types.d.ts.map