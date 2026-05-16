export const CONVENTION_VALUES = [
  'testing-policy',
  'fsm-rules',
  'cli-patterns',
  'output-format',
  'pattern-naming',
  'session-workflow',
  'annotation-system',
  'pipeline-architecture',
  'publishing',
  'doc-generation',
  'taxonomy-rules',
  'codec-registry',
  'process-guard-errors',
] as const;

export type ConventionValue = (typeof CONVENTION_VALUES)[number];
