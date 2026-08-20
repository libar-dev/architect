/**
 * @architect
 * @architect-pattern DocumentationCompositionSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:documentation-composition
 * @architect-uses BlockSchema
 *
 * ### When to Use
 *
 * - Defines shared documentation-composition support schemas for sections and
 *   architecture diagram scopes.
 */
import { z } from 'zod';

import { BlockSchema } from '@libar-dev/architect-core';

/**
 * One documentation section — its id, title, and the blocks it contains.
 *
 * @architect-shape
 */
export const DocumentationSectionSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  blocks: z.array(BlockSchema),
});

/**
 * The scope an architecture diagram is drawn at — by component, layer, theme,
 * bounded context, product area, or package.
 *
 * `layered` and `theme` are the decision-record lenses: both group the patterns
 * carrying the corresponding ADR classification (`@architect-adr-layer` /
 * `@architect-adr-theme`) — the evolutionary layer vs the synthesis theme of a
 * decision — and are structural twins driven by the same grouping engine.
 *
 * @architect-shape
 */
export const ArchitectureDiagramScopeSchema = z.enum([
  'component',
  'layered',
  'theme',
  'bounded-context',
  'product-area',
  'package',
]);

export type DocumentationSection = z.infer<typeof DocumentationSectionSchema>;
export type ArchitectureDiagramScope = z.infer<typeof ArchitectureDiagramScopeSchema>;
