/**
 * Codec Utils Step Definitions
 *
 * BDD step definitions for testing codec utility functions:
 * - createJsonInputCodec - JSON parsing with schema validation
 * - formatCodecError - Error formatting for display
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { z } from 'zod';
import {
  createJsonInputCodec,
  formatCodecError,
  type CodecError,
  type JsonInputCodec,
} from '../../../src/validation-schemas/codec-utils.js';
import type { Result } from '../../../src/types/index.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface TestObject {
  name: string;
}

interface CodecUtilsTestState {
  // Schema used for codec creation
  schema: z.ZodType<TestObject> | null;

  // Input codec instance
  inputCodec: JsonInputCodec<TestObject> | null;

  // Parse result
  parseResult: Result<TestObject, CodecError> | null;

  // SafeParse result
  safeParseResult: TestObject | undefined;

  // Formatted error string
  formattedError: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CodecUtilsTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): CodecUtilsTestState {
  return {
    schema: null,
    inputCodec: null,
    parseResult: null,
    safeParseResult: undefined,
    formattedError: '',
  };
}

// =============================================================================
// Feature: Codec Utils Validation
// =============================================================================

const feature = await loadFeature('tests/features/validation/codec-utils.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a codec utils test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // createJsonInputCodec - Parse and Validate JSON
  // ===========================================================================

  Rule('createJsonInputCodec parses and validates JSON strings', ({ RuleScenario }) => {
    RuleScenario('Input codec parses valid JSON matching schema', ({ Given, When, Then, And }) => {
      Given('a Zod schema for an object with a required name string field', () => {
        state!.schema = z.object({ name: z.string() });
        state!.inputCodec = createJsonInputCodec(state!.schema);
      });

      When('I parse the JSON string \'{"name": "Alice"}\' with the input codec', () => {
        state!.parseResult = state!.inputCodec!.parse('{"name": "Alice"}');
      });

      Then('the parse result should be ok', () => {
        expect(state!.parseResult!.ok).toBe(true);
      });

      And('the parsed value name should be "Alice"', () => {
        const result = state!.parseResult!;
        if (result.ok) {
          expect(result.value.name).toBe('Alice');
        } else {
          throw new Error('Expected ok result');
        }
      });
    });

    RuleScenario('Input codec rejects invalid JSON syntax', ({ Given, When, Then, And }) => {
      Given('a Zod schema for an object with a required name string field', () => {
        state!.schema = z.object({ name: z.string() });
        state!.inputCodec = createJsonInputCodec(state!.schema);
      });

      When("I parse the JSON string '{not valid json}' with the input codec", () => {
        state!.parseResult = state!.inputCodec!.parse('{not valid json}');
      });

      Then('the parse result should be err', () => {
        expect(state!.parseResult!.ok).toBe(false);
      });

      And('the codec error operation should be "parse"', () => {
        const result = state!.parseResult!;
        if (!result.ok) {
          expect(result.error.operation).toBe('parse');
        } else {
          throw new Error('Expected err result');
        }
      });

      And('the codec error message should contain "Invalid JSON"', () => {
        const result = state!.parseResult!;
        if (!result.ok) {
          expect(result.error.message).toContain('Invalid JSON');
        } else {
          throw new Error('Expected err result');
        }
      });
    });

    RuleScenario(
      'Input codec rejects valid JSON that fails schema validation',
      ({ Given, When, Then, And }) => {
        Given('a Zod schema for an object with a required name string field', () => {
          state!.schema = z.object({ name: z.string() });
          state!.inputCodec = createJsonInputCodec(state!.schema);
        });

        When('I parse the JSON string \'{"age": 30}\' with the input codec', () => {
          state!.parseResult = state!.inputCodec!.parse('{"age": 30}');
        });

        Then('the parse result should be err', () => {
          expect(state!.parseResult!.ok).toBe(false);
        });

        And('the codec error operation should be "parse"', () => {
          const result = state!.parseResult!;
          if (!result.ok) {
            expect(result.error.operation).toBe('parse');
          } else {
            throw new Error('Expected err result');
          }
        });

        And('the codec error message should contain "Schema validation failed"', () => {
          const result = state!.parseResult!;
          if (!result.ok) {
            expect(result.error.message).toContain('Schema validation failed');
          } else {
            throw new Error('Expected err result');
          }
        });

        And('the codec error should have validation errors', () => {
          const result = state!.parseResult!;
          if (!result.ok) {
            expect(result.error.validationErrors).toBeDefined();
            expect(result.error.validationErrors!.length).toBeGreaterThan(0);
          } else {
            throw new Error('Expected err result');
          }
        });
      }
    );

    RuleScenario(
      'Input codec includes source in error when provided',
      ({ Given, When, Then, And }) => {
        Given('a Zod schema for an object with a required name string field', () => {
          state!.schema = z.object({ name: z.string() });
          state!.inputCodec = createJsonInputCodec(state!.schema);
        });

        When(
          'I parse the JSON string \'{"age": 30}\' with source "config.json" using the input codec',
          () => {
            state!.parseResult = state!.inputCodec!.parse('{"age": 30}', 'config.json');
          }
        );

        Then('the parse result should be err', () => {
          expect(state!.parseResult!.ok).toBe(false);
        });

        And('the codec error message should contain "config.json"', () => {
          const result = state!.parseResult!;
          if (!result.ok) {
            expect(result.error.message).toContain('config.json');
          } else {
            throw new Error('Expected err result');
          }
        });
      }
    );

    RuleScenario(
      'Input codec safeParse returns value for valid input',
      ({ Given, When, Then, And }) => {
        Given('a Zod schema for an object with a required name string field', () => {
          state!.schema = z.object({ name: z.string() });
          state!.inputCodec = createJsonInputCodec(state!.schema);
        });

        When('I safeParse the JSON string \'{"name": "Bob"}\' with the input codec', () => {
          state!.safeParseResult = state!.inputCodec!.safeParse('{"name": "Bob"}');
        });

        Then('the safeParse result should not be undefined', () => {
          expect(state!.safeParseResult).toBeDefined();
        });

        And('the safeParse result name should be "Bob"', () => {
          expect(state!.safeParseResult!.name).toBe('Bob');
        });
      }
    );

    RuleScenario(
      'Input codec safeParse returns undefined for invalid input',
      ({ Given, When, Then }) => {
        Given('a Zod schema for an object with a required name string field', () => {
          state!.schema = z.object({ name: z.string() });
          state!.inputCodec = createJsonInputCodec(state!.schema);
        });

        When("I safeParse the JSON string '{broken' with the input codec", () => {
          state!.safeParseResult = state!.inputCodec!.safeParse('{broken');
        });

        Then('the safeParse result should be undefined', () => {
          expect(state!.safeParseResult).toBeUndefined();
        });
      }
    );
  });

  // ===========================================================================
  // formatCodecError - Error Formatting
  // ===========================================================================

  Rule('formatCodecError formats errors for display', ({ RuleScenario }) => {
    RuleScenario(
      'formatCodecError formats error without validation details',
      ({ When, Then, And }) => {
        When('I format a codec error with operation "parse" and message "Invalid JSON"', () => {
          const error: CodecError = {
            type: 'codec-error',
            operation: 'parse',
            message: 'Invalid JSON',
          };
          state!.formattedError = formatCodecError(error);
        });

        Then('the formatted error should contain "parse"', () => {
          expect(state!.formattedError).toContain('parse');
        });

        And('the formatted error should contain "Invalid JSON"', () => {
          expect(state!.formattedError).toContain('Invalid JSON');
        });
      }
    );

    RuleScenario(
      'formatCodecError formats error with validation details',
      ({ When, Then, And }) => {
        When(
          'I format a codec error with operation "parse" and message "Schema validation failed" and validation errors',
          () => {
            const error: CodecError = {
              type: 'codec-error',
              operation: 'parse',
              message: 'Schema validation failed',
              validationErrors: ['  - name: Required'],
            };
            state!.formattedError = formatCodecError(error);
          }
        );

        Then('the formatted error should contain "Schema validation failed"', () => {
          expect(state!.formattedError).toContain('Schema validation failed');
        });

        And('the formatted error should contain "Validation errors"', () => {
          expect(state!.formattedError).toContain('Validation errors');
        });
      }
    );
  });
});
