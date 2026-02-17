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
/** Human-readable relationship labels for edge annotations (DD-4) */
export declare const EDGE_LABELS: {
    readonly uses: "uses";
    readonly dependsOn: "depends on";
    readonly implementsPatterns: "implements";
    readonly extendsPattern: "extends";
};
/** Arrow syntax for sequence diagram messages (DD-2) */
export declare const SEQUENCE_ARROWS: {
    readonly uses: "->>";
    readonly dependsOn: "-->>";
    readonly implementsPatterns: "--)";
    readonly extendsPattern: "-->>";
};
/**
 * Mermaid flowchart node shape brackets per archRole (DD-1).
 * Maps archRole to [openBracket, closeBracket] pairs.
 * Uses `satisfies` to ensure every canonical archRole has a mapping.
 */
export declare const NODE_SHAPES: {
    readonly 'bounded-context': readonly ["[[\"", "\"]]"];
    readonly 'command-handler': readonly ["([\"", "\"])"];
    readonly projection: readonly ["[(\"", "\")]"];
    readonly saga: readonly ["{{\"", "\"}}"];
    readonly 'process-manager': readonly ["{{\"", "\"}}"];
    readonly infrastructure: readonly ["[/\"", "\"/]"];
    readonly repository: readonly ["[(\"", "\")]"];
    readonly decider: readonly ["(\"", "\")"];
    readonly 'read-model': readonly ["[/\"", "\"/]"];
    readonly service: readonly ["(\"", "\")"];
};
/** Format a Mermaid flowchart node declaration with shape based on archRole */
export declare function formatNodeDeclaration(nodeId: string, label: string, archRole?: string): string;
//# sourceMappingURL=diagram-utils.d.ts.map