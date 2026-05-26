/**
 * @architect-bounded-context:documentation-composition
 */
import type { DisclosureSpec } from '../../disclosure/spec.js';
import type { ProgressiveDisclosureLevel } from '../../disclosure/levels.js';

export type DocumentationDisclosureMatrix = Readonly<
  Record<ProgressiveDisclosureLevel, DisclosureSpec>
>;

const DEFAULT_COMMITTED_FILTER = {
  maturity: ['plan', 'design', 'executable'],
  status: ['active', 'completed'],
} as const satisfies DisclosureSpec['filter'];

const DEFAULT_USEFUL_FILTER = {
  maturity: ['design', 'executable'],
  status: ['active', 'completed'],
} as const satisfies DisclosureSpec['filter'];

const PLANNED_WORK_FILTER = {
  maturity: ['plan', 'design'],
  status: ['roadmap', 'deferred'],
} as const satisfies DisclosureSpec['filter'];

function disclosureSpec(
  grouping: DisclosureSpec['grouping'],
  richness: DisclosureSpec['richness'],
  emitChildren: boolean,
  committed: boolean,
  filter?: DisclosureSpec['filter'],
  rootShape?: DisclosureSpec['rootShape'],
): DisclosureSpec {
  return {
    grouping,
    richness,
    ...(rootShape !== undefined ? { rootShape } : {}),
    emitChildren,
    committed,
    ...(filter !== undefined ? { filter } : {}),
  };
}

function disclosureMatrix(matrix: DocumentationDisclosureMatrix): DocumentationDisclosureMatrix {
  return {
    essential: { ...matrix.essential, filter: matrix.essential.filter ?? DEFAULT_COMMITTED_FILTER },
    important: { ...matrix.important, filter: matrix.important.filter ?? DEFAULT_COMMITTED_FILTER },
    useful: { ...matrix.useful, filter: matrix.useful.filter ?? DEFAULT_USEFUL_FILTER },
    advanced: omitFilter(matrix.advanced),
  };
}

function omitFilter(spec: DisclosureSpec): DisclosureSpec {
  return {
    grouping: spec.grouping,
    richness: spec.richness,
    ...(spec.rootShape !== undefined ? { rootShape: spec.rootShape } : {}),
    emitChildren: spec.emitChildren,
    committed: spec.committed,
  };
}

export function freezeDisclosureMatrix(
  matrix: DocumentationDisclosureMatrix,
): DocumentationDisclosureMatrix {
  freezeDisclosureSpec(matrix.essential);
  freezeDisclosureSpec(matrix.important);
  freezeDisclosureSpec(matrix.useful);
  freezeDisclosureSpec(matrix.advanced);
  return Object.freeze(matrix);
}

export function freezeDisclosureSpec(spec: DisclosureSpec): DisclosureSpec {
  if (spec.filter !== undefined) {
    freezeProjectionFilter(spec.filter);
  }

  return Object.freeze(spec);
}

function freezeProjectionFilter(
  filter: NonNullable<DisclosureSpec['filter']>,
): NonNullable<DisclosureSpec['filter']> {
  if (filter.maturity !== undefined) {
    Object.freeze(filter.maturity);
  }

  if (filter.status !== undefined) {
    Object.freeze(filter.status);
  }

  return Object.freeze(filter);
}

const flatSummaryDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'summary', false, true),
  important: disclosureSpec('flat', 'summary', false, true),
  useful: disclosureSpec('flat', 'summary', false, true),
  advanced: disclosureSpec('flat', 'summary', false, true),
});

// Architecture emits its lens child docs (package-seam, layered) at every level — the
// root component view stays a flat summary, but the bundle children are always routed out.
export const architectureDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'summary', true, true),
  important: disclosureSpec('flat', 'summary', true, true),
  useful: disclosureSpec('flat', 'summary', true, true),
  advanced: disclosureSpec('flat', 'summary', true, true),
});

export const decisionsDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'name-only', false, true),
  important: disclosureSpec('flat', 'summary', true, true),
  useful: disclosureSpec('flat', 'full', true, true),
  advanced: disclosureSpec('flat', 'full', true, true),
});

export const businessRulesDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('package', 'name-only', true, true),
  important: disclosureSpec('package', 'summary', true, true, undefined, 'navigation'),
  useful: disclosureSpec('feature', 'summary-with-references', false, false),
  advanced: disclosureSpec('feature', 'full', false, false),
});

export const patternsDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('package', 'name-only', false, true),
  important: disclosureSpec('package', 'summary', false, true),
  useful: disclosureSpec('per-entity', 'full', true, false),
  advanced: disclosureSpec('per-entity', 'full', true, false),
});

export const roadmapDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('phase', 'summary', false, true, PLANNED_WORK_FILTER),
  important: disclosureSpec('phase', 'summary', true, true, PLANNED_WORK_FILTER),
  useful: disclosureSpec('phase', 'full', true, true, PLANNED_WORK_FILTER),
  advanced: disclosureSpec('phase', 'full', true, true),
});

export const currentWorkDisclosureMatrix = flatSummaryDisclosureMatrix;

export const requirementsDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('package', 'name-only', false, true),
  important: disclosureSpec('package', 'summary', false, true),
  useful: disclosureSpec('per-entity', 'full', true, false),
  advanced: disclosureSpec('per-entity', 'full', true, false),
});

export const validationRulesDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'name-only', false, true),
  important: disclosureSpec('flat', 'summary', false, true),
  useful: disclosureSpec('flat', 'full', false, true),
  advanced: disclosureSpec('flat', 'full', false, true),
});

export const taxonomyDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'summary', false, true),
  important: disclosureSpec('flat', 'full', true, true),
  useful: disclosureSpec('flat', 'full', true, true),
  advanced: disclosureSpec('flat', 'full', true, true),
});

export const changelogDisclosureMatrix = flatSummaryDisclosureMatrix;

export const traceabilityDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'summary', false, true),
  important: disclosureSpec('flat', 'full', false, true),
  useful: disclosureSpec('flat', 'full', false, true),
  advanced: disclosureSpec('flat', 'full', false, true),
});
