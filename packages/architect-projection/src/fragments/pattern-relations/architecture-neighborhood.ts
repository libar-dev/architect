/**
 * @architect
 * @architect-pattern ArchitectureNeighborhood
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Defines the `ArchitectureNeighborhood` fragment shape for a focal pattern's relationships, same-context peers, and implementation references.
 */
import { z } from 'zod';

import { ImplementationRefSchema } from './supporting.js';

export const ArchitectureNeighborhoodSchema = z.strictObject({
  kind: z.literal('ArchitectureNeighborhood'),
  pattern: z.string(),
  context: z.string().optional(),
  role: z.string().optional(),
  layer: z.string().optional(),
  uses: z.array(z.string()),
  usedBy: z.array(z.string()),
  dependsOn: z.array(z.string()),
  enables: z.array(z.string()),
  sameContext: z.array(z.string()),
  implements: z.array(z.string()),
  implementedBy: z.array(ImplementationRefSchema),
});

export type ArchitectureNeighborhood = z.infer<typeof ArchitectureNeighborhoodSchema>;
