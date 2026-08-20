import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { detectAntiPatterns } from '../src/index.js';

const INTEGRITY_IDS = [
  'ts-missing-architect-marker',
  'ts-tags-after-prose',
  'ts-uses-space-form',
] as const;

const integrityOf = (filePath: string): ReturnType<typeof detectAntiPatterns> =>
  detectAntiPatterns([{ filePath, directives: [] } as never], []).filter((violation) =>
    (INTEGRITY_IDS as readonly string[]).includes(violation.id),
  );

/**
 * Baseline + malformed coverage for TypeScript annotation-integrity
 * anti-patterns: missing leading `@architect`, tags after description prose,
 * and space-separated multi-target `@architect-uses`.
 */
describe('TypeScript annotation integrity', () => {
  let dir: string;

  const writeTs = (name: string, content: string): string => {
    const filePath = path.join(dir, name);
    writeFileSync(filePath, content, 'utf-8');
    return filePath;
  };

  beforeAll(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'ts-annotation-integrity-'));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe('valid near-misses', () => {
    it('passes a marker-first block with prose after tags', () => {
      const filePath = writeTs(
        'marker-first.ts',
        [
          '/**',
          ' * @architect',
          ' * @architect-pattern MarkerFirst',
          ' * @architect-status completed',
          ' *',
          ' * Prose after tags is valid.',
          ' */',
          'export const markerFirst = 1;',
        ].join('\n'),
      );

      expect(integrityOf(filePath)).toEqual([]);
    });

    it('passes comma-form multi-target @architect-uses', () => {
      const filePath = writeTs(
        'comma-uses.ts',
        [
          '/**',
          ' * @architect',
          ' * @architect-pattern CommaUses',
          ' * @architect-status completed',
          ' * @architect-uses Alpha, Bravo, Charlie',
          ' */',
          'export const commaUses = 1;',
        ].join('\n'),
      );

      expect(integrityOf(filePath)).toEqual([]);
    });

    it('passes a single-target @architect-uses', () => {
      const filePath = writeTs(
        'single-uses.ts',
        [
          '/**',
          ' * @architect',
          ' * @architect-pattern SingleUses',
          ' * @architect-status completed',
          ' * @architect-uses SoloTarget',
          ' */',
          'export const singleUses = 1;',
        ].join('\n'),
      );

      expect(integrityOf(filePath)).toEqual([]);
    });

    it('passes a marker-first pattern block with @architect-shape after prose', () => {
      const filePath = writeTs(
        'shape-after-pattern-prose.ts',
        [
          '/**',
          ' * @architect',
          ' * @architect-pattern ShapeAfterProse',
          ' * @architect-status completed',
          ' *',
          ' * Description then a shape tag is valid.',
          ' * @architect-shape',
          ' */',
          'export const shapeAfterProse = 1;',
        ].join('\n'),
      );

      expect(integrityOf(filePath)).toEqual([]);
    });

    it('passes declaration prose followed by @architect-shape', () => {
      const filePath = writeTs(
        'shape-after-prose.ts',
        [
          '/**',
          ' * A declaration description is not a pattern block.',
          ' * @architect-shape',
          ' */',
          'export type ShapeOnly = string;',
        ].join('\n'),
      );

      expect(integrityOf(filePath)).toEqual([]);
    });
  });

  describe('malformed forms', () => {
    it('errors on a pattern JSDoc without a leading bare @architect', () => {
      const filePath = writeTs(
        'missing-marker.ts',
        [
          '/**',
          ' * @architect-pattern MissingMarker',
          ' * @architect-status completed',
          ' */',
          'export const missingMarker = 1;',
        ].join('\n'),
      );

      const violations = integrityOf(filePath);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.id).toBe('ts-missing-architect-marker');
      expect(violations[0]?.severity).toBe('error');
      expect(violations[0]?.file).toBe(filePath);
      expect(violations[0]?.line).toBe(2);
    });

    it('errors on architect tags after description prose', () => {
      const filePath = writeTs(
        'tags-after-prose.ts',
        [
          '/**',
          ' * Description first is invalid.',
          ' * @architect',
          ' * @architect-pattern AfterProse',
          ' * @architect-status completed',
          ' */',
          'export const afterProse = 1;',
        ].join('\n'),
      );

      const violations = integrityOf(filePath);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.id).toBe('ts-tags-after-prose');
      expect(violations[0]?.severity).toBe('error');
      expect(violations[0]?.file).toBe(filePath);
      expect(violations[0]?.line).toBe(3);
    });

    it('errors on space-separated multi-target @architect-uses', () => {
      const filePath = writeTs(
        'space-uses.ts',
        [
          '/**',
          ' * @architect',
          ' * @architect-pattern SpaceUses',
          ' * @architect-status completed',
          ' * @architect-uses Alpha Bravo Charlie',
          ' */',
          'export const spaceUses = 1;',
        ].join('\n'),
      );

      const violations = integrityOf(filePath);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.id).toBe('ts-uses-space-form');
      expect(violations[0]?.severity).toBe('error');
      expect(violations[0]?.file).toBe(filePath);
      expect(violations[0]?.line).toBe(5);
    });
  });
});
