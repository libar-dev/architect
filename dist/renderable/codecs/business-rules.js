/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern BusinessRulesCodec
 * @libar-docs-status completed
 * @libar-docs-unlock-reason:Progressive-disclosure-by-product-area
 *
 * ## Business Rules Document Codec
 *
 * Transforms MasterDataset into a RenderableDocument for business rules output.
 * Generates BUSINESS-RULES.md organized by product area, phase, and feature.
 *
 * ### When to Use
 *
 * - When generating business rules documentation for stakeholders
 * - When extracting domain constraints without implementation details
 * - When creating compliance or audit documentation from feature specs
 *
 * ### Purpose
 *
 * Enable stakeholders to understand domain constraints without reading
 * implementation details or full feature files.
 *
 * ### Information Architecture
 *
 * ```
 * Product Area (Platform, DeliveryProcess)
 *   └── Phase (21, 15, etc.) or Release (v0.1.0 for DeliveryProcess)
 *        └── Feature (pattern name with description)
 *             └── Rules (inline with Invariant + Rationale)
 * ```
 *
 * ### Progressive Disclosure
 *
 * - **summary**: Statistics only (compact reference)
 * - **standard**: Above + all features with rules inline
 * - **detailed**: Full content including code examples and verification links
 *
 * ### Factory Pattern
 *
 * Use `createBusinessRulesCodec(options)` to create a configured codec:
 * ```typescript
 * const codec = createBusinessRulesCodec({ detailLevel: "summary" });
 * const doc = codec.decode(dataset);
 * ```
 */
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { heading, paragraph, separator, table, linkOut, document, } from '../schema.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
import { toKebabCase } from '../../utils/index.js';
/**
 * Default options for BusinessRulesCodec
 */
export const DEFAULT_BUSINESS_RULES_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    groupBy: 'domain-then-phase',
    includeCodeExamples: false, // Only in detailed mode
    includeTables: true,
    includeRationale: true,
    filterDomains: [],
    filterPhases: [],
    onlyWithInvariants: false,
    includeSource: true,
    includeVerifiedBy: true,
    maxDescriptionLength: 150,
    excludeSourcePaths: [],
};
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { parseBusinessRuleAnnotations, extractFirstSentence, } from './helpers.js';
// ═══════════════════════════════════════════════════════════════════════════
// Business Rules Document Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create a BusinessRulesCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Compact summary mode
 * const codec = createBusinessRulesCodec({ detailLevel: "summary" });
 *
 * // Filter to specific domains
 * const codec = createBusinessRulesCodec({ filterDomains: ["ddd", "event-sourcing"] });
 * ```
 */
export function createBusinessRulesCodec(options) {
    const opts = mergeOptions(DEFAULT_BUSINESS_RULES_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildBusinessRulesDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('BusinessRulesCodec is decode-only. See zod-codecs.md');
        },
    });
}
/**
 * Default Business Rules Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for business rules.
 * Uses default options with standard detail level.
 *
 * @example
 * ```typescript
 * const doc = BusinessRulesCodec.decode(masterDataset);
 * const markdown = renderToMarkdown(doc);
 * ```
 */
export const BusinessRulesCodec = createBusinessRulesCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build the business rules document from dataset
 */
function buildBusinessRulesDocument(dataset, options) {
    const sections = [];
    // 1. Collect all rules organized by product area → phase → feature
    const productAreaGroups = collectRulesByProductArea(dataset, options);
    // Calculate stats
    const stats = calculateStats(productAreaGroups);
    if (stats.totalRules === 0) {
        sections.push(heading(2, 'No Business Rules Found'), paragraph('No business rules were found in the feature files. ' +
            'Business rules are defined using the `Rule:` keyword in Gherkin feature files.'));
        return document('Business Rules', sections, {
            purpose: 'Domain constraints and invariants',
        });
    }
    // 2. Build summary (single line with stats)
    sections.push(...buildSummarySection(stats));
    // 3. Progressive disclosure: split by product area when detail files enabled
    if (options.generateDetailFiles && options.detailLevel !== 'summary') {
        sections.push(...buildProductAreaIndexSection(productAreaGroups));
        const additionalFiles = buildBusinessRulesDetailFiles(productAreaGroups, options);
        const docOpts = {
            purpose: 'Domain constraints and invariants extracted from feature files',
            detailLevel: 'Overview with links to detailed business rules by product area',
        };
        if (Object.keys(additionalFiles).length > 0) {
            docOpts.additionalFiles = additionalFiles;
        }
        return document('Business Rules', sections, docOpts);
    }
    // 4. Non-split mode: all content in single document
    if (options.detailLevel !== 'summary') {
        sections.push(...buildProductAreaSections(productAreaGroups, options));
    }
    return document('Business Rules', sections, {
        purpose: 'Domain constraints and invariants extracted from feature files',
        detailLevel: options.detailLevel,
    });
}
// ═══════════════════════════════════════════════════════════════════════════
// Rule Collection
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Collect rules organized by Product Area → Phase → Feature
 */
function collectRulesByProductArea(dataset, options) {
    const groups = new Map();
    for (const pattern of dataset.patterns) {
        // Skip patterns without rules
        if (!pattern.rules || pattern.rules.length === 0) {
            continue;
        }
        // Apply source path exclusion filter
        if (options.excludeSourcePaths.length > 0 &&
            options.excludeSourcePaths.some((prefix) => pattern.source.file.startsWith(prefix))) {
            continue;
        }
        // Apply domain filter
        if (options.filterDomains.length > 0 && !options.filterDomains.includes(pattern.category)) {
            continue;
        }
        // Apply phase filter
        if (options.filterPhases.length > 0 &&
            pattern.phase !== undefined &&
            !options.filterPhases.includes(pattern.phase)) {
            continue;
        }
        // Determine product area (default to "Platform" if not specified)
        const productArea = pattern.productArea ?? 'Platform';
        const productAreaDisplay = formatProductAreaName(productArea);
        // Determine phase key (use release for DeliveryProcess items without phase)
        const phaseKey = getPhaseKey(pattern);
        // Get or create product area group
        let group = groups.get(productArea);
        if (!group) {
            group = {
                productArea,
                displayName: productAreaDisplay,
                phases: new Map(),
            };
            groups.set(productArea, group);
        }
        // Get or create phase group
        let phaseFeatures = group.phases.get(phaseKey);
        if (!phaseFeatures) {
            phaseFeatures = [];
            group.phases.set(phaseKey, phaseFeatures);
        }
        // Build feature with rules
        const featureWithRules = {
            pattern,
            featureName: pattern.name,
            featureDescription: extractFeatureDescription(pattern),
            rules: [],
        };
        // Process rules
        for (const rule of pattern.rules) {
            const annotations = parseBusinessRuleAnnotations(rule.description);
            // Apply onlyWithInvariants filter
            if (options.onlyWithInvariants && !annotations.invariant) {
                continue;
            }
            featureWithRules.rules.push({
                rule,
                pattern,
                annotations,
            });
        }
        // Only add feature if it has rules after filtering
        if (featureWithRules.rules.length > 0) {
            phaseFeatures.push(featureWithRules);
        }
    }
    return groups;
}
/**
 * Get the phase key for grouping (e.g., "Phase 21" or "v0.1.0")
 */
function getPhaseKey(pattern) {
    // If pattern has a phase, use it
    if (pattern.phase !== undefined) {
        return `Phase ${pattern.phase}`;
    }
    // For DeliveryProcess items without phase, use release
    const release = pattern.release;
    if (release) {
        return release;
    }
    // Fallback
    return 'Uncategorized';
}
/**
 * Extract a compact description from the feature
 *
 * Looks for content after header markers like **Problem:** or **Business Value:**
 * and extracts the full first sentence/paragraph.
 */
function extractFeatureDescription(pattern) {
    const desc = pattern.directive.description;
    // Headers that indicate content follows
    const contentHeaders = [
        /\*\*Problem:\*\*\s*/,
        /\*\*Business Value:\*\*\s*/,
        /\*\*Solution:\*\*\s*/,
        /\*\*Context:\*\*\s*/,
    ];
    // Try to find content after a header
    for (const headerPattern of contentHeaders) {
        const match = headerPattern.exec(desc);
        if (match) {
            // Get text after the header
            const afterHeader = desc.slice(match.index + match[0].length);
            // Get content up to the next header or table
            const nextHeaderPattern = /\n\s*(\*\*[A-Z]|^\|)/m;
            const nextHeaderMatch = nextHeaderPattern.exec(afterHeader);
            const content = nextHeaderMatch ? afterHeader.slice(0, nextHeaderMatch.index) : afterHeader;
            // Clean up and extract first sentence
            const cleaned = content.trim().split('\n')[0]?.trim() ?? '';
            if (cleaned.length > 0) {
                return extractFirstSentence(cleaned);
            }
        }
    }
    // Fallback: Try to get the first meaningful line
    const lines = desc.split('\n').filter((line) => {
        const trimmed = line.trim();
        return (trimmed.length > 0 &&
            !trimmed.startsWith('**') && // Skip any header
            !trimmed.startsWith('|') && // Skip table rows
            !trimmed.startsWith('-') && // Skip list items
            trimmed.length > 20 // Require substantial content
        );
    });
    const firstLine = lines[0];
    if (firstLine) {
        return extractFirstSentence(firstLine);
    }
    return '';
}
function calculateStats(groups) {
    let totalRules = 0;
    let totalFeatures = 0;
    let withInvariants = 0;
    for (const group of groups.values()) {
        for (const features of group.phases.values()) {
            totalFeatures += features.length;
            for (const feature of features) {
                totalRules += feature.rules.length;
                for (const ruleCtx of feature.rules) {
                    if (ruleCtx.annotations.invariant) {
                        withInvariants++;
                    }
                }
            }
        }
    }
    return {
        totalRules,
        totalFeatures,
        withInvariants,
        productAreas: groups.size,
    };
}
// ═══════════════════════════════════════════════════════════════════════════
// Summary Section
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build compact summary section
 */
function buildSummarySection(stats) {
    const summary = `Domain constraints and invariants extracted from feature specifications. ${stats.totalRules} rules from ${stats.totalFeatures} features across ${stats.productAreas} product areas.`;
    return [paragraph(`**${summary}**`), separator()];
}
// ═══════════════════════════════════════════════════════════════════════════
// Product Area Sections
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build sections organized by Product Area → Phase → Feature → Rules
 */
function buildProductAreaSections(groups, options) {
    const sections = [];
    // Sort product areas alphabetically
    const sortedGroups = [...groups.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
    for (const group of sortedGroups) {
        const sortedPhases = sortPhaseEntries([...group.phases.entries()]);
        for (const [phaseKey, features] of sortedPhases) {
            // Product Area / Phase heading
            sections.push(heading(2, `${group.displayName} / ${phaseKey}`));
            // Sort features by name
            const sortedFeatures = [...features].sort((a, b) => a.featureName.localeCompare(b.featureName));
            for (const feature of sortedFeatures) {
                sections.push(...renderFeatureWithRules(feature, options));
            }
            sections.push(separator());
        }
    }
    return sections;
}
/**
 * Calculate statistics for a single product area group
 */
function calculateAreaStats(group) {
    let totalRules = 0;
    let totalFeatures = 0;
    let withInvariants = 0;
    for (const features of group.phases.values()) {
        totalFeatures += features.length;
        for (const feature of features) {
            totalRules += feature.rules.length;
            for (const ruleCtx of feature.rules) {
                if (ruleCtx.annotations.invariant) {
                    withInvariants++;
                }
            }
        }
    }
    return { totalRules, totalFeatures, withInvariants };
}
/**
 * Generate URL-safe slug from product area name
 */
function productAreaToSlug(productArea) {
    return toKebabCase(productArea);
}
/**
 * Build the product area index section for the main document.
 * Shows a summary table with links to each product area's detail file.
 */
function buildProductAreaIndexSection(groups) {
    const sections = [];
    sections.push(heading(2, 'Product Areas'));
    const sortedGroups = [...groups.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
    const rows = sortedGroups.map((group) => {
        const areaStats = calculateAreaStats(group);
        const slug = productAreaToSlug(group.productArea);
        const link = `[${group.displayName}](business-rules/${slug}.md)`;
        return [
            link,
            String(areaStats.totalFeatures),
            String(areaStats.totalRules),
            String(areaStats.withInvariants),
        ];
    });
    sections.push(table(['Product Area', 'Features', 'Rules', 'With Invariants'], rows));
    sections.push(separator());
    return sections;
}
/**
 * Build one detail file per product area
 */
function buildBusinessRulesDetailFiles(groups, options) {
    const files = {};
    const sortedGroups = [...groups.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
    for (const group of sortedGroups) {
        const slug = productAreaToSlug(group.productArea);
        files[`business-rules/${slug}.md`] = buildSingleProductAreaDocument(group, options);
    }
    return files;
}
/**
 * Build a single product area detail document with rules organized by phase
 */
function buildSingleProductAreaDocument(group, options) {
    const sections = [];
    const areaStats = calculateAreaStats(group);
    // Area stats
    sections.push(paragraph(`**${areaStats.totalRules} rules** from ${areaStats.totalFeatures} features. ` +
        `${areaStats.withInvariants} rules have explicit invariants.`));
    sections.push(separator());
    // Sort phases
    const sortedPhases = sortPhaseEntries([...group.phases.entries()]);
    for (const [phaseKey, features] of sortedPhases) {
        const phaseRuleCount = features.reduce((sum, f) => sum + f.rules.length, 0);
        const sortedFeatures = [...features].sort((a, b) => a.featureName.localeCompare(b.featureName));
        // Render features for this phase
        const phaseContent = [];
        for (const feature of sortedFeatures) {
            phaseContent.push(...renderFeatureWithRules(feature, options));
        }
        // Always render flat — file-level split by product area is sufficient disclosure
        sections.push(heading(2, phaseKey));
        sections.push(...phaseContent);
        sections.push(separator());
    }
    // Back link
    sections.push(linkOut('\u2190 Back to Business Rules', '../BUSINESS-RULES.md'));
    return document(`${group.displayName} Business Rules`, sections, {
        purpose: `Business rules for the ${group.displayName} product area`,
    });
}
/**
 * Sort phase entries: numeric phases first (ascending), then releases, then uncategorized
 */
function sortPhaseEntries(entries) {
    return entries.sort(([a], [b]) => {
        const aNum = extractPhaseNumber(a);
        const bNum = extractPhaseNumber(b);
        if (aNum !== null && bNum !== null) {
            return aNum - bNum;
        }
        if (aNum !== null)
            return -1;
        if (bNum !== null)
            return 1;
        return a.localeCompare(b);
    });
}
/**
 * Extract phase number from phase key (e.g., "Phase 21" → 21)
 */
function extractPhaseNumber(phaseKey) {
    const pattern = /^Phase\s+(\d+)$/;
    const match = pattern.exec(phaseKey);
    if (match?.[1]) {
        return parseInt(match[1], 10);
    }
    return null;
}
// ═══════════════════════════════════════════════════════════════════════════
// Feature Rendering
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Render a feature with its rules inline.
 *
 * All rules render flat — Rule title + Invariant + Rationale are essential
 * business knowledge and must never be hidden behind collapsible blocks.
 * Progressive disclosure happens at the file level (split by product area).
 */
function renderFeatureWithRules(feature, options) {
    const sections = [];
    const isDetailed = options.detailLevel === 'detailed';
    // Feature heading (H3) — humanized from camelCase pattern name
    sections.push(heading(3, humanizeFeatureName(feature.featureName)));
    // Feature description
    if (feature.featureDescription) {
        sections.push(paragraph(`*${feature.featureDescription}*`));
    }
    // Render each rule flat — no collapsible wrapping
    for (const ruleCtx of feature.rules) {
        sections.push(...renderRuleInline(ruleCtx, options, isDetailed));
    }
    // Source file path as italic text (informational, not a link — paths are
    // relative to the feature repo root and don't resolve from docs-generated/)
    if (options.includeSource) {
        const sourceFile = feature.pattern.source.file;
        sections.push(paragraph(`*${extractSourceName(sourceFile)}*`));
    }
    return sections;
}
/**
 * Render a single rule inline with its annotations.
 *
 * Rule title + Invariant + Rationale are always visible (essential business
 * knowledge). Verified-by is rendered as a compact italic line — it's
 * metadata for traceability, not primary content. Scenario names from the
 * Rule block are deduplicated against explicit **Verified by:** annotations.
 */
function renderRuleInline(ruleCtx, options, isDetailed) {
    const sections = [];
    const { rule, annotations } = ruleCtx;
    // Rule name as H4 heading
    sections.push(heading(4, rule.name));
    // Invariant (or first line of description if no invariant)
    if (annotations.invariant) {
        sections.push(paragraph(`**Invariant:** ${annotations.invariant}`));
    }
    else if (annotations.remainingContent) {
        const firstLine = extractFirstSentence(annotations.remainingContent);
        if (firstLine) {
            sections.push(paragraph(firstLine));
        }
    }
    // Rationale (if enabled and present)
    if (options.includeRationale && annotations.rationale) {
        sections.push(paragraph(`**Rationale:** ${annotations.rationale}`));
    }
    // Tables from rule description
    if (options.includeTables && rule.description) {
        const tableBlocks = extractTables(rule.description);
        for (const tableBlock of tableBlocks) {
            sections.push(tableBlock);
        }
    }
    // Code examples (detailed mode only, or if explicitly enabled)
    if ((isDetailed || options.includeCodeExamples) && annotations.codeExamples) {
        for (const codeBlock of annotations.codeExamples) {
            sections.push(codeBlock);
        }
    }
    // Compact verified-by as italic line (metadata, not primary content)
    if (options.includeVerifiedBy) {
        const names = deduplicateScenarioNames(rule.scenarioNames, annotations.verifiedBy);
        if (names.length > 0) {
            sections.push(paragraph(`_Verified by: ${names.join(', ')}_`));
        }
    }
    // API implementation references
    if (annotations.apiRefs && annotations.apiRefs.length > 0) {
        const refList = annotations.apiRefs.map((ref) => `\`${ref}\``).join(', ');
        sections.push(paragraph(`**Implementation:** ${refList}`));
    }
    // Placeholder only when there is truly no content
    if (!annotations.invariant &&
        !annotations.remainingContent &&
        !annotations.rationale &&
        rule.scenarioNames.length === 0) {
        sections.push(paragraph('*No invariant or description specified.*'));
    }
    return sections;
}
/**
 * Extract markdown tables from content
 */
function extractTables(content) {
    const sections = [];
    const lines = content.split('\n');
    let inTable = false;
    let tableLines = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            inTable = true;
            tableLines.push(trimmed);
        }
        else if (inTable) {
            // End of table
            if (tableLines.length >= 2) {
                const tableBlock = parseMarkdownTable(tableLines);
                if (tableBlock) {
                    sections.push(tableBlock);
                }
            }
            inTable = false;
            tableLines = [];
        }
    }
    // Handle table at end of content
    if (inTable && tableLines.length >= 2) {
        const tableBlock = parseMarkdownTable(tableLines);
        if (tableBlock) {
            sections.push(tableBlock);
        }
    }
    return sections;
}
/**
 * Parse markdown table lines into a table SectionBlock
 */
function parseMarkdownTable(lines) {
    if (lines.length < 2)
        return null;
    // Skip separator row (contains only dashes and pipes)
    const dataLines = lines.filter((line) => !/^\|[\s-:|]+\|$/.test(line));
    if (dataLines.length < 1)
        return null;
    // First row is headers
    const headerRow = dataLines[0];
    if (!headerRow)
        return null;
    const headers = headerRow
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
    if (headers.length === 0)
        return null;
    // Remaining rows are data
    const rows = [];
    for (let i = 1; i < dataLines.length; i++) {
        const row = dataLines[i];
        if (!row)
            continue;
        const cells = row
            .split('|')
            .map((cell) => cell.trim())
            .filter((cell) => cell.length > 0);
        if (cells.length > 0) {
            rows.push(cells);
        }
    }
    return table(headers, rows);
}
// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Humanize a camelCase/PascalCase feature name for display.
 *
 * Inserts spaces at camelCase boundaries and strips common suffixes
 * like "Testing" that don't add value in business rules context.
 *
 * Examples:
 * - ConfigResolution → Config Resolution
 * - RichContentHelpersTesting → Rich Content Helpers
 * - ProcessGuardTesting → Process Guard
 * - ContextInference → Context Inference
 */
function humanizeFeatureName(name) {
    // Insert spaces before uppercase letters that follow lowercase
    let humanized = name.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Insert spaces before sequences like "API" followed by lowercase
    humanized = humanized.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    // Strip common test suffixes
    humanized = humanized.replace(/\s*Testing$/i, '');
    return humanized.trim();
}
/**
 * Deduplicate scenario names from Rule block and **Verified by:** annotation.
 *
 * Uses case-insensitive comparison to catch near-duplicates like
 * "Standard level includes source link-out" vs "Standard level includes source link-out".
 */
function deduplicateScenarioNames(scenarioNames, verifiedBy) {
    const seen = new Map(); // lowercase → original
    for (const name of scenarioNames) {
        const key = name.toLowerCase().trim();
        if (!seen.has(key)) {
            seen.set(key, name);
        }
    }
    if (verifiedBy) {
        for (const name of verifiedBy) {
            const key = name.toLowerCase().trim();
            if (!seen.has(key)) {
                seen.set(key, name);
            }
        }
    }
    return [...seen.values()];
}
/**
 * Format product area name for display
 */
function formatProductAreaName(productArea) {
    // Handle common product areas
    switch (productArea.toLowerCase()) {
        case 'platform':
            return 'Platform';
        case 'deliveryprocess':
            return 'Delivery Process';
        case 'exampleapp':
            return 'Example App';
        case 'taxonomy':
            return 'Taxonomy';
        default:
            // Title case for unknown product areas
            return productArea.charAt(0).toUpperCase() + productArea.slice(1);
    }
}
/**
 * Extract a clean source name from file path
 */
function extractSourceName(filePath) {
    const pattern = /([^/]+)\.feature$/;
    const match = pattern.exec(filePath);
    if (match?.[1]) {
        return match[1] + '.feature';
    }
    return filePath;
}
//# sourceMappingURL=business-rules.js.map