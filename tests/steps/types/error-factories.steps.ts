/**
 * Error Factory Step Definitions
 *
 * BDD step definitions for testing error factory functions:
 * - createFileSystemError
 * - createDirectiveValidationError
 * - createPatternValidationError
 * - createProcessMetadataValidationError
 * - createDeliverableValidationError
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createFileSystemError,
  createDirectiveValidationError,
  createPatternValidationError,
  createProcessMetadataValidationError,
  createDeliverableValidationError,
  type FileSystemError,
  type DirectiveValidationError,
  type PatternValidationError,
  type ProcessMetadataValidationError,
  type DeliverableValidationError,
} from '../../../src/types/errors.js';
import { asSourceFilePath } from '../../../src/types/branded.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// Type Definitions
// =============================================================================

type AnyDocError =
  | FileSystemError
  | DirectiveValidationError
  | PatternValidationError
  | ProcessMetadataValidationError
  | DeliverableValidationError;

interface ErrorFactoryTestState {
  error: AnyDocError | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ErrorFactoryTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): ErrorFactoryTestState {
  return {
    error: null,
  };
}

// =============================================================================
// Feature: Error Factory Functions
// =============================================================================

const feature = await loadFeature('tests/features/types/error-factories.feature');

describeFeature(feature, ({ Scenario, ScenarioOutline, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('an error factory test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // createFileSystemError
  // ===========================================================================

  ScenarioOutline(
    'createFileSystemError generates correct message for each reason',
    ({ When, Then, And }, variables: { file: string; reason: string; expected_text: string }) => {
      When('I create a FileSystemError for {string} with reason {string}', () => {
        state!.error = createFileSystemError(
          variables.file,
          variables.reason as FileSystemError['reason']
        );
      });

      Then('the error type should be {string}', (_ctx: unknown, expectedType: string) => {
        expect(state!.error!.type).toBe(expectedType);
      });

      And('the error file should be {string}', () => {
        expect((state!.error as FileSystemError).file).toBe(variables.file);
      });

      And('the error reason should be {string}', () => {
        expect((state!.error as FileSystemError).reason).toBe(variables.reason);
      });

      And('the error message should contain {string}', () => {
        expect(state!.error!.message).toContain(variables.expected_text);
      });
    }
  );

  Scenario('createFileSystemError includes optional originalError', ({ When, Then, And }) => {
    When(
      'I create a FileSystemError for {string} with reason {string} and original error {string}',
      (_ctx: unknown, file: string, reason: string, originalErrorMsg: string) => {
        state!.error = createFileSystemError(
          file,
          reason as FileSystemError['reason'],
          new Error(originalErrorMsg)
        );
      }
    );

    Then('the error should have originalError', () => {
      expect((state!.error as FileSystemError).originalError).toBeDefined();
    });

    And('the originalError message should contain {string}', (_ctx: unknown, text: string) => {
      const originalError = (state!.error as FileSystemError).originalError as Error;
      expect(originalError.message).toContain(text);
    });
  });

  Scenario('createFileSystemError omits originalError when not provided', ({ When, Then }) => {
    When(
      'I create a FileSystemError for {string} with reason {string}',
      (_ctx: unknown, file: string, reason: string) => {
        state!.error = createFileSystemError(file, reason as FileSystemError['reason']);
      }
    );

    Then('the error should not have originalError property', () => {
      expect(Object.prototype.hasOwnProperty.call(state!.error, 'originalError')).toBe(false);
    });
  });

  // ===========================================================================
  // createDirectiveValidationError
  // ===========================================================================

  Scenario(
    'createDirectiveValidationError includes line number in message',
    ({ When, Then, And }) => {
      When(
        'I create a DirectiveValidationError for {string} at line {int} with reason {string}',
        (_ctx: unknown, file: string, line: number, reason: string) => {
          state!.error = createDirectiveValidationError(file, line, reason);
        }
      );

      Then('the error type should be {string}', (_ctx: unknown, expectedType: string) => {
        expect(state!.error!.type).toBe(expectedType);
      });

      And('the error file should be {string}', (_ctx: unknown, file: string) => {
        expect((state!.error as DirectiveValidationError).file).toBe(file);
      });

      And('the error line should be {int}', (_ctx: unknown, line: number) => {
        expect((state!.error as DirectiveValidationError).line).toBe(line);
      });

      And('the error reason should be {string}', (_ctx: unknown, reason: string) => {
        expect((state!.error as DirectiveValidationError).reason).toBe(reason);
      });

      And('the error message should contain {string}', (_ctx: unknown, text: string) => {
        expect(state!.error!.message).toContain(text);
      });
    }
  );

  Scenario(
    'createDirectiveValidationError includes optional directive snippet',
    ({ When, Then }) => {
      When(
        'I create a DirectiveValidationError with directive {string}',
        (_ctx: unknown, directive: string) => {
          state!.error = createDirectiveValidationError('test.ts', 1, 'Invalid', directive);
        }
      );

      Then('the error should have directive {string}', (_ctx: unknown, directive: string) => {
        expect((state!.error as DirectiveValidationError).directive).toBe(directive);
      });
    }
  );

  Scenario('createDirectiveValidationError omits directive when not provided', ({ When, Then }) => {
    When('I create a DirectiveValidationError without directive', () => {
      state!.error = createDirectiveValidationError('test.ts', 1, 'Invalid');
    });

    Then('the error should not have directive property', () => {
      expect(Object.prototype.hasOwnProperty.call(state!.error, 'directive')).toBe(false);
    });
  });

  // ===========================================================================
  // createPatternValidationError
  // ===========================================================================

  Scenario('createPatternValidationError formats pattern name and file', ({ When, Then, And }) => {
    When(
      'I create a PatternValidationError for pattern {string} in {string} with reason {string}',
      (_ctx: unknown, patternName: string, file: string, reason: string) => {
        state!.error = createPatternValidationError(asSourceFilePath(file), patternName, reason);
      }
    );

    Then('the error type should be {string}', (_ctx: unknown, expectedType: string) => {
      expect(state!.error!.type).toBe(expectedType);
    });

    And('the error patternName should be {string}', (_ctx: unknown, patternName: string) => {
      expect((state!.error as PatternValidationError).patternName).toBe(patternName);
    });

    And('the error message should contain all of:', (_ctx: unknown, table: DataTableRow[]) => {
      for (const row of table) {
        expect(state!.error!.message).toContain(row.text);
      }
    });
  });

  Scenario(
    'createPatternValidationError includes validation errors array',
    ({ When, Then, And }) => {
      When(
        'I create a PatternValidationError with validation errors:',
        (_ctx: unknown, table: DataTableRow[]) => {
          const errors = table.map((row) => row.error);
          state!.error = createPatternValidationError(
            asSourceFilePath('test.ts'),
            'TestPattern',
            'Invalid',
            errors
          );
        }
      );

      Then('the error validationErrors should have {int} items', (_ctx: unknown, count: number) => {
        expect((state!.error as PatternValidationError).validationErrors).toHaveLength(count);
      });

      And('validationErrors should contain all:', (_ctx: unknown, table: DataTableRow[]) => {
        for (const row of table) {
          expect((state!.error as PatternValidationError).validationErrors).toContain(row.error);
        }
      });
    }
  );

  Scenario(
    'createPatternValidationError omits validationErrors when not provided',
    ({ When, Then }) => {
      When('I create a PatternValidationError without validationErrors', () => {
        state!.error = createPatternValidationError(
          asSourceFilePath('test.ts'),
          'TestPattern',
          'Invalid'
        );
      });

      Then('the error should not have validationErrors property', () => {
        expect(Object.prototype.hasOwnProperty.call(state!.error, 'validationErrors')).toBe(false);
      });
    }
  );

  // ===========================================================================
  // createProcessMetadataValidationError
  // ===========================================================================

  Scenario(
    'createProcessMetadataValidationError formats file and reason',
    ({ When, Then, And }) => {
      When(
        'I create a ProcessMetadataValidationError for {string} with reason {string}',
        (_ctx: unknown, file: string, reason: string) => {
          state!.error = createProcessMetadataValidationError(file, reason);
        }
      );

      Then('the error type should be {string}', (_ctx: unknown, expectedType: string) => {
        expect(state!.error!.type).toBe(expectedType);
      });

      And('the error file should be {string}', (_ctx: unknown, file: string) => {
        expect((state!.error as ProcessMetadataValidationError).file).toBe(file);
      });

      And('the error reason should be {string}', (_ctx: unknown, reason: string) => {
        expect((state!.error as ProcessMetadataValidationError).reason).toBe(reason);
      });

      And('the error message should contain {string}', (_ctx: unknown, text: string) => {
        expect(state!.error!.message).toContain(text);
      });
    }
  );

  Scenario(
    'createProcessMetadataValidationError includes readonly validation errors',
    ({ When, Then, And }) => {
      When(
        'I create a ProcessMetadataValidationError with validation errors:',
        (_ctx: unknown, table: DataTableRow[]) => {
          const errors = table.map((row) => row.error);
          state!.error = createProcessMetadataValidationError('test.feature', 'Invalid', errors);
        }
      );

      Then('the error validationErrors should have {int} items', (_ctx: unknown, count: number) => {
        expect((state!.error as ProcessMetadataValidationError).validationErrors).toHaveLength(
          count
        );
      });

      And('validationErrors should contain {string}', (_ctx: unknown, error: string) => {
        expect((state!.error as ProcessMetadataValidationError).validationErrors).toContain(error);
      });
    }
  );

  // ===========================================================================
  // createDeliverableValidationError
  // ===========================================================================

  Scenario('createDeliverableValidationError formats file and reason', ({ When, Then, And }) => {
    When(
      'I create a DeliverableValidationError for {string} with reason {string}',
      (_ctx: unknown, file: string, reason: string) => {
        state!.error = createDeliverableValidationError(file, reason);
      }
    );

    Then('the error type should be {string}', (_ctx: unknown, expectedType: string) => {
      expect(state!.error!.type).toBe(expectedType);
    });

    And('the error file should be {string}', (_ctx: unknown, file: string) => {
      expect((state!.error as DeliverableValidationError).file).toBe(file);
    });

    And('the error reason should be {string}', (_ctx: unknown, reason: string) => {
      expect((state!.error as DeliverableValidationError).reason).toBe(reason);
    });
  });

  Scenario(
    'createDeliverableValidationError includes optional deliverableName',
    ({ When, Then, And }) => {
      When(
        'I create a DeliverableValidationError for deliverable {string}',
        (_ctx: unknown, name: string) => {
          state!.error = createDeliverableValidationError('test.feature', 'Invalid', name);
        }
      );

      Then('the error deliverableName should be {string}', (_ctx: unknown, name: string) => {
        expect((state!.error as DeliverableValidationError).deliverableName).toBe(name);
      });

      And('the error message should contain {string}', (_ctx: unknown, text: string) => {
        expect(state!.error!.message).toContain(text);
      });
    }
  );

  Scenario(
    'createDeliverableValidationError omits deliverableName when not provided',
    ({ When, Then }) => {
      When('I create a DeliverableValidationError without deliverableName', () => {
        state!.error = createDeliverableValidationError('test.feature', 'Invalid');
      });

      Then('the error should not have deliverableName property', () => {
        expect(Object.prototype.hasOwnProperty.call(state!.error, 'deliverableName')).toBe(false);
      });
    }
  );

  Scenario('createDeliverableValidationError includes validation errors', ({ When, Then }) => {
    When(
      'I create a DeliverableValidationError with validation errors:',
      (_ctx: unknown, table: DataTableRow[]) => {
        const errors = table.map((row) => row.error);
        state!.error = createDeliverableValidationError(
          'test.feature',
          'Invalid',
          undefined,
          errors
        );
      }
    );

    Then('the error validationErrors should have {int} items', (_ctx: unknown, count: number) => {
      expect((state!.error as DeliverableValidationError).validationErrors).toHaveLength(count);
    });
  });
});
