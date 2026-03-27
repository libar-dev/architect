/**
 * @architect
 * @architect-pattern ContextInferenceImpl
 * @architect-status completed
 * @architect-implements ContextInference
 * @architect-arch-role utility
 * @architect-arch-context generator
 * @architect-arch-layer application
 * @architect-used-by TransformDataset
 *
 * ## ContextInference - File Path Based Context Resolution
 *
 * Auto-infers bounded context from file paths using configurable rules.
 * Reduces annotation redundancy when directory structure already implies
 * the bounded context.
 */

/**
 * Rule for auto-inferring bounded context from file paths.
 *
 * When a pattern has an architecture layer (`@architect-arch-layer`) but no explicit
 * context (`@architect-arch-context`), these rules can infer the context from the
 * file path. This reduces annotation redundancy when directory structure already
 * implies the bounded context.
 *
 * @example
 * ```typescript
 * const rules: ContextInferenceRule[] = [
 *   { pattern: 'src/validation/**', context: 'validation' },
 *   { pattern: 'src/lint/**', context: 'lint' },
 * ];
 * // File at src/validation/rules.ts will get archContext='validation' if not explicit
 * ```
 */
export interface ContextInferenceRule {
  /** Glob pattern to match file paths (e.g., 'src/validation/**') */
  readonly pattern: string;
  /** Default context name to assign when pattern matches */
  readonly context: string;
}

/**
 * Infer bounded context from file path using configured rules.
 *
 * Iterates through rules in order and returns the context from the first
 * matching pattern. Returns undefined if no rules match.
 *
 * Pattern matching supports:
 * - Simple prefix matching: `src/validation/` matches files in that directory
 * - Glob-style wildcards: `src/validation/**` matches all files recursively
 *
 * @param filePath - The source file path to check
 * @param rules - Ordered list of inference rules
 * @returns The inferred context name, or undefined if no match
 */
export function inferContext(
  filePath: string,
  rules: readonly ContextInferenceRule[] | undefined
): string | undefined {
  if (!rules || rules.length === 0) return undefined;

  for (const rule of rules) {
    if (matchPattern(filePath, rule.pattern)) {
      return rule.context;
    }
  }
  return undefined;
}

/**
 * Simple pattern matching for file paths.
 *
 * Supports:
 * - Exact prefix matching: `src/validation/` matches `src/validation/foo.ts`
 * - Glob-style `**` wildcard: `src/validation/**` matches all files recursively
 *
 * @param filePath - The file path to check
 * @param pattern - The pattern to match against
 * @returns true if the file path matches the pattern
 */
function matchPattern(filePath: string, pattern: string): boolean {
  // Handle `**` wildcard patterns (recursive match)
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3); // Remove '/**'
    return hasPathPrefix(filePath, prefix);
  }

  // Handle `/*` wildcard patterns (single level match)
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2); // Remove '/*'
    if (!hasPathPrefix(filePath, prefix)) {
      return false;
    }

    const afterPrefix = filePath.slice(prefix.length + 1);
    return afterPrefix.length > 0 && !afterPrefix.includes('/');
  }

  // Simple prefix matching
  if (pattern.endsWith('/')) {
    return hasPathPrefix(filePath, pattern.slice(0, -1));
  }

  return filePath === pattern || filePath.startsWith(`${pattern}/`);
}

function hasPathPrefix(filePath: string, prefix: string): boolean {
  return filePath === prefix || filePath.startsWith(`${prefix}/`);
}
