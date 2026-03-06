/**
 * @libar-docs
 * @libar-docs-validation @libar-docs-core
 * @libar-docs-pattern MasterDataset
 * @libar-docs-status completed
 * @libar-docs-uses Zod, ExtractedPattern, TagRegistry
 * @libar-docs-used-by Orchestrator, SectionRenderer, ReportCodecs
 * @libar-docs-usecase "When providing pre-computed views to section renderers"
 * @libar-docs-usecase "When eliminating redundant filtering across generators"
 * @libar-docs-extract-shapes MasterDatasetSchema, StatusGroupsSchema, StatusCountsSchema, PhaseGroupSchema, SourceViewsSchema, RelationshipEntrySchema, ArchIndexSchema
 * @libar-docs-arch-role read-model
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer domain
 * @libar-docs-include codec-transformation
 *
 * ## MasterDataset - Unified Pattern Views Schema
 *
 * Defines the schema for a pre-computed dataset that holds all extracted patterns
 * along with derived views (by status, phase, quarter, category, source). This enables
 * single-pass transformation instead of redundant filtering in each section renderer.
 *
 * ### When to Use
 *
 * - Use when sections need filtered/grouped pattern views
 * - Use when computing aggregate statistics across patterns
 * - Use as input to report-specific codecs (RoadmapReport, TimelineReport, etc.)
 *
 * ### Key Concepts
 *
 * - **Single-pass computation**: All views computed in one iteration over patterns
 * - **Pre-computed groups**: Status, phase, quarter, category, source groupings
 * - **Aggregate statistics**: Counts, completion percentages, phase/category counts
 * - **Type-safe views**: All views are typed via Zod schema inference
 */

import { z } from 'zod';
import { ExtractedPatternSchema } from './extracted-pattern.js';
import { TagRegistrySchema } from './tag-registry.js';
// Note: We don't include workflow in the schema because LoadedWorkflow contains Maps
// which aren't JSON-serializable. The workflow is accessed via context, not stored.

// ═══════════════════════════════════════════════════════════════════════════
// Pre-computed View Schemas
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Status-based grouping of patterns
 *
 * Patterns are normalized to three canonical states:
 * - completed: implemented, completed
 * - active: active, partial, in-progress
 * - planned: roadmap, planned, undefined
 *
 * @libar-docs-shape master-dataset
 */
export const StatusGroupsSchema = z.object({
  /** Patterns with status 'completed' or 'implemented' */
  completed: z.array(ExtractedPatternSchema),

  /** Patterns with status 'active', 'partial', or 'in-progress' */
  active: z.array(ExtractedPatternSchema),

  /** Patterns with status 'roadmap', 'planned', or undefined */
  planned: z.array(ExtractedPatternSchema),
});

/**
 * Status counts for aggregate statistics
 *
 * @libar-docs-shape master-dataset
 */
export const StatusCountsSchema = z.object({
  /** Number of completed patterns */
  completed: z.number().int().nonnegative(),

  /** Number of active patterns */
  active: z.number().int().nonnegative(),

  /** Number of planned patterns */
  planned: z.number().int().nonnegative(),

  /** Total number of patterns */
  total: z.number().int().nonnegative(),
});

/**
 * Phase grouping with patterns and counts
 *
 * Groups patterns by their phase number, with pre-computed
 * status counts for each phase.
 *
 * @libar-docs-shape master-dataset
 */
export const PhaseGroupSchema = z.object({
  /** Phase number (e.g., 1, 2, 3, 14, 39) */
  phaseNumber: z.number().int(),

  /** Optional phase name from workflow config */
  phaseName: z.string().optional(),

  /** Patterns in this phase */
  patterns: z.array(ExtractedPatternSchema),

  /** Pre-computed status counts for this phase */
  counts: StatusCountsSchema,
});

/**
 * Source-based views for different data origins
 *
 * @libar-docs-shape master-dataset
 */
export const SourceViewsSchema = z.object({
  /** Patterns from TypeScript files (.ts) */
  typescript: z.array(ExtractedPatternSchema),

  /** Patterns from Gherkin feature files (.feature) */
  gherkin: z.array(ExtractedPatternSchema),

  /** Patterns with phase metadata (roadmap items) */
  roadmap: z.array(ExtractedPatternSchema),

  /** Patterns with PRD metadata (productArea, userRole, businessValue) */
  prd: z.array(ExtractedPatternSchema),
});

/**
 * Implementation reference for structured implementedBy entries
 *
 * Contains the implementing pattern/module name, source file path,
 * and optional description for rendering in pattern documents.
 */
export const ImplementationRefSchema = z.object({
  /** Pattern/module name (for display) */
  name: z.string(),

  /** Source file path (for linking) */
  file: z.string(),

  /** Optional description from the implementing file */
  description: z.string().optional(),
});

/**
 * Relationship index for dependency tracking
 *
 * Maps pattern names to their relationship metadata.
 *
 * @libar-docs-shape master-dataset
 */
export const RelationshipEntrySchema = z.object({
  /** Patterns this pattern uses (from @libar-docs-uses) */
  uses: z.array(z.string()),

  /** Patterns that use this pattern (from @libar-docs-used-by) */
  usedBy: z.array(z.string()),

  /** Patterns this pattern depends on (from @libar-docs-depends-on) */
  dependsOn: z.array(z.string()),

  /** Patterns this pattern enables (from @libar-docs-enables) */
  enables: z.array(z.string()),

  // UML-inspired relationship fields (PatternRelationshipModel)
  /** Patterns this item implements (realization relationship) */
  implementsPatterns: z.array(z.string()),

  /** Files/patterns that implement this pattern (computed inverse with file paths) */
  implementedBy: z.array(ImplementationRefSchema),

  /** Pattern this extends (generalization relationship) */
  extendsPattern: z.string().optional(),

  /** Patterns that extend this pattern (computed inverse) */
  extendedBy: z.array(z.string()),

  /** Related patterns for cross-reference without dependency (from @libar-docs-see-also tag) */
  seeAlso: z.array(z.string()),

  /** File paths to implementation APIs (from @libar-docs-api-ref tag) */
  apiRef: z.array(z.string()),
});

/**
 * Architecture index for diagram generation
 *
 * Groups patterns by architectural metadata for rendering component diagrams.
 */
export const ArchIndexSchema = z.object({
  /** Patterns grouped by arch-role (bounded-context, projection, saga, etc.) */
  byRole: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by arch-context (orders, inventory, etc.) */
  byContext: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by arch-layer (domain, application, infrastructure) */
  byLayer: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by include tag (cross-cutting content routing and diagram scoping) */
  byView: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns with any architecture metadata (for diagram generation) */
  all: z.array(ExtractedPatternSchema),
});

// ═══════════════════════════════════════════════════════════════════════════
// Master Dataset Schema
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Master Dataset - Unified view of all extracted patterns
 *
 * Contains raw patterns plus pre-computed views and statistics.
 * This is the primary data structure passed to generators and sections.
 *
 * @libar-docs-shape master-dataset
 */
export const MasterDatasetSchema = z.object({
  // ─────────────────────────────────────────────────────────────────────────
  // Raw Data
  // ─────────────────────────────────────────────────────────────────────────

  /** All extracted patterns (both TypeScript and Gherkin) */
  patterns: z.array(ExtractedPatternSchema),

  /** Tag registry for category lookups */
  tagRegistry: TagRegistrySchema,

  // Note: workflow is not in the Zod schema because LoadedWorkflow contains Maps
  // (statusMap, phaseMap) which are not JSON-serializable. When workflow access
  // is needed, get it from SectionContext/GeneratorContext instead.

  // ─────────────────────────────────────────────────────────────────────────
  // Pre-computed Views
  // ─────────────────────────────────────────────────────────────────────────

  /** Patterns grouped by normalized status */
  byStatus: StatusGroupsSchema,

  /** Patterns grouped by phase number (sorted ascending) */
  byPhase: z.array(PhaseGroupSchema),

  /** Patterns grouped by quarter (e.g., "Q4-2024") */
  byQuarter: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by category */
  byCategory: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by source type */
  bySource: SourceViewsSchema,

  /** Patterns grouped by product area (for O(1) product area lookups) */
  byProductArea: z.record(z.string(), z.array(ExtractedPatternSchema)),

  // ─────────────────────────────────────────────────────────────────────────
  // Aggregate Statistics
  // ─────────────────────────────────────────────────────────────────────────

  /** Overall status counts */
  counts: StatusCountsSchema,

  /** Number of distinct phases */
  phaseCount: z.number().int().nonnegative(),

  /** Number of distinct categories */
  categoryCount: z.number().int().nonnegative(),

  // ─────────────────────────────────────────────────────────────────────────
  // Relationship Data (optional)
  // ─────────────────────────────────────────────────────────────────────────

  /** Optional relationship index for dependency graph */
  relationshipIndex: z.record(z.string(), RelationshipEntrySchema).optional(),

  // ─────────────────────────────────────────────────────────────────────────
  // Architecture Data (optional)
  // ─────────────────────────────────────────────────────────────────────────

  /** Optional architecture index for diagram generation */
  archIndex: ArchIndexSchema.optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// Type Exports
// ═══════════════════════════════════════════════════════════════════════════

export type MasterDataset = z.infer<typeof MasterDatasetSchema>;
export type StatusGroups = z.infer<typeof StatusGroupsSchema>;
export type StatusCounts = z.infer<typeof StatusCountsSchema>;
export type PhaseGroup = z.infer<typeof PhaseGroupSchema>;
export type SourceViews = z.infer<typeof SourceViewsSchema>;
export type ImplementationRef = z.infer<typeof ImplementationRefSchema>;
export type RelationshipEntry = z.infer<typeof RelationshipEntrySchema>;
export type ArchIndex = z.infer<typeof ArchIndexSchema>;
