import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  ACCEPTED_STATUS_VALUES,
  ADR_CATEGORY_VALUES,
  ARCHITECT_PACKAGE_PRODUCT_AREAS,
  ARCHITECT_PACKAGE_ROLES,
  CANONICAL_FEATURE_ONLY_TAG_SUFFIXES,
  CANONICAL_PHASE_NAMES,
  CANONICAL_PHASE_ORDINALS,
  DELIVERABLE_STATUS_VALUES,
  FORMAT_TYPES,
  QUARTER_PATTERN,
  VALID_TRANSITIONS,
  parseFeatureFile,
  parseMarkdownTableRows,
} from '@libar-dev/architect-core';

const adrPath = resolve(
  __dirname,
  '../../../architect/decisions/adr-001-taxonomy-canonical-values.feature',
);

function findRule(ruleName: string): { description: string } {
  const content = readFileSync(adrPath, 'utf8');
  const parsed = parseFeatureFile(content, adrPath);
  if (!parsed.ok) {
    throw new Error(`Failed to parse ADR-001: ${parsed.error.error.message}`);
  }
  const rule = parsed.value.rules?.find((r) => r.name === ruleName);
  if (!rule) throw new Error(`ADR-001 Rule "${ruleName}" not found`);
  return { description: rule.description };
}

function extractColumn(ruleName: string, columnName: string): string[] {
  const { description } = findRule(ruleName);
  return parseMarkdownTableRows(description)
    .map((row) => row[columnName]?.replace(/`/g, '').trim() ?? '')
    .filter((value) => value.length > 0);
}

const feature = await loadFeature(
  resolve(__dirname, '../../features/api/canonical-values-sync.feature'),
);

describeFeature(feature, ({ Rule }) => {
  Rule('ADR-001 Rule 1 matches ARCHITECT_PACKAGE_PRODUCT_AREAS', ({ RuleScenario }) => {
    RuleScenario(
      'Product-area values match between ADR-001 Rule 1 and ARCHITECT_PACKAGE_PRODUCT_AREAS',
      ({ Given, When, And, Then }) => {
        let adrValues: string[] = [];
        let constantValues: string[] = [];

        Given('the ADR-001 canonical values feature file', () => {});

        When('I extract the product-area values from Rule 1', () => {
          adrValues = extractColumn('Product area canonical values', 'Value');
        });

        And('I list the values in ARCHITECT_PACKAGE_PRODUCT_AREAS', () => {
          constantValues = [...ARCHITECT_PACKAGE_PRODUCT_AREAS];
        });

        Then('both product-area lists contain the same values', () => {
          expect([...adrValues].sort()).toEqual([...constantValues].sort());
        });
      },
    );
  });

  Rule('ADR-001 Rule 2 matches ADR_CATEGORY_VALUES', ({ RuleScenario }) => {
    RuleScenario(
      'ADR-category values match between ADR-001 Rule 2 and ADR_CATEGORY_VALUES',
      ({ Given, When, And, Then }) => {
        let adrValues: string[] = [];
        let constantValues: string[] = [];

        Given('the ADR-001 canonical values feature file', () => {});

        When('I extract the adr-category values from Rule 2', () => {
          adrValues = extractColumn('ADR category canonical values', 'Value');
        });

        And('I list the values in ADR_CATEGORY_VALUES', () => {
          constantValues = [...ADR_CATEGORY_VALUES];
        });

        Then('both adr-category lists contain the same values', () => {
          expect([...adrValues].sort()).toEqual([...constantValues].sort());
        });
      },
    );
  });

  Rule('ADR-001 Rule 3 matches ACCEPTED_STATUS_VALUES', ({ RuleScenario }) => {
    RuleScenario(
      'Status values match between ADR-001 Rule 3 and ACCEPTED_STATUS_VALUES',
      ({ Given, When, And, Then }) => {
        let adrValues: string[] = [];
        let constantValues: string[] = [];

        Given('the ADR-001 canonical values feature file', () => {});

        When('I extract the status values from Rule 3', () => {
          adrValues = extractColumn('FSM status values and protection levels', 'Status');
        });

        And('I list the values in ACCEPTED_STATUS_VALUES', () => {
          constantValues = [...ACCEPTED_STATUS_VALUES];
        });

        Then('both status lists contain the same values', () => {
          expect([...adrValues].sort()).toEqual([...constantValues].sort());
        });
      },
    );
  });

  Rule('ADR-001 Rule 4 matches VALID_TRANSITIONS', ({ RuleScenario }) => {
    RuleScenario(
      'Transitions match between ADR-001 Rule 4 and VALID_TRANSITIONS',
      ({ Given, When, And, Then }) => {
        let adrPairs: string[] = [];
        let constantPairs: string[] = [];

        Given('the ADR-001 canonical values feature file', () => {});

        When('I extract the transition pairs from Rule 4', () => {
          const { description } = findRule('Valid FSM transitions');
          adrPairs = parseMarkdownTableRows(description)
            .map((row) => `${row['From']?.trim() ?? ''}->${row['To']?.trim() ?? ''}`)
            .filter((pair) => pair !== '->');
        });

        And('I list the pairs in VALID_TRANSITIONS', () => {
          constantPairs = Object.entries(VALID_TRANSITIONS).flatMap(([from, tos]) =>
            tos.map((to) => `${from}->${to}`),
          );
        });

        Then('both transition pair lists contain the same pairs', () => {
          expect([...adrPairs].sort()).toEqual([...constantPairs].sort());
        });
      },
    );
  });

  Rule('ADR-001 Rule 5 matches FORMAT_TYPES', ({ RuleScenario }) => {
    RuleScenario(
      'Format types match between ADR-001 Rule 5 and FORMAT_TYPES',
      ({ Given, When, And, Then }) => {
        let adrValues: string[] = [];
        let constantValues: string[] = [];

        Given('the ADR-001 canonical values feature file', () => {});

        When('I extract the format-type values from Rule 5', () => {
          adrValues = extractColumn('Tag format types', 'Format');
        });

        And('I list the values in FORMAT_TYPES', () => {
          constantValues = [...FORMAT_TYPES];
        });

        Then('both format-type lists contain the same values', () => {
          expect([...adrValues].sort()).toEqual([...constantValues].sort());
        });
      },
    );
  });

  Rule(
    'ADR-001 Rule 6 canonical minimum matches CANONICAL_FEATURE_ONLY_TAG_SUFFIXES',
    ({ RuleScenario }) => {
      RuleScenario(
        'Canonical feature-only tags match between ADR-001 Rule 6 and CANONICAL_FEATURE_ONLY_TAG_SUFFIXES',
        ({ Given, When, And, Then }) => {
          let adrTags: string[] = [];
          let constantTags: string[] = [];

          Given('the ADR-001 canonical values feature file', () => {});

          When('I extract the canonical feature-only tags from Rule 6', () => {
            const { description } = findRule('Source ownership');
            adrTags = parseMarkdownTableRows(description)
              .filter((row) => row['Tag Type']?.trim() === 'feature-metadata')
              .map((row) => row['Tag']?.replace(/`/g, '').trim() ?? '')
              .filter((tag) => tag.length > 0);
          });

          And('I list the values in CANONICAL_FEATURE_ONLY_TAG_SUFFIXES', () => {
            constantTags = [...CANONICAL_FEATURE_ONLY_TAG_SUFFIXES];
          });

          Then('both canonical feature-only tag lists contain the same values', () => {
            expect([...adrTags].sort()).toEqual([...constantTags].sort());
          });
        },
      );
    },
  );

  Rule('ADR-001 Rule 7 quarter format regex matches QUARTER_PATTERN', ({ RuleScenario }) => {
    RuleScenario("QUARTER_PATTERN encodes ADR-001 Rule 7's format", ({ Given, Then, And }) => {
      Given('the QUARTER_PATTERN regex', () => {});

      Then('it accepts the canonical example "2026-Q1"', () => {
        expect(QUARTER_PATTERN.test('2026-Q1')).toBe(true);
      });

      And('it rejects the anti-pattern "Q1-2026"', () => {
        expect(QUARTER_PATTERN.test('Q1-2026')).toBe(false);
      });
    });
  });

  Rule('ADR-001 Rule 8 phase names match CANONICAL_PHASE_NAMES', ({ RuleScenario }) => {
    RuleScenario(
      'Phase names match between ADR-001 Rule 8 and CANONICAL_PHASE_NAMES',
      ({ Given, When, And, Then }) => {
        let adrNames: string[] = [];
        let constantNames: string[] = [];

        Given('the ADR-001 canonical values feature file', () => {});

        When('I extract the phase names from Rule 8', () => {
          adrNames = extractColumn('Canonical phase definitions (6-phase USDP standard)', 'Phase');
        });

        And('I list the names in CANONICAL_PHASE_NAMES', () => {
          constantNames = [...CANONICAL_PHASE_NAMES];
        });

        Then('both phase-name lists contain the same names', () => {
          expect([...adrNames].sort()).toEqual([...constantNames].sort());
        });
      },
    );
  });

  Rule('ADR-001 Rule 8 phase ordinals match CANONICAL_PHASE_ORDINALS', ({ RuleScenario }) => {
    RuleScenario(
      'Phase ordinals match between ADR-001 Rule 8 and CANONICAL_PHASE_ORDINALS',
      ({ Given, When, And, Then }) => {
        let adrOrdinals: number[] = [];
        let constantOrdinals: number[] = [];

        Given('the ADR-001 canonical values feature file', () => {});

        When('I extract the phase ordinals from Rule 8', () => {
          adrOrdinals = extractColumn(
            'Canonical phase definitions (6-phase USDP standard)',
            'Order',
          ).map((value) => Number.parseInt(value, 10));
        });

        And('I list the ordinals in CANONICAL_PHASE_ORDINALS', () => {
          constantOrdinals = [...CANONICAL_PHASE_ORDINALS];
        });

        Then('both phase-ordinal lists contain the same ordinals', () => {
          expect([...adrOrdinals].sort()).toEqual([...constantOrdinals].sort());
        });
      },
    );
  });

  Rule('ADR-001 Rule 9 matches DELIVERABLE_STATUS_VALUES', ({ RuleScenario }) => {
    RuleScenario(
      'Deliverable status values match between ADR-001 Rule 9 and DELIVERABLE_STATUS_VALUES',
      ({ Given, When, And, Then }) => {
        let adrValues: string[] = [];
        let constantValues: string[] = [];

        Given('the ADR-001 canonical values feature file', () => {});

        When('I extract the deliverable status values from Rule 9', () => {
          adrValues = extractColumn('Deliverable status canonical values', 'Value');
        });

        And('I list the values in DELIVERABLE_STATUS_VALUES', () => {
          constantValues = [...DELIVERABLE_STATUS_VALUES];
        });

        Then('both deliverable-status lists contain the same values', () => {
          expect([...adrValues].sort()).toEqual([...constantValues].sort());
        });
      },
    );
  });

  Rule('ADR-001 Rule 10 matches ARCHITECT_PACKAGE_ROLES', ({ RuleScenario }) => {
    RuleScenario(
      'Role tags match between ADR-001 Rule 10 and ARCHITECT_PACKAGE_ROLES',
      ({ Given, When, And, Then }) => {
        let adrTags: string[] = [];
        let constantTags: string[] = [];

        Given('the ADR-001 canonical values feature file', () => {});

        When('I extract the role tags from Rule 10', () => {
          adrTags = extractColumn('Canonical role values', 'Tag');
        });

        And('I list the tags in ARCHITECT_PACKAGE_ROLES', () => {
          constantTags = ARCHITECT_PACKAGE_ROLES.map((role) => role.tag);
        });

        Then('both lists contain the same tags', () => {
          expect([...adrTags].sort()).toEqual([...constantTags].sort());
        });
      },
    );
  });
});
