/**
 * Step definitions for Shape Extraction behavior tests
 *
 * Tests the TypeScript shape extraction system that extracts
 * interfaces, type aliases, enums, and function signatures
 * from source files for documentation generation.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { extractShapes, renderShapesAsMarkdown } from '../../../src/extractor/shape-extractor.js';
import type { ExtractedShape } from '../../../src/validation-schemas/extracted-shape.js';
import { buildRegistry } from '../../../src/taxonomy/index.js';

const feature = await loadFeature('tests/features/extractor/shape-extraction.feature');

// =============================================================================
// Test State
// =============================================================================

interface ShapeExtractionResult {
  shapes: ExtractedShape[];
  notFound: string[];
  imported: string[];
  reExported: Array<{ name: string; sourceModule: string; typeOnly: boolean }>;
  warnings: string[];
}

interface TestState {
  sourceCode: string;
  shapeNames: string[];
  extractionResult: ShapeExtractionResult | null;
  renderedMarkdown: string | null;
  tagRegistry: ReturnType<typeof buildRegistry> | null;
}

let state: TestState;

function resetState(): void {
  state = {
    sourceCode: '',
    shapeNames: [],
    extractionResult: null,
    renderedMarkdown: null,
    tagRegistry: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the shape extractor is initialized', () => {
      resetState();
    });
  });

  // ===========================================================================
  // RULE 1: Tag Definition
  // ===========================================================================

  Rule('extract-shapes tag exists in registry with CSV format', ({ RuleScenario }) => {
    RuleScenario('Tag registry contains extract-shapes with correct format', ({ Given, Then }) => {
      Given('the tag registry is loaded', () => {
        state.tagRegistry = buildRegistry();
      });

      Then('the tag "extract-shapes" should exist with format "csv"', () => {
        const tag = state.tagRegistry?.metadataTags.find((t) => t.tag === 'extract-shapes');
        expect(tag).toBeDefined();
        expect(tag?.format).toBe('csv');
      });
    });
  });

  // ===========================================================================
  // RULE 2: Interface Extraction
  // ===========================================================================

  Rule('Interfaces are extracted from TypeScript AST', ({ RuleScenario }) => {
    RuleScenario('Extract simple interface', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "MyConfig"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['MyConfig']);
      });

      Then('the shape should be extracted with kind "interface"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('interface');
      });

      And('the shape source should contain "timeout: number"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('timeout: number');
      });
    });

    RuleScenario('Extract interface with JSDoc', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "ConfigOptions"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['ConfigOptions']);
      });

      Then('the shape should be extracted with kind "interface"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('interface');
      });

      And('the shape JSDoc should contain "Configuration for the processor"', () => {
        expect(state.extractionResult!.shapes[0].jsDoc).toContain(
          'Configuration for the processor'
        );
      });
    });

    RuleScenario('Extract interface with generics', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Result"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['Result']);
      });

      Then('the shape should be extracted with kind "interface"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('interface');
      });

      And('the shape source should contain "<T, E = Error>"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('<T, E = Error>');
      });
    });

    RuleScenario('Extract interface with extends', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "ExtendedConfig"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['ExtendedConfig']);
      });

      Then('the shape should be extracted with kind "interface"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('interface');
      });

      And('the shape source should contain "extends BaseConfig"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('extends BaseConfig');
      });
    });

    RuleScenario('Non-existent shape produces not-found entry', ({ Given, When, Then }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "NonExistent"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['NonExistent']);
      });

      Then('the extraction should have not-found entry for "NonExistent"', () => {
        expect(state.extractionResult!.notFound).toContain('NonExistent');
      });
    });
  });

  // ===========================================================================
  // RULE 3: Type Alias Extraction
  // ===========================================================================

  Rule('Type aliases are extracted from TypeScript AST', ({ RuleScenario }) => {
    RuleScenario('Extract union type alias', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Status"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['Status']);
      });

      Then('the shape should be extracted with kind "type"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('type');
      });

      And("the shape source should contain \"'pending' | 'active' | 'completed'\"", () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain(
          "'pending' | 'active' | 'completed'"
        );
      });
    });

    RuleScenario('Extract mapped type', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Readonly"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['Readonly']);
      });

      Then('the shape should be extracted with kind "type"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('type');
      });

      And('the shape source should contain "[K in keyof T]"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('[K in keyof T]');
      });
    });

    RuleScenario('Extract conditional type', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Unwrap"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['Unwrap']);
      });

      Then('the shape should be extracted with kind "type"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('type');
      });

      And('the shape source should contain "extends Promise<infer U>"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('extends Promise<infer U>');
      });
    });
  });

  // ===========================================================================
  // RULE 4: Enum Extraction
  // ===========================================================================

  Rule('Enums are extracted from TypeScript AST', ({ RuleScenario }) => {
    RuleScenario('Extract string enum', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Severity"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['Severity']);
      });

      Then('the shape should be extracted with kind "enum"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('enum');
      });

      And('the shape source should contain "Error = \'error\'"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain("Error = 'error'");
      });
    });

    RuleScenario('Extract const enum', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Direction"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['Direction']);
      });

      Then('the shape should be extracted with kind "enum"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('enum');
      });

      And('the shape source should contain "const enum"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('const enum');
      });
    });
  });

  // ===========================================================================
  // RULE 5: Function Signature Extraction
  // ===========================================================================

  Rule('Function signatures are extracted with body omitted', ({ RuleScenario }) => {
    RuleScenario('Extract function signature', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "validateChanges"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['validateChanges']);
      });

      Then('the shape should be extracted with kind "function"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('function');
      });

      And('the shape source should contain "function validateChanges"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('function validateChanges');
      });

      And('the shape source should not contain "return"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).not.toContain('return');
      });
    });

    RuleScenario('Extract async function signature', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "fetchData"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['fetchData']);
      });

      Then('the shape should be extracted with kind "function"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('function');
      });

      And('the shape source should contain "async function fetchData"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('async function fetchData');
      });
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
        state.extractionResult = extractShapes(state.sourceCode, ['Output', 'Input', 'Options']);
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
        state.extractionResult = extractShapes(state.sourceCode, ['Status', 'Config', 'validate']);
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
        state.extractionResult = extractShapes(state.sourceCode, ['Input', 'Output']);
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
        state.extractionResult = extractShapes(state.sourceCode, ['Request']);
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
        state.extractionResult = extractShapes(state.sourceCode, ['Foo']);
      });

      Then('the extraction should have re-exported entry for "Foo" from "./types.js"', () => {
        const reExport = state.extractionResult!.reExported.find((r) => r.name === 'Foo');
        expect(reExport).toBeDefined();
        expect(reExport!.sourceModule).toBe('./types.js');
      });
    });
  });

  // ===========================================================================
  // RULE 9: Function Overloads
  // NOTE: Overload extraction is specified but not yet implemented.
  // See delivery-process/specs/shape-extraction.feature Rule 9.
  // ===========================================================================

  // ===========================================================================
  // RULE 10: Rendering Options
  // ===========================================================================

  Rule('Shape rendering supports grouping options', ({ RuleScenario }) => {
    RuleScenario('Grouped rendering in single code block', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shapes "Input, Output"', () => {
        state.extractionResult = extractShapes(state.sourceCode, ['Input', 'Output']);
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
        state.extractionResult = extractShapes(state.sourceCode, ['Input', 'Output']);
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
});
