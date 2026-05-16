/**
 * @architect-bounded-context:execution-context
 */
/**
 * Private helpers used exclusively by the session-context fragment.
 *
 * Part of the ExecutionContextProjectionSupport utility surface.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import {
  PROTECTION_LEVELS,
  VALID_PROCESS_STATUS_SET,
  VALID_TRANSITIONS,
  findPatternByName,
  SessionTypeSchema,
} from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { Deliverable, SessionContextBundle } from '../../fragments/execution-context/index.js';
import type {
  DepEntry,
  FsmContext,
  NeighborEntry,
  PatternContextMeta,
  PatternFsmEntry,
  SessionType,
  StubRef,
} from '../../fragments/execution-context/supporting.js';
import {
  extractDescription,
  getPatternName,
  getRelationships,
  requirePattern,
  resolveStubRefs,
} from '../_shared/pattern-helpers.internal.js';

import {
  normalizeExecutionContextDeliverables,
  resolveTestFiles,
} from './execution-context-shared.internal.js';

export const SessionContextOptionsSchema = z
  .strictObject({
    patterns: z.array(z.string()).readonly(),
    sessionType: SessionTypeSchema,
  })
  .readonly();

export type SessionContextOptions = z.infer<typeof SessionContextOptionsSchema>;

export function buildSessionContextBundle(
  context: ProjectionContext,
  options: SessionContextOptions
): SessionContextBundle {
  const { patterns, sessionType } = options;

  if (patterns.length === 0) {
    return {
      kind: 'SessionContextBundle',
      patterns: [],
      sessionType,
      metadata: [],
      specFiles: [],
      stubs: [],
      dependencies: [],
      sharedDependencies: [],
      consumers: [],
      architectureNeighbors: [],
      deliverables: [],
      fsmByPattern: [],
      testFiles: [],
    };
  }

  const focalPatterns = patterns.map((patternName) => requirePattern(context, patternName));
  const focalNames = new Set(focalPatterns.map(getPatternName));
  const metadata: PatternContextMeta[] = [];
  const specFiles: string[] = [];
  const stubs: StubRef[] = [];
  const consumers: DepEntry[] = [];
  const architectureNeighbors: NeighborEntry[] = [];
  const deliverables: Deliverable[] = [];
  const testFiles: string[] = [];
  const fsmByPattern: PatternFsmEntry[] = [];
  const perPatternDeps = new Map<string, readonly DepEntry[]>();

  for (const pattern of focalPatterns) {
    const patternName = getPatternName(pattern);
    const relationships = getRelationships(context, patternName);

    metadata.push(createPatternContextMeta(pattern));

    if (
      (sessionType === 'design' || sessionType === 'implement') &&
      pattern.source.file.endsWith('.feature')
    ) {
      specFiles.push(pattern.source.file);
    }

    if (sessionType === 'design') {
      stubs.push(...resolveStubRefs(context, patternName));
    }

    perPatternDeps.set(patternName, createSessionDependencies(context, patternName, sessionType));

    if (sessionType === 'design' && relationships !== undefined) {
      for (const consumerName of relationships.usedBy) {
        if (!consumers.some((entry) => entry.name === consumerName)) {
          consumers.push(resolveDepEntry(context, consumerName, 'implementation'));
        }
      }

      for (const consumerName of relationships.enables) {
        if (!consumers.some((entry) => entry.name === consumerName)) {
          consumers.push(resolveDepEntry(context, consumerName, 'planning'));
        }
      }

      for (const neighbor of resolveArchitectureNeighbors(context, pattern, focalNames)) {
        if (!architectureNeighbors.some((entry) => entry.name === neighbor.name)) {
          architectureNeighbors.push(neighbor);
        }
      }
    }

    if (sessionType === 'design' || sessionType === 'implement') {
      deliverables.push(...normalizeExecutionContextDeliverables(pattern));
    }

    if (sessionType === 'implement') {
      const fsm = createFsmContext(pattern.status);
      if (fsm !== undefined) {
        fsmByPattern.push({ pattern: patternName, fsm });
      }
      testFiles.push(...resolveTestFiles(pattern));
    }
  }

  const { dependencies, sharedDependencies } = flattenDependencies(perPatternDeps);
  const fsm =
    sessionType === 'implement' && fsmByPattern.length === 1 ? fsmByPattern[0]?.fsm : undefined;

  return {
    kind: 'SessionContextBundle',
    patterns: [...patterns],
    sessionType,
    metadata,
    specFiles,
    stubs,
    dependencies,
    sharedDependencies,
    consumers,
    architectureNeighbors,
    deliverables,
    ...(fsm !== undefined ? { fsm } : {}),
    fsmByPattern,
    testFiles,
  };
}

function createPatternContextMeta(pattern: ExtractedPattern): PatternContextMeta {
  return {
    name: getPatternName(pattern),
    status: pattern.status,
    ...(pattern.phase !== undefined ? { phase: pattern.phase } : {}),
    role: pattern.role ?? '',
    file: pattern.source.file,
    summary: extractDescription(pattern.directive.description),
  };
}

function createSessionDependencies(
  context: ProjectionContext,
  patternName: string,
  sessionType: SessionType
): readonly DepEntry[] {
  const relationships = getRelationships(context, patternName);
  const dependencies: DepEntry[] = [];

  if (relationships === undefined) {
    return dependencies;
  }

  for (const dependencyName of relationships.dependsOn) {
    dependencies.push(resolveDepEntry(context, dependencyName, 'planning'));
  }

  if (sessionType === 'design') {
    for (const dependencyName of relationships.uses) {
      if (!dependencies.some((entry) => entry.name === dependencyName)) {
        dependencies.push(resolveDepEntry(context, dependencyName, 'implementation'));
      }
    }
  }

  return dependencies;
}

function resolveDepEntry(
  context: ProjectionContext,
  dependencyName: string,
  kind: DepEntry['kind']
): DepEntry {
  const dependencyPattern = findPatternByName(context.graph, dependencyName);
  return {
    name: dependencyName,
    ...(dependencyPattern?.status !== undefined ? { status: dependencyPattern.status } : {}),
    file: dependencyPattern?.source.file ?? '',
    kind,
  };
}

function resolveArchitectureNeighbors(
  context: ProjectionContext,
  pattern: ExtractedPattern,
  focalNames: ReadonlySet<string>
): readonly NeighborEntry[] {
  if (pattern.boundedContext === undefined || context.graph.archIndex === undefined) {
    return [];
  }

  return (context.graph.archIndex.byContext[pattern.boundedContext] ?? [])
    .filter((entry) => !focalNames.has(getPatternName(entry)))
    .map((entry) => ({
      name: getPatternName(entry),
      status: entry.status,
      ...(entry.role !== undefined ? { role: entry.role } : {}),
      ...(entry.boundedContext !== undefined ? { archContext: entry.boundedContext } : {}),
      file: entry.source.file,
    }));
}

function flattenDependencies(perPatternDeps: ReadonlyMap<string, readonly DepEntry[]>): {
  dependencies: DepEntry[];
  sharedDependencies: DepEntry[];
} {
  const dependencyCounts = new Map<string, number>();
  const dependencies: DepEntry[] = [];
  const seenDependencies = new Set<string>();

  for (const entries of perPatternDeps.values()) {
    for (const dependency of entries) {
      dependencyCounts.set(dependency.name, (dependencyCounts.get(dependency.name) ?? 0) + 1);
      if (!seenDependencies.has(dependency.name)) {
        seenDependencies.add(dependency.name);
        dependencies.push(dependency);
      }
    }
  }

  return {
    dependencies,
    sharedDependencies: dependencies.filter(
      (dependency) => (dependencyCounts.get(dependency.name) ?? 0) > 1
    ),
  };
}

function createFsmContext(status: string | undefined): FsmContext | undefined {
  if (status === undefined || !VALID_PROCESS_STATUS_SET.has(status)) {
    return undefined;
  }

  const processStatus = status as keyof typeof VALID_TRANSITIONS;

  return {
    currentStatus: status,
    validTransitions: [...VALID_TRANSITIONS[processStatus]],
    protectionLevel: PROTECTION_LEVELS[processStatus],
  };
}
