/**
 * Public contract step definitions.
 *
 * This file freezes canonical package surfaces that callers import directly.
 */

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import {
  buildPatternGraph,
  createPatternGraphAPI,
  createSuccess,
  RenderFormatSchema,
  ScopeTypeSchema,
  SessionTypeSchema,
  WORKSPACE_TAG_REGISTRY,
  type QuerySuccess,
} from '@libar-dev/architect-core';
import * as architectProjection from '@libar-dev/architect-projection';
import { expect } from 'vitest';

const feature = await loadFeature('tests/features/cli/public-contract.feature');

describeFeature(feature, ({ Rule }) => {
  Rule(
    'architect-core and architect-projection keep canonical exports importable',
    ({ RuleScenario }) => {
      RuleScenario('architect-core query contract exports remain available', ({ Then }) => {
        Then('architect-core query contract exports remain available', () => {
          const envelope: QuerySuccess<{ ok: boolean }> = createSuccess({ ok: true }, 3);

          expect(typeof buildPatternGraph).toBe('function');
          expect(typeof createPatternGraphAPI).toBe('function');
          expect(WORKSPACE_TAG_REGISTRY).toBeDefined();
          expect(RenderFormatSchema.safeParse('json').success).toBe(true);
          expect(SessionTypeSchema.safeParse('implement').success).toBe(true);
          expect(ScopeTypeSchema.safeParse('design').success).toBe(true);

          expect(envelope.success).toBe(true);
          expect(envelope.data).toEqual({ ok: true });
          expect(envelope.metadata.patternCount).toBe(3);
          expect(Number.isNaN(Date.parse(envelope.metadata.timestamp))).toBe(false);
        });
      });

      RuleScenario(
        'architect-projection canonical projection entrypoints remain public',
        ({ Then }) => {
          Then('all architect-projection parseAndProject entrypoints remain available', () => {
            const parseAndProjectExports = [
              'parseAndProjectArchitectureDiagram',
              'parseAndProjectBusinessRuleSet',
              'parseAndProjectConfig',
              'parseAndProjectDependencyContext',
              'parseAndProjectDocumentationBundle',
              'parseAndProjectFileReadingList',
              'parseAndProjectHandoffRecord',
              'parseAndProjectPatternCatalog',
              'parseAndProjectPrChangeReview',
              'parseAndProjectScopeReadinessReport',
              'parseAndProjectSessionContext',
              'parseAndProjectTaxonomyDigest',
            ] as const;

            expect(typeof architectProjection.projectOverviewDigest).toBe('function');
            expect(typeof architectProjection.projectChangelog).toBe('function');
            for (const exportName of parseAndProjectExports) {
              expect(typeof architectProjection[exportName]).toBe('function');
            }
          });
        },
      );

      RuleScenario(
        'architect-projection barrel exposes only the validated architecture entrypoint',
        ({ Then }) => {
          Then(
            'architect-projection hides the raw architecture diagram export from the top-level barrel',
            () => {
              expect(typeof architectProjection.parseAndProjectArchitectureDiagram).toBe(
                'function',
              );
              expect('projectArchitectureDiagram' in architectProjection).toBe(false);
              expect('projectConfig' in architectProjection).toBe(false);
              expect('projectDocumentationBundle' in architectProjection).toBe(false);
              expect('projectPrChangeReview' in architectProjection).toBe(false);
            },
          );
        },
      );
    },
  );
});
