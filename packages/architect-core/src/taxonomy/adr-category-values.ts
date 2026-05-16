/**
 * Canonical ADR/PDR category values per ADR-001 Rule 2.
 *
 * Keep this list aligned with the ADR-001 Rule 2 markdown table in
 * `architect/decisions/adr-001-taxonomy-canonical-values.feature`.
 * The canonical-values-sync test asserts equality between the two surfaces.
 */
export const ADR_CATEGORY_VALUES = ['architecture', 'process', 'testing', 'documentation'] as const;

export type AdrCategoryValue = (typeof ADR_CATEGORY_VALUES)[number];
