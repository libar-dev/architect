/**
 * Step definitions for Shape Extraction - Rendering and Validation behavior tests
 *
 * Tests the TypeScript shape extraction system rendering, import/re-export
 * tracking, error handling, grouping options, annotation tag stripping,
 * and input validation.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ShapeExtractionTestState } from '../../support/helpers/shape-extraction-state.js';
import {
  resetState,
  unwrapExtraction,
  extractShapes,
  renderShapesAsMarkdown,
} from '../../support/helpers/shape-extraction-state.js';

const feature = await loadFeature('tests/features/extractor/shape-extraction-rendering.feature');

// =============================================================================
// Test State
// =============================================================================

let state: ShapeExtractionTestState;

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the shape extractor is initialized', () => {
      state = resetState();
    });
  });

  // ===========================================================================
  // RULE 6: Multiple Shapes in Order
  // ===========================================================================

  Rule('Multiple shapes are extracted in specified order', ({ RuleScenario }) => {
    RuleScenario('Shapes appear in tag order not source order', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shapes "Output, Input, Options"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Output', 'Input', 'Options']);
      });

      Then('3 shapes should be extracted', () => {
        expect(state.extractionResult!.shapes.length).toBe(3);
      });

      And('shape 0 should have name "Output"', () => {
        expect(state.extractionResult!.shapes[0].name).toBe('Output');
      });

      And('shape 1 should have name "Input"', () => {
        expect(state.extractionResult!.shapes[1].name).toBe('Input');
      });

      And('shape 2 should have name "Options"', () => {
        expect(state.extractionResult!.shapes[2].name).toBe('Options');
      });
    });

    RuleScenario('Mixed shape types in specified order', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shapes "Status, Config, validate"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, [
          'Status',
          'Config',
          'validate',
        ]);
      });

      Then('3 shapes should be extracted', () => {
        expect(state.extractionResult!.shapes.length).toBe(3);
      });

      And('shape 0 should have kind "type"', () => {
        expect(state.extractionResult!.shapes[0].kind).toBe('type');
      });

      And('shape 1 should have kind "interface"', () => {
        expect(state.extractionResult!.shapes[1].kind).toBe('interface');
      });

      And('shape 2 should have kind "function"', () => {
        expect(state.extractionResult!.shapes[2].kind).toBe('function');
      });
    });
  });

  // ===========================================================================
  // RULE 7: Shape Rendering
  // ===========================================================================

  Rule('Extracted shapes render as fenced code blocks', ({ RuleScenario }) => {
    RuleScenario('Render shapes as markdown', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shapes "Input, Output"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Input', 'Output']);
      });

      And('rendering shapes as markdown', () => {
        state.renderedMarkdown = renderShapesAsMarkdown(state.extractionResult!.shapes);
      });

      Then('the markdown should contain typescript code fence', () => {
        expect(state.renderedMarkdown).toContain('```typescript');
      });

      And('the markdown should contain "interface Input"', () => {
        expect(state.renderedMarkdown).toContain('interface Input');
      });

      And('the markdown should contain "interface Output"', () => {
        expect(state.renderedMarkdown).toContain('interface Output');
      });
    });
  });

  // ===========================================================================
  // RULE 8: Import and Re-export Handling
  // ===========================================================================

  Rule('Imported and re-exported shapes are tracked separately', ({ RuleScenario }) => {
    RuleScenario('Imported shape produces warning', ({ Given, When, Then }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Request"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Request']);
      });

      Then('the extraction should have imported entry for "Request"', () => {
        expect(state.extractionResult!.imported).toContain('Request');
      });
    });

    RuleScenario('Re-exported shape produces re-export entry', ({ Given, When, Then }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Foo"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Foo']);
      });

      Then('the extraction should have re-exported entry for "Foo" from "./types.js"', () => {
        const reExport = state.extractionResult!.reExported.find((r) => r.name === 'Foo');
        expect(reExport).toBeDefined();
        expect(reExport!.sourceModule).toBe('./types.js');
      });
    });
  });

  // ===========================================================================
  // RULE 12: Parse Error Handling
  // ===========================================================================

  Rule('Invalid TypeScript produces error result', ({ RuleScenario }) => {
    RuleScenario('Malformed TypeScript returns error', ({ Given, When, Then }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Invalid" expecting failure', () => {
        state.extractionRawResult = extractShapes(state.sourceCode, ['Invalid']);
      });

      Then('extraction should fail with parse error', () => {
        expect(state.extractionRawResult!.ok).toBe(false);
      });
    });
  });

  // ===========================================================================
  // RULE 10: Rendering Options
  // ===========================================================================

  Rule('Shape rendering supports grouping options', ({ RuleScenario }) => {
    RuleScenario('Grouped rendering in single code block', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shapes "Input, Output"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Input', 'Output']);
      });

      And('rendering shapes with groupInSingleBlock true', () => {
        state.renderedMarkdown = renderShapesAsMarkdown(state.extractionResult!.shapes, {
          groupInSingleBlock: true,
        });
      });

      Then('the markdown should have 1 code fence', () => {
        const fenceMatches = state.renderedMarkdown!.match(/```typescript/g) || [];
        expect(fenceMatches.length).toBe(1);
      });

      And('the markdown should contain "interface Input"', () => {
        expect(state.renderedMarkdown).toContain('interface Input');
      });

      And('the markdown should contain "interface Output"', () => {
        expect(state.renderedMarkdown).toContain('interface Output');
      });
    });

    RuleScenario('Separate rendering with multiple code blocks', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shapes "Input, Output"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Input', 'Output']);
      });

      And('rendering shapes with groupInSingleBlock false', () => {
        state.renderedMarkdown = renderShapesAsMarkdown(state.extractionResult!.shapes, {
          groupInSingleBlock: false,
        });
      });

      Then('the markdown should have 2 code fences', () => {
        const fenceMatches = state.renderedMarkdown!.match(/```typescript/g) || [];
        expect(fenceMatches.length).toBe(2);
      });
    });
  });

  // ===========================================================================
  // RULE 11: Annotation Tag Stripping from JSDoc
  // ===========================================================================

  Rule(
    'Annotation tags are stripped from extracted JSDoc while preserving standard tags',
    ({ RuleScenario }) => {
      RuleScenario('JSDoc with only annotation tags produces no jsDoc', ({ Given, When, Then }) => {
        Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
          state.sourceCode = docString;
        });

        When('extracting shapes "OnlyTags"', () => {
          state.extractionResult = unwrapExtraction(state.sourceCode, ['OnlyTags']);
        });

        Then('the shape "OnlyTags" should have no jsDoc', () => {
          const shape = state.extractionResult!.shapes.find((s) => s.name === 'OnlyTags');
          expect(shape).toBeDefined();
          expect(shape!.jsDoc).toBeUndefined();
        });
      });

      RuleScenario(
        'Mixed JSDoc preserves standard tags and strips annotation tags',
        ({ Given, When, Then, And }) => {
          Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
            state.sourceCode = docString;
          });

          When('extracting shapes "MixedTags"', () => {
            state.extractionResult = unwrapExtraction(state.sourceCode, ['MixedTags']);
          });

          Then(
            'the shape "MixedTags" jsDoc should contain "Configuration for the pipeline"',
            () => {
              const shape = state.extractionResult!.shapes.find((s) => s.name === 'MixedTags');
              expect(shape).toBeDefined();
              expect(shape!.jsDoc).toContain('Configuration for the pipeline');
            }
          );

          And('the shape "MixedTags" jsDoc should contain "@param timeout"', () => {
            const shape = state.extractionResult!.shapes.find((s) => s.name === 'MixedTags');
            expect(shape!.jsDoc).toContain('@param timeout');
          });

          And('the shape "MixedTags" jsDoc should contain "@returns"', () => {
            const shape = state.extractionResult!.shapes.find((s) => s.name === 'MixedTags');
            expect(shape!.jsDoc).toContain('@returns');
          });

          And('the shape "MixedTags" jsDoc should not contain "@libar-docs"', () => {
            const shape = state.extractionResult!.shapes.find((s) => s.name === 'MixedTags');
            expect(shape!.jsDoc).not.toContain('@libar-docs');
          });
        }
      );

      RuleScenario(
        'Single-line annotation-only JSDoc produces no jsDoc',
        ({ Given, When, Then }) => {
          Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
            state.sourceCode = docString;
          });

          When('extracting shapes "SingleLine"', () => {
            state.extractionResult = unwrapExtraction(state.sourceCode, ['SingleLine']);
          });

          Then('the shape "SingleLine" should have no jsDoc', () => {
            const shape = state.extractionResult!.shapes.find((s) => s.name === 'SingleLine');
            expect(shape).toBeDefined();
            expect(shape!.jsDoc).toBeUndefined();
          });
        }
      );

      RuleScenario(
        'Consecutive empty lines after tag removal are collapsed',
        ({ Given, When, Then, And }) => {
          Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
            state.sourceCode = docString;
          });

          When('extracting shapes "CollapsedLines"', () => {
            state.extractionResult = unwrapExtraction(state.sourceCode, ['CollapsedLines']);
          });

          Then('the shape "CollapsedLines" jsDoc should contain "Useful description here"', () => {
            const shape = state.extractionResult!.shapes.find((s) => s.name === 'CollapsedLines');
            expect(shape).toBeDefined();
            expect(shape!.jsDoc).toContain('Useful description here');
          });

          And(
            'the shape "CollapsedLines" jsDoc should not contain consecutive empty JSDoc lines',
            () => {
              const shape = state.extractionResult!.shapes.find((s) => s.name === 'CollapsedLines');
              expect(shape).toBeDefined();
              // Check for consecutive empty JSDoc continuation lines (` *` followed by ` *`)
              // Skip the /** opener and */ closer — they are delimiters, not content lines
              const lines = shape!.jsDoc!.split('\n');
              let prevWasEmpty = false;
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === '/**' || trimmed === '*/') continue;
                const isEmptyLine = trimmed === '*' || trimmed === '';
                expect(isEmptyLine && prevWasEmpty).toBe(false);
                prevWasEmpty = isEmptyLine;
              }
            }
          );
        }
      );
    }
  );

  // ===========================================================================
  // RULE 12: Input Validation
  // ===========================================================================

  Rule('Large source files are rejected to prevent memory exhaustion', ({ RuleScenario }) => {
    RuleScenario('Source code exceeding 5MB limit returns error', ({ Given, When, Then }) => {
      Given('TypeScript source code larger than 5MB', () => {
        // Create a string just over 5MB (5 * 1024 * 1024 + 1 bytes)
        // Use a valid TypeScript structure to ensure this tests size, not parsing
        const padding = 'x'.repeat(5 * 1024 * 1024 + 1);
        state.sourceCode = `// ${padding}\nexport interface Test { value: string; }`;
      });

      When('attempting to extract shapes', () => {
        state.extractionRawResult = extractShapes(state.sourceCode, ['Test']);
      });

      Then('the extraction should fail with error containing "exceeds maximum allowed"', () => {
        expect(state.extractionRawResult).not.toBeNull();
        expect(state.extractionRawResult!.ok).toBe(false);
        if (!state.extractionRawResult!.ok) {
          expect(state.extractionRawResult!.error.message).toContain('exceeds maximum allowed');
        }
      });
    });
  });
});
