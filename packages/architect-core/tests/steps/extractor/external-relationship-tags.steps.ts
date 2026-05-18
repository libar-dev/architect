import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { extractPatternsFromGherkin } from '../../../src/extractor/gherkin-extractor.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type { TagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type {
  ScannedGherkinFile,
  GherkinFeature,
} from '../../../src/validation-schemas/feature.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/extracted-pattern.js';

const feature = await loadFeature('tests/features/extractor/external-relationship-tags.feature');

interface State {
  registry: TagRegistry | null;
  pattern: ExtractedPattern | null;
}

let state: State;

function resetState(): State {
  return { registry: null, pattern: null };
}

function makeScannedFile(tags: readonly string[]): ScannedGherkinFile {
  const featureNode: GherkinFeature = {
    name: 'Synthetic',
    description: '',
    tags,
    language: 'en',
    line: 1,
  };
  return {
    filePath: '/test/synthetic.feature',
    feature: featureNode,
    scenarios: [],
  };
}

async function runExtraction(headerTag: string): Promise<void> {
  const registry = state.registry!;
  const tags = [
    'architect',
    'architect-pattern:Synthetic',
    'architect-status:active',
    `architect-${headerTag}`,
  ];
  const result = await extractPatternsFromGherkin([makeScannedFile(tags)], {
    baseDir: '/test',
    tagRegistry: registry,
  });
  state.pattern = result.patterns[0] ?? null;
}

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a default tag registry context', () => {
      state = resetState();
      state.registry = createDefaultTagRegistry();
    });
  });

  Rule('uses (csv) propagates to ExtractedPattern.uses', ({ RuleScenario }) => {
    RuleScenario('Single cross-process dependency surfaces in uses', ({ When, Then }) => {
        When('I extract a Gherkin feature with header tag "uses:pkg:CandidateExtraction"', async () => {
          await runExtraction('uses:pkg:CandidateExtraction');
        });

      Then('the extracted pattern\'s uses equals "pkg:CandidateExtraction"', () => {
        expect(state.pattern).not.toBeNull();
        expect(state.pattern?.uses).toEqual(['pkg:CandidateExtraction']);
      });
    });

    RuleScenario('Multi-value csv populates uses in order', ({ When, Then }) => {
        When(
          'I extract a Gherkin feature with header tag "uses:pkg:CandidateExtraction, studio:PatternBrowserView"',
          async () => {
            await runExtraction('uses:pkg:CandidateExtraction, studio:PatternBrowserView');
          },
        );

      Then(
        'the extracted pattern\'s uses equals "pkg:CandidateExtraction, studio:PatternBrowserView"',
        () => {
          expect(state.pattern).not.toBeNull();
          expect(state.pattern?.uses).toEqual([
            'pkg:CandidateExtraction',
            'studio:PatternBrowserView',
          ]);
        },
      );
    });
  });

  Rule(
    'bounded-context (value) propagates to ExtractedPattern.boundedContext',
    ({ RuleScenario }) => {
      RuleScenario('bounded-context value surfaces in boundedContext', ({ When, Then }) => {
        When(
          'I extract a Gherkin feature with header tag "bounded-context:delivery-reporting"',
          async () => {
            await runExtraction('bounded-context:delivery-reporting');
          },
        );

        Then('the extracted pattern\'s boundedContext equals "delivery-reporting"', () => {
          expect(state.pattern).not.toBeNull();
          expect(state.pattern?.boundedContext).toBe('delivery-reporting');
        });
      });
    },
  );

  Rule('level (enum) propagates to ExtractedPattern.level', ({ RuleScenario }) => {
    RuleScenario('epic level surfaces in level', ({ When, Then }) => {
        When('I extract a Gherkin feature with header tag "level:epic"', async () => {
          await runExtraction('level:epic');
        });

      Then('the extracted pattern\'s level equals "epic"', () => {
        expect(state.pattern).not.toBeNull();
        expect(state.pattern?.level).toBe('epic');
      });
    });

    RuleScenario('slice level surfaces in level', ({ When, Then }) => {
        When('I extract a Gherkin feature with header tag "level:slice"', async () => {
          await runExtraction('level:slice');
        });

      Then('the extracted pattern\'s level equals "slice"', () => {
        expect(state.pattern).not.toBeNull();
        expect(state.pattern?.level).toBe('slice');
      });
    });
  });

  Rule('parent (value) propagates to ExtractedPattern.parent', ({ RuleScenario }) => {
    RuleScenario('parent value surfaces in parent', ({ When, Then }) => {
        When('I extract a Gherkin feature with header tag "parent:LifecycleMvpEpic"', async () => {
          await runExtraction('parent:LifecycleMvpEpic');
        });

      Then('the extracted pattern\'s parent equals "LifecycleMvpEpic"', () => {
        expect(state.pattern).not.toBeNull();
        expect(state.pattern?.parent).toBe('LifecycleMvpEpic');
      });
    });
  });
});
