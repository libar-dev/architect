import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createArchitect } from './factory.js';
import type { RoleDefinition } from './role-constants.js';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');

/**
 * Canonical role list for the architect package family self-hosting.
 *
 * Mirrors ADR-001 Rule 10 in `packages/architect/architect/decisions/`. Edit
 * the ADR table and this constant together. The ADR is the decision record;
 * this constant is its TypeScript projection.
 */
export const ARCHITECT_PACKAGE_ROLES = [
  {
    tag: 'projection',
    domain: 'Projection',
    priority: 1,
    description: 'Fragment projection functions deriving outputs from PatternGraph',
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
    description: 'FSM and rule deciders enforcing process integrity',
    diagramShape: 'hexagon',
  },
  {
    tag: 'read-model',
    domain: 'Read Model',
    priority: 4,
    description: 'Query-oriented read views over the graph',
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
    description: 'Published schemas and contract-bearing surfaces',
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

export const PACKAGE_SELF_HOSTING_SOURCES = {
  typescript: [
    `${workspaceRoot}/packages/architect-core/src/**/*.ts`,
    `${workspaceRoot}/packages/architect-projection/src/**/*.ts`,
    `${workspaceRoot}/packages/architect-guard/src/**/*.ts`,
    `${workspaceRoot}/packages/architect-cli/src/**/*.ts`,
    `${workspaceRoot}/packages/architect-mcp/src/**/*.ts`,
  ],
  stubs: ['architect/stubs/**/*.ts'],
  features: [
    'architect/specs/**/*.feature',
    'architect/slices/**/*.feature',
    'architect/decisions/*.feature',
    'architect/releases/*.feature',
    'tests/features/**/*.feature',
    `${workspaceRoot}/packages/architect-core/tests/features/**/*.feature`,
    `${workspaceRoot}/packages/architect-projection/tests/features/**/*.feature`,
    `${workspaceRoot}/packages/architect-guard/tests/features/**/*.feature`,
    `${workspaceRoot}/packages/architect-cli/tests/features/**/*.feature`,
    `${workspaceRoot}/packages/architect-mcp/tests/features/**/*.feature`,
  ],
} as const;

export const WORKSPACE_TAG_REGISTRY = createArchitect({
  roles: ARCHITECT_PACKAGE_ROLES,
}).registry;

export function resolveWorkspaceSources(baseDir: string): { input: string[]; features: string[] } {
  const isArchitectDevWorkspace =
    baseDir.endsWith(`${path.sep}packages${path.sep}architect`) ||
    baseDir.endsWith('/packages/architect');

  if (!isArchitectDevWorkspace) {
    return { input: [], features: [] };
  }

  return {
    input: [...PACKAGE_SELF_HOSTING_SOURCES.typescript, ...PACKAGE_SELF_HOSTING_SOURCES.stubs],
    features: [...PACKAGE_SELF_HOSTING_SOURCES.features],
  };
}
