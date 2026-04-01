/**
 * @architect
 * @architect-core
 * @architect-pattern ArchitectureCodec
 * @architect-status completed
 * @architect-unlock-reason:Add-createDecodeOnlyCodec-helper
 * @architect-arch-role projection
 * @architect-arch-context renderer
 * @architect-arch-layer application
 * @architect-include codec-transformation
 * @architect-uses MasterDataset, ArchIndex
 * @architect-convention codec-registry
 * @architect-product-area:Generation
 *
 * ## ArchitectureDocumentCodec
 *
 * Transforms MasterDataset into a RenderableDocument containing
 * architecture diagrams (Mermaid) generated from source annotations.
 *
 * **Purpose:** Architecture diagrams (Mermaid) generated from source annotations. Supports component and layered views.
 *
 * **Output Files:** `ARCHITECTURE.md` (generated architecture diagrams with component inventory)
 *
 * | Option | Type | Default | Description |
 * | --- | --- | --- | --- |
 * | diagramType | "component" \| "layered" | "component" | Type of diagram to generate |
 * | includeInventory | boolean | true | Include component inventory table |
 * | includeLegend | boolean | true | Include legend for arrow styles |
 * | filterContexts | string[] | [] | Filter to specific contexts (empty = all) |
 * | diagramKeyComponentsOnly | boolean | true | Only show components with archRole in diagrams |
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

import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  mermaid,
  document,
} from '../schema.js';
import { getDisplayName, getStatusEmoji } from '../utils.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import {
  type BaseCodecOptions,
  type DocumentCodec,
  DEFAULT_BASE_OPTIONS,
  mergeOptions,
  createDecodeOnlyCodec,
} from './types/base.js';
import { sanitizeNodeId, EDGE_STYLES } from './diagram-utils.js';

// ═══════════════════════════════════════════════════════════════════════════
// Architecture Codec Options (co-located with codec)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Diagram type for architecture visualization
 * - component: System overview with bounded context subgraphs
 * - layered: Components organized by architectural layer
 */
export type ArchitectureDiagramType = 'component' | 'layered';

/**
 * Options for ArchitectureDocumentCodec
 */
export interface ArchitectureCodecOptions extends BaseCodecOptions {
  /** Type of diagram to generate (default: "component") */
  diagramType?: ArchitectureDiagramType;

  /** Include component inventory table (default: true) */
  includeInventory?: boolean;

  /** Include legend for arrow styles (default: true) */
  includeLegend?: boolean;

  /** Filter to specific contexts (default: all contexts) */
  filterContexts?: string[];

  /**
   * Only include patterns with an explicit archRole in diagrams (default: true).
   * Patterns without a role (barrel exports, type-only modules, ADRs, test features)
   * add noise to diagrams without conveying architectural significance.
   * The component inventory table always shows all patterns regardless.
   */
  diagramKeyComponentsOnly?: boolean;
}

/**
 * Default options for ArchitectureDocumentCodec
 */
export const DEFAULT_ARCHITECTURE_OPTIONS: Required<ArchitectureCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  diagramType: 'component',
  includeInventory: true,
  includeLegend: true,
  filterContexts: [],
  diagramKeyComponentsOnly: true,
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
export function createArchitectureCodec(options?: ArchitectureCodecOptions): DocumentCodec {
  const opts = mergeOptions(DEFAULT_ARCHITECTURE_OPTIONS, options);

  return createDecodeOnlyCodec(({ dataset }) => buildArchitectureDocument(dataset, opts));
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

export const codecMeta = {
  type: 'architecture',
  outputPath: 'ARCHITECTURE.md',
  description: 'Architecture diagrams (component and layered views)',
  factory: createArchitectureCodec,
  defaultInstance: ArchitectureDocumentCodec,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the architecture document from dataset
 */
function buildArchitectureDocument(
  dataset: MasterDataset,
  options: Required<ArchitectureCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];
  const archIndex = dataset.archIndex;

  // Check if we have any architecture metadata
  if (!archIndex || archIndex.all.length === 0) {
    return document('Architecture', [
      heading(2, 'No Architecture Data'),
      paragraph(
        'No patterns with architecture annotations found. ' +
          'Add `@architect-arch-role`, `@architect-arch-context`, or ' +
          '`@architect-arch-layer` tags to source files to generate architecture diagrams.'
      ),
    ]);
  }

  // Apply context filter if specified
  const filteredIndex = applyContextFilter(archIndex, options.filterContexts);

  // 2. Filter for diagram: only key components (with archRole) if enabled
  const diagramIndex = options.diagramKeyComponentsOnly
    ? filterToKeyComponents(filteredIndex)
    : filteredIndex;

  // 1. Summary section
  sections.push(
    ...buildSummarySection(diagramIndex, filteredIndex.all.length, options.diagramKeyComponentsOnly)
  );

  // 3. Main diagram based on type
  if (options.diagramType === 'component') {
    sections.push(...buildComponentDiagram(diagramIndex, dataset));
  } else {
    sections.push(...buildLayeredDiagram(diagramIndex, dataset));
  }

  // 4. Legend (if enabled)
  if (options.includeLegend) {
    sections.push(...buildLegendSection());
  }

  // 5. Component inventory (if enabled) — uses full filteredIndex, not diagramIndex
  if (options.includeInventory) {
    sections.push(...buildInventorySection(filteredIndex));
  }

  return document('Architecture', sections, {
    purpose: 'Auto-generated architecture diagram from source annotations',
    detailLevel:
      options.diagramType === 'component'
        ? 'Component diagram with bounded context subgraphs'
        : 'Layered architecture diagram',
  });
}

/**
 * Apply context filter to architecture index
 */
function applyContextFilter(
  archIndex: NonNullable<MasterDataset['archIndex']>,
  filterContexts: string[]
): NonNullable<MasterDataset['archIndex']> {
  if (filterContexts.length === 0) {
    return archIndex;
  }

  // Filter byContext to only include specified contexts
  const filteredByContext: Record<string, ExtractedPattern[]> = {};
  for (const ctx of filterContexts) {
    if (archIndex.byContext[ctx]) {
      filteredByContext[ctx] = archIndex.byContext[ctx];
    }
  }

  // Filter all to only include patterns in specified contexts
  const filteredAll = archIndex.all.filter(
    (p) => p.archContext !== undefined && filterContexts.includes(p.archContext)
  );

  // Filter byRole to only include patterns in specified contexts
  const filteredByRole: Record<string, ExtractedPattern[]> = {};
  for (const [role, patterns] of Object.entries(archIndex.byRole)) {
    const filtered = patterns.filter(
      (p) => p.archContext !== undefined && filterContexts.includes(p.archContext)
    );
    if (filtered.length > 0) {
      filteredByRole[role] = filtered;
    }
  }

  // Filter byLayer similarly
  const filteredByLayer: Record<string, ExtractedPattern[]> = {};
  for (const [layer, patterns] of Object.entries(archIndex.byLayer)) {
    const filtered = patterns.filter(
      (p) => p.archContext !== undefined && filterContexts.includes(p.archContext)
    );
    if (filtered.length > 0) {
      filteredByLayer[layer] = filtered;
    }
  }

  // Filter byView similarly
  const filteredByView: Record<string, ExtractedPattern[]> = {};
  for (const [view, patterns] of Object.entries(archIndex.byView)) {
    const filtered = patterns.filter(
      (p) => p.archContext !== undefined && filterContexts.includes(p.archContext)
    );
    if (filtered.length > 0) {
      filteredByView[view] = filtered;
    }
  }

  return {
    byContext: filteredByContext,
    byRole: filteredByRole,
    byLayer: filteredByLayer,
    byView: filteredByView,
    all: filteredAll,
  };
}

/**
 * Filter architecture index to only include patterns with an explicit archRole.
 * Patterns without a role (barrel exports, type modules, ADRs, test features)
 * are excluded from diagrams but remain in the component inventory.
 */
function filterToKeyComponents(
  archIndex: NonNullable<MasterDataset['archIndex']>
): NonNullable<MasterDataset['archIndex']> {
  const hasRole = (p: ExtractedPattern): boolean => p.archRole !== undefined;

  const filteredAll = archIndex.all.filter(hasRole);

  const filteredByContext: Record<string, ExtractedPattern[]> = {};
  for (const [ctx, patterns] of Object.entries(archIndex.byContext)) {
    const filtered = patterns.filter(hasRole);
    if (filtered.length > 0) {
      filteredByContext[ctx] = filtered;
    }
  }

  const filteredByRole: Record<string, ExtractedPattern[]> = {};
  for (const [role, patterns] of Object.entries(archIndex.byRole)) {
    const filtered = patterns.filter(hasRole);
    if (filtered.length > 0) {
      filteredByRole[role] = filtered;
    }
  }

  const filteredByLayer: Record<string, ExtractedPattern[]> = {};
  for (const [layer, patterns] of Object.entries(archIndex.byLayer)) {
    const filtered = patterns.filter(hasRole);
    if (filtered.length > 0) {
      filteredByLayer[layer] = filtered;
    }
  }

  const filteredByView: Record<string, ExtractedPattern[]> = {};
  for (const [view, patterns] of Object.entries(archIndex.byView)) {
    const filtered = patterns.filter(hasRole);
    if (filtered.length > 0) {
      filteredByView[view] = filtered;
    }
  }

  return {
    byContext: filteredByContext,
    byRole: filteredByRole,
    byLayer: filteredByLayer,
    byView: filteredByView,
    all: filteredAll,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build summary section with component counts
 */
function buildSummarySection(
  diagramIndex: NonNullable<MasterDataset['archIndex']>,
  totalAnnotated: number,
  keyComponentsOnly: boolean
): SectionBlock[] {
  const contextCount = Object.keys(diagramIndex.byContext).length;
  const roleCount = Object.keys(diagramIndex.byRole).length;
  const diagramComponents = diagramIndex.all.length;

  const rows: string[][] = [
    ['Diagram Components', String(diagramComponents)],
    ['Bounded Contexts', String(contextCount)],
    ['Component Roles', String(roleCount)],
  ];

  if (totalAnnotated !== diagramComponents) {
    rows.push(['Total Annotated', String(totalAnnotated)]);
  }

  const description = keyComponentsOnly
    ? `This diagram shows ${diagramComponents} key components with explicit architectural roles ` +
      `across ${contextCount} bounded context${contextCount !== 1 ? 's' : ''}.`
    : `This diagram shows all ${diagramComponents} annotated components ` +
      `across ${contextCount} bounded context${contextCount !== 1 ? 's' : ''}.`;

  return [
    heading(2, 'Overview'),
    paragraph(description),
    table(['Metric', 'Count'], rows),
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
function buildComponentDiagram(
  archIndex: NonNullable<MasterDataset['archIndex']>,
  dataset: MasterDataset
): SectionBlock[] {
  const lines: string[] = ['graph TB'];
  const nodeIds = new Map<string, string>(); // pattern name → node ID

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
    if (patterns.length === 0) continue;

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
    if (!sourceId) continue;

    const rel = relationships[name];
    if (!rel) continue;

    // uses relationships (solid arrow) - only to other arch components
    for (const target of rel.uses) {
      const targetId = nodeIds.get(target);
      if (targetId) {
        lines.push(`    ${sourceId} ${EDGE_STYLES.uses} ${targetId}`);
      }
    }

    // dependsOn relationships (dashed arrow)
    for (const target of rel.dependsOn) {
      const targetId = nodeIds.get(target);
      if (targetId) {
        lines.push(`    ${sourceId} ${EDGE_STYLES.dependsOn} ${targetId}`);
      }
    }

    // implements relationships (dotted arrow)
    for (const target of rel.implementsPatterns) {
      const targetId = nodeIds.get(target);
      if (targetId) {
        lines.push(`    ${sourceId} ${EDGE_STYLES.implementsPatterns} ${targetId}`);
      }
    }

    // extends relationships (solid open arrow)
    if (rel.extendsPattern) {
      const targetId = nodeIds.get(rel.extendsPattern);
      if (targetId) {
        lines.push(`    ${sourceId} ${EDGE_STYLES.extendsPattern} ${targetId}`);
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
function buildLayeredDiagram(
  archIndex: NonNullable<MasterDataset['archIndex']>,
  dataset: MasterDataset
): SectionBlock[] {
  const lines: string[] = ['graph TB'];
  const nodeIds = new Map<string, string>();

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
    if (patterns.length === 0) continue;

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
    if (!sourceId) continue;

    const rel = relationships[name];
    if (!rel) continue;

    for (const target of rel.uses) {
      const targetId = nodeIds.get(target);
      if (targetId) {
        lines.push(`    ${sourceId} ${EDGE_STYLES.uses} ${targetId}`);
      }
    }

    for (const target of rel.dependsOn) {
      const targetId = nodeIds.get(target);
      if (targetId) {
        lines.push(`    ${sourceId} ${EDGE_STYLES.dependsOn} ${targetId}`);
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
function buildLegendSection(): SectionBlock[] {
  return [
    heading(2, 'Legend'),
    table(
      ['Arrow Style', 'Relationship', 'Description'],
      [
        ['`-->`', 'uses', 'Direct dependency (solid arrow)'],
        ['`-.->` ', 'depends-on', 'Weak dependency (dashed arrow)'],
        ['`..->` ', 'implements', 'Realization relationship (dotted arrow)'],
        ['`-->>` ', 'extends', 'Generalization relationship (open arrow)'],
      ]
    ),
    separator(),
  ];
}

/**
 * Build component inventory table
 */
function buildInventorySection(archIndex: NonNullable<MasterDataset['archIndex']>): SectionBlock[] {
  const rows: string[][] = [];

  // Sort patterns by context, then by role, then by name
  const sorted = [...archIndex.all].sort((a, b) => {
    const ctxA = a.archContext ?? 'zzz'; // No context sorts last
    const ctxB = b.archContext ?? 'zzz';
    if (ctxA !== ctxB) return ctxA.localeCompare(ctxB);

    const roleA = a.archRole ?? '';
    const roleB = b.archRole ?? '';
    if (roleA !== roleB) return roleA.localeCompare(roleB);

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
 * Format context name for subgraph label
 * E.g., "orders" → "Orders BC"
 */
function formatContextLabel(context: string): string {
  const capitalized = context.charAt(0).toUpperCase() + context.slice(1);
  return `${capitalized} BC`;
}

/**
 * Format layer name for subgraph label
 * E.g., "domain" → "Domain Layer"
 */
function formatLayerLabel(layer: string): string {
  const capitalized = layer.charAt(0).toUpperCase() + layer.slice(1);
  return `${capitalized} Layer`;
}
