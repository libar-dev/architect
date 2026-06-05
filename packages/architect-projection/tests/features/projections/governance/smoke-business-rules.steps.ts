import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  BusinessRuleSetSchema,
  FragmentSchema,
  parseAndProjectBusinessRuleSet,
  renderJson,
  type BusinessRuleSet,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRule } from './support.js';

interface SmokeState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<BusinessRuleSet> | null;
}

const feature = await loadFeature(
  'tests/features/projections/governance/smoke-business-rules.feature',
);

let state: SmokeState | null = null;

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the Governance smoke test state is initialized', () => {
      state = { context: null, bundle: null };
    });
  });

  Rule(
    'Business rule set runs against a minimal graph and produces a valid fragment',
    ({ RuleScenario }) => {
      RuleScenario(
        'smoke test projects a valid business rule set from patterns with rules',
        ({ Given, When, Then, And }) => {
          Given('a Governance context with two patterns carrying Gherkin rules', () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('AuthFeature', {
                  status: 'active',
                  role: 'service',
                  file: 'architect/specs/auth-feature.feature',
                  rules: [
                    createRule({
                      name: 'Session expiry',
                      description:
                        '**Invariant:** Sessions expire after 30 minutes of inactivity.\n**Verified by:** Session expiry scenario',
                      scenarioNames: ['Session expiry scenario'],
                      scenarioCount: 1,
                    }),
                  ],
                }),
                createPattern('AuditFeature', {
                  status: 'active',
                  role: 'service',
                  file: 'architect/specs/audit-feature.feature',
                  rules: [
                    createRule({
                      name: 'Audit trail immutability',
                      description:
                        '**Invariant:** Audit entries cannot be modified after creation.\n**Verified by:** Audit immutability check',
                      scenarioNames: ['Audit immutability check'],
                      scenarioCount: 1,
                    }),
                  ],
                }),
              ],
            });
          });

          When('I project the business rule set with scope all', () => {
            state!.bundle = parseAndProjectBusinessRuleSet(state!.context!);
          });

          Then('the business rule set should validate against its Zod schema', () => {
            BusinessRuleSetSchema.parse(state!.bundle!.root);

            const rendered = renderJson(state!.bundle!.root);
            expect(typeof rendered).toBe('object');
            expect(rendered).not.toBeNull();
            expect(FragmentSchema.safeParse(rendered).success).toBe(true);
          });

          And('the business rule set should contain the rules from both patterns', () => {
            expect(state!.bundle!.root.scope).toBe('all');
            expect(state!.bundle!.root.rules).toHaveLength(2);
            expect(state!.bundle!.root.rules.map((rule) => rule.ruleName)).toEqual(
              expect.arrayContaining(['Session expiry', 'Audit trail immutability']),
            );
          });
        },
      );
    },
  );
});
