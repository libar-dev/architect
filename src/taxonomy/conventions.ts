/**
 * Convention tag values for reference document generation.
 *
 * Each value maps to a convention domain that can be used to tag
 * decision records with `@libar-docs-convention:value1,value2`.
 * Values correspond to convention domains extracted from the former
 * recipe .feature files, plus `codec-registry` for auto-generated codec docs.
 *
 * @see CodecDrivenReferenceGeneration spec
 */

export const CONVENTION_VALUES = [
  'testing-policy',
  'fsm-rules',
  'cli-patterns',
  'output-format',
  'pattern-naming',
  'session-workflow',
  'config-presets',
  'annotation-system',
  'pipeline-architecture',
  'publishing',
  'doc-generation',
  'taxonomy-rules',
  'codec-registry',
] as const;

export type ConventionValue = (typeof CONVENTION_VALUES)[number];
