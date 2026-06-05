/**
 * @architect
 * @architect-pattern GraphInventory
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:read-api
 * @architect-uses ExtractedPattern, PatternGraph, PatternHelpers
 */
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { PatternGraph } from '../validation-schemas/pattern-graph.js';
import { getPatternName, getRelationshipsForPattern } from './pattern-helpers.js';

export interface TagValueCount {
  readonly value: string;
  readonly count: number;
}

export interface TagUsageEntry {
  readonly tag: string;
  readonly count: number;
  readonly values: readonly TagValueCount[] | null;
}

export interface TagUsageReport {
  readonly tags: readonly TagUsageEntry[];
  readonly patternCount: number;
}

export interface SourceTypeEntry {
  readonly type: string;
  readonly count: number;
  readonly locationPattern: string;
  readonly files: readonly string[];
}

export interface SourceInventory {
  readonly types: readonly SourceTypeEntry[];
  readonly totalFiles: number;
}

export interface OrphanEntry {
  readonly pattern: string;
  readonly status: string | undefined;
  readonly file: string;
}

export function aggregateTagUsage(dataset: PatternGraph): TagUsageReport {
  const tagMap = new Map<string, Map<string, number>>();

  function increment(tag: string, value: string): void {
    let values = tagMap.get(tag);
    if (values === undefined) {
      values = new Map<string, number>();
      tagMap.set(tag, values);
    }
    values.set(value, (values.get(value) ?? 0) + 1);
  }

  for (const pattern of dataset.patterns) {
    increment('status', pattern.status);
    if (pattern.role !== undefined) increment('role', pattern.role);
    if (pattern.boundedContext !== undefined) increment('arch-context', pattern.boundedContext);
    if (pattern.priority !== undefined) increment('priority', pattern.priority);
    if (pattern.team !== undefined) increment('team', pattern.team);
    if (pattern.effort !== undefined) increment('effort', pattern.effort);
  }

  const tags: TagUsageEntry[] = [];
  for (const [tag, values] of tagMap) {
    const count = [...values.values()].reduce((sum, value) => sum + value, 0);
    const valueCounts = [...values.entries()]
      .map(([value, total]) => ({ value, count: total }))
      .sort((left, right) => right.count - left.count);
    tags.push({ tag, count, values: valueCounts });
  }

  tags.sort((left, right) => right.count - left.count);
  return { tags, patternCount: dataset.patterns.length };
}

function categorizeFile(filePath: string, pattern: ExtractedPattern): string {
  if (filePath.includes('/stubs/')) return 'Stubs';
  if (filePath.includes('/decisions/') || pattern.adr !== undefined) return 'Decisions';
  if (filePath.endsWith('.feature')) return 'Gherkin (features)';
  if (filePath.endsWith('.ts')) return 'TypeScript (annotated)';
  return 'Other';
}

function deriveLocationPattern(files: readonly string[]): string {
  if (files.length === 0) return '';

  const parts = files[0]?.split('/') ?? [];
  let commonDepth = 0;
  for (let index = 0; index < parts.length - 1; index += 1) {
    if (files.some((file) => file.split('/')[index] !== parts[index])) {
      break;
    }
    commonDepth = index + 1;
  }

  const prefix = parts.slice(0, commonDepth).join('/');
  const extension = files[0]?.split('.').pop() ?? '*';
  return prefix !== '' ? `${prefix}/**/*.${extension}` : `**/*.${extension}`;
}

export function buildSourceInventory(dataset: PatternGraph): SourceInventory {
  const grouped = new Map<string, Set<string>>();

  for (const pattern of dataset.patterns) {
    const filePath = pattern.source.file;
    const type = categorizeFile(filePath, pattern);
    let fileSet = grouped.get(type);
    if (fileSet === undefined) {
      fileSet = new Set<string>();
      grouped.set(type, fileSet);
    }
    fileSet.add(filePath);
  }

  const types = [...grouped.entries()]
    .map(([type, fileSet]) => {
      const files = [...fileSet];
      return {
        type,
        count: files.length,
        locationPattern: deriveLocationPattern(files),
        files,
      };
    })
    .sort((left, right) => right.count - left.count);

  return {
    types,
    totalFiles: types.reduce((sum, entry) => sum + entry.count, 0),
  };
}

export function findOrphanPatterns(dataset: PatternGraph): readonly OrphanEntry[] {
  const orphans: OrphanEntry[] = [];
  for (const pattern of dataset.patterns) {
    const name = getPatternName(pattern);
    const relationships = getRelationshipsForPattern(dataset, pattern);
    const hasAnyRelationships =
      relationships.uses.length > 0 ||
      relationships.usedBy.length > 0 ||
      relationships.dependsOn.length > 0 ||
      relationships.enables.length > 0 ||
      relationships.implementsPatterns.length > 0 ||
      relationships.implementedBy.length > 0 ||
      relationships.extendedBy.length > 0 ||
      relationships.seeAlso.length > 0 ||
      relationships.extendsPattern !== undefined;

    if (!hasAnyRelationships) {
      orphans.push({ pattern: name, status: pattern.status, file: pattern.source.file });
    }
  }

  return orphans;
}
