import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { resolveInvocationDir } from '@libar-dev/architect-core';

const feature = await loadFeature('tests/features/cli-invocation-dir.feature');

const BOGUS_PATH = '/intentionally/nonexistent/cli-invocation-dir-test';

interface EnvSnapshot {
  pwd: string | undefined;
  initCwd: string | undefined;
}

let envSnapshot: EnvSnapshot | null = null;
let resolved: string | null = null;

function snapshotEnv(): EnvSnapshot {
  return {
    pwd: process.env['PWD'],
    initCwd: process.env['INIT_CWD'],
  };
}

function restoreEnv(snapshot: EnvSnapshot): void {
  if (snapshot.pwd === undefined) delete process.env['PWD'];
  else process.env['PWD'] = snapshot.pwd;
  if (snapshot.initCwd === undefined) delete process.env['INIT_CWD'];
  else process.env['INIT_CWD'] = snapshot.initCwd;
}

describeFeature(
  feature,
  ({ BeforeEachScenario, AfterEachScenario, Rule }) => {
    BeforeEachScenario(() => {
      envSnapshot = snapshotEnv();
      resolved = null;
    });

    AfterEachScenario(() => {
      if (envSnapshot !== null) restoreEnv(envSnapshot);
      envSnapshot = null;
      resolved = null;
    });

    Rule('process.cwd() takes precedence over PWD and INIT_CWD', ({ RuleScenario }) => {
      RuleScenario(
        'PWD pointing elsewhere does not override process.cwd()',
        ({ Given, When, Then }) => {
          Given('PWD is set to a bogus path', () => {
            process.env['PWD'] = BOGUS_PATH;
          });
          When('I call resolveInvocationDir', () => {
            resolved = resolveInvocationDir();
          });
          Then('the result equals process.cwd()', () => {
            expect(resolved).toBe(process.cwd());
          });
        },
      );

      RuleScenario(
        'INIT_CWD pointing elsewhere does not override process.cwd()',
        ({ Given, When, Then }) => {
          Given('INIT_CWD is set to a bogus path', () => {
            process.env['INIT_CWD'] = BOGUS_PATH;
          });
          When('I call resolveInvocationDir', () => {
            resolved = resolveInvocationDir();
          });
          Then('the result equals process.cwd()', () => {
            expect(resolved).toBe(process.cwd());
          });
        },
      );

      RuleScenario(
        'Both PWD and INIT_CWD set, process.cwd() still wins',
        ({ Given, And, When, Then }) => {
          Given('PWD is set to a bogus path', () => {
            process.env['PWD'] = BOGUS_PATH;
          });
          And('INIT_CWD is set to a bogus path', () => {
            process.env['INIT_CWD'] = BOGUS_PATH;
          });
          When('I call resolveInvocationDir', () => {
            resolved = resolveInvocationDir();
          });
          Then('the result equals process.cwd()', () => {
            expect(resolved).toBe(process.cwd());
          });
        },
      );
    });
  },
  { excludeTags: ['@skip'] },
);
