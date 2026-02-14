/**
 * @libar-docs
 * @libar-docs-pattern ReferenceDocumentCodec
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 *
 * ## Parameterized Reference Document Codec
 *
 * A single codec factory that creates reference document codecs from
 * configuration objects. Convention content is sourced from
 * decision records tagged with @libar-docs-convention.
 *
 * ### When to Use
 *
 * - When generating reference documentation from convention-tagged decisions
 * - When creating both detailed (docs/) and summary (_claude-md/) outputs
 *
 * ### Factory Pattern
 *
 * ```typescript
 * const codec = createReferenceCodec(config, { detailLevel: 'detailed' });
 * const doc = codec.decode(dataset);
 * ```
 */
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { heading, paragraph, separator, table, code, mermaid, document, } from '../schema.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions, } from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { extractConventions } from './convention-extractor.js';
import { extractShapesFromDataset } from './shape-matcher.js';
import { sanitizeNodeId, EDGE_STYLES } from './diagram-utils.js';
import { getPatternName } from '../../api/pattern-helpers.js';
const DEFAULT_REFERENCE_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    detailLevel: 'standard',
};
// ============================================================================
// Codec Factory
// ============================================================================
/**
 * Creates a reference document codec from configuration.
 *
 * The codec composes a RenderableDocument from up to four sources:
 * 1. Convention content from convention-tagged decision records
 * 2. Scoped relationship diagram (if diagramScope configured)
 * 3. TypeScript shapes from patterns matching shapeSources globs
 * 4. Behavior content from category-tagged patterns
 *
 * @param config - Reference document configuration
 * @param options - Codec options including DetailLevel
 */
export function createReferenceCodec(config, options) {
    const opts = mergeOptions(DEFAULT_REFERENCE_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            const sections = [];
            // 1. Convention content from tagged decision records
            const conventions = extractConventions(dataset, config.conventionTags);
            if (conventions.length > 0) {
                sections.push(...buildConventionSections(conventions, opts.detailLevel));
            }
            // 2. Scoped relationship diagrams (normalize singular to array)
            if (opts.detailLevel !== 'summary') {
                const scopes = config.diagramScopes ??
                    (config.diagramScope !== undefined ? [config.diagramScope] : []);
                for (const scope of scopes) {
                    const diagramSections = buildScopedDiagram(dataset, scope);
                    if (diagramSections.length > 0) {
                        sections.push(...diagramSections);
                    }
                }
            }
            // 3. Shape extraction from matching patterns (AD-6: in-memory glob matching)
            if (config.shapeSources.length > 0) {
                const shapes = extractShapesFromDataset(dataset, config.shapeSources);
                if (shapes.length > 0) {
                    sections.push(...buildShapeSections(shapes, opts.detailLevel));
                }
            }
            // 4. Behavior content from tagged patterns
            if (config.behaviorCategories.length > 0) {
                sections.push(...buildBehaviorSections(dataset, config.behaviorCategories, opts.detailLevel));
            }
            if (sections.length === 0) {
                const diagnostics = [];
                if (config.conventionTags.length > 0) {
                    diagnostics.push(`conventions [${config.conventionTags.join(', ')}]`);
                }
                if (config.shapeSources.length > 0) {
                    diagnostics.push(`shapes [${config.shapeSources.join(', ')}]`);
                }
                if (config.behaviorCategories.length > 0) {
                    diagnostics.push(`behaviors [${config.behaviorCategories.join(', ')}]`);
                }
                sections.push(paragraph(`No content found. Sources checked: ${diagnostics.join('; ')}.`));
            }
            return document(config.title, sections, {
                purpose: `Reference document: ${config.title}`,
                detailLevel: opts.detailLevel === 'summary' ? 'Compact summary' : 'Full reference',
            });
        },
        encode: () => {
            throw new Error('ReferenceDocumentCodec is decode-only');
        },
    });
}
// ============================================================================
// Section Builders
// ============================================================================
/**
 * Build sections from convention bundles.
 */
function buildConventionSections(conventions, detailLevel) {
    const sections = [];
    for (const bundle of conventions) {
        if (bundle.rules.length === 0)
            continue;
        for (const rule of bundle.rules) {
            sections.push(heading(2, rule.ruleName));
            if (rule.invariant) {
                sections.push(paragraph(`**Invariant:** ${rule.invariant}`));
            }
            if (rule.narrative && detailLevel !== 'summary') {
                sections.push(paragraph(rule.narrative));
            }
            if (rule.rationale && detailLevel === 'detailed') {
                sections.push(paragraph(`**Rationale:** ${rule.rationale}`));
            }
            for (const tbl of rule.tables) {
                const rows = tbl.rows.map((row) => tbl.headers.map((h) => row[h] ?? ''));
                sections.push(table([...tbl.headers], rows));
            }
            if (rule.codeExamples !== undefined && detailLevel !== 'summary') {
                for (const example of rule.codeExamples) {
                    if (example.type === 'code' && example.language === 'mermaid') {
                        sections.push(mermaid(example.content));
                    }
                    else {
                        sections.push(example);
                    }
                }
            }
            if (rule.verifiedBy && rule.verifiedBy.length > 0 && detailLevel === 'detailed') {
                sections.push(paragraph(`**Verified by:** ${rule.verifiedBy.join(', ')}`));
            }
            sections.push(separator());
        }
    }
    return sections;
}
/**
 * Build sections from behavior-tagged patterns.
 */
function buildBehaviorSections(dataset, behaviorCategories, detailLevel) {
    const sections = [];
    // Filter patterns whose category matches any behaviorCategory
    const matchingPatterns = dataset.patterns.filter((p) => behaviorCategories.includes(p.category));
    if (matchingPatterns.length === 0)
        return sections;
    sections.push(heading(2, 'Behavior Specifications'));
    for (const pattern of matchingPatterns) {
        sections.push(heading(3, pattern.name));
        if (pattern.directive.description && detailLevel !== 'summary') {
            sections.push(paragraph(pattern.directive.description));
        }
        if (pattern.rules && pattern.rules.length > 0) {
            const ruleRows = pattern.rules.map((r) => [
                r.name,
                r.description ? r.description.substring(0, 120) : '',
            ]);
            sections.push(table(['Rule', 'Description'], ruleRows));
        }
    }
    sections.push(separator());
    return sections;
}
/**
 * Build sections from extracted TypeScript shapes.
 *
 * Composition order follows AD-5: conventions → shapes → behaviors.
 *
 * Detail level controls:
 * - summary: type name + kind table only (compact)
 * - standard: names + source text code blocks
 * - detailed: full source with JSDoc and property doc tables
 */
function buildShapeSections(shapes, detailLevel) {
    const sections = [];
    sections.push(heading(2, 'API Types'));
    if (detailLevel === 'summary') {
        // Summary: just a table of type names and kinds
        const rows = shapes.map((s) => [s.name, s.kind]);
        sections.push(table(['Type', 'Kind'], rows));
    }
    else {
        // Standard/Detailed: code blocks for each shape
        for (const shape of shapes) {
            sections.push(heading(3, `${shape.name} (${shape.kind})`));
            if (shape.jsDoc && detailLevel === 'detailed') {
                sections.push(paragraph(shape.jsDoc));
            }
            sections.push(code(shape.sourceText, 'typescript'));
            // Property docs table for interfaces at detailed level
            if (detailLevel === 'detailed' && shape.propertyDocs && shape.propertyDocs.length > 0) {
                const propRows = shape.propertyDocs.map((p) => [p.name, p.jsDoc]);
                sections.push(table(['Property', 'Description'], propRows));
            }
        }
    }
    sections.push(separator());
    return sections;
}
// ============================================================================
// Scoped Diagram Builder
// ============================================================================
/**
 * Collect patterns matching a DiagramScope filter.
 */
function collectScopePatterns(dataset, scope) {
    const nameSet = new Set(scope.patterns ?? []);
    const contextSet = new Set(scope.archContext ?? []);
    const viewSet = new Set(scope.archView ?? []);
    return dataset.patterns.filter((p) => {
        const name = getPatternName(p);
        if (nameSet.has(name))
            return true;
        if (p.archContext !== undefined && contextSet.has(p.archContext))
            return true;
        if (p.archView?.some((v) => viewSet.has(v)) === true)
            return true;
        return false;
    });
}
/**
 * Collect neighbor patterns — targets of relationship edges from scope patterns
 * that are not themselves in scope. Only outgoing edges (uses, dependsOn,
 * implementsPatterns, extendsPattern) are traversed; incoming edges (usedBy,
 * enables) are intentionally excluded to keep scoped diagrams focused on what
 * the scope depends on, not what depends on it.
 */
function collectNeighborPatterns(dataset, scopeNames) {
    const neighborNames = new Set();
    const relationships = dataset.relationshipIndex ?? {};
    for (const name of scopeNames) {
        const rel = relationships[name];
        if (!rel)
            continue;
        for (const target of rel.uses) {
            if (!scopeNames.has(target))
                neighborNames.add(target);
        }
        for (const target of rel.dependsOn) {
            if (!scopeNames.has(target))
                neighborNames.add(target);
        }
        for (const target of rel.implementsPatterns) {
            if (!scopeNames.has(target))
                neighborNames.add(target);
        }
        if (rel.extendsPattern !== undefined && !scopeNames.has(rel.extendsPattern)) {
            neighborNames.add(rel.extendsPattern);
        }
    }
    if (neighborNames.size === 0)
        return [];
    return dataset.patterns.filter((p) => neighborNames.has(getPatternName(p)));
}
/**
 * Build a scoped relationship diagram from DiagramScope config.
 *
 * Scope patterns are grouped by archContext in subgraphs.
 * Neighbor patterns (connected but not in scope) appear in a "Related" subgraph
 * with a dashed border style. Relationship edges use the same arrow conventions
 * as the architecture codec.
 */
function buildScopedDiagram(dataset, scope) {
    const scopePatterns = collectScopePatterns(dataset, scope);
    if (scopePatterns.length === 0)
        return [];
    const nodeIds = new Map();
    const scopeNames = new Set();
    // Register scope pattern node IDs
    for (const pattern of scopePatterns) {
        const name = getPatternName(pattern);
        scopeNames.add(name);
        nodeIds.set(name, sanitizeNodeId(name));
    }
    // Collect and register neighbor patterns
    const neighborPatterns = collectNeighborPatterns(dataset, scopeNames);
    const neighborNames = new Set();
    for (const pattern of neighborPatterns) {
        const name = getPatternName(pattern);
        neighborNames.add(name);
        nodeIds.set(name, sanitizeNodeId(name));
    }
    const direction = scope.direction ?? 'TB';
    const title = scope.title ?? 'Component Overview';
    const lines = [`graph ${direction}`];
    // Group scope patterns by archContext for subgraphs
    const byContext = new Map();
    const noContext = [];
    for (const pattern of scopePatterns) {
        if (pattern.archContext !== undefined) {
            const group = byContext.get(pattern.archContext) ?? [];
            group.push(pattern);
            byContext.set(pattern.archContext, group);
        }
        else {
            noContext.push(pattern);
        }
    }
    // Emit context subgraphs
    for (const [context, patterns] of [...byContext.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const contextLabel = context.charAt(0).toUpperCase() + context.slice(1);
        lines.push(`    subgraph ${sanitizeNodeId(context)}["${contextLabel}"]`);
        for (const pattern of patterns) {
            const name = getPatternName(pattern);
            const nodeId = nodeIds.get(name) ?? sanitizeNodeId(name);
            const roleLabel = pattern.archRole !== undefined ? `[${pattern.archRole}]` : '';
            lines.push(`        ${nodeId}["${name}${roleLabel}"]`);
        }
        lines.push('    end');
    }
    // Emit scope patterns without context
    for (const pattern of noContext) {
        const name = getPatternName(pattern);
        const nodeId = nodeIds.get(name) ?? sanitizeNodeId(name);
        lines.push(`    ${nodeId}["${name}"]`);
    }
    // Emit neighbor subgraph
    if (neighborPatterns.length > 0) {
        lines.push('    subgraph related["Related"]');
        for (const pattern of neighborPatterns) {
            const name = getPatternName(pattern);
            const nodeId = nodeIds.get(name) ?? sanitizeNodeId(name);
            lines.push(`        ${nodeId}["${name}"]:::neighbor`);
        }
        lines.push('    end');
    }
    // Emit relationship edges (only between nodes in the diagram)
    const relationships = dataset.relationshipIndex ?? {};
    const allNames = new Set([...scopeNames, ...neighborNames]);
    for (const sourceName of allNames) {
        const sourceId = nodeIds.get(sourceName);
        if (sourceId === undefined)
            continue;
        const rel = relationships[sourceName];
        if (!rel)
            continue;
        for (const target of rel.uses) {
            const targetId = nodeIds.get(target);
            if (targetId !== undefined) {
                lines.push(`    ${sourceId} ${EDGE_STYLES.uses} ${targetId}`);
            }
        }
        for (const target of rel.dependsOn) {
            const targetId = nodeIds.get(target);
            if (targetId !== undefined) {
                lines.push(`    ${sourceId} ${EDGE_STYLES.dependsOn} ${targetId}`);
            }
        }
        for (const target of rel.implementsPatterns) {
            const targetId = nodeIds.get(target);
            if (targetId !== undefined) {
                lines.push(`    ${sourceId} ${EDGE_STYLES.implementsPatterns} ${targetId}`);
            }
        }
        if (rel.extendsPattern !== undefined) {
            const targetId = nodeIds.get(rel.extendsPattern);
            if (targetId !== undefined) {
                lines.push(`    ${sourceId} ${EDGE_STYLES.extendsPattern} ${targetId}`);
            }
        }
    }
    // Add neighbor class definition
    if (neighborPatterns.length > 0) {
        lines.push('    classDef neighbor stroke-dasharray: 5 5');
    }
    return [
        heading(2, title),
        paragraph('Scoped architecture diagram showing component relationships:'),
        mermaid(lines.join('\n')),
        separator(),
    ];
}
//# sourceMappingURL=reference.js.map