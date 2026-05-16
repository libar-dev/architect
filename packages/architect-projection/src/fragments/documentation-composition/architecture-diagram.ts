/**
 * @architect
 * @architect-pattern ArchitectureDiagram
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:documentation-composition
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { BlockSchema, MermaidBlockSchema } from '../../blocks/schema.js';
import { ArchitectureDiagramScopeSchema } from './supporting.js';

export const ArchitectureDiagramSchema = z.strictObject({
  kind: z.literal('ArchitectureDiagram'),
  scope: ArchitectureDiagramScopeSchema,
  scopeValue: z.string().optional(),
  diagram: MermaidBlockSchema,
  legend: z.array(BlockSchema).optional(),
  patterns: z.array(z.string()),
});

export type ArchitectureDiagram = z.infer<typeof ArchitectureDiagramSchema>;
