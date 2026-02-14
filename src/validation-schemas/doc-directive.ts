/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern DocDirectiveSchema
 * @libar-docs-status completed
 * @libar-docs-implements MvpWorkflowImplementation
 * @libar-docs-used-by DocExtractor, ExtractedPatternSchema
 *
 * ## DocDirectiveSchema - Parsed JSDoc Directive Validation
 *
 * Zod schemas for validating parsed @libar-docs-* directives from JSDoc comments.
 * Enforces tag format, position validity, and metadata extraction.
 *
 * ### When to Use
 *
 * - Use when parsing JSDoc comments for @libar-docs-* tags
 * - Use when validating directive structure at boundaries
 */

import { z } from 'zod';
import {
  ACCEPTED_STATUS_VALUES,
  PROCESS_STATUS_VALUES,
  type AcceptedStatusValue,
} from '../taxonomy/index.js';
import { asDirectiveTag } from '../types/branded.js';
import type { TagRegistry } from './tag-registry.js';

/**
 * Position information for a directive in source code
 */
export const PositionSchema = z
  .object({
    /** Starting line number (1-indexed) */
    startLine: z.number().int().positive('Line numbers must be positive'),

    /** Ending line number (1-indexed) */
    endLine: z.number().int().positive('Line numbers must be positive'),
  })
  .strict()
  .refine((pos) => pos.endLine >= pos.startLine, {
    message: 'End line must be >= start line',
  });

export type Position = z.infer<typeof PositionSchema>;

/**
 * Creates a DirectiveTag schema for a given tag prefix.
 * This factory enables projects to use custom prefixes (e.g., "@docs-" instead of "@libar-docs-").
 *
 * @param tagPrefix - The tag prefix to validate against (e.g., "@docs-" or "@libar-docs-")
 * @returns Zod schema that validates and transforms tags with the given prefix
 *
 * @example
 * ```typescript
 * // Custom prefix
 * const customSchema = createDirectiveTagSchema("@docs-");
 * customSchema.parse("@docs-pattern"); // Valid
 *
 * // Default prefix
 * const defaultSchema = createDirectiveTagSchema("@libar-docs-");
 * defaultSchema.parse("@libar-docs-status"); // Valid
 * ```
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createDirectiveTagSchema(tagPrefix: string) {
  return z
    .string()
    .min(1, 'Tag cannot be empty')
    .refine((tag) => tag.startsWith(tagPrefix), {
      message: `Tags must start with ${tagPrefix}`,
    })
    .transform((tag) => asDirectiveTag(tag));
}

/**
 * Directive tag validation (default prefix)
 * Must start with @libar-docs-
 *
 * For custom prefixes, use createDirectiveTagSchema().
 */
const DirectiveTagSchema = createDirectiveTagSchema('@libar-docs-');

/**
 * Default status values for pattern implementation state
 *
 * Uses the single source of truth from taxonomy module (PDR-005 FSM).
 * For registry-based status validation, use createPatternStatusSchema().
 *
 * @see src/taxonomy/status-values.ts
 */
export const DefaultPatternStatusSchema = z.enum(PROCESS_STATUS_VALUES);

/**
 * Extended status values accepted for directive validation
 *
 * Accepts FSM states + legacy values (implemented, partial, in-progress).
 * Legacy values are normalized to FSM states via normalizeStatus().
 *
 * @see src/taxonomy/status-values.ts
 * @see src/taxonomy/normalized-status.ts
 */
export const AcceptedPatternStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);

/**
 * Pattern status schema for directive validation
 *
 * Uses AcceptedPatternStatusSchema to allow legacy values.
 * Legacy values are normalized to display values via normalizeStatus().
 */
export const PatternStatusSchema = AcceptedPatternStatusSchema;
export type PatternStatus = AcceptedStatusValue;

/**
 * Create pattern status schema from tag registry
 *
 * Builds a Zod enum schema using status values defined in the registry's
 * metadata tags. Falls back to default schema if "status" tag not found in registry.
 *
 * @param registry - Tag registry containing metadata tag definitions
 * @returns Zod enum schema for pattern status validation
 *
 * @example
 * ```typescript
 * const config = await loadConfig();
 * const statusSchema = createPatternStatusSchema(config.tagRegistry);
 * const result = statusSchema.safeParse("completed"); // Validates against registry values
 * ```
 */
export function createPatternStatusSchema(registry: TagRegistry): z.ZodType<string> {
  const statusTag = registry.metadataTags.find((t) => t.tag === 'status');

  if (statusTag?.values && statusTag.values.length > 0) {
    // Zod enum requires at least one value, and the type is [string, ...string[]]
    const [first, ...rest] = statusTag.values;
    if (first) {
      return z.enum([first, ...rest]);
    }
  }

  // Fallback to default if not found or invalid
  return DefaultPatternStatusSchema;
}

/**
 * Parsed @libar-docs-* directive from JSDoc comment
 *
 * Schema enforces:
 * - At least one tag
 * - Valid position with endLine >= startLine
 * - Strict mode to prevent extra fields
 *
 * Description defaults to empty string to allow tag-only directives:
 * ```typescript
 * /**
 *  * @libar-docs-core
 *  *\/
 * export function myFunction() {}
 * ```
 */
export const DocDirectiveSchema = z
  .object({
    /** Tags found in comment (e.g., ['@libar-docs-core', '@libar-docs-types']). Empty allowed for Gherkin-sourced patterns. */
    tags: z.array(DirectiveTagSchema).readonly(),

    /** Full description text from JSDoc (defaults to empty for tag-only directives) */
    description: z.string().default(''),

    /** Examples found in JSDoc @example tags */
    examples: z.array(z.string()).readonly().default([]),

    /** Position in source file */
    position: PositionSchema,

    /** Explicit pattern name from @libar-docs-pattern tag */
    patternName: z.string().optional(),

    /** Implementation status from @libar-docs-status tag */
    status: PatternStatusSchema.optional(),

    /** Whether this is a core/essential pattern from @libar-docs-core tag */
    isCore: z.boolean().optional(),

    /** Use cases this pattern applies to from @libar-docs-usecase tags */
    useCases: z.array(z.string()).readonly().optional(),

    /** "When to use" bullet points extracted from description (### When to Use or **When to use:**) */
    whenToUse: z.array(z.string()).readonly().optional(),

    /** Patterns this pattern uses (from @libar-docs-uses tag) */
    uses: z.array(z.string()).readonly().optional(),

    /** Patterns that use this pattern (from @libar-docs-used-by tag) */
    usedBy: z.array(z.string()).readonly().optional(),

    /** Roadmap phase number (from @libar-docs-phase tag) */
    phase: z.number().int().positive().optional(),

    /** Path to pattern brief markdown file (from @libar-docs-brief tag) */
    brief: z.string().optional(),

    /** Patterns this pattern depends on for roadmap planning (from @libar-docs-depends-on tag) */
    dependsOn: z.array(z.string()).readonly().optional(),

    /** Patterns this pattern enables/unlocks (from @libar-docs-enables tag) */
    enables: z.array(z.string()).readonly().optional(),

    /** Patterns this code realizes (from @libar-docs-implements tag) */
    implements: z.array(z.string()).readonly().optional(),

    /** Base pattern this extends (from @libar-docs-extends tag) */
    extends: z.string().optional(),

    /** Related patterns for cross-reference without dependency (from @libar-docs-see-also tag) */
    seeAlso: z.array(z.string()).readonly().optional(),

    /** File paths to implementation APIs (from @libar-docs-api-ref tag) */
    apiRef: z.array(z.string()).readonly().optional(),

    /** Delivery quarter for timeline workflow (from @libar-docs-quarter tag) */
    quarter: z.string().optional(),

    /** Completion date for timeline workflow (from @libar-docs-completed tag) */
    completed: z.string().optional(),

    /** Effort estimate for timeline workflow (from @libar-docs-effort tag) */
    effort: z.string().optional(),

    /** Responsible team for process workflow (from @libar-docs-team tag) */
    team: z.string().optional(),

    /** Workflow/discipline for process workflow (from @libar-docs-workflow tag) */
    workflow: z.string().optional(),

    /** Risk level for process workflow (from @libar-docs-risk tag) */
    risk: z.string().optional(),

    /** Priority level for process workflow (from @libar-docs-priority tag) */
    priority: z.string().optional(),

    // Design session stub metadata (from @libar-docs-target, @libar-docs-since tags)

    /** Target implementation path for stub files (from @libar-docs-target tag) */
    target: z.string().optional(),

    /** Design session that created this pattern (from @libar-docs-since tag) */
    since: z.string().optional(),

    // Architecture diagram generation fields (from @libar-docs-arch-* tags)

    /** Architectural role for diagram generation (from @libar-docs-arch-role tag) */
    archRole: z.string().optional(),

    /** Bounded context this component belongs to (from @libar-docs-arch-context tag) */
    archContext: z.string().optional(),

    /** Architectural layer (from @libar-docs-arch-layer tag) */
    archLayer: z.string().optional(),

    /** Named architectural views for scoped diagram generation (from @libar-docs-arch-view CSV tag) */
    archView: z.array(z.string().min(1)).readonly().optional(),

    // Shape extraction fields

    /** Shape names to extract from this file (from @libar-docs-extract-shapes tag) */
    extractShapes: z.array(z.string()).readonly().optional(),

    /** Convention domains for reference document generation (from @libar-docs-convention CSV tag) */
    convention: z.array(z.string()).readonly().optional(),
  })
  .strict();

/**
 * Type alias inferred from schema
 *
 * **Schema-First Law**: Always infer types from schemas,
 * never define types separately to avoid duplication.
 */
export type DocDirective = z.infer<typeof DocDirectiveSchema>;

/**
 * Runtime type guard for DocDirective
 *
 * @param value - Value to check
 * @returns True if value conforms to DocDirective schema
 *
 * @example
 * ```typescript
 * if (isDocDirective(parsed)) {
 *   console.log(parsed.tags); // Type-safe access
 * }
 * ```
 */
export function isDocDirective(value: unknown): value is DocDirective {
  return DocDirectiveSchema.safeParse(value).success;
}
