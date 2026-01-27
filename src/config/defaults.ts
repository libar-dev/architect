/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ConfigurationDefaults
 * @libar-docs-status completed
 * @libar-docs-used-by DeliveryProcessFactory, PatternScanner, LintRules, DetectChanges, AntiPatternDetector
 *
 * ## Configuration Defaults
 *
 * Centralized default constants for the delivery-process package.
 * These defaults are used when no custom configuration or registry is provided.
 *
 * ### Why Centralize?
 *
 * Previously, the default tag prefix string `"@libar-docs-"` appeared in 6+ files.
 * Centralizing eliminates duplication and provides a single source of truth.
 *
 * ### When to Use
 *
 * - Import these defaults when implementing functions that need fallback values
 * - Use `DEFAULT_REGEX_BUILDERS` for opt-in detection when no registry is provided
 * - Use `DEFAULT_TAG_PREFIX` in error messages when no registry context exists
 */

import { createRegexBuilders, type RegexBuilders } from './regex-builders.js';

/**
 * Default tag prefix for @libar-docs-* annotations.
 *
 * This is the prefix used when:
 * - No `TagRegistry` is provided to a function
 * - Error messages need to reference the tag format
 * - Backward compatibility with existing annotations is needed
 *
 * @example
 * ```typescript
 * const tagPrefix = registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
 * ```
 */
export const DEFAULT_TAG_PREFIX = '@libar-docs-';

/**
 * Default file opt-in tag (without suffix).
 *
 * Files must contain this exact tag (in a JSDoc comment) to be included
 * in documentation generation. This is distinct from directive tags
 * which have suffixes like `@libar-docs-pattern`.
 *
 * @example
 * ```typescript
 * // File with opt-in:
 * /** @libar-docs This file is documented *\/
 * ```
 */
export const DEFAULT_FILE_OPT_IN_TAG = '@libar-docs';

/**
 * Pre-built regex builders using default prefix and opt-in tag.
 *
 * Use this for backward compatibility in functions that previously
 * hardcoded the default prefix. The builders are created once at
 * module load time for efficiency.
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
