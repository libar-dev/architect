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
import { heading, paragraph, separator, table, code, list, mermaid, collapsible, linkOut, document, } from '../schema.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions, } from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { extractConventions } from './convention-extractor.js';
import { parseBusinessRuleAnnotations, truncateText } from './helpers.js';
import { extractShapesFromDataset, filterShapesBySelectors } from './shape-matcher.js';
import { sanitizeNodeId, EDGE_STYLES, EDGE_LABELS, SEQUENCE_ARROWS, formatNodeDeclaration, } from './diagram-utils.js';
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
                const scopes = config.diagramScopes ?? (config.diagramScope !== undefined ? [config.diagramScope] : []);
                for (const scope of scopes) {
                    const diagramSections = buildScopedDiagram(dataset, scope);
                    if (diagramSections.length > 0) {
                        sections.push(...diagramSections);
                    }
                }
            }
            // 3. Shape extraction: combine shapeSources (coarse) + shapeSelectors (fine)
            {
                const allShapes = config.shapeSources.length > 0
                    ? [...extractShapesFromDataset(dataset, config.shapeSources)]
                    : [];
                // DD-3/DD-6: Fine-grained selector-based filtering
                if (config.shapeSelectors !== undefined && config.shapeSelectors.length > 0) {
                    const selectorShapes = filterShapesBySelectors(dataset, config.shapeSelectors);
                    const seenNames = new Set(allShapes.map((s) => s.name));
                    for (const shape of selectorShapes) {
                        if (!seenNames.has(shape.name)) {
                            seenNames.add(shape.name);
                            allShapes.push(shape);
                        }
                    }
                }
                if (allShapes.length > 0) {
                    sections.push(...buildShapeSections(allShapes, opts.detailLevel));
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
                if (config.shapeSelectors !== undefined && config.shapeSelectors.length > 0) {
                    diagnostics.push(`selectors [${config.shapeSelectors.length} selectors]`);
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
        // Cross-reference link to source file (omitted at summary level)
        if (detailLevel !== 'summary') {
            sections.push(linkOut(`View ${pattern.name} source`, pattern.source.file));
        }
        if (pattern.directive.description && detailLevel !== 'summary') {
            sections.push(paragraph(pattern.directive.description));
        }
        if (pattern.rules && pattern.rules.length > 0) {
            if (detailLevel === 'summary') {
                // Compact table with word-boundary-aware truncation
                const ruleRows = pattern.rules.map((r) => [
                    r.name,
                    r.description ? truncateText(r.description, 120) : '',
                ]);
                sections.push(table(['Rule', 'Description'], ruleRows));
            }
            else {
                // Structured per-rule rendering with parsed annotations
                // Wrap in collapsible blocks when 3+ rules for progressive disclosure
                const wrapInCollapsible = pattern.rules.length >= 3;
                for (const rule of pattern.rules) {
                    const ruleBlocks = [];
                    ruleBlocks.push(heading(4, rule.name));
                    const annotations = parseBusinessRuleAnnotations(rule.description);
                    if (annotations.invariant) {
                        ruleBlocks.push(paragraph(`**Invariant:** ${annotations.invariant}`));
                    }
                    if (annotations.rationale && detailLevel === 'detailed') {
                        ruleBlocks.push(paragraph(`**Rationale:** ${annotations.rationale}`));
                    }
                    if (annotations.remainingContent) {
                        ruleBlocks.push(paragraph(annotations.remainingContent));
                    }
                    if (annotations.codeExamples && detailLevel === 'detailed') {
                        for (const example of annotations.codeExamples) {
                            ruleBlocks.push(example);
                        }
                    }
                    // Merged scenario names + verifiedBy as deduplicated list
                    const names = new Set(rule.scenarioNames);
                    if (annotations.verifiedBy) {
                        for (const v of annotations.verifiedBy) {
                            names.add(v);
                        }
                    }
                    if (names.size > 0) {
                        ruleBlocks.push(paragraph('**Verified by:**'));
                        ruleBlocks.push(list([...names]));
                    }
                    if (wrapInCollapsible) {
                        const scenarioCount = rule.scenarioNames.length;
                        const summary = scenarioCount > 0 ? `${rule.name} (${scenarioCount} scenarios)` : rule.name;
                        sections.push(collapsible(summary, ruleBlocks));
                    }
                    else {
                        sections.push(...ruleBlocks);
                    }
                }
            }
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
            if (shape.jsDoc) {
                sections.push(paragraph(shape.jsDoc));
            }
            sections.push(code(shape.sourceText, 'typescript'));
            // Property docs table for interfaces at detailed level
            if (detailLevel === 'detailed' && shape.propertyDocs && shape.propertyDocs.length > 0) {
                const propRows = shape.propertyDocs.map((p) => [p.name, p.jsDoc]);
                sections.push(table(['Property', 'Description'], propRows));
            }
            // Param docs table for functions at standard and detailed levels
            if (shape.params && shape.params.length > 0) {
                const paramRows = shape.params.map((p) => [p.name, p.type ?? '', p.description]);
                sections.push(table(['Parameter', 'Type', 'Description'], paramRows));
            }
            // Returns and throws docs at detailed level only
            if (detailLevel === 'detailed') {
                if (shape.returns) {
                    const returnText = shape.returns.type
                        ? `**Returns** (\`${shape.returns.type}\`): ${shape.returns.description}`
                        : `**Returns:** ${shape.returns.description}`;
                    sections.push(paragraph(returnText));
                }
                if (shape.throws && shape.throws.length > 0) {
                    const throwsRows = shape.throws.map((t) => [t.type ?? '', t.description]);
                    sections.push(table(['Exception', 'Description'], throwsRows));
                }
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
    const layerSet = new Set(scope.archLayer ?? []);
    return dataset.patterns.filter((p) => {
        const name = getPatternName(p);
        if (nameSet.has(name))
            return true;
        if (p.archContext !== undefined && contextSet.has(p.archContext))
            return true;
        if (p.archView?.some((v) => viewSet.has(v)) === true)
            return true;
        if (p.archLayer !== undefined && layerSet.has(p.archLayer))
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
/** Extract shared setup from scope + dataset into a reusable context */
function prepareDiagramContext(dataset, scope) {
    const scopePatterns = collectScopePatterns(dataset, scope);
    if (scopePatterns.length === 0)
        return undefined;
    const nodeIds = new Map();
    const scopeNames = new Set();
    for (const pattern of scopePatterns) {
        const name = getPatternName(pattern);
        scopeNames.add(name);
        nodeIds.set(name, sanitizeNodeId(name));
    }
    const neighborPatterns = collectNeighborPatterns(dataset, scopeNames);
    const neighborNames = new Set();
    for (const pattern of neighborPatterns) {
        const name = getPatternName(pattern);
        neighborNames.add(name);
        nodeIds.set(name, sanitizeNodeId(name));
    }
    const relationships = dataset.relationshipIndex ?? {};
    const allNames = new Set([...scopeNames, ...neighborNames]);
    return {
        scopePatterns,
        neighborPatterns,
        scopeNames,
        neighborNames,
        nodeIds,
        relationships,
        allNames,
    };
}
/** Emit relationship edges for flowchart diagrams (DD-4, DD-7) */
function emitFlowchartEdges(ctx, showLabels) {
    const lines = [];
    const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'];
    for (const sourceName of ctx.allNames) {
        const sourceId = ctx.nodeIds.get(sourceName);
        if (sourceId === undefined)
            continue;
        const rel = ctx.relationships[sourceName];
        if (!rel)
            continue;
        for (const type of edgeTypes) {
            for (const target of rel[type]) {
                const targetId = ctx.nodeIds.get(target);
                if (targetId !== undefined) {
                    const arrow = EDGE_STYLES[type];
                    const label = showLabels ? `|${EDGE_LABELS[type]}|` : '';
                    lines.push(`    ${sourceId} ${arrow}${label} ${targetId}`);
                }
            }
        }
        if (rel.extendsPattern !== undefined) {
            const targetId = ctx.nodeIds.get(rel.extendsPattern);
            if (targetId !== undefined) {
                const arrow = EDGE_STYLES.extendsPattern;
                const label = showLabels ? `|${EDGE_LABELS.extendsPattern}|` : '';
                lines.push(`    ${sourceId} ${arrow}${label} ${targetId}`);
            }
        }
    }
    return lines;
}
/** Build a Mermaid flowchart diagram with custom shapes and edge labels (DD-1, DD-4) */
function buildFlowchartDiagram(ctx, scope) {
    const direction = scope.direction ?? 'TB';
    const showLabels = scope.showEdgeLabels !== false;
    const lines = [`graph ${direction}`];
    // Group scope patterns by archContext for subgraphs
    const byContext = new Map();
    const noContext = [];
    for (const pattern of ctx.scopePatterns) {
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
            const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
            lines.push(`        ${formatNodeDeclaration(nodeId, name, pattern.archRole)}`);
        }
        lines.push('    end');
    }
    // Emit scope patterns without context
    for (const pattern of noContext) {
        const name = getPatternName(pattern);
        const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
        lines.push(`    ${formatNodeDeclaration(nodeId, name, pattern.archRole)}`);
    }
    // Emit neighbor subgraph
    if (ctx.neighborPatterns.length > 0) {
        lines.push('    subgraph related["Related"]');
        for (const pattern of ctx.neighborPatterns) {
            const name = getPatternName(pattern);
            const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
            lines.push(`        ${nodeId}["${name}"]:::neighbor`);
        }
        lines.push('    end');
    }
    // Emit edges
    lines.push(...emitFlowchartEdges(ctx, showLabels));
    // Add neighbor class definition
    if (ctx.neighborPatterns.length > 0) {
        lines.push('    classDef neighbor stroke-dasharray: 5 5');
    }
    return lines;
}
/** Build a Mermaid sequence diagram with participants and messages (DD-2) */
function buildSequenceDiagram(ctx) {
    const lines = ['sequenceDiagram'];
    const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'];
    // Emit participant declarations for scope patterns (sanitized for Mermaid syntax)
    for (const name of ctx.scopeNames) {
        lines.push(`    participant ${sanitizeNodeId(name)} as ${name}`);
    }
    // Emit participant declarations for neighbor patterns
    for (const name of ctx.neighborNames) {
        lines.push(`    participant ${sanitizeNodeId(name)} as ${name}`);
    }
    // Emit messages from relationships
    for (const sourceName of ctx.allNames) {
        const rel = ctx.relationships[sourceName];
        if (!rel)
            continue;
        for (const type of edgeTypes) {
            for (const target of rel[type]) {
                if (ctx.allNames.has(target)) {
                    const arrow = SEQUENCE_ARROWS[type];
                    lines.push(`    ${sanitizeNodeId(sourceName)} ${arrow} ${sanitizeNodeId(target)}: ${EDGE_LABELS[type]}`);
                }
            }
        }
        if (rel.extendsPattern !== undefined && ctx.allNames.has(rel.extendsPattern)) {
            const arrow = SEQUENCE_ARROWS.extendsPattern;
            lines.push(`    ${sanitizeNodeId(sourceName)} ${arrow} ${sanitizeNodeId(rel.extendsPattern)}: ${EDGE_LABELS.extendsPattern}`);
        }
    }
    return lines;
}
/** Build a Mermaid state diagram with transitions and pseudo-states (DD-3) */
function buildStateDiagram(ctx, scope) {
    const showLabels = scope.showEdgeLabels !== false;
    const lines = ['stateDiagram-v2'];
    // Track incoming/outgoing dependsOn edges for pseudo-states
    const hasIncoming = new Set();
    const hasOutgoing = new Set();
    // Emit state declarations for scope patterns
    for (const name of ctx.scopeNames) {
        const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
        lines.push(`    state "${name}" as ${nodeId}`);
    }
    // Emit state declarations for neighbor patterns
    for (const name of ctx.neighborNames) {
        const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
        lines.push(`    state "${name}" as ${nodeId}`);
    }
    // Emit transitions from dependsOn relationships
    for (const sourceName of ctx.allNames) {
        const rel = ctx.relationships[sourceName];
        if (!rel)
            continue;
        for (const target of rel.dependsOn) {
            if (!ctx.allNames.has(target))
                continue;
            const sourceId = ctx.nodeIds.get(sourceName) ?? sanitizeNodeId(sourceName);
            const targetId = ctx.nodeIds.get(target) ?? sanitizeNodeId(target);
            const label = showLabels ? ` : ${EDGE_LABELS.dependsOn}` : '';
            lines.push(`    ${targetId} --> ${sourceId}${label}`);
            hasIncoming.add(sourceName);
            hasOutgoing.add(target);
        }
    }
    // Add start pseudo-states for patterns with no incoming edges
    for (const name of ctx.scopeNames) {
        if (!hasIncoming.has(name)) {
            const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
            lines.push(`    [*] --> ${nodeId}`);
        }
    }
    // Add end pseudo-states for patterns with no outgoing edges
    for (const name of ctx.scopeNames) {
        if (!hasOutgoing.has(name)) {
            const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
            lines.push(`    ${nodeId} --> [*]`);
        }
    }
    return lines;
}
/** Build a Mermaid C4 context diagram with system boundaries */
function buildC4Diagram(ctx, scope) {
    const showLabels = scope.showEdgeLabels !== false;
    const lines = ['C4Context'];
    if (scope.title !== undefined) {
        lines.push(`    title ${scope.title}`);
    }
    // Group scope patterns by archContext for system boundaries
    const byContext = new Map();
    const noContext = [];
    for (const pattern of ctx.scopePatterns) {
        if (pattern.archContext !== undefined) {
            const group = byContext.get(pattern.archContext) ?? [];
            group.push(pattern);
            byContext.set(pattern.archContext, group);
        }
        else {
            noContext.push(pattern);
        }
    }
    // Emit system boundaries
    for (const [context, patterns] of [...byContext.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const contextLabel = context.charAt(0).toUpperCase() + context.slice(1);
        const contextId = sanitizeNodeId(context);
        lines.push(`    Boundary(${contextId}, "${contextLabel}") {`);
        for (const pattern of patterns) {
            const name = getPatternName(pattern);
            const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
            lines.push(`        System(${nodeId}, "${name}")`);
        }
        lines.push('    }');
    }
    // Emit standalone systems (no context)
    for (const pattern of noContext) {
        const name = getPatternName(pattern);
        const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
        lines.push(`    System(${nodeId}, "${name}")`);
    }
    // Emit external systems for neighbor patterns
    for (const pattern of ctx.neighborPatterns) {
        const name = getPatternName(pattern);
        const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
        lines.push(`    System_Ext(${nodeId}, "${name}")`);
    }
    // Emit relationships
    const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'];
    for (const sourceName of ctx.allNames) {
        const sourceId = ctx.nodeIds.get(sourceName);
        if (sourceId === undefined)
            continue;
        const rel = ctx.relationships[sourceName];
        if (!rel)
            continue;
        for (const type of edgeTypes) {
            for (const target of rel[type]) {
                const targetId = ctx.nodeIds.get(target);
                if (targetId !== undefined) {
                    const label = showLabels ? EDGE_LABELS[type] : '';
                    lines.push(`    Rel(${sourceId}, ${targetId}, "${label}")`);
                }
            }
        }
        if (rel.extendsPattern !== undefined) {
            const targetId = ctx.nodeIds.get(rel.extendsPattern);
            if (targetId !== undefined) {
                const label = showLabels ? EDGE_LABELS.extendsPattern : '';
                lines.push(`    Rel(${sourceId}, ${targetId}, "${label}")`);
            }
        }
    }
    return lines;
}
/** Build a Mermaid class diagram with pattern exports and relationships */
function buildClassDiagram(ctx) {
    const lines = ['classDiagram'];
    const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'];
    // Class arrow styles per relationship type
    const classArrows = {
        uses: '..>',
        dependsOn: '..>',
        implementsPatterns: '..|>',
        extendsPattern: '--|>',
    };
    // Emit class declarations for scope patterns (with members)
    for (const pattern of ctx.scopePatterns) {
        const name = getPatternName(pattern);
        const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
        lines.push(`    class ${nodeId} {`);
        if (pattern.archRole !== undefined) {
            lines.push(`        <<${pattern.archRole}>>`);
        }
        if (pattern.exports.length > 0) {
            for (const exp of pattern.exports) {
                lines.push(`        +${exp.name} ${exp.type}`);
            }
        }
        lines.push('    }');
    }
    // Emit class declarations for neighbor patterns (no members)
    for (const pattern of ctx.neighborPatterns) {
        const name = getPatternName(pattern);
        const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
        lines.push(`    class ${nodeId}`);
    }
    // Emit relationship edges
    for (const sourceName of ctx.allNames) {
        const sourceId = ctx.nodeIds.get(sourceName);
        if (sourceId === undefined)
            continue;
        const rel = ctx.relationships[sourceName];
        if (!rel)
            continue;
        for (const type of edgeTypes) {
            for (const target of rel[type]) {
                const targetId = ctx.nodeIds.get(target);
                if (targetId !== undefined) {
                    const arrow = classArrows[type] ?? '..>';
                    lines.push(`    ${sourceId} ${arrow} ${targetId} : ${EDGE_LABELS[type]}`);
                }
            }
        }
        if (rel.extendsPattern !== undefined) {
            const targetId = ctx.nodeIds.get(rel.extendsPattern);
            if (targetId !== undefined) {
                lines.push(`    ${sourceId} --|> ${targetId} : ${EDGE_LABELS.extendsPattern}`);
            }
        }
    }
    return lines;
}
/**
 * Build a scoped relationship diagram from DiagramScope config.
 *
 * Dispatches to type-specific builders based on scope.diagramType (DD-6).
 * Scope patterns are grouped by archContext in subgraphs (flowchart) or
 * rendered as participants/states (sequence/state diagrams).
 */
function buildScopedDiagram(dataset, scope) {
    const ctx = prepareDiagramContext(dataset, scope);
    if (ctx === undefined)
        return [];
    const title = scope.title ?? 'Component Overview';
    let diagramLines;
    switch (scope.diagramType ?? 'graph') {
        case 'sequenceDiagram':
            diagramLines = buildSequenceDiagram(ctx);
            break;
        case 'stateDiagram-v2':
            diagramLines = buildStateDiagram(ctx, scope);
            break;
        case 'C4Context':
            diagramLines = buildC4Diagram(ctx, scope);
            break;
        case 'classDiagram':
            diagramLines = buildClassDiagram(ctx);
            break;
        case 'graph':
        default:
            diagramLines = buildFlowchartDiagram(ctx, scope);
            break;
    }
    return [
        heading(2, title),
        paragraph('Scoped architecture diagram showing component relationships:'),
        mermaid(diagramLines.join('\n')),
        separator(),
    ];
}
//# sourceMappingURL=reference.js.map