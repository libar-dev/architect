/**
 * @architect
 * @architect-pattern TaxonomyDigestProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses GovernanceProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Produces a `TaxonomyDigest` fragment that describes the
 * project's tag registry — roles, domain-bucketed metadata tags, aggregation
 * tags, and format-type examples — so documentation surfaces render one
 * canonical taxonomy without reaching into `context.graph.tagRegistry`.
 *
 * **Invariant:** Per-call `exampleOverrides` apply only to the current
 * invocation and are recorded on the returned fragment's `exampleOverrides`
 * field; a subsequent call without overrides returns the default examples
 * and descriptions; options are parsed through
 * `TaxonomyDigestOptionsSchema`.
 *
 * **Behavior:**
 * - Groups roles first (sorted by `priority` then `tag`), then metadata tags
 *   bucketed into Core / Relationship / Timeline / ADR / Architecture /
 *   Other, then aggregation tags sorted by tag name.
 * - Fills each metadata tag entry with `required`, `repeatable`, enum
 *   `values`, `defaultValue`, and an example falling back to
 *   `<tagPrefix><tag> ...` when none is declared.
 * - Merges overrides into the `FORMAT_TYPES` entries for description and
 *   example without mutating the default map.
 *
 * ### When to Use
 *
 * - Projects the governance taxonomy digest and merges per-call example overrides without mutating the default examples.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type {
  TaxonomyDigest,
  TaxonomyDigestCountSummary,
} from '../../fragments/governance/index.js';
import {
  TaxonomyDigestOptionsSchema,
  buildTaxonomyDigest,
  type TaxonomyDigestOptions,
} from './taxonomy-digest.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { TaxonomyDigestOptionsSchema } from './taxonomy-digest.internal.js';

export function summarizeTaxonomyDigest(digest: TaxonomyDigest): TaxonomyDigestCountSummary {
  const allEntries = digest.tags.flatMap((group) => group.entries);
  const roles = allEntries.filter((entry) => entry.kind === 'role').length;
  const metadata = allEntries.filter((entry) => entry.kind === 'metadata').length;
  const aggregation = allEntries.filter((entry) => entry.kind === 'aggregation').length;

  return {
    roles,
    metadata,
    aggregation,
    total: roles + metadata + aggregation,
  };
}

export function projectTaxonomyDigest(
  context: ProjectionContext,
  options: TaxonomyDigestOptions = {},
): ProjectionBundle<TaxonomyDigest> {
  const exampleOverrides = {
    ...(context.tagExampleOverrides ?? {}),
    ...(options.exampleOverrides ?? {}),
  };

  return projectSingle(
    buildTaxonomyDigest(context, {
      ...options,
      ...(Object.keys(exampleOverrides).length > 0 ? { exampleOverrides } : {}),
    }),
  );
}

export const parseAndProjectTaxonomyDigest = parseAndProject(
  TaxonomyDigestOptionsSchema,
  projectTaxonomyDigest,
  'parseAndProjectTaxonomyDigest',
  {},
);
