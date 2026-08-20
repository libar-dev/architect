import { describe, expectTypeOf, it } from 'vitest';

import type {
  BusinessRuleRef,
  DependencyContext,
  DependencyContextNode,
  NeighborEntry,
  PatternDependencies,
  PatternRelationships,
  ProtectionInfo,
  QueryErrorCode,
  QueryMetadataExtra,
  RoleInfo,
  StatusCounts,
  StatusDistribution,
  TransitionCheck,
} from '../../src/index.js';

describe('retained read payload exports', () => {
  it('remain available from the architect-core public barrel', () => {
    expectTypeOf<DependencyContext>().toHaveProperty('focal');
    expectTypeOf<DependencyContextNode>().toHaveProperty('children');
    expectTypeOf<StatusCounts>().toHaveProperty('total');
    expectTypeOf<StatusDistribution>().toHaveProperty('deliveryPercentages');
    expectTypeOf<PatternDependencies>().toHaveProperty('dependsOn');
    expectTypeOf<PatternRelationships>().toHaveProperty('implementedBy');
    expectTypeOf<BusinessRuleRef>().toHaveProperty('ruleName');
    expectTypeOf<TransitionCheck>().toHaveProperty('valid');
    expectTypeOf<ProtectionInfo>().toHaveProperty('level');
    expectTypeOf<NeighborEntry>().toHaveProperty('name');
    expectTypeOf<RoleInfo>().toHaveProperty('tag');
    expectTypeOf<QueryErrorCode>().toBeString();
    expectTypeOf<QueryMetadataExtra>().toBeObject();
  });
});
