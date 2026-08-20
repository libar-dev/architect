import type { AuthoredCore } from './schema.js';

export function fileToPatternMap(authored: AuthoredCore): Map<string, string> {
  const result = new Map<string, string>();
  for (const pattern of authored.patterns) {
    if (pattern.source?.file.endsWith('.ts') === true) {
      result.set(pattern.source.file, pattern.name);
    }
  }
  return result;
}
