import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { runCli, getJsonValueAtPath, type CliResult } from '../../support/run-cli.js';

const feature = await loadFeature('tests/features/cli-command-resolution.feature');

let lastResult: CliResult | null = null;

describeFeature(
  feature,
  ({ AfterEachScenario, Rule }) => {
    AfterEachScenario(() => {
      lastResult = null;
    });

    Rule('Known command names dispatch to their handler', ({ RuleScenario }) => {
      RuleScenario('overview subcommand resolves to overview handler', ({ When, Then, And }) => {
        When('I run "architect overview"', async (): Promise<void> => {
          lastResult = await runCli('architect overview');
        });

        Then('the exit code is zero', () => {
          expect(lastResult?.exitCode).toBe(0);
        });

        And('stdout begins with the overview-digest header', () => {
          // The overview digest currently opens with `=== PROGRESS ===`. We assert
          // a non-empty first line that matches one of the established header
          // labels rather than pinning a single magic string — keeps the test
          // resilient if the digest opener is rephrased without dropping its role.
          const stdout = lastResult?.stdout ?? '';
          expect(stdout.length).toBeGreaterThan(0);
          expect(stdout.split('\n')[0]).toMatch(/PROGRESS|OVERVIEW|===/i);
        });
      });

      RuleScenario(
        'arch dangling subcommand resolves to dangling handler',
        ({ When, Then, And }) => {
          When('I run "architect arch dangling"', async () => {
            lastResult = await runCli('architect arch dangling');
          });

          Then('the exit code is zero', () => {
            expect(lastResult?.exitCode).toBe(0);
          });

          And('stdout parses as JSON', () => {
            expect(() => {
              JSON.parse(lastResult?.stdout ?? '') as unknown;
            }).not.toThrow();
          });

          And('the JSON document has key "metadata.validation.warningCount"', () => {
            const doc: unknown = JSON.parse(lastResult?.stdout ?? '');
            const value = getJsonValueAtPath(doc, 'metadata.validation.warningCount');
            expect(typeof value).toBe('number');
          });
        }
      );

      RuleScenario('unknown command name produces a diagnostic', ({ When, Then, And }) => {
        When('I run "architect not-a-real-command"', async () => {
          lastResult = await runCli('architect not-a-real-command');
        });

        Then('the exit code is non-zero', () => {
          expect(lastResult?.exitCode).not.toBe(0);
        });

        And('stderr mentions "command" and "not-a-real-command"', () => {
          const stderr = (lastResult?.stderr ?? '').toLowerCase();
          // CLI emits "Unknown subcommand: not-a-real-command" — "subcommand"
          // contains "command", which satisfies the documented invariant.
          expect(stderr).toContain('command');
          expect(stderr).toContain('not-a-real-command');
        });
      });
    });
  },
  { excludeTags: ['@skip'] }
);
