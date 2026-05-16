import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  renderUi,
  type Fragment,
  type PatternDetail,
  type ProjectionBundle,
  type UiDocument,
} from '../../../src/index.js';

interface RenderUiState {
  input: Fragment | ProjectionBundle<Fragment> | null;
  rendered: UiDocument | null;
}

const feature = await loadFeature('tests/features/renderers/render-ui.feature');

let state: RenderUiState | null = null;

function createState(): RenderUiState {
  return {
    input: null,
    rendered: null,
  };
}

function createPatternDetailBundleFixture(): ProjectionBundle<PatternDetail> {
  return {
    root: createPatternDetailFixture('StudioDocs'),
    children: {
      'Onboarding Guide.md': createPatternDetailFixture('OnboardingGuide'),
      FAQ: createPatternDetailFixture('FAQ'),
    },
  };
}

function createPatternDetailFixture(patternName = 'RenderUiProjection'): PatternDetail {
  return {
    kind: 'PatternDetail',
    patternName,
    status: 'active',
    role: 'projection',
    phase: 14,
    file: 'packages/architect-projection/src/renderers/render-ui.ts',
    source: 'typescript',
    description: 'Render UI data in a stable order for Studio consumers.',
    deliverables: [
      {
        name: 'render-ui.ts',
        status: 'done',
        tests: ['render-ui.feature'],
        location: 'packages/architect-projection/src/renderers/render-ui.ts',
      },
    ],
    relationships: {
      dependsOn: ['ProjectionBundleContract'],
      enables: ['StudioProjectionConsumption'],
      uses: ['BlockSchema'],
      usedBy: ['StudioProjectionConsumption'],
      implementsPatterns: ['PerspectiveAwareProjections'],
      implementedBy: [
        {
          name: 'renderUi',
          file: 'packages/architect-projection/src/renderers/render-ui.ts',
        },
      ],
      extendsPattern: 'Renderers',
      extendedBy: ['DesktopRewire'],
      seeAlso: ['renderMarkdown'],
      apiRef: ['renderUi(input, options)'],
    },
    rules: [
      {
        name: 'UI data stays pure',
        invariant: 'No JSX or desktop imports are allowed in the renderer.',
        rationale: 'The renderer must stay reusable across consumers.',
        verifiedBy: ['render-ui.feature'],
        scenarioCount: 1,
      },
    ],
    stubs: [
      {
        name: 'slugifyChildLink',
        stubFile: 'architect/stubs/render-ui.ts',
        targetPath: 'packages/architect-projection/src/renderers/render-ui.ts',
      },
    ],
  };
}

function createBundleFixture(): ProjectionBundle<Fragment> {
  return {
    root: createPatternDetailFixture(),
    children: {
      'documentation-child': createPatternDetailFixture('DocumentationChild'),
      'pattern-detail-copy': {
        ...createPatternDetailFixture(),
        patternName: 'RenderUiProjectionChild',
      },
    },
    routing: {
      rootRouteId: 'docs:index',
      childRouteIds: {
        'documentation-child': 'docs:documentation-child',
        'pattern-detail-copy': 'docs:pattern-detail-copy',
      },
      childPathStrategy: 'nested',
      anchorStrategy: 'kind-id',
    },
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the renderUi test state is initialized', () => {
      state = createState();
    });
  });

  Rule('PatternDetail stays the native UI shape', ({ RuleScenario }) => {
    RuleScenario('PatternDetail renders structured UI sections', ({ Given, When, Then, And }) => {
      Given('a PatternDetail bundle fixture with sibling children and child references', () => {
        state!.input = createPatternDetailBundleFixture();
      });

      When('I render the bundle as UI data', () => {
        state!.rendered = renderUi(state!.input!) as UiDocument;
      });

      Then('the UI document should preserve the PatternDetail section hierarchy', () => {
        expect(state!.rendered?.kind).toBe('PatternDetail');
        expect(state!.rendered?.heading).toBe('StudioDocs');
        expect(state!.rendered?.sections.map((section) => section.id)).toContain('overview');
        expect(Object.keys(state!.rendered!.children ?? {}).sort()).toEqual([
          'FAQ',
          'Onboarding Guide.md',
        ]);
      });

      And('child bundle entries should stay addressable by their normalized child keys', () => {
        expect(Object.keys(state!.rendered!.children ?? {}).sort()).toEqual([
          'FAQ',
          'Onboarding Guide.md',
        ]);
        expect(state!.rendered!.children?.['Onboarding Guide.md']?.heading).toBe('OnboardingGuide');
      });
    });
  });

  Rule('PatternDetail uses a deterministic section order', ({ RuleScenario }) => {
    RuleScenario(
      'PatternDetail renders overview-first sections for Studio detail pages',
      ({ Given, When, Then }) => {
        Given('a PatternDetail fixture with deliverables relationships rules and stubs', () => {
          state!.input = createPatternDetailFixture();
        });

        When('I render the fragment as UI data', () => {
          state!.rendered = renderUi(state!.input!) as UiDocument;
        });

        Then('the PatternDetail UI sections should follow the deterministic detail order', () => {
          expect(state!.rendered?.heading).toBe('RenderUiProjection');
          expect(state!.rendered?.sections.map((section) => section.id)).toEqual([
            'overview',
            'deliverables',
            'relationships',
            'rules',
            'stubs',
          ]);
        });
      }
    );
  });

  Rule('Bundle traversal keeps the full nested UI tree', ({ RuleScenario }) => {
    RuleScenario(
      'Projection bundles become root documents with keyed children',
      ({ Given, When, Then }) => {
        Given('a bundle fixture with two named child fragments', () => {
          state!.input = createBundleFixture();
        });

        When('I render the bundle as UI data', () => {
          state!.rendered = renderUi(state!.input!) as UiDocument;
        });

        Then('the UI document should expose a nested children map keyed by child name', () => {
          expect(Object.keys(state!.rendered?.children ?? {})).toEqual([
            'documentation-child',
            'pattern-detail-copy',
          ]);
          expect(state!.rendered?.children?.['documentation-child']?.heading).toBe(
            'DocumentationChild'
          );
          expect(state!.rendered?.children?.['pattern-detail-copy']?.heading).toBe(
            'RenderUiProjectionChild'
          );
        });
      }
    );
  });
});
