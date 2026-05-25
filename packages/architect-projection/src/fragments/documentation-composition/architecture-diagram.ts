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

export const ArchitectureDiagramSchema = z.strictObject({
  kind: z.literal('ArchitectureDiagram'),
  scope: ArchitectureDiagramScopeSchema,
  scopeValue: z.string().optional(),
  sections: z.array(ArchitectureDiagramSectionSchema),
  legend: z.array(BlockSchema).optional(),
  patterns: z.array(z.string()),
});

export type ArchitectureDiagramSection = z.infer<typeof ArchitectureDiagramSectionSchema>;
export type ArchitectureDiagram = z.infer<typeof ArchitectureDiagramSchema>;
