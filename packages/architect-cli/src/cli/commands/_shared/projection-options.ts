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

export function buildBusinessRuleSetProjectionOptions(
  flags: Readonly<Record<string, unknown>>,
): BusinessRuleSetOptions {
  const typedFlags = flags as {
    readonly productArea?: string;
    readonly pattern?: string;
    readonly package?: string;
    readonly feature?: string;
    readonly onlyInvariants?: boolean;
  };

  const scopeFilters = [
    typedFlags.productArea,
    typedFlags.pattern,
    typedFlags.package,
    typedFlags.feature,
  ].filter((value) => value !== undefined);

  if (scopeFilters.length > 1) {
    throw new Error('--pattern, --product-area, --package, and --feature cannot be combined');
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
