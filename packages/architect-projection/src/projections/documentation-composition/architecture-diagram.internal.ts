/**
 * @architect-bounded-context:documentation-composition
 */
/**
 * Builds the architecture-diagram options schema and scope-filtered Mermaid
 * projection helpers.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import { slugify } from '@libar-dev/architect-core';
import { z } from 'zod';

import { heading, list, mermaid } from '../../blocks/schema.js';
import type { ProjectionContext } from '../../context/projection-context.js';
import { ProjectionError } from '../errors.js';
import type {
  ArchitectureDiagram,
  ArchitectureDiagramSection,
} from '../../fragments/documentation-composition/index.js';
import {
  ArchitectureDiagramScopeSchema,
  type ArchitectureDiagramScope,
} from '../../fragments/documentation-composition/supporting.js';
import { filterPatterns } from '../_shared/filter.js';
import { getPatternName, getRelationships } from '../_shared/pattern-helpers.internal.js';

import { hasText } from './documentation-composition-shared.internal.js';

interface NodeShape {
  readonly nodeId: string;
  readonly name: string;
  readonly label: string;
  readonly archContext?: string;
  readonly archLayer?: string;
  readonly role?: string;
  readonly packageLabel: string;
}

/**
 * A bucket of nodes rendered as one detail diagram. `key` is the stable group
 * id, `title` the detail-section heading, `mapLabel` the (short) label used for
 * this group's node in the context map, and `rank` orders the sections
 * (bounded-contexts, then role-fallback buckets, then source-area/package
 * buckets).
 */
interface DiagramGroup {
  readonly key: string;
  readonly title: string;
  readonly mapLabel: string;
  readonly rank: number;
  readonly nodes: NodeShape[];
}

interface EdgeShape {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  // Mermaid's `~~~` is an invisible layout link (stroke-width: 0) — use `-.-`
  // for the dotted "see-also" line called out in the diagram legend.
  readonly operator: '-->' | '-.->' | '==>' | '-.-';
}

const ARCHITECTURE_SCOPE_TITLES: Record<ArchitectureDiagramScope, string> = {
  component: 'Component View',
  layered: 'Layered View',
  'bounded-context': 'Bounded Context View',
  'product-area': 'Product Area View',
};

const ARCHITECTURE_MAP_TITLES: Record<ArchitectureDiagramScope, string> = {
  component: 'Context Map',
  layered: 'Layer Map',
  'bounded-context': 'Context Map',
  'product-area': 'Product-area Map',
};

export const ProjectArchitectureDiagramOptionsSchema = z
  .strictObject({
    scope: ArchitectureDiagramScopeSchema,
    scopeValue: z.string().optional(),
  })
  .readonly();

export type ProjectArchitectureDiagramOptions = z.infer<
  typeof ProjectArchitectureDiagramOptionsSchema
>;

export function buildArchitectureDiagram(
  context: ProjectionContext,
  options: ProjectArchitectureDiagramOptions,
): ArchitectureDiagram {
  const scope = options.scope;
  if ((scope === 'bounded-context' || scope === 'product-area') && !hasText(options.scopeValue)) {
    throw new ProjectionError(
      'MISSING_SCOPE_VALUE',
      `Architecture scope "${scope}" requires a scopeValue.`,
    );
  }

  const resolvedOptions = {
    ...options,
    scope,
  } satisfies Required<Pick<ProjectArchitectureDiagramOptions, 'scope'>> &
    Pick<ProjectArchitectureDiagramOptions, 'scopeValue'>;
  const nodes = collectArchitectureNodes(context, resolvedOptions);
  const patterns = nodes.map((node) => node.name);
  const edges = collectArchitectureEdges(context, nodes);

  return {
    kind: 'ArchitectureDiagram',
    scope,
    ...(hasText(options.scopeValue) ? { scopeValue: options.scopeValue.trim() } : {}),
    sections: buildArchitectureSections(nodes, edges, resolvedOptions),
    legend: [
      heading(3, 'Legend'),
      list([
        'Solid arrow = dependency',
        'Dashed arrow = usage',
        'Bold arrow = enablement',
        'Dotted line = reference',
      ]),
    ],
    patterns,
  };
}

function collectArchitectureNodes(
  context: ProjectionContext,
  options: ProjectArchitectureDiagramOptions,
): NodeShape[] {
  const filteredPatterns = filterPatterns(context.graph.patterns, context.projectionFilter);
  const scopedPatterns = filterPatternsForArchitecture(filteredPatterns, options);
  const withFallback = scopedPatterns.length > 0 ? [...scopedPatterns] : filteredPatterns;
  // For the component scope the architectural filter hard-excludes test
  // features and decision records, so its result is authoritative — INCLUDING
  // when it is empty. A decision-only or test-only component context must render
  // an empty component view, never fall back to `withFallback` (which still
  // holds the excluded patterns). Other scopes keep `withFallback` as-is.
  const selectedPatterns =
    options.scope === 'component'
      ? filterArchitecturallyInterestingPatterns(withFallback)
      : withFallback;
  const patterns = [...selectedPatterns].sort((left, right) =>
    getPatternName(left).localeCompare(getPatternName(right)),
  );

  const seenNodeIds = new Set<string>();
  return patterns.map((pattern, index) => {
    const name = getPatternName(pattern);
    const baseId = slugify(name).replace(/-/g, '_') || `node_${String(index + 1)}`;
    const nodeId = ensureUniqueNodeId(seenNodeIds, baseId);
    const role = hasText(pattern.role) ? pattern.role.trim() : undefined;
    const roleSuffix = role !== undefined ? `<br/>(${role})` : '';
    const archContext = hasText(pattern.boundedContext) ? pattern.boundedContext.trim() : undefined;
    const archLayer = hasText(pattern.adrLayer) ? pattern.adrLayer.trim() : undefined;
    const packageLabel = resolvePackageLabel(context, pattern.source.file);

    return {
      nodeId,
      name,
      label: `${name}${roleSuffix}`,
      ...(archContext !== undefined ? { archContext } : {}),
      ...(archLayer !== undefined ? { archLayer } : {}),
      ...(role !== undefined ? { role } : {}),
      packageLabel,
    } satisfies NodeShape;
  });
}

/**
 * Source-area label for a pattern — its workspace package's display name. Used
 * as the final grouping fallback when a pattern carries neither a
 * bounded-context nor a role (e.g. ADRs, working-state specs, un-classified
 * test features).
 *
 * Propagates the resolver's `UNMAPPED_PACKAGE` error rather than swallowing it:
 * `PackageResolver` is deliberately a hard-error-on-miss contract (no silent
 * `_other` bucket — actionable feedback over silent fallback). A file outside
 * the configured `packages` matchers is a real config gap; failing the
 * projection loud surfaces it instead of hiding it in a catch-all group.
 */
function resolvePackageLabel(context: ProjectionContext, sourceFile: string): string {
  return context.packageResolver(sourceFile).displayName;
}

/**
 * A test / executable-spec pattern is identified by a Gherkin feature under a
 * `tests/features/` tree (the canonical home of executable specs — see the
 * self-hosting source globs). These are the verification surface: they
 * `@architect-implements` production patterns and own invariants + scenarios,
 * but not the implementation classification a *component* view renders. A
 * component architecture view shows production components defined in source, so
 * test-feature patterns are excluded; their test→production traceability lives
 * in the traceability / requirements-executable docs.
 *
 * Keys on the source path, NOT on `implementsPatterns`: production sub-modules
 * legitimately carry `@architect-implements` to a barrel pattern (e.g.
 * `DeriveProcessState` → `ProcessGuardLinter`), so an implements edge alone does
 * not mark a test pattern. ADRs (under `architect/decisions/`) are excluded by
 * the separate `isDecisionRecordPattern` filter, not this one.
 */
function isTestFeaturePattern(pattern: ExtractedPattern): boolean {
  return /(?:^|\/)tests\/features\//u.test(pattern.source.file);
}

/**
 * A decision-record pattern is an ADR/PDR Gherkin feature under
 * `architect/decisions/`. These are durable architectural *decisions*, not
 * production components, so a *component* view omits them — they are covered by
 * the generated `decisions` doc (`docs-live/DECISIONS.md`). Mirrors
 * `isTestFeaturePattern`: keys on the source path (the canonical home of
 * decision records), not on classification tags. See DECISIONS D-16.
 */
function isDecisionRecordPattern(pattern: ExtractedPattern): boolean {
  return /(?:^|\/)architect\/decisions\//u.test(pattern.source.file);
}

function filterArchitecturallyInterestingPatterns(
  patterns: readonly ExtractedPattern[],
): readonly ExtractedPattern[] {
  // Hard exclusion — test features and decision records are never components,
  // even when they are the ONLY patterns in the input. This must NOT fall back
  // to the unfiltered set: a decision-only or test-only context yields an empty
  // component set (an empty view), not the excluded patterns re-included.
  const componentPatterns = patterns.filter(
    (pattern) => !isTestFeaturePattern(pattern) && !isDecisionRecordPattern(pattern),
  );

  // Graceful degradation applies ONLY to the classification filter: when
  // production components exist but none carry a classification tag, show them
  // ungrouped rather than nothing.
  const classified = componentPatterns.filter(
    (pattern) =>
      hasText(pattern.role) ||
      hasText(pattern.boundedContext) ||
      hasText(pattern.adrLayer) ||
      hasText(pattern.productArea),
  );

  return classified.length > 0 ? classified : componentPatterns;
}

function filterPatternsForArchitecture(
  patterns: readonly ExtractedPattern[],
  options: ProjectArchitectureDiagramOptions,
): readonly ExtractedPattern[] {
  const scopeValue = hasText(options.scopeValue)
    ? options.scopeValue.trim().toLowerCase()
    : undefined;

  switch (options.scope) {
    case 'component':
      return patterns;
    case 'layered':
      return patterns.filter((pattern) => hasText(pattern.adrLayer));
    case 'bounded-context':
      return patterns.filter(
        (pattern) =>
          hasText(pattern.boundedContext) &&
          (scopeValue === undefined || pattern.boundedContext.trim().toLowerCase() === scopeValue),
      );
    case 'product-area':
      return patterns.filter(
        (pattern) =>
          hasText(pattern.productArea) &&
          (scopeValue === undefined || pattern.productArea.trim().toLowerCase() === scopeValue),
      );
  }
}

function ensureUniqueNodeId(seenNodeIds: Set<string>, baseId: string): string {
  if (!seenNodeIds.has(baseId)) {
    seenNodeIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  while (seenNodeIds.has(`${baseId}_${String(suffix)}`)) {
    suffix += 1;
  }

  const nodeId = `${baseId}_${String(suffix)}`;
  seenNodeIds.add(nodeId);
  return nodeId;
}

function collectArchitectureEdges(
  context: ProjectionContext,
  nodes: readonly NodeShape[],
): EdgeShape[] {
  const nodeIdByName = new Map(nodes.map((node) => [node.name, node.nodeId] as const));
  const edgeMap = new Map<string, EdgeShape>();

  for (const node of nodes) {
    const relationships = getRelationships(context, node.name);
    if (relationships === undefined) {
      continue;
    }

    appendEdges(edgeMap, nodeIdByName, node.name, relationships.dependsOn, 'depends-on', '-->');
    appendEdges(edgeMap, nodeIdByName, node.name, relationships.uses, 'uses', '-.->');
    appendEdges(edgeMap, nodeIdByName, node.name, relationships.enables, 'enables', '==>');
    appendEdges(edgeMap, nodeIdByName, node.name, relationships.seeAlso, 'see-also', '-.-');
  }

  return [...edgeMap.values()].sort(
    (left, right) =>
      left.from.localeCompare(right.from) ||
      left.to.localeCompare(right.to) ||
      left.label.localeCompare(right.label),
  );
}

function appendEdges(
  edgeMap: Map<string, EdgeShape>,
  nodeIdByName: Map<string, string>,
  fromName: string,
  targets: readonly string[],
  label: string,
  operator: EdgeShape['operator'],
): void {
  const from = nodeIdByName.get(fromName);
  if (from === undefined) {
    return;
  }

  for (const targetName of targets) {
    const to = nodeIdByName.get(targetName);
    if (to === undefined) {
      continue;
    }

    const key = `${from}:${operator}:${label}:${to}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, { from, to, label, operator });
    }
  }
}

/**
 * Splits the architecture view into many bounded diagram sections: an optional
 * context map (inter-group edges, only when there are ≥2 groups) followed by one
 * detail diagram per group (intra-group edges). This is what keeps every Mermaid
 * block renderable — no single block ever contains all patterns.
 */
function buildArchitectureSections(
  nodes: readonly NodeShape[],
  edges: readonly EdgeShape[],
  options: ProjectArchitectureDiagramOptions,
): ArchitectureDiagramSection[] {
  if (nodes.length === 0) {
    return [
      {
        title: ARCHITECTURE_SCOPE_TITLES[options.scope],
        diagram: mermaid(buildEmptyMermaid(options)),
        patterns: [],
      },
    ];
  }

  const groups = buildGroups(nodes, options.scope);
  const groupKeyByNodeId = new Map<string, string>();
  for (const group of groups) {
    for (const node of group.nodes) {
      groupKeyByNodeId.set(node.nodeId, group.key);
    }
  }

  const sections: ArchitectureDiagramSection[] = [];

  if (groups.length >= 2) {
    const mapEdges = aggregateInterGroupEdges(edges, groupKeyByNodeId);
    sections.push({
      title: ARCHITECTURE_MAP_TITLES[options.scope],
      description:
        'Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). Usage, enablement, and see-also relationships appear in the per-group diagrams below.',
      diagram: mermaid(buildMapMermaid(groups, mapEdges)),
      patterns: [],
    });
  }

  for (const group of groups) {
    const groupNodeIds = new Set(group.nodes.map((node) => node.nodeId));
    const intraEdges = edges.filter(
      (edge) => groupNodeIds.has(edge.from) && groupNodeIds.has(edge.to),
    );
    const patterns = group.nodes.map((node) => node.name);
    sections.push({
      title: `${group.title} (${String(patterns.length)} ${patterns.length === 1 ? 'pattern' : 'patterns'})`,
      diagram: mermaid(buildGroupMermaid(group.nodes, intraEdges)),
      patterns,
    });
  }

  return sections;
}

function buildEmptyMermaid(options: ProjectArchitectureDiagramOptions): string {
  return [
    'graph TD',
    `  empty["No patterns found for ${ARCHITECTURE_SCOPE_TITLES[options.scope]}${hasText(options.scopeValue) ? `: ${options.scopeValue.trim()}` : ''}"]`,
  ].join('\n');
}

function buildGroupMermaid(nodes: readonly NodeShape[], edges: readonly EdgeShape[]): string {
  const lines = ['graph TD'];
  for (const node of nodes) {
    lines.push(`  ${node.nodeId}["${node.label}"]`);
  }
  for (const edge of edges) {
    pushEdgeLine(lines, edge);
  }
  return lines.join('\n');
}

function buildMapMermaid(
  groups: readonly DiagramGroup[],
  mapEdges: readonly { readonly from: string; readonly to: string }[],
): string {
  const lines = ['graph LR'];
  const seenNodeIds = new Set<string>();
  const idByGroupKey = new Map<string, string>();

  for (const group of groups) {
    const baseId = slugify(group.key).replace(/-/g, '_') || 'group';
    const id = ensureUniqueNodeId(seenNodeIds, baseId);
    idByGroupKey.set(group.key, id);
    lines.push(`  ${id}["${group.mapLabel} (${String(group.nodes.length)})"]`);
  }

  for (const edge of mapEdges) {
    const from = idByGroupKey.get(edge.from);
    const to = idByGroupKey.get(edge.to);
    if (from !== undefined && to !== undefined) {
      lines.push(`  ${from} --> ${to}`);
    }
  }

  return lines.join('\n');
}

function pushEdgeLine(lines: string[], edge: EdgeShape): void {
  if (edge.operator === '-.-') {
    lines.push(`  ${edge.from} -. ${edge.label} .- ${edge.to}`);
    return;
  }
  lines.push(`  ${edge.from} ${edge.operator}|${edge.label}| ${edge.to}`);
}

function aggregateInterGroupEdges(
  edges: readonly EdgeShape[],
  groupKeyByNodeId: Map<string, string>,
): { readonly from: string; readonly to: string }[] {
  const seen = new Set<string>();
  const out: { from: string; to: string }[] = [];

  for (const edge of edges) {
    // The context map collapses each ordered group pair to ONE solid arrow, and
    // the shared legend reads a solid arrow as a dependency. Only forward
    // structural edges (`depends-on`, `uses`) carry that "A relies on B"
    // direction. `enables` is a derived REVERSE edge (B enables A ⇔ A depends-on
    // / uses B): rendering it forward draws a contradictory back-arrow for a
    // relationship the forward edge already captures. `see-also` is
    // non-directional. Both stay in the per-group detail diagrams (with their
    // own operators) but are excluded here so the map's arrows are not misread.
    if (edge.label !== 'depends-on' && edge.label !== 'uses') {
      continue;
    }
    const from = groupKeyByNodeId.get(edge.from);
    const to = groupKeyByNodeId.get(edge.to);
    if (from === undefined || to === undefined || from === to) {
      continue;
    }
    const key = `${from} ${to}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({ from, to });
  }

  return out.sort(
    (left, right) => left.from.localeCompare(right.from) || left.to.localeCompare(right.to),
  );
}

function buildGroups(nodes: readonly NodeShape[], scope: ArchitectureDiagramScope): DiagramGroup[] {
  const grouped = new Map<
    string,
    { title: string; mapLabel: string; rank: number; nodes: NodeShape[] }
  >();

  for (const node of nodes) {
    const resolved = resolveNodeGroup(node, scope);
    const bucket = grouped.get(resolved.key) ?? {
      title: resolved.title,
      mapLabel: resolved.mapLabel,
      rank: resolved.rank,
      nodes: [],
    };
    bucket.nodes.push(node);
    grouped.set(resolved.key, bucket);
  }

  return [...grouped.entries()]
    .map(([key, value]) => ({
      key,
      title: value.title,
      mapLabel: value.mapLabel,
      rank: value.rank,
      nodes: [...value.nodes].sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => left.rank - right.rank || left.key.localeCompare(right.key));
}

interface ResolvedGroup {
  readonly key: string;
  readonly title: string;
  readonly mapLabel: string;
  readonly rank: number;
}

function resolveNodeGroup(node: NodeShape, scope: ArchitectureDiagramScope): ResolvedGroup {
  switch (scope) {
    case 'component':
      if (node.archContext !== undefined) {
        return {
          key: node.archContext,
          title: `Bounded context: ${node.archContext}`,
          mapLabel: node.archContext,
          rank: 0,
        };
      }
      if (node.role !== undefined) {
        return {
          key: `role:${node.role}`,
          title: `Uncontextualized · role: ${node.role}`,
          mapLabel: `role: ${node.role}`,
          rank: 1,
        };
      }
      // Final fallback: group by source area (workspace package). `packageLabel`
      // is always resolved — resolvePackageLabel throws on an unmapped file
      // rather than returning a sentinel — so there is no silent catch-all here.
      return {
        key: `pkg:${node.packageLabel}`,
        title: `Unclassified · ${node.packageLabel}`,
        mapLabel: node.packageLabel,
        rank: 2,
      };
    case 'layered':
      return node.archLayer !== undefined
        ? {
            key: node.archLayer,
            title: `Layer: ${node.archLayer}`,
            mapLabel: node.archLayer,
            rank: 0,
          }
        : { key: 'Unlayered', title: 'Unlayered', mapLabel: 'Unlayered', rank: 1 };
    case 'bounded-context':
      return node.archLayer !== undefined
        ? { key: node.archLayer, title: node.archLayer, mapLabel: node.archLayer, rank: 0 }
        : {
            key: 'Context Components',
            title: 'Context Components',
            mapLabel: 'Context Components',
            rank: 1,
          };
    case 'product-area':
      return node.archContext !== undefined
        ? { key: node.archContext, title: node.archContext, mapLabel: node.archContext, rank: 0 }
        : {
            key: 'Product Area Components',
            title: 'Product Area Components',
            mapLabel: 'Product Area Components',
            rank: 1,
          };
  }
}
