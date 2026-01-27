/**
 * Result Monad Step Definitions
 *
 * BDD step definitions for testing the Result type:
 * - Result.ok / Result.err - creation
 * - Result.isOk / Result.isErr - type guards
 * - Result.unwrap / Result.unwrapOr - value extraction
 * - Result.map / Result.mapErr - transformations
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { Result, type Result as ResultType } from '../../../src/types/index.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface ResultTestState {
  // Current result being tested
  result: ResultType<unknown, unknown> | null;

  // For mapped results
  mappedResult: ResultType<unknown, unknown> | null;

  // For unwrap tests
  unwrapValue: unknown;
  unwrapError: Error | null;

  // For unwrapOr tests
  unwrapOrValue: unknown;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ResultTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): ResultTestState {
  return {
    result: null,
    mappedResult: null,
    unwrapValue: undefined,
    unwrapError: null,
    unwrapOrValue: undefined,
  };
}

// =============================================================================
// Feature: Result Monad
// =============================================================================

const feature = await loadFeature('tests/features/types/result-monad.feature');

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a Result test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Result.ok - Create Success Results
  // ===========================================================================

  Scenario('Result.ok wraps a primitive value', ({ When, Then, And }) => {
    When('I create a success result with value {string}', (_ctx: unknown, value: string) => {
      state!.result = Result.ok(value);
    });

    Then('the result should be ok', () => {
      expect(Result.isOk(state!.result!)).toBe(true);
    });

    And('the result value should be {string}', (_ctx: unknown, expected: string) => {
      expect((state!.result as { ok: true; value: string }).value).toBe(expected);
    });
  });

  Scenario('Result.ok wraps an object value', ({ When, Then, And }) => {
    When('I create a success result with object value:', (_ctx: unknown, table: DataTableRow[]) => {
      const row = table[0];
      const obj = { name: row.name, count: parseInt(row.count) };
      state!.result = Result.ok(obj);
    });

    Then('the result should be ok', () => {
      expect(Result.isOk(state!.result!)).toBe(true);
    });

    And('the result value should have name {string}', (_ctx: unknown, name: string) => {
      const value = (state!.result as { ok: true; value: { name: string } }).value;
      expect(value.name).toBe(name);
    });

    And('the result value should have count {int}', (_ctx: unknown, count: number) => {
      const value = (state!.result as { ok: true; value: { count: number } }).value;
      expect(value.count).toBe(count);
    });
  });

  Scenario('Result.ok wraps null value', ({ When, Then, And }) => {
    When('I create a success result with null', () => {
      state!.result = Result.ok(null);
    });

    Then('the result should be ok', () => {
      expect(Result.isOk(state!.result!)).toBe(true);
    });

    And('the result value should be null', () => {
      expect((state!.result as { ok: true; value: null }).value).toBeNull();
    });
  });

  Scenario('Result.ok wraps undefined value', ({ When, Then, And }) => {
    When('I create a success result with undefined', () => {
      state!.result = Result.ok(undefined);
    });

    Then('the result should be ok', () => {
      expect(Result.isOk(state!.result!)).toBe(true);
    });

    And('the result value should be undefined', () => {
      expect((state!.result as { ok: true; value: undefined }).value).toBeUndefined();
    });
  });

  // ===========================================================================
  // Result.err - Create Error Results
  // ===========================================================================

  Scenario('Result.err wraps an Error instance', ({ When, Then, And }) => {
    When('I create an error result with Error {string}', (_ctx: unknown, message: string) => {
      state!.result = Result.err(new Error(message));
    });

    Then('the result should be err', () => {
      expect(Result.isErr(state!.result!)).toBe(true);
    });

    And('the error should be an Error instance', () => {
      const error = (state!.result as { ok: false; error: Error }).error;
      expect(error).toBeInstanceOf(Error);
    });

    And('the error message should be {string}', (_ctx: unknown, message: string) => {
      const error = (state!.result as { ok: false; error: Error }).error;
      expect(error.message).toBe(message);
    });
  });

  Scenario('Result.err wraps a string error', ({ When, Then, And }) => {
    When('I create an error result with string {string}', (_ctx: unknown, error: string) => {
      state!.result = Result.err(error);
    });

    Then('the result should be err', () => {
      expect(Result.isErr(state!.result!)).toBe(true);
    });

    And('the error should be {string}', (_ctx: unknown, expected: string) => {
      const error = (state!.result as { ok: false; error: string }).error;
      expect(error).toBe(expected);
    });
  });

  Scenario('Result.err wraps a structured error object', ({ When, Then, And }) => {
    When('I create an error result with object:', (_ctx: unknown, table: DataTableRow[]) => {
      const row = table[0];
      state!.result = Result.err({ code: row.code, message: row.message });
    });

    Then('the result should be err', () => {
      expect(Result.isErr(state!.result!)).toBe(true);
    });

    And('the error should have code {string}', (_ctx: unknown, code: string) => {
      const error = (state!.result as { ok: false; error: { code: string } }).error;
      expect(error.code).toBe(code);
    });

    And('the error should have message {string}', (_ctx: unknown, message: string) => {
      const error = (state!.result as { ok: false; error: { message: string } }).error;
      expect(error.message).toBe(message);
    });
  });

  // ===========================================================================
  // Type Guards
  // ===========================================================================

  Scenario('Type guards correctly identify success results', ({ Given, Then, And }) => {
    Given('a success result with value {int}', (_ctx: unknown, value: number) => {
      state!.result = Result.ok(value);
    });

    Then('Result.isOk should return true', () => {
      expect(Result.isOk(state!.result!)).toBe(true);
    });

    And('Result.isErr should return false', () => {
      expect(Result.isErr(state!.result!)).toBe(false);
    });
  });

  Scenario('Type guards correctly identify error results', ({ Given, Then, And }) => {
    Given('an error result with Error {string}', (_ctx: unknown, message: string) => {
      state!.result = Result.err(new Error(message));
    });

    Then('Result.isOk should return false', () => {
      expect(Result.isOk(state!.result!)).toBe(false);
    });

    And('Result.isErr should return true', () => {
      expect(Result.isErr(state!.result!)).toBe(true);
    });
  });

  // ===========================================================================
  // Result.unwrap
  // ===========================================================================

  Scenario('unwrap extracts value from success result', ({ Given, When, Then }) => {
    Given('a success result with value {string}', (_ctx: unknown, value: string) => {
      state!.result = Result.ok(value);
    });

    When('I call unwrap on the result', () => {
      state!.unwrapValue = Result.unwrap(state!.result!);
    });

    Then('unwrap should return {string}', (_ctx: unknown, expected: string) => {
      expect(state!.unwrapValue).toBe(expected);
    });
  });

  Scenario('unwrap throws the Error from error result', ({ Given, When, Then }) => {
    Given('an error result with Error {string}', (_ctx: unknown, message: string) => {
      state!.result = Result.err(new Error(message));
    });

    When('I call unwrap on the result', () => {
      try {
        Result.unwrap(state!.result!);
      } catch (e) {
        state!.unwrapError = e as Error;
      }
    });

    Then(
      'unwrap should throw an Error with message {string}',
      (_ctx: unknown, expectedMessage: string) => {
        expect(state!.unwrapError).toBeInstanceOf(Error);
        expect(state!.unwrapError!.message).toBe(expectedMessage);
      }
    );
  });

  Scenario(
    'unwrap wraps non-Error in Error for proper stack trace',
    ({ Given, When, Then, And }) => {
      Given('an error result with string {string}', (_ctx: unknown, error: string) => {
        state!.result = Result.err(error);
      });

      When('I call unwrap on the result', () => {
        try {
          Result.unwrap(state!.result!);
        } catch (e) {
          state!.unwrapError = e as Error;
        }
      });

      Then('unwrap should throw an Error instance', () => {
        expect(state!.unwrapError).toBeInstanceOf(Error);
      });

      And(
        'the thrown error message should contain {string}',
        (_ctx: unknown, substring: string) => {
          expect(state!.unwrapError!.message).toContain(substring);
        }
      );
    }
  );

  Scenario('unwrap serializes object error to JSON in message', ({ Given, When, Then, And }) => {
    Given('an error result with object:', (_ctx: unknown, table: DataTableRow[]) => {
      const row = table[0];
      state!.result = Result.err({ code: row.code, reason: row.reason });
    });

    When('I call unwrap on the result', () => {
      try {
        Result.unwrap(state!.result!);
      } catch (e) {
        state!.unwrapError = e as Error;
      }
    });

    Then('unwrap should throw an Error instance', () => {
      expect(state!.unwrapError).toBeInstanceOf(Error);
    });

    And(
      'the thrown error message should contain all of:',
      (_ctx: unknown, table: DataTableRow[]) => {
        for (const row of table) {
          expect(state!.unwrapError!.message).toContain(row.substring);
        }
      }
    );
  });

  // ===========================================================================
  // Result.unwrapOr
  // ===========================================================================

  Scenario('unwrapOr returns value from success result', ({ Given, When, Then }) => {
    Given('a success result with value {string}', (_ctx: unknown, value: string) => {
      state!.result = Result.ok(value);
    });

    When('I call unwrapOr with default {string}', (_ctx: unknown, defaultValue: string) => {
      state!.unwrapOrValue = Result.unwrapOr(state!.result!, defaultValue);
    });

    Then('unwrapOr should return {string}', (_ctx: unknown, expected: string) => {
      expect(state!.unwrapOrValue).toBe(expected);
    });
  });

  Scenario('unwrapOr returns default from error result', ({ Given, When, Then }) => {
    Given('an error result with Error {string}', (_ctx: unknown, message: string) => {
      state!.result = Result.err(new Error(message));
    });

    When('I call unwrapOr with default {string}', (_ctx: unknown, defaultValue: string) => {
      state!.unwrapOrValue = Result.unwrapOr(state!.result!, defaultValue);
    });

    Then('unwrapOr should return {string}', (_ctx: unknown, expected: string) => {
      expect(state!.unwrapOrValue).toBe(expected);
    });
  });

  Scenario('unwrapOr returns numeric default from error result', ({ Given, When, Then }) => {
    Given('an error result with Error {string}', (_ctx: unknown, message: string) => {
      state!.result = Result.err(new Error(message));
    });

    When('I call unwrapOr with default {int}', (_ctx: unknown, defaultValue: number) => {
      state!.unwrapOrValue = Result.unwrapOr(
        state!.result! as ResultType<number, Error>,
        defaultValue
      );
    });

    Then('unwrapOr should return {int}', (_ctx: unknown, expected: number) => {
      expect(state!.unwrapOrValue).toBe(expected);
    });
  });

  // ===========================================================================
  // Result.map
  // ===========================================================================

  Scenario('map transforms success value', ({ Given, When, Then, And }) => {
    Given('a success result with value {int}', (_ctx: unknown, value: number) => {
      state!.result = Result.ok(value);
    });

    When('I map the result with a function that doubles the value', () => {
      state!.mappedResult = Result.map(state!.result! as ResultType<number, unknown>, (v) => v * 2);
    });

    Then('the mapped result should be ok', () => {
      expect(Result.isOk(state!.mappedResult!)).toBe(true);
    });

    And('the mapped value should be {int}', (_ctx: unknown, expected: number) => {
      expect((state!.mappedResult as { ok: true; value: number }).value).toBe(expected);
    });
  });

  Scenario('map passes through error unchanged', ({ Given, When, Then, And }) => {
    Given('an error result with Error {string}', (_ctx: unknown, message: string) => {
      state!.result = Result.err(new Error(message));
    });

    When('I map the result with a function that doubles the value', () => {
      state!.mappedResult = Result.map(state!.result! as ResultType<number, Error>, (v) => v * 2);
    });

    Then('the mapped result should be err', () => {
      expect(Result.isErr(state!.mappedResult!)).toBe(true);
    });

    And('the error message should be {string}', (_ctx: unknown, message: string) => {
      const error = (state!.mappedResult as { ok: false; error: Error }).error;
      expect(error.message).toBe(message);
    });
  });

  Scenario('map chains multiple transformations', ({ Given, When, Then, And }) => {
    Given('a success result with value {string}', (_ctx: unknown, value: string) => {
      state!.result = Result.ok(value);
    });

    When('I map with uppercase then map with length', () => {
      const step1 = Result.map(state!.result! as ResultType<string, unknown>, (s) =>
        s.toUpperCase()
      );
      state!.mappedResult = Result.map(step1, (s) => s.length);
    });

    Then('the mapped result should be ok', () => {
      expect(Result.isOk(state!.mappedResult!)).toBe(true);
    });

    And('the mapped value should be {int}', (_ctx: unknown, expected: number) => {
      expect((state!.mappedResult as { ok: true; value: number }).value).toBe(expected);
    });
  });

  // ===========================================================================
  // Result.mapErr
  // ===========================================================================

  Scenario('mapErr transforms error value', ({ Given, When, Then, And }) => {
    Given('an error result with string {string}', (_ctx: unknown, error: string) => {
      state!.result = Result.err(error);
    });

    When('I mapErr the result to prefix with {string}', (_ctx: unknown, prefix: string) => {
      state!.mappedResult = Result.mapErr(
        state!.result! as ResultType<unknown, string>,
        (e) => prefix + e
      );
    });

    Then('the mapped result should be err', () => {
      expect(Result.isErr(state!.mappedResult!)).toBe(true);
    });

    And('the error should be {string}', (_ctx: unknown, expected: string) => {
      expect((state!.mappedResult as { ok: false; error: string }).error).toBe(expected);
    });
  });

  Scenario('mapErr passes through success unchanged', ({ Given, When, Then, And }) => {
    Given('a success result with value {string}', (_ctx: unknown, value: string) => {
      state!.result = Result.ok(value);
    });

    When('I mapErr the result to prefix with {string}', (_ctx: unknown, prefix: string) => {
      state!.mappedResult = Result.mapErr(
        state!.result! as ResultType<string, string>,
        (e) => prefix + e
      );
    });

    Then('the mapped result should be ok', () => {
      expect(Result.isOk(state!.mappedResult!)).toBe(true);
    });

    And('the result value should be {string}', (_ctx: unknown, expected: string) => {
      expect((state!.mappedResult as { ok: true; value: string }).value).toBe(expected);
    });
  });

  Scenario('mapErr converts error type', ({ Given, When, Then, And }) => {
    Given('an error result with string {string}', (_ctx: unknown, error: string) => {
      state!.result = Result.err(error);
    });

    When('I mapErr to parse into structured error', () => {
      state!.mappedResult = Result.mapErr(state!.result! as ResultType<unknown, string>, (e) => {
        const [, code] = e.split(':');
        return { code: code ?? 'unknown' };
      });
    });

    Then('the mapped result should be err', () => {
      expect(Result.isErr(state!.mappedResult!)).toBe(true);
    });

    And('the error should have code {string}', (_ctx: unknown, code: string) => {
      const error = (state!.mappedResult as { ok: false; error: { code: string } }).error;
      expect(error.code).toBe(code);
    });
  });
});
