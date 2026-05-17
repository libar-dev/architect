import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  PROGRESSIVE_DISCLOSURE_LEVELS,
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY,
  SUPPORTED_DOCUMENTATION_TYPES,
  SupportedDocumentationTypeRegistryEntrySchema,
  getDocumentationTypeMetadata,
  getSupportedDocumentationTypeMetadata,
  type SupportedDocumentationType,
} from '../../../../src/index.js';

const feature = await loadFeature(
  'tests/features/projections/documentation-composition/registry-contract.feature',
);

const expectedDocumentationTypes = [
  'architecture',
  'decisions',
  'business-rules',
  'patterns',
  'roadmap',
  'current-work',
  'requirements-executable',
  'requirements-specs',
  'validation-rules',
  'taxonomy',
  'changelog',
  'traceability',
] as const satisfies readonly SupportedDocumentationType[];

const expectedMarkdownRootTargets = {
  architecture: 'ARCHITECTURE.md',
  decisions: 'DECISIONS.md',
  'business-rules': 'BUSINESS-RULES.md',
  patterns: 'PATTERNS.md',
  roadmap: 'ROADMAP.md',
  'current-work': 'CURRENT-WORK.md',
  'requirements-executable': 'REQUIREMENTS-EXECUTABLE.md',
  'requirements-specs': 'REQUIREMENTS-SPECS.md',
  'validation-rules': 'VALIDATION-RULES.md',
  taxonomy: 'TAXONOMY.md',
  changelog: 'CHANGELOG.md',
  traceability: 'TRACEABILITY.md',
} as const satisfies Record<SupportedDocumentationType, string>;

const expectedChildDirectoryLayout = {
  architecture: { childDirectory: null, entityPathLayout: null },
  decisions: { childDirectory: 'decisions', entityPathLayout: null },
  'business-rules': { childDirectory: 'business-rules', entityPathLayout: null },
  patterns: { childDirectory: 'patterns', entityPathLayout: null },
  roadmap: { childDirectory: 'roadmap', entityPathLayout: null },
  'current-work': { childDirectory: null, entityPathLayout: null },
  'requirements-executable': {
    childDirectory: 'requirements-executable',
    entityPathLayout: 'nested-index',
  },
  'requirements-specs': { childDirectory: 'requirements-specs', entityPathLayout: null },
  'validation-rules': { childDirectory: 'validation', entityPathLayout: null },
  taxonomy: { childDirectory: 'taxonomy', entityPathLayout: null },
  changelog: { childDirectory: null, entityPathLayout: null },
  traceability: { childDirectory: 'traceability', entityPathLayout: null },
} as const satisfies Record<
  SupportedDocumentationType,
  { readonly childDirectory: string | null; readonly entityPathLayout: 'nested-index' | null }
>;

const expectedDefaultDisclosureLevels = {
  architecture: 'essential',
  decisions: 'important',
  'business-rules': 'important',
  patterns: 'important',
  roadmap: 'important',
  'current-work': 'essential',
  'requirements-executable': 'important',
  'requirements-specs': 'important',
  'validation-rules': 'useful',
  taxonomy: 'advanced',
  changelog: 'useful',
  traceability: 'advanced',
} as const satisfies Record<SupportedDocumentationType, string>;

const expectedGeneratorAliases = {
  architecture: [],
  decisions: ['adrs'],
  'business-rules': [],
  patterns: [],
  roadmap: [],
  'current-work': ['current'],
  'requirements-executable': [],
  'requirements-specs': [],
  'validation-rules': [],
  taxonomy: [],
  changelog: [],
  traceability: [],
} as const satisfies Record<SupportedDocumentationType, readonly string[]>;

function entriesByType<TValue>(
  selector: (entry: (typeof SUPPORTED_DOCUMENTATION_TYPE_REGISTRY)[number]) => TValue,
): Record<SupportedDocumentationType, TValue> {
  return Object.fromEntries(
    SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map((entry) => [entry.key, selector(entry)]),
  ) as Record<SupportedDocumentationType, TValue>;
}

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the Documentation Type Registry contract state is initialized', () => {
      expect(SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.length).toBeGreaterThan(0);
    });
  });

  Rule('Registry identity stays explicit across documentation types', ({ RuleScenario }) => {
    RuleScenario(
      'identity axis pins supported keys route identities and lookups',
      ({ Then, And }) => {
        Then('the identity axis should expose the supported documentation keys in order', () => {
          expect(SUPPORTED_DOCUMENTATION_TYPES).toEqual(expectedDocumentationTypes);
          expect(SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map((entry) => entry.key)).toEqual(
            expectedDocumentationTypes,
          );
          expect(entriesByType((entry) => entry.rootRouteId)).toEqual(
            entriesByType((entry) => `${entry.key}:index`),
          );
        });

        And('the identity axis should resolve each key to the same metadata entry', () => {
          for (const entry of SUPPORTED_DOCUMENTATION_TYPE_REGISTRY) {
            expect(getDocumentationTypeMetadata(entry.key)).toBe(entry);
            expect(getSupportedDocumentationTypeMetadata(entry.key)).toBe(entry);
          }
        });
      },
    );
  });

  Rule('Registry output routing stays explicit across documentation types', ({ RuleScenario }) => {
    RuleScenario(
      'output-routing axis pins markdown targets child directories and entity layouts',
      ({ Then, And }) => {
        Then('the output-routing axis should expose the current markdown root targets', () => {
          expect(entriesByType((entry) => entry.markdownRootTarget)).toEqual(
            expectedMarkdownRootTargets,
          );
        });

        And('the output-routing axis should expose the current child directory layout', () => {
          expect(
            entriesByType((entry) => ({
              childDirectory: 'childDirectory' in entry ? entry.childDirectory : null,
              entityPathLayout: 'entityPathLayout' in entry ? entry.entityPathLayout : null,
            })),
          ).toEqual(expectedChildDirectoryLayout);
        });
      },
    );
  });

  Rule('Registry disclosure stays explicit across documentation types', ({ RuleScenario }) => {
    RuleScenario('disclosure axis pins defaults matrices and schema validity', ({ Then, And }) => {
      Then('the disclosure axis should expose the current default disclosure levels', () => {
        expect(entriesByType((entry) => entry.defaultDisclosureLevel)).toEqual(
          expectedDefaultDisclosureLevels,
        );
      });

      And(
        'the disclosure axis should expose a complete disclosure matrix for every documentation type',
        () => {
          for (const entry of SUPPORTED_DOCUMENTATION_TYPE_REGISTRY) {
            expect(() => SupportedDocumentationTypeRegistryEntrySchema.parse(entry)).not.toThrow();
            expect(Object.keys(entry.disclosureMatrix)).toEqual(PROGRESSIVE_DISCLOSURE_LEVELS);
            expect(entry.disclosureMatrix[entry.defaultDisclosureLevel]).toBeDefined();
          }
        },
      );
    });
  });

  Rule('Registry CLI surface stays explicit across documentation types', ({ RuleScenario }) => {
    RuleScenario('CLI-surface axis pins generator names and aliases', ({ Then, And }) => {
      Then('the CLI-surface axis should expose the current generator names', () => {
        expect(entriesByType((entry) => entry.generatorName)).toEqual(
          entriesByType((entry) => entry.key),
        );
      });

      And('the CLI-surface axis should expose the current generator aliases', () => {
        expect(entriesByType((entry) => entry.generatorAliases)).toEqual(expectedGeneratorAliases);
      });
    });
  });
});
