import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  FragmentSchema,
  filterPattern,
  filterPatterns,
  parseAndProjectBusinessRuleSet,
  projectBusinessRule,
  resolveProjectionFilter,
  renderJson,
  type BusinessRule,
  type BusinessRuleSet,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRule } from './support.js';

interface BusinessRuleProjectionState {
  context: ProjectionContext | null;
  rule: BusinessRule | null;
  bundle: ProjectionBundle<BusinessRuleSet> | null;
  invalidOptionsError: string | null;
}

const feature = await loadFeature('tests/features/projections/governance/business-rules.feature');

let state: BusinessRuleProjectionState | null = null;

function createState(): BusinessRuleProjectionState {
  return {
    context: null,
    rule: null,
    bundle: null,
    invalidOptionsError: null,
  };
}

function createBusinessRuleContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ProjectionMigration', {
        patternName: 'ProjectionMigration',
        phase: 49,
        productArea: 'Delivery Process',
        rules: [
          createRule({
            name: 'Fragments stay JSON-safe',
            description:
              '**Invariant:** Projection fragments may only contain JSON-safe values.\n**Rationale:** Renderer transport stays deterministic.\n**Verified by:** grouped business-rule-set children by product area slug',
            scenarioNames: [
              'grouped business-rule-set children by product area slug',
              'explicit taxonomy override behavior passes',
            ],
            scenarioCount: 2,
          }),
          createRule({
            name: 'Decision sections use blocks',
            description: '**Rationale:** Structured blocks keep rendering format-only.',
            scenarioNames: ['decision lookup / missing-decision behavior'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('RulesQueryAPI', {
        patternName: 'RulesQueryAPI',
        phase: 49,
        productArea: 'Data API',
        rules: [
          createRule({
            name: 'Rules keep product-area semantics',
            description: '**Invariant:** Product areas remain explicit in grouped bundles.',
            scenarioNames: ['grouped business-rule-set children by product area slug'],
            scenarioCount: 1,
          }),
        ],
      }),
    ],
  });
}

function createFilteredBusinessRuleContext(
  projectionFilter?: ProjectionContext['projectionFilter']
): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('CommittedRules', {
        status: 'active',
        maturity: 'design',
        productArea: 'Delivery Process',
        rules: [
          createRule({
            name: 'Committed rule',
            description: '**Invariant:** Committed work stays visible in default docs.',
            scenarioNames: ['default business-rule disclosure filters out candidate rules'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('CandidateRules', {
        status: 'candidate',
        maturity: 'idea',
        productArea: 'Delivery Process',
        rules: [
          createRule({
            name: 'Candidate rule',
            description: '**Invariant:** Candidate work is opt-in reference material.',
            scenarioNames: ['runtime business-rule filter override includes candidate rules'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('ActiveIdeaRules', {
        status: 'active',
        maturity: 'idea',
        productArea: 'Delivery Process',
        rules: [
          createRule({
            name: 'Active idea rule',
            description:
              '**Invariant:** Active idea work should reappear when callers widen only the maturity axis.',
            scenarioNames: [
              'runtime business-rule maturity override preserves the default status filter',
            ],
            scenarioCount: 1,
          }),
        ],
      }),
    ],
    ...(projectionFilter !== undefined ? { projectionFilter } : {}),
  });
}

function createExcludedMaturityOverrideContext(
  projectionFilter?: ProjectionContext['projectionFilter']
): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ExecutableRulesOne', {
        status: 'active',
        maturity: 'executable',
        productArea: 'Delivery Process',
        rules: [
          createRule({
            name: 'Executable rule one',
            description: '**Invariant:** Executable work stays visible by default.',
            scenarioNames: ['explicit override on initially-excluded maturity'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('ExecutableRulesTwo', {
        status: 'completed',
        maturity: 'executable',
        productArea: 'Delivery Process',
        rules: [
          createRule({
            name: 'Executable rule two',
            description: '**Invariant:** Completed executable work stays visible by default.',
            scenarioNames: ['explicit override on initially-excluded maturity'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('ExecutableRulesThree', {
        status: 'active',
        maturity: 'executable',
        productArea: 'Delivery Process',
        rules: [
          createRule({
            name: 'Executable rule three',
            description: '**Invariant:** Executable work stays visible by default.',
            scenarioNames: ['explicit override on initially-excluded maturity'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('IdeaRulesOne', {
        status: 'active',
        maturity: 'idea',
        productArea: 'Delivery Process',
        rules: [
          createRule({
            name: 'Idea rule one',
            description: '**Invariant:** Idea work is hidden until callers widen maturity.',
            scenarioNames: ['explicit override on initially-excluded maturity'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('IdeaRulesTwo', {
        status: 'completed',
        maturity: 'idea',
        productArea: 'Delivery Process',
        rules: [
          createRule({
            name: 'Idea rule two',
            description:
              '**Invariant:** Completed idea work is hidden until callers widen maturity.',
            scenarioNames: ['explicit override on initially-excluded maturity'],
            scenarioCount: 1,
          }),
        ],
      }),
    ],
    ...(projectionFilter !== undefined ? { projectionFilter } : {}),
  });
}

function createPackageGroupedBusinessRuleContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ProjectionRules', {
        file: 'packages/architect-projection/src/projections/governance/business-rules.ts',
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Projection rules stay package-owned',
            description: '**Invariant:** Projection rules stay with architect-projection.',
            scenarioNames: ['Grouping business rules by package'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('CoreRules', {
        file: 'packages/architect-core/src/config/package-resolver.ts',
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Core rules stay package-owned',
            description: '**Invariant:** Core rules stay with architect-core.',
            scenarioNames: ['Grouping business rules by package'],
            scenarioCount: 1,
          }),
        ],
      }),
    ],
  });
}

function createPhaseGroupedBusinessRuleContextWithUnphasedRule(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('PhasedRules', {
        phase: 49,
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Phased rule',
            description: '**Invariant:** Phase grouping keeps phased rules visible.',
            scenarioNames: ['Phase grouping rejects unphased rules loudly'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('UnphasedRules', {
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Unphased rule',
            description: '**Invariant:** Unphased rules must not disappear during grouping.',
            scenarioNames: ['Phase grouping rejects unphased rules loudly'],
            scenarioCount: 1,
          }),
        ],
      }),
    ],
  });
}

function createSourceAgnosticBusinessRuleContext(): ProjectionContext {
  const context = createProjectionContext({
    patterns: [
      createPattern('DecisionCarrierRule', {
        file: 'architect/decisions/decision-carrier-rule.feature',
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Shared carrier invariant',
            description:
              '**Invariant:** Shared rule fragments stay source agnostic.\n**Rationale:** Consumers render one aggregate shape.\n**Verified by:** source agnostic carrier parity',
            scenarioNames: ['source agnostic carrier parity'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('SpecCarrierRule', {
        file: 'architect/specs/spec-carrier-rule.feature',
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Shared carrier invariant',
            description:
              '**Invariant:** Shared rule fragments stay source agnostic.\n**Rationale:** Consumers render one aggregate shape.\n**Verified by:** source agnostic carrier parity',
            scenarioNames: ['source agnostic carrier parity'],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('ExecutableCarrierRule', {
        file: 'tests/features/projections/governance/executable-carrier-rule.feature',
        productArea: 'Projection',
        rules: [
          createRule({
            name: 'Shared carrier invariant',
            description:
              '**Invariant:** Shared rule fragments stay source agnostic.\n**Rationale:** Consumers render one aggregate shape.\n**Verified by:** source agnostic carrier parity',
            scenarioNames: ['source agnostic carrier parity'],
            scenarioCount: 1,
          }),
        ],
      }),
    ],
  });

  return {
    ...context,
    packageResolver: () => ({ id: 'shared-governance', displayName: 'shared-governance' }),
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Governance business rule projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule('Single business rules preserve canonical annotations', ({ RuleScenario }) => {
    RuleScenario('Projecting a business rule from a feature', ({ Given, When, Then }) => {
      Given('a business rule projection context with Delivery Process and Data API rules', () => {
        state!.context = createBusinessRuleContext();
      });

      When(
        'I project the business rule {string} from feature {string}',
        (_ctx: unknown, ruleName: string, featureName: string) => {
          state!.rule = projectBusinessRule(state!.context!, featureName, ruleName)?.root ?? null;
        }
      );

      Then(
        'the projected business rule should preserve invariant rationale and verified-by semantics',
        () => {
          expect(state!.rule).toEqual({
            kind: 'BusinessRule',
            feature: 'ProjectionMigration',
            ruleName: 'Fragments stay JSON-safe',
            package: 'architect-projection',
            invariant: 'Projection fragments may only contain JSON-safe values.',
            rationale: 'Renderer transport stays deterministic.',
            verifiedBy: [
              'grouped business-rule-set children by product area slug',
              'explicit taxonomy override behavior passes',
            ],
            scenarioCount: 2,
            pattern: 'ProjectionMigration',
            phase: 49,
            productArea: 'Delivery Process',
          });
        }
      );
    });

    RuleScenario(
      'Filtering a single business rule projection returns no fragment',
      ({ Given, And, When, Then }) => {
        Given('a business rule projection context with active and candidate rule patterns', () => {
          state!.context = createFilteredBusinessRuleContext();
        });

        And('the business rule projection context excludes active patterns at runtime', () => {
          state!.context = createFilteredBusinessRuleContext({ status: ['candidate'] });
        });

        When(
          'I project the business rule {string} from feature {string}',
          (_ctx: unknown, ruleName: string, featureName: string) => {
            state!.rule = projectBusinessRule(state!.context!, featureName, ruleName)?.root ?? null;
          }
        );

        Then('no business rule bundle should be returned', () => {
          expect(state!.rule).toBeNull();
        });
      }
    );
  });

  Rule('Product-area grouping returns a combined root and area children', ({ RuleScenario }) => {
    RuleScenario('Grouping business rules by product area', ({ Given, When, Then, And }) => {
      Given('a business rule projection context with Delivery Process and Data API rules', () => {
        state!.context = createBusinessRuleContext();
      });

      When(
        'I project the business rule set scoped to product areas and grouped by product area',
        () => {
          state!.bundle = parseAndProjectBusinessRuleSet(state!.context!, {
            scope: 'all',
            groupedBy: 'product-area',
          });
        }
      );

      Then('the business rule bundle root should normalize to an all-rules grouping root', () => {
        expect(state!.bundle?.root.kind).toBe('BusinessRuleSet');
        expect(state!.bundle?.root.scope).toBe('all');
        expect(state!.bundle?.root.groupedBy).toBe('product-area');
        expect(state!.bundle?.root.rules).toHaveLength(3);
      });

      And('the business rule bundle root should expose product-area grouping entries', () => {
        expect(state!.bundle?.root.groupingEntries).toEqual([
          {
            childKey: 'data-api',
            label: 'Data API',
            featureCount: 1,
            ruleCount: 1,
            invariantCount: 1,
          },
          {
            childKey: 'delivery-process',
            label: 'Delivery Process',
            featureCount: 1,
            ruleCount: 2,
            invariantCount: 1,
          },
        ]);
      });

      And('the business rule bundle should expose product-area child keys', () => {
        expect(Object.keys(state!.bundle?.children ?? {})).toEqual([
          'data-api',
          'delivery-process',
        ]);
      });

      And('the delivery-process child should scope to {string}', (_ctx: unknown, area: string) => {
        expect(state!.bundle?.children['delivery-process']).toMatchObject({
          kind: 'BusinessRuleSet',
          scope: 'product-area',
          scopeValue: area,
        });
        expect((state!.bundle?.children['delivery-process'] as BusinessRuleSet).rules).toHaveLength(
          2
        );
      });

      And('the business rule bundle root should round-trip through the Fragment schema', () => {
        const rendered = renderJson(state!.bundle!.root);
        expect(typeof rendered).toBe('object');
        expect(rendered).not.toBeNull();
        expect(FragmentSchema.safeParse(rendered).success).toBe(true);
      });
    });

    RuleScenario(
      'parseAndProjectBusinessRuleSet rejects an invalid grouping option',
      ({ Given, When, Then }) => {
        Given('a business rule projection context with Delivery Process and Data API rules', () => {
          state!.context = createBusinessRuleContext();
        });

        When('I parse-and-project the business rule set with an invalid grouping option', () => {
          try {
            parseAndProjectBusinessRuleSet(state!.context!, {
              scope: 'all',
              groupedBy: 'status',
            });
            state!.invalidOptionsError = null;
          } catch (error) {
            state!.invalidOptionsError = error instanceof Error ? error.message : String(error);
          }
        });

        Then('parsing business-rule-set options should fail loudly', () => {
          expect(state!.invalidOptionsError).toContain(
            'Invalid options for parseAndProjectBusinessRuleSet:'
          );
          expect(state!.invalidOptionsError).toContain('groupedBy');
        });
      }
    );
  });

  Rule(
    'Projection filters exclude non-matching patterns before rule collection',
    ({ RuleScenario }) => {
      RuleScenario(
        'ProjectionFilter accepts and rejects patterns by maturity and status',
        ({ Given, Then }) => {
          Given(
            'a business rule projection context with active and candidate rule patterns',
            () => {
              state!.context = createFilteredBusinessRuleContext();
            }
          );

          Then(
            'the ProjectionFilter helper should honor maturity and status axes independently',
            () => {
              const [committed, candidate] = state!.context!.graph.patterns;
              expect(committed).toBeDefined();
              expect(candidate).toBeDefined();

              expect(filterPattern(committed!, { maturity: ['design'] })).toBe(true);
              expect(filterPattern(candidate!, { maturity: ['design'] })).toBe(false);
              expect(filterPattern(committed!, { status: ['active'] })).toBe(true);
              expect(filterPattern(candidate!, { status: ['active'] })).toBe(false);
              expect(filterPattern(committed!, { maturity: ['design'], status: ['active'] })).toBe(
                true
              );
              expect(
                filterPattern(committed!, { maturity: ['design'], status: ['candidate'] })
              ).toBe(false);
              expect(
                filterPatterns(state!.context!.graph.patterns, {
                  maturity: ['idea'],
                  status: ['candidate'],
                }).map((pattern) => pattern.patternName)
              ).toEqual(['CandidateRules']);
            }
          );
        }
      );

      RuleScenario(
        'Default business-rule disclosure filters out candidate rules',
        ({ Given, When, Then }) => {
          Given(
            'a business rule projection context with active and candidate rule patterns',
            () => {
              const context = createFilteredBusinessRuleContext();
              const projectionFilter = resolveProjectionFilter(context, 'business-rules');
              if (projectionFilter === undefined) {
                throw new Error('Expected default business-rules disclosure filter.');
              }
              state!.context = {
                ...context,
                projectionFilter,
              };
            }
          );

          When('I project the default business rule set', () => {
            state!.bundle = parseAndProjectBusinessRuleSet(state!.context!);
          });

          Then(
            'the projected business rule set should include the committed and active-status-derived rule patterns',
            () => {
              expect(state!.bundle?.root.rules.map((rule) => rule.pattern)).toEqual([
                'ActiveIdeaRules',
                'CommittedRules',
              ]);
            }
          );
        }
      );

      RuleScenario(
        'Runtime business-rule filter override includes candidate rules',
        ({ Given, When, Then }) => {
          Given(
            'a business rule projection context with a runtime candidate filter override',
            () => {
              state!.context = createFilteredBusinessRuleContext({
                maturity: ['idea'],
                status: ['candidate'],
              });
            }
          );

          When('I project the default business rule set', () => {
            state!.bundle = parseAndProjectBusinessRuleSet(state!.context!);
          });

          Then('the projected business rule set should include the candidate rule pattern', () => {
            expect(state!.bundle?.root.rules.map((rule) => rule.pattern)).toEqual([
              'CandidateRules',
            ]);
          });
        }
      );

      RuleScenario(
        'Runtime business-rule maturity override preserves the default status filter',
        ({ Given, When, Then }) => {
          Given('a business rule projection context with an idea-maturity runtime override', () => {
            const context = createFilteredBusinessRuleContext({ maturity: ['idea'] });
            const projectionFilter = resolveProjectionFilter(context, 'business-rules');
            if (projectionFilter === undefined) {
              throw new Error('Expected business-rules disclosure filter after runtime override.');
            }
            state!.context = {
              ...context,
              projectionFilter,
            };
          });

          When('I project the default business rule set', () => {
            state!.bundle = parseAndProjectBusinessRuleSet(state!.context!);
          });

          Then(
            'the projected business rule set should include no rules when only the maturity axis is narrowed to idea',
            () => {
              expect(state!.bundle?.root.rules.map((rule) => rule.pattern) ?? []).toEqual([]);
            }
          );
        }
      );

      RuleScenario('explicit override on initially-excluded maturity', ({ Given, When, Then }) => {
        Given('a business rule projection context with executable and idea rule patterns', () => {
          const context = createExcludedMaturityOverrideContext({ maturity: ['idea'] });
          const projectionFilter = resolveProjectionFilter(context, 'business-rules');
          if (projectionFilter === undefined) {
            throw new Error('Expected business-rules disclosure filter after runtime override.');
          }
          state!.context = {
            ...context,
            projectionFilter,
          };
        });

        When(
          'I project the business rule set with a runtime maturity override for {string}',
          () => {
            state!.bundle = parseAndProjectBusinessRuleSet(state!.context!);
          }
        );

        Then(
          'the projected business rule set should include no rules when idea maturity is requested without a status override',
          () => {
            const patterns = state!.bundle?.root.rules.map((rule) => rule.pattern) ?? [];
            expect(patterns).toEqual([]);
            expect(patterns).not.toContain('IdeaRulesOne');
            expect(patterns).not.toContain('IdeaRulesTwo');
            expect(patterns).not.toContain('ExecutableRulesOne');
            expect(patterns).not.toContain('ExecutableRulesTwo');
            expect(patterns).not.toContain('ExecutableRulesThree');
          }
        );
      });
    }
  );

  Rule('Package grouping reuses the package axis at runtime', ({ RuleScenario }) => {
    RuleScenario('Grouping business rules by package', ({ Given, When, Then, And }) => {
      Given(
        'a business rule projection context with rules from multiple workspace packages',
        () => {
          state!.context = createPackageGroupedBusinessRuleContext();
        }
      );

      When('I project the business rule set scoped to all rules and grouped by package', () => {
        state!.bundle = parseAndProjectBusinessRuleSet(state!.context!, {
          scope: 'all',
          groupedBy: 'package',
        });
      });

      Then('the business rule bundle root should expose package grouping entries', () => {
        expect(state!.bundle?.root.groupingEntries).toEqual([
          {
            childKey: 'architect-core',
            label: 'architect-core',
            featureCount: 1,
            ruleCount: 1,
            invariantCount: 1,
          },
          {
            childKey: 'architect-projection',
            label: 'architect-projection',
            featureCount: 1,
            ruleCount: 1,
            invariantCount: 1,
          },
        ]);
      });

      Then('the business rule bundle should expose package child keys', () => {
        expect(Object.keys(state!.bundle?.children ?? {})).toEqual([
          'architect-core',
          'architect-projection',
        ]);
      });

      And(
        'the architect-projection child should scope to package {string}',
        (_ctx: unknown, pkg: string) => {
          expect(state!.bundle?.children['architect-projection']).toMatchObject({
            kind: 'BusinessRuleSet',
            scope: 'package',
            scopeValue: pkg,
          });
        }
      );

      And(
        'the architect-core child should scope to package {string}',
        (_ctx: unknown, pkg: string) => {
          expect(state!.bundle?.children['architect-core']).toMatchObject({
            kind: 'BusinessRuleSet',
            scope: 'package',
            scopeValue: pkg,
          });
        }
      );
    });
  });

  Rule('Phase grouping requires every grouped rule to expose a phase', ({ RuleScenario }) => {
    RuleScenario('Phase grouping rejects unphased rules loudly', ({ Given, When, Then }) => {
      Given('a business rule projection context with at least one unphased rule', () => {
        state!.context = createPhaseGroupedBusinessRuleContextWithUnphasedRule();
      });

      When('I project the business rule set grouped by phase', () => {
        try {
          state!.bundle = parseAndProjectBusinessRuleSet(state!.context!, {
            scope: 'all',
            groupedBy: 'phase',
          });
          state!.invalidOptionsError = null;
        } catch (error) {
          state!.invalidOptionsError = error instanceof Error ? error.message : String(error);
        }
      });

      Then('grouping business rules by phase should fail loudly', () => {
        expect(state!.invalidOptionsError).toBe(
          'Cannot group business rules by phase when one or more projected rules have no phase.'
        );
      });
    });
  });

  Rule('BusinessRule fragments stay source-agnostic across rule carriers', ({ RuleScenario }) => {
    RuleScenario(
      'BusinessRule fragments stay source-agnostic across decision spec and executable carriers',
      ({ Given, When, Then }) => {
        Given(
          'a business rule projection context with decision spec and executable rule carriers',
          () => {
            state!.context = createSourceAgnosticBusinessRuleContext();
          }
        );

        When('I project the default business rule set', () => {
          state!.bundle = parseAndProjectBusinessRuleSet(state!.context!);
        });

        Then(
          'the projected business rules should stay source-agnostic after identity fields are removed',
          () => {
            const normalized = state!.bundle!.root.rules.map(
              ({ feature: _feature, pattern: _pattern, ruleName: _ruleName, ...rule }) => rule
            );
            expect(normalized).toEqual([normalized[0], normalized[0], normalized[0]]);
          }
        );
      }
    );
  });
});
