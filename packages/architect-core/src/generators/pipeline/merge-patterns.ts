import type { Result } from '../../types/result.js';
import { Result as R } from '../../types/result.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import { getPatternName } from '../../read-api/pattern-helpers.js';

export function mergePatterns(
  tsPatterns: readonly ExtractedPattern[],
  gherkinPatterns: readonly ExtractedPattern[],
): Result<readonly ExtractedPattern[], string> {
  const conflicts: string[] = [];
  const tsPatternNames = new Set(tsPatterns.map((pattern) => getPatternName(pattern)));

  for (const gherkinPattern of gherkinPatterns) {
    const patternName = getPatternName(gherkinPattern);
    if (tsPatternNames.has(patternName)) {
      conflicts.push(patternName);
    }
  }

  if (conflicts.length > 0) {
    return R.err(
      `Pattern conflicts detected: ${conflicts.join(', ')}. ` +
        `These patterns are defined in both TypeScript and Gherkin sources. ` +
        `Each pattern should only be defined in one source.`,
    );
  }

  return R.ok([...tsPatterns, ...gherkinPatterns]);
}
