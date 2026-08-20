import {
  AuthoredCoreSchema,
  Graph,
  MechanicalCoreSchema,
  createGraph,
} from '@libar-dev/architect-core/graph';
import { describe, expect, it } from 'vitest';

import { createMechanicalFixture, createPatternGraphFixture } from './graph-fixture.js';

function requireGraphHandle(graph: Graph) {
  const node = graph.pattern('GraphHandle');
  if (node === undefined) {
    throw new TypeError('GraphHandle is missing from the test fixture');
  }
  return node;
}

describe('createGraph', () => {
  it('publishes the canonical graph, need-shaped lookup, and FSM kernel', () => {
    // Given
    const canonical = createPatternGraphFixture();
    const mechanical = createMechanicalFixture();

    // When
    const graph = createGraph(canonical, mechanical);

    // Then
    expect(graph).toBeInstanceOf(Graph);
    expect(graph.graph.counts).toEqual({
      completed: 1,
      active: 1,
      planned: 2,
      candidate: 1,
      total: 5,
    });
    expect(graph.pattern('GraphHandle')?.name).toBe('GraphHandle');
    expect(graph.fileToPattern('packages/architect-core/src/GraphHandle.ts')).toBe('GraphHandle');
    expect(graph.fsm.isValidTransition('roadmap', 'active')).toBe(true);
    expect(graph.fsm.validateTransition('roadmap', 'completed').valid).toBe(false);
    expect(graph.fsm.getValidTransitionsFrom('deferred')).toEqual(['roadmap']);
    expect(graph.fsm.getProtectionSummary('completed').level).toBe('hard');
  });

  it('derives every accepted status maturity including deferred as plan', () => {
    // Given
    const graph = createGraph(createPatternGraphFixture(), createMechanicalFixture());

    // When
    const maturities = Object.fromEntries(
      graph.patterns.map((node) => [node.status, node.maturity]),
    );

    // Then
    expect(maturities).toEqual({
      completed: 'executable',
      candidate: 'idea',
      roadmap: 'plan',
      active: 'design',
      deferred: 'plan',
    });
  });

  it('deep-freezes every reachable public graph value and rejects mutation', () => {
    // Given
    const graph = createGraph(createPatternGraphFixture(), createMechanicalFixture());
    const node = requireGraphHandle(graph);
    const canonicalNode = graph.graph.patterns.find((pattern) => pattern.name === 'GraphHandle');
    const relationship = graph.graph.relationshipIndex['GraphHandle'];
    const authoredRelationship = graph.authored.relationshipIndex['GraphHandle'];
    const implementation = relationship?.implementedBy.at(0);

    if (
      canonicalNode === undefined ||
      relationship === undefined ||
      authoredRelationship === undefined ||
      implementation === undefined
    ) {
      throw new TypeError('GraphHandle relationship fixture is incomplete');
    }

    // When / Then
    expect(Object.isFrozen(graph)).toBe(true);
    expect(Object.isFrozen(graph.graph)).toBe(true);
    expect(Object.isFrozen(graph.authored)).toBe(true);
    expect(Object.isFrozen(graph.mech)).toBe(true);
    expect(Object.isFrozen(graph.patterns)).toBe(true);
    expect(Object.isFrozen(graph.graph.patterns)).toBe(true);
    expect(Object.isFrozen(graph.authored.patterns)).toBe(true);
    expect(Object.isFrozen(graph.mech.symbols)).toBe(true);
    expect(Object.isFrozen(node)).toBe(true);
    expect(Object.isFrozen(node.uses)).toBe(true);
    expect(Object.isFrozen(relationship)).toBe(true);
    expect(Object.isFrozen(relationship.implementedBy)).toBe(true);
    expect(Object.isFrozen(authoredRelationship)).toBe(true);
    expect(Object.isFrozen(authoredRelationship.uses)).toBe(true);
    expect(Object.isFrozen(implementation)).toBe(true);
    expect(Object.isFrozen(graph.fsm.getValidTransitionsFrom('deferred'))).toBe(true);
    expect(Object.isFrozen(graph.fsm.validateTransition('roadmap', 'active'))).toBe(true);
    expect(Object.isFrozen(graph.fsm.getProtectionSummary('completed'))).toBe(true);

    expect(Reflect.set(canonicalNode, 'name', 'MutatedCanonical')).toBe(false);
    expect(Reflect.set(node, 'name', 'MutatedNode')).toBe(false);
    expect(Reflect.set(relationship.uses, '0', 'MutatedRelationship')).toBe(false);
    expect(graph.pattern('GraphHandle')?.name).toBe('GraphHandle');
    expect(graph.graph.relationshipIndex['GraphHandle']?.uses).toEqual(['DeferredWork']);
  });

  it('rejects malformed decoded inputs at the schema boundary', () => {
    // Given
    const malformedMechanical = { ...createMechanicalFixture(), fileCount: 'one' };
    const malformedAuthored = { patterns: [], relationshipIndex: { Broken: { uses: 'Target' } } };

    // When / Then
    expect(() => MechanicalCoreSchema.parse(malformedMechanical)).toThrow();
    expect(() => AuthoredCoreSchema.parse(malformedAuthored)).toThrow();
  });

  it('reconstructs fresh state after a rejected mutation', () => {
    // Given
    const first = createGraph(createPatternGraphFixture(), createMechanicalFixture());
    const firstNode = requireGraphHandle(first);

    // When
    const changed = Reflect.set(firstNode.uses, '0', 'MutatedRelationship');
    const second = createGraph(createPatternGraphFixture(), createMechanicalFixture());

    // Then
    expect(changed).toBe(false);
    expect(second.pattern('GraphHandle')?.uses).toEqual(['DeferredWork']);
  });
});
