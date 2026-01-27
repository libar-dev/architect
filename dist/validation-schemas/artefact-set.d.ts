/**
 * @libar-docs
 * @libar-docs-validation @libar-docs-config
 * @libar-docs-pattern ArtefactSetSchema
 * @libar-docs-status completed
 * @libar-docs-uses Zod, WorkflowConfigSchema
 * @libar-docs-used-by ArtefactSetLoader, GenerateDocsCLI
 * @libar-docs-usecase "When validating artefact set configurations"
 * @libar-docs-usecase "When loading predefined generator groupings"
 *
 * ## ArtefactSetSchema - Predefined Generator Groupings
 *
 * Defines the schema for artefact sets - predefined groupings of generators
 * that match common use cases. Enables quick setup without manual generator selection.
 *
 * ### When to Use
 *
 * - Use when defining a new artefact set (full, minimal, planning, etc.)
 * - Use when validating artefact set JSON files from catalogue
 * - Use when loading artefact sets in the CLI
 *
 * ### Key Concepts
 *
 * - **Artefact Set**: Named collection of generators to run together
 * - **Generators Array**: List of generator names (must be registered)
 * - **Metadata**: Optional author, lastUpdated, and tags for organization
 */
import { z } from 'zod';
/**
 * Schema for artefact set metadata
 */
export declare const ArtefactSetMetadataSchema: z.ZodObject<{
    author: z.ZodOptional<z.ZodString>;
    lastUpdated: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
/**
 * Schema for artefact set configuration
 *
 * An artefact set defines a predefined grouping of generators for common use cases.
 * Examples: full-set (all generators), minimal-set (essential only), planning-set
 */
export declare const ArtefactSetSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    generators: z.ZodArray<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        author: z.ZodOptional<z.ZodString>;
        lastUpdated: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
/**
 * TypeScript type inferred from ArtefactSetSchema
 */
export type ArtefactSet = z.infer<typeof ArtefactSetSchema>;
/**
 * TypeScript type inferred from ArtefactSetMetadataSchema
 */
export type ArtefactSetMetadata = z.infer<typeof ArtefactSetMetadataSchema>;
/**
 * Type guard to check if value is a valid ArtefactSet
 *
 * @param value - Value to check
 * @returns True if value is a valid ArtefactSet
 */
export declare function isArtefactSet(value: unknown): value is ArtefactSet;
/**
 * Parse and validate artefact set data
 *
 * @param data - Raw data to parse
 * @returns Validated ArtefactSet
 * @throws ZodError if validation fails
 */
export declare function parseArtefactSet(data: unknown): ArtefactSet;
//# sourceMappingURL=artefact-set.d.ts.map