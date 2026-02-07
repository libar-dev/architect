/**
 * @libar-docs
 * @libar-docs-pattern ArchQueriesImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIArchitectureQueries
 * @libar-docs-uses ProcessStateAPI, MasterDataset
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer domain
 *
 * ## ArchQueries — Neighborhood, Comparison, Tags, Sources
 *
 * Pure functions over MasterDataset for deep architecture exploration.
 * No I/O — all data comes from pre-computed views.
 */

import type {
  MasterDataset,
  RelationshipEntry,
  ArchIndex,
} from '../validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { NeighborEntry } from './types.js';
import { getPatternName, findPatternByName, getRelationships } from './pattern-helpers.js';

function resolveNeighborEntry(patterns: readonly ExtractedPattern[], name: string): NeighborEntry {
  const p = findPatternByName(patterns, name);
  return {
    name,
    status: p?.status,
    archRole: p?.archRole,
    archContext: p?.archContext,
    file: p?.source.file,
  };
}

// ---------------------------------------------------------------------------
// Neighborhood Types
// ---------------------------------------------------------------------------

export interface NeighborhoodResult {
  readonly pattern: string;
  readonly context: string | undefined;
  readonly role: string | undefined;
  readonly layer: string | undefined;
  readonly uses: readonly NeighborEntry[];
  readonly usedBy: readonly NeighborEntry[];
  readonly dependsOn: readonly NeighborEntry[];
  readonly enables: readonly NeighborEntry[];
  readonly sameContext: readonly NeighborEntry[];
  readonly implements: readonly string[];
  readonly implementedBy: readonly string[];
}

// ---------------------------------------------------------------------------
// Context Comparison Types
// ---------------------------------------------------------------------------

export interface ContextSummary {
  readonly name: string;
  readonly patternCount: number;
  readonly patterns: readonly string[];
  readonly allDependencies: readonly string[];
}

export interface IntegrationPoint {
  readonly from: string;
  readonly fromContext: string;
  readonly to: string;
  readonly toContext: string;
  readonly relationship: string;
}

export interface ContextComparison {
  readonly context1: ContextSummary;
  readonly context2: ContextSummary;
  readonly sharedDependencies: readonly string[];
  readonly uniqueToContext1: readonly string[];
  readonly uniqueToContext2: readonly string[];
  readonly integrationPoints: readonly IntegrationPoint[];
}

// ---------------------------------------------------------------------------
// Tag Usage Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Source Inventory Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// computeNeighborhood
// ---------------------------------------------------------------------------

export function computeNeighborhood(
  name: string,
  dataset: MasterDataset
): NeighborhoodResult | undefined {
  const pattern = findPatternByName(dataset.patterns, name);
  if (pattern === undefined) return undefined;

  const patternName = getPatternName(pattern);
  const rels = getRelationships(dataset, patternName);

  // Resolve relationship fields to NeighborEntry
  const uses = (rels?.uses ?? []).map((n) => resolveNeighborEntry(dataset.patterns, n));
  const usedBy = (rels?.usedBy ?? []).map((n) => resolveNeighborEntry(dataset.patterns, n));
  const dependsOn = (rels?.dependsOn ?? []).map((n) => resolveNeighborEntry(dataset.patterns, n));
  const enables = (rels?.enables ?? []).map((n) => resolveNeighborEntry(dataset.patterns, n));

  // Same-context siblings
  const ctx = pattern.archContext;
  const sameContext: NeighborEntry[] = [];
  if (ctx !== undefined && dataset.archIndex !== undefined) {
    const contextPatterns = dataset.archIndex.byContext[ctx];
    if (contextPatterns !== undefined) {
      for (const p of contextPatterns) {
        if (getPatternName(p) !== patternName) {
          sameContext.push(resolveNeighborEntry(dataset.patterns, getPatternName(p)));
        }
      }
    }
  }

  return {
    pattern: patternName,
    context: pattern.archContext,
    role: pattern.archRole,
    layer: pattern.archLayer,
    uses,
    usedBy,
    dependsOn,
    enables,
    sameContext,
    implements: rels?.implementsPatterns ?? [],
    implementedBy: (rels?.implementedBy ?? []).map((r) => r.name),
  };
}

// ---------------------------------------------------------------------------
// compareContexts
// ---------------------------------------------------------------------------

function aggregateContextDeps(
  contextPatterns: readonly ExtractedPattern[],
  relationshipIndex: Record<string, RelationshipEntry> | undefined
): Set<string> {
  const deps = new Set<string>();
  for (const p of contextPatterns) {
    const name = getPatternName(p);
    const rels = relationshipIndex?.[name];
    if (rels !== undefined) {
      for (const u of rels.uses) deps.add(u);
      for (const d of rels.dependsOn) deps.add(d);
    }
  }
  return deps;
}

function findIntegrationPoints(
  ctx1Patterns: readonly ExtractedPattern[],
  ctx1Name: string,
  ctx2PatternNames: ReadonlySet<string>,
  ctx2Name: string,
  relationshipIndex: Record<string, RelationshipEntry> | undefined
): IntegrationPoint[] {
  const points: IntegrationPoint[] = [];
  for (const p of ctx1Patterns) {
    const name = getPatternName(p);
    const rels = relationshipIndex?.[name];
    if (rels === undefined) continue;

    for (const target of rels.uses) {
      if (ctx2PatternNames.has(target)) {
        points.push({
          from: name,
          fromContext: ctx1Name,
          to: target,
          toContext: ctx2Name,
          relationship: 'uses',
        });
      }
    }
    for (const target of rels.dependsOn) {
      if (ctx2PatternNames.has(target)) {
        points.push({
          from: name,
          fromContext: ctx1Name,
          to: target,
          toContext: ctx2Name,
          relationship: 'dependsOn',
        });
      }
    }
  }
  return points;
}

export function compareContexts(
  ctx1: string,
  ctx2: string,
  dataset: MasterDataset
): ContextComparison | undefined {
  const archIndex: ArchIndex | undefined = dataset.archIndex;
  if (archIndex === undefined) return undefined;

  const ctx1Patterns = archIndex.byContext[ctx1];
  const ctx2Patterns = archIndex.byContext[ctx2];
  if (ctx1Patterns === undefined || ctx2Patterns === undefined) return undefined;

  const ctx1Names = ctx1Patterns.map(getPatternName);
  const ctx2Names = ctx2Patterns.map(getPatternName);
  const ctx2NameSet = new Set(ctx2Names);
  const ctx1NameSet = new Set(ctx1Names);

  const deps1 = aggregateContextDeps(ctx1Patterns, dataset.relationshipIndex);
  const deps2 = aggregateContextDeps(ctx2Patterns, dataset.relationshipIndex);

  const shared: string[] = [];
  const uniqueTo1: string[] = [];
  for (const d of deps1) {
    if (deps2.has(d)) {
      shared.push(d);
    } else {
      uniqueTo1.push(d);
    }
  }
  const uniqueTo2: string[] = [];
  for (const d of deps2) {
    if (!deps1.has(d)) {
      uniqueTo2.push(d);
    }
  }

  // Integration points: relationships crossing the context boundary
  const integrationPoints = [
    ...findIntegrationPoints(ctx1Patterns, ctx1, ctx2NameSet, ctx2, dataset.relationshipIndex),
    ...findIntegrationPoints(ctx2Patterns, ctx2, ctx1NameSet, ctx1, dataset.relationshipIndex),
  ];

  return {
    context1: {
      name: ctx1,
      patternCount: ctx1Patterns.length,
      patterns: ctx1Names,
      allDependencies: [...deps1],
    },
    context2: {
      name: ctx2,
      patternCount: ctx2Patterns.length,
      patterns: ctx2Names,
      allDependencies: [...deps2],
    },
    sharedDependencies: shared,
    uniqueToContext1: uniqueTo1,
    uniqueToContext2: uniqueTo2,
    integrationPoints,
  };
}

// ---------------------------------------------------------------------------
// aggregateTagUsage
// ---------------------------------------------------------------------------

export function aggregateTagUsage(dataset: MasterDataset): TagUsageReport {
  const tagMap = new Map<string, Map<string, number>>();

  function increment(tag: string, value: string): void {
    let values = tagMap.get(tag);
    if (values === undefined) {
      values = new Map<string, number>();
      tagMap.set(tag, values);
    }
    values.set(value, (values.get(value) ?? 0) + 1);
  }

  for (const p of dataset.patterns) {
    // Always-present fields
    if (p.status !== undefined) increment('status', p.status);
    increment('category', String(p.category));

    // Optional enum fields
    if (p.archRole !== undefined) increment('arch-role', p.archRole);
    if (p.archContext !== undefined) increment('arch-context', p.archContext);
    if (p.archLayer !== undefined) increment('arch-layer', p.archLayer);

    // Optional value fields
    if (p.phase !== undefined) increment('phase', String(p.phase));
    if (p.priority !== undefined) increment('priority', p.priority);
    if (p.quarter !== undefined) increment('quarter', p.quarter);
    if (p.team !== undefined) increment('team', p.team);
    if (p.effort !== undefined) increment('effort', p.effort);
  }

  // Convert to sorted entries
  const tags: TagUsageEntry[] = [];
  for (const [tag, values] of tagMap) {
    const totalCount = [...values.values()].reduce((a, b) => a + b, 0);
    const valueCounts: TagValueCount[] = [...values.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
    tags.push({ tag, count: totalCount, values: valueCounts });
  }
  tags.sort((a, b) => b.count - a.count);

  return { tags, patternCount: dataset.patterns.length };
}

// ---------------------------------------------------------------------------
// buildSourceInventory
// ---------------------------------------------------------------------------

function categorizeFile(filePath: string, pattern: ExtractedPattern): string {
  if (filePath.includes('/stubs/')) return 'Stubs';
  if (filePath.includes('/decisions/') || pattern.adr !== undefined) return 'Decisions';
  if (filePath.endsWith('.feature')) return 'Gherkin (features)';
  if (filePath.endsWith('.ts')) return 'TypeScript (annotated)';
  return 'Other';
}

function deriveLocationPattern(files: readonly string[]): string {
  if (files.length === 0) return '';
  // Find common prefix directory
  const parts = files[0]?.split('/') ?? [];
  let commonDepth = 0;
  for (let i = 0; i < parts.length - 1; i++) {
    if (files.some((f) => f.split('/')[i] !== parts[i])) break;
    commonDepth = i + 1;
  }
  const prefix = parts.slice(0, commonDepth).join('/');
  const ext = files[0]?.split('.').pop() ?? '*';
  return prefix !== '' ? `${prefix}/**/*.${ext}` : `**/*.${ext}`;
}

export function buildSourceInventory(dataset: MasterDataset): SourceInventory {
  const groupSets = new Map<string, Set<string>>();

  for (const p of dataset.patterns) {
    const filePath = p.source.file;
    const type = categorizeFile(filePath, p);
    let fileSet = groupSets.get(type);
    if (fileSet === undefined) {
      fileSet = new Set<string>();
      groupSets.set(type, fileSet);
    }
    fileSet.add(filePath);
  }

  const types: SourceTypeEntry[] = [];
  for (const [type, fileSet] of groupSets) {
    const files = [...fileSet];
    types.push({
      type,
      count: files.length,
      locationPattern: deriveLocationPattern(files),
      files,
    });
  }
  types.sort((a, b) => b.count - a.count);

  const totalFiles = types.reduce((sum, t) => sum + t.count, 0);
  return { types, totalFiles };
}
