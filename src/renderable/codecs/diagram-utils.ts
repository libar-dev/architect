/**
 * @libar-docs
 * @libar-docs-pattern MermaidDiagramUtils
 * @libar-docs-status completed
 * @libar-docs-used-by Architecture Codec, Reference Codec
 * @libar-docs-arch-context renderer
 *
 * ## Shared Mermaid Diagram Utilities
 *
 * Sanitization and formatting helpers shared across architecture.ts and reference.ts
 * diagram builders.
 *
 * **When to Use:** When building Mermaid diagram output in a codec — use
 * `sanitizeNodeId()`, `EDGE_STYLES`, `NODE_SHAPES`, and `formatNodeDeclaration()`
 * rather than inlining diagram syntax in the codec directly.
 */

import type { ExtractedPattern } from '../../validation-schemas/extracted-pattern.js';

/** Canonical arch-role type derived from ExtractedPattern schema */
type ArchRole = NonNullable<ExtractedPattern['archRole']>;

/** Relationship type keys shared by EDGE_STYLES, EDGE_LABELS, and SEQUENCE_ARROWS */
type RelationshipType = keyof typeof EDGE_STYLES;

/**
 * Sanitize pattern name for Mermaid node ID.
 * Mermaid requires alphanumeric + underscore only.
 */
export function sanitizeNodeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

/** Arrow styles per relationship type for Mermaid diagram generation */
export const EDGE_STYLES = {
  uses: '-->',
  dependsOn: '-.->',
  implementsPatterns: '..->',
  extendsPattern: '-->>',
} as const;

/** Human-readable relationship labels for edge annotations (DD-4) */
export const EDGE_LABELS = {
  uses: 'uses',
  dependsOn: 'depends on',
  implementsPatterns: 'implements',
  extendsPattern: 'extends',
} as const satisfies Record<RelationshipType, string>;

/** Arrow syntax for sequence diagram messages (DD-2) */
export const SEQUENCE_ARROWS = {
  uses: '->>',
  dependsOn: '-->>',
  implementsPatterns: '--)',
  extendsPattern: '-->>',
} as const satisfies Record<RelationshipType, string>;

/**
 * Mermaid flowchart node shape brackets per archRole (DD-1).
 * Maps archRole to [openBracket, closeBracket] pairs.
 * Uses `satisfies` to ensure every canonical archRole has a mapping.
 */
export const NODE_SHAPES = {
  'bounded-context': ['[["', '"]]'],
  'command-handler': ['(["', '"])'],
  projection: ['[("', '")]'],
  saga: ['{{"', '"}}'],
  'process-manager': ['{{"', '"}}'],
  infrastructure: ['[/"', '"/]'],
  repository: ['[("', '")]'],
  decider: ['("', '")'],
  'read-model': ['[/"', '"/]'],
  service: ['("', '")'],
} as const satisfies Record<ArchRole, readonly [string, string]>;

/** Format a Mermaid flowchart node declaration with shape based on archRole */
export function formatNodeDeclaration(nodeId: string, label: string, archRole?: string): string {
  if (archRole !== undefined && archRole in NODE_SHAPES) {
    const shape = NODE_SHAPES[archRole as ArchRole];
    return `${nodeId}${shape[0]}${label}${shape[1]}`;
  }
  return `${nodeId}["${label}"]`;
}
