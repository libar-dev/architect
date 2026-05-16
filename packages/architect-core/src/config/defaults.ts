import { type RegexBuilders, createRegexBuilders } from './regex-builders.js';
import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';

export const DEFAULT_TAG_PREFIX = '@architect-';

export const DEFAULT_FILE_OPT_IN_TAG = '@architect';

export const DEFAULT_REGEX_BUILDERS: RegexBuilders = createRegexBuilders(
  DEFAULT_TAG_PREFIX,
  DEFAULT_FILE_OPT_IN_TAG
);

export const DEFAULT_OUTPUT_DIRECTORY = 'docs-generated';

export const DEFAULT_PRESENTATION_OUTPUT_DIRECTORY = 'docs-live';

export const DEFAULT_CONTEXT_INFERENCE_RULES: readonly ContextInferenceRule[] = [
  { pattern: 'src/validation/**', context: 'validation' },
  { pattern: 'src/scanner/**', context: 'scanner' },
  { pattern: 'src/lint/**', context: 'lint' },
  { pattern: 'src/config/**', context: 'config' },
  { pattern: 'src/taxonomy/**', context: 'taxonomy' },
  { pattern: 'src/extractor/**', context: 'extractor' },
  { pattern: 'src/generators/**', context: 'generator' },
  { pattern: 'packages/architect-core/src/generators/**', context: 'generator' },
  { pattern: 'src/api/**', context: 'api' },
  { pattern: 'src/cli/**', context: 'cli' },
  { pattern: 'packages/architect-cli/src/cli/**', context: 'cli' },
  { pattern: 'packages/architect-guard/src/cli/**', context: 'cli' },
  { pattern: 'src/types/**', context: 'types' },
] as const;
