import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { runCli, type CliResult } from '../../support/run-cli.js';

const feature = await loadFeature('tests/features/cli-flag-parsing.feature');

let lastResult: CliResult | null = null;

describeFeature(
  feature,
  ({ AfterEachScenario, Rule }) => {
    AfterEachScenario(() => {
      lastResult = null;
    });

    Rule('Flags are parsed and validated at the CLI boundary', ({ RuleScenario }) => {
      RuleScenario('--format json on overview produces JSON output', ({ When, Then, And }) => {
        When('I run "architect overview --format json"', async () => {
          lastResult = await runCli('architect overview --format json');
        });

        Then('the exit code is zero', () => {
          expect(lastResult?.exitCode).toBe(0);
        });

        And('stdout parses as JSON', () => {
          expect(() => {
            JSON.parse(lastResult?.stdout ?? '') as unknown;
          }).not.toThrow();
        });
      });
    });
  },
  { excludeTags: ['@skip'] },
);
