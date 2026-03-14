/**
 * @architect
 * @architect-core
 * @architect-pattern PatternIdGenerator
 * @architect-status completed
 * @architect-used-by DocExtractor, GherkinExtractor
 *
 * ## Pattern ID Generator - Deterministic ID Generation
 *
 * Generates unique, deterministic pattern IDs based on file path and line number.
 * Uses MD5 hashing to produce stable 8-character identifiers.
 *
 * ### When to Use
 *
 * - When extracting patterns from TypeScript or Gherkin files
 * - When needing stable IDs that survive re-extraction
 * - When correlating patterns across multiple extraction runs
 *
 * ### Key Concepts
 *
 * - **Deterministic**: Same file + line always produces same ID
 * - **Collision-resistant**: MD5 hash provides adequate uniqueness for pattern counts
 * - **Human-friendly prefix**: `pattern-` prefix aids debugging and identification
 */

import * as crypto from 'crypto';

/**
 * Generate a deterministic pattern ID from file path and line number
 *
 * Creates a unique identifier based on the combination of file path and
 * starting line number. The same inputs will always produce the same output,
 * making pattern IDs stable across multiple extraction runs.
 *
 * @param filePath - Relative file path (e.g., 'src/utils.ts')
 * @param line - Line number where the pattern starts
 * @returns Pattern ID in format 'pattern-{8-char-hash}'
 *
 * @example
 * ```typescript
 * const id1 = generatePatternId('src/utils.ts', 42);
 * const id2 = generatePatternId('src/utils.ts', 42);
 *
 * console.log(id1 === id2); // true (deterministic)
 * console.log(id1); // 'pattern-a1b2c3d4'
 * ```
 */
export function generatePatternId(filePath: string, line: number): string {
  const input = `${filePath}:${line}`;
  const hash = crypto.createHash('md5').update(input).digest('hex').slice(0, 8);
  return `pattern-${hash}`;
}
