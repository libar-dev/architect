import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  parseAndProjectDocumentationBundle,
  FragmentSchema,
  type Fragment,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface SmokeState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<Fragment> | null;
}

const feature = await loadFeature(
  'tests/features/projections/documentation-composition/smoke-documentation-bundle.feature',
);

let state: SmokeState | null = null;

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the Documentation Composition smoke test state is initialized', () => {
      state = { context: null, bundle: null };
    });
  });

  Rule(
    'Documentation bundle runs against a minimal graph and produces a valid fragment',
    ({ RuleScenario }) => {
      RuleScenario(
        'smoke test projects a valid patterns documentation bundle from a small graph',
        ({ Given, When, Then, And }) => {
          Given('a Documentation Composition context with two patterns and a relationship', () => {
            const patterns = [
              createPattern('AuthService', {
                status: 'active',
                role: 'service',
                description: 'Handles user authentication.',
              }),
              createPattern('SessionStore', {
                status: 'active',
                role: 'service',
                description: 'Manages user sessions.',
                dependsOn: ['AuthService'],
              }),
            ];
            state!.context = createProjectionContext({
              patterns,
              relationshipIndex: {
                AuthService: createRelationshipEntry({ enables: ['SessionStore'] }),
                SessionStore: createRelationshipEntry({ dependsOn: ['AuthService'] }),
              },
            });
          });

          When('I project the patterns documentation bundle', () => {
            state!.bundle = parseAndProjectDocumentationBundle(state!.context!, {
              documentType: 'patterns',
            });
          });

          Then(
            'the documentation bundle should validate against the fragment schema and any emitted routing',
            () => {
              FragmentSchema.parse(state!.bundle!.root);

              for (const child of Object.values(state!.bundle!.children)) {
                FragmentSchema.parse(child);
              }

              if (Object.keys(state!.bundle!.children).length === 0) {
                expect(state!.bundle!.routing).toBeUndefined();
                return;
              }

              expect(state!.bundle!.routing?.rootRouteId).toBe('patterns:index');
              expect(state!.bundle!.routing?.childRouteIds).toEqual({
                AuthService: 'patterns:authservice',
                SessionStore: 'patterns:sessionstore',
              });
            },
          );

          And(
            'the documentation bundle should have the patterns document type and a non-empty title',
            () => {
              expect(state!.bundle!.root.kind).toBe('PatternCatalog');
              expect(JSON.stringify(state!.bundle!.root)).toContain('AuthService');
            },
          );
        },
      );
    },
  );
});
