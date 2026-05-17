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
  PhaseGroup as SchemaPhaseGroup,
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

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function cloneTagRegistry(tagRegistry: PatternGraph['tagRegistry']): PatternGraph['tagRegistry'] {
  return {
    ...tagRegistry,
    roles: tagRegistry.roles.map((role) => ({
      ...role,
      ...(role.aliases !== undefined ? { aliases: [...role.aliases] } : {}),
    })),
    metadataTags: tagRegistry.metadataTags.map((tag) => ({
      ...tag,
      ...(tag.values !== undefined ? { values: [...tag.values] } : {}),
      ...(tag.transform !== undefined ? { transform: tag.transform } : {}),
    })),
    aggregationTags: tagRegistry.aggregationTags.map((tag) => ({ ...tag })),
    formatOptions: [...tagRegistry.formatOptions],
  };
}

function clonePatternGraph(graph: PatternGraph): PatternGraph {
  const { tagRegistry, ...rest } = graph;
  return {
    ...cloneValue(rest),
    tagRegistry: cloneTagRegistry(tagRegistry),
  };
}

export function createPatternGraphAPI(dataset: PatternGraph): PatternGraphAPI {
  function filterByExactStatus(status: AcceptedStatusValue): ExtractedPattern[] {
    return cloneValue(dataset.byStatus[status]);
  }

  type RegistryRoleDefinition = NonNullable<PatternGraph['tagRegistry']['roles']>[number];

  const configuredRoles: readonly RegistryRoleDefinition[] = dataset.tagRegistry.roles;

  function convertPhaseGroup(mpg: SchemaPhaseGroup): PhaseGroup {
    return cloneValue({
      phaseNumber: mpg.phaseNumber,
      phaseName: mpg.phaseName,
      patterns: mpg.patterns,
      counts: mpg.counts,
    });
  }

  function getCanonicalRelationshipEntry(name: string): RelationshipEntry | undefined {
    return getRelationships(dataset, name);
  }

  return {
    getPatternsByNormalizedStatus(status) {
      return cloneValue(dataset.byNormalizedStatus[status]);
    },
    getPatternsByStatus(status) {
      return filterByExactStatus(status);
    },
    getStatusCounts() {
      return cloneValue(dataset.counts);
    },
    getStatusDistribution() {
      const deliveryTotal = dataset.counts.total - dataset.counts.candidate;
      const total = deliveryTotal === 0 ? 1 : deliveryTotal;
      return {
        counts: cloneValue(dataset.counts),
        percentages: {
          completed: Math.round((dataset.counts.completed / total) * 100),
          active: Math.round((dataset.counts.active / total) * 100),
          planned: Math.round((dataset.counts.planned / total) * 100),
          candidate:
            dataset.counts.total === 0
              ? 0
              : Math.round((dataset.counts.candidate / dataset.counts.total) * 100),
        },
      };
    },
    getCompletionPercentage() {
      const deliveryTotal = dataset.counts.total - dataset.counts.candidate;
      const total = deliveryTotal === 0 ? 1 : deliveryTotal;
      return Math.round((dataset.counts.completed / total) * 100);
    },
    getPatternsByPhase(phase) {
      const phaseGroup = dataset.byPhase.find((p) => p.phaseNumber === phase);
      return cloneValue(phaseGroup?.patterns ?? []);
    },
    getPhaseProgress(phase) {
      const phaseGroup = dataset.byPhase.find((p) => p.phaseNumber === phase);
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
      return dataset.byPhase.filter((p) => p.counts.active > 0).map(convertPhaseGroup);
    },
    getAllPhases() {
      return dataset.byPhase.map(convertPhaseGroup);
    },
    isValidTransition(from, to) {
      return isValidTransition(from, to);
    },
    checkTransition(from, to) {
      const result = validateTransition(from, to);
      return cloneValue({
        from: result.from,
        to: result.to,
        valid: result.valid,
        error: result.error,
        validAlternatives: result.validAlternatives,
      });
    },
    getValidTransitionsFrom(status) {
      return cloneValue(getValidTransitionsFrom(status));
    },
    getProtectionInfo(status) {
      const summary = getProtectionSummary(status);
      return cloneValue({
        status,
        level: summary.level,
        description: summary.description,
        canAddDeliverables: summary.canAddDeliverables,
        requiresUnlock: summary.requiresUnlock,
      });
    },
    getPattern(name) {
      const pattern = findPatternByName(dataset.patterns, name);
      return pattern === undefined ? undefined : cloneValue(pattern);
    },
    getPatternParseFailure(name) {
      const failure = findPatternParseFailure(dataset, name);
      return failure === undefined ? undefined : cloneValue(failure);
    },
    getPatternDependencies(name) {
      const entry = getCanonicalRelationshipEntry(name);
      if (!entry) return undefined;

      return cloneValue({
        dependsOn: entry.dependsOn,
        enables: entry.enables,
        uses: entry.uses,
        usedBy: entry.usedBy,
      });
    },
    getPatternRelationships(name) {
      const entry = getCanonicalRelationshipEntry(name);
      if (!entry) return undefined;

      return cloneValue({
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
      });
    },
    getRelatedPatterns(name) {
      const entry = getCanonicalRelationshipEntry(name);
      if (!entry) return [];
      return cloneValue(entry.seeAlso);
    },
    getApiReferences(name) {
      const entry = getCanonicalRelationshipEntry(name);
      if (!entry) return [];
      return cloneValue(entry.apiRef);
    },
    getPatternDeliverables(name) {
      const pattern = this.getPattern(name);
      if (!pattern?.deliverables) return [];

      return cloneValue(
        pattern.deliverables.map((d) => ({
          name: d.name,
          status: d.status,
          tests: d.tests,
          location: d.location,
          finding: d.finding,
          release: d.release,
        })),
      );
    },
    listRoles() {
      return cloneValue(
        configuredRoles.map(({ tag, domain, priority, description }) => ({
          tag,
          domain,
          priority,
          count: dataset.byRole[tag]?.length ?? 0,
          ...(description !== undefined ? { description } : {}),
        })),
      );
    },
    getPatternsByRole(role) {
      const definition = resolveRoleDefinition(dataset, role);
      const canonicalRole = definition?.tag ?? role.toLowerCase();
      return cloneValue(dataset.byRole[canonicalRole] ?? []);
    },
    getRoleInfo(role) {
      const definition = resolveRoleDefinition(dataset, role);
      if (definition === undefined) return null;

      const { tag, domain, priority, description } = definition;
      return cloneValue({
        tag,
        domain,
        priority,
        count: dataset.byRole[tag]?.length ?? 0,
        ...(description !== undefined ? { description } : {}),
      });
    },
    getPatternsByQuarter(quarter) {
      return cloneValue(dataset.byQuarter[quarter] ?? []);
    },
    getQuarters() {
      return cloneValue(
        Object.entries(dataset.byQuarter)
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
          .sort((a, b) => a.quarter.localeCompare(b.quarter)),
      );
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
      return clonePatternGraph(dataset);
    },
  };
}
