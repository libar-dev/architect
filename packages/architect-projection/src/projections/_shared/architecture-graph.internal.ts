/**
 * Shared architecture-graph construction — context-neutral helpers that turn the
 * PatternGraph into grouped Mermaid context maps.
 *
 * Lives in `_shared/` (not in documentation-composition) because two bounded
 * contexts consume it: `ArchitectureDiagramProjection` (the full architecture
 * doc) and `OverviewProjection` (the heads-up architecture glimpse on the
 * `overview` verb). Node collection, edge collection, grouping, inter-group edge
 * aggregation, and `graph LR` emission are identical for both; only the grouping
 * axis differs. The output is deterministic (every collection sorts), so the
 * `docs:all` determinism gate proves the architecture doc is byte-identical
 * after this code moved out of `architecture-diagram.internal.ts`.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import { slugify } from '@libar-dev/architect-core';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { ArchitectureDiagramScope } from '../../fragments/documentation-composition/supporting.js';

import { filterPatterns } from './filter.js';
import { getPatternName, getRelationships } from './pattern-helpers.internal.js';

/** Local copy of the trivial non-empty-string guard — keeps `_shared` from
 * importing back into the documentation-composition context. */
function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

export interface NodeShape {
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
export interface DiagramGroup {
  readonly key: string;
  readonly title: string;
  readonly mapLabel: string;
  readonly rank: number;
  readonly nodes: NodeShape[];
}

export interface EdgeShape {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  // Mermaid's `~~~` is an invisible layout link (stroke-width: 0) — use `-.-`
  // for the dotted "see-also" line called out in the diagram legend.
  readonly operator: '-->' | '-.->' | '==>' | '-.-';
}

/**
 * Grouping axis for the context map. The first four values are the
 * `ArchitectureDiagramScope` set the architecture doc uses; `'package'` is an
 * extra axis (group by workspace package) used by the `overview` glimpse and is
 * NOT a documentation scope.
 */
export type GroupingMode = ArchitectureDiagramScope | 'package';

/** Scope/scopeValue subset `collectArchitectureNodes` needs — structurally
 * compatible with the architecture projection's options. */
export interface ArchitectureGraphScopeOptions {
  readonly scope: ArchitectureDiagramScope;
  readonly scopeValue?: string | undefined;
}

export function collectArchitectureNodes(
  context: ProjectionContext,
  options: ArchitectureGraphScopeOptions,
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
    // Sourced role/name go into a Mermaid node label; escape them while keeping the
    // renderer-authored `<br/>` line break and `(…)` parens intact (ADR-009 raw-content seam).
    const roleSuffix = role !== undefined ? `<br/>(${escapeMermaidLabel(role)})` : '';
    const archContext = hasText(pattern.boundedContext) ? pattern.boundedContext.trim() : undefined;
    const archLayer = hasText(pattern.adrLayer) ? pattern.adrLayer.trim() : undefined;
    const packageLabel = resolvePackageLabel(context, pattern.source.file);

    return {
      nodeId,
      name,
      label: `${escapeMermaidLabel(name)}${roleSuffix}`,
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
 * A working-state pattern lives under `architect/` — the home of specs (ideas /
 * candidates / plan / design), decision records (`architect/decisions/`),
 * releases, stubs, and design reviews. None are production
 * components: they are plans and durable decisions, not source classified into
 * the architecture. A *component* view omits them all — decisions surface in the
 * generated `decisions` doc; specs/roadmap surface in roadmap/requirements docs.
 *
 * Keys on the source path (production code lives under `packages/<pkg>/src/`,
 * never the repo-root `architect/` working-state tree), not on classification
 * tags. Anchored at the START of the path — UNLIKE `isTestFeaturePattern`, which
 * uses `(?:^|\/)` because executable specs legitimately nest under
 * `packages/<pkg>/tests/features/`. Working state is root-only, so anchoring is
 * required to avoid matching the bin-only meta package `packages/architect/`
 * (and any other `…/architect/…` segment) as working state. Mirrors the config's
 * own pkg-content matcher (`startsWith('architect/')`).
 *
 * Generalizes the original decision-record exclusion (D-16, `architect/decisions/`)
 * to all working state (D-18): the doc-generation graph only ever held decision
 * records under `architect/`, so the generated architecture doc is unchanged,
 * while the read-surface graph (which also carries working-state specs so they
 * are queryable) no longer leaks a "Architect Package Content" working-state
 * bucket into the `overview` architecture glimpse.
 */
function isWorkingStatePattern(pattern: ExtractedPattern): boolean {
  return pattern.source.file.startsWith('architect/');
}

function filterArchitecturallyInterestingPatterns(
  patterns: readonly ExtractedPattern[],
): readonly ExtractedPattern[] {
  // Hard exclusion — test features and working-state records (specs, decisions,
  // releases) are never components, even when they are the ONLY patterns in the
  // input. This must NOT fall back to the unfiltered set: a working-state-only
  // or test-only context yields an empty component set (an empty view), not the
  // excluded patterns re-included.
  const componentPatterns = patterns.filter(
    (pattern) => !isTestFeaturePattern(pattern) && !isWorkingStatePattern(pattern),
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
  options: ArchitectureGraphScopeOptions,
): readonly ExtractedPattern[] {
  const scopeValue = hasText(options.scopeValue)
    ? options.scopeValue.trim().toLowerCase()
    : undefined;

  switch (options.scope) {
    case 'component':
    case 'package':
      // Package scope spans every pattern (like component); the package grouping is
      // applied later by buildGroups(nodes, 'package') when sections are assembled.
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

export function collectArchitectureEdges(
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

const MERMAID_LABEL_ENTITIES: Readonly<Record<string, string>> = {
  '"': '#34;',
  '#': '#35;',
  '<': '#60;',
  '>': '#62;',
  '[': '#91;',
  ']': '#93;',
};

/**
 * Neutralize SOURCED text destined for a Mermaid node label (`id["…"]`). Mermaid renders
 * quoted-string labels, so a sourced `"` would break out of the node, `<…>` could inject
 * markup, and `#…;` could be read as an entity code. Encode those via numeric Mermaid
 * entity codes and flatten newlines. No-op for identifier-shaped labels, so the determinism
 * gate stays byte-identical for current data.
 *
 * Apply ONLY to sourced label components — renderer-authored markup (e.g. `<br/>`, the
 * `(role)` parens) must be added AROUND the escaped value, never passed through here.
 */
export function escapeMermaidLabel(label: string): string {
  return label
    .replace(/[\r\n]+/g, ' ')
    .replace(/["#<>[\]]/g, (char) => MERMAID_LABEL_ENTITIES[char] ?? char);
}

export function buildMapMermaid(
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
    lines.push(`  ${id}["${escapeMermaidLabel(group.mapLabel)} (${String(group.nodes.length)})"]`);
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

export function aggregateInterGroupEdges(
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
    // non-directional. All three are excluded from the map so its arrows are not
    // misread; the per-group detail diagrams render forward dependencies plus
    // `see-also` only and likewise drop the derived `enables` (D-19, applied by
    // `normalizeDetailEdges` in `documentation-composition/architecture-diagram.internal.ts`).
    if (edge.label !== 'depends-on' && edge.label !== 'uses') {
      continue;
    }
    const from = groupKeyByNodeId.get(edge.from);
    const to = groupKeyByNodeId.get(edge.to);
    if (from === undefined || to === undefined || from === to) {
      continue;
    }
    const key = `${from} ${to}`;
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

export function buildGroups(nodes: readonly NodeShape[], mode: GroupingMode): DiagramGroup[] {
  const grouped = new Map<
    string,
    { title: string; mapLabel: string; rank: number; nodes: NodeShape[] }
  >();

  for (const node of nodes) {
    const resolved = resolveNodeGroup(node, mode);
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

function resolveNodeGroup(node: NodeShape, mode: GroupingMode): ResolvedGroup {
  switch (mode) {
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
    case 'package':
      // Primary axis: every node groups by its workspace package. Distinct from
      // the component-scope rank-2 `pkg:` fallback above (only reached when a
      // node has neither bounded-context nor role); the two are never resolved
      // under the same grouping mode.
      return {
        key: `pkg:${node.packageLabel}`,
        title: `Package: ${node.packageLabel}`,
        mapLabel: node.packageLabel,
        rank: 0,
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

/**
 * Collect the component-scope node + edge set once, for callers that need both
 * (e.g. the `overview` glimpse builds two charts — package + bounded-context —
 * off one collection). Applies the unconditional test-feature / decision-record
 * exclusion via the `'component'` scope, so node counts match the architecture
 * doc's context map.
 */
export function collectComponentGraph(context: ProjectionContext): {
  readonly nodes: readonly NodeShape[];
  readonly edges: readonly EdgeShape[];
} {
  const nodes = collectArchitectureNodes(context, { scope: 'component' });
  const edges = collectArchitectureEdges(context, nodes);
  return { nodes, edges };
}

/**
 * Assemble a `graph LR` context map for one grouping axis: group the nodes,
 * collapse cross-group `depends-on`/`uses` edges to one arrow per ordered pair,
 * and emit Mermaid. Mirrors the architecture doc's context-map section exactly,
 * so `assembleContextMap(nodes, edges, 'component')` reproduces the
 * `docs-live/ARCHITECTURE.md` Context Map.
 */
export function assembleContextMap(
  nodes: readonly NodeShape[],
  edges: readonly EdgeShape[],
  mode: GroupingMode,
): { readonly mermaid: string; readonly groupCount: number } {
  const groups = buildGroups(nodes, mode);
  const groupKeyByNodeId = new Map<string, string>();
  for (const group of groups) {
    for (const node of group.nodes) {
      groupKeyByNodeId.set(node.nodeId, group.key);
    }
  }
  const mapEdges = aggregateInterGroupEdges(edges, groupKeyByNodeId);
  return { mermaid: buildMapMermaid(groups, mapEdges), groupCount: groups.length };
}
