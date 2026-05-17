/**
 * @architect-bounded-context:execution-context
 */
/**
 * Builds the deliverable manifest and single-deliverable lookup used by the execution-context projection.
 */

import { findPatternByName } from '@libar-dev/architect-core';

import type { ProjectionContext } from '../../context/projection-context.js';
import {
  type Deliverable,
  type DeliverableManifest,
} from '../../fragments/execution-context/index.js';
import { getPatternName } from '../_shared/pattern-helpers.internal.js';

import { normalizeExecutionContextDeliverables } from './execution-context-shared.internal.js';

export function buildDeliverableManifest(
  context: ProjectionContext,
  patternName: string
): DeliverableManifest | undefined {
  const pattern = findPatternByName(context.graph, patternName);
  if (pattern === undefined) {
    return undefined;
  }

  return {
    kind: 'DeliverableManifest',
    pattern: getPatternName(pattern),
    items: normalizeExecutionContextDeliverables(pattern),
  };
}

export function buildDeliverable(
  context: ProjectionContext,
  patternName: string,
  name: string
): Deliverable | undefined {
  const manifest = buildDeliverableManifest(context, patternName);
  if (manifest === undefined) {
    return undefined;
  }

  const match = manifest.items.find(
    (deliverable) => deliverable.name.toLowerCase() === name.toLowerCase()
  );
  return match;
}
