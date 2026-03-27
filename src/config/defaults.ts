/**
 * @architect
 * @architect-core @architect-config
 * @architect-pattern ConfigurationDefaults
 * @architect-status completed
 * @architect-arch-layer domain
 * @architect-arch-context config
 * @architect-used-by ArchitectFactory, PatternScanner, LintRules, DetectChanges, AntiPatternDetector
 *
 * ## Configuration Defaults
 *
 * Centralized default constants for the Architect package.
 * These defaults are used when no custom configuration or registry is provided.
 *
 * ### Why Centralize?
 *
 * Previously, the default tag prefix string `"@architect-"` appeared in 6+ files.
 * Centralizing eliminates duplication and provides a single source of truth.
 *
 * ### When to Use
 *
 * - Import these defaults when implementing functions that need fallback values
 * - Use `DEFAULT_REGEX_BUILDERS` for opt-in detection when no registry is provided
 * - Use `DEFAULT_TAG_PREFIX` in error messages when no registry context exists
 * - Use `DEFAULT_CONTEXT_INFERENCE_RULES` to auto-infer bounded contexts from paths
 */

import { createRegexBuilders, type RegexBuilders } from './regex-builders.js';
import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';

/**
 * Default tag prefix for @architect-* annotations.
 *
 * This is the prefix used when:
 * - No `TagRegistry` is provided to a function
 * - Error messages need to reference the tag format
 *
 * @example
 * ```typescript
 * const tagPrefix = registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
 * ```
 */
export const DEFAULT_TAG_PREFIX = '@architect-';

/**
 * Default file opt-in tag (without suffix).
 *
 * Files must contain this exact tag (in a JSDoc comment) to be included
 * in documentation generation. This is distinct from directive tags
 * which have suffixes like `@architect-pattern`.
 *
 * @example
 * ```typescript
 * // File with opt-in:
 * /** @architect This file is documented *\/
 * ```
 */
export const DEFAULT_FILE_OPT_IN_TAG = '@architect';

/**
 * Pre-built regex builders using default prefix and opt-in tag.
 * The builders are created once at module load time for efficiency.
 *
 * @example
 * ```typescript
 * const builders = registry
 *   ? createRegexBuilders(registry.tagPrefix, registry.fileOptInTag)
 *   : DEFAULT_REGEX_BUILDERS;
 * return builders.hasFileOptIn(content);
 * ```
 */
export const DEFAULT_REGEX_BUILDERS: RegexBuilders = createRegexBuilders(
  DEFAULT_TAG_PREFIX,
  DEFAULT_FILE_OPT_IN_TAG
);

/**
 * Default context inference rules for auto-inferring bounded context from file paths.
 *
 * These rules map directory paths to bounded context names. When a pattern has
 * an `@architect-arch-layer` but no explicit `@architect-arch-context`, the
 * context is inferred from the file path using these rules.
 *
 * **Why This Exists:**
 * In most codebases, directory structure already implies bounded context:
 * - `src/validation/` → validation context
 * - `src/lint/` → lint context
 * - `src/generators/` → generator context
 *
 * Auto-inference eliminates redundant annotations while preserving the ability
 * to override with explicit `@architect-arch-context` when needed.
 *
 * @example
 * ```typescript
 * // Pattern at src/validation/rules.ts with @architect-arch-layer:application
 * // will automatically get archContext='validation' without explicit annotation
 * ```
 */
export const DEFAULT_CONTEXT_INFERENCE_RULES: readonly ContextInferenceRule[] = [
  { pattern: 'src/validation/**', context: 'validation' },
  { pattern: 'src/scanner/**', context: 'scanner' },
  { pattern: 'src/lint/**', context: 'lint' },
  { pattern: 'src/config/**', context: 'config' },
  { pattern: 'src/taxonomy/**', context: 'taxonomy' },
  { pattern: 'src/generators/**', context: 'generator' },
  { pattern: 'src/renderable/**', context: 'renderer' },
  { pattern: 'src/extractor/**', context: 'extractor' },
  { pattern: 'src/api/**', context: 'api' },
  { pattern: 'src/cli/**', context: 'cli' },
  { pattern: 'src/types/**', context: 'types' },
] as const;
