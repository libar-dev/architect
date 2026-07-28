/**
 * @architect
 * @architect-pattern:TagDirectiveRegexBuilders
 * @architect-status:completed
 * @architect-role:utility
 * @architect-bounded-context:configuration
 * @architect-uses ArchitectConfigContract
 *
 * ## TagDirectiveRegexBuilders — `@architect` Tag Recognition Primitives
 *
 * Compiles the prefix-aware regexes that detect the file opt-in marker and the
 * `@architect-*` directive tags in source text, and normalizes a matched tag to
 * its bare form. Parameterized by the configured tag prefix so the whole scanner
 * stack respects a custom prefix. The lexical primitive every scanner builds on.
 *
 * **When to Use:** when detecting or normalizing architect directive tags in raw
 * file content — do not hand-roll the prefix-escaping regex elsewhere.
 */

import type { RegexBuilders } from './types.js';

export type { RegexBuilders } from './types.js';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createRegexBuilders(tagPrefix: string, fileOptInTag: string): RegexBuilders {
  const escapedPrefix = escapeRegex(tagPrefix);
  const escapedOptIn = escapeRegex(fileOptInTag);

  const fileOptInPattern = new RegExp(`\\/\\*\\*[\\s\\S]*?${escapedOptIn}(?!-)[\\s\\S]*?\\*\\/`);
  const directivePattern = new RegExp(`${escapedPrefix}[\\w-]+`, 'g');
  const prefixWithoutAt = tagPrefix.startsWith('@') ? tagPrefix.substring(1) : tagPrefix;

  return {
    fileOptInPattern,
    directivePattern,

    hasFileOptIn(content: string): boolean {
      return fileOptInPattern.test(content);
    },

    hasDocDirectives(content: string): boolean {
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
