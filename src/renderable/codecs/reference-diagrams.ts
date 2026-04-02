/**
 * @architect
 * @architect-pattern ReferenceCodec
 * @architect-status completed
 *
 * ## Reference Codec — Diagram Infrastructure
 *
 * All diagram builder functions: collectScopePatterns, collectNeighborPatterns,
 * prepareDiagramContext, and the five diagram type builders (flowchart, sequence,
 * state, C4, class). Also contains the three hardcoded domain diagrams
 * (fsm-lifecycle, generation-pipeline, pattern-graph-views) and the
 * public buildScopedDiagram dispatcher.
 */

import { type SectionBlock, heading, paragraph, separator, mermaid } from '../schema.js';
import type { DiagramScope } from './reference-types.js';
import type { ExtractedPattern } from '../../validation-schemas/extracted-pattern.js';
import type { PatternGraph } from '../../validation-schemas/pattern-graph.js';
import {
  sanitizeNodeId,
  EDGE_STYLES,
  EDGE_LABELS,
  SEQUENCE_ARROWS,
  formatNodeDeclaration,
} from './diagram-utils.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import { VALID_TRANSITIONS } from '../../validation/fsm/transitions.js';
import { PROTECTION_LEVELS, type ProtectionLevel } from '../../validation/fsm/states.js';
import type { ProcessStatusValue } from '../../taxonomy/index.js';

// ============================================================================
// Scope Pattern Collection
// ============================================================================

/**
 * Collect patterns matching a DiagramScope filter.
 */
export function collectScopePatterns(
  dataset: PatternGraph,
  scope: DiagramScope
): ExtractedPattern[] {
  const nameSet = new Set(scope.patterns ?? []);
  const contextSet = new Set(scope.archContext ?? []);
  const viewSet = new Set(scope.include ?? []);
  const layerSet = new Set(scope.archLayer ?? []);

  return dataset.patterns.filter((p) => {
    const name = getPatternName(p);
    if (nameSet.has(name)) return true;
    if (p.archContext !== undefined && contextSet.has(p.archContext)) return true;
    if (p.include?.some((v) => viewSet.has(v)) === true) return true;
    if (p.archLayer !== undefined && layerSet.has(p.archLayer)) return true;
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
export function collectNeighborPatterns(
  dataset: PatternGraph,
  scopeNames: ReadonlySet<string>
): ExtractedPattern[] {
  const neighborNames = new Set<string>();
  const relationships = dataset.relationshipIndex ?? {};

  for (const name of scopeNames) {
    const rel = relationships[name];
    if (!rel) continue;

    for (const target of rel.uses) {
      if (!scopeNames.has(target)) neighborNames.add(target);
    }
    for (const target of rel.dependsOn) {
      if (!scopeNames.has(target)) neighborNames.add(target);
    }
    for (const target of rel.implementsPatterns) {
      if (!scopeNames.has(target)) neighborNames.add(target);
    }
    if (rel.extendsPattern !== undefined && !scopeNames.has(rel.extendsPattern)) {
      neighborNames.add(rel.extendsPattern);
    }
  }

  if (neighborNames.size === 0) return [];

  return dataset.patterns.filter((p) => neighborNames.has(getPatternName(p)));
}

// ============================================================================
// Diagram Context & Strategy Builders (DD-6)
// ============================================================================

/** Pre-computed diagram context shared by all diagram type builders */
interface DiagramContext {
  readonly scopePatterns: readonly ExtractedPattern[];
  readonly neighborPatterns: readonly ExtractedPattern[];
  readonly scopeNames: ReadonlySet<string>;
  readonly neighborNames: ReadonlySet<string>;
  readonly nodeIds: ReadonlyMap<string, string>;
  readonly relationships: Readonly<
    Record<
      string,
      {
        uses: readonly string[];
        dependsOn: readonly string[];
        implementsPatterns: readonly string[];
        extendsPattern?: string | undefined;
      }
    >
  >;
  readonly allNames: ReadonlySet<string>;
}

/** Extract shared setup from scope + dataset into a reusable context */
function prepareDiagramContext(
  dataset: PatternGraph,
  scope: DiagramScope
): DiagramContext | undefined {
  const scopePatterns = collectScopePatterns(dataset, scope);
  if (scopePatterns.length === 0) return undefined;

  const nodeIds = new Map<string, string>();
  const scopeNames = new Set<string>();

  for (const pattern of scopePatterns) {
    const name = getPatternName(pattern);
    scopeNames.add(name);
    nodeIds.set(name, sanitizeNodeId(name));
  }

  const neighborPatterns = collectNeighborPatterns(dataset, scopeNames);
  const neighborNames = new Set<string>();
  for (const pattern of neighborPatterns) {
    const name = getPatternName(pattern);
    neighborNames.add(name);
    nodeIds.set(name, sanitizeNodeId(name));
  }

  const relationships = dataset.relationshipIndex ?? {};
  const allNames = new Set([...scopeNames, ...neighborNames]);

  // Prune orphan scope patterns — nodes with zero edges in the diagram context.
  // A pattern participates if it is the source or target of any edge within allNames.
  const connected = new Set<string>();
  for (const name of allNames) {
    const rel = relationships[name];
    if (!rel) continue;
    const edgeArrays = [rel.uses, rel.dependsOn, rel.implementsPatterns];
    for (const targets of edgeArrays) {
      for (const target of targets) {
        if (allNames.has(target)) {
          connected.add(name);
          connected.add(target);
        }
      }
    }
    if (rel.extendsPattern !== undefined && allNames.has(rel.extendsPattern)) {
      connected.add(name);
      connected.add(rel.extendsPattern);
    }
  }

  // Only prune orphan scope patterns when the diagram has SOME connected
  // patterns. If no edges exist at all, the diagram is a component listing
  // and all scope patterns should be preserved.
  if (connected.size > 0) {
    const prunedScopePatterns = scopePatterns.filter((p) => connected.has(getPatternName(p)));
    if (prunedScopePatterns.length === 0) {
      return undefined;
    }

    const prunedScopeNames = new Set<string>();
    for (const p of prunedScopePatterns) {
      prunedScopeNames.add(getPatternName(p));
    }

    // Rebuild nodeIds — remove pruned entries
    const prunedNodeIds = new Map<string, string>();
    for (const name of [...prunedScopeNames, ...neighborNames]) {
      const id = nodeIds.get(name);
      if (id !== undefined) prunedNodeIds.set(name, id);
    }

    const prunedAllNames = new Set([...prunedScopeNames, ...neighborNames]);

    return {
      scopePatterns: prunedScopePatterns,
      neighborPatterns,
      scopeNames: prunedScopeNames,
      neighborNames,
      nodeIds: prunedNodeIds,
      relationships,
      allNames: prunedAllNames,
    };
  }

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
function emitFlowchartEdges(ctx: DiagramContext, showLabels: boolean): string[] {
  const lines: string[] = [];
  const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'] as const;

  for (const sourceName of ctx.allNames) {
    const sourceId = ctx.nodeIds.get(sourceName);
    if (sourceId === undefined) continue;

    const rel = ctx.relationships[sourceName];
    if (!rel) continue;

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
function buildFlowchartDiagram(ctx: DiagramContext, scope: DiagramScope): string[] {
  const direction = scope.direction ?? 'TB';
  const showLabels = scope.showEdgeLabels !== false;
  const lines: string[] = [`graph ${direction}`];

  // Group scope patterns by archContext for subgraphs
  const byContext = new Map<string, ExtractedPattern[]>();
  const noContext: ExtractedPattern[] = [];
  for (const pattern of ctx.scopePatterns) {
    if (pattern.archContext !== undefined) {
      const group = byContext.get(pattern.archContext) ?? [];
      group.push(pattern);
      byContext.set(pattern.archContext, group);
    } else {
      noContext.push(pattern);
    }
  }

  // Emit context subgraphs
  for (const [context, patterns] of [...byContext.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
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
function buildSequenceDiagram(ctx: DiagramContext): string[] {
  const lines: string[] = ['sequenceDiagram'];
  const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'] as const;

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
    if (!rel) continue;

    for (const type of edgeTypes) {
      for (const target of rel[type]) {
        if (ctx.allNames.has(target)) {
          const arrow = SEQUENCE_ARROWS[type];
          lines.push(
            `    ${sanitizeNodeId(sourceName)} ${arrow} ${sanitizeNodeId(target)}: ${EDGE_LABELS[type]}`
          );
        }
      }
    }

    if (rel.extendsPattern !== undefined && ctx.allNames.has(rel.extendsPattern)) {
      const arrow = SEQUENCE_ARROWS.extendsPattern;
      lines.push(
        `    ${sanitizeNodeId(sourceName)} ${arrow} ${sanitizeNodeId(rel.extendsPattern)}: ${EDGE_LABELS.extendsPattern}`
      );
    }
  }

  return lines;
}

/** Build a Mermaid state diagram with transitions and pseudo-states (DD-3) */
function buildStateDiagram(ctx: DiagramContext, scope: DiagramScope): string[] {
  const showLabels = scope.showEdgeLabels !== false;
  const lines: string[] = ['stateDiagram-v2'];

  // Track incoming/outgoing dependsOn edges for pseudo-states
  const hasIncoming = new Set<string>();
  const hasOutgoing = new Set<string>();

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
    if (!rel) continue;

    for (const target of rel.dependsOn) {
      if (!ctx.allNames.has(target)) continue;
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

/** Presentation labels for FSM transitions (codec concern, not FSM domain) */
const FSM_TRANSITION_LABELS: Readonly<
  Partial<Record<ProcessStatusValue, Partial<Record<ProcessStatusValue, string>>>>
> = {
  roadmap: { active: 'Start work', deferred: 'Postpone', roadmap: 'Stay in planning' },
  active: { completed: 'All deliverables done', roadmap: 'Blocked / regressed' },
  deferred: { roadmap: 'Resume planning' },
};

/** Display names for protection levels in diagram notes */
const PROTECTION_DISPLAY: Readonly<Record<ProtectionLevel, string>> = {
  none: 'none',
  scope: 'scope-locked',
  hard: 'hard-locked',
};

/** Build FSM lifecycle state diagram from VALID_TRANSITIONS and PROTECTION_LEVELS */
function buildFsmLifecycleStateDiagram(): string[] {
  const lines: string[] = ['stateDiagram-v2'];
  const states = Object.keys(VALID_TRANSITIONS);

  // Entry point: first state is initial
  const initialState = states[0];
  if (initialState !== undefined) {
    lines.push(`    [*] --> ${initialState}`);
  }

  // Transitions derived from the FSM transition matrix
  for (const [from, targets] of Object.entries(VALID_TRANSITIONS)) {
    if (targets.length === 0) {
      // Terminal state
      lines.push(`    ${from} --> [*]`);
    } else {
      for (const to of targets) {
        const label = FSM_TRANSITION_LABELS[from as ProcessStatusValue]?.[to];
        const suffix = label !== undefined ? ` : ${label}` : '';
        lines.push(`    ${from} --> ${to}${suffix}`);
      }
    }
  }

  // Protection level notes derived from PROTECTION_LEVELS
  for (const [state, level] of Object.entries(PROTECTION_LEVELS)) {
    const display = PROTECTION_DISPLAY[level];
    lines.push(`    note right of ${state}`);
    lines.push(`        Protection: ${display}`);
    lines.push('    end note');
  }

  return lines;
}

/** Build generation pipeline sequence diagram from hardcoded domain knowledge */
function buildGenerationPipelineSequenceDiagram(): string[] {
  return [
    'sequenceDiagram',
    '    participant CLI',
    '    participant Orchestrator',
    '    participant Scanner',
    '    participant Extractor',
    '    participant Transformer',
    '    participant Codec',
    '    participant Renderer',
    '    CLI ->> Orchestrator: generate(config)',
    '    Orchestrator ->> Scanner: scanPatterns(globs)',
    '    Scanner -->> Orchestrator: TypeScript ASTs',
    '    Orchestrator ->> Scanner: scanGherkinFiles(globs)',
    '    Scanner -->> Orchestrator: Gherkin documents',
    '    Orchestrator ->> Extractor: extractPatterns(files)',
    '    Extractor -->> Orchestrator: ExtractedPattern[]',
    '    Orchestrator ->> Extractor: extractFromGherkin(docs)',
    '    Extractor -->> Orchestrator: ExtractedPattern[]',
    '    Orchestrator ->> Orchestrator: mergePatterns(ts, gherkin)',
    '    Orchestrator ->> Transformer: transformToPatternGraph(patterns)',
    '    Transformer -->> Orchestrator: PatternGraph',
    '    Orchestrator ->> Codec: codec.decode(dataset)',
    '    Codec -->> Orchestrator: RenderableDocument',
    '    Orchestrator ->> Renderer: render(document)',
    '    Renderer -->> Orchestrator: markdown string',
  ];
}

/** Build PatternGraph fan-out diagram from hardcoded domain knowledge */
function buildPatternGraphViewsDiagram(): string[] {
  return [
    'graph TB',
    '    MD[PatternGraph]',
    '    MD --> byStatus["byStatus<br/>(completed / active / planned)"]',
    '    MD --> byPhase["byPhase<br/>(sorted, with counts)"]',
    '    MD --> byQuarter["byQuarter<br/>(keyed by Q-YYYY)"]',
    '    MD --> byCategory["byCategory<br/>(keyed by category name)"]',
    '    MD --> bySourceType["bySourceType<br/>(typescript / gherkin / roadmap / prd)"]',
    '    MD --> counts["counts<br/>(aggregate statistics)"]',
    '    MD --> RI["relationshipIndex?<br/>(forward + reverse lookups)"]',
    '    MD --> AI["archIndex?<br/>(role / context / layer / view)"]',
  ];
}

/** Build a Mermaid C4 context diagram with system boundaries */
function buildC4Diagram(ctx: DiagramContext, scope: DiagramScope): string[] {
  const showLabels = scope.showEdgeLabels !== false;
  const lines: string[] = ['C4Context'];

  if (scope.title !== undefined) {
    lines.push(`    title ${scope.title}`);
  }

  // Group scope patterns by archContext for system boundaries
  const byContext = new Map<string, ExtractedPattern[]>();
  const noContext: ExtractedPattern[] = [];
  for (const pattern of ctx.scopePatterns) {
    if (pattern.archContext !== undefined) {
      const group = byContext.get(pattern.archContext) ?? [];
      group.push(pattern);
      byContext.set(pattern.archContext, group);
    } else {
      noContext.push(pattern);
    }
  }

  // Emit system boundaries
  for (const [context, patterns] of [...byContext.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
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
  const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'] as const;
  for (const sourceName of ctx.allNames) {
    const sourceId = ctx.nodeIds.get(sourceName);
    if (sourceId === undefined) continue;

    const rel = ctx.relationships[sourceName];
    if (!rel) continue;

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
function buildClassDiagram(ctx: DiagramContext): string[] {
  const lines: string[] = ['classDiagram'];
  const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'] as const;

  // Class arrow styles per relationship type
  const classArrows: Record<string, string> = {
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
    if (sourceId === undefined) continue;

    const rel = ctx.relationships[sourceName];
    if (!rel) continue;

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

// ============================================================================
// Public Dispatcher
// ============================================================================

/**
 * Build a scoped relationship diagram from DiagramScope config.
 *
 * Dispatches to type-specific builders based on scope.diagramType (DD-6).
 * Scope patterns are grouped by archContext in subgraphs (flowchart) or
 * rendered as participants/states (sequence/state diagrams).
 */
export function buildScopedDiagram(dataset: PatternGraph, scope: DiagramScope): SectionBlock[] {
  const title = scope.title ?? 'Component Overview';

  // Content source override: render hardcoded domain diagrams
  if (scope.source === 'fsm-lifecycle') {
    return [
      heading(2, title),
      paragraph('FSM lifecycle showing valid state transitions and protection levels:'),
      mermaid(buildFsmLifecycleStateDiagram().join('\n')),
      separator(),
    ];
  }
  if (scope.source === 'generation-pipeline') {
    return [
      heading(2, title),
      paragraph('Temporal flow of the documentation generation pipeline:'),
      mermaid(buildGenerationPipelineSequenceDiagram().join('\n')),
      separator(),
    ];
  }
  if (scope.source === 'pattern-graph-views') {
    return [
      heading(2, title),
      paragraph('Pre-computed view fan-out from PatternGraph (single-pass transform):'),
      mermaid(buildPatternGraphViewsDiagram().join('\n')),
      separator(),
    ];
  }

  const ctx = prepareDiagramContext(dataset, scope);
  if (ctx === undefined) return [];

  let diagramLines: string[];
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
