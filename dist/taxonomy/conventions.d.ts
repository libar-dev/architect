/**
 * Convention tag values for reference document generation.
 *
 * Each value maps to a convention domain that can be used to tag
 * decision records with `@libar-docs-convention:value1,value2`.
 * The 11 values correspond to the 11 convention domains extracted
 * from the former recipe .feature files.
 *
 * @see CodecDrivenReferenceGeneration spec
 */
export declare const CONVENTION_VALUES: readonly ["testing-policy", "fsm-rules", "cli-patterns", "output-format", "pattern-naming", "session-workflow", "config-presets", "annotation-system", "pipeline-architecture", "publishing", "doc-generation", "taxonomy-rules"];
export type ConventionValue = (typeof CONVENTION_VALUES)[number];
//# sourceMappingURL=conventions.d.ts.map