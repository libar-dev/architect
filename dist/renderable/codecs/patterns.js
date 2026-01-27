/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern PatternsCodec
 * @libar-docs-status completed
 *
 * ## Patterns Document Codec
 *
 * Transforms MasterDataset into a RenderableDocument for pattern registry output.
 * Generates PATTERNS.md and category detail files (patterns/*.md).
 *
 * ### Factory Pattern
 *
 * Use `createPatternsCodec(options)` to create a configured codec:
 * ```typescript
 * const codec = createPatternsCodec({ generateDetailFiles: false });
 * const doc = codec.decode(dataset);
 * ```
 *
 * Or use the default export for standard behavior:
 * ```typescript
 * const doc = PatternsDocumentCodec.decode(dataset);
 * ```
 */
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { heading, paragraph, separator, table, list, mermaid, linkOut, document, } from '../schema.js';
import { normalizeStatus } from '../../taxonomy/index.js';
import { getStatusEmoji, getDisplayName, formatCategoryName, extractSummary, computeStatusCounts, completionPercentage, renderProgressBar, sortByStatusAndName, stripLeadingHeaders, } from '../utils.js';
import { toKebabCase } from '../../utils/index.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
// ═══════════════════════════════════════════════════════════════════════════
// Path Normalization Helpers
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Known repository prefixes that should be stripped from implementation paths.
 * These prefixes appear when the baseDir used for extraction is a parent
 * directory of the actual repo root.
 */
const REPO_PREFIXES = ['libar-platform/', 'monorepo/'];
/**
 * Normalize implementation file path by stripping repository prefixes.
 *
 * When extraction uses a parent directory as baseDir, paths may include
 * the repo directory name (e.g., "libar-platform/packages/..."). This
 * function strips those prefixes to generate correct relative links.
 *
 * @param filePath - The implementation file path (may include repo prefix)
 * @returns Path with repo prefix stripped if present
 *
 * @example
 * ```typescript
 * normalizeImplPath("libar-platform/packages/core/src/handler.ts")
 * // Returns: "packages/core/src/handler.ts"
 *
 * normalizeImplPath("packages/core/src/handler.ts")
 * // Returns: "packages/core/src/handler.ts" (unchanged)
 * ```
 */
export function normalizeImplPath(filePath) {
    for (const prefix of REPO_PREFIXES) {
        if (filePath.startsWith(prefix)) {
            return filePath.slice(prefix.length);
        }
    }
    return filePath;
}
/**
 * Default options for PatternsDocumentCodec
 */
export const DEFAULT_PATTERNS_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    includeDependencyGraph: true,
    includeUseCases: true,
    filterCategories: [],
};
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { renderAcceptanceCriteria, renderBusinessRulesSection } from './helpers.js';
// ═══════════════════════════════════════════════════════════════════════════
// Patterns Document Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create a PatternsDocumentCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Disable detail files for summary output
 * const codec = createPatternsCodec({ generateDetailFiles: false });
 *
 * // Filter to specific categories
 * const codec = createPatternsCodec({ filterCategories: ["core", "generator"] });
 * ```
 */
export function createPatternsCodec(options) {
    const opts = mergeOptions(DEFAULT_PATTERNS_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildPatternsDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('PatternsDocumentCodec is decode-only. See zod-codecs.md');
        },
    });
}
/**
 * Default Patterns Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for pattern registry.
 * Uses default options with all features enabled.
 *
 * @example
 * ```typescript
 * const doc = PatternsDocumentCodec.decode(masterDataset);
 * const markdown = renderToMarkdown(doc);
 * ```
 */
export const PatternsDocumentCodec = createPatternsCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build the patterns document from dataset
 */
function buildPatternsDocument(dataset, options) {
    const sections = [];
    // Apply category filter if specified
    const filteredDataset = applyPatternFilters(dataset, options);
    // 1. Progress summary
    sections.push(...buildProgressSummary(filteredDataset));
    // 2. Quick navigation (category links)
    sections.push(...buildQuickNavigation(filteredDataset));
    // 3. Pattern table (all patterns)
    sections.push(...buildPatternTable(filteredDataset));
    // 4. Category sections (inline summaries)
    sections.push(...buildCategorySections(filteredDataset, options));
    // 5. Dependency graph (if relationships exist and enabled)
    if (options.includeDependencyGraph &&
        filteredDataset.relationshipIndex &&
        Object.keys(filteredDataset.relationshipIndex).length > 0) {
        sections.push(...buildDependencyGraph(filteredDataset));
    }
    // Build additional files for individual patterns (if enabled)
    const additionalFiles = options.generateDetailFiles
        ? buildIndividualPatternFiles(filteredDataset)
        : {};
    const docOpts = {
        purpose: 'Quick reference for discovering and implementing patterns',
        detailLevel: options.generateDetailFiles ? 'Overview with links to details' : 'Compact summary',
    };
    if (Object.keys(additionalFiles).length > 0) {
        docOpts.additionalFiles = additionalFiles;
    }
    return document('Pattern Registry', sections, docOpts);
}
/**
 * Apply filters to dataset based on options
 */
function applyPatternFilters(dataset, options) {
    // No filters - return original dataset
    if (options.filterCategories.length === 0) {
        return dataset;
    }
    // Filter patterns by category
    const filteredPatterns = dataset.patterns.filter((p) => options.filterCategories.includes(p.category));
    // Rebuild byCategory with filtered patterns
    const filteredByCategory = {};
    for (const cat of options.filterCategories) {
        if (dataset.byCategory[cat]) {
            filteredByCategory[cat] = dataset.byCategory[cat];
        }
    }
    return {
        ...dataset,
        patterns: filteredPatterns,
        byCategory: filteredByCategory,
        categoryCount: Object.keys(filteredByCategory).length,
        counts: computeStatusCounts(filteredPatterns),
    };
}
// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build progress summary section
 */
function buildProgressSummary(dataset) {
    const { counts } = dataset;
    const progress = completionPercentage(counts);
    const progressBar = renderProgressBar(counts.completed, counts.total, 20);
    return [
        heading(2, 'Progress'),
        paragraph(`**Overall:** ${progressBar} (${progress}% complete)`),
        table(['Status', 'Count'], [
            ['✅ Completed', String(counts.completed)],
            ['🚧 Active', String(counts.active)],
            ['📋 Planned', String(counts.planned)],
            ['**Total**', String(counts.total)],
        ]),
        separator(),
    ];
}
/**
 * Build quick navigation section
 * Links to category anchors within the main document (categories are H3 sections)
 */
function buildQuickNavigation(dataset) {
    const categories = Object.keys(dataset.byCategory).sort();
    if (categories.length === 0) {
        return [];
    }
    // Always link to anchors - categories are sections in the main file
    // Individual patterns have their own files but categories serve as groupings
    const items = categories.map((cat) => {
        const count = dataset.byCategory[cat]?.length ?? 0;
        const displayName = formatCategoryName(cat);
        return `[${displayName}](#${cat}) (${count})`;
    });
    return [heading(2, 'Categories'), list(items), separator()];
}
/**
 * Build pattern table section
 */
function buildPatternTable(dataset) {
    const patterns = sortByStatusAndName([...dataset.patterns]);
    const rows = patterns.map((p) => {
        const status = normalizeStatus(p.status);
        const emoji = getStatusEmoji(p.status);
        const displayName = getDisplayName(p);
        const category = formatCategoryName(p.category);
        const summary = extractSummary(p.directive.description, p.patternName);
        return [`${emoji} ${displayName}`, category, status, summary || '-'];
    });
    return [
        heading(2, 'All Patterns'),
        table(['Pattern', 'Category', 'Status', 'Description'], rows),
        separator(),
    ];
}
/**
 * Build inline category sections
 * Each pattern links to its individual detail file when generateDetailFiles is enabled
 */
function buildCategorySections(dataset, options) {
    const sections = [];
    const categories = Object.keys(dataset.byCategory).sort();
    for (const category of categories) {
        const patterns = dataset.byCategory[category] ?? [];
        const displayName = formatCategoryName(category);
        const counts = computeStatusCounts(patterns);
        const progress = completionPercentage(counts);
        sections.push(heading(3, displayName), paragraph(`${counts.completed}/${counts.total} complete (${progress}%)`));
        // Pattern list - link each pattern to its individual file if enabled
        const items = sortByStatusAndName([...patterns]).map((p) => {
            const emoji = getStatusEmoji(p.status);
            const name = getDisplayName(p);
            if (options.generateDetailFiles) {
                const slug = patternToSlug(p.patternName ?? name);
                return `[${emoji} ${name}](patterns/${slug}.md)`;
            }
            return `${emoji} ${name}`;
        });
        sections.push(list(items), separator());
    }
    return sections;
}
/**
 * Build dependency graph section with UML-inspired relationship styles
 *
 * Arrow styles per PatternRelationshipModel:
 * - uses → solid arrow (-->)
 * - depends-on → dashed arrow (-.->)
 * - implements → dotted arrow (..->)
 * - extends → solid open arrow (-->>)
 */
function buildDependencyGraph(dataset) {
    const relationships = dataset.relationshipIndex ?? {};
    const patternNames = Object.keys(relationships);
    if (patternNames.length === 0) {
        return [];
    }
    // Build mermaid graph
    const lines = ['graph TD'];
    for (const name of patternNames) {
        const rel = relationships[name];
        if (!rel)
            continue;
        // Node definition with short ID
        const nodeId = sanitizeNodeId(name);
        // uses relationships (solid arrow)
        for (const target of rel.uses) {
            lines.push(`    ${nodeId} --> ${sanitizeNodeId(target)}`);
        }
        // dependsOn relationships (dashed arrow)
        for (const target of rel.dependsOn) {
            lines.push(`    ${nodeId} -.-> ${sanitizeNodeId(target)}`);
        }
        // implements relationships (dotted arrow) - realization relationship
        for (const target of rel.implementsPatterns) {
            lines.push(`    ${nodeId} ..-> ${sanitizeNodeId(target)}`);
        }
        // extends relationships (solid open arrow) - generalization relationship
        if (rel.extendsPattern) {
            lines.push(`    ${nodeId} -->> ${sanitizeNodeId(rel.extendsPattern)}`);
        }
    }
    if (lines.length === 1) {
        // No relationships to show
        return [];
    }
    return [
        heading(2, 'Dependencies'),
        paragraph('Pattern relationships and dependencies:'),
        mermaid(lines.join('\n')),
        separator(),
    ];
}
/**
 * Sanitize pattern name for mermaid node ID
 */
function sanitizeNodeId(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
}
// ═══════════════════════════════════════════════════════════════════════════
// Individual Pattern Detail Files
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Generate URL-safe slug from pattern name
 *
 * Produces readable slugs with proper word separation:
 * - DeciderPattern → "decider-pattern"
 * - BddTestingInfrastructure → "bdd-testing-infrastructure"
 * - APIEndpoint → "api-endpoint"
 *
 * @param patternName - The pattern name (typically CamelCase)
 * @returns URL-safe slug
 */
function patternToSlug(patternName) {
    return toKebabCase(patternName);
}
/**
 * Build individual pattern files (progressive disclosure)
 * Creates one file per pattern instead of grouping by category
 */
function buildIndividualPatternFiles(dataset) {
    const files = {};
    for (const pattern of dataset.patterns) {
        const displayName = getDisplayName(pattern);
        const slug = patternToSlug(pattern.patternName ?? displayName);
        files[`patterns/${slug}.md`] = buildSinglePatternDocument(pattern, dataset);
    }
    return files;
}
/**
 * Build a single pattern detail document
 *
 * @param pattern - The pattern to document
 * @param dataset - Full dataset for relationship lookups (implementedBy, extendedBy)
 */
function buildSinglePatternDocument(pattern, dataset) {
    const sections = [];
    const emoji = getStatusEmoji(pattern.status);
    const displayName = getDisplayName(pattern);
    const status = normalizeStatus(pattern.status);
    // Metadata table
    const metaRows = [
        ['Status', status],
        ['Category', formatCategoryName(pattern.category)],
    ];
    if (pattern.phase !== undefined) {
        metaRows.push(['Phase', String(pattern.phase)]);
    }
    if (pattern.quarter) {
        metaRows.push(['Quarter', pattern.quarter]);
    }
    sections.push(heading(2, 'Overview'), table(['Property', 'Value'], metaRows));
    // Description
    // Description - strip leading headers to avoid duplicate headings when
    // directive descriptions start with markdown headers like "## Topic"
    if (pattern.directive.description) {
        const cleanDescription = stripLeadingHeaders(pattern.directive.description);
        if (cleanDescription) {
            sections.push(heading(2, 'Description'), paragraph(cleanDescription));
        }
    }
    // Use cases
    if (pattern.useCases && pattern.useCases.length > 0) {
        sections.push(heading(2, 'Use Cases'), list([...pattern.useCases]));
    }
    // Dependencies
    if ((pattern.dependsOn && pattern.dependsOn.length > 0) ||
        (pattern.enables && pattern.enables.length > 0)) {
        sections.push(heading(2, 'Dependencies'));
        if (pattern.dependsOn && pattern.dependsOn.length > 0) {
            sections.push(list(pattern.dependsOn.map((d) => `Depends on: ${d}`)));
        }
        if (pattern.enables && pattern.enables.length > 0) {
            sections.push(list(pattern.enables.map((e) => `Enables: ${e}`)));
        }
    }
    // Implementations (files that implement this pattern via @libar-docs-implements)
    const patternKey = pattern.patternName ?? pattern.name;
    const rel = dataset.relationshipIndex?.[patternKey];
    if (rel?.implementedBy && rel.implementedBy.length > 0) {
        sections.push(heading(2, 'Implementations'));
        sections.push(paragraph('Files that implement this pattern:'), list(rel.implementedBy.map((impl) => {
            // Extract file name from path for display (e.g., "outbox.ts" from "packages/.../outbox.ts")
            const fileName = impl.file.split('/').pop() ?? impl.file;
            // Normalize path to strip repo prefixes (e.g., "libar-platform/packages/..." -> "packages/...")
            const normalizedPath = normalizeImplPath(impl.file);
            // ListItem accepts plain strings - build inline markdown link
            // Link is relative from output/patterns/ directory, go up two levels to project root
            const link = `[\`${fileName}\`](../../${normalizedPath})`;
            return impl.description ? `${link} - ${impl.description}` : link;
        })));
    }
    // Extensions (patterns that extend this pattern via @libar-docs-extends)
    if (rel?.extendedBy && rel.extendedBy.length > 0) {
        sections.push(heading(2, 'Extensions'));
        sections.push(paragraph('Patterns that extend this one:'), list(rel.extendedBy.map((ext) => linkOut(`patterns/${patternToSlug(ext)}.md`, ext))));
    }
    // Acceptance Criteria (scenarios with steps, DataTables, DocStrings)
    // Use H2 to match other top-level sections in detail documents
    sections.push(...renderAcceptanceCriteria(pattern.scenarios, { baseHeadingLevel: 2 }));
    // Business Rules (from Gherkin Rule: keyword)
    // Use H2 to match other top-level sections in detail documents
    sections.push(...renderBusinessRulesSection(pattern.rules, { baseHeadingLevel: 2 }));
    // Back link
    sections.push(separator(), linkOut('← Back to Pattern Registry', '../PATTERNS.md'));
    return document(`${emoji} ${displayName}`, sections, {
        purpose: `Detailed documentation for the ${displayName} pattern`,
    });
}
//# sourceMappingURL=patterns.js.map