/**
 * Step definitions for Extraction Pipeline Enhancements
 *
 * Tests extraction pipeline capabilities for ReferenceDocShowcase:
 * function signature surfacing (DD-1), full property-level JSDoc (DD-2),
 * param/returns/throws extraction (DD-3), and auto-shape discovery mode (DD-4).
 *
 * Spans two API domains: AST parser (Rule 1) and shape extractor (Rules 2-4).
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

// AST parser (Rule 1)
import { parseFileDirectives } from '../../../src/scanner/ast-parser.js';
import { Result } from '../../../src/types/index.js';
import { createTempDir, writeTempFile } from '../../support/helpers/file-system.js';
import type { ParsedDirectiveResult } from '../../support/world.js';

// Shape extractor (Rules 2-4)
import { extractShapes, processExtractShapesTag } from '../../../src/extractor/shape-extractor.js';
import type { ProcessExtractShapesResult } from '../../../src/extractor/shape-extractor.js';
import type { ShapeExtractionResult } from '../../../src/validation-schemas/extracted-shape.js';

// =============================================================================
// Feature Loading
// =============================================================================

const feature = await loadFeature(
  'tests/features/extractor/extraction-pipeline-enhancements.feature'
);

// =============================================================================
// Test State
// =============================================================================

interface ExtractionPipelineState {
  // AST Parser domain (Rule 1)
  tempDir: string | null;
  cleanup: (() => Promise<void>) | null;
  filePath: string | null;
  fileContent: string;
  directives: ParsedDirectiveResult[];

  // Shape Extractor domain (Rules 2-4)
  sourceCode: string;
  extractionResult: ShapeExtractionResult | null;

  // Wildcard domain (Rule 4)
  wildcardResult: ProcessExtractShapesResult | null;
}

let state: ExtractionPipelineState;

function resetState(): void {
  state = {
    tempDir: null,
    cleanup: null,
    filePath: null,
    fileContent: '',
    directives: [],
    sourceCode: '',
    extractionResult: null,
    wildcardResult: null,
  };
}

// =============================================================================
// Helper: get first shape from extraction result
// =============================================================================

function getFirstShape(): ShapeExtractionResult['shapes'][0] {
  if (state.extractionResult === null) throw new Error('No extraction result');
  const shape = state.extractionResult.shapes[0];
  if (shape === undefined) throw new Error('No shapes extracted');
  return shape;
}

// =============================================================================
// Shared Step Handlers
// =============================================================================

// -- Rule 1: AST Parser steps ------------------------------------------------

async function givenTypeScriptFileWithContent(_ctx: unknown, docString: string): Promise<void> {
  if (state.tempDir === null) throw new Error('State not initialized');
  const content = docString.trim();
  state.fileContent = content;
  state.filePath = await writeTempFile(state.tempDir, 'test.ts', content);
}

function whenAstParserExtractsMetadata(): void {
  if (state.filePath === null) throw new Error('File path not set');
  const result = parseFileDirectives(state.fileContent, state.filePath);
  if (Result.isOk(result)) {
    state.directives = result.value.directives as ParsedDirectiveResult[];
  } else {
    throw new Error(`Parse failed: ${result.error.message}`);
  }
}

function thenFunctionExportHasSignature(
  _ctx: unknown,
  exportName: string,
  expectedSignature: string
): void {
  const allExports = state.directives.flatMap((d) => [...d.exports]);
  const fnExport = allExports.find((e) => e.name === exportName);
  expect(fnExport, `Export "${exportName}" should exist`).toBeDefined();
  if (fnExport === undefined) return;
  expect(fnExport.type).toBe('function');
  if (fnExport.type === 'function') {
    expect(fnExport.signature).toBe(expectedSignature);
  }
}

// -- Rules 2-3: Shape extraction steps ----------------------------------------

function givenTypeScriptSourceForShapeExtraction(_ctx: unknown, docString: string): void {
  state.sourceCode = docString.trim();
}

function whenExtractingShape(_ctx: unknown, shapeName: string): void {
  const result = extractShapes(state.sourceCode, [shapeName]);
  if (!result.ok) {
    throw new Error(`Shape extraction failed: ${result.error.message}`);
  }
  state.extractionResult = result.value;
}

// -- Rule 4: Wildcard steps ---------------------------------------------------

function givenTypeScriptSourceForWildcard(_ctx: unknown, docString: string): void {
  state.sourceCode = docString.trim();
}

function whenExtractingWithWildcard(): void {
  state.wildcardResult = processExtractShapesTag(state.sourceCode, '*');
}

function whenExtractingWithTag(_ctx: unknown, tagValue: string): void {
  state.wildcardResult = processExtractShapesTag(state.sourceCode, tagValue);
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(async () => {
    if (state.cleanup) {
      await state.cleanup();
    }
  });

  Background(({ Given }) => {
    Given('the extraction pipeline test context is initialized', async () => {
      resetState();
      const tempContext = await createTempDir({ prefix: 'extraction-pipeline-' });
      state.tempDir = tempContext.tempDir;
      state.cleanup = tempContext.cleanup;
    });
  });

  // ===========================================================================
  // RULE 1: Function signatures surface full parameter types in ExportInfo
  // ===========================================================================

  Rule('Function signatures surface full parameter types in ExportInfo', ({ RuleScenario }) => {
    RuleScenario(
      'Simple function signature is extracted with full types',
      ({ Given, When, Then }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the AST parser extracts pattern metadata', whenAstParserExtractsMetadata);
        Then('the function export {string} has signature {string}', thenFunctionExportHasSignature);
      }
    );

    RuleScenario('Async function keeps async prefix in signature', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the AST parser extracts pattern metadata', whenAstParserExtractsMetadata);
      Then('the function export {string} has signature {string}', thenFunctionExportHasSignature);
    });

    RuleScenario('Multi-parameter function has all types in signature', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the AST parser extracts pattern metadata', whenAstParserExtractsMetadata);
      Then('the function export {string} has signature {string}', thenFunctionExportHasSignature);
    });

    RuleScenario(
      'Function with object parameter type preserves braces',
      ({ Given, When, Then }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the AST parser extracts pattern metadata', whenAstParserExtractsMetadata);
        Then('the function export {string} has signature {string}', thenFunctionExportHasSignature);
      }
    );
  });

  // ===========================================================================
  // RULE 2: Property-level JSDoc preserves full multi-line content
  // ===========================================================================

  Rule('Property-level JSDoc preserves full multi-line content', ({ RuleScenario }) => {
    RuleScenario('Multi-line property JSDoc is fully preserved', ({ Given, When, Then }) => {
      Given('TypeScript source for shape extraction:', givenTypeScriptSourceForShapeExtraction);
      When('extracting shape {string}', whenExtractingShape);
      Then(
        'the property {string} JSDoc contains all fragments:',
        (_ctx: unknown, propName: string, table: ReadonlyArray<{ fragment: string }>) => {
          const shape = getFirstShape();
          const propDoc = shape.propertyDocs?.find((p) => p.name === propName);
          expect(propDoc, `Property "${propName}" should have docs`).toBeDefined();
          if (propDoc === undefined) return;
          for (const row of table) {
            expect(propDoc.jsDoc).toContain(row.fragment);
          }
        }
      );
    });

    RuleScenario('Single-line property JSDoc still works', ({ Given, When, Then }) => {
      Given('TypeScript source for shape extraction:', givenTypeScriptSourceForShapeExtraction);
      When('extracting shape {string}', whenExtractingShape);
      Then(
        'the property {string} JSDoc is {string}',
        (_ctx: unknown, propName: string, expectedText: string) => {
          const shape = getFirstShape();
          const propDoc = shape.propertyDocs?.find((p) => p.name === propName);
          expect(propDoc, `Property "${propName}" should have docs`).toBeDefined();
          if (propDoc === undefined) return;
          expect(propDoc.jsDoc).toBe(expectedText);
        }
      );
    });
  });

  // ===========================================================================
  // RULE 3: Param returns and throws tags are extracted from function JSDoc
  // ===========================================================================

  Rule('Param returns and throws tags are extracted from function JSDoc', ({ RuleScenario }) => {
    RuleScenario('Param tags are extracted from function JSDoc', ({ Given, When, Then, And }) => {
      Given('TypeScript source for shape extraction:', givenTypeScriptSourceForShapeExtraction);
      When('extracting shape {string}', whenExtractingShape);
      Then('the shape has {int} param docs', (_ctx: unknown, count: number) => {
        const shape = getFirstShape();
        expect(shape.params).toHaveLength(count);
      });
      And(
        'the param docs match:',
        (_ctx: unknown, table: ReadonlyArray<{ name: string; description: string }>) => {
          const shape = getFirstShape();
          for (const row of table) {
            const param = shape.params?.find((p) => p.name === row.name);
            expect(param, `Param "${row.name}" should exist`).toBeDefined();
            if (param === undefined) continue;
            expect(param.description).toBe(row.description);
          }
        }
      );
    });

    RuleScenario('Returns tag is extracted from function JSDoc', ({ Given, When, Then }) => {
      Given('TypeScript source for shape extraction:', givenTypeScriptSourceForShapeExtraction);
      When('extracting shape {string}', whenExtractingShape);
      Then(
        'the shape has a returns doc with description {string}',
        (_ctx: unknown, expectedDesc: string) => {
          const shape = getFirstShape();
          expect(shape.returns).toBeDefined();
          if (shape.returns === undefined) return;
          expect(shape.returns.description).toBe(expectedDesc);
        }
      );
    });

    RuleScenario('Throws tags are extracted from function JSDoc', ({ Given, When, Then, And }) => {
      Given('TypeScript source for shape extraction:', givenTypeScriptSourceForShapeExtraction);
      When('extracting shape {string}', whenExtractingShape);
      Then('the shape has {int} throws docs', (_ctx: unknown, count: number) => {
        const shape = getFirstShape();
        expect(shape.throws).toHaveLength(count);
      });
      And(
        'the throws docs match:',
        (_ctx: unknown, table: ReadonlyArray<{ type: string; description: string }>) => {
          const shape = getFirstShape();
          for (let i = 0; i < table.length; i++) {
            const row = table[i];
            if (row === undefined) continue;
            const throwsDoc = shape.throws?.[i];
            expect(throwsDoc, `Throws doc at index ${i} should exist`).toBeDefined();
            if (throwsDoc === undefined) continue;
            expect(throwsDoc.type).toBe(row.type);
            expect(throwsDoc.description).toBe(row.description);
          }
        }
      );
    });

    RuleScenario(
      'JSDoc params with braces type syntax are parsed',
      ({ Given, When, Then, And }) => {
        Given('TypeScript source for shape extraction:', givenTypeScriptSourceForShapeExtraction);
        When('extracting shape {string}', whenExtractingShape);
        Then('the shape has {int} param docs', (_ctx: unknown, count: number) => {
          const shape = getFirstShape();
          expect(shape.params).toHaveLength(count);
        });
        And(
          'the typed param docs match:',
          (
            _ctx: unknown,
            table: ReadonlyArray<{ name: string; type: string; description: string }>
          ) => {
            const shape = getFirstShape();
            for (const row of table) {
              const param = shape.params?.find((p) => p.name === row.name);
              expect(param, `Param "${row.name}" should exist`).toBeDefined();
              if (param === undefined) continue;
              expect(param.type).toBe(row.type);
              expect(param.description).toBe(row.description);
            }
          }
        );
        And(
          'the shape has a returns doc with type {string}',
          (_ctx: unknown, expectedType: string) => {
            const shape = getFirstShape();
            expect(shape.returns).toBeDefined();
            if (shape.returns === undefined) return;
            expect(shape.returns.type).toBe(expectedType);
          }
        );
      }
    );
  });

  // ===========================================================================
  // RULE 4: Auto-shape discovery extracts all exported types via wildcard
  // ===========================================================================

  Rule('Auto-shape discovery extracts all exported types via wildcard', ({ RuleScenario }) => {
    RuleScenario('Wildcard extracts all exported declarations', ({ Given, When, Then, And }) => {
      Given('TypeScript source for wildcard extraction:', givenTypeScriptSourceForWildcard);
      When('extracting shapes with wildcard "*"', whenExtractingWithWildcard);
      Then('{int} shapes are extracted', (_ctx: unknown, count: number) => {
        if (state.wildcardResult === null) throw new Error('No wildcard result');
        expect(state.wildcardResult.shapes).toHaveLength(count);
      });
      And(
        'the extracted shapes include all:',
        (_ctx: unknown, table: ReadonlyArray<{ name: string }>) => {
          if (state.wildcardResult === null) throw new Error('No wildcard result');
          const names = state.wildcardResult.shapes.map((s) => s.name);
          for (const row of table) {
            expect(names).toContain(row.name);
          }
        }
      );
      And('the extracted shapes do not include {string}', (_ctx: unknown, shapeName: string) => {
        if (state.wildcardResult === null) throw new Error('No wildcard result');
        const names = state.wildcardResult.shapes.map((s) => s.name);
        expect(names).not.toContain(shapeName);
      });
    });

    RuleScenario('Mixed wildcard and names produces warning', ({ Given, When, Then, And }) => {
      Given('TypeScript source for wildcard extraction:', givenTypeScriptSourceForWildcard);
      When('extracting shapes with tag {string}', whenExtractingWithTag);
      Then('extraction produces a warning about wildcard exclusivity', () => {
        if (state.wildcardResult === null) throw new Error('No wildcard result');
        const hasWarning = state.wildcardResult.warnings.some(
          (w) => w.includes('Wildcard') || w.includes('wildcard') || w.includes("'*'")
        );
        expect(hasWarning, 'Should have wildcard exclusivity warning').toBe(true);
      });
      And('{int} shapes are extracted', (_ctx: unknown, count: number) => {
        if (state.wildcardResult === null) throw new Error('No wildcard result');
        expect(state.wildcardResult.shapes).toHaveLength(count);
      });
    });

    RuleScenario(
      'Same-name type and const exports produce one shape',
      ({ Given, When, Then, And }) => {
        Given('TypeScript source for wildcard extraction:', givenTypeScriptSourceForWildcard);
        When('extracting shapes with wildcard "*"', whenExtractingWithWildcard);
        Then('{int} shapes are extracted', (_ctx: unknown, count: number) => {
          if (state.wildcardResult === null) throw new Error('No wildcard result');
          expect(state.wildcardResult.shapes).toHaveLength(count);
        });
        And(
          'the extracted shapes include all:',
          (_ctx: unknown, table: ReadonlyArray<{ name: string }>) => {
            if (state.wildcardResult === null) throw new Error('No wildcard result');
            const names = state.wildcardResult.shapes.map((s) => s.name);
            for (const row of table) {
              expect(names).toContain(row.name);
            }
          }
        );
        And(
          'the extracted shape {string} has kind {string}',
          (_ctx: unknown, name: string, kind: string) => {
            if (state.wildcardResult === null) throw new Error('No wildcard result');
            const shape = state.wildcardResult.shapes.find((s) => s.name === name);
            expect(shape, `Shape "${name}" not found`).toBeDefined();
            expect(shape!.kind).toBe(kind);
          }
        );
      }
    );
  });
});
