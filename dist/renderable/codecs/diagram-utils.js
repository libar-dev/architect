/**
 * @libar-docs
 * @libar-docs-used-by Architecture Codec, Reference Codec
 * @libar-docs-arch-context renderer
 *
 * ## Shared Mermaid Diagram Utilities
 *
 * Sanitization and formatting helpers shared across architecture.ts and reference.ts
 * diagram builders.
 */
/**
 * Sanitize pattern name for Mermaid node ID.
 * Mermaid requires alphanumeric + underscore only.
 */
export function sanitizeNodeId(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
}
/** Arrow styles per relationship type for Mermaid diagram generation */
export const EDGE_STYLES = {
    uses: '-->',
    dependsOn: '-.->',
    implementsPatterns: '..->',
    extendsPattern: '-->>',
};
/** Human-readable relationship labels for edge annotations (DD-4) */
export const EDGE_LABELS = {
    uses: 'uses',
    dependsOn: 'depends on',
    implementsPatterns: 'implements',
    extendsPattern: 'extends',
};
/** Arrow syntax for sequence diagram messages (DD-2) */
export const SEQUENCE_ARROWS = {
    uses: '->>',
    dependsOn: '-->>',
    implementsPatterns: '--)',
    extendsPattern: '-->>',
};
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
};
/** Format a Mermaid flowchart node declaration with shape based on archRole */
export function formatNodeDeclaration(nodeId, label, archRole) {
    if (archRole !== undefined && archRole in NODE_SHAPES) {
        const shape = NODE_SHAPES[archRole];
        return `${nodeId}${shape[0]}${label}${shape[1]}`;
    }
    return `${nodeId}["${label}"]`;
}
//# sourceMappingURL=diagram-utils.js.map