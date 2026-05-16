/**
 * Canonical product-area list for the architect package family self-hosting.
 *
 * Mirrors ADR-001 Rule 1 in `architect/decisions/`. Edit
 * the ADR table and this constant together. The ADR is the decision record;
 * this constant is its TypeScript projection.
 *
 * Per ADR-001 Rule 1 (D-8 reshape): productAreas are an organizational
 * dimension for documentation grouping — purely project-specific
 * vocabulary. The list below is this package's choice; other projects may
 * use entirely different vocabulary by declaring their own list in
 * `architect.config.ts`. Projects with no list configured leave the
 * `@architect-product-area` tag unconstrained.
 */
export const ARCHITECT_PACKAGE_PRODUCT_AREAS = [
  'Annotation',
  'Configuration',
  'Generation',
  'Validation',
  'DataAPI',
  'CoreTypes',
  'Process',
  'Projection',
] as const;

export type ArchitectPackageProductArea = (typeof ARCHITECT_PACKAGE_PRODUCT_AREAS)[number];
