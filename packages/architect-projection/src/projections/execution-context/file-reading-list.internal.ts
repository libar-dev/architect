/**
 * @architect-bounded-context:execution-context
 */
/**
 * Builds the file-reading list that groups primary files, completed dependencies, roadmap dependencies, and architecture neighbors.
 */

import { findPatternByName, isPatternComplete } from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { FileReadingList } from '../../fragments/execution-context/index.js';
import {
  getPatternName,
  getRelationships,
  resolveStubRefs,
} from '../_shared/pattern-helpers.internal.js';

import {
  normalizeExecutionContextDeliverables,
  resolveTestFiles,
} from './execution-context-shared.internal.js';

export const FileReadingListOptionsSchema = z
  .strictObject({
    pattern: z.string(),
    includeRelated: z.boolean().optional(),
  })
  .readonly();

export type FileReadingListOptions = z.infer<typeof FileReadingListOptionsSchema>;

export function buildFileReadingList(
  context: ProjectionContext,
  options: FileReadingListOptions,
): FileReadingList | undefined {
  const pattern = findPatternByName(context.graph, options.pattern);
  if (pattern === undefined) {
    return undefined;
  }

  const canonicalName = getPatternName(pattern);
  const primary: string[] = [];

  pushUnique(primary, pattern.source.file);
  for (const testFile of resolveTestFiles(pattern)) {
    pushUnique(primary, testFile);
  }
  for (const deliverable of normalizeExecutionContextDeliverables(pattern)) {
    pushUnique(primary, deliverable.location);
  }
  for (const stub of resolveStubRefs(context, canonicalName)) {
    pushUnique(primary, stub.stubFile);
  }

  const completedDeps: string[] = [];
  const roadmapDeps: string[] = [];
  const architectureNeighbors: string[] = [];
  const relationships = getRelationships(context, canonicalName);

  if (relationships !== undefined) {
    // The `.feature` specs that realize this pattern are PRIMARY reading (not
    // "related"): follow the derived implementedBy reverse edge (ADR-002/ADR-003).
    for (const implementationRef of relationships.implementedBy) {
      pushUnique(primary, implementationRef.file);
    }

    for (const dependencyName of relationships.dependsOn) {
      const dependencyPattern = findPatternByName(context.graph, dependencyName);
      if (dependencyPattern === undefined) {
        continue;
      }

      const bucket = isPatternComplete(dependencyPattern.status) ? completedDeps : roadmapDeps;
      pushUnique(bucket, dependencyPattern.source.file);
      for (const testFile of resolveTestFiles(dependencyPattern)) {
        pushUnique(bucket, testFile);
      }

      if (bucket === completedDeps) {
        const dependencyRelationships = getRelationships(
          context,
          getPatternName(dependencyPattern),
        );
        for (const implementationRef of dependencyRelationships?.implementedBy ?? []) {
          pushUnique(completedDeps, implementationRef.file);
        }
      } else {
        for (const deliverable of normalizeExecutionContextDeliverables(dependencyPattern)) {
          pushUnique(roadmapDeps, deliverable.location);
        }
      }
    }
  }

  if (pattern.boundedContext !== undefined && context.graph.archIndex !== undefined) {
    for (const neighbor of context.graph.archIndex.byContext[pattern.boundedContext] ?? []) {
      if (getPatternName(neighbor) !== canonicalName) {
        pushUnique(architectureNeighbors, neighbor.source.file);
      }
    }
  }

  const includeRelated = options.includeRelated !== false;

  return {
    kind: 'FileReadingList',
    pattern: canonicalName,
    primary,
    completedDeps: includeRelated ? completedDeps : [],
    roadmapDeps: includeRelated ? roadmapDeps : [],
    architectureNeighbors: includeRelated
      ? sortArchitectureNeighborsForLegacyParity(architectureNeighbors)
      : [],
  };
}

// Projection-owned ordering for the `architect_files` MCP tool with
// `includeRelated: true`: source paths sort alphabetically, but design stub paths
// stay last so generated context remains stable. See MIGRATION.md Table C.
function sortArchitectureNeighborsForLegacyParity(paths: readonly string[]): string[] {
  return [...paths].sort((left, right) => {
    const leftIsStub = left.startsWith('architect/stubs/');
    const rightIsStub = right.startsWith('architect/stubs/');

    if (leftIsStub !== rightIsStub) {
      return leftIsStub ? 1 : -1;
    }

    return left.localeCompare(right);
  });
}

function pushUnique(bucket: string[], value: string | undefined): void {
  if (value !== undefined && value.length > 0 && !bucket.includes(value)) {
    bucket.push(value);
  }
}
