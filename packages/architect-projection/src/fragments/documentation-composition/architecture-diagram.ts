/**
 * @architect
 * @architect-pattern ArchitectureDiagram
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:documentation-composition
 * @architect-uses BlockSchema
 *
 * ### When to Use
 *
 * - Defines the ArchitectureDiagram fragment shape: an ordered set of scoped
 *   Mermaid diagram sections (a context map plus per-group detail diagrams) and
 *   the overall pattern list.
 */
import { z } from 'zod';

import { BlockSchema, MermaidBlockSchema } from '../../blocks/schema.js';
import { ArchitectureDiagramScopeSchema } from './supporting.js';

/**
 * One labeled diagram within an architecture document — the context map or a
 * single group's detail diagram. Splitting the architecture view into many
 * bounded sections keeps every Mermaid block renderable (no single block holds
 * all patterns) and far more readable than one mega-graph.
 */
export const ArchitectureDiagramSectionSchema = z.strictObject({
  title: z.string(),
  description: z.string().optional(),
  diagram: MermaidBlockSchema,
  patterns: z.array(z.string()),
});

/**
 * One row of the fan-in / hub view — a pattern ranked by how many in-view peers
 * depend on it. Surfaces hub patterns that otherwise render as edgeless leaves in
 * the per-group detail diagrams (their consumers live in other groups).
 */
export const FanInEntrySchema = z.strictObject({
  pattern: z.string(),
  usedByCount: z.number().int().nonnegative(),
  topConsumers: z.array(z.string()),
});

/**
 * One bounded context whose member patterns resolve to more than one workspace
 * package — a seam where a single context is implemented across package boundaries.
 */
export const CrossPackageContextEntrySchema = z.strictObject({
  context: z.string(),
  packages: z.array(z.string()),
  patternCount: z.number().int().nonnegative(),
});

export const ArchitectureDiagramSchema = z.strictObject({
  kind: z.literal('ArchitectureDiagram'),
  scope: ArchitectureDiagramScopeSchema,
  scopeValue: z.string().optional(),
  sections: z.array(ArchitectureDiagramSectionSchema),
  legend: z.array(BlockSchema).optional(),
  fanIn: z.array(FanInEntrySchema).optional(),
  crossPackageContexts: z.array(CrossPackageContextEntrySchema).optional(),
  patterns: z.array(z.string()),
});

export type ArchitectureDiagramSection = z.infer<typeof ArchitectureDiagramSectionSchema>;
export type FanInEntry = z.infer<typeof FanInEntrySchema>;
export type CrossPackageContextEntry = z.infer<typeof CrossPackageContextEntrySchema>;
export type ArchitectureDiagram = z.infer<typeof ArchitectureDiagramSchema>;
