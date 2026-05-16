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
