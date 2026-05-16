/**
 * Canonical generator list consumed by the dogfood architect.config.ts at repo
 * root. Centralizing here keeps generator key defaults co-located with
 * architect-core without duplicating the projection-owned documentation
 * display/path registry.
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
