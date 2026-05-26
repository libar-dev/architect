/**
 * @architect
 * @architect-pattern PatternGraph
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:validation-schemas
 * @architect-uses ExtractedPattern
 *
 * ## PatternGraph - Read Model Schema
 *
 * Zod schema for the canonical read model produced by `buildPatternGraph()`.
 * Single source of truth for every CLI subcommand, MCP tool, generated doc,
 * and desktop view per ADR-006 (Single Read Model).
 *
 * ### When to Use
 *
 * - Consumer code: import the inferred type for graph fields
 * - Tests: validate that fixture/builder output conforms to the schema
 */
import { z } from 'zod';

import { ExtractedPatternSchema } from './extracted-pattern.js';
import { TagRegistrySchema } from './tag-registry.js';

/**
 * Schema for a feature-file parse failure record embedded in the graph.
 *
 * @architect-shape
 */
export const FeatureParseErrorSchema = z.strictObject({
  type: z.literal('FEATURE_PARSE_ERROR'),
  message: z.string(),
  file: z.string(),
  reason: z.string(),
  originalError: z.unknown().optional(),
});

/**
 * Schema for a spec that failed to parse — names the pattern, its path, and the
 * underlying {@link FeatureParseErrorSchema}.
 *
 * @architect-shape
 */
export const PatternParseFailureSchema = z.strictObject({
  kind: z.literal('spec-parse-failed'),
  patternName: z.string(),
  path: z.string(),
  message: z.string(),
  parseError: FeatureParseErrorSchema,
});

/**
 * Schema for patterns grouped by normalized status (completed / active /
 * planned / candidate).
 *
 * @architect-shape
 */
export const StatusGroupsSchema = z.strictObject({
  completed: z.array(ExtractedPatternSchema),
  active: z.array(ExtractedPatternSchema),
  planned: z.array(ExtractedPatternSchema),
  candidate: z.array(ExtractedPatternSchema),
});

/**
 * Schema for patterns grouped by exact (un-normalized) status, including
 * `roadmap` and `deferred`.
 *
 * @architect-shape
 */
export const ExactStatusGroupsSchema = z.strictObject({
  candidate: z.array(ExtractedPatternSchema),
  roadmap: z.array(ExtractedPatternSchema),
  active: z.array(ExtractedPatternSchema),
  completed: z.array(ExtractedPatternSchema),
  deferred: z.array(ExtractedPatternSchema),
});

/**
 * Schema for per-status pattern counts plus a total.
 *
 * @architect-shape
 */
export const StatusCountsSchema = z.strictObject({
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

/**
 * Schema for a single phase grouping — its number, optional name, member
 * patterns, and status counts.
 *
 * @architect-shape
 */
export const PhaseGroupSchema = z.strictObject({
  phaseNumber: z.number().int(),
  phaseName: z.string().optional(),
  patterns: z.array(ExtractedPatternSchema),
  counts: StatusCountsSchema,
});

/**
 * Schema for patterns grouped by source type (TypeScript / Gherkin / roadmap /
 * PRD).
 *
 * @architect-shape
 */
export const SourceViewsSchema = z.strictObject({
  typescript: z.array(ExtractedPatternSchema),
  gherkin: z.array(ExtractedPatternSchema),
  roadmap: z.array(ExtractedPatternSchema),
  prd: z.array(ExtractedPatternSchema),
});

/**
 * Schema for a reference to an implementing artifact — its name, file, and an
 * optional description.
 *
 * @architect-shape
 */
export const ImplementationRefSchema = z.strictObject({
  name: z.string(),
  file: z.string(),
  description: z.string().optional(),
});

/**
 * Schema for one pattern's entry in the relationship index — its forward and
 * derived reverse edges.
 *
 * @architect-shape
 */
export const RelationshipEntrySchema = z.strictObject({
  uses: z.array(z.string()),
  usedBy: z.array(z.string()),
  dependsOn: z.array(z.string()),
  enables: z.array(z.string()),
  implementsPatterns: z.array(z.string()),
  implementedBy: z.array(ImplementationRefSchema),
  extendsPattern: z.string().optional(),
  extendedBy: z.array(z.string()),
  seeAlso: z.array(z.string()),
  apiRef: z.array(z.string()),
});

/**
 * Schema for the architecture index — patterns indexed by role, context,
 * layer, view, and package, plus the full set.
 *
 * @architect-shape
 */
export const ArchIndexSchema = z.strictObject({
  byRole: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byContext: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byLayer: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byView: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byPackage: z.record(z.string(), z.array(ExtractedPatternSchema)),
  all: z.array(ExtractedPatternSchema),
});

/**
 * Schema for the canonical read model (the PatternGraph) — every pattern, the
 * tag registry, the status/maturity/phase/role groupings, counts, the
 * relationship index, and the optional architecture index.
 *
 * @architect-shape
 */
export const PatternGraphSchema = z.strictObject({
  patterns: z.array(ExtractedPatternSchema),
  tagRegistry: TagRegistrySchema,
  byStatus: ExactStatusGroupsSchema,
  byNormalizedStatus: StatusGroupsSchema,
  byMaturity: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byPhase: z.array(PhaseGroupSchema),
  byQuarter: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byRole: z.record(z.string(), z.array(ExtractedPatternSchema)),
  bySourceType: SourceViewsSchema,
  byProductArea: z.record(z.string(), z.array(ExtractedPatternSchema)),
  counts: StatusCountsSchema,
  phaseCount: z.number().int().nonnegative(),
  roleCount: z.number().int().nonnegative(),
  relationshipIndex: z.record(z.string(), RelationshipEntrySchema),
  archIndex: ArchIndexSchema.optional(),
  featureParseFailures: z.array(PatternParseFailureSchema).readonly().optional(),
});

export type ExactStatusGroups = z.infer<typeof ExactStatusGroupsSchema>;
export type StatusGroups = z.infer<typeof StatusGroupsSchema>;
export type StatusCounts = z.infer<typeof StatusCountsSchema>;
export type PhaseGroup = z.infer<typeof PhaseGroupSchema>;
export type SourceViews = z.infer<typeof SourceViewsSchema>;
export type ImplementationRef = z.infer<typeof ImplementationRefSchema>;
export type RelationshipEntry = z.infer<typeof RelationshipEntrySchema>;
export type PatternParseFailure = z.infer<typeof PatternParseFailureSchema>;
export type ArchIndex = z.infer<typeof ArchIndexSchema>;
export type PatternGraph = z.infer<typeof PatternGraphSchema>;
