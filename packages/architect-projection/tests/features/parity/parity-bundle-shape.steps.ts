import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  parseAndProjectBusinessRuleSet,
  projectRequirementExecutableDigest,
  renderMarkdown,
  type BusinessRuleSet,
  type ProjectionBundle,
  type ProjectionContext,
  type RequirementDigest,
} from '../../../src/index.js';

import { PARITY_PACKAGE_COUNT, createParityContext } from './parity-fixtures.js';

interface BundleShapeState {
  context: ProjectionContext | null;
  businessRuleBundle: ProjectionBundle<BusinessRuleSet> | null;
  requirementBundle: ProjectionBundle<RequirementDigest> | null;
  markdown: Record<string, string> | null;
}

const feature = await loadFeature('tests/features/parity/parity-bundle-shape.feature');

let state: BundleShapeState | null = null;

function createState(): BundleShapeState {
  return {
    context: null,
    businessRuleBundle: null,
    requirementBundle: null,
    markdown: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a parity projection context with three patterns across two packages', () => {
      state = createState();
      state.context = createParityContext();
    });
  });

  Rule(
    'Requirement bundles carry references, not embedded BusinessRule fragments',
    ({ RuleScenario }) => {
      RuleScenario(
        'Requirement bundle children carry zero BusinessRule fragments',
        ({ When, Then, And }) => {
          When('I project the requirements-executable bundle', () => {
            state!.requirementBundle = projectRequirementExecutableDigest(state!.context!);
          });

          Then('no child fragment is a BusinessRule', () => {
            for (const child of Object.values(state!.requirementBundle!.children)) {
              expect(child.kind).not.toBe('BusinessRule');
            }
            expect(state!.requirementBundle!.root.kind).not.toBe('BusinessRule');
          });

          And('every RequirementDigest carries a businessRuleReferences array', () => {
            const digests = collectRequirementDigests(state!.requirementBundle!);
            expect(digests.length).toBeGreaterThan(0);
            for (const digest of digests) {
              expect(Array.isArray(digest.businessRuleReferences)).toBe(true);
            }
          });

          And('every BusinessRuleReference carries a populated ownerRouteId', () => {
            const references = collectRequirementDigests(state!.requirementBundle!).flatMap(
              (digest) => digest.businessRuleReferences,
            );
            for (const reference of references) {
              expect(reference.kind).toBe('BusinessRuleReference');
              expect(reference.ownerRouteId.length).toBeGreaterThan(0);
              expect(reference.feature.length).toBeGreaterThan(0);
              expect(reference.ruleName.length).toBeGreaterThan(0);
            }
          });
        },
      );
    },
  );

  Rule('Default-disclosure business-rules bundle stays compact', ({ RuleScenario }) => {
    RuleScenario(
      'Markdown output has one root plus one child per package',
      ({ When, And, Then }) => {
        When('I project the business-rules bundle grouped by package', () => {
          state!.businessRuleBundle = parseAndProjectBusinessRuleSet(state!.context!, {
            scope: 'all',
            groupedBy: 'package',
          });
        });

        And('I render the bundle to markdown', () => {
          state!.markdown = renderMarkdown(state!.businessRuleBundle!) as Record<string, string>;
        });

        Then('the rendered file map has at most one root file', () => {
          const paths = Object.keys(state!.markdown!);
          const rootPaths = paths.filter((path) => !path.includes('/'));
          expect(rootPaths.length).toBeLessThanOrEqual(1);
        });

        And('the rendered file map has one child file per configured package', () => {
          // Default-disclosure grouping by package emits exactly one child file per
          // configured package — total child count equals PARITY_PACKAGE_COUNT, no
          // per-rule files.
          const childPaths = Object.keys(state!.markdown!).filter((path) => path.includes('/'));
          expect(childPaths.length).toBe(PARITY_PACKAGE_COUNT);
        });

        And('no rendered file path matches a business-rule-*.md pattern', () => {
          const offenders = Object.keys(state!.markdown!).filter((path) =>
            /business-rule-[^/]+\.md$/.test(path),
          );
          expect(offenders).toEqual([]);
        });
      },
    );
  });
});

function collectRequirementDigests(
  bundle: ProjectionBundle<RequirementDigest>,
): RequirementDigest[] {
  // ProjectionBundle.children is structurally `Record<string, Fragment>` (the
  // full discriminated union); the bundle's type parameter promises children
  // share root's kind, which the parity scenarios assert at runtime.
  const childDigests = Object.values(bundle.children).filter(
    (fragment): fragment is RequirementDigest => fragment.kind === 'RequirementDigest',
  );
  return [bundle.root, ...childDigests];
}
