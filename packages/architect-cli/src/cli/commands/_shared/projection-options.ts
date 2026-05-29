import { ScopeTypeSchema, type ScopeType } from '@libar-dev/architect-core';
import { type BusinessRuleSetOptions } from '@libar-dev/architect-projection';
import { parseSchemaValue } from './schemas.js';

export function normalizeScopeValidateInput(
  positional: readonly string[],
  flags: Readonly<Record<string, unknown>>,
): { pattern: string; scopeType: ScopeType; strict: boolean } {
  const usage =
    'Usage: architect scope-validate <pattern> <design|implement> [--type <design|implement>] [--strict]';
  const typedFlags = flags as {
    readonly type?: ScopeType;
    readonly strict?: boolean;
  };

  const [pattern, positionalScopeType, ...rest] = positional;
  if (pattern === undefined || rest.length > 0) {
    throw new Error(usage);
  }

  let scopeTypeFromPositional: ScopeType | undefined;
  if (positionalScopeType !== undefined) {
    scopeTypeFromPositional = parseSchemaValue(
      ScopeTypeSchema,
      positionalScopeType,
      'Scope type must be design or implement',
    );
  }

  if (
    typedFlags.type !== undefined &&
    scopeTypeFromPositional !== undefined &&
    typedFlags.type !== scopeTypeFromPositional
  ) {
    throw new Error('Scope type conflict: positional value and --type must match');
  }

  const scopeType = typedFlags.type ?? scopeTypeFromPositional;
  if (scopeType === undefined) {
    throw new Error(usage);
  }

  return {
    pattern,
    scopeType,
    strict: typedFlags.strict === true,
  };
}

/**
 * The mutually-exclusive `rules` scope filters cannot be combined. Surfaced as
 * its own function so the CLI can reject the conflict BEFORE any per-flag value
 * resolution (package / decision fail-loud), keeping the usage error about
 * combining flags independent of whether each individual value is valid.
 */
export function assertSingleRuleScopeFilter(flags: Readonly<Record<string, unknown>>): void {
  const typedFlags = flags as {
    readonly productArea?: string;
    readonly pattern?: string;
    readonly package?: string;
    readonly feature?: string;
    readonly decision?: string;
  };

  const scopeFilters = [
    typedFlags.productArea,
    typedFlags.pattern,
    typedFlags.package,
    typedFlags.feature,
    typedFlags.decision,
  ].filter((value) => value !== undefined);

  if (scopeFilters.length > 1) {
    throw new Error(
      '--pattern, --product-area, --package, --feature, and --decision cannot be combined',
    );
  }
}

export function buildBusinessRuleSetProjectionOptions(
  flags: Readonly<Record<string, unknown>>,
): BusinessRuleSetOptions {
  const typedFlags = flags as {
    readonly productArea?: string;
    readonly pattern?: string;
    readonly package?: string;
    readonly feature?: string;
    readonly decision?: string;
    readonly onlyInvariants?: boolean;
  };

  assertSingleRuleScopeFilter(flags);

  if (typedFlags.decision !== undefined) {
    return {
      scope: 'decision',
      scopeValue: typedFlags.decision,
      onlyInvariants: typedFlags.onlyInvariants === true,
    };
  }
  if (typedFlags.pattern !== undefined) {
    return {
      scope: 'feature',
      scopeValue: typedFlags.pattern,
      onlyInvariants: typedFlags.onlyInvariants === true,
    };
  }
  if (typedFlags.productArea !== undefined) {
    return {
      scope: 'product-area',
      scopeValue: typedFlags.productArea,
      onlyInvariants: typedFlags.onlyInvariants === true,
    };
  }
  if (typedFlags.package !== undefined) {
    return {
      scope: 'package',
      scopeValue: typedFlags.package,
      onlyInvariants: typedFlags.onlyInvariants === true,
    };
  }
  if (typedFlags.feature !== undefined) {
    return {
      scope: 'feature',
      scopeValue: typedFlags.feature,
      featureMatch: 'path',
      onlyInvariants: typedFlags.onlyInvariants === true,
    };
  }
  return {
    scope: 'all',
    groupedBy: 'feature',
    onlyInvariants: typedFlags.onlyInvariants === true,
  };
}
