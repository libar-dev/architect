/**
 * @architect
 * @architect-pattern PatternRelationsSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Houses the shared pattern-relations helper schemas for sources, relationships, hierarchy, deliverables, stubs, dependency kinds, and tree nodes.
 */
import { z } from 'zod';

import { DeliverableManifestSchema } from '../execution-context/deliverable-manifest.js';
import { DeliverableSchema } from '../execution-context/deliverable.js';

export const PatternSourceSchema = z.enum(['typescript', 'gherkin']);

export const ImplementationRefSchema = z.strictObject({
  name: z.string(),
  file: z.string(),
  description: z.string().optional(),
});

export const PatternRelationshipsSchema = z.strictObject({
  dependsOn: z.array(z.string()),
  enables: z.array(z.string()),
  uses: z.array(z.string()),
  usedBy: z.array(z.string()),
  implementsPatterns: z.array(z.string()),
  implementedBy: z.array(ImplementationRefSchema),
  extendsPattern: z.string().optional(),
  extendedBy: z.array(z.string()),
  seeAlso: z.array(z.string()),
  apiRef: z.array(z.string()),
});

export const PatternHierarchySchema = z.strictObject({
  level: z.string().optional(),
  parent: z.string().optional(),
  members: z.array(z.string()),
});

export const EmbeddedRuleRefSchema = z.strictObject({
  name: z.string(),
  invariant: z.string().optional(),
  rationale: z.string().optional(),
  verifiedBy: z.array(z.string()),
  scenarioCount: z.number().int().nonnegative(),
});

export const EmbeddedDeliverableSchema = DeliverableSchema.omit({ kind: true });

export const EmbeddedDeliverableManifestSchema = DeliverableManifestSchema.omit({
  kind: true,
}).extend({
  items: z.array(EmbeddedDeliverableSchema),
});

export const StubRefSchema = z.strictObject({
  stubFile: z.string(),
  targetPath: z.string(),
  name: z.string(),
});

export const DependencyRelationKindSchema = z.enum([
  'depends-on',
  'uses',
  'enables',
  'implements',
  'extends',
  'see-also',
  'api-ref',
]);

export interface DependencyTreeNode {
  name: string;
  status?: string | undefined;
  phase?: number | undefined;
  isFocal: boolean;
  truncated: boolean;
  children: DependencyTreeNode[];
}

export const DependencyTreeNodeSchema: z.ZodType<DependencyTreeNode> = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  phase: z.number().int().optional(),
  isFocal: z.boolean(),
  truncated: z.boolean(),
  children: z.array(z.lazy(() => DependencyTreeNodeSchema)),
});

export type PatternSource = z.infer<typeof PatternSourceSchema>;
export type ImplementationRef = z.infer<typeof ImplementationRefSchema>;
export type PatternRelationships = z.infer<typeof PatternRelationshipsSchema>;
export type PatternHierarchy = z.infer<typeof PatternHierarchySchema>;
export type EmbeddedRuleRef = z.infer<typeof EmbeddedRuleRefSchema>;
export type EmbeddedDeliverable = z.infer<typeof EmbeddedDeliverableSchema>;
export type EmbeddedDeliverableManifest = z.infer<typeof EmbeddedDeliverableManifestSchema>;
export type StubRef = z.infer<typeof StubRefSchema>;
export type DependencyRelationKind = z.infer<typeof DependencyRelationKindSchema>;
