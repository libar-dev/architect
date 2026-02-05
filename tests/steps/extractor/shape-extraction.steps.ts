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
import type { ShapeExtractionResult } from '../../../src/validation-schemas/extracted-shape.js';
import { buildRegistry } from '../../../src/taxonomy/index.js';
import type { Result } from '../../../src/types/result.js';

/**
 * Helper to unwrap extractShapes result for tests.
 * Throws if extraction failed (tests should provide valid source code).
 */
function unwrapExtraction(sourceCode: string, shapeNames: string[]): ShapeExtractionResult {
  const result = extractShapes(sourceCode, shapeNames);
  if (!result.ok) {
    throw new Error(`Shape extraction failed: ${result.error.message}`);
  }
  return result.value;
}

const feature = await loadFeature('tests/features/extractor/shape-extraction.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  sourceCode: string;
  shapeNames: string[];
  extractionResult: ShapeExtractionResult | null;
  extractionRawResult: Result<ShapeExtractionResult> | null;
  renderedMarkdown: string | null;
  tagRegistry: ReturnType<typeof buildRegistry> | null;
}

let state: TestState;

function resetState(): void {
  state = {
    sourceCode: '',
    shapeNames: [],
    extractionResult: null,
    extractionRawResult: null,
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['MyConfig']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['ConfigOptions']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Result']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['ExtendedConfig']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['NonExistent']);
      });

      Then('the extraction should have not-found entry for "NonExistent"', () => {
        expect(state.extractionResult!.notFound).toContain('NonExistent');
      });
    });
  });

  // ===========================================================================
  // RULE 2b: Property-Level JSDoc Extraction
  // ===========================================================================

  Rule('Property-level JSDoc is extracted for interface properties', ({ RuleScenario }) => {
    RuleScenario('Extract properties with adjacent JSDoc', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "User"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['User']);
      });

      Then('the shape should have property docs for "id"', () => {
        const propDoc = state.extractionResult!.shapes[0].propertyDocs?.find(
          (p) => p.name === 'id'
        );
        expect(propDoc, 'Property "id" should have docs').toBeDefined();
      });

      And('the property "id" JSDoc should contain "unique identifier"', () => {
        const propDoc = state.extractionResult!.shapes[0].propertyDocs?.find(
          (p) => p.name === 'id'
        );
        expect(propDoc?.jsDoc).toContain('unique identifier');
      });

      And('the shape should have property docs for "name"', () => {
        const propDoc = state.extractionResult!.shapes[0].propertyDocs?.find(
          (p) => p.name === 'name'
        );
        expect(propDoc, 'Property "name" should have docs').toBeDefined();
      });

      And('the property "name" JSDoc should contain "display name"', () => {
        const propDoc = state.extractionResult!.shapes[0].propertyDocs?.find(
          (p) => p.name === 'name'
        );
        expect(propDoc?.jsDoc).toContain('display name');
      });
    });

    RuleScenario(
      'Interface JSDoc not attributed to first property',
      ({ Given, When, Then, And }) => {
        Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
          state.sourceCode = docString;
        });

        When('extracting shape "User"', () => {
          state.extractionResult = unwrapExtraction(state.sourceCode, ['User']);
        });

        Then('the shape JSDoc should contain "Represents a user"', () => {
          expect(state.extractionResult!.shapes[0].jsDoc).toContain('Represents a user');
        });

        And('the shape should not have property docs for "id"', () => {
          const propDoc = state.extractionResult!.shapes[0].propertyDocs?.find(
            (p) => p.name === 'id'
          );
          expect(propDoc, 'Property "id" should NOT have docs').toBeUndefined();
        });

        And('the shape should not have property docs for "name"', () => {
          const propDoc = state.extractionResult!.shapes[0].propertyDocs?.find(
            (p) => p.name === 'name'
          );
          expect(propDoc, 'Property "name" should NOT have docs').toBeUndefined();
        });
      }
    );

    RuleScenario('Mixed documented and undocumented properties', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Config"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Config']);
      });

      Then('the shape should have property docs for "apiKey"', () => {
        const propDoc = state.extractionResult!.shapes[0].propertyDocs?.find(
          (p) => p.name === 'apiKey'
        );
        expect(propDoc, 'Property "apiKey" should have docs').toBeDefined();
      });

      And('the shape should not have property docs for "timeout"', () => {
        const propDoc = state.extractionResult!.shapes[0].propertyDocs?.find(
          (p) => p.name === 'timeout'
        );
        expect(propDoc, 'Property "timeout" should NOT have docs').toBeUndefined();
      });

      And('the shape should have property docs for "retries"', () => {
        const propDoc = state.extractionResult!.shapes[0].propertyDocs?.find(
          (p) => p.name === 'retries'
        );
        expect(propDoc, 'Property "retries" should have docs').toBeDefined();
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Status']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Readonly']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Unwrap']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Severity']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Direction']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['validateChanges']);
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
        state.extractionResult = unwrapExtraction(state.sourceCode, ['fetchData']);
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
  // RULE 11: Const Declaration Extraction
  // ===========================================================================

  Rule('Const declarations are extracted from TypeScript AST', ({ RuleScenario }) => {
    RuleScenario('Extract const with type annotation', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "API_VERSION"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['API_VERSION']);
      });

      Then('the shape should be extracted with kind "const"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('const');
      });

      And('the shape source should contain "const API_VERSION: string"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('const API_VERSION: string');
      });
    });

    RuleScenario('Extract const without type annotation', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "MAX_RETRIES"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['MAX_RETRIES']);
      });

      Then('the shape should be extracted with kind "const"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('const');
      });

      And('the shape source should contain "MAX_RETRIES = 3"', () => {
        expect(state.extractionResult!.shapes[0].sourceText).toContain('MAX_RETRIES = 3');
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
  // RULE 13: Non-Exported Shape Extraction
  // ===========================================================================

  Rule('Non-exported shapes are extractable', ({ RuleScenario }) => {
    RuleScenario('Extract non-exported interface', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "InternalConfig"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['InternalConfig']);
      });

      Then('the shape should be extracted with kind "interface"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('interface');
      });

      And('the shape should have exported false', () => {
        expect(state.extractionResult!.shapes[0].exported).toBe(false);
      });
    });

    RuleScenario('Re-export marks internal shape as exported', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });

      When('extracting shape "Config"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Config']);
      });

      Then('the shape should be extracted with kind "interface"', () => {
        expect(state.extractionResult!.shapes.length).toBe(1);
        expect(state.extractionResult!.shapes[0].kind).toBe('interface');
      });

      And('the shape should have exported true', () => {
        expect(state.extractionResult!.shapes[0].exported).toBe(true);
      });
    });
  });

  // ===========================================================================
  // RULE 11: Input Validation
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
