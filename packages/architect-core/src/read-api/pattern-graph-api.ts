/**
 * @architect
 * @architect-pattern PatternGraphApi
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:read-api
 * @architect-uses ExtractedPattern, PatternHelpers, PatternGraph
 *
 * ## PatternGraphApi - Read Model Facade
 *
 * `PatternGraphApi` is the read-model FACADE (`role:utility`):
 * `createPatternGraphAPI(dataset: PatternGraph)` wraps the assembled,
 * deep-frozen read model and exposes typed read methods over it. This is the
 * live read model ADR-006 (Single Read Model) names — the `PatternGraph` schema
 * is its contract, this facade is how every consumer (CLI, MCP, projection,
 * Studio) queries that single assembled value.
 */
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type {
  PatternGraph,
  PatternParseFailure,
  RelationshipEntry,
} from '../validation-schemas/pattern-graph.js';
import type { AcceptedStatusValue, ProcessStatusValue } from '../taxonomy/index.js';
import {
  validateTransition,
  getProtectionSummary,
  isValidTransition,
  getValidTransitionsFrom,
} from '../validation/fsm/index.js';
import {
  findPatternByName,
  findPatternParseFailure,
  getPatternName,
  getRelationships,
  resolveRoleDefinition,
} from './pattern-helpers.js';
import { listDecisionPatterns, resolveDecisionPattern } from './decision-resolution.js';
import { getRulesForPattern as resolveRulesForPattern } from './rule-aggregation.js';
import type { ProvenancedRule } from './rule-aggregation.js';
import type { Deliverable } from '../validation-schemas/dual-source.js';
import type {
  StatusCounts,
  StatusDistribution,
  PatternDependencies,
  PatternRelationships,
  TransitionCheck,
  ProtectionInfo,
  RoleInfo,
  DependencyContext,
  DependencyContextNode,
  BusinessRuleRef,
} from './types.js';

export interface PatternGraphAPI {
  getPatternsByNormalizedStatus(
    status: 'completed' | 'active' | 'planned' | 'candidate',
  ): ExtractedPattern[];
  getPatternsByStatus(status: AcceptedStatusValue): ExtractedPattern[];
  getStatusCounts(): StatusCounts;
  getStatusDistribution(): StatusDistribution;
  getCompletionPercentage(): number;
  isValidTransition(from: ProcessStatusValue, to: ProcessStatusValue): boolean;
  checkTransition(from: string, to: string): TransitionCheck;
  getValidTransitionsFrom(status: ProcessStatusValue): readonly ProcessStatusValue[];
  getProtectionInfo(status: ProcessStatusValue): ProtectionInfo;
  getPattern(name: string): ExtractedPattern | undefined;
  getPatternParseFailure(name: string): PatternParseFailure | undefined;
  getPatternDependencies(name: string): PatternDependencies | undefined;
  getDependencyContext(name: string, opts?: { maxDepth?: number }): DependencyContext | undefined;
  getPatternRelationships(name: string): PatternRelationships | undefined;
  getRelatedPatterns(name: string): readonly string[];
  getApiReferences(name: string): readonly string[];
  getRulesForPattern(name: string): readonly ProvenancedRule[];
  getRulesByDecision(decision: string): readonly BusinessRuleRef[];
  getPatternsByDecision(decision: string): readonly string[];
  listDecisions(): readonly string[];
  listPackages(): readonly string[];
  getPatternDeliverables(name: string): readonly Deliverable[];
  listRoles(): readonly RoleInfo[];
  getPatternsByRole(role: string): ExtractedPattern[];
  getRoleInfo(role: string): RoleInfo | null;
  getCurrentWork(): ExtractedPattern[];
  getRoadmapItems(): ExtractedPattern[];
  getCompletedPatterns(limit?: number): ExtractedPattern[];
  getPatternGraph(): PatternGraph;
}

function deepFreeze<T>(value: T, seen = new WeakSet()): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }

  seen.add(value);

  for (const child of Object.values(value)) {
    deepFreeze(child, seen);
  }

  return Object.freeze(value);
}

/**
 * Delivery-pipeline denominator: the grand total minus `candidate`. Candidates
 * are pre-delivery and excluded from delivery-completion math. Returns a value
 * clamped to a minimum of 1 so callers can divide without guarding for zero;
 * when there are no delivery patterns every numerator is 0, so the resulting
 * percentages are 0 regardless of the clamped denominator.
 */
function deliveryBase(counts: StatusCounts): number {
  const base = counts.total - counts.candidate;
  return base === 0 ? 1 : base;
}

export function createPatternGraphAPI(dataset: PatternGraph): PatternGraphAPI {
  const frozenGraph = deepFreeze(dataset);

  function filterByExactStatus(status: AcceptedStatusValue): ExtractedPattern[] {
    return frozenGraph.byStatus[status];
  }

  type RegistryRoleDefinition = NonNullable<PatternGraph['tagRegistry']['roles']>[number];

  const configuredRoles: readonly RegistryRoleDefinition[] = frozenGraph.tagRegistry.roles;

  function getCanonicalRelationshipEntry(name: string): RelationshipEntry | undefined {
    return getRelationships(frozenGraph, name);
  }

  const DEFAULT_DEPENDENCY_CONTEXT_MAX_DEPTH = 10;

  type DependencyDirection = 'upstream' | 'downstream';

  function directionEdges(entry: RelationshipEntry, direction: DependencyDirection): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];
    const edges =
      direction === 'upstream'
        ? [...entry.dependsOn, ...entry.uses]
        : [...entry.usedBy, ...entry.enables];
    for (const target of edges) {
      if (!seen.has(target)) {
        seen.add(target);
        ordered.push(target);
      }
    }
    return ordered;
  }

  function buildDependencyForest(
    rootName: string,
    direction: DependencyDirection,
    maxDepth: number,
  ): { nodes: DependencyContextNode[]; direct: number; transitive: number } {
    const visited = new Set<string>([rootName]);
    let transitive = 0;

    function expand(name: string, depth: number): DependencyContextNode[] {
      const entry = getCanonicalRelationshipEntry(name);
      if (entry === undefined) return [];

      const targets = directionEdges(entry, direction);
      const nodes: DependencyContextNode[] = [];

      for (const target of targets) {
        if (visited.has(target)) continue;
        visited.add(target);
        transitive += 1;

        const pattern = findPatternByName(frozenGraph, target);
        const childEntry = getCanonicalRelationshipEntry(target);
        const hasFurther =
          childEntry !== undefined &&
          directionEdges(childEntry, direction).some((t) => !visited.has(t));
        const reachedCap = depth + 1 >= maxDepth;
        const children = reachedCap ? [] : expand(target, depth + 1);

        nodes.push({
          name: target,
          ...(pattern?.status !== undefined ? { status: pattern.status } : {}),
          truncated: reachedCap && hasFurther,
          children,
        });
      }

      return nodes;
    }

    const rootEntry = getCanonicalRelationshipEntry(rootName);
    const direct = rootEntry === undefined ? 0 : directionEdges(rootEntry, direction).length;
    const nodes = maxDepth <= 0 ? [] : expand(rootName, 0);
    return { nodes, direct, transitive };
  }

  function normalizeDecisionKey(decision: string): string {
    const pattern = resolveDecisionPattern(frozenGraph, decision);
    return pattern !== undefined ? getPatternName(pattern) : decision;
  }

  function resolvePatternsByDecision(decision: string): string[] {
    const canonical = normalizeDecisionKey(decision);
    const entry = getCanonicalRelationshipEntry(canonical);
    const enforcedBy = entry?.enforcedBy ?? [];

    const seen = new Set<string>();
    const result: string[] = [];
    for (const name of enforcedBy) {
      if (!seen.has(name)) {
        seen.add(name);
        result.push(name);
      }
    }
    if (findPatternByName(frozenGraph, canonical) !== undefined && !seen.has(canonical)) {
      result.push(canonical);
    }
    return result;
  }

  return {
    getPatternsByNormalizedStatus(status) {
      return frozenGraph.byNormalizedStatus[status];
    },
    getPatternsByStatus(status) {
      return filterByExactStatus(status);
    },
    getStatusCounts() {
      return frozenGraph.counts;
    },
    getStatusDistribution() {
      const counts = frozenGraph.counts;
      const base = deliveryBase(counts);
      return {
        counts,
        deliveryPercentages: {
          completed: Math.round((counts.completed / base) * 100),
          active: Math.round((counts.active / base) * 100),
          planned: Math.round((counts.planned / base) * 100),
        },
        candidateShare:
          counts.total === 0 ? 0 : Math.round((counts.candidate / counts.total) * 100),
      };
    },
    getCompletionPercentage() {
      return Math.round((frozenGraph.counts.completed / deliveryBase(frozenGraph.counts)) * 100);
    },
    isValidTransition(from, to) {
      return isValidTransition(from, to);
    },
    checkTransition(from, to) {
      return validateTransition(from, to);
    },
    getValidTransitionsFrom(status) {
      return getValidTransitionsFrom(status);
    },
    getProtectionInfo(status) {
      const summary = getProtectionSummary(status);
      return {
        status,
        level: summary.level,
        description: summary.description,
        canAddDeliverables: summary.canAddDeliverables,
        unlockSuppressesWarning: summary.unlockSuppressesWarning,
      };
    },
    getPattern(name) {
      return findPatternByName(frozenGraph, name);
    },
    getPatternParseFailure(name) {
      return findPatternParseFailure(frozenGraph, name);
    },
    getPatternDependencies(name) {
      const entry = getCanonicalRelationshipEntry(name);
      if (!entry) return undefined;

      return {
        dependsOn: entry.dependsOn,
        enables: entry.enables,
        uses: entry.uses,
        usedBy: entry.usedBy,
      };
    },
    getDependencyContext(name, opts) {
      const focalPattern = findPatternByName(frozenGraph, name);
      const entry = getCanonicalRelationshipEntry(name);
      if (entry === undefined) return undefined;

      const focal = focalPattern !== undefined ? getPatternName(focalPattern) : name;
      const requestedDepth = opts?.maxDepth;
      const maxDepth =
        requestedDepth !== undefined && requestedDepth >= 0
          ? requestedDepth
          : DEFAULT_DEPENDENCY_CONTEXT_MAX_DEPTH;

      const upstream = buildDependencyForest(focal, 'upstream', maxDepth);
      const downstream = buildDependencyForest(focal, 'downstream', maxDepth);

      return {
        focal,
        upstream: upstream.nodes,
        downstream: downstream.nodes,
        summary: {
          upstreamDirect: upstream.direct,
          upstreamTransitive: upstream.transitive,
          downstreamDirect: downstream.direct,
          downstreamTransitive: downstream.transitive,
        },
        options: { maxDepth },
      };
    },
    getPatternRelationships(name) {
      const entry = getCanonicalRelationshipEntry(name);
      if (!entry) return undefined;

      return {
        dependsOn: entry.dependsOn,
        enables: entry.enables,
        uses: entry.uses,
        usedBy: entry.usedBy,
        implementsPatterns: entry.implementsPatterns,
        implementedBy: entry.implementedBy,
        extendsPattern: entry.extendsPattern,
        extendedBy: entry.extendedBy,
        seeAlso: entry.seeAlso,
        apiRef: entry.apiRef,
      };
    },
    getRelatedPatterns(name) {
      const entry = getCanonicalRelationshipEntry(name);
      if (!entry) return [];
      return entry.seeAlso;
    },
    getApiReferences(name) {
      const entry = getCanonicalRelationshipEntry(name);
      if (!entry) return [];
      return entry.apiRef;
    },
    getRulesForPattern(name) {
      return resolveRulesForPattern(frozenGraph, name);
    },
    getRulesByDecision(decision) {
      const patterns = resolvePatternsByDecision(decision);
      const refs: BusinessRuleRef[] = [];
      for (const patternName of patterns) {
        const pattern = findPatternByName(frozenGraph, patternName);
        if (pattern === undefined) continue;
        for (const rule of pattern.rules ?? []) {
          refs.push({ pattern: patternName, ruleName: rule.name });
        }
      }
      return refs;
    },
    getPatternsByDecision(decision) {
      return resolvePatternsByDecision(decision);
    },
    listDecisions() {
      return listDecisionPatterns(frozenGraph).map((pattern) => getPatternName(pattern));
    },
    listPackages() {
      return Object.keys(frozenGraph.archIndex?.byPackage ?? {}).sort();
    },
    getPatternDeliverables(name) {
      const pattern = this.getPattern(name);
      return pattern?.deliverables ?? [];
    },
    listRoles() {
      return configuredRoles.map(({ tag, domain, priority, description }) => ({
        tag,
        domain,
        priority,
        count: frozenGraph.byRole[tag]?.length ?? 0,
        ...(description !== undefined ? { description } : {}),
      }));
    },
    getPatternsByRole(role) {
      const definition = resolveRoleDefinition(frozenGraph, role);
      const canonicalRole = definition?.tag ?? role.toLowerCase();
      return frozenGraph.byRole[canonicalRole] ?? [];
    },
    getRoleInfo(role) {
      const definition = resolveRoleDefinition(frozenGraph, role);
      if (definition === undefined) return null;

      const { tag, domain, priority, description } = definition;
      return {
        tag,
        domain,
        priority,
        count: frozenGraph.byRole[tag]?.length ?? 0,
        ...(description !== undefined ? { description } : {}),
      };
    },
    getCurrentWork() {
      return filterByExactStatus('active');
    },
    getRoadmapItems() {
      const roadmap = filterByExactStatus('roadmap');
      const deferred = filterByExactStatus('deferred');
      return [...roadmap, ...deferred];
    },
    getCompletedPatterns(limit = 10) {
      // The completion-date field is retired (ADR-013); completion order lives in
      // git, not the read model. The set is returned in deterministic name order,
      // capped by the limit — no calendar or ordinal recency is modeled, so the
      // name (not "recently") is the honest contract.
      return filterByExactStatus('completed')
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit);
    },
    getPatternGraph() {
      return frozenGraph;
    },
  };
}
