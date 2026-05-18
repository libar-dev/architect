import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { detectFileChanges } from '../../src/index.js';

const tempDirs: string[] = [];

function createTempRepo(prefix: string): string {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(tempDir);
  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  mkdirSync(path.join(tempDir, 'architect', 'specs'), { recursive: true });
  return tempDir;
}

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('detectFileChanges status seam', () => {
  it('parses valid process-status tags from added files', () => {
    const baseDir = createTempRepo('architect-guard-status-valid-');
    const relativePath = 'architect/specs/new-pattern.feature';

    writeFileSync(
      path.join(baseDir, relativePath),
      ['@architect-status:active', 'Feature: Added pattern', '', '  Scenario: Example'].join('\n'),
    );

    const result = detectFileChanges(baseDir, [relativePath], {
      featurePatterns: ['architect/specs/**/*.feature'],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.statusTransitions.get(relativePath)).toMatchObject({
      from: 'roadmap',
      to: 'active',
      isNewFile: true,
    });
  });

  it('ignores non-process statuses at the FSM seam', () => {
    const baseDir = createTempRepo('architect-guard-status-invalid-');
    const relativePath = 'architect/specs/new-pattern.feature';

    writeFileSync(
      path.join(baseDir, relativePath),
      ['@architect-status:candidate', 'Feature: Candidate pattern', '', '  Scenario: Example'].join(
        '\n',
      ),
    );

    const result = detectFileChanges(baseDir, [relativePath], {
      featurePatterns: ['architect/specs/**/*.feature'],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.statusTransitions.size).toBe(0);
  });
});
