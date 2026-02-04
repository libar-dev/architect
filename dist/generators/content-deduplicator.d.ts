/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ContentDeduplicator
 * @libar-docs-status roadmap
 * @libar-docs-phase 28
 *
 * ## Content Deduplicator - Duplicate Content Detection and Merging
 *
 * Identifies and merges duplicate sections extracted from multiple sources.
 * Uses content fingerprinting to detect duplicates and merges them based on
 * configurable priority rules.
 *
 * ### When to Use
 *
 * - After source mapping extracts content from multiple files
 * - When multiple sources may contain the same documentation
 * - Before assembling the final RenderableDocument
 *
 * ### Key Concepts
 *
 * - **Content Fingerprint**: SHA-256 hash of normalized text for duplicate detection
 * - **Source Priority**: TypeScript > Decision > Feature file
 * - **Content Richness**: More lines wins when priorities are equal
 * - **Header Disambiguation**: Adds source suffix when headers conflict
 */
import type { ExtractedSection } from './source-mapper.js';
import type { Warning, WarningCollector } from './warning-collector.js';
/**
 * A content block with metadata for deduplication
 */
export interface ContentBlock {
    /** Section header text */
    header: string;
    /** Section body content */
    body: string;
    /** Source file path */
    source: string;
    /** Content fingerprint for duplicate detection */
    fingerprint?: string;
    /** Number of lines in the body */
    lineCount: number;
    /** Original index in the input array (for precise removal) */
    originalIndex?: number;
}
/**
 * A pair of content blocks that were merged
 */
export interface MergedPair {
    /** The content block that was kept */
    kept: ContentBlock;
    /** The content block that was removed */
    removed: ContentBlock;
}
/**
 * Result of deduplication processing
 */
export interface DeduplicationResult {
    /** Deduplicated sections in original order */
    sections: ExtractedSection[];
    /** Pairs of content that were merged */
    mergedPairs: MergedPair[];
    /** Warnings produced during deduplication */
    warnings: Warning[];
}
/**
 * Options for deduplication
 */
export interface DeduplicatorOptions {
    /** Optional warning collector for capturing warnings */
    warningCollector?: WarningCollector;
}
/**
 * Compute a content fingerprint using SHA-256.
 * Returns a 16-character hex string (64 bits).
 *
 * Note: 16 hex chars (64 bits) provides sufficient collision resistance for
 * documentation deduplication. Birthday paradox collision probability is
 * less than 0.001% for up to 10,000 sections, which exceeds expected usage.
 */
export declare function computeFingerprint(content: string): string;
/**
 * Find duplicate content blocks by fingerprint.
 * Returns a map from fingerprint to all blocks with that fingerprint.
 */
export declare function findDuplicates(blocks: ContentBlock[]): Map<string, ContentBlock[]>;
/**
 * Deduplicate sections extracted from multiple sources.
 *
 * Algorithm:
 * 1. Convert sections to content blocks with fingerprints
 * 2. Find duplicate fingerprints
 * 3. For each duplicate group, keep highest priority source (or richest content)
 * 4. Handle header conflicts (same header, different content)
 * 5. Remove empty sections
 * 6. Preserve original order (first occurrence position)
 *
 * @param sections - Extracted sections to deduplicate
 * @param options - Deduplication options
 * @returns Deduplicated sections with merge info and warnings
 */
export declare function deduplicateSections(sections: readonly ExtractedSection[], options?: DeduplicatorOptions): DeduplicationResult;
//# sourceMappingURL=content-deduplicator.d.ts.map