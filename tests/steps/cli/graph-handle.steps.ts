import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { runCLI, type CLIResult } from '../../support/helpers/cli-runner.js';

const feature = await loadFeature('tests/features/cli/graph-handle.feature');

const GRAPH_CLI = 'graph-cli';
const BASE = ['--base-dir', '.'];
// One script, one graph build, four independently-asserted invariants.
const BATTERY_SCRIPT = `
const dangling = g.driftFlags(() => true).dangling.length;
const specs = g.specsReverifying(g.patterns.map((p) => p.name));
const incoherent =
  specs.filter((s) => s.provenance === 'executable' && s.maturity !== 'executable').length +
  specs.filter((s) => s.provenance === 'authored' && s.maturity === 'executable').length;
const adapters =
  g.bySymbol('ProjectionBundle').definedIn.length > 0 && g.findByConcept('taxonomy').length > 0;
const specBridge = g.patterns
  .filter((p) => p.implementedBy.length > 0)
  .slice(0, 50)
  .some((p) => g.invariantsOf(p.name).length > 0);
return JSON.stringify({ dangling, incoherent, adapters, specBridge });
`;

let lastResult: CLIResult | null = null;
const battery = (): {
  dangling: number;
  incoherent: number;
  adapters: boolean;
  specBridge: boolean;
} =>
  JSON.parse((lastResult?.stdout ?? '').trim()) as {
    dangling: number;
    incoherent: number;
    adapters: boolean;
    specBridge: boolean;
  };

describeFeature(feature, ({ AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    lastResult = null;
  });

  Rule('The q front door evaluates agent scripts against the live graph', ({ RuleScenario }) => {
    RuleScenario('argv expression round-trips against the live graph', ({ When, Then, And }) => {
      When('I run the graph CLI with q expression "g.patterns.length"', async () => {
        lastResult = await runCLI(GRAPH_CLI, [...BASE, 'q', 'g.patterns.length'], {
          timeout: 120000,
        });
      });
      Then('the exit code is zero', () => {
        expect(lastResult?.exitCode).toBe(0);
      });
      And('stdout is a number greater than 300', () => {
        expect(Number((lastResult?.stdout ?? '').trim())).toBeGreaterThan(300);
      });
    });

    RuleScenario('argv multi-statement body round-trips', ({ When, Then, And }) => {
      When(
        'I run the graph CLI with q expression "const n = g.patterns.length; return n > 0"',
        async () => {
          lastResult = await runCLI(
            GRAPH_CLI,
            [...BASE, 'q', 'const n = g.patterns.length; return n > 0'],
            { timeout: 120000 },
          );
        },
      );
      Then('the exit code is zero', () => {
        expect(lastResult?.exitCode).toBe(0);
      });
      And('stdout is "true"', () => {
        expect((lastResult?.stdout ?? '').trim()).toBe('true');
      });
    });

    RuleScenario('stdin script round-trips', ({ When, Then, And }) => {
      When('I pipe a script returning the pattern count into the graph CLI', async () => {
        lastResult = await runCLI(GRAPH_CLI, [...BASE, 'q'], {
          timeout: 120000,
          stdin: 'const n = g.patterns.length;\nreturn n;\n',
        });
      });
      Then('the exit code is zero', () => {
        expect(lastResult?.exitCode).toBe(0);
      });
      And('stdout is a number greater than 300', () => {
        expect(Number((lastResult?.stdout ?? '').trim())).toBeGreaterThan(300);
      });
    });

    RuleScenario(
      'an import in the body fails loud with the injected-globals hint',
      ({ When, Then, And }) => {
        When('I run the graph CLI with q expression "import x from \'y\'"', async () => {
          lastResult = await runCLI(GRAPH_CLI, [...BASE, 'q', "import x from 'y'"], {
            timeout: 120000,
          });
        });
        Then('the exit code is non-zero', () => {
          expect(lastResult?.exitCode).not.toBe(0);
        });
        And('stderr mentions "injected globals"', () => {
          expect(lastResult?.stderr ?? '').toContain('injected globals');
        });
      },
    );
  });

  Rule('The decoded graph holds its structural invariants', ({ RuleScenario }) => {
    RuleScenario('the invariant battery passes against the live graph', ({ When, Then, And }) => {
      When('I pipe the invariant battery script into the graph CLI', async () => {
        lastResult = await runCLI(GRAPH_CLI, [...BASE, 'q'], {
          timeout: 120000,
          stdin: BATTERY_SCRIPT,
        });
      });
      Then('the exit code is zero', () => {
        expect(lastResult?.exitCode).toBe(0);
      });
      And('the battery reports zero dangling uses edges', () => {
        expect(battery().dangling).toBe(0);
      });
      And('the battery reports coherent spec maturity and provenance', () => {
        expect(battery().incoherent).toBe(0);
      });
      And('the battery reports non-empty entry adapters', () => {
        expect(battery().adapters).toBe(true);
      });
      And('the battery reports a working spec bridge', () => {
        expect(battery().specBridge).toBe(true);
      });
    });
  });

  Rule('The dangling gate is a deterministic machine contract', ({ RuleScenario }) => {
    RuleScenario('the strict gate passes against the committed baseline', ({ When, Then, And }) => {
      When('I run the graph CLI dangling gate against the committed baseline', async () => {
        lastResult = await runCLI(
          GRAPH_CLI,
          [
            ...BASE,
            'dangling',
            '--baseline',
            'packages/architect-guard/src/lint/dangling-baseline.json',
            '--strict',
          ],
          { timeout: 120000 },
        );
      });
      Then('the exit code is zero', () => {
        expect(lastResult?.exitCode).toBe(0);
      });
      And('stdout parses as JSON with "drift" false', () => {
        const doc = JSON.parse((lastResult?.stdout ?? '').trim()) as { drift?: unknown };
        expect(doc.drift).toBe(false);
      });
    });
  });
});
