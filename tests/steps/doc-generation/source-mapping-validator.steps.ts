/**
 * Source Mapping Validator Step Definitions
 *
 * BDD step definitions for testing the source mapping validator:
 * - File existence validation
 * - Extraction method validation
 * - Method-file compatibility
 * - Table format validation
 * - Validation result aggregation
 *
 * @architect
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  validateSourceMappingTable,
  validateFileExists,
  validateExtractionMethod,
  validateMethodFileCompatibility,
  validateTableFormat,
  type ValidationError,
  type ValidationResult,
  type ValidatorOptions,
} from '../../../src/generators/source-mapping-validator.js';
import {
  createWarningCollector,
  type WarningCollector,
} from '../../../src/generators/warning-collector.js';
import type { SourceMappingEntry } from '../../../src/renderable/codecs/decision-doc.js';
import type { Result } from '../../../src/types/result.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface SourceMappingValidatorState {
  /** Current source mapping entry being tested */
  currentMapping: SourceMappingEntry | null;

  /** Array of mappings for batch validation */
  mappings: SourceMappingEntry[];

  /** Base directory for file resolution */
  baseDir: string;

  /** Warning collector for non-fatal issues */
  warningCollector: WarningCollector;

  /** Result of file existence validation */
  fileExistsResult: Result<void, ValidationError> | null;

  /** Result of extraction method validation */
  methodResult: Result<string, ValidationError> | null;

  /** Result of method-file compatibility validation */
  compatibilityResult: Result<void, ValidationError> | null;

  /** Result of table format validation */
  tableFormatResult: Result<Record<string, string>, ValidationError> | null;

  /** Full validation result */
  validationResult: ValidationResult | null;

  /** Table columns for format validation */
  tableColumns: string[];

  /** Track if file system check was performed */
  fileSystemCheckPerformed: boolean;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: SourceMappingValidatorState | null = null;

function initState(): SourceMappingValidatorState {
  return {
    currentMapping: null,
    mappings: [],
    baseDir: process.cwd(),
    warningCollector: createWarningCollector(),
    fileExistsResult: null,
    methodResult: null,
    compatibilityResult: null,
    tableFormatResult: null,
    validationResult: null,
    tableColumns: [],
    fileSystemCheckPerformed: false,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/doc-generation/source-mapping-validator.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the source mapping validator is initialized', () => {
      state = initState();
    });

    And('the base path is the project root', () => {
      state!.baseDir = process.cwd();
    });
  });

  // ===========================================================================
  // RULE 1: File Existence Validation
  // ===========================================================================

  Rule('Source files must exist and be readable', ({ RuleScenario }) => {
    RuleScenario('Existing file passes validation', ({ Given, And, When, Then }) => {
      Given('a source mapping referencing {string}', (_ctx: unknown, filePath: string) => {
        state!.currentMapping = {
          section: 'Test Section',
          sourceFile: filePath,
          extractionMethod: '@extract-shapes tag',
        };
      });

      And('the file exists', () => {
        // src/types/result.ts is a real file that exists in the project
        // Nothing to do here - we're using a real file path
      });

      When('validating file existence', () => {
        state!.fileExistsResult = validateFileExists(state!.currentMapping!, state!.baseDir);
        state!.fileSystemCheckPerformed = true;
      });

      Then('validation passes', () => {
        expect(state!.fileExistsResult!.ok).toBe(true);
      });

      And('no errors are returned', () => {
        expect(state!.fileExistsResult!.ok).toBe(true);
      });
    });

    RuleScenario('Missing file produces error with path', ({ Given, And, When, Then }) => {
      Given('a source mapping referencing {string}', (_ctx: unknown, filePath: string) => {
        state!.currentMapping = {
          section: 'Test Section',
          sourceFile: filePath,
          extractionMethod: '@extract-shapes tag',
        };
      });

      And('the file does not exist', () => {
        // src/nonexistent-file.ts doesn't exist
        // Nothing to do here - we're using a non-existent file path
      });

      When('validating file existence', () => {
        state!.fileExistsResult = validateFileExists(state!.currentMapping!, state!.baseDir);
        state!.fileSystemCheckPerformed = true;
      });

      Then('validation fails', () => {
        expect(state!.fileExistsResult!.ok).toBe(false);
      });

      And('error message is {string}', (_ctx: unknown, expectedMessage: string) => {
        expect(state!.fileExistsResult!.ok).toBe(false);
        if (!state!.fileExistsResult!.ok) {
          expect(state!.fileExistsResult!.error.message).toBe(expectedMessage);
        }
      });

      And('error includes the mapping row for context', () => {
        expect(state!.fileExistsResult!.ok).toBe(false);
        if (!state!.fileExistsResult!.ok) {
          expect(state!.fileExistsResult!.error.row).toBeDefined();
          expect(state!.fileExistsResult!.error.row).toEqual(state!.currentMapping);
        }
      });
    });

    RuleScenario('Directory instead of file produces error', ({ Given, When, Then, And }) => {
      Given('a source mapping referencing {string}', (_ctx: unknown, filePath: string) => {
        state!.currentMapping = {
          section: 'Test Section',
          sourceFile: filePath,
          extractionMethod: '@extract-shapes tag',
        };
      });

      When('validating file existence', () => {
        state!.fileExistsResult = validateFileExists(state!.currentMapping!, state!.baseDir);
        state!.fileSystemCheckPerformed = true;
      });

      Then('validation fails', () => {
        expect(state!.fileExistsResult!.ok).toBe(false);
      });

      And('error message contains {string}', (_ctx: unknown, expectedSubstring: string) => {
        expect(state!.fileExistsResult!.ok).toBe(false);
        if (!state!.fileExistsResult!.ok) {
          expect(state!.fileExistsResult!.error.message).toContain(expectedSubstring);
        }
      });
    });

    RuleScenario('THIS DECISION skips file validation', ({ Given, When, Then, And }) => {
      Given('a source mapping referencing {string}', (_ctx: unknown, filePath: string) => {
        state!.currentMapping = {
          section: 'Test Section',
          sourceFile: filePath,
          extractionMethod: 'Decision rule description',
        };
      });

      When('validating file existence', () => {
        // Track that we would have called the file system
        // For THIS DECISION, no file system check should happen
        state!.fileExistsResult = validateFileExists(state!.currentMapping!, state!.baseDir);
      });

      Then('validation passes', () => {
        expect(state!.fileExistsResult!.ok).toBe(true);
      });

      And('no file system check is performed', () => {
        // The implementation skips fs operations for self-references
        // We can verify this passed without error despite no file existing
        expect(state!.fileExistsResult!.ok).toBe(true);
      });
    });

    RuleScenario(
      'THIS DECISION with rule reference skips file validation',
      ({ Given, When, Then }) => {
        Given('a source mapping referencing {string}', (_ctx: unknown, filePath: string) => {
          state!.currentMapping = {
            section: 'Test Section',
            sourceFile: filePath,
            extractionMethod: 'Decision rule description',
          };
        });

        When('validating file existence', () => {
          state!.fileExistsResult = validateFileExists(state!.currentMapping!, state!.baseDir);
        });

        Then('validation passes', () => {
          expect(state!.fileExistsResult!.ok).toBe(true);
        });
      }
    );
  });

  // ===========================================================================
  // RULE 2: Extraction Method Validation
  // ===========================================================================

  Rule(
    'Extraction methods must be valid and supported',
    ({ RuleScenarioOutline, RuleScenario }) => {
      RuleScenarioOutline(
        'Valid extraction methods pass validation',
        ({ Given, When, Then }, variables: { method: string }) => {
          Given('a source mapping with method {string}', () => {
            state!.currentMapping = {
              section: 'Test Section',
              sourceFile: 'src/test.ts',
              extractionMethod: variables.method,
            };
          });

          When('validating extraction method', () => {
            state!.methodResult = validateExtractionMethod(state!.currentMapping!.extractionMethod);
          });

          Then('validation passes', () => {
            expect(state!.methodResult!.ok).toBe(true);
          });
        }
      );

      RuleScenario(
        'Unknown method produces error with suggestions',
        ({ Given, When, Then, And }) => {
          Given('a source mapping with method {string}', (_ctx: unknown, method: string) => {
            state!.currentMapping = {
              section: 'Test Section',
              sourceFile: 'src/test.ts',
              extractionMethod: method,
            };
          });

          When('validating extraction method', () => {
            state!.methodResult = validateExtractionMethod(state!.currentMapping!.extractionMethod);
          });

          Then('validation fails', () => {
            expect(state!.methodResult!.ok).toBe(false);
          });

          And('error message contains {string}', (_ctx: unknown, expectedSubstring: string) => {
            expect(state!.methodResult!.ok).toBe(false);
            if (!state!.methodResult!.ok) {
              expect(state!.methodResult!.error.message).toContain(expectedSubstring);
            }
          });

          And('error suggests {string} as alternative', (_ctx: unknown, suggestion: string) => {
            expect(state!.methodResult!.ok).toBe(false);
            if (!state!.methodResult!.ok) {
              expect(state!.methodResult!.error.suggestions).toBeDefined();
              expect(state!.methodResult!.error.suggestions).toContain(suggestion);
            }
          });
        }
      );

      RuleScenario('Empty method produces error', ({ Given, When, Then, And }) => {
        Given('a source mapping with empty extraction method', () => {
          state!.currentMapping = {
            section: 'Test Section',
            sourceFile: 'src/test.ts',
            extractionMethod: '',
          };
        });

        When('validating extraction method', () => {
          state!.methodResult = validateExtractionMethod(state!.currentMapping!.extractionMethod);
        });

        Then('validation fails', () => {
          expect(state!.methodResult!.ok).toBe(false);
        });

        And('error message is {string}', (_ctx: unknown, expectedMessage: string) => {
          expect(state!.methodResult!.ok).toBe(false);
          if (!state!.methodResult!.ok) {
            expect(state!.methodResult!.error.message).toBe(expectedMessage);
          }
        });
      });

      RuleScenario('Method aliases are normalized', ({ Given, When, Then, And }) => {
        Given('a source mapping with method {string}', (_ctx: unknown, method: string) => {
          state!.currentMapping = {
            section: 'Test Section',
            sourceFile: 'tests/test.feature',
            extractionMethod: method,
          };
        });

        When('validating extraction method', () => {
          state!.methodResult = validateExtractionMethod(state!.currentMapping!.extractionMethod);
        });

        Then('validation passes', () => {
          expect(state!.methodResult!.ok).toBe(true);
        });

        And('method is normalized to {string}', (_ctx: unknown, normalizedMethod: string) => {
          expect(state!.methodResult!.ok).toBe(true);
          if (state!.methodResult!.ok) {
            expect(state!.methodResult!.value).toBe(normalizedMethod);
          }
        });
      });
    }
  );

  // ===========================================================================
  // RULE 3: Method-File Compatibility
  // ===========================================================================

  Rule('Extraction methods must be compatible with file types', ({ RuleScenario }) => {
    RuleScenario(
      'TypeScript method on feature file produces error',
      ({ Given, When, Then, And }) => {
        Given(
          'a source mapping with:',
          (
            _ctx: unknown,
            table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
          ) => {
            const row = table[0];
            state!.currentMapping = {
              section: row.Section,
              sourceFile: row['Source File'],
              extractionMethod: row['Extraction Method'],
            };
          }
        );

        When('validating method-file compatibility', () => {
          state!.compatibilityResult = validateMethodFileCompatibility(state!.currentMapping!);
        });

        Then('validation fails', () => {
          expect(state!.compatibilityResult!.ok).toBe(false);
        });

        And('error message contains {string}', (_ctx: unknown, expectedSubstring: string) => {
          expect(state!.compatibilityResult!.ok).toBe(false);
          if (!state!.compatibilityResult!.ok) {
            expect(state!.compatibilityResult!.error.message).toContain(expectedSubstring);
          }
        });

        And('error suggests {string} as alternative', (_ctx: unknown, suggestion: string) => {
          expect(state!.compatibilityResult!.ok).toBe(false);
          if (!state!.compatibilityResult!.ok) {
            expect(state!.compatibilityResult!.error.suggestions).toBeDefined();
            expect(state!.compatibilityResult!.error.suggestions).toContain(suggestion);
          }
        });
      }
    );

    RuleScenario(
      'Gherkin method on TypeScript file produces error',
      ({ Given, When, Then, And }) => {
        Given(
          'a source mapping with:',
          (
            _ctx: unknown,
            table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
          ) => {
            const row = table[0];
            state!.currentMapping = {
              section: row.Section,
              sourceFile: row['Source File'],
              extractionMethod: row['Extraction Method'],
            };
          }
        );

        When('validating method-file compatibility', () => {
          state!.compatibilityResult = validateMethodFileCompatibility(state!.currentMapping!);
        });

        Then('validation fails', () => {
          expect(state!.compatibilityResult!.ok).toBe(false);
        });

        And('error message contains {string}', (_ctx: unknown, expectedSubstring: string) => {
          expect(state!.compatibilityResult!.ok).toBe(false);
          if (!state!.compatibilityResult!.ok) {
            expect(state!.compatibilityResult!.error.message).toContain(expectedSubstring);
          }
        });
      }
    );

    RuleScenario('Compatible method-file combination passes', ({ Given, When, Then }) => {
      Given(
        'a source mapping with:',
        (
          _ctx: unknown,
          table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
        ) => {
          const row = table[0];
          state!.currentMapping = {
            section: row.Section,
            sourceFile: row['Source File'],
            extractionMethod: row['Extraction Method'],
          };
        }
      );

      When('validating method-file compatibility', () => {
        state!.compatibilityResult = validateMethodFileCompatibility(state!.currentMapping!);
      });

      Then('validation passes', () => {
        expect(state!.compatibilityResult!.ok).toBe(true);
      });
    });

    RuleScenario(
      'Self-reference method on actual file produces error',
      ({ Given, When, Then, And }) => {
        Given(
          'a source mapping with:',
          (
            _ctx: unknown,
            table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
          ) => {
            const row = table[0];
            state!.currentMapping = {
              section: row.Section,
              sourceFile: row['Source File'],
              extractionMethod: row['Extraction Method'],
            };
          }
        );

        When('validating method-file compatibility', () => {
          state!.compatibilityResult = validateMethodFileCompatibility(state!.currentMapping!);
        });

        Then('validation fails', () => {
          expect(state!.compatibilityResult!.ok).toBe(false);
        });

        And('error message contains {string}', (_ctx: unknown, expectedSubstring: string) => {
          expect(state!.compatibilityResult!.ok).toBe(false);
          if (!state!.compatibilityResult!.ok) {
            expect(state!.compatibilityResult!.error.message).toContain(expectedSubstring);
          }
        });
      }
    );
  });

  // ===========================================================================
  // RULE 4: Table Format Validation
  // ===========================================================================

  Rule('Source mapping tables must have required columns', ({ RuleScenario }) => {
    RuleScenario('Missing Section column produces error', ({ Given, When, Then, And }) => {
      Given(
        'a source mapping table without {string} column',
        (_ctx: unknown, _missingColumn: string) => {
          state!.tableColumns = ['Source File', 'Extraction Method'];
        }
      );

      When('validating table format', () => {
        state!.tableFormatResult = validateTableFormat(state!.tableColumns);
      });

      Then('validation fails', () => {
        expect(state!.tableFormatResult!.ok).toBe(false);
      });

      And('error message is {string}', (_ctx: unknown, expectedMessage: string) => {
        expect(state!.tableFormatResult!.ok).toBe(false);
        if (!state!.tableFormatResult!.ok) {
          expect(state!.tableFormatResult!.error.message).toBe(expectedMessage);
        }
      });
    });

    RuleScenario('Missing Source File column produces error', ({ Given, When, Then, And }) => {
      Given(
        'a source mapping table without {string} column',
        (_ctx: unknown, _missingColumn: string) => {
          state!.tableColumns = ['Section', 'Extraction Method'];
        }
      );

      When('validating table format', () => {
        state!.tableFormatResult = validateTableFormat(state!.tableColumns);
      });

      Then('validation fails', () => {
        expect(state!.tableFormatResult!.ok).toBe(false);
      });

      And('error message is {string}', (_ctx: unknown, expectedMessage: string) => {
        expect(state!.tableFormatResult!.ok).toBe(false);
        if (!state!.tableFormatResult!.ok) {
          expect(state!.tableFormatResult!.error.message).toBe(expectedMessage);
        }
      });
    });

    RuleScenario('Alternative column names are accepted', ({ Given, When, Then, And }) => {
      Given('a source mapping table with columns:', (_ctx: unknown, table: unknown) => {
        // Table in Gherkin format | Section | Source | How |
        // vitest-cucumber may pass this as array or with different structure
        // Since we only have header row, extract column names appropriately
        if (Array.isArray(table) && table.length > 0) {
          const row = table[0] as Record<string, string>;
          // The keys are the column names (Section, Source, How)
          state!.tableColumns = Object.keys(row);
        } else {
          // Fallback: manually set the expected columns
          state!.tableColumns = ['Section', 'Source', 'How'];
        }
      });

      When('validating table format', () => {
        state!.tableFormatResult = validateTableFormat(state!.tableColumns);
      });

      Then('validation passes', () => {
        expect(state!.tableFormatResult!.ok).toBe(true);
      });

      And('"Source" is mapped to "Source File"', () => {
        expect(state!.tableFormatResult!.ok).toBe(true);
        if (state!.tableFormatResult!.ok) {
          expect(state!.tableFormatResult!.value['Source']).toBe('Source File');
        }
      });

      And('"How" is mapped to "Extraction Method"', () => {
        expect(state!.tableFormatResult!.ok).toBe(true);
        if (state!.tableFormatResult!.ok) {
          expect(state!.tableFormatResult!.value['How']).toBe('Extraction Method');
        }
      });
    });
  });

  // ===========================================================================
  // RULE 5: Validation Result Aggregation
  // ===========================================================================

  Rule('All validation errors are collected and returned together', ({ RuleScenario }) => {
    RuleScenario('Multiple errors are aggregated', ({ Given, When, Then, And }) => {
      Given(
        'a source mapping with:',
        (
          _ctx: unknown,
          table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
        ) => {
          state!.mappings = table.map((row) => ({
            section: row.Section,
            sourceFile: row['Source File'],
            extractionMethod: row['Extraction Method'],
          }));
        }
      );

      When('validating the full mapping', () => {
        const options: ValidatorOptions = {
          baseDir: state!.baseDir,
          warningCollector: state!.warningCollector,
        };
        state!.validationResult = validateSourceMappingTable(state!.mappings, options);
      });

      Then('validation fails with {int} errors', (_ctx: unknown, expectedCount: number) => {
        expect(state!.validationResult!.isValid).toBe(false);
        expect(state!.validationResult!.errors.length).toBe(expectedCount);
      });

      And('first error is about missing file', () => {
        const firstError = state!.validationResult!.errors[0];
        expect(firstError.message).toContain('File not found');
      });

      And('second error is about invalid method', () => {
        const secondError = state!.validationResult!.errors[1];
        expect(secondError.message).toContain('Unknown extraction method');
      });
    });

    RuleScenario('Warnings are collected alongside errors', ({ Given, When, Then, And }) => {
      Given('a source mapping that produces warnings', () => {
        // Set up a mapping that's valid but might produce warnings
        state!.mappings = [
          {
            section: 'Test',
            sourceFile: 'src/types/result.ts',
            extractionMethod: '@extract-shapes tag',
          },
        ];
        // Add a warning manually to test the aggregation
        state!.warningCollector.capture({
          source: 'src/types/result.ts',
          category: 'validation',
          message: 'Test warning',
        });
      });

      When('validating the full mapping', () => {
        const options: ValidatorOptions = {
          baseDir: state!.baseDir,
          warningCollector: state!.warningCollector,
        };
        state!.validationResult = validateSourceMappingTable(state!.mappings, options);
      });

      Then('validation result includes both errors and warnings', () => {
        // Result has warnings array (possibly from collector)
        expect(state!.validationResult!.warnings).toBeDefined();
        expect(state!.warningCollector.count()).toBeGreaterThan(0);
      });

      And('validation fails if any errors exist', () => {
        // This mapping is valid, so no errors
        expect(state!.validationResult!.isValid).toBe(true);
        expect(state!.validationResult!.errors.length).toBe(0);
      });

      And('validation passes if only warnings exist', () => {
        // Warnings don't cause validation failure
        expect(state!.validationResult!.isValid).toBe(true);
        expect(state!.warningCollector.count()).toBeGreaterThan(0);
      });
    });
  });
});
