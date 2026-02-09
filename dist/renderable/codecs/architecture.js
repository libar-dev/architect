/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ArchitectureCodec
 * @libar-docs-status completed
 * @libar-docs-arch-role projection
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer application
 * @libar-docs-uses MasterDataset, ArchIndex
 *
 * ## Architecture Diagram Codec
 *
 * Transforms MasterDataset into a RenderableDocument containing
 * architecture diagrams (Mermaid) generated from source annotations.
 *
 * ### When to Use
 *
 * - When generating architecture diagrams from code annotations
 * - When visualizing bounded contexts and component relationships
 * - When creating layered architecture views (domain/application/infrastructure)
 *
 * ### Factory Pattern
 *
 * Use `createArchitectureCodec(options)` to create a configured codec:
 * ```typescript
 * const codec = createArchitectureCodec({ diagramType: "component" });
 * const doc = codec.decode(dataset);
 * ```
 *
 * Or use the default export for standard behavior:
 * ```typescript
 * const doc = ArchitectureDocumentCodec.decode(dataset);
 * ```
 *
 * ### Supported Diagram Types
 *
 * - **component**: System overview with bounded context subgraphs
 * - **layered**: Components organized by architectural layer
 */
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { heading, paragraph, separator, table, mermaid, document, } from '../schema.js';
import { getDisplayName, getStatusEmoji } from '../utils.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
/**
 * Default options for ArchitectureDocumentCodec
 */
export const DEFAULT_ARCHITECTURE_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    diagramType: 'component',
    includeInventory: true,
    includeLegend: true,
    filterContexts: [],
};
// ═══════════════════════════════════════════════════════════════════════════
// Architecture Document Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create an ArchitectureDocumentCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Generate component diagram (default)
 * const codec = createArchitectureCodec();
 *
 * // Generate layered diagram
 * const codec = createArchitectureCodec({ diagramType: "layered" });
 *
 * // Filter to specific bounded contexts
 * const codec = createArchitectureCodec({ filterContexts: ["orders", "inventory"] });
 * ```
 */
export function createArchitectureCodec(options) {
    const opts = mergeOptions(DEFAULT_ARCHITECTURE_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildArchitectureDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('ArchitectureDocumentCodec is decode-only. See zod-codecs.md');
        },
    });
}
/**
 * Default Architecture Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for architecture diagrams.
 * Uses default options with component diagram type.
 *
 * @example
 * ```typescript
 * const doc = ArchitectureDocumentCodec.decode(masterDataset);
 * const markdown = renderToMarkdown(doc);
 * ```
 */
export const ArchitectureDocumentCodec = createArchitectureCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build the architecture document from dataset
 */
function buildArchitectureDocument(dataset, options) {
    const sections = [];
    const archIndex = dataset.archIndex;
    // Check if we have any architecture metadata
    if (!archIndex || archIndex.all.length === 0) {
        return document('Architecture', [
            heading(2, 'No Architecture Data'),
            paragraph('No patterns with architecture annotations found. ' +
                'Add `@libar-docs-arch-role`, `@libar-docs-arch-context`, or ' +
                '`@libar-docs-arch-layer` tags to source files to generate architecture diagrams.'),
        ]);
    }
    // Apply context filter if specified
    const filteredIndex = applyContextFilter(archIndex, options.filterContexts);
    // 1. Summary section
    sections.push(...buildSummarySection(filteredIndex));
    // 2. Main diagram based on type
    if (options.diagramType === 'component') {
        sections.push(...buildComponentDiagram(filteredIndex, dataset));
    }
    else {
        sections.push(...buildLayeredDiagram(filteredIndex, dataset));
    }
    // 3. Legend (if enabled)
    if (options.includeLegend) {
        sections.push(...buildLegendSection());
    }
    // 4. Component inventory (if enabled)
    if (options.includeInventory) {
        sections.push(...buildInventorySection(filteredIndex));
    }
    return document('Architecture', sections, {
        purpose: 'Auto-generated architecture diagram from source annotations',
        detailLevel: options.diagramType === 'component'
            ? 'Component diagram with bounded context subgraphs'
            : 'Layered architecture diagram',
    });
}
/**
 * Apply context filter to architecture index
 */
function applyContextFilter(archIndex, filterContexts) {
    if (filterContexts.length === 0) {
        return archIndex;
    }
    // Filter byContext to only include specified contexts
    const filteredByContext = {};
    for (const ctx of filterContexts) {
        if (archIndex.byContext[ctx]) {
            filteredByContext[ctx] = archIndex.byContext[ctx];
        }
    }
    // Filter all to only include patterns in specified contexts
    const filteredAll = archIndex.all.filter((p) => p.archContext !== undefined && filterContexts.includes(p.archContext));
    // Filter byRole to only include patterns in specified contexts
    const filteredByRole = {};
    for (const [role, patterns] of Object.entries(archIndex.byRole)) {
        const filtered = patterns.filter((p) => p.archContext !== undefined && filterContexts.includes(p.archContext));
        if (filtered.length > 0) {
            filteredByRole[role] = filtered;
        }
    }
    // Filter byLayer similarly
    const filteredByLayer = {};
    for (const [layer, patterns] of Object.entries(archIndex.byLayer)) {
        const filtered = patterns.filter((p) => p.archContext !== undefined && filterContexts.includes(p.archContext));
        if (filtered.length > 0) {
            filteredByLayer[layer] = filtered;
        }
    }
    return {
        byContext: filteredByContext,
        byRole: filteredByRole,
        byLayer: filteredByLayer,
        all: filteredAll,
    };
}
// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build summary section with component counts
 */
function buildSummarySection(archIndex) {
    const contextCount = Object.keys(archIndex.byContext).length;
    const roleCount = Object.keys(archIndex.byRole).length;
    const totalComponents = archIndex.all.length;
    return [
        heading(2, 'Overview'),
        paragraph(`This diagram was auto-generated from ${totalComponents} annotated source files ` +
            `across ${contextCount} bounded context${contextCount !== 1 ? 's' : ''}.`),
        table(['Metric', 'Count'], [
            ['Total Components', String(totalComponents)],
            ['Bounded Contexts', String(contextCount)],
            ['Component Roles', String(roleCount)],
        ]),
        separator(),
    ];
}
/**
 * Build component diagram with bounded context subgraphs
 *
 * Arrow styles per PatternRelationshipModel:
 * - uses → solid arrow (-->)
 * - depends-on → dashed arrow (-.->)
 * - implements → dotted arrow (..->)
 * - extends → solid open arrow (-->>)
 */
function buildComponentDiagram(archIndex, dataset) {
    const lines = ['graph TB'];
    const nodeIds = new Map(); // pattern name → node ID
    // First pass: collect all node IDs
    for (const pattern of archIndex.all) {
        const name = getPatternName(pattern);
        const nodeId = sanitizeNodeId(name);
        nodeIds.set(name, nodeId);
    }
    // Organize patterns by context
    const byContext = archIndex.byContext;
    const contexts = Object.keys(byContext).sort();
    // Patterns without context go to "Shared Infrastructure"
    const sharedPatterns = archIndex.all.filter((p) => !p.archContext);
    // Generate subgraphs for each bounded context
    for (const context of contexts) {
        const patterns = byContext[context] ?? [];
        if (patterns.length === 0)
            continue;
        const contextLabel = formatContextLabel(context);
        lines.push(`    subgraph ${sanitizeNodeId(context)}["${contextLabel}"]`);
        for (const pattern of patterns) {
            const name = getPatternName(pattern);
            const nodeId = nodeIds.get(name) ?? sanitizeNodeId(name);
            const roleLabel = pattern.archRole ? `[${pattern.archRole}]` : '';
            lines.push(`        ${nodeId}["${name}${roleLabel}"]`);
        }
        lines.push('    end');
    }
    // Generate shared infrastructure subgraph (patterns without context)
    if (sharedPatterns.length > 0) {
        lines.push(`    subgraph shared["Shared Infrastructure"]`);
        for (const pattern of sharedPatterns) {
            const name = getPatternName(pattern);
            const nodeId = nodeIds.get(name) ?? sanitizeNodeId(name);
            const roleLabel = pattern.archRole ? `[${pattern.archRole}]` : '';
            lines.push(`        ${nodeId}["${name}${roleLabel}"]`);
        }
        lines.push('    end');
    }
    // Second pass: add relationships from relationshipIndex
    const relationships = dataset.relationshipIndex ?? {};
    for (const pattern of archIndex.all) {
        const name = getPatternName(pattern);
        const sourceId = nodeIds.get(name);
        if (!sourceId)
            continue;
        const rel = relationships[name];
        if (!rel)
            continue;
        // uses relationships (solid arrow) - only to other arch components
        for (const target of rel.uses) {
            const targetId = nodeIds.get(target);
            if (targetId) {
                lines.push(`    ${sourceId} --> ${targetId}`);
            }
        }
        // dependsOn relationships (dashed arrow)
        for (const target of rel.dependsOn) {
            const targetId = nodeIds.get(target);
            if (targetId) {
                lines.push(`    ${sourceId} -.-> ${targetId}`);
            }
        }
        // implements relationships (dotted arrow)
        for (const target of rel.implementsPatterns) {
            const targetId = nodeIds.get(target);
            if (targetId) {
                lines.push(`    ${sourceId} ..-> ${targetId}`);
            }
        }
        // extends relationships (solid open arrow)
        if (rel.extendsPattern) {
            const targetId = nodeIds.get(rel.extendsPattern);
            if (targetId) {
                lines.push(`    ${sourceId} -->> ${targetId}`);
            }
        }
    }
    return [
        heading(2, 'System Overview'),
        paragraph('Component architecture with bounded context isolation:'),
        mermaid(lines.join('\n')),
        separator(),
    ];
}
/**
 * Build layered architecture diagram organized by layer
 */
function buildLayeredDiagram(archIndex, dataset) {
    const lines = ['graph TB'];
    const nodeIds = new Map();
    // Collect all node IDs first
    for (const pattern of archIndex.all) {
        const name = getPatternName(pattern);
        const nodeId = sanitizeNodeId(name);
        nodeIds.set(name, nodeId);
    }
    // Layer order (top to bottom in diagram: domain at top, infrastructure at bottom)
    const layerOrder = ['domain', 'application', 'infrastructure'];
    const byLayer = archIndex.byLayer;
    // Generate subgraphs for each layer
    for (const layer of layerOrder) {
        const patterns = byLayer[layer] ?? [];
        if (patterns.length === 0)
            continue;
        const layerLabel = formatLayerLabel(layer);
        lines.push(`    subgraph ${layer}["${layerLabel}"]`);
        for (const pattern of patterns) {
            const name = getPatternName(pattern);
            const nodeId = nodeIds.get(name) ?? sanitizeNodeId(name);
            const contextLabel = pattern.archContext ? ` (${pattern.archContext})` : '';
            lines.push(`        ${nodeId}["${name}${contextLabel}"]`);
        }
        lines.push('    end');
    }
    // Patterns without layer
    const unlayered = archIndex.all.filter((p) => !p.archLayer);
    if (unlayered.length > 0) {
        lines.push(`    subgraph other["Other"]`);
        for (const pattern of unlayered) {
            const name = getPatternName(pattern);
            const nodeId = nodeIds.get(name) ?? sanitizeNodeId(name);
            lines.push(`        ${nodeId}["${name}"]`);
        }
        lines.push('    end');
    }
    // Add relationships
    const relationships = dataset.relationshipIndex ?? {};
    for (const pattern of archIndex.all) {
        const name = getPatternName(pattern);
        const sourceId = nodeIds.get(name);
        if (!sourceId)
            continue;
        const rel = relationships[name];
        if (!rel)
            continue;
        for (const target of rel.uses) {
            const targetId = nodeIds.get(target);
            if (targetId) {
                lines.push(`    ${sourceId} --> ${targetId}`);
            }
        }
        for (const target of rel.dependsOn) {
            const targetId = nodeIds.get(target);
            if (targetId) {
                lines.push(`    ${sourceId} -.-> ${targetId}`);
            }
        }
    }
    return [
        heading(2, 'Layered Architecture'),
        paragraph('Components organized by architectural layer:'),
        mermaid(lines.join('\n')),
        separator(),
    ];
}
/**
 * Build legend section explaining arrow styles
 */
function buildLegendSection() {
    return [
        heading(2, 'Legend'),
        table(['Arrow Style', 'Relationship', 'Description'], [
            ['`-->`', 'uses', 'Direct dependency (solid arrow)'],
            ['`-.->` ', 'depends-on', 'Weak dependency (dashed arrow)'],
            ['`..->` ', 'implements', 'Realization relationship (dotted arrow)'],
            ['`-->>` ', 'extends', 'Generalization relationship (open arrow)'],
        ]),
        separator(),
    ];
}
/**
 * Build component inventory table
 */
function buildInventorySection(archIndex) {
    const rows = [];
    // Sort patterns by context, then by role, then by name
    const sorted = [...archIndex.all].sort((a, b) => {
        const ctxA = a.archContext ?? 'zzz'; // No context sorts last
        const ctxB = b.archContext ?? 'zzz';
        if (ctxA !== ctxB)
            return ctxA.localeCompare(ctxB);
        const roleA = a.archRole ?? '';
        const roleB = b.archRole ?? '';
        if (roleA !== roleB)
            return roleA.localeCompare(roleB);
        const nameA = getPatternName(a);
        const nameB = getPatternName(b);
        return nameA.localeCompare(nameB);
    });
    for (const pattern of sorted) {
        const name = getDisplayName(pattern);
        const emoji = getStatusEmoji(pattern.status);
        const context = pattern.archContext ?? '-';
        const role = pattern.archRole ?? '-';
        const layer = pattern.archLayer ?? '-';
        const source = pattern.source.file;
        rows.push([`${emoji} ${name}`, context, role, layer, source]);
    }
    return [
        heading(2, 'Component Inventory'),
        paragraph('All components with architecture annotations:'),
        table(['Component', 'Context', 'Role', 'Layer', 'Source File'], rows),
    ];
}
// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Sanitize pattern name for Mermaid node ID
 * Mermaid requires alphanumeric + underscore only
 */
function sanitizeNodeId(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
}
/**
 * Format context name for subgraph label
 * E.g., "orders" → "Orders BC"
 */
function formatContextLabel(context) {
    const capitalized = context.charAt(0).toUpperCase() + context.slice(1);
    return `${capitalized} BC`;
}
/**
 * Format layer name for subgraph label
 * E.g., "domain" → "Domain Layer"
 */
function formatLayerLabel(layer) {
    const capitalized = layer.charAt(0).toUpperCase() + layer.slice(1);
    return `${capitalized} Layer`;
}
//# sourceMappingURL=architecture.js.map