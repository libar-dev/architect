/**
 * @architect
 * @architect-pattern PatternDetailProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts, PatternDetail
 * @architect-bounded-context:projection
 *
 * ## Pattern detail projection
 *
 * **Value:** Gives detail views and context packs a single self-contained
 * bundle for one pattern — summary, description, deliverables, normalized
 * relationships, embedded rules, stubs, and a deliverable manifest — so
 * every renderer (compact text, JSON, Markdown, UI) can drive its output
 * without extra graph queries.
 *
 * **Invariant:** A `PatternDetail` always carries
 * `summary + description + deliverables + relationships + rules + stubs +
 * deliverableManifest`, with relationships normalized to the stable shape
 * (falling back to raw pattern arrays when the relationship index is
 * missing), empty collections emitted as empty arrays, and the manifest
 * pointing at the same pattern name. The bundle contains no child
 * fragments.
 *
 * **Behavior:**
 * - Resolves the pattern via `requirePattern`, then builds the summary,
 *   extracts the first sentence of the description, and normalizes
 *   deliverables, relationships, rules, and stub references through the
 *   shared `PatternRelationsProjectionSupport` helpers.
 * - Parses `**Invariant:**` / `**Rationale:**` / `**Verified by:**`
 *   metadata from rule descriptions to populate `EmbeddedRuleRef` fields.
 * - Wraps the detail in a `ProjectionBundle` via `projectSingle`.
 *
 * ### When to Use
 *
 * - Projects the expanded detail bundle for one pattern, normalizing summary, deliverables, relationships, rules, stubs, and manifest.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { PatternDetail } from '../../fragments/pattern-relations/index.js';
import {
  buildFileToPackageMap,
  buildPatternHierarchy,
  createPatternSummaryFragment,
  extractDescription,
  extractOpenQuestions,
  normalizeDeliverables,
  normalizePatternRelationships,
  normalizeRules,
  requirePattern,
  resolveStubRefs,
} from '../_shared/pattern-helpers.internal.js';

export function projectPatternDetail(
  context: ProjectionContext,
  name: string,
): ProjectionBundle<PatternDetail> {
  const pattern = requirePattern(context, name);
  const byPackage = context.graph.archIndex?.byPackage;
  const fileToPackage: ReadonlyMap<string, string> =
    byPackage !== undefined ? buildFileToPackageMap(byPackage) : new Map();
  const summary = createPatternSummaryFragment(pattern, fileToPackage.get(pattern.source.file));
  const deliverables = normalizeDeliverables(pattern);
  const description = extractDescription(pattern.directive.description);
  const openQuestions = extractOpenQuestions(pattern.directive.description);
  const hierarchy = buildPatternHierarchy(pattern);
  const detail: PatternDetail = {
    ...summary,
    kind: 'PatternDetail',
    ...(description !== '' ? { description } : {}),
    ...(openQuestions.length > 0 ? { openQuestions } : {}),
    deliverables,
    relationships: normalizePatternRelationships(context, summary.patternName),
    ...(hierarchy !== undefined ? { hierarchy } : {}),
    rules: normalizeRules(pattern),
    stubs: resolveStubRefs(context, summary.patternName),
    deliverableManifest: {
      pattern: summary.patternName,
      items: deliverables,
    },
  };

  return projectSingle(detail);
}
