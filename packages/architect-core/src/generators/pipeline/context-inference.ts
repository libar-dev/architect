/**
 * @architect
 * @architect-pattern ContextInference
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:pipeline
 *
 * ## ContextInference - Path-Based Bounded-Context Derivation
 *
 * `inferContext()` derives a pattern's bounded-context from its file path by
 * matching against an ordered set of `ContextInferenceRule` globs (first match
 * wins). This is the mechanism behind every non-authored
 * `@architect-bounded-context` value (ADR-001 / ADR-007): when a module does
 * not declare the tag explicitly, the projection pipeline falls back to this
 * derivation. The default ruleset is seeded by `ConfigDefaults`; the service
 * itself owns no outbound pattern edges.
 *
 * ### When to Use
 *
 * - Resolving the bounded-context of a pattern whose source omits an explicit
 *   `@architect-bounded-context` tag.
 * - Classifying a file path against the project's context-inference ruleset
 *   during graph composition.
 */
export interface ContextInferenceRule {
  readonly pattern: string;
  readonly context: string;
}

export function inferContext(
  filePath: string,
  rules: readonly ContextInferenceRule[] | undefined,
): string | undefined {
  if (!rules || rules.length === 0) {
    return undefined;
  }

  for (const rule of rules) {
    if (matchPattern(filePath, rule.pattern)) {
      return rule.context;
    }
  }

  return undefined;
}

function matchPattern(filePath: string, pattern: string): boolean {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return hasPathPrefix(filePath, prefix);
  }

  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);

    if (!hasPathPrefix(filePath, prefix)) {
      return false;
    }

    const afterPrefix = filePath.slice(prefix.length + 1);
    return afterPrefix.length > 0 && !afterPrefix.includes('/');
  }

  if (pattern.endsWith('/')) {
    return hasPathPrefix(filePath, pattern.slice(0, -1));
  }

  return filePath === pattern || filePath.startsWith(`${pattern}/`);
}

function hasPathPrefix(filePath: string, prefix: string): boolean {
  return filePath === prefix || filePath.startsWith(`${prefix}/`);
}
