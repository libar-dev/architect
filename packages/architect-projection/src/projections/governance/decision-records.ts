/**
 * @architect
 * @architect-pattern DecisionCatalogProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses GovernanceProjectionSupport, ProjectionFragmentContracts, DecisionCatalog, DecisionRecord
 * @architect-bounded-context:projection
 *
 * **Value:** Gives consumers a single entry point for looking up one
 * decision by id or listing the full `DecisionCatalog` bundle of normalized
 * ADR/PDR/DDR/TDR records.
 *
 * **Invariant:** `projectDecisionRecord` throws `DECISION_NOT_FOUND` (listing
 * available ids) when the id does not resolve; `projectDecisionCatalog`
 * returns a typed catalog root with decision children routed to
 * `decisions/<id>.md` and the catalog root routed to `DECISIONS.md`.
 *
 * **Behavior:**
 * - Parses canonical `**Context:** / **Decision:** / **Consequences:** /
 *   **Alternatives:**` blocks from the decision directive description and
 *   merges them with rules whose names start with the same labels.
 * - Detects decision type (ADR/PDR/DDR/TDR) from filename prefix first, then
 *   pattern-name prefix, defaulting to ADR.
 * - Derives `relatedDecisions` from `adrSupersedes`/`adrSupersededBy` and
 *   `affectedPatterns` from the union of relationship arrays.
 *
 * ### When to Use
 *
 * - Projects a single decision record or the full decision catalog, with missing ids failing fast and catalog children routed by id.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { DecisionCatalog, DecisionRecord } from '../../fragments/governance/index.js';
import { buildDecisionCatalog, buildDecisionRecord } from './decision-records.internal.js';

export function projectDecisionRecord(
  context: ProjectionContext,
  id: string,
): ProjectionBundle<DecisionRecord> {
  return projectSingle(buildDecisionRecord(context, id));
}

export function projectDecisionCatalog(
  context: ProjectionContext,
): ProjectionBundle<DecisionCatalog> {
  return buildDecisionCatalog(context);
}
