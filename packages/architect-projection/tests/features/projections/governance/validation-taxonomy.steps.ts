import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  parseAndProjectTaxonomyDigest,
  projectValidationRuleDigest,
  summarizeTaxonomyDigest,
  type ProjectionContext,
  type TaxonomyDigest,
  type ValidationRuleDigest,
} from '../../../../src/index.js';
import { createProjectionContext, createTagRegistry } from './support.js';

interface ValidationTaxonomyState {
  context: ProjectionContext | null;
  validation: ValidationRuleDigest | null;
  firstDigest: TaxonomyDigest | null;
  secondDigest: TaxonomyDigest | null;
}

const feature = await loadFeature(
  'tests/features/projections/governance/validation-taxonomy.feature',
);

let state: ValidationTaxonomyState | null = null;

function createState(): ValidationTaxonomyState {
  return {
    context: null,
    validation: null,
    firstDigest: null,
    secondDigest: null,
  };
}

function createTaxonomyContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [],
    tagRegistry: createTagRegistry({
      roles: [
        {
          tag: 'service',
          domain: 'Application',
          priority: 20,
          description: 'Application service patterns.',
          aliases: ['app-service'],
        },
      ],
      metadataTags: [
        {
          tag: 'status',
          format: 'enum',
          purpose: 'Defines delivery workflow state.',
          required: true,
          repeatable: false,
          values: ['roadmap', 'active', 'completed'],
          default: 'roadmap',
          example: '@architect-status roadmap',
        },
        {
          tag: 'uses',
          format: 'csv',
          purpose: 'Links one pattern to another.',
          repeatable: false,
          example: '@architect-uses PatternGraphAPI, ProjectionBundle',
        },
        {
          tag: 'title',
          format: 'quoted-value',
          purpose: 'Human-readable display title.',
          repeatable: false,
          example: '@architect-title:"Projection Contracts"',
        },
        {
          tag: 'target',
          format: 'value',
          purpose: 'Target implementation path for stub files.',
          repeatable: false,
          example: '@architect-target src/api/stub-resolver.ts',
        },
        {
          tag: 'unlock-reason',
          format: 'quoted-value',
          purpose: 'Reason for intentionally modifying a completed pattern.',
          repeatable: false,
          example: '@architect-unlock-reason "Correct process drift"',
        },
      ],
      aggregationTags: [
        {
          tag: 'rules',
          targetDoc: 'BUSINESS-RULES.md',
          purpose: 'Routes rules into the business-rules projection.',
        },
      ],
    }),
  });
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Governance validation and taxonomy projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule(
    'Validation rule digests expose normalized FSM and protection metadata',
    ({ RuleScenario }) => {
      RuleScenario('Projecting the validation rule digest', ({ Given, When, Then }) => {
        Given('a taxonomy projection context with roles metadata tags and aggregation tags', () => {
          state!.context = createTaxonomyContext();
        });

        When('I project the validation rule digest', () => {
          state!.validation = projectValidationRuleDigest(state!.context!).root;
        });

        Then(
          'the validation rule digest should expose rule fsm and protection-level fragments',
          () => {
            expect(state!.validation?.kind).toBe('ValidationRuleDigest');
            expect(state!.validation?.rules).toContainEqual({
              id: 'completed-protection',
              description: 'Completed specs require unlock-reason tag to modify',
              severity: 'error',
            });
            expect(state!.validation?.rules).toContainEqual({
              id: 'session-scope',
              description: 'File outside session scope',
              severity: 'warning',
            });
            expect(state!.validation?.fsm).toEqual({
              initialState: 'roadmap',
              terminalStates: ['completed'],
              states: ['roadmap', 'active', 'completed', 'deferred'],
              transitions: [
                { from: 'roadmap', to: 'active', description: 'Start implementation work' },
                {
                  from: 'roadmap',
                  to: 'deferred',
                  description: 'Defer work without completing it',
                },
                { from: 'active', to: 'completed', description: 'Finish implementation work' },
                { from: 'active', to: 'roadmap', description: 'Move active work back to planning' },
                { from: 'deferred', to: 'roadmap', description: 'Reactivate deferred work' },
              ],
            });
            expect(state!.validation?.protectionLevels).toEqual([
              {
                level: 'none',
                statuses: ['roadmap', 'deferred'],
                meaning: 'Planning statuses remain editable.',
                canAddDeliverables: true,
                needsUnlock: false,
              },
              {
                level: 'scope',
                statuses: ['active'],
                meaning: 'Active work is scope-locked against deliverable expansion.',
                canAddDeliverables: false,
                needsUnlock: false,
              },
              {
                level: 'hard',
                statuses: ['completed'],
                meaning:
                  'Completed work is hard-locked until an explicit unlock reason is provided.',
                canAddDeliverables: false,
                needsUnlock: true,
              },
            ]);
          },
        );
      });
    },
  );

  Rule('Taxonomy overrides are explicit and per-call only', ({ RuleScenario }) => {
    RuleScenario(
      'Projecting taxonomy digests with and without explicit overrides',
      ({ Given, When, Then, And }) => {
        Given('a taxonomy projection context with roles metadata tags and aggregation tags', () => {
          state!.context = createTaxonomyContext();
        });

        When('I project the taxonomy digest with explicit overrides', () => {
          state!.firstDigest = parseAndProjectTaxonomyDigest(state!.context!, {
            exampleOverrides: {
              enum: {
                description: 'Override enum description for this call only.',
                example: '@architect-status active',
              },
              csv: {
                example: '@architect-uses PatternGraphAPI, ProjectionBundle, RulesQueryAPI',
              },
            },
          }).root;
        });

        And('I project the taxonomy digest again without overrides', () => {
          state!.secondDigest = parseAndProjectTaxonomyDigest(state!.context!).root;
        });

        Then(
          'the first taxonomy digest should use the explicit override examples and descriptions',
          () => {
            expect(state!.firstDigest?.formatTypes).toContainEqual({
              format: 'enum',
              description: 'Override enum description for this call only.',
              example: '@architect-status active',
            });
            expect(state!.firstDigest?.formatTypes).toContainEqual({
              format: 'csv',
              description: 'Comma-separated values',
              example: '@architect-uses PatternGraphAPI, ProjectionBundle, RulesQueryAPI',
            });
            expect(state!.firstDigest?.exampleOverrides).toEqual({
              enum: '@architect-status active',
              csv: '@architect-uses PatternGraphAPI, ProjectionBundle, RulesQueryAPI',
            });
          },
        );

        And(
          'the second taxonomy digest should fall back to the default examples without retaining overrides',
          () => {
            expect(state!.secondDigest?.formatTypes).toContainEqual({
              format: 'enum',
              description: 'Constrained to predefined values',
              example: '@architect-status roadmap',
            });
            expect(state!.secondDigest?.formatTypes).toContainEqual({
              format: 'csv',
              description: 'Comma-separated values',
              example: '@architect-uses A, B, C',
            });
            expect(state!.secondDigest?.exampleOverrides).toBeUndefined();
          },
        );
      },
    );
  });

  Rule('Public taxonomy digests hide internal authoring-only tags', ({ RuleScenario }) => {
    RuleScenario(
      'Projecting a taxonomy digest with hidden internal tags registered',
      ({ Given, When, Then }) => {
        Given('a taxonomy projection context with roles metadata tags and aggregation tags', () => {
          state!.context = createTaxonomyContext();
        });

        When('I project the taxonomy digest', () => {
          state!.firstDigest = parseAndProjectTaxonomyDigest(state!.context!).root;
        });

        Then(
          'the taxonomy digest should hide internal-only metadata tags from the public surface',
          () => {
            const metadataTags =
              state!.firstDigest?.tags
                .flatMap((group) =>
                  group.entries.flatMap((entry) => (entry.kind === 'metadata' ? [entry.tag] : [])),
                )
                .sort() ?? [];

            expect(metadataTags).toContain('status');
            expect(metadataTags).toContain('uses');
            expect(metadataTags).not.toContain('title');
            expect(metadataTags).not.toContain('shape');
            expect(metadataTags).not.toContain('target');
            expect(metadataTags).not.toContain('unlock-reason');
          },
        );
      },
    );
  });

  Rule('Taxonomy count summaries use the digest surface', ({ RuleScenario }) => {
    RuleScenario('Summarizing a projected taxonomy digest', ({ Given, When, Then }) => {
      Given('a taxonomy projection context with roles metadata tags and aggregation tags', () => {
        state!.context = createTaxonomyContext();
      });

      When('I project the taxonomy digest', () => {
        state!.firstDigest = parseAndProjectTaxonomyDigest(state!.context!).root;
      });

      Then('the taxonomy digest count summary should match the visible tag entries', () => {
        expect(summarizeTaxonomyDigest(state!.firstDigest!)).toEqual({
          roles: 1,
          metadata: 2,
          aggregation: 1,
          total: 4,
        });
      });
    });

    RuleScenario(
      "the count summary is a self-consistent function of the digest's own entries",
      ({ Given, When, Then, And }) => {
        Given('a taxonomy projection context with roles metadata tags and aggregation tags', () => {
          state!.context = createTaxonomyContext();
        });

        When('I project the taxonomy digest', () => {
          state!.firstDigest = parseAndProjectTaxonomyDigest(state!.context!).root;
        });

        Then(
          'the count summary equals the role, metadata, and aggregation entries enumerated from the digest itself',
          () => {
            const entries = state!.firstDigest!.tags.flatMap((group) => group.entries);
            const summary = summarizeTaxonomyDigest(state!.firstDigest!);
            expect(summary.roles).toBe(entries.filter((entry) => entry.kind === 'role').length);
            expect(summary.metadata).toBe(
              entries.filter((entry) => entry.kind === 'metadata').length,
            );
            expect(summary.aggregation).toBe(
              entries.filter((entry) => entry.kind === 'aggregation').length,
            );
          },
        );

        And(
          'the total equals the sum of those three counts, so the count surface cannot diverge from the enumerated surface',
          () => {
            const summary = summarizeTaxonomyDigest(state!.firstDigest!);
            expect(summary.total).toBe(summary.roles + summary.metadata + summary.aggregation);
          },
        );
      },
    );
  });
});
