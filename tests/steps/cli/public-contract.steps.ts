/**
 * Public contract step definitions.
 *
 * This file freezes canonical package surfaces that callers import directly.
 */

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import * as architectProjection from '@libar-dev/architect-projection';
import { describe, expect, it } from 'vitest';

const [architectCore, architectGraph] = await Promise.all([
  import('@libar-dev/architect-core'),
  import('@libar-dev/architect-core/graph'),
]);

const feature = await loadFeature('tests/features/cli/public-contract.feature');

const RETAINED_CORE_EXPORTS = [
  'buildPatternGraph',
  'getDependencyContext',
  'getRulesForPattern',
  'isValidTransition',
  'validateTransition',
  'getValidTransitionsFrom',
  'getProtectionSummary',
  'resolveDecisionPattern',
  'listDecisionPatterns',
  'canonicalDecisionKey',
  'createPackageResolver',
  'WORKSPACE_TAG_REGISTRY',
  'RenderFormatSchema',
  'SessionTypeSchema',
  'ScopeTypeSchema',
] as const;

const RETAINED_GRAPH_EXPORTS = ['Graph', 'createGraph', 'PatternGraphSchema'] as const;

const LEGACY_CORE_EXPORTS = [
  'createPatternGraphAPI',
  'PatternGraphAPI',
  'QueryResult',
  'QuerySuccess',
  'QueryError',
  'QueryApiError',
  'createSuccess',
  'createError',
] as const;

function findLegacyCoreExports(moduleExports: object): readonly string[] {
  return LEGACY_CORE_EXPORTS.filter((exportName) => exportName in moduleExports);
}

describe('legacy facade export absence guard', () => {
  for (const exportName of ['createPatternGraphAPI', 'PatternGraphAPI'] as const) {
    it(`detects a restored ${exportName} runtime export`, () => {
      // Given a package namespace with one real facade key restored
      const restoredExports = { [exportName]: Symbol(exportName) };

      // When the public-contract absence guard inspects it
      const detected = findLegacyCoreExports(restoredExports);

      // Then the restored key is reported and the package-level empty assertion would fail
      expect(detected).toEqual([exportName]);
    });
  }
});

describeFeature(feature, ({ Rule }) => {
  Rule(
    'architect-core and architect-projection keep canonical exports importable',
    ({ RuleScenario }) => {
      RuleScenario(
        'architect-core graph and pure-kernel exports replace the legacy facade',
        ({ Then, And }) => {
          Then('architect-core graph and pure-kernel exports are available', () => {
            for (const exportName of RETAINED_CORE_EXPORTS) {
              expect(exportName in architectCore).toBe(true);
            }
            for (const exportName of RETAINED_GRAPH_EXPORTS) {
              expect(exportName in architectGraph).toBe(true);
            }
          });
          And('architect-core legacy facade exports are absent', () => {
            expect(findLegacyCoreExports(architectCore)).toEqual([]);
          });
        },
      );

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
