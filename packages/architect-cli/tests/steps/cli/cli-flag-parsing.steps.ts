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
      RuleScenario('--base-dir without a value is rejected', ({ When, Then, And }) => {
        When('I run "architect --base-dir"', async () => {
          lastResult = await runCli('architect --base-dir');
        });

        Then('the exit code is non-zero', () => {
          expect(lastResult?.exitCode).not.toBe(0);
        });

        And('stderr mentions "base-dir"', () => {
          expect((lastResult?.stderr ?? '').toLowerCase()).toContain('base-dir');
        });
      });

      RuleScenario('dangling rejects an unknown flag', ({ When, Then, And }) => {
        When('I run "architect dangling --not-a-flag"', async () => {
          lastResult = await runCli('architect dangling --not-a-flag');
        });

        Then('the exit code is non-zero', () => {
          expect(lastResult?.exitCode).not.toBe(0);
        });

        And('stderr mentions "not-a-flag"', () => {
          expect((lastResult?.stderr ?? '').toLowerCase()).toContain('not-a-flag');
        });
      });
    });
  },
  { excludeTags: ['@skip'] },
);
