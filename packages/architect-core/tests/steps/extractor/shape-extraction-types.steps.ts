import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ShapeExtractionTestState } from '../../support/helpers/shape-extraction-state.js';
import {
  resetState,
  unwrapExtraction,
  unwrapDiscovery,
} from '../../support/helpers/shape-extraction-state.js';
import type { ExtractedShape } from '../../../src/validation-schemas/extracted-shape.js';

const feature = await loadFeature('tests/features/extractor/shape-extraction-types.feature');

let state: ShapeExtractionTestState;

function firstShape(): ExtractedShape {
  const shape = state.extractionResult?.shapes[0];
  expect(shape).toBeDefined();
  return shape!;
}

function firstDiscoveredShape(): ExtractedShape {
  const shape = state.discoveryResult?.shapes[0];
  expect(shape).toBeDefined();
  return shape!;
}

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the shape extractor is initialized', () => {
      state = resetState();
    });
  });

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
        expect(firstShape().kind).toBe('interface');
      });
      And('the shape source should contain "timeout: number"', () => {
        expect(firstShape().sourceText).toContain('timeout: number');
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
        expect(firstShape().kind).toBe('interface');
      });
      And('the shape JSDoc should contain "Configuration for the processor"', () => {
        expect(firstShape().jsDoc).toContain('Configuration for the processor');
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
        expect(firstShape().kind).toBe('interface');
      });
      And('the shape source should contain "<T, E = Error>"', () => {
        expect(firstShape().sourceText).toContain('<T, E = Error>');
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
        expect(firstShape().kind).toBe('interface');
      });
      And('the shape source should contain "extends BaseConfig"', () => {
        expect(firstShape().sourceText).toContain('extends BaseConfig');
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

  Rule('Property-level JSDoc is extracted for interface properties', ({ RuleScenario }) => {
    RuleScenario('Extract properties with adjacent JSDoc', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });
      When('extracting shape "User"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['User']);
      });
      Then('the shape should have property docs for "id"', () => {
        expect(firstShape().propertyDocs?.find((p) => p.name === 'id')).toBeDefined();
      });
      And('the property "id" JSDoc should contain "unique identifier"', () => {
        expect(firstShape().propertyDocs?.find((p) => p.name === 'id')?.jsDoc).toContain(
          'unique identifier',
        );
      });
      And('the shape should have property docs for "name"', () => {
        expect(firstShape().propertyDocs?.find((p) => p.name === 'name')).toBeDefined();
      });
      And('the property "name" JSDoc should contain "display name"', () => {
        expect(firstShape().propertyDocs?.find((p) => p.name === 'name')?.jsDoc).toContain(
          'display name',
        );
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
          expect(firstShape().jsDoc).toContain('Represents a user');
        });
        And('the shape should not have property docs for "id"', () => {
          expect(firstShape().propertyDocs?.find((p) => p.name === 'id')).toBeUndefined();
        });
        And('the shape should not have property docs for "name"', () => {
          expect(firstShape().propertyDocs?.find((p) => p.name === 'name')).toBeUndefined();
        });
      },
    );

    RuleScenario('Mixed documented and undocumented properties', ({ Given, When, Then, And }) => {
      Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
        state.sourceCode = docString;
      });
      When('extracting shape "Config"', () => {
        state.extractionResult = unwrapExtraction(state.sourceCode, ['Config']);
      });
      Then('the shape should have property docs for "apiKey"', () => {
        expect(firstShape().propertyDocs?.find((p) => p.name === 'apiKey')).toBeDefined();
      });
      And('the shape should not have property docs for "timeout"', () => {
        expect(firstShape().propertyDocs?.find((p) => p.name === 'timeout')).toBeUndefined();
      });
      And('the shape should have property docs for "retries"', () => {
        expect(firstShape().propertyDocs?.find((p) => p.name === 'retries')).toBeDefined();
      });
    });
  });

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
        expect(firstShape().kind).toBe('type');
      });
      And("the shape source should contain \"'pending' | 'active' | 'completed'\"", () => {
        expect(firstShape().sourceText).toContain("'pending' | 'active' | 'completed'");
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
        expect(firstShape().kind).toBe('type');
      });
      And('the shape source should contain "[K in keyof T]"', () => {
        expect(firstShape().sourceText).toContain('[K in keyof T]');
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
        expect(firstShape().kind).toBe('type');
      });
      And('the shape source should contain "extends Promise<infer U>"', () => {
        expect(firstShape().sourceText).toContain('extends Promise<infer U>');
      });
    });
  });

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
        expect(firstShape().kind).toBe('enum');
      });
      And('the shape source should contain "Error = \'error\'"', () => {
        expect(firstShape().sourceText).toContain("Error = 'error'");
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
        expect(firstShape().kind).toBe('enum');
      });
      And('the shape source should contain "const enum"', () => {
        expect(firstShape().sourceText).toContain('const enum');
      });
    });
  });

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
        expect(firstShape().kind).toBe('function');
      });
      And('the shape source should contain "function validateChanges"', () => {
        expect(firstShape().sourceText).toContain('function validateChanges');
      });
      And('the shape source should not contain "return"', () => {
        expect(firstShape().sourceText).not.toContain('return');
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
        expect(firstShape().kind).toBe('function');
      });
      And('the shape source should contain "async function fetchData"', () => {
        expect(firstShape().sourceText).toContain('async function fetchData');
      });
    });
  });

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
        expect(firstShape().kind).toBe('const');
      });
      And('the shape source should contain "const API_VERSION: string"', () => {
        expect(firstShape().sourceText).toContain('const API_VERSION: string');
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
        expect(firstShape().kind).toBe('const');
      });
      And('the shape source should contain "MAX_RETRIES = 3"', () => {
        expect(firstShape().sourceText).toContain('MAX_RETRIES = 3');
      });
    });
  });

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
        expect(firstShape().kind).toBe('interface');
      });
      And('the shape should have exported false', () => {
        expect(firstShape().exported).toBe(false);
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
        expect(firstShape().kind).toBe('interface');
      });
      And('the shape should have exported true', () => {
        expect(firstShape().exported).toBe(true);
      });
    });
  });

  Rule(
    'Tagged-shape discovery recognises only standalone @architect-shape tag lines',
    ({ RuleScenario }) => {
      RuleScenario(
        'Prose mention of the tag does not extract the declaration',
        ({ Given, When, Then }) => {
          Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
            state.sourceCode = docString;
          });
          When('tagged shapes are discovered', () => {
            state.discoveryResult = unwrapDiscovery(state.sourceCode);
          });
          Then('no tagged shapes should be discovered', () => {
            expect(state.discoveryResult!.shapes.length).toBe(0);
          });
        },
      );

      RuleScenario(
        'Standalone tag line extracts the declaration without a group',
        ({ Given, When, Then, And }) => {
          Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
            state.sourceCode = docString;
          });
          When('tagged shapes are discovered', () => {
            state.discoveryResult = unwrapDiscovery(state.sourceCode);
          });
          Then('1 tagged shape should be discovered', () => {
            expect(state.discoveryResult!.shapes.length).toBe(1);
          });
          And('the discovered shape should have no group', () => {
            expect(firstDiscoveredShape().group).toBeUndefined();
          });
        },
      );

      RuleScenario(
        'Trailing token on the tag line is captured as the group',
        ({ Given, When, Then, And }) => {
          Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
            state.sourceCode = docString;
          });
          When('tagged shapes are discovered', () => {
            state.discoveryResult = unwrapDiscovery(state.sourceCode);
          });
          Then('1 tagged shape should be discovered', () => {
            expect(state.discoveryResult!.shapes.length).toBe(1);
          });
          And('the discovered shape group should be "Contracts"', () => {
            expect(firstDiscoveredShape().group).toBe('Contracts');
          });
        },
      );

      RuleScenario('Sibling include line resolves to a csv list', ({ Given, When, Then, And }) => {
        Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
          state.sourceCode = docString;
        });
        When('tagged shapes are discovered', () => {
          state.discoveryResult = unwrapDiscovery(state.sourceCode);
        });
        Then('1 tagged shape should be discovered', () => {
          expect(state.discoveryResult!.shapes.length).toBe(1);
        });
        And('the discovered shape should include "Helper"', () => {
          expect(firstDiscoveredShape().includes).toContain('Helper');
        });
        And('the discovered shape should include "Other"', () => {
          expect(firstDiscoveredShape().includes).toContain('Other');
        });
      });

      RuleScenario(
        'Line-start prose missing the @ marker does not extract the declaration',
        ({ Given, When, Then }) => {
          Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
            state.sourceCode = docString;
          });
          When('tagged shapes are discovered', () => {
            state.discoveryResult = unwrapDiscovery(state.sourceCode);
          });
          Then('no tagged shapes should be discovered', () => {
            expect(state.discoveryResult!.shapes.length).toBe(0);
          });
        },
      );

      RuleScenario(
        'A bare markerless tag line alone does not extract the declaration',
        ({ Given, When, Then }) => {
          Given('TypeScript source code:', (_ctx: unknown, docString: string) => {
            state.sourceCode = docString;
          });
          When('tagged shapes are discovered', () => {
            state.discoveryResult = unwrapDiscovery(state.sourceCode);
          });
          Then('no tagged shapes should be discovered', () => {
            expect(state.discoveryResult!.shapes.length).toBe(0);
          });
        },
      );
    },
  );
});
