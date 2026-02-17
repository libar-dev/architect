/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern ExtractedPatternSchema
 * @libar-docs-status completed
 * @libar-docs-uses DocDirectiveSchema
 * @libar-docs-used-by Generators, SectionRenderers
 *
 * ## ExtractedPatternSchema - Complete Pattern Validation
 *
 * Zod schema for validating complete extracted patterns with code,
 * metadata, relationships, and source information.
 *
 * ### When to Use
 *
 * - Use when validating extracted patterns from the extractor
 * - Use when serializing/deserializing pattern data
 */

import { z } from 'zod';
import { asPatternId, asCategoryName, asSourceFilePath } from '../types/branded.js';
import { DocDirectiveSchema, PatternStatusSchema } from './doc-directive.js';
import { ExportInfoSchema } from './export-info.js';
import { ScenarioRefSchema } from './scenario-ref.js';
import { DeliverableSchema, HierarchyLevelSchema } from './dual-source.js';
import { ExtractedShapeSchema } from './extracted-shape.js';
import { slugify } from '../utils/string-utils.js';
import { ADR_STATUS_VALUES } from '../taxonomy/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Business Rule Schema (Shared Type)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Business rule extracted from Gherkin Rule: keyword
 *
 * This is the canonical definition used by:
 * - ExtractedPatternSchema.rules (this file)
 * - helpers.ts (rich content rendering)
 * - adr.ts (ADR document codec)
 *
 * Rules group scenarios under business rule statements with rich descriptions.
 * Used for PRD generation where business rules are more relevant than test scenarios.
 */
export const BusinessRuleSchema = z.object({
  /** Business rule statement */
  name: z.string(),
  /** Rule description with context, rationale, etc. */
  description: z.string(),
  /** Number of scenarios that verify this rule */
  scenarioCount: z.number().int().nonnegative(),
  /** Scenario names under this rule */
  scenarioNames: z.array(z.string()).readonly(),
});

/**
 * Business rule type inferred from schema
 *
 * **Schema-First Law**: Type automatically derives from Zod schema.
 */
export type BusinessRule = z.infer<typeof BusinessRuleSchema>;

/**
 * Pattern ID validation with format enforcement
 * Format: pattern-{8-char-hex}
 */
const PatternIdSchema = z
  .string()
  .regex(/^pattern-[a-f0-9]{8}$/, 'Pattern ID must match format: pattern-{8-char-hex}')
  .transform((id) => asPatternId(id));

/**
 * Category name validation and normalization
 * Automatically lowercases and normalizes category names
 */
const CategoryNameSchema = z
  .string()
  .min(1, 'Category name cannot be empty')
  .transform((name) => name.toLowerCase())
  .refine((name) => /^[a-z0-9-]+$/.test(name), {
    message: 'Category must contain only lowercase letters, numbers, and hyphens',
  })
  .transform((name) => asCategoryName(name));

/**
 * Source file path validation
 * Must be a TypeScript or Gherkin feature file
 */
const SourceFilePathSchema = z
  .string()
  .min(1, 'File path cannot be empty')
  .refine(
    (path) => path.endsWith('.ts') || path.endsWith('.feature') || path.endsWith('.feature.md'),
    {
      message:
        'Source file must be a TypeScript file (.ts) or Gherkin feature file (.feature or .feature.md)',
    }
  )
  .transform((path) => asSourceFilePath(path));

/**
 * Source information schema
 */
export const SourceInfoSchema = z
  .object({
    /** Relative file path */
    file: SourceFilePathSchema,

    /** Line range [startLine, endLine] */
    lines: z
      .tuple([
        z.number().int().positive('Start line must be positive'),
        z.number().int().positive('End line must be positive'),
      ])
      .refine(([start, end]) => end >= start, {
        message: 'End line must be >= start line',
      })
      .readonly(),
  })
  .strict();

export type SourceInfo = z.infer<typeof SourceInfoSchema>;

/**
 * Complete extracted pattern with code and metadata
 *
 * Schema enforces:
 * - Valid pattern ID format (pattern-{8-char-hex})
 * - Non-empty name and code
 * - Normalized category names
 * - Valid TypeScript source file
 * - ISO 8601 timestamp
 * - Strict mode to prevent extra fields
 */
export const ExtractedPatternSchema = z
  .object({
    /** Unique identifier for this pattern */
    id: PatternIdSchema,

    /** Pattern name (inferred from description or code) */
    name: z
      .string()
      .min(1, 'Pattern name cannot be empty')
      .refine((name) => slugify(name).length > 0, {
        message: 'Pattern name must produce a non-empty slug (at least one alphanumeric character)',
      }),

    /** Category inferred from tags (normalized to lowercase) */
    category: CategoryNameSchema,

    /** Parsed directive information */
    directive: DocDirectiveSchema,

    /** Extracted code snippet (empty string allowed for Gherkin-sourced patterns) */
    code: z.string(),

    /** Source file information */
    source: SourceInfoSchema,

    /** Exported symbols from this code block */
    exports: z.array(ExportInfoSchema).readonly().default([]),

    /** Timestamp of extraction (ISO 8601 format) */
    extractedAt: z.iso.datetime({ error: 'Must be valid ISO 8601 timestamp' }),

    /** Explicit pattern name from @libar-docs-pattern tag (overrides inferred name) */
    patternName: z.string().optional(),

    /** Implementation status from @libar-docs-status tag */
    status: PatternStatusSchema.optional(),

    /** Whether this is a core/essential pattern from @libar-docs-core tag */
    isCore: z.boolean().optional(),

    /** Use cases this pattern applies to from @libar-docs-usecase tags */
    useCases: z.array(z.string()).readonly().optional(),

    /** "When to use" bullet points extracted from description */
    whenToUse: z.array(z.string()).readonly().optional(),

    /** Patterns this pattern uses (from @libar-docs-uses tag) */
    uses: z.array(z.string()).readonly().optional(),

    /** Patterns that use this pattern (from @libar-docs-used-by tag) */
    usedBy: z.array(z.string()).readonly().optional(),

    /** Related Gherkin scenarios from @pattern:* tags in feature files */
    scenarios: z.array(ScenarioRefSchema).readonly().optional(),

    /** Roadmap phase number (from @libar-docs-phase tag) */
    phase: z.number().int().positive().optional(),

    /** Release version (from @libar-docs-release tag, e.g., "v0.1.0" or "vNEXT") */
    release: z.string().optional(),

    /** Path to pattern brief markdown file (from @libar-docs-brief tag) */
    brief: z.string().optional(),

    /** Patterns this pattern depends on for roadmap planning (from @libar-docs-depends-on tag) */
    dependsOn: z.array(z.string()).readonly().optional(),

    /** Patterns this pattern enables/unlocks (from @libar-docs-enables tag) */
    enables: z.array(z.string()).readonly().optional(),

    /** Patterns this code implements (realization relationship from @libar-docs-implements) */
    implementsPatterns: z.array(z.string()).readonly().optional(),

    /** Pattern this extends (generalization relationship from @libar-docs-extends) */
    extendsPattern: z.string().optional(),

    /** Target implementation path for stub files (from @libar-docs-target tag) */
    targetPath: z.string().optional(),

    /** Design session that created this pattern (from @libar-docs-since tag) */
    since: z.string().optional(),

    /** Convention domains for reference document generation (from @libar-docs-convention CSV tag) */
    convention: z.array(z.string()).readonly().optional(),

    /** Related patterns for cross-reference without dependency (from @libar-docs-see-also tag) */
    seeAlso: z.array(z.string()).readonly().optional(),

    /** File paths to implementation APIs (from @libar-docs-api-ref tag) */
    apiRef: z.array(z.string()).readonly().optional(),

    // Process metadata from Gherkin @libar-docs-* tags
    /** Quarter assignment (from @libar-docs-quarter tag, e.g., "Q1-2025") */
    quarter: z.string().optional(),

    /** Completion date (from @libar-docs-completed tag, ISO format) */
    completed: z.string().optional(),

    /** Effort estimate (from @libar-docs-effort tag, e.g., "2w", "4d") */
    effort: z.string().optional(),

    /** Team assignment (from @libar-docs-team tag) */
    team: z.string().optional(),

    /** Product area for PRD grouping (from @libar-docs-product-area tag) */
    productArea: z.string().optional(),

    /** Target user persona (from @libar-docs-user-role tag) */
    userRole: z.string().optional(),

    /** Business value statement (from @libar-docs-business-value tag) */
    businessValue: z.string().optional(),

    /**
     * Deliverables from Gherkin Background tables
     *
     * Extracted from feature files with Background: Deliverables sections.
     * Each deliverable tracks a concrete output with its status and location.
     * Uses the canonical DeliverableSchema from dual-source.ts for type consistency.
     */
    deliverables: z.array(DeliverableSchema).readonly().optional(),

    /** Workflow type for process tracking (from @libar-docs-workflow tag) */
    workflow: z.string().optional(),

    /** Risk level for process tracking (from @libar-docs-risk tag) */
    risk: z.string().optional(),

    /** Priority level for process tracking (from @libar-docs-priority tag) */
    priority: z.string().optional(),

    // NOTE: Release version is tracked at BOTH pattern level (above) AND deliverable level
    // (in DeliverableSchema). Pattern-level tracks the pattern's release association,
    // while deliverable-level tracks individual deliverables within a pattern.

    // Hierarchy support for multi-level organization (epic/phase/task)

    /**
     * Hierarchy level for this pattern (from @libar-docs-level tag)
     *
     * Three-level hierarchy:
     * - **epic**: Multi-quarter strategic initiatives
     * - **phase**: Standard work units (2-5 days) - DEFAULT
     * - **task**: Fine-grained session-level work (1-4 hours)
     *
     * Defaults to "phase" for backward compatibility with existing feature files.
     */
    level: HierarchyLevelSchema.optional(),

    /**
     * Parent pattern name for hierarchy navigation (from @libar-docs-parent tag)
     *
     * Links this pattern to its parent in the hierarchy, enabling:
     * - Epic → Phase → Task navigation
     * - Progress aggregation from children to parents
     * - Breadcrumb display in session context
     */
    parent: z.string().optional(),

    /**
     * Child pattern names (computed from parent references)
     *
     * Auto-populated by the extractor from patterns that reference this one
     * via their @libar-docs-parent tag. Not set directly in feature files.
     */
    children: z.array(z.string()).readonly().optional(),

    // Discovery findings from Gherkin @libar-docs-discovered-* tags (Retrospective phase)

    /**
     * Gaps identified during implementation (from @libar-docs-discovered-gap tags)
     * Missing features or capabilities that were not anticipated.
     */
    discoveredGaps: z.array(z.string()).readonly().optional(),

    /**
     * Improvements identified during implementation (from @libar-docs-discovered-improvement tags)
     * Better approaches or optimizations discovered while working.
     */
    discoveredImprovements: z.array(z.string()).readonly().optional(),

    /**
     * Risks identified during implementation (from @libar-docs-discovered-risk tags)
     * Technical debt, architectural concerns, or potential issues discovered.
     */
    discoveredRisks: z.array(z.string()).readonly().optional(),

    /**
     * Learnings captured during implementation (from @libar-docs-discovered-learning tags)
     * Key insights, patterns, or institutional knowledge gained.
     */
    discoveredLearnings: z.array(z.string()).readonly().optional(),

    /**
     * Technical constraints affecting feature implementation (from @libar-docs-constraint tags)
     * Documents requirements, assumptions, and boundaries for implementation.
     */
    constraints: z.array(z.string()).readonly().optional(),

    // ADR (Architecture Decision Record) fields from @libar-docs-adr-* tags

    /**
     * ADR number (from @libar-docs-adr tag, e.g., "001", "002")
     * Used to identify and reference architecture decisions.
     */
    adr: z.string().optional(),

    /**
     * ADR decision status (from @libar-docs-adr-status tag)
     * Tracks the lifecycle of architecture decisions (from taxonomy).
     */
    adrStatus: z.enum(ADR_STATUS_VALUES).optional(),

    /**
     * ADR category (from @libar-docs-adr-category tag)
     * Groups decisions by domain (architecture, process, testing, tooling).
     */
    adrCategory: z.string().optional(),

    /**
     * ADR number this decision supersedes (from @libar-docs-adr-supersedes tag)
     * Links to the previous decision being replaced.
     */
    adrSupersedes: z.string().optional(),

    /**
     * ADR number that supersedes this decision (from @libar-docs-adr-superseded-by tag)
     * Links to the newer decision that replaces this one.
     */
    adrSupersededBy: z.string().optional(),

    // NOTE: ADR content (context, decision, consequences) is now derived from
    // Gherkin Rule: keywords instead of parsed markdown in description.
    // Rules named "Context - ...", "Decision - ...", "Consequences - ..." are
    // semantically detected and rendered by the ADR codec.

    // Display and traceability fields (from @libar-docs-title, @libar-docs-behavior-file)

    /**
     * Explicit human-readable title for display (from @libar-docs-title tag)
     *
     * Overrides the auto-transformation of CamelCase patternName.
     * Use for edge cases like "OAuth 2.0 Integration" where auto-transform
     * would produce "OAuth2 Integration".
     *
     * @example
     * ```gherkin
     * @libar-docs-title:"OAuth 2.0 Integration"
     * ```
     */
    title: z.string().optional(),

    /**
     * Path to corresponding behavior feature file (from @libar-docs-behavior-file tag)
     *
     * Enables traceability from timeline phases to their behavioral tests.
     * If not specified, convention-based matching is used:
     * `timeline/phase-37-name.feature` → `behavior/name.feature`
     *
     * @example
     * ```gherkin
     * @libar-docs-behavior-file:tests/features/behavior/remaining-work-enhancement.feature
     * ```
     */
    behaviorFile: z.string().optional(),

    /**
     * Whether the behavior file has been verified to exist on disk
     *
     * Set during extraction when inferring behavior file from convention:
     * - `true` = file was found at inferred path
     * - `false` = file not found at inferred path
     * - `undefined` = explicit @libar-docs-behavior-file tag used (trust it)
     *
     * Used by TraceabilitySection to determine coverage without filesystem access.
     */
    behaviorFileVerified: z.boolean().optional(),

    /**
     * Business rules from Gherkin Rule: keyword (Gherkin v6+)
     *
     * Rules group scenarios under business rule statements with rich descriptions.
     * Used for PRD generation where business rules are more relevant than test scenarios.
     *
     * Each rule contains:
     * - name: The business rule statement (e.g., "Tag registry must define all new metadata tags")
     * - description: Context, rationale, exceptions, and see-also references
     * - scenarioCount: Number of scenarios that verify this rule
     *
     * @example
     * ```gherkin
     * Rule: Tag registry must define all new metadata tags
     *
     *   The tag registry is the single source of truth for all process metadata.
     *
     *   # RATIONALE: Centralized tag definitions prevent inconsistent usage
     *
     *   @acceptance-criteria
     *   Scenario: New tags are defined in tag registry
     *     Given...
     * ```
     */
    rules: z.array(BusinessRuleSchema).readonly().optional(),

    // Architecture diagram generation fields (from @libar-docs-arch-* tags)

    /**
     * Architectural role for diagram generation (from @libar-docs-arch-role tag)
     *
     * Identifies the component type for architecture diagram visualization:
     * - bounded-context: Physical BC isolation (Convex component)
     * - command-handler: Handles commands within a BC
     * - projection: Read model updater
     * - saga: Cross-BC workflow coordinator
     * - process-manager: Event-driven coordinator
     * - infrastructure: Cross-cutting infrastructure
     * - repository: CMS state loader
     * - decider: Pure business logic
     * - read-model: Query-side table/view
     * - service: Application service (orchestration, coordination)
     */
    archRole: z
      .enum([
        'bounded-context',
        'command-handler',
        'projection',
        'saga',
        'process-manager',
        'infrastructure',
        'repository',
        'decider',
        'read-model',
        'service',
      ])
      .optional(),

    /**
     * Bounded context this component belongs to (from @libar-docs-arch-context tag)
     *
     * Used for grouping components into Mermaid subgraphs by BC.
     * Components without arch-context are rendered at the top level (shared infrastructure).
     *
     * @example "@libar-docs-arch-context orders"
     */
    archContext: z.string().optional(),

    /**
     * Architectural layer (from @libar-docs-arch-layer tag)
     *
     * Identifies which layer in a layered architecture diagram:
     * - domain: Pure business logic (deciders, value objects)
     * - application: Application services, handlers, projections
     * - infrastructure: External interfaces, persistence, messaging
     */
    archLayer: z.enum(['domain', 'application', 'infrastructure']).optional(),

    /** Cross-cutting document inclusion for content routing and diagram scoping (from @libar-docs-include CSV tag) */
    include: z.array(z.string().min(1)).readonly().optional(),

    // Shape extraction for documentation generation (ADR-021)

    /**
     * TypeScript shapes extracted via @libar-docs-extract-shapes tag
     *
     * Contains interfaces, type aliases, enums, and function signatures
     * extracted from the source file for documentation generation.
     * Shapes appear in the order specified in the tag.
     *
     * @example
     * ```typescript
     * // @libar-docs-extract-shapes DeciderInput, ValidationResult
     * // Results in extractedShapes containing both shapes in that order
     * ```
     */
    extractedShapes: z.array(ExtractedShapeSchema).readonly().optional(),
  })
  .strict();

/**
 * Type alias inferred from schema
 *
 * **Schema-First Law**: Type automatically derives from Zod schema.
 */
export type ExtractedPattern = z.infer<typeof ExtractedPatternSchema>;

/**
 * Runtime type guard for ExtractedPattern
 *
 * @param value - Value to check
 * @returns True if value conforms to ExtractedPattern schema
 *
 * @example
 * ```typescript
 * if (isExtractedPattern(parsed)) {
 *   console.log(parsed.id); // Type-safe access
 * }
 * ```
 */
export function isExtractedPattern(value: unknown): value is ExtractedPattern {
  return ExtractedPatternSchema.safeParse(value).success;
}
