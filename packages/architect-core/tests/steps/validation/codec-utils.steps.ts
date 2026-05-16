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

interface TestObject {
  name: string;
}

interface CodecUtilsTestState {
  schema: z.ZodType<TestObject> | null;
  inputCodec: JsonInputCodec<TestObject> | null;
  parseResult: Result<TestObject, CodecError> | null;
  safeParseResult: TestObject | undefined;
  formattedError: string;
}

let state: CodecUtilsTestState | null = null;

function initState(): CodecUtilsTestState {
  return {
    schema: null,
    inputCodec: null,
    parseResult: null,
    safeParseResult: undefined,
    formattedError: '',
  };
}

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
        if (!state!.parseResult!.ok) throw new Error('Expected ok result');
        expect(state!.parseResult!.value.name).toBe('Alice');
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
        if (state!.parseResult!.ok) throw new Error('Expected err result');
        expect(state!.parseResult!.error.operation).toBe('parse');
      });
      And('the codec error message should contain "Invalid JSON"', () => {
        if (state!.parseResult!.ok) throw new Error('Expected err result');
        expect(state!.parseResult!.error.message).toContain('Invalid JSON');
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
          if (state!.parseResult!.ok) throw new Error('Expected err result');
          expect(state!.parseResult!.error.operation).toBe('parse');
        });
        And('the codec error message should contain "Schema validation failed"', () => {
          if (state!.parseResult!.ok) throw new Error('Expected err result');
          expect(state!.parseResult!.error.message).toContain('Schema validation failed');
        });
        And('the codec error should have validation errors', () => {
          if (state!.parseResult!.ok) throw new Error('Expected err result');
          expect(state!.parseResult!.error.validationErrors).toBeDefined();
          expect(state!.parseResult!.error.validationErrors!.length).toBeGreaterThan(0);
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
          if (state!.parseResult!.ok) throw new Error('Expected err result');
          expect(state!.parseResult!.error.message).toContain('config.json');
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
