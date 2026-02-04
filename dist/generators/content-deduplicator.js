/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ContentDeduplicator
 * @libar-docs-status completed
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
import * as crypto from 'node:crypto';
// =============================================================================
// Constants
// =============================================================================
/**
 * Source priority values (higher = more authoritative)
 */
const SOURCE_PRIORITY = {
    typescript: 3, // .ts files
    decision: 2, // THIS DECISION markers
    feature: 1, // .feature files
};
// =============================================================================
// Helper Functions
// =============================================================================
/**
 * Normalize content for fingerprinting.
 * Strips whitespace variations to detect semantically identical content.
 */
function normalizeForFingerprint(content) {
    return content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(' ')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}
/**
 * Compute a content fingerprint using SHA-256.
 * Returns a 16-character hex string (64 bits).
 *
 * Note: 16 hex chars (64 bits) provides sufficient collision resistance for
 * documentation deduplication. Birthday paradox collision probability is
 * less than 0.001% for up to 10,000 sections, which exceeds expected usage.
 */
export function computeFingerprint(content) {
    const normalized = normalizeForFingerprint(content);
    return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}
/**
 * Determine source type from file path
 */
function getSourceType(sourceFile) {
    if (sourceFile.endsWith('.ts')) {
        return 'typescript';
    }
    if (sourceFile.toUpperCase().includes('THIS DECISION')) {
        return 'decision';
    }
    if (sourceFile.endsWith('.feature')) {
        return 'feature';
    }
    // Default to feature (lowest priority) for unknown types
    return 'feature';
}
/**
 * Get priority value for a source file
 */
function getSourcePriority(sourceFile) {
    const sourceType = getSourceType(sourceFile);
    return SOURCE_PRIORITY[sourceType] ?? 1;
}
/**
 * Count non-empty lines in content
 */
function countLines(content) {
    return content.split('\n').filter((line) => line.trim().length > 0).length;
}
/**
 * Convert ExtractedSection to ContentBlock with original index tracking
 *
 * @param section - The extracted section to convert
 * @param index - Original index in the sections array (for precise removal)
 */
function sectionToBlock(section, index) {
    return {
        header: section.section,
        body: section.content,
        source: section.sourceFile,
        fingerprint: computeFingerprint(section.content),
        lineCount: countLines(section.content),
        originalIndex: index,
    };
}
/**
 * Find duplicate content blocks by fingerprint.
 * Returns a map from fingerprint to all blocks with that fingerprint.
 */
export function findDuplicates(blocks) {
    const groups = new Map();
    for (const block of blocks) {
        if (!block.fingerprint) {
            continue;
        }
        const existing = groups.get(block.fingerprint);
        if (existing) {
            existing.push(block);
        }
        else {
            groups.set(block.fingerprint, [block]);
        }
    }
    // Filter to only groups with duplicates
    const duplicates = new Map();
    for (const [fingerprint, group] of groups) {
        if (group.length > 1) {
            duplicates.set(fingerprint, group);
        }
    }
    return duplicates;
}
/**
 * Choose which block to keep from a set of duplicates.
 * Higher priority source wins; if equal, richer content (more lines) wins.
 *
 * Uses non-empty tuple type to guarantee at compile time that at least
 * one block exists. Callers must ensure the array is non-empty before calling.
 *
 * @param blocks - Non-empty array of content blocks (at least one element)
 * @returns The winning block
 */
function chooseWinner(blocks) {
    const [first, ...rest] = blocks;
    let winner = first;
    for (const block of rest) {
        const winnerPriority = getSourcePriority(winner.source);
        const blockPriority = getSourcePriority(block.source);
        if (blockPriority > winnerPriority) {
            winner = block;
        }
        else if (blockPriority === winnerPriority && block.lineCount > winner.lineCount) {
            winner = block;
        }
    }
    return winner;
}
/**
 * Find sections with same header but different content (header conflicts)
 */
function findHeaderConflicts(sections) {
    const byHeader = new Map();
    for (const section of sections) {
        const existing = byHeader.get(section.section);
        if (existing) {
            existing.push(section);
        }
        else {
            byHeader.set(section.section, [section]);
        }
    }
    // Filter to only headers with multiple sections AND different fingerprints
    const conflicts = new Map();
    for (const [header, group] of byHeader) {
        if (group.length > 1) {
            const fingerprints = new Set(group.map((s) => computeFingerprint(s.content)));
            if (fingerprints.size > 1) {
                conflicts.set(header, group);
            }
        }
    }
    return conflicts;
}
/**
 * Disambiguate headers by adding source suffix
 */
function disambiguateHeader(section) {
    // Extract a short source name from the file path
    const sourceName = section.sourceFile
        .replace(/^.*\//, '') // Remove path
        .replace(/\.[^.]+$/, '') // Remove extension
        .replace(/[_]/g, '-') // Normalize underscores to hyphens
        .toLowerCase();
    return `${section.section} (from ${sourceName})`;
}
// =============================================================================
// Main Function
// =============================================================================
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
export function deduplicateSections(sections, options) {
    const warnings = [];
    const mergedPairs = [];
    if (sections.length === 0) {
        return { sections: [], mergedPairs: [], warnings: [] };
    }
    // Convert to content blocks with original indices for precise removal
    const blocks = sections.map((section, index) => sectionToBlock(section, index));
    // Find duplicates by fingerprint
    const duplicates = findDuplicates(blocks);
    // Track which sections to remove (by original index)
    const removeIndices = new Set();
    // Process each duplicate group
    // Note: findDuplicates only returns groups with 2+ blocks, so this assertion is safe
    for (const [_fingerprint, duplicateBlocks] of duplicates) {
        const winner = chooseWinner(duplicateBlocks);
        // Mark losers for removal using their original indices
        for (const block of duplicateBlocks) {
            if (block !== winner) {
                // Use the tracked original index for precise removal
                // This avoids mismatch when same file has duplicate headers
                const idx = block.originalIndex;
                if (idx !== undefined) {
                    removeIndices.add(idx);
                    mergedPairs.push({
                        kept: winner,
                        removed: block,
                    });
                    // Capture warning if collector provided
                    if (options?.warningCollector) {
                        options.warningCollector.capture({
                            source: block.source,
                            category: 'deduplication',
                            message: `Duplicate content merged; kept version from ${winner.source}`,
                        });
                    }
                    warnings.push({
                        source: block.source,
                        category: 'deduplication',
                        message: `Duplicate content merged; kept version from ${winner.source}`,
                    });
                }
            }
        }
    }
    // Build filtered section list (preserving order)
    // Explicitly type to ensure ExtractedSection compatibility
    let filteredSections = sections
        .filter((_, idx) => !removeIndices.has(idx))
        .map((s) => ({
        section: s.section,
        sourceFile: s.sourceFile,
        extractionMethod: s.extractionMethod,
        content: s.content,
        ...(s.shapes !== undefined && { shapes: s.shapes }),
        ...(s.docStrings !== undefined && { docStrings: s.docStrings }),
    }));
    // Handle header conflicts (same header, different content from different sources)
    const headerConflicts = findHeaderConflicts(filteredSections);
    for (const [header, conflictingSections] of headerConflicts) {
        // Disambiguate headers
        for (const section of conflictingSections) {
            const idx = filteredSections.findIndex((s) => s.section === header && s.sourceFile === section.sourceFile);
            const existing = idx !== -1 ? filteredSections[idx] : undefined;
            if (idx !== -1 && existing) {
                filteredSections[idx] = {
                    section: disambiguateHeader(section),
                    sourceFile: existing.sourceFile,
                    extractionMethod: existing.extractionMethod,
                    content: existing.content,
                    ...(existing.shapes !== undefined && { shapes: existing.shapes }),
                    ...(existing.docStrings !== undefined && { docStrings: existing.docStrings }),
                };
            }
        }
    }
    // Remove empty sections
    const emptySections = filteredSections.filter((s) => !s.content || s.content.trim().length === 0);
    for (const emptySection of emptySections) {
        const warning = {
            source: emptySection.sourceFile,
            category: 'deduplication',
            message: `Empty section "${emptySection.section}" removed`,
        };
        warnings.push(warning);
        if (options?.warningCollector) {
            options.warningCollector.capture(warning);
        }
    }
    filteredSections = filteredSections.filter((s) => s.content.trim().length > 0);
    return {
        sections: filteredSections,
        mergedPairs,
        warnings,
    };
}
//# sourceMappingURL=content-deduplicator.js.map