import { createPackageResolver, type PackageResolver } from '@libar-dev/architect-core';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  BusinessRuleSetSchema,
  type BusinessRuleSet,
} from '../../../src/fragments/governance/business-rule-set.js';
import { parseAndProjectBusinessRuleSet, type ProjectionContext } from '../../../src/index.js';
import {
  BusinessRuleGroupingSchema,
  BusinessRuleScopeSchema,
} from '../../../src/fragments/governance/supporting.js';
import {
  createPattern,
  createProjectionContext,
  createRule,
} from '../projections/governance/support.js';

interface ScopeState {
  parseResult: ReturnType<typeof BusinessRuleSetSchema.safeParse> | null;
  parsed: BusinessRuleSet | null;
  groupingParseResult: ReturnType<typeof BusinessRuleGroupingSchema.safeParse> | null;
  fixture: unknown;
  roundTripped: BusinessRuleSet | null;
  runtimeContext: ProjectionContext | null;
  runtimeKeys: string[];
  previousRuntimeKeys: string[];
  filteredRules: BusinessRuleSet['rules'];
}

let state: ScopeState | null = null;

function init(): ScopeState {
  return {
    parseResult: null,
    parsed: null,
    groupingParseResult: null,
    fixture: null,
    roundTripped: null,
    runtimeContext: null,
    runtimeKeys: [],
    previousRuntimeKeys: [],
    filteredRules: [],
  };
}

function createPackageGroupingRuntimeContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('StudioCoreRules', {
        file: 'packages/architect-core/src/config/package-resolver.ts',
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Core runtime rule',
            description: '**Invariant:** Package grouping reflects configured resolver output.',
            scenarioNames: ['package config swap changes bucketing without code changes'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('StudioProjectionRules', {
        file: 'packages/architect-projection/src/projections/governance/business-rules.ts',
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Projection runtime rule',
            description: '**Invariant:** Package grouping reflects configured resolver output.',
            scenarioNames: ['package config swap changes bucketing without code changes'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('StudioProjectionRulesTwo', {
        file: 'packages/architect-projection/src/renderers/render-markdown.ts',
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Projection renderer rule',
            description: '**Invariant:** Package grouping reflects configured resolver output.',
            scenarioNames: ['package config swap changes bucketing without code changes'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('DesktopRules', {
        file: 'apps/desktop/src/main/architect-mcp.ts',
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Desktop runtime rule',
            description: '**Invariant:** Package grouping reflects configured resolver output.',
            scenarioNames: ['package config swap changes bucketing without code changes'],
            scenarioCount: 1,
          }),
        ],
      }),
    ],
  });
}

function createStudioStyleResolver(): PackageResolver {
  return createPackageResolver([
    { id: 'architect-core', displayName: 'architect-core', match: /^packages\/architect-core\//u },
    {
      id: 'architect-projection',
      displayName: 'architect-projection',
      match: /^packages\/architect-projection\//u,
    },
    { id: 'desktop', displayName: 'desktop', match: /^apps\/desktop\//u },
  ]);
}

function createArchitectPkgStyleResolver(): PackageResolver {
  return createPackageResolver([
    {
      id: 'projection-runtime',
      displayName: 'projection-runtime',
      match: /^packages\/architect-(core|projection)\//u,
    },
    { id: 'desktop', displayName: 'desktop', match: /^apps\/desktop\//u },
  ]);
}

function makePackageFixture(scopeValue: string): unknown {
  return {
    kind: 'BusinessRuleSet',
    scope: 'package',
    scopeValue,
    rules: [],
  };
}

const feature = await loadFeature(
  'tests/features/fragments/business-rule-set-package-scope.feature',
);

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the BusinessRuleSet schema is loaded', () => {
      state = init();
    });
  });

  Rule("Schema round-trips a 'package' scope branch", ({ RuleScenario }) => {
    RuleScenario(
      'Schema accepts a package-scoped BusinessRuleSet fixture',
      ({ When, Then, And }) => {
        When(
          'parsing a BusinessRuleSet fixture with scope {string} and scopeValue {string}',
          (_ctx: unknown, _scope: string, scopeValue: string) => {
            state!.fixture = makePackageFixture(scopeValue);
            state!.parseResult = BusinessRuleSetSchema.safeParse(state!.fixture);
            if (state!.parseResult.success) {
              state!.parsed = state!.parseResult.data;
            }
          },
        );

        Then('the parse should succeed', () => {
          expect(state!.parseResult?.success).toBe(true);
        });

        And('the parsed scope should be {string}', (_ctx: unknown, scope: string) => {
          expect(state!.parsed?.scope).toBe(scope);
        });

        And('the parsed scopeValue should be {string}', (_ctx: unknown, scopeValue: string) => {
          expect(
            state!.parsed && 'scopeValue' in state!.parsed
              ? (state!.parsed as { scopeValue: unknown }).scopeValue
              : null,
          ).toBe(scopeValue);
        });
      },
    );

    RuleScenario(
      "Schema accepts the 'package' literal in BusinessRuleGroupingSchema",
      ({ When, Then }) => {
        When('parsing the grouping literal {string}', (_ctx: unknown, literal: string) => {
          state!.groupingParseResult = BusinessRuleGroupingSchema.safeParse(literal);
        });

        Then('the grouping parse should succeed', () => {
          expect(state!.groupingParseResult?.success).toBe(true);
        });
      },
    );

    RuleScenario('Round-trip preserves the package-scoped shape', ({ When, Then }) => {
      When(
        'round-tripping a BusinessRuleSet fixture with scope {string} and scopeValue {string}',
        (_ctx: unknown, _scope: string, scopeValue: string) => {
          state!.fixture = makePackageFixture(scopeValue);
          const parsed = BusinessRuleSetSchema.parse(state!.fixture);
          const json = JSON.stringify(parsed);
          state!.roundTripped = BusinessRuleSetSchema.parse(JSON.parse(json));
        },
      );

      Then('the round-tripped value should equal the original fixture', () => {
        expect(state!.roundTripped).toEqual(state!.fixture);
      });
    });
  });

  Rule('Supporting scope schema lists the new literal in canonical order', ({ RuleScenario }) => {
    RuleScenario('BusinessRuleScopeSchema includes the canonical literals in order', ({ Then }) => {
      Then('the BusinessRuleScope literals should equal {string}', (_ctx: unknown, csv: string) => {
        const expected = csv.split(',').map((part) => part.trim());
        expect([...BusinessRuleScopeSchema.options]).toEqual(expected);
      });
    });
  });

  Rule(
    'Runtime package config swap changes grouping without changing source patterns',
    ({ RuleScenario }) => {
      RuleScenario(
        'package config swap changes bucketing without code changes',
        ({ Given, When, Then, And }) => {
          Given('a BusinessRuleSet sourced from 4 patterns across 3 workspace packages', () => {
            state!.runtimeContext = createPackageGroupingRuntimeContext();
          });

          When('I project the bundle with a Studio-style packages config', () => {
            const context = state!.runtimeContext;
            if (context === null) {
              throw new Error('Runtime context not initialized');
            }
            const bundle = parseAndProjectBusinessRuleSet(
              { ...context, packageResolver: createStudioStyleResolver() },
              { scope: 'all', groupedBy: 'package' },
            );
            state!.previousRuntimeKeys = [];
            state!.runtimeKeys = Object.keys(bundle.children).sort();
          });

          Then(
            'the children should include {string} and {string}',
            (_ctx: unknown, left: string, right: string) => {
              expect(state!.runtimeKeys).toContain(left);
              expect(state!.runtimeKeys).toContain(right);
            },
          );

          When('I project the same bundle with an architect-pkg-style packages config', () => {
            const context = state!.runtimeContext;
            if (context === null) {
              throw new Error('Runtime context not initialized');
            }
            state!.previousRuntimeKeys = [...state!.runtimeKeys];
            const bundle = parseAndProjectBusinessRuleSet(
              { ...context, packageResolver: createArchitectPkgStyleResolver() },
              { scope: 'all', groupedBy: 'package' },
            );
            state!.runtimeKeys = Object.keys(bundle.children).sort();
          });

          Then('the children keys should differ from the previous run', () => {
            expect(state!.runtimeKeys).not.toEqual(state!.previousRuntimeKeys);
          });

          And('no source code changed between the two runs', () => {
            expect(
              state!.runtimeContext?.graph.patterns.map((pattern) => pattern.source.file),
            ).toEqual([
              'packages/architect-core/src/config/package-resolver.ts',
              'packages/architect-projection/src/projections/governance/business-rules.ts',
              'packages/architect-projection/src/renderers/render-markdown.ts',
              'apps/desktop/src/main/architect-mcp.ts',
            ]);
          });
        },
      );
    },
  );

  Rule('The package scope filter matches by the resolver package id', ({ RuleScenario }) => {
    RuleScenario('Package filter selects rules by resolver id', ({ Given, When, Then, And }) => {
      Given('a BusinessRuleSet sourced from 4 patterns across 3 workspace packages', () => {
        state!.runtimeContext = createPackageGroupingRuntimeContext();
      });

      When('I project the rule set filtered to package {string}', (_ctx: unknown, pkg: string) => {
        const context = state!.runtimeContext;
        if (context === null) {
          throw new Error('Runtime context not initialized');
        }
        state!.filteredRules = parseAndProjectBusinessRuleSet(context, {
          scope: 'package',
          scopeValue: pkg,
        }).root.rules;
      });

      Then('every projected rule should carry package {string}', (_ctx: unknown, pkg: string) => {
        expect(state!.filteredRules.every((rule) => rule.package === pkg)).toBe(true);
      });

      And('at least one rule should be projected', () => {
        expect(state!.filteredRules.length).toBeGreaterThan(0);
      });
    });

    RuleScenario('Scoped package form matches nothing', ({ Given, When, Then }) => {
      Given('a BusinessRuleSet sourced from 4 patterns across 3 workspace packages', () => {
        state!.runtimeContext = createPackageGroupingRuntimeContext();
      });

      When('I project the rule set filtered to package {string}', (_ctx: unknown, pkg: string) => {
        const context = state!.runtimeContext;
        if (context === null) {
          throw new Error('Runtime context not initialized');
        }
        state!.filteredRules = parseAndProjectBusinessRuleSet(context, {
          scope: 'package',
          scopeValue: pkg,
        }).root.rules;
      });

      Then('no rules should be projected', () => {
        expect(state!.filteredRules).toHaveLength(0);
      });
    });
  });
});
