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
import type { ArchitectureDiagram } from '../../fragments/documentation-composition/index.js';
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

  return {
    kind: 'ArchitectureDiagram',
    scope,
    ...(hasText(options.scopeValue) ? { scopeValue: options.scopeValue.trim() } : {}),
    diagram: mermaid(
      buildArchitectureMermaid(nodes, collectArchitectureEdges(context, nodes), resolvedOptions),
    ),
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
  const selectedPatterns =
    options.scope === 'component'
      ? filterArchitecturallyInterestingPatterns(withFallback)
      : withFallback;
  const patterns = [...(selectedPatterns.length > 0 ? selectedPatterns : withFallback)].sort(
    (left, right) => getPatternName(left).localeCompare(getPatternName(right)),
  );

  const seenNodeIds = new Set<string>();
  return patterns.map((pattern, index) => {
    const name = getPatternName(pattern);
    const baseId = slugify(name).replace(/-/g, '_') || `node_${String(index + 1)}`;
    const nodeId = ensureUniqueNodeId(seenNodeIds, baseId);
    const roleSuffix = hasText(pattern.role) ? `<br/>(${pattern.role.trim()})` : '';
    const archContext = hasText(pattern.boundedContext) ? pattern.boundedContext.trim() : undefined;
    const archLayer = hasText(pattern.adrLayer) ? pattern.adrLayer.trim() : undefined;

    return {
      nodeId,
      name,
      label: `${name}${roleSuffix}`,
      ...(archContext !== undefined ? { archContext } : {}),
      ...(archLayer !== undefined ? { archLayer } : {}),
    } satisfies NodeShape;
  });
}

function filterArchitecturallyInterestingPatterns(
  patterns: readonly ExtractedPattern[],
): readonly ExtractedPattern[] {
  const filtered = patterns.filter(
    (pattern) =>
      hasText(pattern.role) ||
      hasText(pattern.boundedContext) ||
      hasText(pattern.adrLayer) ||
      hasText(pattern.productArea),
  );

  return filtered.length > 0 ? filtered : patterns;
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

function buildArchitectureMermaid(
  nodes: readonly NodeShape[],
  edges: readonly EdgeShape[],
  options: ProjectArchitectureDiagramOptions,
): string {
  if (nodes.length === 0) {
    return [
      'graph TD',
      `  empty["No patterns found for ${ARCHITECTURE_SCOPE_TITLES[options.scope]}${hasText(options.scopeValue) ? `: ${options.scopeValue.trim()}` : ''}"]`,
    ].join('\n');
  }

  const lines = ['graph TD'];
  const groups = groupNodesForScope(nodes, options.scope);

  for (const [groupName, groupNodes] of groups) {
    if (groupName === '') {
      for (const node of groupNodes) {
        lines.push(`  ${node.nodeId}["${node.label}"]`);
      }
      continue;
    }

    const groupId = slugify(groupName).replace(/-/g, '_') || 'group';
    lines.push(`  subgraph ${groupId}["${groupName}"]`);
    for (const node of groupNodes) {
      lines.push(`    ${node.nodeId}["${node.label}"]`);
    }
    lines.push('  end');
  }

  for (const edge of edges) {
    if (edge.operator === '-.-') {
      lines.push(`  ${edge.from} -. ${edge.label} .- ${edge.to}`);
      continue;
    }

    lines.push(`  ${edge.from} ${edge.operator}|${edge.label}| ${edge.to}`);
  }

  return lines.join('\n');
}

function groupNodesForScope(
  nodes: readonly NodeShape[],
  scope: ArchitectureDiagramScope,
): (readonly [string, NodeShape[]])[] {
  const grouped = new Map<string, NodeShape[]>();

  for (const node of nodes) {
    const groupName = resolveNodeGroup(node, scope);
    const bucket = grouped.get(groupName) ?? [];
    bucket.push(node);
    grouped.set(groupName, bucket);
  }

  return [...grouped.entries()].map(
    ([groupName, groupNodes]) =>
      [
        groupName,
        [...groupNodes].sort((left, right) => left.name.localeCompare(right.name)),
      ] as const,
  );
}

function resolveNodeGroup(node: NodeShape, scope: ArchitectureDiagramScope): string {
  switch (scope) {
    case 'component':
      return node.archContext ?? '';
    case 'layered':
      return node.archLayer ?? 'Unlayered';
    case 'bounded-context':
      return node.archLayer ?? 'Context Components';
    case 'product-area':
      return node.archContext ?? 'Product Area Components';
  }
}
