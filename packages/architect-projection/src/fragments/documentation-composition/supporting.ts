/**
 * @architect
 * @architect-pattern DocumentationCompositionSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:documentation-composition
 *
 * ### When to Use
 *
 * - Defines shared documentation-composition support schemas for sections and
*   architecture diagram scopes.
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
