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
