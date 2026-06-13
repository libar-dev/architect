import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { detectGherkinTagSpaceForm } from '../src/index.js';

/**
 * Minimal regression coverage for the `gherkin-tag-space-form` anti-pattern:
 * a `.feature` file must declare identity tags colon-form
 * (`@architect-pattern:Name`); the JSDoc space-form (`@architect-pattern Name`)
 * silently drops the name and must be flagged.
 */
describe('detectGherkinTagSpaceForm', () => {
  let dir: string;

  const writeFeature = (name: string, content: string): string => {
    const filePath = path.join(dir, name);
    writeFileSync(filePath, content, 'utf-8');
    return filePath;
  };

  beforeAll(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'gherkin-tag-space-form-'));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('fires on space-form @architect-pattern and @architect-implements', () => {
    const filePath = writeFeature(
      'space-form.feature',
      [
        '@architect-pattern SomePattern',
        '@architect-implements SomePattern',
        'Feature: Space form',
        '  Scenario: x',
        '    Given y',
      ].join('\n'),
    );

    const violations = detectGherkinTagSpaceForm([{ filePath } as never]);

    expect(violations).toHaveLength(2);
    for (const v of violations) {
      expect(v.id).toBe('gherkin-tag-space-form');
      expect(v.severity).toBe('error');
      expect(v.file).toBe(filePath);
    }
    expect(violations.map((v) => v.line).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([1, 2]);
  });

  it('passes on the correct colon-form', () => {
    const filePath = writeFeature(
      'colon-form.feature',
      [
        '@architect-pattern:SomePattern',
        '@architect-implements:SomePattern',
        '@architect-status:completed',
        'Feature: Colon form',
        '  Scenario: x',
        '    Given y',
      ].join('\n'),
    );

    const violations = detectGherkinTagSpaceForm([{ filePath } as never]);

    expect(violations).toHaveLength(0);
  });
});
