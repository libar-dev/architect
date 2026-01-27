/**
 * DocString MediaType Preservation Step Definitions
 *
 * BDD step definitions for testing DocString mediaType (language hint) preservation
 * through the parsing pipeline from feature files to rendered output.
 *
 * @libar-docs
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { parseFeatureFile } from '../../../src/scanner/gherkin-ast-parser.js';
import { renderDocString } from '../../../src/renderable/codecs/helpers.js';
import type { Result } from '../../../src/types/result.js';
import type { SectionBlock, CodeBlock } from '../../../src/renderable/schema.js';

// =============================================================================
// Types
// =============================================================================

interface ParsedStep {
  keyword: string;
  text: string;
  docString?: {
    content: string;
    mediaType?: string;
  };
}

interface ParsedScenario {
  name: string;
  tags: string[];
  steps: ParsedStep[];
}

interface ParsedFeature {
  name: string;
  description: string;
  tags: string[];
  language: string;
}

interface GherkinParseResult {
  feature: ParsedFeature;
  scenarios: ParsedScenario[];
}

interface DocstringMediatypeState {
  fileContent: string;
  parseResult: Result<GherkinParseResult, { file: string; error: Error }> | null;
  docString: string | { content: string; mediaType?: string } | null;
  renderedBlock: SectionBlock | null;
  defaultLanguage: string;
}

// =============================================================================
// Module State
// =============================================================================

let state: DocstringMediatypeState | null = null;

function initState(): DocstringMediatypeState {
  return {
    fileContent: '',
    parseResult: null,
    docString: null,
    renderedBlock: null,
    defaultLanguage: 'markdown',
  };
}

// =============================================================================
// Test Feature Content (hardcoded to avoid vitest-cucumber escaping issues)
// =============================================================================

const TEST_FEATURES = {
  typescript: `Feature: Code Example
  Scenario: Has typed docstring
    Given the following code:
      """typescript
      const x: number = 1;
      """
`,
  json: `Feature: JSON Example
  Scenario: Has JSON docstring
    Given the following data:
      """json
      {"key": "value"}
      """
`,
  jsdoc: `Feature: JSDoc Example
  Scenario: Has jsdoc docstring
    Given the following documentation:
      """jsdoc
      /**
       * @param name - The user name
       * @returns The greeting message
       */
      """
`,
  plain: `Feature: Plain DocString
  Scenario: No language hint
    Given plain text:
      """
      Just some plain text
      """
`,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get step from parse result by scenario and step index (1-based)
 */
function getStep(scenarioIdx: number, stepIdx: number): ParsedStep | undefined {
  if (!state?.parseResult?.ok) return undefined;
  const scenario = state.parseResult.value.scenarios[scenarioIdx - 1];
  return scenario?.steps[stepIdx - 1];
}

/**
 * Type guard for code blocks
 */
function isCodeBlock(block: SectionBlock | null): block is CodeBlock {
  return block !== null && block.type === 'code';
}

// =============================================================================
// Feature: DocString MediaType Preservation
// =============================================================================

const feature = await loadFeature('tests/features/scanner/docstring-mediatype.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a gherkin parser test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Parser preserves DocString mediaType during extraction
  // ===========================================================================

  Rule('Parser preserves DocString mediaType during extraction', ({ RuleScenario }) => {
    RuleScenario('Parse DocString with typescript mediaType', ({ Given, When, Then, And }) => {
      Given('a feature file containing a typescript docstring', () => {
        state!.fileContent = TEST_FEATURES.typescript;
      });

      When('the feature file is parsed', () => {
        state!.parseResult = parseFeatureFile(state!.fileContent, 'test.feature');
      });

      Then('parsing succeeds', () => {
        expect(state!.parseResult?.ok).toBe(true);
      });

      And(
        'scenario {int} step {int} has docString.content containing {string}',
        (_ctx: unknown, scenarioIdx: number, stepIdx: number, expectedContent: string) => {
          const step = getStep(scenarioIdx, stepIdx);
          expect(step?.docString?.content).toContain(expectedContent);
        }
      );

      And(
        'scenario {int} step {int} has docString.mediaType {string}',
        (_ctx: unknown, scenarioIdx: number, stepIdx: number, expectedMediaType: string) => {
          const step = getStep(scenarioIdx, stepIdx);
          expect(step?.docString?.mediaType).toBe(expectedMediaType);
        }
      );
    });

    RuleScenario('Parse DocString with json mediaType', ({ Given, When, Then }) => {
      Given('a feature file containing a json docstring', () => {
        state!.fileContent = TEST_FEATURES.json;
      });

      When('the feature file is parsed', () => {
        state!.parseResult = parseFeatureFile(state!.fileContent, 'test.feature');
      });

      Then(
        'scenario {int} step {int} has docString.mediaType {string}',
        (_ctx: unknown, scenarioIdx: number, stepIdx: number, expectedMediaType: string) => {
          expect(state!.parseResult?.ok).toBe(true);
          const step = getStep(scenarioIdx, stepIdx);
          expect(step?.docString?.mediaType).toBe(expectedMediaType);
        }
      );
    });

    RuleScenario('Parse DocString with jsdoc mediaType', ({ Given, When, Then }) => {
      Given('a feature file containing a jsdoc docstring', () => {
        state!.fileContent = TEST_FEATURES.jsdoc;
      });

      When('the feature file is parsed', () => {
        state!.parseResult = parseFeatureFile(state!.fileContent, 'test.feature');
      });

      Then(
        'scenario {int} step {int} has docString.mediaType {string}',
        (_ctx: unknown, scenarioIdx: number, stepIdx: number, expectedMediaType: string) => {
          expect(state!.parseResult?.ok).toBe(true);
          const step = getStep(scenarioIdx, stepIdx);
          expect(step?.docString?.mediaType).toBe(expectedMediaType);
        }
      );
    });

    RuleScenario(
      'DocString without mediaType has undefined mediaType',
      ({ Given, When, Then, And }) => {
        Given('a feature file containing a plain docstring without mediaType', () => {
          state!.fileContent = TEST_FEATURES.plain;
        });

        When('the feature file is parsed', () => {
          state!.parseResult = parseFeatureFile(state!.fileContent, 'test.feature');
        });

        Then(
          'scenario {int} step {int} has docString.content {string}',
          (_ctx: unknown, scenarioIdx: number, stepIdx: number, expectedContent: string) => {
            expect(state!.parseResult?.ok).toBe(true);
            const step = getStep(scenarioIdx, stepIdx);
            expect(step?.docString?.content).toBe(expectedContent);
          }
        );

        And(
          'scenario {int} step {int} has docString.mediaType undefined',
          (_ctx: unknown, scenarioIdx: number, stepIdx: number) => {
            const step = getStep(scenarioIdx, stepIdx);
            expect(step?.docString?.mediaType).toBeUndefined();
          }
        );
      }
    );
  });

  // ===========================================================================
  // Rule 2: MediaType flows through to code block rendering
  // ===========================================================================

  Rule('MediaType is used when rendering code blocks', ({ RuleScenario }) => {
    RuleScenario(
      'TypeScript mediaType renders as typescript code block',
      ({ Given, When, Then }) => {
        Given(
          'a docString with content {string} and mediaType {string}',
          (_ctx: unknown, content: string, mediaType: string) => {
            state!.docString = { content, mediaType };
          }
        );

        When('the step docString is rendered', () => {
          state!.renderedBlock = renderDocString(state!.docString!, state!.defaultLanguage);
        });

        Then('the code block language is {string}', (_ctx: unknown, expectedLanguage: string) => {
          expect(isCodeBlock(state!.renderedBlock)).toBe(true);
          if (isCodeBlock(state!.renderedBlock)) {
            expect(state!.renderedBlock.language).toBe(expectedLanguage);
          }
        });
      }
    );

    RuleScenario('JSDoc mediaType prevents asterisk escaping', ({ Given, When, Then, And }) => {
      Given(
        'a docString with content {string} and mediaType {string}',
        (_ctx: unknown, content: string, mediaType: string) => {
          state!.docString = { content, mediaType };
        }
      );

      When('the step docString is rendered', () => {
        state!.renderedBlock = renderDocString(state!.docString!, state!.defaultLanguage);
      });

      Then('the code block language is {string}', (_ctx: unknown, expectedLanguage: string) => {
        expect(isCodeBlock(state!.renderedBlock)).toBe(true);
        if (isCodeBlock(state!.renderedBlock)) {
          expect(state!.renderedBlock.language).toBe(expectedLanguage);
        }
      });

      And('asterisks are not escaped in the output', () => {
        expect(isCodeBlock(state!.renderedBlock)).toBe(true);
        if (isCodeBlock(state!.renderedBlock)) {
          // Asterisks should remain as-is (not escaped as \*)
          const content =
            typeof state!.docString === 'string'
              ? state!.docString
              : (state!.docString?.content ?? '');
          if (content.includes('*')) {
            expect(state!.renderedBlock.content).toContain('*');
            expect(state!.renderedBlock.content).not.toContain('\\*');
          }
        }
      });
    });

    RuleScenario('Missing mediaType falls back to default language', ({ Given, When, Then }) => {
      Given(
        'a docString with content {string} and no mediaType',
        (_ctx: unknown, content: string) => {
          state!.docString = { content };
        }
      );

      When(
        'the step docString is rendered with default language {string}',
        (_ctx: unknown, defaultLang: string) => {
          state!.defaultLanguage = defaultLang;
          state!.renderedBlock = renderDocString(state!.docString!, state!.defaultLanguage);
        }
      );

      Then('the code block language is {string}', (_ctx: unknown, expectedLanguage: string) => {
        expect(isCodeBlock(state!.renderedBlock)).toBe(true);
        if (isCodeBlock(state!.renderedBlock)) {
          expect(state!.renderedBlock.language).toBe(expectedLanguage);
        }
      });
    });
  });

  // ===========================================================================
  // Rule 3: Backward compatibility with string docStrings
  // ===========================================================================

  Rule('renderDocString handles both string and object formats', ({ RuleScenario }) => {
    RuleScenario(
      'String docString renders correctly (legacy format)',
      ({ Given, When, Then, And }) => {
        Given('a docString as plain string {string}', (_ctx: unknown, content: string) => {
          state!.docString = content;
        });

        When(
          'renderDocString is called with language {string}',
          (_ctx: unknown, language: string) => {
            state!.defaultLanguage = language;
            state!.renderedBlock = renderDocString(state!.docString!, state!.defaultLanguage);
          }
        );

        Then('the code block contains {string}', (_ctx: unknown, expectedContent: string) => {
          expect(isCodeBlock(state!.renderedBlock)).toBe(true);
          if (isCodeBlock(state!.renderedBlock)) {
            expect(state!.renderedBlock.content).toContain(expectedContent);
          }
        });

        And('the code block language is {string}', (_ctx: unknown, expectedLanguage: string) => {
          expect(isCodeBlock(state!.renderedBlock)).toBe(true);
          if (isCodeBlock(state!.renderedBlock)) {
            expect(state!.renderedBlock.language).toBe(expectedLanguage);
          }
        });
      }
    );

    RuleScenario(
      'Object docString with mediaType takes precedence',
      ({ Given, When, Then, And }) => {
        Given(
          'a docString with content {string} and mediaType {string}',
          (_ctx: unknown, content: string, mediaType: string) => {
            state!.docString = { content, mediaType };
          }
        );

        When(
          'renderDocString is called with language {string}',
          (_ctx: unknown, language: string) => {
            state!.defaultLanguage = language;
            state!.renderedBlock = renderDocString(state!.docString!, state!.defaultLanguage);
          }
        );

        Then('the code block language is {string}', (_ctx: unknown, expectedLanguage: string) => {
          expect(isCodeBlock(state!.renderedBlock)).toBe(true);
          if (isCodeBlock(state!.renderedBlock)) {
            expect(state!.renderedBlock.language).toBe(expectedLanguage);
          }
        });

        And('the language parameter is ignored', () => {
          // This is implicitly verified by the previous assertion - if mediaType is "typescript"
          // and the language parameter is "javascript", the block should have language "typescript"
          expect(isCodeBlock(state!.renderedBlock)).toBe(true);
          if (isCodeBlock(state!.renderedBlock)) {
            // The mediaType from the object should take precedence
            const docStringObj = state!.docString as { content: string; mediaType?: string };
            if (docStringObj.mediaType) {
              expect(state!.renderedBlock.language).toBe(docStringObj.mediaType);
              expect(state!.renderedBlock.language).not.toBe(state!.defaultLanguage);
            }
          }
        });
      }
    );
  });
});
