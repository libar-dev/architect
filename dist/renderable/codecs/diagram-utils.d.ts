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
export declare function sanitizeNodeId(name: string): string;
/** Arrow styles per relationship type for Mermaid diagram generation */
export declare const EDGE_STYLES: {
    readonly uses: "-->";
    readonly dependsOn: "-.->";
    readonly implementsPatterns: "..->";
    readonly extendsPattern: "-->>";
};
//# sourceMappingURL=diagram-utils.d.ts.map