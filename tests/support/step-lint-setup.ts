/**
 * Vitest globalSetup: run step lint checks before any tests execute.
 *
 * Catches vitest-cucumber compatibility traps (hash in descriptions,
 * missing And destructuring, wrong ScenarioOutline patterns, etc.)
 * before they cause cryptic runtime failures during the test run.
 */

import { runStepLint } from '../../src/lint/steps/index.js';
import { formatPretty, hasFailures } from '../../src/lint/engine.js';

export function setup(): void {
  const summary = runStepLint();

  if (hasFailures(summary, false)) {
    const output = formatPretty(summary, { quiet: true });
    throw new Error(
      `Step lint: ${summary.errorCount} error(s) found in feature/step files.\n\n${output}\n\nFix the issues above before running tests.`
    );
  }
}
