import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { describeFeature, loadFeatureFromText } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { McpFileWatcher } from '../../src/file-watcher.js';
import { PipelineSessionManager } from '../../src/pipeline-session.js';
import { createTestSessionManager } from '../support/session-fixtures.js';

const feature = loadFeatureFromText(
  readFileSync('tests/features/mcp-runtime-hardening.feature', 'utf8'),
);

interface TempArchitectProject {
  readonly rootDir: string;
  cleanup(): void;
}

type VoidResolver = (value?: void | PromiseLike<void>) => void;

type BuildSessionMethod = (
  baseDir: string,
  input: readonly string[],
  features: readonly string[],
  tagRegistryOverride?: unknown,
) => Promise<unknown>;

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTempArchitectProject(): TempArchitectProject {
  const rootDir = mkdtempSync(path.join(tmpdir(), 'architect-mcp-runtime-'));
  mkdirSync(path.join(rootDir, 'src'), { recursive: true });
  mkdirSync(path.join(rootDir, 'specs'), { recursive: true });

  writeFileSync(
    path.join(rootDir, 'src', 'example-pattern.ts'),
    `/**
 * @architect
 * @architect-pattern ExamplePattern
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:api
 */
export function examplePattern(): void {}
`,
  );

  writeFileSync(
    path.join(rootDir, 'specs', 'example-pattern.feature'),
    `@architect-pattern:ExamplePatternExecutableTests
@architect-implements:ExamplePattern
@architect-status:active
Feature: Example pattern executable tests
  Scenario: Example executable contract exists
    Given the example executable contract exists
`,
  );

  return {
    rootDir,
    cleanup(): void {
      rmSync(rootDir, { recursive: true, force: true });
    },
  };
}

function delayPipelineBuilds(manager: PipelineSessionManager, delayMs: number): void {
  const buildSession = Reflect.get(manager as object, 'buildSession') as BuildSessionMethod;
  Reflect.set(
    manager as object,
    'buildSession',
    async (...args: Parameters<BuildSessionMethod>) => {
      await waitFor(delayMs);
      return buildSession.apply(manager, args);
    },
  );
}

async function stopWatcher(watcher: McpFileWatcher): Promise<void> {
  await watcher.stop();
}

async function expectPromiseToStayPending(
  promise: Promise<unknown>,
  pauseMs: number,
): Promise<void> {
  let resolved = false;
  void promise.finally(() => {
    resolved = true;
  });
  await waitFor(pauseMs);
  expect(resolved).toBe(false);
}

describeFeature(feature, ({ Rule }) => {
  Rule('Pipeline session lifecycle stays process-safe during builds', ({ RuleScenario }) => {
    RuleScenario('initialize and rebuild keep the host working directory stable', ({ Then }) => {
      Then(
        'the pipeline session lifecycle keeps the host working directory stable during initialize and rebuild',
        async () => {
          const fixture = createTempArchitectProject();
          const originalCwd = process.cwd();
          const manager = new PipelineSessionManager();
          delayPipelineBuilds(manager, 50);

          try {
            const initializePromise = manager.initialize({
              baseDir: fixture.rootDir,
              input: ['src/**/*.ts'],
              features: ['specs/**/*.feature'],
            });
            await waitFor(10);
            expect(process.cwd()).toBe(originalCwd);
            await initializePromise;
            expect(process.cwd()).toBe(originalCwd);

            const rebuildPromise = manager.rebuild();
            await waitFor(10);
            expect(process.cwd()).toBe(originalCwd);
            await rebuildPromise;
            expect(process.cwd()).toBe(originalCwd);
          } finally {
            fixture.cleanup();
          }
        },
      );
    });
  });

  Rule('Watcher shutdown drains in-flight rebuild work', ({ RuleScenario }) => {
    RuleScenario('stopping watch mode drains an in-flight rebuild', ({ Then }) => {
      Then('stopping the MCP file watcher waits for an in-flight rebuild to finish', async () => {
        let releaseRebuild!: VoidResolver;
        const inFlightRebuild = new Promise<void>((resolve) => {
          releaseRebuild = resolve;
        });
        const watcher = new McpFileWatcher({
          globs: ['src/**/*.ts'],
          baseDir: process.cwd(),
          debounceMs: 1,
          sessionManager: createTestSessionManager(),
          log: () => undefined,
        });

        try {
          Reflect.set(watcher as object, 'rebuildPromise', inFlightRebuild);
          const stopPromise = stopWatcher(watcher);
          await expectPromiseToStayPending(stopPromise, 20);
          releaseRebuild();
          await stopPromise;
          expect(Reflect.get(watcher as object, 'rebuildPromise')).toBeNull();
        } finally {
          await stopWatcher(watcher);
        }
      });
    });
  });
});
