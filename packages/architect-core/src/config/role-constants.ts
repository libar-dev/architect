import type { RoleDefinition } from '../validation-schemas/tag-registry.js';

export type { RoleDefinition } from '../validation-schemas/tag-registry.js';

export const BUILTIN_ROLES = [
  {
    tag: 'projection',
    domain: 'Projection',
    priority: 1,
    description: 'Projection builders and derived read views',
    diagramShape: 'rectangle',
  },
  {
    tag: 'service',
    domain: 'Service',
    priority: 2,
    description: 'Application and domain services',
  },
  {
    tag: 'decider',
    domain: 'Decider',
    priority: 3,
    description: 'Rule and state deciders enforcing process integrity',
    diagramShape: 'hexagon',
  },
  {
    tag: 'read-model',
    domain: 'Read Model',
    priority: 4,
    description: 'Query-oriented read views over trusted graph data',
  },
  {
    tag: 'codec',
    domain: 'Codec',
    priority: 5,
    description: 'Serialization, parsing, and rendering codec surfaces',
    diagramShape: 'rectangle',
  },
  {
    tag: 'contract',
    domain: 'Contract',
    priority: 6,
    description: 'Published schemas and other contract-bearing surfaces',
  },
  {
    tag: 'barrel',
    domain: 'Barrel',
    priority: 7,
    description: 'Re-export surfaces and curated entrypoints',
  },
  {
    tag: 'utility',
    domain: 'Utility',
    priority: 8,
    description: 'Shared helpers and narrowly focused utilities',
  },
] as const satisfies readonly RoleDefinition[];
