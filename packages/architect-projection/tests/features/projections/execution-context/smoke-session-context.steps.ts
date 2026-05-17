import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  parseAndProjectSessionContext,
  SessionContextBundleSchema,
  type ProjectionBundle,
  type ProjectionContext,
  type SessionContextBundle,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface SmokeState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<SessionContextBundle> | null;
}

const feature = await loadFeature(
  'tests/features/projections/execution-context/smoke-session-context.feature',
);

let state: SmokeState | null = null;

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the Execution Context smoke test state is initialized', () => {
      state = { context: null, bundle: null };
    });
  });

  Rule(
    'Session context runs against a minimal graph and produces a valid fragment',
    ({ RuleScenario }) => {
      RuleScenario(
        'smoke test projects a valid session context bundle from a small graph',
        ({ Given, When, Then, And }) => {
          Given('an Execution Context with two patterns and a dependency relationship', () => {
            const patterns = [
              createPattern('CoreModule', {
                status: 'active',
                role: 'service',
                phase: 1,
                file: 'architect/specs/core-module.feature',
                deliverables: [
                  {
                    name: 'CoreModuleImpl',
                    status: 'pending',
                    tests: 1,
                    location: 'src/core-module.ts',
                  },
                ],
              }),
              createPattern('HelperModule', {
                status: 'active',
                role: 'utility',
                phase: 1,
                file: 'architect/specs/helper-module.feature',
                dependsOn: ['CoreModule'],
              }),
            ];
            state!.context = createProjectionContext({
              patterns,
              relationshipIndex: {
                CoreModule: createRelationshipEntry({ enables: ['HelperModule'] }),
                HelperModule: createRelationshipEntry({ dependsOn: ['CoreModule'] }),
              },
            });
          });

          When('I project the session context for both patterns in implement mode', () => {
            state!.bundle = parseAndProjectSessionContext(state!.context!, {
              patterns: ['CoreModule', 'HelperModule'],
              sessionType: 'implement',
            });
          });

          Then('the session context bundle should validate against its Zod schema', () => {
            SessionContextBundleSchema.parse(state!.bundle!.root);
          });

          And('the session context bundle should reference both input patterns', () => {
            expect(state!.bundle!.root.patterns).toEqual(['CoreModule', 'HelperModule']);
            expect(state!.bundle!.root.sessionType).toBe('implement');
            expect(state!.bundle!.root.metadata).toHaveLength(2);
          });
        },
      );
    },
  );
});
