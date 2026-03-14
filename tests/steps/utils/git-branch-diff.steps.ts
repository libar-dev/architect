/**
 * @libar-docs
 * @libar-docs-implements GitBranchDiffTesting
 * @libar-docs-uses GitBranchDiff, GitHelpers
 *
 * Git Branch Diff Step Definitions
 *
 * BDD step definitions for testing branch-scoped git change detection and the
 * shared NUL-delimited name-status parser.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { getChangedFilesList, parseGitNameStatus } from '../../../src/git/index.js';
import {
  createTempDir,
  writeTempFile,
  type TempDirContext,
} from '../../support/helpers/file-system.js';
import type { DataTableRow } from '../../support/world.js';

interface GitBranchDiffState {
  tempContext: TempDirContext | null;
  changedFiles: readonly string[] | null;
  parseOutput: string;
  parsedModifiedFiles: string[];
}

let state: GitBranchDiffState | null = null;

function initState(): GitBranchDiffState {
  return {
    tempContext: null,
    changedFiles: null,
    parseOutput: '',
    parsedModifiedFiles: [],
  };
}

function getState(): GitBranchDiffState {
  if (!state) {
    throw new Error('State not initialized');
  }
  return state;
}

function getRepoDir(): string {
  const tempDir = getState().tempContext?.tempDir;
  if (!tempDir) {
    throw new Error('Git repository not initialized');
  }
  return tempDir;
}

function runGit(args: readonly string[], cwd = getRepoDir()): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

async function writeAndStageFile(relativePath: string, content: string): Promise<void> {
  const repoDir = getRepoDir();
  await writeTempFile(repoDir, relativePath, content);
  runGit(['add', '--', relativePath], repoDir);
}

async function commitFile(relativePath: string, content: string): Promise<void> {
  await writeAndStageFile(relativePath, content);
  runGit(['commit', '-m', `Add ${relativePath}`]);
}

const feature = await loadFeature('tests/features/utils/git-branch-diff.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(async () => {
    if (state?.tempContext) {
      await state.tempContext.cleanup();
    }
    state = null;
  });

  Background(({ Given }) => {
    Given('a git branch diff test context', () => {
      state = initState();
    });
  });

  Rule('getChangedFilesList returns only existing changed files', ({ RuleScenario }) => {
    RuleScenario(
      'Modified and added files are returned while deleted files are excluded',
      ({ Given, And, When, Then }) => {
        Given('an initialized git repository', async () => {
          state = initState();
          state.tempContext = await createTempDir({ prefix: 'git-branch-diff-test-' });
          runGit(['init', '--initial-branch=main']);
          runGit(['config', 'user.email', 'test@example.com']);
          runGit(['config', 'user.name', 'Test User']);
        });

        And('these committed files exist:', async (_ctx: unknown, table: DataTableRow[]) => {
          for (const row of table) {
            await commitFile(row.file ?? '', row.content ?? '');
          }
        });

        When(
          'I modify file {string} to {string}',
          async (_ctx: unknown, relativePath: string, content: string) => {
            await writeAndStageFile(relativePath, content);
          }
        );

        And(
          'I add file {string} with content {string}',
          async (_ctx: unknown, relativePath: string, content: string) => {
            await writeAndStageFile(relativePath, content);
          }
        );

        And('I delete file {string}', async (_ctx: unknown, relativePath: string) => {
          await fs.rm(path.join(getRepoDir(), relativePath));
          runGit(['rm', '-f', '--cached', '--', relativePath]);
        });

        And('I list changed files against {string}', (_ctx: unknown, baseBranch: string) => {
          const result = getChangedFilesList(getRepoDir(), baseBranch);
          expect(result.ok).toBe(true);
          state!.changedFiles = result.ok ? result.value : [];
        });

        Then('the changed files should include:', (_ctx: unknown, table: DataTableRow[]) => {
          const changedFiles = state!.changedFiles ?? [];
          for (const row of table) {
            expect(changedFiles).toContain(row.file ?? '');
          }
        });

        And('the changed files should not include:', (_ctx: unknown, table: DataTableRow[]) => {
          const changedFiles = state!.changedFiles ?? [];
          for (const row of table) {
            expect(changedFiles).not.toContain(row.file ?? '');
          }
        });
      }
    );
  });

  Rule('Paths with spaces are preserved', ({ RuleScenario }) => {
    RuleScenario('File paths with spaces are preserved', ({ Given, And, When, Then }) => {
      Given('an initialized git repository', async () => {
        state = initState();
        state.tempContext = await createTempDir({ prefix: 'git-branch-diff-test-' });
        runGit(['init', '--initial-branch=main']);
        runGit(['config', 'user.email', 'test@example.com']);
        runGit(['config', 'user.name', 'Test User']);
      });

      And(
        'a committed file {string} with content {string}',
        async (_ctx: unknown, relativePath: string, content: string) => {
          await commitFile(relativePath, content);
        }
      );

      When(
        'I modify file {string} to {string}',
        async (_ctx: unknown, relativePath: string, content: string) => {
          await writeAndStageFile(relativePath, content);
        }
      );

      And('I list changed files against {string}', (_ctx: unknown, baseBranch: string) => {
        const result = getChangedFilesList(getRepoDir(), baseBranch);
        expect(result.ok).toBe(true);
        state!.changedFiles = result.ok ? result.value : [];
      });

      Then('the changed files should include:', (_ctx: unknown, table: DataTableRow[]) => {
        const changedFiles = state!.changedFiles ?? [];
        for (const row of table) {
          expect(changedFiles).toContain(row.file ?? '');
        }
      });
    });
  });

  Rule('NUL-delimited rename and copy statuses use the new path', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'Similarity status maps to the new path',
      ({ Given, When, Then }, variables: { status: string; oldPath: string; newPath: string }) => {
        Given(
          'a git name-status output with status "<status>" from "<oldPath>" to "<newPath>"',
          () => {
            state = initState();
            state.parseOutput = `${variables.status}\0${variables.oldPath}\0${variables.newPath}\0`;
          }
        );

        When('I parse the git name-status output', () => {
          state!.parsedModifiedFiles = parseGitNameStatus(state!.parseOutput).modified;
        });

        Then('the parsed modified files should include "<newPath>"', () => {
          expect(state!.parsedModifiedFiles).toContain(variables.newPath);
        });
      }
    );
  });
});
