/**
 * Session File Lifecycle Step Definitions
 *
 * BDD step definitions for testing automatic cleanup of orphaned session files
 * when phases transition from active to completed.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as path from 'node:path';
import {
  createTempDir,
  writeTempFile,
  fileExists,
  type TempDirContext,
} from '../../support/helpers/file-system.js';
import {
  cleanupOrphanedSessionFiles,
  type CleanupResult,
} from '../../../src/generators/orchestrator.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface SessionLifecycleState {
  tempContext: TempDirContext | null;
  outputDir: string;
  sessionsDir: string;
  patterns: Array<{ phase: number; status: string }>;
  preserveFiles: Set<string>;
  cleanupResult: CleanupResult | null;
  generatorOutput: { filesToDelete?: string[] } | null;
  runCount: number;
  errors: string[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: SessionLifecycleState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): SessionLifecycleState {
  return {
    tempContext: null,
    outputDir: '',
    sessionsDir: 'sessions/',
    patterns: [],
    preserveFiles: new Set(),
    cleanupResult: null,
    generatorOutput: null,
    runCount: 0,
    errors: [],
  };
}

async function createSessionFile(tempDir: string, phase: number, content?: string): Promise<void> {
  const defaultContent = `# Phase ${phase} Session\n\nStale content from when phase was active.\n`;
  await writeTempFile(tempDir, `sessions/phase-${phase}.md`, content ?? defaultContent);
}

// =============================================================================
// Feature: Session File Lifecycle Management
// =============================================================================

const feature = await loadFeature('tests/features/behavior/session-file-lifecycle.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(async () => {
    if (state?.tempContext) {
      await state.tempContext.cleanup();
    }
    state = null;
  });

  Background(({ Given }) => {
    Given('a temporary output directory with sessions subdirectory', async () => {
      state = initState();
      state.tempContext = await createTempDir({ prefix: 'session-lifecycle-' });
      state.outputDir = state.tempContext.tempDir;
      // Create empty sessions directory
      await writeTempFile(state.outputDir, 'sessions/.gitkeep', '');
    });
  });

  // ===========================================================================
  // Rule: Orphaned session files are removed during generation
  // ===========================================================================

  Rule('Orphaned session files are removed during generation', ({ RuleScenario }) => {
    RuleScenario(
      'Orphaned session files are deleted during generation',
      ({ Given, And, When, Then }) => {
        Given('existing session files for phases 8, 9, and 31', async () => {
          await createSessionFile(state!.outputDir, 8);
          await createSessionFile(state!.outputDir, 9);
          await createSessionFile(state!.outputDir, 31);
        });

        And('patterns with only phase 42 as active', () => {
          state!.patterns = [{ phase: 42, status: 'active' }];
          state!.preserveFiles = new Set(['phase-42.md']);
        });

        When('generating session-context output with cleanup', async () => {
          // Create the active phase file (simulating generator output)
          await createSessionFile(state!.outputDir, 42, '# Phase 42 - Active\n\nFresh content.');

          // Run cleanup
          state!.cleanupResult = await cleanupOrphanedSessionFiles(
            state!.outputDir,
            state!.sessionsDir,
            state!.preserveFiles
          );
        });

        Then('phase-42.md should exist in sessions directory', async () => {
          const exists = await fileExists(state!.outputDir, 'sessions/phase-42.md');
          expect(exists).toBe(true);
        });

        And('phase-8.md should not exist in sessions directory', async () => {
          const exists = await fileExists(state!.outputDir, 'sessions/phase-8.md');
          expect(exists).toBe(false);
        });

        And('phase-9.md should not exist in sessions directory', async () => {
          const exists = await fileExists(state!.outputDir, 'sessions/phase-9.md');
          expect(exists).toBe(false);
        });

        And('phase-31.md should not exist in sessions directory', async () => {
          const exists = await fileExists(state!.outputDir, 'sessions/phase-31.md');
          expect(exists).toBe(false);
        });
      }
    );

    RuleScenario(
      'Active phase session files are preserved and regenerated',
      ({ Given, And, When, Then }) => {
        Given('an existing session file for phase 42 with stale content', async () => {
          await createSessionFile(
            state!.outputDir,
            42,
            '# Phase 42\n\nStale content - 0% progress'
          );
        });

        And('patterns with phase 42 as active', () => {
          state!.patterns = [{ phase: 42, status: 'active' }];
          state!.preserveFiles = new Set(['phase-42.md']);
        });

        When('generating session-context output with cleanup', async () => {
          // Overwrite with fresh content (simulating generator regeneration)
          await createSessionFile(
            state!.outputDir,
            42,
            '# Phase 42\n\nFresh content - 50% progress'
          );

          // Run cleanup - should preserve phase-42.md
          state!.cleanupResult = await cleanupOrphanedSessionFiles(
            state!.outputDir,
            state!.sessionsDir,
            state!.preserveFiles
          );
        });

        Then('phase-42.md should exist in sessions directory', async () => {
          const exists = await fileExists(state!.outputDir, 'sessions/phase-42.md');
          expect(exists).toBe(true);
        });

        And('phase-42.md should have fresh content', async () => {
          const content = await import('node:fs/promises').then((fs) =>
            fs.readFile(path.join(state!.outputDir, 'sessions/phase-42.md'), 'utf-8')
          );
          expect(content).toContain('Fresh content');
          expect(content).toContain('50% progress');
        });
      }
    );
  });

  // ===========================================================================
  // Rule: Cleanup handles edge cases without errors
  // ===========================================================================

  Rule('Cleanup handles edge cases without errors', ({ RuleScenario }) => {
    RuleScenario(
      'No active phases results in empty sessions directory',
      ({ Given, And, When, Then }) => {
        Given('existing session files for phases 8 and 9', async () => {
          await createSessionFile(state!.outputDir, 8);
          await createSessionFile(state!.outputDir, 9);
        });

        And('patterns with no active phases', () => {
          state!.patterns = [];
          state!.preserveFiles = new Set(); // No files to preserve
        });

        When('generating session-context output with cleanup', async () => {
          state!.cleanupResult = await cleanupOrphanedSessionFiles(
            state!.outputDir,
            state!.sessionsDir,
            state!.preserveFiles
          );
        });

        Then('phase-8.md should not exist in sessions directory', async () => {
          const exists = await fileExists(state!.outputDir, 'sessions/phase-8.md');
          expect(exists).toBe(false);
        });

        And('phase-9.md should not exist in sessions directory', async () => {
          const exists = await fileExists(state!.outputDir, 'sessions/phase-9.md');
          expect(exists).toBe(false);
        });
      }
    );

    RuleScenario('Cleanup is idempotent', ({ Given, And, When, Then }) => {
      Given('an empty sessions directory', async () => {
        // Sessions directory already created in Background
      });

      And('patterns with no active phases', () => {
        state!.patterns = [];
        state!.preserveFiles = new Set();
      });

      When('generating session-context output with cleanup multiple times', async () => {
        // Run cleanup 3 times
        for (let i = 0; i < 3; i++) {
          try {
            state!.cleanupResult = await cleanupOrphanedSessionFiles(
              state!.outputDir,
              state!.sessionsDir,
              state!.preserveFiles
            );
            state!.runCount++;
          } catch (error) {
            state!.errors.push(error instanceof Error ? error.message : String(error));
          }
        }
      });

      Then('no errors should occur', () => {
        expect(state!.errors).toHaveLength(0);
        expect(state!.runCount).toBe(3);
        expect(state!.cleanupResult?.errors).toHaveLength(0);
      });

      And('sessions directory should remain empty', async () => {
        const fs = await import('node:fs/promises');
        const files = await fs.readdir(path.join(state!.outputDir, 'sessions'));
        // Only .gitkeep should remain
        const sessionFiles = files.filter((f) => f.endsWith('.md') && f !== '.gitkeep');
        expect(sessionFiles).toHaveLength(0);
      });
    });

    RuleScenario(
      'Missing sessions directory is handled gracefully',
      ({ Given, And, When, Then }) => {
        Given('no sessions directory exists', async () => {
          // Remove the sessions directory created in Background
          const fs = await import('node:fs/promises');
          await fs.rm(path.join(state!.outputDir, 'sessions'), { recursive: true, force: true });
        });

        And('patterns with no active phases', () => {
          state!.patterns = [];
          state!.preserveFiles = new Set();
        });

        When('generating session-context output with cleanup', async () => {
          try {
            state!.cleanupResult = await cleanupOrphanedSessionFiles(
              state!.outputDir,
              state!.sessionsDir,
              state!.preserveFiles
            );
          } catch (error) {
            state!.errors.push(error instanceof Error ? error.message : String(error));
          }
        });

        Then('no errors should occur', () => {
          expect(state!.errors).toHaveLength(0);
          expect(state!.cleanupResult?.errors).toHaveLength(0);
          expect(state!.cleanupResult?.deleted).toHaveLength(0);
        });
      }
    );
  });

  // ===========================================================================
  // Rule: Deleted files are tracked in cleanup results
  // ===========================================================================

  Rule('Deleted files are tracked in cleanup results', ({ RuleScenario }) => {
    RuleScenario('Deleted files are tracked in generator output', ({ Given, And, When, Then }) => {
      Given('existing session files for phases 8 and 31', async () => {
        await createSessionFile(state!.outputDir, 8);
        await createSessionFile(state!.outputDir, 31);
      });

      And('patterns with no active phases', () => {
        state!.patterns = [];
        state!.preserveFiles = new Set();
      });

      When('generating session-context output with cleanup', async () => {
        state!.cleanupResult = await cleanupOrphanedSessionFiles(
          state!.outputDir,
          state!.sessionsDir,
          state!.preserveFiles
        );
      });

      Then('the generator output should include files to delete', () => {
        expect(state!.cleanupResult?.deleted.length).toBeGreaterThan(0);
      });

      And('the files to delete should include "sessions/phase-8.md"', () => {
        expect(state!.cleanupResult?.deleted).toContain('sessions/phase-8.md');
      });

      And('the files to delete should include "sessions/phase-31.md"', () => {
        expect(state!.cleanupResult?.deleted).toContain('sessions/phase-31.md');
      });
    });
  });
});
