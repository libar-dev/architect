/**
 * Canonical generator list shared by both architect.config.ts files (the
 * Studio config at repo root and the package config at packages/architect/).
 * The two configs previously hand-maintained byte-identical 12-entry arrays;
 * exporting them from a single source removes a drift surface and keeps
 * generator key defaults centralized in architect-core without duplicating the
 * projection-owned documentation display/path registry.
 */
export const DEFAULT_GENERATORS = [
  'architecture',
  'decisions',
  'business-rules',
  'patterns',
  'roadmap',
  'current-work',
  'requirements-executable',
  'requirements-specs',
  'validation-rules',
  'taxonomy',
  'changelog',
  'traceability',
  'index',
] as const;

export type DefaultGenerator = (typeof DEFAULT_GENERATORS)[number];
