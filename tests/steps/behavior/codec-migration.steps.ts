/**
 * Codec Migration Step Definitions
 *
 * BDD step definitions for testing Zod codec pattern:
 * - createJsonInputCodec - JSON parsing with validation
 * - createJsonOutputCodec - JSON serialization with validation
 * - Output schemas for CLI tools
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { z } from 'zod';
import {
  createJsonInputCodec,
  createJsonOutputCodec,
  createFileLoader,
  formatCodecError,
  type CodecError,
  type JsonInputCodec,
  type JsonOutputCodec,
} from '../../../src/validation-schemas/codec-utils.js';
import {
  LintOutputSchema,
  ValidationSummaryOutputSchema,
  RegistryMetadataOutputSchema,
  type LintOutput,
  type ValidationSummaryOutput,
} from '../../../src/validation-schemas/output-schemas.js';
import type { Result } from '../../../src/types/index.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Simple test schema for basic codec tests
 */
const SimpleTestSchema = z.object({
  name: z.string(),
  count: z.number(),
});

type SimpleTestType = z.infer<typeof SimpleTestSchema>;

interface CodecMigrationScenarioState {
  // Schemas and codecs
  inputCodec: JsonInputCodec<SimpleTestType> | null;
  outputCodec: JsonOutputCodec<SimpleTestType> | null;
  lintOutputCodec: JsonOutputCodec<LintOutput> | null;
  validationOutputCodec: JsonOutputCodec<ValidationSummaryOutput> | null;
  registryMetadataCodec: JsonOutputCodec<Record<string, unknown>> | null;

  // Results
  parseResult: Result<SimpleTestType, CodecError> | null;
  serializeResult: Result<string, CodecError> | null;
  parsedValue: SimpleTestType | null;
  serializedJson: string;

  // Error handling
  codecError: CodecError | null;
  formattedError: string;

  // safeParse results
  safeParsedValue: SimpleTestType | undefined;

  // createFileLoader
  mockFileReader: ((path: string) => Promise<string>) | null;
  fileLoadResult: Result<SimpleTestType, CodecError> | null;
  loadedValue: SimpleTestType | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CodecMigrationScenarioState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): CodecMigrationScenarioState {
  return {
    inputCodec: null,
    outputCodec: null,
    lintOutputCodec: null,
    validationOutputCodec: null,
    registryMetadataCodec: null,
    parseResult: null,
    serializeResult: null,
    parsedValue: null,
    serializedJson: '',
    codecError: null,
    formattedError: '',
    safeParsedValue: undefined,
    mockFileReader: null,
    fileLoadResult: null,
    loadedValue: null,
  };
}

// =============================================================================
// Feature: Codec Migration
// =============================================================================

const feature = await loadFeature('tests/features/behavior/codec-migration.feature');

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Input Codec Tests
  // ===========================================================================

  Scenario('Input codec parses valid JSON to typed object', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    When('I parse valid JSON {string}', (_ctx: unknown, json: string) => {
      state!.parseResult = state!.inputCodec!.parse(json);
    });

    Then('the parse result should be successful', () => {
      expect(state!.parseResult!.ok).toBe(true);
      if (state!.parseResult!.ok) {
        state!.parsedValue = state!.parseResult!.value;
      }
    });

    And('the parsed value should have name {string}', (_ctx: unknown, name: string) => {
      expect(state!.parsedValue!.name).toBe(name);
    });

    And('the parsed value should have count {int}', (_ctx: unknown, count: number) => {
      expect(state!.parsedValue!.count).toBe(count);
    });
  });

  Scenario('Input codec returns error for malformed JSON', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    When(
      'I parse malformed JSON {string} with source {string}',
      (_ctx: unknown, json: string, source: string) => {
        state!.parseResult = state!.inputCodec!.parse(json, source);
      }
    );

    Then('the parse result should be an error', () => {
      expect(state!.parseResult!.ok).toBe(false);
      if (!state!.parseResult!.ok) {
        state!.codecError = state!.parseResult!.error;
      }
    });

    And('the error operation should be {string}', (_ctx: unknown, operation: string) => {
      expect(state!.codecError!.operation).toBe(operation);
    });

    And('the error message should contain {string}', (_ctx: unknown, substring: string) => {
      expect(state!.codecError!.message).toContain(substring);
    });

    And('the error source should be {string}', (_ctx: unknown, source: string) => {
      expect(state!.codecError!.source).toBe(source);
    });
  });

  Scenario(
    'Input codec returns validation errors for schema violations',
    ({ Given, When, Then, And }) => {
      Given('a simple test schema for objects with name and count', () => {
        // Schema is defined at module level
      });

      And('the codec is created for the test schema', () => {
        state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
      });

      When(
        'I parse JSON {string} with source {string}',
        (_ctx: unknown, json: string, source: string) => {
          state!.parseResult = state!.inputCodec!.parse(json, source);
        }
      );

      Then('the parse result should be an error', () => {
        expect(state!.parseResult!.ok).toBe(false);
        if (!state!.parseResult!.ok) {
          state!.codecError = state!.parseResult!.error;
        }
      });

      And('the error operation should be {string}', (_ctx: unknown, operation: string) => {
        expect(state!.codecError!.operation).toBe(operation);
      });

      And('the error message should contain {string}', (_ctx: unknown, substring: string) => {
        expect(state!.codecError!.message).toContain(substring);
      });

      And('the error should have validation errors', () => {
        expect(state!.codecError!.validationErrors).toBeDefined();
        expect(state!.codecError!.validationErrors!.length).toBeGreaterThan(0);
      });

      And(
        'the validation errors should mention fields:',
        (_ctx: unknown, table: DataTableRow[]) => {
          const errorsText = state!.codecError!.validationErrors!.join('\n');
          for (const row of table) {
            expect(errorsText).toContain(row.field);
          }
        }
      );
    }
  );

  Scenario('Input codec strips $schema field before validation', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    When('I parse JSON {string}', (_ctx: unknown, json: string) => {
      state!.parseResult = state!.inputCodec!.parse(json);
    });

    Then('the parse result should be successful', () => {
      expect(state!.parseResult!.ok).toBe(true);
      if (state!.parseResult!.ok) {
        state!.parsedValue = state!.parseResult!.value;
      }
    });

    And('the parsed value should have name {string}', (_ctx: unknown, name: string) => {
      expect(state!.parsedValue!.name).toBe(name);
    });

    And('the parsed value should not have a $schema property', () => {
      // TypeScript type doesn't include $schema, but we verify runtime behavior
      expect(Object.prototype.hasOwnProperty.call(state!.parsedValue, '$schema')).toBe(false);
    });
  });

  // ===========================================================================
  // Output Codec Tests
  // ===========================================================================

  Scenario('Output codec serializes valid object to JSON', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the output codec is created for the test schema', () => {
      state!.outputCodec = createJsonOutputCodec(SimpleTestSchema);
    });

    When(
      'I serialize a valid object with name {string} and count {int}',
      (_ctx: unknown, name: string, count: number) => {
        state!.serializeResult = state!.outputCodec!.serialize({ name, count });
      }
    );

    Then('the serialize result should be successful', () => {
      expect(state!.serializeResult!.ok).toBe(true);
      if (state!.serializeResult!.ok) {
        state!.serializedJson = state!.serializeResult!.value;
      }
    });

    And('the serialized JSON should be valid', () => {
      expect(() => {
        JSON.parse(state!.serializedJson);
      }).not.toThrow();
    });

    And('the serialized JSON should contain {string}', (_ctx: unknown, substring: string) => {
      expect(state!.serializedJson).toContain(substring);
    });
  });

  Scenario('Output codec returns error for schema violations', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the output codec is created for the test schema', () => {
      state!.outputCodec = createJsonOutputCodec(SimpleTestSchema);
    });

    When(
      'I serialize an invalid object with wrong types and source {string}',
      (_ctx: unknown, source: string) => {
        // @ts-expect-error - intentionally passing invalid type for test
        state!.serializeResult = state!.outputCodec!.serialize({ name: 123 }, source);
      }
    );

    Then('the serialize result should be an error', () => {
      expect(state!.serializeResult!.ok).toBe(false);
      if (!state!.serializeResult!.ok) {
        state!.codecError = state!.serializeResult!.error;
      }
    });

    And('the error operation should be {string}', (_ctx: unknown, operation: string) => {
      expect(state!.codecError!.operation).toBe(operation);
    });

    And('the error message should contain {string}', (_ctx: unknown, substring: string) => {
      expect(state!.codecError!.message).toContain(substring);
    });

    And('the error source should be {string}', (_ctx: unknown, source: string) => {
      expect(state!.codecError!.source).toBe(source);
    });
  });

  Scenario('Output codec respects indent option', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the output codec is created for the test schema', () => {
      state!.outputCodec = createJsonOutputCodec(SimpleTestSchema);
    });

    When(
      'I serialize with name {string} count {int} and indent {int}',
      (_ctx: unknown, name: string, count: number, indent: number) => {
        state!.serializeResult = state!.outputCodec!.serializeWithOptions(
          { name, count },
          { indent }
        );
      }
    );

    Then('the serialize result should be successful', () => {
      expect(state!.serializeResult!.ok).toBe(true);
      if (state!.serializeResult!.ok) {
        state!.serializedJson = state!.serializeResult!.value;
      }
    });

    And(
      'the serialized JSON should use {int}-space indentation',
      (_ctx: unknown, spaces: number) => {
        const indentPattern = new RegExp(`^\\s{${spaces}}"name"`, 'm');
        expect(state!.serializedJson).toMatch(indentPattern);
      }
    );
  });

  // ===========================================================================
  // LintOutputSchema Tests
  // ===========================================================================

  Scenario('LintOutputSchema validates correct lint output', ({ Given, When, Then, And }) => {
    Given('the LintOutputSchema codec', () => {
      state!.lintOutputCodec = createJsonOutputCodec(LintOutputSchema);
    });

    When('I serialize a valid lint output:', (_ctx: unknown, table: DataTableRow[]) => {
      // Parse field-value table format
      const data: Record<string, number> = {};
      for (const row of table) {
        data[row.field] = parseInt(row.value);
      }
      const lintOutput: LintOutput = {
        results: [],
        summary: {
          errors: data.errors,
          warnings: data.warnings,
          info: data.info,
          filesScanned: data.filesScanned,
          directivesChecked: data.directivesChecked,
        },
      };
      state!.serializeResult = state!.lintOutputCodec!.serialize(lintOutput);
    });

    Then('the serialize result should be successful', () => {
      expect(state!.serializeResult!.ok).toBe(true);
      if (state!.serializeResult!.ok) {
        state!.serializedJson = state!.serializeResult!.value;
      }
    });

    And('the serialized JSON should be parseable', () => {
      expect(() => {
        JSON.parse(state!.serializedJson);
      }).not.toThrow();
    });
  });

  Scenario('LintOutputSchema rejects invalid severity', ({ Given, When, Then, And }) => {
    Given('the LintOutputSchema codec', () => {
      state!.lintOutputCodec = createJsonOutputCodec(LintOutputSchema);
    });

    When(
      'I serialize a lint output with invalid severity {string}',
      (_ctx: unknown, severity: string) => {
        // Create an object that will fail schema validation
        const invalidOutput = {
          results: [
            {
              file: '/test.ts',
              violations: [
                {
                  rule: 'test',
                  severity: severity, // Invalid severity from step parameter
                  message: 'test',
                  line: 1,
                },
              ],
            },
          ],
          summary: {
            errors: 1,
            warnings: 0,
            info: 0,
            filesScanned: 1,
            directivesChecked: 1,
          },
        };
        // @ts-expect-error - intentionally passing invalid type for test
        state!.serializeResult = state!.lintOutputCodec!.serialize(invalidOutput);
      }
    );

    Then('the serialize result should be an error', () => {
      expect(state!.serializeResult!.ok).toBe(false);
      if (!state!.serializeResult!.ok) {
        state!.codecError = state!.serializeResult!.error;
      }
    });

    And('the error should have validation errors', () => {
      expect(state!.codecError!.validationErrors).toBeDefined();
      expect(state!.codecError!.validationErrors!.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // ValidationSummaryOutputSchema Tests
  // ===========================================================================

  Scenario(
    'ValidationSummaryOutputSchema validates correct validation output',
    ({ Given, When, Then, And }) => {
      Given('the ValidationSummaryOutputSchema codec', () => {
        state!.validationOutputCodec = createJsonOutputCodec(ValidationSummaryOutputSchema);
      });

      When('I serialize a valid validation summary:', (_ctx: unknown, table: DataTableRow[]) => {
        // Parse field-value table format
        const data: Record<string, number> = {};
        for (const row of table) {
          data[row.field] = parseInt(row.value);
        }
        const validationOutput: ValidationSummaryOutput = {
          issues: [],
          stats: {
            typescriptPatterns: data.typescriptPatterns,
            gherkinPatterns: data.gherkinPatterns,
            matched: data.matched,
            missingInGherkin: data.missingInGherkin,
            missingInTypeScript: data.missingInTypeScript,
          },
        };
        state!.serializeResult = state!.validationOutputCodec!.serialize(validationOutput);
      });

      Then('the serialize result should be successful', () => {
        expect(state!.serializeResult!.ok).toBe(true);
        if (state!.serializeResult!.ok) {
          state!.serializedJson = state!.serializeResult!.value;
        }
      });

      And('the serialized JSON should be parseable', () => {
        expect(() => {
          JSON.parse(state!.serializedJson);
        }).not.toThrow();
      });
    }
  );

  Scenario(
    'ValidationSummaryOutputSchema rejects invalid issue source',
    ({ Given, When, Then, And }) => {
      Given('the ValidationSummaryOutputSchema codec', () => {
        state!.validationOutputCodec = createJsonOutputCodec(ValidationSummaryOutputSchema);
      });

      When(
        'I serialize a validation summary with invalid source {string}',
        (_ctx: unknown, source: string) => {
          const invalidOutput = {
            issues: [
              {
                severity: 'error',
                message: 'test',
                source: source, // Invalid source from step parameter
              },
            ],
            stats: {
              typescriptPatterns: 0,
              gherkinPatterns: 0,
              matched: 0,
              missingInGherkin: 0,
              missingInTypeScript: 0,
            },
          };
          // @ts-expect-error - intentionally passing invalid type for test
          state!.serializeResult = state!.validationOutputCodec!.serialize(invalidOutput);
        }
      );

      Then('the serialize result should be an error', () => {
        expect(state!.serializeResult!.ok).toBe(false);
        if (!state!.serializeResult!.ok) {
          state!.codecError = state!.serializeResult!.error;
        }
      });

      And('the error should have validation errors', () => {
        expect(state!.codecError!.validationErrors).toBeDefined();
        expect(state!.codecError!.validationErrors!.length).toBeGreaterThan(0);
      });
    }
  );

  // ===========================================================================
  // RegistryMetadataOutputSchema Tests
  // ===========================================================================

  Scenario(
    'RegistryMetadataOutputSchema accepts arbitrary metadata',
    ({ Given, When, Then, And }) => {
      Given('the RegistryMetadataOutputSchema codec', () => {
        state!.registryMetadataCodec = createJsonOutputCodec(RegistryMetadataOutputSchema);
      });

      When('I serialize arbitrary nested metadata', () => {
        state!.serializeResult = state!.registryMetadataCodec!.serialize({
          custom: 'value',
          nested: { deep: true },
        });
      });

      Then('the serialize result should be successful', () => {
        expect(state!.serializeResult!.ok).toBe(true);
        if (state!.serializeResult!.ok) {
          state!.serializedJson = state!.serializeResult!.value;
        }
      });

      And('the serialized JSON should be parseable', () => {
        expect(() => {
          JSON.parse(state!.serializedJson);
        }).not.toThrow();
      });
    }
  );

  // ===========================================================================
  // formatCodecError Tests
  // ===========================================================================

  Scenario('formatCodecError includes validation errors in output', ({ Given, When, Then }) => {
    Given('a codec error with validation errors:', (_ctx: unknown, table: DataTableRow[]) => {
      const validationErrors = table.map((row) => `  - ${row.path ?? ''}: ${row.message ?? ''}`);
      state!.codecError = {
        type: 'codec-error',
        operation: 'parse',
        message: 'Schema validation failed',
        validationErrors,
      };
    });

    When('I format the codec error', () => {
      state!.formattedError = formatCodecError(state!.codecError!);
    });

    Then('the formatted output should contain all of:', (_ctx: unknown, table: DataTableRow[]) => {
      for (const row of table) {
        expect(state!.formattedError).toContain(row.text);
      }
    });
  });

  // ===========================================================================
  // safeParse Tests
  // ===========================================================================

  Scenario('safeParse returns typed value on valid JSON', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    When('I safeParse valid JSON {string}', (_ctx: unknown, json: string) => {
      state!.safeParsedValue = state!.inputCodec!.safeParse(json);
    });

    Then('safeParse should return a value', () => {
      expect(state!.safeParsedValue).toBeDefined();
    });

    And('the safeParsed value should have name {string}', (_ctx: unknown, name: string) => {
      expect(state!.safeParsedValue!.name).toBe(name);
    });

    And('the safeParsed value should have count {int}', (_ctx: unknown, count: number) => {
      expect(state!.safeParsedValue!.count).toBe(count);
    });
  });

  Scenario('safeParse returns undefined on malformed JSON', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    When('I safeParse malformed JSON {string}', (_ctx: unknown, json: string) => {
      state!.safeParsedValue = state!.inputCodec!.safeParse(json);
    });

    Then('safeParse should return undefined', () => {
      expect(state!.safeParsedValue).toBeUndefined();
    });
  });

  Scenario('safeParse returns undefined on schema violation', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    When('I safeParse JSON with wrong types {string}', (_ctx: unknown, json: string) => {
      state!.safeParsedValue = state!.inputCodec!.safeParse(json);
    });

    Then('safeParse should return undefined', () => {
      expect(state!.safeParsedValue).toBeUndefined();
    });
  });

  // ===========================================================================
  // createFileLoader Tests
  // ===========================================================================

  Scenario('createFileLoader loads and parses valid JSON file', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    And('a mock file reader that returns {string}', (_ctx: unknown, content: string) => {
      state!.mockFileReader = () => Promise.resolve(content);
    });

    When('I create a file loader and load {string}', async (_ctx: unknown, path: string) => {
      const loader = createFileLoader(state!.inputCodec!, state!.mockFileReader!);
      state!.fileLoadResult = await loader(path);
    });

    Then('the file load result should be successful', () => {
      expect(state!.fileLoadResult!.ok).toBe(true);
      if (state!.fileLoadResult!.ok) {
        state!.loadedValue = state!.fileLoadResult!.value;
      }
    });

    And('the loaded value should have name {string}', (_ctx: unknown, name: string) => {
      expect(state!.loadedValue!.name).toBe(name);
    });

    And('the loaded value should have count {int}', (_ctx: unknown, count: number) => {
      expect(state!.loadedValue!.count).toBe(count);
    });
  });

  Scenario('createFileLoader handles ENOENT error', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    And(
      'a mock file reader that throws ENOENT for {string}',
      (_ctx: unknown, _expectedPath: string) => {
        state!.mockFileReader = () => {
          const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
          error.code = 'ENOENT';
          return Promise.reject(error);
        };
      }
    );

    When('I create a file loader and load {string}', async (_ctx: unknown, path: string) => {
      const loader = createFileLoader(state!.inputCodec!, state!.mockFileReader!);
      state!.fileLoadResult = await loader(path);
    });

    Then('the file load result should be an error', () => {
      expect(state!.fileLoadResult!.ok).toBe(false);
      if (!state!.fileLoadResult!.ok) {
        state!.codecError = state!.fileLoadResult!.error;
      }
    });

    And('the error message should contain {string}', (_ctx: unknown, text: string) => {
      expect(state!.codecError!.message).toContain(text);
    });

    And('the error source should be {string}', (_ctx: unknown, source: string) => {
      expect(state!.codecError!.source).toBe(source);
    });
  });

  Scenario('createFileLoader handles EACCES error', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    And(
      'a mock file reader that throws EACCES for {string}',
      (_ctx: unknown, _expectedPath: string) => {
        state!.mockFileReader = () => {
          const error = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
          error.code = 'EACCES';
          return Promise.reject(error);
        };
      }
    );

    When('I create a file loader and load {string}', async (_ctx: unknown, path: string) => {
      const loader = createFileLoader(state!.inputCodec!, state!.mockFileReader!);
      state!.fileLoadResult = await loader(path);
    });

    Then('the file load result should be an error', () => {
      expect(state!.fileLoadResult!.ok).toBe(false);
      if (!state!.fileLoadResult!.ok) {
        state!.codecError = state!.fileLoadResult!.error;
      }
    });

    And('the error message should contain {string}', (_ctx: unknown, text: string) => {
      expect(state!.codecError!.message).toContain(text);
    });
  });

  Scenario('createFileLoader handles general read error', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    And(
      'a mock file reader that throws generic error {string}',
      (_ctx: unknown, message: string) => {
        state!.mockFileReader = () => Promise.reject(new Error(message));
      }
    );

    When('I create a file loader and load {string}', async (_ctx: unknown, path: string) => {
      const loader = createFileLoader(state!.inputCodec!, state!.mockFileReader!);
      state!.fileLoadResult = await loader(path);
    });

    Then('the file load result should be an error', () => {
      expect(state!.fileLoadResult!.ok).toBe(false);
      if (!state!.fileLoadResult!.ok) {
        state!.codecError = state!.fileLoadResult!.error;
      }
    });

    And('the error message should contain {string}', (_ctx: unknown, text: string) => {
      expect(state!.codecError!.message).toContain(text);
    });
  });

  Scenario('createFileLoader handles invalid JSON in file', ({ Given, When, Then, And }) => {
    Given('a simple test schema for objects with name and count', () => {
      // Schema is defined at module level
    });

    And('the codec is created for the test schema', () => {
      state!.inputCodec = createJsonInputCodec(SimpleTestSchema);
    });

    And('a mock file reader that returns {string}', (_ctx: unknown, content: string) => {
      state!.mockFileReader = () => Promise.resolve(content);
    });

    When('I create a file loader and load {string}', async (_ctx: unknown, path: string) => {
      const loader = createFileLoader(state!.inputCodec!, state!.mockFileReader!);
      state!.fileLoadResult = await loader(path);
    });

    Then('the file load result should be an error', () => {
      expect(state!.fileLoadResult!.ok).toBe(false);
      if (!state!.fileLoadResult!.ok) {
        state!.codecError = state!.fileLoadResult!.error;
      }
    });

    And('the error message should contain {string}', (_ctx: unknown, text: string) => {
      expect(state!.codecError!.message).toContain(text);
    });
  });
});
