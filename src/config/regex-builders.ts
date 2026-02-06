/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern RegexBuilders
 * @libar-docs-status completed
 * @libar-docs-uses ConfigurationTypes
 * @libar-docs-used-by DeliveryProcessFactory
 * @libar-docs-extract-shapes createRegexBuilders
 *
 * ## Regex Builders
 *
 * Type-safe regex factory functions for tag detection and normalization.
 * Creates regex patterns based on configured tag prefix.
 *
 * ### When to Use
 *
 * - When creating a new delivery process instance
 * - When detecting doc directives in source code
 * - When normalizing tags for comparison
 */

import type { RegexBuilders } from './types.js';

// Re-export the type for consumers
export type { RegexBuilders } from './types.js';

/**
 * Escapes special regex characters in a string
 *
 * @param str - String to escape
 * @returns Escaped string safe for regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates type-safe regex builders for a given tag prefix configuration.
 * These are used throughout the scanner and validation pipeline.
 *
 * @param tagPrefix - The tag prefix (e.g., "@docs-" or "@libar-docs-")
 * @param fileOptInTag - The file opt-in tag (e.g., "@docs" or "@libar-docs")
 * @returns RegexBuilders instance with pattern matching methods
 *
 * @example
 * ```typescript
 * const builders = createRegexBuilders("@docs-", "@docs");
 *
 * // Check for file opt-in
 * if (builders.hasFileOptIn(sourceCode)) {
 *   console.log("File has @docs marker");
 * }
 *
 * // Normalize a tag
 * const normalized = builders.normalizeTag("@docs-pattern");
 * // Returns: "pattern"
 * ```
 */
export function createRegexBuilders(tagPrefix: string, fileOptInTag: string): RegexBuilders {
  const escapedPrefix = escapeRegex(tagPrefix);
  const escapedOptIn = escapeRegex(fileOptInTag);

  // Match file-level opt-in: /** @docs */ (not followed by -)
  // This ensures @docs is not confused with @docs-pattern
  const fileOptInPattern = new RegExp(`\\/\\*\\*[\\s\\S]*?${escapedOptIn}(?!-)[\\s\\S]*?\\*\\/`);

  // Match directives: @docs-pattern, @docs-status, etc.
  const directivePattern = new RegExp(`${escapedPrefix}[\\w-]+`, 'g');

  // For normalizing tags - remove @ and prefix
  const prefixWithoutAt = tagPrefix.startsWith('@') ? tagPrefix.substring(1) : tagPrefix;

  return {
    fileOptInPattern,
    directivePattern,

    hasFileOptIn(content: string): boolean {
      return fileOptInPattern.test(content);
    },

    hasDocDirectives(content: string): boolean {
      // Reset lastIndex to handle global regex state
      directivePattern.lastIndex = 0;
      return directivePattern.test(content);
    },

    normalizeTag(tag: string): string {
      let normalized = tag.startsWith('@') ? tag.substring(1) : tag;
      if (normalized.startsWith(prefixWithoutAt)) {
        normalized = normalized.substring(prefixWithoutAt.length);
      }
      return normalized;
    },
  };
}
