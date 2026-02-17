/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern AdrDocumentCodec
 * @libar-docs-status completed
 *
 * ## ADR Document Codec
 *
 * Transforms MasterDataset into RenderableDocument for Architecture Decision Records.
 * Extracts ADRs from patterns with `@libar-docs-adr` tags.
 *
 * ### When to Use
 *
 * - When generating Architecture Decision Record documentation
 * - When extracting ADRs from feature files with structured annotations
 * - When building custom ADR reports with configurable content sections
 *
 * ### Factory Pattern
 *
 * Use `createAdrCodec(options)` for custom options:
 * ```typescript
 * const codec = createAdrCodec({
 *   groupBy: 'phase',
 *   includeContext: true,
 *   includeDecision: true,
 *   includeConsequences: false,
 * });
 * const doc = codec.decode(dataset);
 * ```
 *
 * ### ADR Content
 *
 * ADR content is parsed from feature file descriptions:
 * - **Context**: Problem background and constraints
 * - **Decision**: The chosen solution
 * - **Consequences**: Positive and negative outcomes
 */
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { partitionRulesByPrefix, renderRuleDescription, dedent, } from './helpers.js';
import { extractTablesFromDescription } from './convention-extractor.js';
import { heading, paragraph, separator, table, code, collapsible, linkOut, document, } from '../schema.js';
import { getDisplayName } from '../utils.js';
import { groupBy } from '../../utils/index.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
/**
 * Default options for AdrDocumentCodec
 */
export const DEFAULT_ADR_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    groupBy: 'category',
    includeContext: true,
    includeDecision: true,
    includeConsequences: true,
};
import { RenderableDocumentOutputSchema } from './shared-schema.js';
// ═══════════════════════════════════════════════════════════════════════════
// ADR Document Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create an AdrDocumentCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Group by phase instead of category
 * const codec = createAdrCodec({ groupBy: 'phase' });
 *
 * // Hide consequences section
 * const codec = createAdrCodec({ includeConsequences: false });
 *
 * // Inline all categories (no progressive disclosure)
 * const codec = createAdrCodec({ generateDetailFiles: false });
 * ```
 */
export function createAdrCodec(options) {
    const opts = mergeOptions(DEFAULT_ADR_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildAdrDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('AdrDocumentCodec is decode-only. See zod-codecs.md');
        },
    });
}
/**
 * Default ADR Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for architecture decisions.
 * Groups ADRs by category with progressive disclosure.
 */
export const AdrDocumentCodec = createAdrCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build ADR document
 */
function buildAdrDocument(dataset, options) {
    const sections = [];
    // Filter to patterns with ADR metadata
    const adrPatterns = dataset.patterns.filter((p) => p.adr !== undefined);
    if (adrPatterns.length === 0) {
        sections.push(heading(2, 'No Architecture Decisions'), paragraph('No patterns have @libar-docs-adr tags.'));
        return document('Architecture Decision Records', sections, {
            purpose: 'Architectural decisions extracted from feature files',
        });
    }
    // 1. Summary
    sections.push(...buildAdrSummary(adrPatterns));
    // 2. ADRs by grouping
    if (options.groupBy === 'phase') {
        sections.push(...buildAdrsByPhase(adrPatterns, options));
    }
    else if (options.groupBy === 'date') {
        sections.push(...buildAdrsByDate(adrPatterns, options));
    }
    else {
        // Default: category
        sections.push(...buildAdrsByCategory(adrPatterns, options));
    }
    // 3. ADR index table
    sections.push(...buildAdrIndexTable(adrPatterns, options));
    // Build category detail files (if enabled and threshold met)
    const additionalFiles = options.generateDetailFiles
        ? buildAdrDetailFiles(adrPatterns, options)
        : {};
    const docOpts = {
        purpose: 'Architectural decisions extracted from feature files',
        detailLevel: options.generateDetailFiles
            ? 'Summary with links to category details'
            : 'Compact summary',
    };
    if (Object.keys(additionalFiles).length > 0) {
        docOpts.additionalFiles = additionalFiles;
    }
    return document('Architecture Decision Records', sections, docOpts);
}
// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build ADR summary section
 */
function buildAdrSummary(patterns) {
    // Count by status
    const byStatus = groupBy(patterns.filter((p) => p.adrStatus), (p) => p.adrStatus ?? 'proposed');
    const accepted = byStatus.get('accepted')?.length ?? 0;
    const proposed = byStatus.get('proposed')?.length ?? 0;
    const deprecated = byStatus.get('deprecated')?.length ?? 0;
    const superseded = byStatus.get('superseded')?.length ?? 0;
    // Count by category
    const byCategory = groupBy(patterns.filter((p) => p.adrCategory), (p) => p.adrCategory ?? 'uncategorized');
    return [
        heading(2, 'Summary'),
        table(['Metric', 'Value'], [
            ['Total ADRs', String(patterns.length)],
            ['Accepted', String(accepted)],
            ['Proposed', String(proposed)],
            ['Deprecated', String(deprecated)],
            ['Superseded', String(superseded)],
            ['Categories', String(byCategory.size)],
        ]),
        separator(),
    ];
}
/**
 * Build ADRs grouped by category
 * Each ADR links to its individual detail file when generateDetailFiles is enabled
 */
function buildAdrsByCategory(patterns, options) {
    const sections = [];
    const byCategory = groupBy(patterns, (p) => p.adrCategory ?? 'uncategorized');
    if (byCategory.size === 0) {
        return [];
    }
    sections.push(heading(2, 'By Category'));
    const sortedCategories = [...byCategory.keys()].sort();
    for (const category of sortedCategories) {
        const categoryPatterns = byCategory.get(category) ?? [];
        if (!options.generateDetailFiles) {
            // Inline the category (no progressive disclosure)
            sections.push(...buildCategorySection(category, categoryPatterns, options));
        }
        else {
            // Show category with list of ADRs linking to individual files
            sections.push(heading(3, category), paragraph(`${categoryPatterns.length} decisions`));
            // Sort by ADR number and create links
            const sorted = [...categoryPatterns].sort((a, b) => {
                const aNum = parseAdrNumber(a.adr);
                const bNum = parseAdrNumber(b.adr);
                return aNum - bNum;
            });
            const adrRows = sorted.map((p) => {
                const adrNum = p.adr ?? '???';
                const name = getDisplayName(p);
                const status = p.adrStatus ?? 'proposed';
                const slug = adrToSlug(p);
                return [`[ADR-${adrNum}](decisions/${slug}.md)`, name, status];
            });
            sections.push(table(['ADR', 'Title', 'Status'], adrRows), separator());
        }
    }
    return sections;
}
/**
 * Build a category section with ADRs
 */
function buildCategorySection(category, patterns, options) {
    const sections = [];
    sections.push(heading(3, category));
    sections.push(paragraph(`${patterns.length} decisions`));
    // Sort by ADR number
    const sorted = [...patterns].sort((a, b) => {
        const aNum = parseAdrNumber(a.adr);
        const bNum = parseAdrNumber(b.adr);
        return aNum - bNum;
    });
    for (const pattern of sorted) {
        sections.push(...buildAdrEntry(pattern, options));
    }
    sections.push(separator());
    return sections;
}
/**
 * Build a single ADR entry
 */
function buildAdrEntry(pattern, options) {
    const sections = [];
    const name = getDisplayName(pattern);
    const adrNum = pattern.adr ?? '???';
    const status = pattern.adrStatus ?? 'proposed';
    sections.push(heading(4, `ADR-${adrNum}: ${name}`));
    // Metadata
    const metaRows = [['Status', status]];
    if (pattern.adrCategory) {
        metaRows.push(['Category', pattern.adrCategory]);
    }
    if (pattern.phase !== undefined) {
        metaRows.push(['Phase', String(pattern.phase)]);
    }
    if (pattern.adrSupersedes) {
        metaRows.push(['Supersedes', `ADR-${pattern.adrSupersedes}`]);
    }
    if (pattern.adrSupersededBy) {
        metaRows.push(['Superseded By', `ADR-${pattern.adrSupersededBy}`]);
    }
    sections.push(table(['Property', 'Value'], metaRows));
    // ADR Content sections from Gherkin Rule: keywords
    // Rules are partitioned by semantic prefix: "Context...", "Decision...", "Consequence..."
    const partitioned = partitionRulesByPrefix(pattern.rules, {
        warnOnOther: true,
        patternName: name,
    });
    sections.push(...renderPartitionedAdrSections(partitioned, options, 5));
    return sections;
}
/**
 * Build ADRs grouped by phase
 */
function buildAdrsByPhase(patterns, options) {
    const sections = [];
    const byPhase = groupBy(patterns, (p) => p.phase ?? 0);
    if (byPhase.size === 0) {
        return [];
    }
    sections.push(heading(2, 'By Phase'));
    const sortedPhases = [...byPhase.keys()].sort((a, b) => a - b);
    for (const phaseNum of sortedPhases) {
        const phasePatterns = byPhase.get(phaseNum) ?? [];
        const phaseContent = [];
        for (const pattern of phasePatterns) {
            phaseContent.push(...buildAdrEntry(pattern, options));
        }
        sections.push(collapsible(`Phase ${phaseNum} (${phasePatterns.length} decisions)`, phaseContent));
    }
    sections.push(separator());
    return sections;
}
/**
 * Build ADRs grouped by date (quarter)
 */
function buildAdrsByDate(patterns, options) {
    const sections = [];
    const byQuarter = groupBy(patterns.filter((p) => p.quarter), (p) => p.quarter ?? 'undated');
    if (byQuarter.size === 0) {
        return [];
    }
    sections.push(heading(2, 'By Date'));
    const sortedQuarters = [...byQuarter.keys()].sort().reverse(); // Most recent first
    for (const quarter of sortedQuarters) {
        const quarterPatterns = byQuarter.get(quarter) ?? [];
        const quarterContent = [];
        for (const pattern of quarterPatterns) {
            quarterContent.push(...buildAdrEntry(pattern, options));
        }
        sections.push(collapsible(`${quarter} (${quarterPatterns.length} decisions)`, quarterContent));
    }
    sections.push(separator());
    return sections;
}
/**
 * Build ADR index table
 * Links to individual files when generateDetailFiles is enabled
 */
function buildAdrIndexTable(patterns, options) {
    // Sort by ADR number
    const sorted = [...patterns].sort((a, b) => {
        const aNum = parseAdrNumber(a.adr);
        const bNum = parseAdrNumber(b.adr);
        return aNum - bNum;
    });
    const rows = sorted.map((p) => {
        const adrNum = p.adr ?? '???';
        const name = getDisplayName(p);
        const status = p.adrStatus ?? 'proposed';
        const category = p.adrCategory ?? '-';
        if (options.generateDetailFiles) {
            const slug = adrToSlug(p);
            return [`[ADR-${adrNum}](decisions/${slug}.md)`, name, status, category];
        }
        return [`ADR-${adrNum}`, name, status, category];
    });
    return [
        heading(2, 'ADR Index'),
        table(['ADR', 'Title', 'Status', 'Category'], rows),
        separator(),
    ];
}
// ═══════════════════════════════════════════════════════════════════════════
// Individual ADR Detail Files (Progressive Disclosure)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Generate URL-safe slug from ADR number and name
 *
 * Handles edge cases:
 * - Empty pattern names fallback to "unnamed"
 * - ADR numbers are zero-padded to 3 digits
 * - Non-alphanumeric characters are replaced with hyphens
 *
 * @param pattern - The extracted pattern with ADR metadata
 * @returns URL-safe slug like "adr-001-my-decision"
 */
function adrToSlug(pattern) {
    const adrNum = pattern.adr ?? '000';
    const displayName = getDisplayName(pattern);
    // Strip leading "ADR NNN" or "PDR NNN" prefix to avoid duplication (e.g., adr-001-adr-001-...)
    const stripped = displayName.replace(/^(?:ADR|PDR)\s*\d+\s*/i, '');
    const sluggedName = stripped
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    // Fallback to "unnamed" if the slug would be empty
    const name = sluggedName.length > 0 ? sluggedName : 'unnamed';
    return `adr-${adrNum.padStart(3, '0')}-${name}`;
}
/**
 * Parse ADR number for sorting, handling non-numeric values
 *
 * Returns 0 for non-numeric ADR numbers to avoid NaN in sort comparisons.
 * Emits a warning when falling back to 0 for non-numeric values.
 * Examples: "001" → 1, "v1" → 0 (with warning), undefined → 0
 *
 * @param adr - The ADR number string to parse
 * @param onWarning - Optional callback for warnings (default: console.warn)
 */
function parseAdrNumber(adr, onWarning = console.warn) {
    if (!adr)
        return 0;
    const parsed = parseInt(adr, 10);
    if (Number.isNaN(parsed)) {
        onWarning(`[adr-codec] Invalid ADR number "${adr}", defaulting to 0 for sorting`);
        return 0;
    }
    return parsed;
}
/**
 * Build individual ADR files (progressive disclosure)
 * Creates one file per ADR instead of grouping by category
 */
function buildAdrDetailFiles(patterns, options) {
    const files = {};
    for (const pattern of patterns) {
        const slug = adrToSlug(pattern);
        files[`decisions/${slug}.md`] = buildSingleAdrDocument(pattern, options);
    }
    return files;
}
/**
 * Build a single ADR detail document
 */
function buildSingleAdrDocument(pattern, options) {
    const sections = [];
    const name = getDisplayName(pattern);
    const adrNum = pattern.adr ?? '???';
    const status = pattern.adrStatus ?? 'proposed';
    // Metadata
    const metaRows = [['Status', status]];
    if (pattern.adrCategory) {
        metaRows.push(['Category', pattern.adrCategory]);
    }
    if (pattern.phase !== undefined) {
        metaRows.push(['Phase', String(pattern.phase)]);
    }
    if (pattern.adrSupersedes) {
        metaRows.push(['Supersedes', `ADR-${pattern.adrSupersedes}`]);
    }
    if (pattern.adrSupersededBy) {
        metaRows.push(['Superseded By', `ADR-${pattern.adrSupersededBy}`]);
    }
    sections.push(heading(2, 'Overview'), table(['Property', 'Value'], metaRows));
    // Feature description content (Context, Decision, Consequences as prose)
    // Some ADRs/PDRs use the Feature description for structured content instead of
    // Rule: prefix naming. Render it between Overview and Rules.
    // IMPORTANT: dedent BEFORE trim — trim strips first-line indent, defeating dedent.
    const featureDesc = pattern.directive.description;
    if (featureDesc.trim()) {
        sections.push(...renderFeatureDescription(featureDesc));
    }
    // ADR Content sections from Gherkin Rule: keywords
    // Rules are partitioned by semantic prefix: "Context...", "Decision...", "Consequence..."
    const partitioned = partitionRulesByPrefix(pattern.rules, {
        warnOnOther: true,
        patternName: name,
    });
    sections.push(...renderPartitionedAdrSections(partitioned, options, 2));
    // Back link
    sections.push(separator(), linkOut('← Back to All Decisions', '../DECISIONS.md'));
    return document(`ADR-${adrNum}: ${name}`, sections, {
        purpose: `Architecture decision record for ${name}`,
    });
}
// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Render a Feature description preserving content order.
 *
 * Unlike `renderRuleDescription` (which extracts annotations and tables out-of-order),
 * this function walks the description linearly, detecting transitions between prose,
 * table blocks, and DocString blocks. Each block type is rendered appropriately:
 * - Prose → `paragraph()` with dedented text
 * - Tables → `table()` with proper separator rows via `extractTablesFromDescription`
 * - DocStrings → `code()` with language hint and dedented content
 *
 * @param description - Raw Feature description text (Gherkin-indented)
 * @returns Array of SectionBlocks preserving the original content order
 */
function renderFeatureDescription(description) {
    const blocks = [];
    const dedented = dedent(description);
    const lines = dedented.split('\n');
    let currentBlock = [];
    let blockType = 'prose';
    let docStringLang = '';
    const flushBlock = () => {
        const content = currentBlock.join('\n').trim();
        if (content.length === 0) {
            currentBlock = [];
            return;
        }
        if (blockType === 'table') {
            // Parse table lines into structured table with separator rows
            const extracted = extractTablesFromDescription(content);
            for (const tbl of extracted) {
                const rows = tbl.rows.map((row) => tbl.headers.map((h) => row[h] ?? ''));
                blocks.push(table([...tbl.headers], rows));
            }
        }
        else if (blockType === 'docstring') {
            blocks.push(code(dedent(content), docStringLang || 'text'));
        }
        else {
            blocks.push(paragraph(content));
        }
        currentBlock = [];
    };
    let inDocString = false;
    for (const line of lines) {
        const trimmed = line.trim();
        // DocString delimiter detection
        if (trimmed.startsWith('"""')) {
            if (!inDocString) {
                // Opening delimiter — flush current block, start DocString
                flushBlock();
                inDocString = true;
                blockType = 'docstring';
                docStringLang = trimmed.slice(3).trim();
                continue;
            }
            else {
                // Closing delimiter — flush DocString
                flushBlock();
                inDocString = false;
                blockType = 'prose';
                continue;
            }
        }
        if (inDocString) {
            currentBlock.push(line);
            continue;
        }
        // Detect table lines (start and end with |)
        const isTableLine = trimmed.startsWith('|') && trimmed.endsWith('|');
        if (isTableLine && blockType !== 'table') {
            // Transition: prose → table
            flushBlock();
            blockType = 'table';
            currentBlock.push(trimmed);
        }
        else if (!isTableLine && blockType === 'table') {
            // Transition: table → prose
            flushBlock();
            blockType = 'prose';
            currentBlock.push(trimmed);
        }
        else {
            // Prose lines: trimmed to strip Gherkin indentation
            // Table lines: trimmed for consistent pipe alignment
            // DocString lines: raw (handled separately above)
            currentBlock.push(trimmed);
        }
    }
    // Flush any remaining content
    flushBlock();
    return blocks;
}
/**
 * Render partitioned ADR sections (Context, Decision, Consequences)
 *
 * Shared helper to ensure consistent rendering between buildAdrEntry and buildSingleAdrDocument.
 *
 * @param partitioned - Partitioned ADR rules
 * @param options - ADR codec options
 * @param headingLevel - Heading level for section headers (2 for detail docs, 5 for inline entries)
 * @returns Array of SectionBlocks
 */
function renderPartitionedAdrSections(partitioned, options, headingLevel) {
    const sections = [];
    // Render Context section
    if (options.includeContext && partitioned.context.length > 0) {
        sections.push(heading(headingLevel, 'Context'));
        for (const rule of partitioned.context) {
            if (rule.description) {
                sections.push(...renderRuleDescription(rule.description));
            }
        }
    }
    // Render Decision section
    if (options.includeDecision && partitioned.decision.length > 0) {
        sections.push(heading(headingLevel, 'Decision'));
        for (const rule of partitioned.decision) {
            if (rule.description) {
                sections.push(...renderRuleDescription(rule.description));
            }
        }
    }
    // Render Consequences section
    if (options.includeConsequences && partitioned.consequences.length > 0) {
        sections.push(heading(headingLevel, 'Consequences'));
        for (const rule of partitioned.consequences) {
            if (rule.description) {
                sections.push(...renderRuleDescription(rule.description));
            }
        }
    }
    // Render rules that don't match ADR prefixes (e.g., "DD-1 - ...", invariants)
    if (partitioned.other.length > 0) {
        sections.push(heading(headingLevel, 'Rules'));
        const ruleHeadingLevel = headingLevel === 2 ? 3 : 6;
        for (const rule of partitioned.other) {
            sections.push(heading(ruleHeadingLevel, rule.name));
            if (rule.description) {
                sections.push(...renderRuleDescription(rule.description));
            }
        }
    }
    return sections;
}
//# sourceMappingURL=adr.js.map