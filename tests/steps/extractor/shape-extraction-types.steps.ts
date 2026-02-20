/**
 * Step definitions for Shape Extraction - Type Extraction behavior tests
 *
 * Tests the TypeScript shape extraction system that extracts
 * interfaces, type aliases, enums, and function signatures
 * from source files for documentation generation.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ShapeExtractionTestState } from '../../support/helpers/shape-extraction-state.js';
import {
  resetState,
  unwrapExtraction,
  buildRegistry,
} from '../../support/helpers/shape-extraction-state.js';

const feature = await loadFeature('tests/features/extractor/shape-extraction-types.feature');

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
});
