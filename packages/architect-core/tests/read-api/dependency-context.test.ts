import { describe, expect, it } from 'vitest';

import { transformToPatternGraph } from '../../src/generators/pipeline/transform-dataset.js';
import type { RawDataset } from '../../src/generators/pipeline/transform-types.js';
import {
  getDependencyContext,
  type DependencyContextNode,
} from '../../src/read-api/dependency-context.js';
import { ExtractedPatternSchema } from '../../src/validation-schemas/extracted-pattern.js';
import type { ExtractedPattern } from '../../src/validation-schemas/extracted-pattern.js';
import { createDefaultTagRegistry } from '../../src/validation-schemas/tag-registry.js';

interface PatternSpec {
  readonly name: string;
  readonly uses?: readonly string[];
  readonly seeAlso?: readonly string[];
}

function hashPatternId(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `pattern-${hash.toString(16).padStart(8, '0').slice(0, 8)}`;
}

function makePattern(spec: PatternSpec): ExtractedPattern {
  return ExtractedPatternSchema.parse({
    id: hashPatternId(spec.name),
    name: spec.name,
    patternName: spec.name,
    directive: {
      tags: [`@architect-pattern:${spec.name}`],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 1 },
      patternName: spec.name,
    },
    code: '',
    source: {
      file: `packages/architect-core/src/${spec.name.toLowerCase()}.ts`,
      lines: [1, 1],
    },
    exports: [],
    extractedAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    ...(spec.uses !== undefined ? { uses: [...spec.uses] } : {}),
    ...(spec.seeAlso !== undefined ? { seeAlso: [...spec.seeAlso] } : {}),
  });
}

function buildGraph(specs: readonly PatternSpec[]) {
  const raw: RawDataset = {
    patterns: specs.map(makePattern),
    tagRegistry: createDefaultTagRegistry(),
  };
  return transformToPatternGraph(raw);
}

function flattenNames(nodes: readonly DependencyContextNode[]): string[] {
  const names: string[] = [];
  for (const node of nodes) {
    names.push(node.name);
    names.push(...flattenNames(node.children));
  }
  return names;
}

describe('getDependencyContext kernel', () => {
  it('returns the exact chain and ignores see-also grafts', () => {
    // Given
    const graph = buildGraph([
      {
        name: 'ADR009ProjectionTrustBoundary',
        uses: ['MiddleService'],
        seeAlso: ['ADR006SingleReadModelArchitecture', 'McpOutputSchemaValidation'],
      },
      { name: 'MiddleService', uses: ['RootLib'] },
      { name: 'RootLib' },
      { name: 'LeafConsumer', uses: ['MiddleService'] },
      {
        name: 'ADR006SingleReadModelArchitecture',
        seeAlso: ['ADR005CodecBasedMarkdownRendering'],
      },
      { name: 'ADR005CodecBasedMarkdownRendering' },
      { name: 'McpOutputSchemaValidation' },
    ]);

    // When
    const context = getDependencyContext(graph, 'ADR009ProjectionTrustBoundary', { maxDepth: 10 });

    // Then
    expect(context).toBeDefined();
    expect(context?.focal).toBe('ADR009ProjectionTrustBoundary');
    expect(context?.upstream).toHaveLength(1);
    expect(context?.upstream[0]?.name).toBe('MiddleService');
    expect(context?.upstream[0]?.children).toHaveLength(1);
    expect(context?.upstream[0]?.children[0]?.name).toBe('RootLib');
    expect(context?.summary.upstreamDirect).toBe(1);
    expect(context?.summary.upstreamTransitive).toBe(2);
    expect(flattenNames(context?.upstream ?? [])).not.toContain(
      'ADR006SingleReadModelArchitecture',
    );
    expect(flattenNames(context?.upstream ?? [])).not.toContain('McpOutputSchemaValidation');
  });

  it('derives downstream traversal from reverse edges', () => {
    // Given
    const graph = buildGraph([
      { name: 'LeafConsumer', uses: ['MiddleService'] },
      { name: 'MiddleService', uses: ['RootLib'] },
      { name: 'RootLib' },
    ]);

    // When
    const context = getDependencyContext(graph, 'RootLib');

    // Then
    expect(context?.downstream[0]?.name).toBe('MiddleService');
    expect(context?.downstream[0]?.children[0]?.name).toBe('LeafConsumer');
    expect(context?.summary.downstreamDirect).toBe(1);
    expect(context?.summary.downstreamTransitive).toBe(2);
  });

  it('marks the depth boundary truncated when further edges remain', () => {
    // Given
    const graph = buildGraph([
      { name: 'LeafConsumer', uses: ['MiddleService'] },
      { name: 'MiddleService', uses: ['RootLib'] },
      { name: 'RootLib' },
    ]);

    // When
    const context = getDependencyContext(graph, 'LeafConsumer', { maxDepth: 1 });

    // Then
    expect(context?.upstream).toEqual([
      {
        name: 'MiddleService',
        status: 'active',
        truncated: true,
        children: [],
      },
    ]);
    expect(context?.options.maxDepth).toBe(1);
  });

  it('does not duplicate the focal node when a cycle closes', () => {
    // Given
    const graph = buildGraph([
      { name: 'CycleRoot', uses: ['CycleChild'] },
      { name: 'CycleChild', uses: ['CycleRoot'] },
    ]);

    // When
    const context = getDependencyContext(graph, 'CycleRoot', { maxDepth: 5 });

    // Then
    expect(flattenNames(context?.upstream ?? [])).toEqual(['CycleChild']);
    expect(flattenNames(context?.downstream ?? [])).toEqual(['CycleChild']);
  });

  it('returns empty forests for an isolated pattern', () => {
    // Given
    const graph = buildGraph([{ name: 'SoloPattern' }]);

    // When
    const context = getDependencyContext(graph, 'SoloPattern', { maxDepth: 3 });

    // Then
    expect(context).toEqual({
      focal: 'SoloPattern',
      upstream: [],
      downstream: [],
      summary: {
        upstreamDirect: 0,
        upstreamTransitive: 0,
        downstreamDirect: 0,
        downstreamTransitive: 0,
      },
      options: { maxDepth: 3 },
    });
  });

  it('returns undefined for an unknown pattern', () => {
    // Given
    const graph = buildGraph([{ name: 'KnownPattern' }]);

    // When
    const context = getDependencyContext(graph, 'Ghost');

    // Then
    expect(context).toBeUndefined();
  });
});
