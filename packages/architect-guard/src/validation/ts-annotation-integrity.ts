import { readFileSync } from 'fs';

import { DEFAULT_FILE_OPT_IN_TAG, DEFAULT_TAG_PREFIX } from '@libar-dev/architect-core';
import type { TagRegistry } from '@libar-dev/architect-core';

import type { AntiPatternViolation } from './types.js';

interface SourceFile {
  readonly filePath: string;
}

interface JsDocLine {
  readonly line: number;
  readonly text: string;
}

interface JsDocBlock {
  readonly lines: readonly JsDocLine[];
}

interface PrefixPair {
  readonly tagPrefix: string;
  readonly fileOptInTag: string;
}

function resolvePrefix(registry?: TagRegistry): PrefixPair {
  return {
    tagPrefix: registry?.tagPrefix ?? DEFAULT_TAG_PREFIX,
    fileOptInTag: registry?.fileOptInTag ?? DEFAULT_FILE_OPT_IN_TAG,
  };
}

function isBareOptIn(text: string, fileOptInTag: string): boolean {
  const lower = text.toLowerCase();
  const needle = fileOptInTag.toLowerCase();
  if (lower === needle) return true;
  if (!lower.startsWith(needle)) return false;
  const next = lower.charAt(needle.length);
  return next === ' ' || next === '\t';
}

function isArchitectTag(text: string, prefix: PrefixPair): boolean {
  return (
    isBareOptIn(text, prefix.fileOptInTag) ||
    text.toLowerCase().startsWith(prefix.tagPrefix.toLowerCase())
  );
}

function isPatternTag(text: string, tagPrefix: string): boolean {
  const needle = `${tagPrefix.toLowerCase()}pattern`;
  const lower = text.toLowerCase();
  if (lower === needle) return true;
  if (!lower.startsWith(needle)) return false;
  const next = lower.charAt(needle.length);
  return next === ' ' || next === '\t' || next === ':';
}

function usesValue(text: string, tagPrefix: string): string | undefined {
  const needle = `${tagPrefix.toLowerCase()}uses`;
  const lower = text.toLowerCase();
  if (!lower.startsWith(needle)) return undefined;
  const rest = text.slice(needle.length);
  const match = /^(?:\s*:\s*|\s+)(.+)$/u.exec(rest);
  const value = match?.[1]?.trim();
  return value === undefined || value.length === 0 ? undefined : value;
}

function isSpaceSeparatedUses(value: string): boolean {
  return value
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .some((segment) => segment.split(/\s+/u).length > 1);
}

function cleanJsDocLine(raw: string, isFirst: boolean, isLast: boolean): string {
  let text = raw.trim();
  if (isFirst) text = text.replace(/^\/\*\*/u, '');
  if (isLast) text = text.replace(/\*\/$/u, '');
  return text
    .trim()
    .replace(/^\*\s?/u, '')
    .trim();
}

function collectJsDocBlocks(content: string): readonly JsDocBlock[] {
  const rawLines = content.split('\n');
  const blocks: JsDocBlock[] = [];

  for (let i = 0; i < rawLines.length; ) {
    const rawLine = rawLines[i];
    if (!rawLine?.trimStart().startsWith('/**')) {
      i += 1;
      continue;
    }

    const startLine = i + 1;
    const collected: string[] = [];
    const sameLineClose = rawLine.indexOf('*/', rawLine.indexOf('/**') + 3);
    if (sameLineClose !== -1) {
      collected.push(rawLine);
      i += 1;
    } else {
      collected.push(rawLine);
      i += 1;
      while (i < rawLines.length) {
        const body = rawLines[i];
        if (body === undefined) break;
        collected.push(body);
        i += 1;
        if (body.includes('*/')) break;
      }
    }

    blocks.push({
      lines: collected.map((line, index) => ({
        line: startLine + index,
        text: cleanJsDocLine(line, index === 0, index === collected.length - 1),
      })),
    });
  }

  return blocks;
}

function readJsDocBlocks(filePath: string): readonly JsDocBlock[] {
  try {
    return collectJsDocBlocks(readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function firstNonEmpty(lines: readonly JsDocLine[]): JsDocLine | undefined {
  return lines.find((line) => line.text.length > 0);
}

function patternLineOf(block: JsDocBlock, tagPrefix: string): JsDocLine | undefined {
  return block.lines.find((line) => isPatternTag(line.text, tagPrefix));
}

/**
 * A TypeScript JSDoc that names a pattern must lead with the bare opt-in tag.
 * Without it the scanner skips the file (`hasFileOptIn`) and the node never
 * materializes.
 */
export function detectMissingArchitectMarker(
  files: readonly SourceFile[],
  registry?: TagRegistry,
): AntiPatternViolation[] {
  const prefix = resolvePrefix(registry);
  const violations: AntiPatternViolation[] = [];

  for (const file of files) {
    for (const block of readJsDocBlocks(file.filePath)) {
      const patternLine = patternLineOf(block, prefix.tagPrefix);
      if (patternLine === undefined) continue;
      const first = firstNonEmpty(block.lines);
      if (first === undefined || !isArchitectTag(first.text, prefix)) continue;
      if (isBareOptIn(first.text, prefix.fileOptInTag)) continue;

      violations.push({
        id: 'ts-missing-architect-marker',
        message: `JSDoc names a pattern with "${prefix.tagPrefix}pattern" but does not lead with bare ${prefix.fileOptInTag}. The scanner skips the block and the node never materializes.`,
        file: file.filePath,
        line: patternLine.line,
        severity: 'error',
        fix: `Put ${prefix.fileOptInTag} on the first JSDoc tag line, before ${prefix.tagPrefix}pattern.`,
      });
    }
  }

  return violations;
}

/**
 * Architect pattern tags after description prose are dropped: the parser
 * stops at the first non-tag line, so an empty tag list never becomes a node.
 */
export function detectArchitectTagsAfterProse(
  files: readonly SourceFile[],
  registry?: TagRegistry,
): AntiPatternViolation[] {
  const prefix = resolvePrefix(registry);
  const violations: AntiPatternViolation[] = [];

  for (const file of files) {
    for (const block of readJsDocBlocks(file.filePath)) {
      if (patternLineOf(block, prefix.tagPrefix) === undefined) continue;

      const first = firstNonEmpty(block.lines);
      if (first === undefined || isArchitectTag(first.text, prefix)) continue;

      const firstArchitectTag = block.lines.find(
        (line) => line.text.length > 0 && isArchitectTag(line.text, prefix),
      );
      if (firstArchitectTag === undefined) continue;

      violations.push({
        id: 'ts-tags-after-prose',
        message: `Architect tags appear after description prose. The parser stops at the first non-tag line, so the pattern is silently dropped.`,
        file: file.filePath,
        line: firstArchitectTag.line,
        severity: 'error',
        fix: `Move all ${prefix.tagPrefix}* tags (starting with ${prefix.fileOptInTag}) above the description.`,
      });
    }
  }

  return violations;
}

/**
 * Multi-target TypeScript `@architect-uses` must be comma-separated.
 * Space form (`A B C`) fails `PatternReferenceSchema` and drops the node.
 */
export function detectTsUsesSpaceForm(
  files: readonly SourceFile[],
  registry?: TagRegistry,
): AntiPatternViolation[] {
  const prefix = resolvePrefix(registry);
  const violations: AntiPatternViolation[] = [];

  for (const file of files) {
    for (const block of readJsDocBlocks(file.filePath)) {
      for (const line of block.lines) {
        const value = usesValue(line.text, prefix.tagPrefix);
        if (value === undefined || !isSpaceSeparatedUses(value)) continue;
        violations.push({
          id: 'ts-uses-space-form',
          message: `"${prefix.tagPrefix}uses" lists multiple targets with spaces instead of commas. Space form is one invalid token and drops the whole pattern node.`,
          file: file.filePath,
          line: line.line,
          severity: 'error',
          fix: `Rewrite as ${prefix.tagPrefix}uses A, B, C (comma-separated).`,
        });
      }
    }
  }

  return violations;
}
