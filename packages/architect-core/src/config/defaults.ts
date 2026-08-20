/**
 * @architect
 * @architect-pattern ConfigDefaults
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:configuration
 *
 * ## ConfigDefaults - Canonical Default Configuration
 *
 * The single source of truth for Architect's out-of-the-box configuration:
 * `DEFAULT_TAG_PREFIX`, `DEFAULT_FILE_OPT_IN_TAG`, the default output
 * directories, and `DEFAULT_CONTEXT_INFERENCE_RULES` — the path-glob ruleset
 * that seeds every non-hand-authored `@architect-bounded-context` value
 * (ADR-001 / ADR-007). A high-fan-in shared seam imported across the
 * toolchain; it owns no outbound pattern edges (its many references are
 * importers, surfaced via the derived `usedBy` reverse edge).
 *
 * ### When to Use
 *
 * - Resolving the effective tag prefix, opt-in tag, or output directory when a
 *   project config omits them.
 * - Seeding or extending the context-inference ruleset consumed by
 *   `inferContext()`.
 * - Establishing the baseline a `ProjectConfigLoader` merges user overrides on
 *   top of.
 */
import { type RegexBuilders, createRegexBuilders } from './regex-builders.js';
import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';

export const DEFAULT_TAG_PREFIX = '@architect-';

export const DEFAULT_FILE_OPT_IN_TAG = '@architect';

export const DEFAULT_REGEX_BUILDERS: RegexBuilders = createRegexBuilders(
  DEFAULT_TAG_PREFIX,
  DEFAULT_FILE_OPT_IN_TAG,
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
