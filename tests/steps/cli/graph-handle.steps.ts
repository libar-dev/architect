import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Graph as CoreGraph } from '@libar-dev/architect-core/graph';
import { expect } from 'vitest';

import { loadGraph } from '../../../packages/architect-cli/src/handle/graph.js';
import { runCLI, type CLIResult } from '../../support/helpers/cli-runner.js';
import {
  EXPECTED_STRICT_DANGLING,
  GRAPH_HANDLE_BATTERY_SCRIPT,
  parseBattery,
  parseMigratedHandle,
  parseStrictDangling,
} from '../../support/helpers/graph-handle-contract.js';

const feature = await loadFeature('tests/features/cli/graph-handle.feature');

const GRAPH_CLI = 'graph-cli';
const BASE = ['--base-dir', '.'];
let lastResult: CLIResult | null = null;
let composedGraph: CoreGraph | null = null;
let mutationResult: CLIResult | null = null;
let freshResult: CLIResult | null = null;
const battery = () => parseBattery((lastResult?.stdout ?? '').trim());

describeFeature(feature, ({ AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    lastResult = null;
    composedGraph = null;
    mutationResult = null;
    freshResult = null;
  });

  Rule('The q front door evaluates agent scripts against the live graph', ({ RuleScenario }) => {
    RuleScenario('argv expression round-trips against the live graph', ({ When, Then, And }) => {
      When('I run the graph CLI with q expression "g.pattern(\'GraphHandle\')?.name"', async () => {
        lastResult = await runCLI(GRAPH_CLI, [...BASE, 'q', "g.pattern('GraphHandle')?.name"], {
          timeout: 120000,
        });
      });
      Then('the exit code is zero', () => {
        expect(lastResult?.exitCode).toBe(0);
      });
      And('stdout is "GraphHandle"', () => {
        expect((lastResult?.stdout ?? '').trim()).toBe('GraphHandle');
      });
    });

    RuleScenario('the CLI composes the public core Graph', ({ When, Then, And }) => {
      When('I load the CLI graph composition', async () => {
        composedGraph = await loadGraph(process.cwd());
      });
      Then('the handle is the public core Graph', () => {
        expect(composedGraph).toBeInstanceOf(CoreGraph);
      });
      And('the handle has no api field', () => {
        expect(composedGraph === null ? undefined : 'api' in composedGraph).toBe(false);
      });
      And('the canonical graph and FSM are frozen', () => {
        expect(Object.isFrozen(composedGraph?.graph)).toBe(true);
        expect(Object.isFrozen(composedGraph?.fsm)).toBe(true);
      });
      And('deferred patterns have plan maturity', () => {
        expect(
          composedGraph?.patterns
            .filter((pattern) => pattern.status === 'deferred')
            .every((pattern) => pattern.maturity === 'plan'),
        ).toBe(true);
      });
    });

    RuleScenario(
      'the migrated handle exposes canonical graph and FSM values',
      ({ When, Then, And }) => {
        When('I run the migrated handle characterization', async () => {
          const script = `return JSON.stringify({
  hasApi: 'api' in g,
  hasFsm: typeof g.fsm?.isValidTransition,
  frozen: Object.isFrozen(g.graph),
  deferred: g.patterns
    .filter((p) => p.status === 'deferred')
    .every((p) => p.maturity === 'plan'),
})`;
          lastResult = await runCLI(GRAPH_CLI, [...BASE, 'q', script], { timeout: 120000 });
        });
        Then('the exit code is zero', () => {
          expect(lastResult?.exitCode).toBe(0);
        });
        And('the characterization reports api is absent', () => {
          expect(parseMigratedHandle(lastResult?.stdout ?? '{}').hasApi).toBe(false);
        });
        And('the characterization reports FSM is available', () => {
          expect(parseMigratedHandle(lastResult?.stdout ?? '{}').hasFsm).toBe('function');
        });
        And('the characterization reports canonical graph is frozen', () => {
          expect(parseMigratedHandle(lastResult?.stdout ?? '{}').frozen).toBe(true);
        });
        And('the characterization reports deferred maturity is plan', () => {
          expect(parseMigratedHandle(lastResult?.stdout ?? '{}').deferred).toBe(true);
        });
      },
    );

    RuleScenario('argv multi-statement body round-trips', ({ When, Then, And }) => {
      When(
        'I run the graph CLI with q expression "const p = g.pattern(\'GraphHandle\'); return p?.name"',
        async () => {
          lastResult = await runCLI(
            GRAPH_CLI,
            [...BASE, 'q', "const p = g.pattern('GraphHandle'); return p?.name"],
            { timeout: 120000 },
          );
        },
      );
      Then('the exit code is zero', () => {
        expect(lastResult?.exitCode).toBe(0);
      });
      And('stdout is "GraphHandle"', () => {
        expect((lastResult?.stdout ?? '').trim()).toBe('GraphHandle');
      });
    });

    RuleScenario('stdin script round-trips', ({ When, Then, And }) => {
      When('I pipe a script returning the GraphHandle sentinel into the graph CLI', async () => {
        lastResult = await runCLI(GRAPH_CLI, [...BASE, 'q'], {
          timeout: 120000,
          stdin: "return g.pattern('GraphHandle')?.name;\n",
        });
      });
      Then('the exit code is zero', () => {
        expect(lastResult?.exitCode).toBe(0);
      });
      And('stdout is "GraphHandle"', () => {
        expect((lastResult?.stdout ?? '').trim()).toBe('GraphHandle');
      });
    });

    RuleScenario('the removed api field fails loud', ({ When, Then, And }) => {
      When('I run the graph CLI with q expression "return g.api.getStatusCounts()"', async () => {
        lastResult = await runCLI(GRAPH_CLI, [...BASE, 'q', 'return g.api.getStatusCounts()'], {
          timeout: 120000,
        });
      });
      Then('the exit code is non-zero', () => {
        expect(lastResult?.exitCode).not.toBe(0);
      });
      And('stderr mentions "getStatusCounts"', () => {
        expect(lastResult?.stderr ?? '').toContain('getStatusCounts');
      });
    });

    RuleScenario('canonical graph mutation cannot corrupt a fresh read', ({ When, Then, And }) => {
      When('I attempt canonical graph mutation through q', async () => {
        mutationResult = await runCLI(
          GRAPH_CLI,
          [
            ...BASE,
            'q',
            'g.graph.patterns[0].name="Mutated"; return g.pattern("GraphHandle")?.name',
          ],
          { timeout: 120000 },
        );
        freshResult = await runCLI(GRAPH_CLI, [...BASE, 'q', 'g.pattern("GraphHandle")?.name'], {
          timeout: 120000,
        });
      });
      Then('mutation throws or the GraphHandle sentinel remains unchanged', () => {
        expect(
          mutationResult?.exitCode !== 0 || mutationResult.stdout.trim() === 'GraphHandle',
        ).toBe(true);
      });
      And('a fresh q invocation returns the GraphHandle sentinel', () => {
        expect(freshResult).toEqual({ exitCode: 0, stdout: 'GraphHandle\n', stderr: '' });
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
          stdin: GRAPH_HANDLE_BATTERY_SCRIPT,
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
      And('stdout matches the exact strict dangling JSON shape', () => {
        const doc = parseStrictDangling((lastResult?.stdout ?? '').trim());
        expect(doc).toEqual(EXPECTED_STRICT_DANGLING);
      });
    });
  });
});
