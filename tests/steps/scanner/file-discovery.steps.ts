/**
 * File Discovery Step Definitions
 *
 * BDD step definitions for testing the findFilesToScan function.
 * Tests file discovery with glob patterns, default exclusions,
 * and custom exclude patterns.
 *
 * @architect
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { findFilesToScan } from '../../../src/scanner/pattern-scanner.js';
import type { ScannerConfig } from '../../../src/types/index.js';

// =============================================================================
// Types
// =============================================================================

type DataTableRow = Record<string, string>;

interface FileDiscoveryState {
  tempDir: string | null;
  config: ScannerConfig;
  foundFiles: string[];
}

// =============================================================================
// Module State
// =============================================================================

let state: FileDiscoveryState | null = null;

function initState(): FileDiscoveryState {
  return {
    tempDir: null,
    config: {
      patterns: [],
      baseDir: '',
    },
    foundFiles: [],
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/scanner/file-discovery.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  AfterEachScenario(async () => {
    if (state?.tempDir) {
      await fs.rm(state.tempDir, { recursive: true, force: true });
    }
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a file discovery context with temp directory', async () => {
      state = initState();
      state.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-discovery-test-'));
      state.config.baseDir = state.tempDir;
    });
  });

  // ---------------------------------------------------------------------------
  // Step Handlers - Given
  // ---------------------------------------------------------------------------

  const givenDirectoryStructure = async (_ctx: unknown, table: DataTableRow[]) => {
    if (!state?.tempDir) throw new Error('State not initialized');

    for (const row of table) {
      const filePath = path.join(state.tempDir, row.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, row.content);
    }
  };

  const givenScannerConfigWithPatterns = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    state.config.patterns = table.map((row) => row.pattern);
  };

  const givenExcludePatterns = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    state.config.exclude = table.map((row) => row.pattern);
  };

  // ---------------------------------------------------------------------------
  // Step Handlers - When
  // ---------------------------------------------------------------------------

  const whenFilesAreScanned = async () => {
    if (!state) throw new Error('State not initialized');
    state.foundFiles = await findFilesToScan(state.config);
  };

  // ---------------------------------------------------------------------------
  // Step Handlers - Then (single value)
  // ---------------------------------------------------------------------------

  const thenFileCountShouldBe = (_ctx: unknown, count: number) => {
    if (!state) throw new Error('State not initialized');
    expect(state.foundFiles).toHaveLength(count);
  };

  const thenFileEndingWithShouldBeFound = (_ctx: unknown, ending: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.foundFiles.some((f) => f.endsWith(ending))).toBe(true);
  };

  const thenNoFilesEndingWithShouldBeFound = (_ctx: unknown, ending: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.foundFiles.some((f) => f.endsWith(ending))).toBe(false);
  };

  const thenNoFilesContainingShouldBeFound = (_ctx: unknown, substring: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.foundFiles.some((f) => f.includes(substring))).toBe(false);
  };

  const thenFileContainingShouldBeFound = (_ctx: unknown, substring: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.foundFiles.some((f) => f.includes(substring))).toBe(true);
  };

  const thenAllPathsShouldBeAbsolute = () => {
    if (!state) throw new Error('State not initialized');
    for (const file of state.foundFiles) {
      expect(path.isAbsolute(file)).toBe(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Step Handlers - Then (table-based)
  // ---------------------------------------------------------------------------

  const thenFilesEndingWithShouldBeFound = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    for (const row of table) {
      expect(state.foundFiles.some((f) => f.endsWith(row.ending))).toBe(true);
    }
  };

  const thenFilesEndingWithShouldNotBeFound = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    for (const row of table) {
      expect(state.foundFiles.some((f) => f.endsWith(row.ending))).toBe(false);
    }
  };

  const thenFilesContainingShouldBeFound = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    for (const row of table) {
      expect(state.foundFiles.some((f) => f.includes(row.substring))).toBe(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Rule: Glob patterns match TypeScript source files
  // ---------------------------------------------------------------------------

  Rule('Glob patterns match TypeScript source files', ({ RuleScenario }) => {
    RuleScenario('Find TypeScript files matching glob patterns', ({ Given, When, Then, And }) => {
      Given('a directory structure:', givenDirectoryStructure);
      And('scanner config with patterns:', givenScannerConfigWithPatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('{int} files should be found', thenFileCountShouldBe);
      And('files ending with should be found:', thenFilesEndingWithShouldBeFound);
    });

    RuleScenario('Return absolute paths', ({ Given, When, Then, And }) => {
      Given('a directory structure:', givenDirectoryStructure);
      And('scanner config with patterns:', givenScannerConfigWithPatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('{int} file should be found', thenFileCountShouldBe);
      And('all found paths should be absolute', thenAllPathsShouldBeAbsolute);
    });

    RuleScenario('Support multiple glob patterns', ({ Given, When, Then, And }) => {
      Given('a directory structure:', givenDirectoryStructure);
      And('scanner config with patterns:', givenScannerConfigWithPatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('{int} files should be found', thenFileCountShouldBe);
      And('files containing should be found:', thenFilesContainingShouldBeFound);
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Default exclusions filter non-source files
  // ---------------------------------------------------------------------------

  Rule('Default exclusions filter non-source files', ({ RuleScenario }) => {
    RuleScenario('Exclude node_modules by default', ({ Given, When, Then, And }) => {
      Given('a directory structure:', givenDirectoryStructure);
      And('scanner config with patterns:', givenScannerConfigWithPatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('no files containing {string} should be found', thenNoFilesContainingShouldBeFound);
      And('a file ending with {string} should be found', thenFileEndingWithShouldBeFound);
    });

    RuleScenario('Exclude dist directory by default', ({ Given, When, Then, And }) => {
      Given('a directory structure:', givenDirectoryStructure);
      And('scanner config with patterns:', givenScannerConfigWithPatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('no files containing {string} should be found', thenNoFilesContainingShouldBeFound);
      And('a file ending with {string} should be found', thenFileEndingWithShouldBeFound);
    });

    RuleScenario('Exclude test files by default', ({ Given, When, Then, And }) => {
      Given('a directory structure:', givenDirectoryStructure);
      And('scanner config with patterns:', givenScannerConfigWithPatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('files ending with should NOT be found:', thenFilesEndingWithShouldNotBeFound);
      And('a file ending with {string} should be found', thenFileEndingWithShouldBeFound);
    });

    RuleScenario('Exclude .d.ts declaration files', ({ Given, When, Then, And }) => {
      Given('a directory structure:', givenDirectoryStructure);
      And('scanner config with patterns:', givenScannerConfigWithPatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('no files ending with {string} should be found', thenNoFilesEndingWithShouldBeFound);
      And('a file ending with {string} should be found', thenFileEndingWithShouldBeFound);
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Custom configuration extends discovery behavior
  // ---------------------------------------------------------------------------

  Rule('Custom configuration extends discovery behavior', ({ RuleScenario }) => {
    RuleScenario('Respect custom exclude patterns', ({ Given, When, Then, And }) => {
      Given('a directory structure:', givenDirectoryStructure);
      And('scanner config with patterns:', givenScannerConfigWithPatterns);
      And('exclude patterns:', givenExcludePatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('no files containing {string} should be found', thenNoFilesContainingShouldBeFound);
      And('a file containing {string} should be found', thenFileContainingShouldBeFound);
    });

    RuleScenario('Return empty array when no files match', ({ Given, When, Then }) => {
      Given('scanner config with patterns:', givenScannerConfigWithPatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('{int} files should be found', thenFileCountShouldBe);
    });

    RuleScenario('Handle nested directory structures', ({ Given, When, Then, And }) => {
      Given('a directory structure:', givenDirectoryStructure);
      And('scanner config with patterns:', givenScannerConfigWithPatterns);
      When('files are scanned', whenFilesAreScanned);
      Then('{int} file should be found', thenFileCountShouldBe);
      And('a file containing {string} should be found', thenFileContainingShouldBeFound);
    });
  });
});
