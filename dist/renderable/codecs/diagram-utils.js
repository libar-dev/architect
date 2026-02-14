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
//# sourceMappingURL=diagram-utils.js.map