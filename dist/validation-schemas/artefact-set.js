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
export const ArtefactSetMetadataSchema = z
    .object({
    /** Author or maintainer of the artefact set */
    author: z.string().optional(),
    /** Last updated date in ISO format */
    lastUpdated: z.string().optional(),
    /** Tags for categorization and discovery */
    tags: z.array(z.string()).optional(),
})
    .strict();
/**
 * Schema for artefact set configuration
 *
 * An artefact set defines a predefined grouping of generators for common use cases.
 * Examples: full-set (all generators), minimal-set (essential only), planning-set
 */
export const ArtefactSetSchema = z
    .object({
    /** Unique name for the artefact set (e.g., "full-set", "minimal-set") */
    name: z.string().min(1),
    /** Semantic version of the artefact set configuration */
    version: z.string().regex(/^\d+\.\d+\.\d+$/, {
        message: 'Version must be in semver format (e.g., 1.0.0)',
    }),
    /** Human-readable description of what this artefact set provides */
    description: z.string().optional(),
    /** Array of generator names to run when this set is selected */
    generators: z.array(z.string()).min(1, {
        message: 'Artefact set must include at least one generator',
    }),
    /** Optional metadata for organization and tracking */
    metadata: ArtefactSetMetadataSchema.optional(),
})
    .strict();
/**
 * Type guard to check if value is a valid ArtefactSet
 *
 * @param value - Value to check
 * @returns True if value is a valid ArtefactSet
 */
export function isArtefactSet(value) {
    return ArtefactSetSchema.safeParse(value).success;
}
/**
 * Parse and validate artefact set data
 *
 * @param data - Raw data to parse
 * @returns Validated ArtefactSet
 * @throws ZodError if validation fails
 */
export function parseArtefactSet(data) {
    return ArtefactSetSchema.parse(data);
}
//# sourceMappingURL=artefact-set.js.map