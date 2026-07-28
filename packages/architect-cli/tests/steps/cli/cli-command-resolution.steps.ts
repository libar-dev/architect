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
      RuleScenario('version command resolves to the metadata handler', ({ When, Then, And }) => {
        When('I run "architect version"', async (): Promise<void> => {
          lastResult = await runCli('architect version');
        });

        Then('the exit code is zero', () => {
          expect(lastResult?.exitCode).toBe(0);
        });

        And('stdout is a semver version', () => {
          expect((lastResult?.stdout ?? '').trim()).toMatch(/^\d+\.\d+\.\d+/);
        });
      });

      RuleScenario(
        'dangling command resolves to the graph-integrity gate',
        ({ When, Then, And }) => {
          When(
            'I run "architect dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json"',
            async () => {
              lastResult = await runCli(
                'architect dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json',
              );
            },
          );

          Then('the exit code is zero', () => {
            expect(lastResult?.exitCode).toBe(0);
          });

          And('stdout parses as JSON', () => {
            expect(() => {
              JSON.parse(lastResult?.stdout ?? '') as unknown;
            }).not.toThrow();
          });

          And('the JSON document has key "drift"', () => {
            const doc: unknown = JSON.parse(lastResult?.stdout ?? '');
            const value = getJsonValueAtPath(doc, 'drift');
            expect(typeof value).toBe('boolean');
          });
        },
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
          expect(stderr).toContain('command');
          expect(stderr).toContain('not-a-real-command');
        });
      });
    });
  },
  { excludeTags: ['@skip'] },
);
