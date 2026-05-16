import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { runCli, type CliResult } from '../../support/run-cli.js';

const feature = await loadFeature('tests/features/cli-output-formatting.feature');

let lastResult: CliResult | null = null;

describeFeature(
  feature,
  ({ AfterEachScenario, Rule }) => {
    AfterEachScenario(() => {
      lastResult = null;
    });

    Rule(
      'Format flag selects the renderer; stdout carries the payload, stderr carries diagnostics',
      ({ RuleScenario }) => {
        RuleScenario(
          'json format emits parseable bytes on stdout, nothing on stderr',
          ({ When, Then, And }) => {
            When('I run "architect overview --format json"', async () => {
              lastResult = await runCli('architect overview --format json');
            });

            Then('the exit code is zero', () => {
              expect(lastResult?.exitCode).toBe(0);
            });

            And('stderr is empty', () => {
              expect(lastResult?.stderr ?? '').toBe('');
            });

            And('stdout parses as JSON', () => {
              expect(() => {
                JSON.parse(lastResult?.stdout ?? '') as unknown;
              }).not.toThrow();
            });
          }
        );
      }
    );
  },
  { excludeTags: ['@skip'] }
);
