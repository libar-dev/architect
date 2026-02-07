/**
 * @libar-docs
 * @libar-docs-pattern StubResolverImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIStubIntegration
 * @libar-docs-uses ProcessStateAPI
 * @libar-docs-used-by ProcessAPICLIImpl
 *
 * ## StubResolver — Design Stub Discovery and Resolution
 *
 * Identifies design session stubs in the MasterDataset and resolves them
 * against the filesystem to determine implementation status.
 *
 * Stub identification heuristic:
 * - Source file path contains `/stubs/` (lives in stubs directory), OR
 * - Pattern has a `targetPath` field (from @libar-docs-target tag)
 *
 * Resolution uses a `fileExists` callback (defaulting to `fs.existsSync()`) on
 * targetPath — not pipeline data — because target files may not have `@libar-docs`
 * annotations. The callback enables testing without filesystem side effects.
 */
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
/**
 * Result of resolving a single stub against the filesystem.
 */
export interface StubResolution {
    /** The stub's pattern name */
    readonly stubName: string;
    /** Source file path of the stub */
    readonly stubFile: string;
    /** Target implementation path (from @libar-docs-target) */
    readonly targetPath: string;
    /** Design session that created this stub (from @libar-docs-since) */
    readonly since: string | undefined;
    /** Parent pattern this stub implements (from @libar-docs-implements) */
    readonly implementsPattern: string | undefined;
    /** Whether the target file exists on disk */
    readonly targetExists: boolean;
}
/**
 * Summary of all stubs grouped by the pattern they implement.
 */
export interface StubSummary {
    /** Pattern name that stubs implement */
    readonly pattern: string;
    /** All stubs for this pattern */
    readonly stubs: readonly StubResolution[];
    /** Count of resolved (target exists) stubs */
    readonly resolvedCount: number;
    /** Count of unresolved (target missing) stubs */
    readonly unresolvedCount: number;
}
/**
 * A single extracted decision item from stub description text.
 */
export interface DecisionItem {
    /** Decision ID (e.g., "AD-1") */
    readonly id: string;
    /** Description text */
    readonly description: string;
    /** Referenced PDR number, if any */
    readonly pdr: string | undefined;
}
/**
 * A pattern reference to a PDR.
 */
export interface PdrReference {
    /** Pattern name referencing the PDR */
    readonly pattern: string;
    /** Where the reference was found */
    readonly source: 'description' | 'seeAlso';
    /** Source file path */
    readonly filePath: string;
}
/**
 * Identify stub patterns from the MasterDataset.
 *
 * A pattern is a stub if:
 * 1. Its source file path contains '/stubs/' (lives in stubs directory), OR
 * 2. It has a `targetPath` field (from @libar-docs-target tag)
 */
export declare function findStubPatterns(dataset: MasterDataset): readonly ExtractedPattern[];
/**
 * Resolve stubs against the filesystem to determine implementation status.
 *
 * For each stub pattern with a `targetPath`:
 * - Resolves the path relative to baseDir
 * - Checks if the target file exists via `fileExists` callback
 * - Extracts stub metadata (since, implementsPattern)
 */
export declare function resolveStubs(stubs: readonly ExtractedPattern[], baseDir: string, fileExists?: (path: string) => boolean): readonly StubResolution[];
/**
 * Group stub resolutions by the pattern they implement.
 *
 * Stubs that share the same `implementsPattern` value are grouped together.
 * Stubs without an `implementsPattern` are grouped under their own stubName.
 */
export declare function groupStubsByPattern(resolutions: readonly StubResolution[]): readonly StubSummary[];
/**
 * Extract AD-N decision items from a pattern's description text.
 *
 * Parses JSDoc description for references like:
 * - `AD-1: Unified action model (PDR-011)`
 * - `AD-5: Router maps command types to orchestrator`
 */
export declare function extractDecisionItems(description: string): readonly DecisionItem[];
/**
 * Cross-reference all patterns that mention a specific PDR number.
 *
 * Scans pattern descriptions and seeAlso references
 * for `PDR-{number}` occurrences.
 */
export declare function findPdrReferences(patterns: readonly ExtractedPattern[], pdrNumber: string): readonly PdrReference[];
//# sourceMappingURL=stub-resolver.d.ts.map