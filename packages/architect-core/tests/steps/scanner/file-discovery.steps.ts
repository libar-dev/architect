import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { findFilesToScan } from '../../../src/scanner/pattern-scanner.js';
import type { ScannerConfig } from '../../../src/types/index.js';
import { getRequiredCell } from '../../support/world.js';

type DataTableRow = Record<string, string>;

interface FileDiscoveryState {
  tempDir: string | null;
  config: ScannerConfig;
  foundFiles: string[];
}

let state: FileDiscoveryState | null = null;

function initState(): FileDiscoveryState {
  return {
    tempDir: null,
    config: { patterns: [], baseDir: '' },
    foundFiles: [],
  };
}

const feature = await loadFeature('tests/features/scanner/file-discovery.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(async () => {
    if (state?.tempDir) await fs.rm(state.tempDir, { recursive: true, force: true });
    state = null;
  });

  Background(({ Given }) => {
    Given('a file discovery context with temp directory', async () => {
      state = initState();
      state.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-discovery-test-'));
      state.config.baseDir = state.tempDir;
    });
  });

  const givenDirectoryStructure = async (_ctx: unknown, table: DataTableRow[]) => {
    if (!state?.tempDir) throw new Error('State not initialized');
    for (const row of table) {
      const filePath = path.join(state.tempDir, getRequiredCell(row, 'path'));
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, getRequiredCell(row, 'content'));
    }
  };

  const givenScannerConfigWithPatterns = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    state.config.patterns = table.map((row) => getRequiredCell(row, 'pattern'));
  };

  const givenExcludePatterns = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    state.config.exclude = table.map((row) => getRequiredCell(row, 'pattern'));
  };

  const whenFilesAreScanned = async () => {
    if (!state) throw new Error('State not initialized');
    state.foundFiles = [...(await findFilesToScan(state.config))];
  };

  const thenFileCountShouldBe = (_ctx: unknown, count: number) => {
    expect(state!.foundFiles).toHaveLength(count);
  };
  const thenFileEndingWithShouldBeFound = (_ctx: unknown, ending: string) => {
    expect(state!.foundFiles.some((file) => file.endsWith(ending))).toBe(true);
  };
  const thenNoFilesEndingWithShouldBeFound = (_ctx: unknown, ending: string) => {
    expect(state!.foundFiles.some((file) => file.endsWith(ending))).toBe(false);
  };
  const thenNoFilesContainingShouldBeFound = (_ctx: unknown, substring: string) => {
    expect(state!.foundFiles.some((file) => file.includes(substring))).toBe(false);
  };
  const thenFileContainingShouldBeFound = (_ctx: unknown, substring: string) => {
    expect(state!.foundFiles.some((file) => file.includes(substring))).toBe(true);
  };
  const thenAllPathsShouldBeAbsolute = () => {
    for (const file of state!.foundFiles) expect(path.isAbsolute(file)).toBe(true);
  };

  const thenFilesEndingWithShouldBeFound = (_ctx: unknown, table: DataTableRow[]) => {
    for (const row of table) {
      expect(state!.foundFiles.some((file) => file.endsWith(getRequiredCell(row, 'ending')))).toBe(
        true
      );
    }
  };
  const thenFilesEndingWithShouldNotBeFound = (_ctx: unknown, table: DataTableRow[]) => {
    for (const row of table) {
      expect(state!.foundFiles.some((file) => file.endsWith(getRequiredCell(row, 'ending')))).toBe(
        false
      );
    }
  };
  const thenFilesContainingShouldBeFound = (_ctx: unknown, table: DataTableRow[]) => {
    for (const row of table) {
      expect(
        state!.foundFiles.some((file) => file.includes(getRequiredCell(row, 'substring')))
      ).toBe(true);
    }
  };

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
