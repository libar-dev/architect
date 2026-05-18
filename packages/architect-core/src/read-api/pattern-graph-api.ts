/**
 * @architect
 * @architect-pattern PatternGraphApi
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:read-api
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type {
  PatternGraph,
  PatternParseFailure,
  RelationshipEntry,
} from '../validation-schemas/pattern-graph.js';
import type { AcceptedStatusValue, ProcessStatusValue } from '../taxonomy/index.js';
import { isPatternComplete, isPatternActive, isPatternPlanned } from '../taxonomy/index.js';
import {
  validateTransition,
  getProtectionSummary,
  isValidTransition,
  getValidTransitionsFrom,
} from '../validation/fsm/index.js';
import {
  findPatternByName,
  findPatternParseFailure,
  getRelationships,
  resolveRoleDefinition,
} from './pattern-helpers.js';
import type {
  StatusCounts,
  StatusDistribution,
  PhaseProgress,
  PhaseGroup,
  PatternDependencies,
  PatternRelationships,
  PatternDeliverable,
  QuarterGroup,
  TransitionCheck,
  ProtectionInfo,
  RoleInfo,
} from './types.js';

export interface PatternGraphAPI {
  getPatternsByNormalizedStatus(
    status: 'completed' | 'active' | 'planned' | 'candidate',
  ): ExtractedPattern[];
  getPatternsByStatus(status: AcceptedStatusValue): ExtractedPattern[];
  getStatusCounts(): StatusCounts;
  getStatusDistribution(): StatusDistribution;
  getCompletionPercentage(): number;
  getPatternsByPhase(phase: number): ExtractedPattern[];
  getPhaseProgress(phase: number): PhaseProgress | undefined;
  getActivePhases(): PhaseGroup[];
  getAllPhases(): PhaseGroup[];
  isValidTransition(from: ProcessStatusValue, to: ProcessStatusValue): boolean;
  checkTransition(from: string, to: string): TransitionCheck;
  getValidTransitionsFrom(status: ProcessStatusValue): readonly ProcessStatusValue[];
  getProtectionInfo(status: ProcessStatusValue): ProtectionInfo;
  getPattern(name: string): ExtractedPattern | undefined;
  getPatternParseFailure(name: string): PatternParseFailure | undefined;
  getPatternDependencies(name: string): PatternDependencies | undefined;
  getPatternRelationships(name: string): PatternRelationships | undefined;
  getRelatedPatterns(name: string): readonly string[];
  getApiReferences(name: string): readonly string[];
  getPatternDeliverables(name: string): PatternDeliverable[];
  listRoles(): readonly RoleInfo[];
  getPatternsByRole(role: string): ExtractedPattern[];
  getRoleInfo(role: string): RoleInfo | null;
  getPatternsByQuarter(quarter: string): ExtractedPattern[];
  getQuarters(): QuarterGroup[];
  getCurrentWork(): ExtractedPattern[];
  getRoadmapItems(): ExtractedPattern[];
  getRecentlyCompleted(limit?: number): ExtractedPattern[];
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
      const deliveryTotal = frozenGraph.counts.total - frozenGraph.counts.candidate;
      const total = deliveryTotal === 0 ? 1 : deliveryTotal;
      return {
        counts: frozenGraph.counts,
        percentages: {
          completed: Math.round((frozenGraph.counts.completed / total) * 100),
          active: Math.round((frozenGraph.counts.active / total) * 100),
          planned: Math.round((frozenGraph.counts.planned / total) * 100),
          candidate:
            frozenGraph.counts.total === 0
              ? 0
              : Math.round((frozenGraph.counts.candidate / frozenGraph.counts.total) * 100),
        },
      };
    },
    getCompletionPercentage() {
      const deliveryTotal = frozenGraph.counts.total - frozenGraph.counts.candidate;
      const total = deliveryTotal === 0 ? 1 : deliveryTotal;
      return Math.round((frozenGraph.counts.completed / total) * 100);
    },
    getPatternsByPhase(phase) {
      const phaseGroup = frozenGraph.byPhase.find((p) => p.phaseNumber === phase);
      return phaseGroup?.patterns ?? [];
    },
    getPhaseProgress(phase) {
      const phaseGroup = frozenGraph.byPhase.find((p) => p.phaseNumber === phase);
      if (!phaseGroup) return undefined;

      const deliveryTotal = phaseGroup.counts.total - phaseGroup.counts.candidate;
      const total = deliveryTotal === 0 ? 1 : deliveryTotal;
      return {
        phaseNumber: phaseGroup.phaseNumber,
        phaseName: phaseGroup.phaseName,
        completed: phaseGroup.counts.completed,
        active: phaseGroup.counts.active,
        planned: phaseGroup.counts.planned,
        candidate: phaseGroup.counts.candidate,
        total: phaseGroup.counts.total,
        completionPercentage: Math.round((phaseGroup.counts.completed / total) * 100),
      };
    },
    getActivePhases() {
      return frozenGraph.byPhase.filter((p) => p.counts.active > 0);
    },
    getAllPhases() {
      return frozenGraph.byPhase;
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
        requiresUnlock: summary.requiresUnlock,
      };
    },
    getPattern(name) {
      return findPatternByName(frozenGraph.patterns, name);
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
    getPatternDeliverables(name) {
      const pattern = this.getPattern(name);
      if (!pattern?.deliverables) return [];

      return pattern.deliverables.map((d) => ({
        name: d.name,
        status: d.status,
        tests: d.tests,
        location: d.location,
        finding: d.finding,
        release: d.release,
      }));
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
    getPatternsByQuarter(quarter) {
      return frozenGraph.byQuarter[quarter] ?? [];
    },
    getQuarters() {
      return Object.entries(frozenGraph.byQuarter)
        .map(([quarter, patterns]) => {
          const counts = {
            completed: patterns.filter((p) => isPatternComplete(p.status)).length,
            active: patterns.filter((p) => isPatternActive(p.status)).length,
            planned: patterns.filter((p) => isPatternPlanned(p.status)).length,
            candidate: patterns.filter((p) => p.status === 'candidate').length,
            total: patterns.length,
          };
          return { quarter, patterns, counts };
        })
        .sort((a, b) => a.quarter.localeCompare(b.quarter));
    },
    getCurrentWork() {
      return filterByExactStatus('active');
    },
    getRoadmapItems() {
      const roadmap = filterByExactStatus('roadmap');
      const deferred = filterByExactStatus('deferred');
      return [...roadmap, ...deferred];
    },
    getRecentlyCompleted(limit = 10) {
      const completed = filterByExactStatus('completed');
      return completed
        .filter((p) => p.completed)
        .sort((a, b) => {
          const dateA = a.completed ?? '';
          const dateB = b.completed ?? '';
          return dateB.localeCompare(dateA);
        })
        .slice(0, limit);
    },
    getPatternGraph() {
      return frozenGraph;
    },
  };
}
