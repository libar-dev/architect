/**
 * @architect-bounded-context:execution-context
 */
/**
 * Builds the handoff record, including default checkbox summaries, discovered items, blockers, and next-session text.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import {
  HandoffSessionTypeSchema,
  findPatternByName,
  isPatternComplete,
} from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { Deliverable, HandoffRecord } from '../../fragments/execution-context/index.js';
import {
  getPatternName,
  getRelationships,
  requirePattern,
} from '../_shared/pattern-helpers.internal.js';

import { normalizeExecutionContextDeliverables } from './execution-context-shared.internal.js';

export const HandoffOptionsSchema = z
  .strictObject({
    pattern: z.string(),
    sessionType: HandoffSessionTypeSchema,
    completed: z.array(z.string()).readonly().optional(),
    inProgress: z.array(z.string()).readonly().optional(),
    filesModified: z.array(z.string()).readonly().optional(),
    discovered: z.array(z.string()).readonly().optional(),
    blockers: z.array(z.string()).readonly().optional(),
    nextSession: z.string().optional(),
  })
  .readonly();

export type HandoffOptions = z.infer<typeof HandoffOptionsSchema>;

export function buildHandoffRecord(
  context: ProjectionContext,
  options: HandoffOptions,
): HandoffRecord {
  const pattern = requirePattern(context, options.pattern);
  const patternName = getPatternName(pattern);
  const deliverables = normalizeExecutionContextDeliverables(pattern);
  const completedDeliverables = deliverables.filter((deliverable) =>
    isCompletedDeliverableStatus(deliverable.status),
  );
  const inProgressDeliverables = deliverables.filter(
    (deliverable) =>
      !isCompletedDeliverableStatus(deliverable.status) &&
      !isPendingDeliverableStatus(deliverable.status),
  );
  const remainingDeliverables = deliverables.filter(
    (deliverable) => !isCompletedDeliverableStatus(deliverable.status),
  );

  return {
    kind: 'HandoffRecord',
    pattern: patternName,
    status: pattern.status,
    sessionType: options.sessionType,
    completed:
      options.completed !== undefined
        ? [...options.completed]
        : completedDeliverables.map(
            (deliverable) => `[x] ${deliverable.name} (${deliverable.location})`,
          ),
    inProgress:
      options.inProgress !== undefined
        ? [...options.inProgress]
        : inProgressDeliverables.map(
            (deliverable) => `[ ] ${deliverable.name} (${deliverable.location})`,
          ),
    filesModified: options.filesModified !== undefined ? [...options.filesModified] : [],
    discovered:
      options.discovered !== undefined ? [...options.discovered] : deriveDiscoveredItems(pattern),
    blockers:
      options.blockers !== undefined ? [...options.blockers] : deriveBlockers(context, patternName),
    nextSession:
      options.nextSession ?? remainingDeliverables.map(formatNextSessionEntry).join('\n'),
  };
}

function isCompletedDeliverableStatus(status: string): boolean {
  return status === 'complete';
}

function isPendingDeliverableStatus(status: string): boolean {
  return status === 'pending';
}

function deriveDiscoveredItems(pattern: ExtractedPattern): string[] {
  const discovered: string[] = [];
  const discoveredGaps = pattern.discoveredGaps ?? [];
  if (discoveredGaps.length > 0) {
    discovered.push(`Gaps: ${discoveredGaps.join(', ')}`);
  }
  const discoveredImprovements = pattern.discoveredImprovements ?? [];
  if (discoveredImprovements.length > 0) {
    discovered.push(`Improvements: ${discoveredImprovements.join(', ')}`);
  }
  const discoveredLearnings = pattern.discoveredLearnings ?? [];
  if (discoveredLearnings.length > 0) {
    discovered.push(`Learnings: ${discoveredLearnings.join(', ')}`);
  }
  return discovered;
}

function deriveBlockers(context: ProjectionContext, patternName: string): string[] {
  const relationships = getRelationships(context, patternName);
  const blockers = (relationships?.dependsOn ?? [])
    .map((dependencyName) => {
      const dependencyPattern = findPatternByName(context.graph, dependencyName);
      if (dependencyPattern === undefined || isPatternComplete(dependencyPattern.status)) {
        return undefined;
      }

      return `${dependencyName} (${dependencyPattern.status})`;
    })
    .filter((value): value is string => value !== undefined);

  return blockers.length > 0 ? blockers : ['None'];
}

function formatNextSessionEntry(deliverable: Deliverable, index: number): string {
  return `${String(index + 1)}. ${deliverable.name} (${deliverable.location})`;
}
