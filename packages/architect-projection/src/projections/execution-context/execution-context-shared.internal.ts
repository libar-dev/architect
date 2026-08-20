/**
 * @architect
 * @architect-pattern ExecutionContextProjectionSupport
 * @architect-status completed
 * @architect-role:utility
 * @architect-uses ProjectionFragmentContracts, ExtractedPattern
 * @architect-bounded-context:projection
 *
 * ## Execution context projection support
 *
 * Shared pure helpers that port session/context projection semantics into the
 * execution-context fragment contracts without leaking query-layer DTOs or
 * filesystem behavior. Fragment-specific helpers live next to their fragment
 * in `<fragment>.internal.ts`; this module hosts only the helpers reused by
 * multiple fragments.
 *
 * **Value:** Centralizes the helpers that scope-readiness, session-context,
 * reading-list, deliverable, and handoff projections all use to resolve a
 * pattern's test files and normalize its declared deliverables into fragment
 * shape.
 *
 * **Invariant:** Helpers are pure and never touch the filesystem: test-file
 * resolution prefers `executableSpecs`, falls back to `behaviorFile`, and
 * returns an empty list when neither exists; deliverable normalization always
 * stamps `kind: 'Deliverable'` on every entry produced by the shared
 * pattern-helper normalizer.
 *
 * **Behavior:**
 * - `resolveTestFiles` returns `executableSpecs` when present and non-empty,
 *   otherwise `[behaviorFile]` when defined, otherwise `[]`.
 * - `normalizeExecutionContextDeliverables` delegates to the shared
 *   `normalizeDeliverables` helper and lifts each entry into a
 *   `Deliverable` fragment.
 *
 * Execution-context projections use these helpers when they need shared test-file discovery or deliverable normalization.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';

import type { Deliverable } from '../../fragments/execution-context/index.js';
import { normalizeDeliverables } from '../_shared/pattern-helpers.internal.js';

export function resolveTestFiles(pattern: ExtractedPattern): readonly string[] {
  if (pattern.executableSpecs !== undefined && pattern.executableSpecs.length > 0) {
    return pattern.executableSpecs;
  }

  return pattern.behaviorFile !== undefined ? [pattern.behaviorFile] : [];
}

export function normalizeExecutionContextDeliverables(pattern: ExtractedPattern): Deliverable[] {
  return normalizeDeliverables(pattern).map(
    (deliverable): Deliverable => ({
      kind: 'Deliverable',
      ...deliverable,
    }),
  );
}
