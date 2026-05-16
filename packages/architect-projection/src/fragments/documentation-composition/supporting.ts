/**
 * @architect
 * @architect-pattern DocumentationCompositionSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:documentation-composition
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { BlockSchema } from '../../blocks/schema.js';

export const DocumentationSectionSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  blocks: z.array(BlockSchema),
});

export const ArchitectureDiagramScopeSchema = z.enum([
  'component',
  'layered',
  'bounded-context',
  'product-area',
]);

export type DocumentationSection = z.infer<typeof DocumentationSectionSchema>;
export type ArchitectureDiagramScope = z.infer<typeof ArchitectureDiagramScopeSchema>;
