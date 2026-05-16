/**
 * @architect
 * @architect-pattern PatternGraph
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:validation-schemas
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
import type { ExtractedPattern } from './extracted-pattern.js';
import { TagRegistrySchema } from './tag-registry.js';
import type { TagRegistry } from './tag-registry.js';

export const FeatureParseErrorSchema = z.strictObject({
  type: z.literal('FEATURE_PARSE_ERROR'),
  message: z.string(),
  file: z.string(),
  reason: z.string(),
  originalError: z.unknown().optional(),
});

export const PatternParseFailureSchema = z.strictObject({
  kind: z.literal('spec-parse-failed'),
  patternName: z.string(),
  path: z.string(),
  message: z.string(),
  parseError: FeatureParseErrorSchema,
});

export const StatusGroupsSchema = z.object({
  completed: z.array(ExtractedPatternSchema),
  active: z.array(ExtractedPatternSchema),
  planned: z.array(ExtractedPatternSchema),
  candidate: z.array(ExtractedPatternSchema),
});

export const ExactStatusGroupsSchema = z.object({
  candidate: z.array(ExtractedPatternSchema),
  roadmap: z.array(ExtractedPatternSchema),
  active: z.array(ExtractedPatternSchema),
  completed: z.array(ExtractedPatternSchema),
  deferred: z.array(ExtractedPatternSchema),
});

export const StatusCountsSchema = z.object({
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const PhaseGroupSchema = z.object({
  phaseNumber: z.number().int(),
  phaseName: z.string().optional(),
  patterns: z.array(ExtractedPatternSchema),
  counts: StatusCountsSchema,
});

export const SourceViewsSchema = z.object({
  typescript: z.array(ExtractedPatternSchema),
  gherkin: z.array(ExtractedPatternSchema),
  roadmap: z.array(ExtractedPatternSchema),
  prd: z.array(ExtractedPatternSchema),
});

export const ImplementationRefSchema = z.object({
  name: z.string(),
  file: z.string(),
  description: z.string().optional(),
});

export const RelationshipEntrySchema = z.object({
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

export const ArchIndexSchema = z.object({
  byRole: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byContext: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byLayer: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byView: z.record(z.string(), z.array(ExtractedPatternSchema)),
  all: z.array(ExtractedPatternSchema),
});

export const PatternGraphSchema = z.object({
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
  relationshipIndex: z.record(z.string(), RelationshipEntrySchema).optional(),
  archIndex: ArchIndexSchema.optional(),
  featureParseFailures: z.array(PatternParseFailureSchema).readonly().optional(),
});

export interface ExactStatusGroups {
  candidate: ExtractedPattern[];
  roadmap: ExtractedPattern[];
  active: ExtractedPattern[];
  completed: ExtractedPattern[];
  deferred: ExtractedPattern[];
}
export interface StatusGroups {
  completed: ExtractedPattern[];
  active: ExtractedPattern[];
  planned: ExtractedPattern[];
  candidate: ExtractedPattern[];
}
export type StatusCounts = z.infer<typeof StatusCountsSchema>;
export interface PhaseGroup {
  phaseNumber: number;
  phaseName?: string | undefined;
  patterns: ExtractedPattern[];
  counts: StatusCounts;
}
export interface SourceViews {
  typescript: ExtractedPattern[];
  gherkin: ExtractedPattern[];
  roadmap: ExtractedPattern[];
  prd: ExtractedPattern[];
}
export type ImplementationRef = z.infer<typeof ImplementationRefSchema>;
export type RelationshipEntry = z.infer<typeof RelationshipEntrySchema>;
export type PatternParseFailure = z.infer<typeof PatternParseFailureSchema>;
export interface ArchIndex {
  byRole: Record<string, ExtractedPattern[]>;
  byContext: Record<string, ExtractedPattern[]>;
  byLayer: Record<string, ExtractedPattern[]>;
  byView: Record<string, ExtractedPattern[]>;
  all: ExtractedPattern[];
}
export interface PatternGraph {
  patterns: ExtractedPattern[];
  tagRegistry: TagRegistry;
  byStatus: ExactStatusGroups;
  byNormalizedStatus: StatusGroups;
  byMaturity: Record<string, ExtractedPattern[]>;
  byPhase: PhaseGroup[];
  byQuarter: Record<string, ExtractedPattern[]>;
  byRole: Record<string, ExtractedPattern[]>;
  bySourceType: SourceViews;
  byProductArea: Record<string, ExtractedPattern[]>;
  counts: StatusCounts;
  phaseCount: number;
  roleCount: number;
  relationshipIndex?: Record<string, RelationshipEntry> | undefined;
  archIndex?: ArchIndex | undefined;
  nameIndex?: ReadonlyMap<string, ExtractedPattern> | undefined;
  featureParseFailures?: readonly PatternParseFailure[] | undefined;
}
