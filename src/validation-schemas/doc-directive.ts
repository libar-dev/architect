/**
 * @architect
 * @architect-validation
 * @architect-pattern DocDirectiveSchema
 * @architect-status completed
 * @architect-implements MvpWorkflowImplementation
 * @architect-used-by DocExtractor, ExtractedPatternSchema
 *
 * ## DocDirectiveSchema - Parsed JSDoc Directive Validation
 *
 * Zod schemas for validating parsed @architect-* directives from JSDoc comments.
 * Enforces tag format, position validity, and metadata extraction.
 *
 * ### When to Use
 *
 * - Use when parsing JSDoc comments for @architect-* tags
 * - Use when validating directive structure at boundaries
 */

import { z } from 'zod';
import {
  ACCEPTED_STATUS_VALUES,
  PROCESS_STATUS_VALUES,
  type ProcessStatusValue,
} from '../taxonomy/index.js';
import { asDirectiveTag } from '../types/branded.js';
import type { TagRegistry } from './tag-registry.js';
import { CLAUDE_SECTION_VALUES } from '../taxonomy/claude-section-values.js';

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
 * This factory enables projects to use custom prefixes (e.g., "@acme-" instead of "@architect-").
 *
 * @param tagPrefix - The tag prefix to validate against (e.g., "@acme-" or "@architect-")
 * @returns Zod schema that validates and transforms tags with the given prefix
 *
 * @example
 * ```typescript
 * // Custom prefix
 * const customSchema = createDirectiveTagSchema("@acme-");
 * customSchema.parse("@acme-pattern"); // Valid
 *
 * // Default prefix
 * const defaultSchema = createDirectiveTagSchema("@architect-");
 * defaultSchema.parse("@architect-status"); // Valid
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
 * Must start with @architect-
 *
 * For custom prefixes, use createDirectiveTagSchema().
 */
const DirectiveTagSchema = createDirectiveTagSchema('@architect-');

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
 * Status values accepted for directive validation
 *
 * @see src/taxonomy/status-values.ts
 */
export const AcceptedPatternStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);

/**
 * Pattern status schema for directive validation
 *
 * Accepts canonical PDR-005 FSM states only.
 */
export const PatternStatusSchema = z.enum(PROCESS_STATUS_VALUES);
export type PatternStatus = ProcessStatusValue;

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
 * Parsed @architect-* directive from JSDoc comment
 *
 * Schema enforces:
 * - At least one tag
 * - Valid position with endLine >= startLine
 * - Strict mode to prevent extra fields
 *
 * Description defaults to empty string to allow tag-only directives:
 * ```typescript
 * /**
 *  * @architect-core
 *  *\/
 * export function myFunction() {}
 * ```
 */
export const DocDirectiveSchema = z
  .object({
    /** Tags found in comment (e.g., ['@architect-core', '@architect-types']). Empty allowed for Gherkin-sourced patterns. */
    tags: z.array(DirectiveTagSchema).readonly(),

    /** Full description text from JSDoc (defaults to empty for tag-only directives) */
    description: z.string().default(''),

    /** Examples found in JSDoc @example tags */
    examples: z.array(z.string()).readonly().default([]),

    /** Position in source file */
    position: PositionSchema,

    /** Explicit pattern name from @architect-pattern tag */
    patternName: z.string().optional(),

    /** Implementation status from @architect-status tag */
    status: PatternStatusSchema.optional(),

    /** Use cases this pattern applies to from @architect-usecase tags */
    useCases: z.array(z.string()).readonly().optional(),

    /** "When to use" bullet points extracted from description (### When to Use or **When to use:**) */
    whenToUse: z.array(z.string()).readonly().optional(),

    /** Patterns this pattern uses (from @architect-uses tag) */
    uses: z.array(z.string()).readonly().optional(),

    /** Patterns that use this pattern (from @architect-used-by tag) */
    usedBy: z.array(z.string()).readonly().optional(),

    /** Roadmap phase number (from @architect-phase tag) */
    phase: z.number().int().positive().optional(),

    /** Patterns this pattern depends on for roadmap planning (from @architect-depends-on tag) */
    dependsOn: z.array(z.string()).readonly().optional(),

    /** Patterns this pattern enables/unlocks (from @architect-enables tag) */
    enables: z.array(z.string()).readonly().optional(),

    /** Patterns this code realizes (from @architect-implements tag) */
    implements: z.array(z.string()).readonly().optional(),

    /** Base pattern this extends (from @architect-extends tag) */
    extends: z.string().optional(),

    /** Related patterns for cross-reference without dependency (from @architect-see-also tag) */
    seeAlso: z.array(z.string()).readonly().optional(),

    /** File paths to implementation APIs (from @architect-api-ref tag) */
    apiRef: z.array(z.string()).readonly().optional(),

    /** Delivery quarter for timeline workflow (from @architect-quarter tag) */
    quarter: z.string().optional(),

    /** Completion date for timeline workflow (from @architect-completed tag) */
    completed: z.string().optional(),

    /** Effort estimate for timeline workflow (from @architect-effort tag) */
    effort: z.string().optional(),

    /** Actual effort logged after implementation (from @architect-effort-actual tag) */
    effortActual: z.string().optional(),

    /** Responsible team for process workflow (from @architect-team tag) */
    team: z.string().optional(),

    /** Workflow/discipline for process workflow (from @architect-workflow tag) */
    workflow: z.string().optional(),

    /** Risk level for process workflow (from @architect-risk tag) */
    risk: z.string().optional(),

    /** Priority level for process workflow (from @architect-priority tag) */
    priority: z.string().optional(),

    // Design session stub metadata (from @architect-target, @architect-since tags)

    /** Target implementation path for stub files (from @architect-target tag) */
    target: z.string().optional(),

    /** Design session that created this pattern (from @architect-since tag) */
    since: z.string().optional(),

    // Architecture diagram generation fields (from @architect-arch-* tags)

    /** Architectural role for diagram generation (from @architect-arch-role tag) */
    archRole: z.string().optional(),

    /** Bounded context this component belongs to (from @architect-arch-context tag) */
    archContext: z.string().optional(),

    /** Architectural layer (from @architect-arch-layer tag) */
    archLayer: z.string().optional(),

    /** Cross-cutting document inclusion for content routing and diagram scoping (from @architect-include CSV tag) */
    include: z.array(z.string().min(1)).readonly().optional(),

    /** Product area for PRD grouping (from @architect-product-area tag) */
    productArea: z.string().optional(),

    // Shape extraction fields

    /** Shape names to extract from this file (from @architect-extract-shapes tag) */
    extractShapes: z.array(z.string()).readonly().optional(),

    /** Convention domains for reference document generation (from @architect-convention CSV tag) */
    convention: z.array(z.string()).readonly().optional(),

    // Claude module generation fields (from @architect-claude-* tags)

    /** Module identifier for CLAUDE.md generation (from @architect-claude-module tag) */
    claudeModule: z.string().optional(),

    /** Target section directory in _claude-md/ (from @architect-claude-section tag) */
    claudeSection: z.enum(CLAUDE_SECTION_VALUES).optional(),

    /** Variation filtering tags for modular-claude-md (from @architect-claude-tags CSV tag) */
    claudeTags: z.array(z.string()).readonly().optional(),
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
