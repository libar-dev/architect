/**
 * @architect
 * @architect-pattern PatternRelationsSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 * @architect-uses Deliverable, DeliverableManifest
 *
 * ### When to Use
 *
 * - Houses the shared pattern-relations helper schemas for sources, relationships, hierarchy, deliverables, stubs, dependency kinds, and tree nodes.
 */
import { z } from 'zod';

import { DeliverableManifestSchema } from '../execution-context/deliverable-manifest.js';
import { DeliverableSchema } from '../execution-context/deliverable.js';

/**
 * Whether a pattern originates from TypeScript source or a Gherkin feature.
 *
 * @architect-shape
 */
export const PatternSourceSchema = z.enum(['typescript', 'gherkin']);

/**
 * A reference to an artifact that implements a pattern — its name, file, and an
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
 * The full set of relationship edges for a pattern — forward and reverse
 * dependency, usage, enablement, and implementation links, plus extension,
 * see-also, and API references.
 *
 * @architect-shape
 */
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

/**
 * A pattern's place in the hierarchy — its level, optional parent, and member
 * patterns.
 *
 * @architect-shape
 */
export const PatternHierarchySchema = z.strictObject({
  level: z.string().optional(),
  parent: z.string().optional(),
  members: z.array(z.string()),
});

/**
 * A business rule embedded in a pattern detail — its name, invariant,
 * rationale, the scenarios that verify it, and their count.
 *
 * @architect-shape
 */
export const EmbeddedRuleRefSchema = z.strictObject({
  name: z.string(),
  invariant: z.string().optional(),
  rationale: z.string().optional(),
  verifiedBy: z.array(z.string()),
  scenarioCount: z.number().int().nonnegative(),
});

/**
 * A deliverable embedded in a pattern detail — the deliverable shape without its
 * standalone `kind` discriminator.
 *
 * @architect-shape
 */
export const EmbeddedDeliverableSchema = DeliverableSchema.omit({ kind: true });

/**
 * A deliverable manifest embedded in a pattern detail — the manifest without its
 * `kind` discriminator, with its items replaced by embedded deliverables.
 *
 * @architect-shape
 */
export const EmbeddedDeliverableManifestSchema = DeliverableManifestSchema.omit({
  kind: true,
}).extend({
  items: z.array(EmbeddedDeliverableSchema),
});

/**
 * A reference to a generated stub — its stub file, its intended target path, and
 * the declaration name.
 *
 * @architect-shape
 */
export const StubRefSchema = z.strictObject({
  stubFile: z.string(),
  targetPath: z.string(),
  name: z.string(),
});

/**
 * The kind of relation a dependency edge represents.
 *
 * @architect-shape
 */
export const DependencyRelationKindSchema = z.enum([
  'depends-on',
  'uses',
  'enables',
  'implements',
  'extends',
  'see-also',
  'api-ref',
]);

/**
 * One node in a recursive dependency tree. Defined as an interface so the Zod
 * schema can reference it for its self-referential `children` type.
 *
 * @architect-shape
 */
export interface DependencyTreeNode {
  /** The pattern name this node represents. */
  name: string;
  /** The pattern's lifecycle status, when known. */
  status?: string | undefined;
  /** The pattern's phase number, when assigned. */
  phase?: number | undefined;
  /** Whether this node is the focal pattern the tree was rooted at. */
  isFocal: boolean;
  /** Whether traversal stopped here because the depth limit was reached. */
  truncated: boolean;
  /** This node's direct dependency children. */
  children: DependencyTreeNode[];
}

/**
 * The recursive Zod schema for a dependency-tree node, validating the shape
 * described by {@link DependencyTreeNode} with lazily-evaluated children.
 *
 * @architect-shape
 */
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
