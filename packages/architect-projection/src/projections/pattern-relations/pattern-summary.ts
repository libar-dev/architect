/**
 * @architect
 * @architect-pattern PatternSummaryProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts
 * @architect-bounded-context:projection
 *
 * ## Pattern summary projection
 *
 * **Value:** Gives consumers the canonical short description of any pattern
 * — name, status, role, optional phase, file, and source (`typescript` or
 * `gherkin`) — as a stable, schema-validated fragment reused by catalog,
 * detail, and every renderer.
 *
 * **Invariant:** A `PatternSummary` always exposes `patternName`, `status`,
 * `role`, optional `phase`, `file`, and a `source` discriminator derived
 * from the file extension; lookup is case-insensitive, and unknown names
 * fail with a `PATTERN_NOT_FOUND` error plus a fuzzy suggestion.
 *
 * **Behavior:**
 * - Resolves the pattern via `requirePattern`, which performs
 *   case-insensitive lookup and produces fuzzy suggestions on miss.
 * - Builds the fragment through `createPatternSummaryFragment`, which
 *   derives the `source` field from the file extension (`.feature` →
 *   `gherkin`, otherwise `typescript`).
 * - Wraps the summary in a `ProjectionBundle` via `projectSingle`.
 *
 * ### When to Use
 *
 * - Projects the canonical short pattern summary reused by catalog and detail views.
 */

import type { PatternSummary } from '../../fragments/pattern-relations/index.js';
import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import {
  createPatternSummaryFragment,
  requirePattern,
} from '../_shared/pattern-helpers.internal.js';

export function projectPatternSummary(
  context: ProjectionContext,
  name: string
): ProjectionBundle<PatternSummary> {
  return projectSingle(createPatternSummaryFragment(requirePattern(context, name)));
}
