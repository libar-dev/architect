/**
 * @architect
 * @architect-pattern ApiReferenceDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:documentation-composition
 *
 * **Value:** Defines the `ApiReferenceDigest` fragment — the projected API /
 * type surface (shape-tagged exported declarations) for the whole graph
 * (the navigation index, `scope: 'all'`) or one workspace package
 * (`scope: 'package'`). Each `ApiShape` is the renderer-ready, package- and
 * pattern-attributed view of a `core` `ExtractedShape`.
 *
 * **Invariant:** All shape text (names, types, descriptions, source) is SOURCED
 * and carried as plain strings; escaping is the renderer's responsibility per
 * ADR-009. The fragment never embeds pre-rendered Markdown.
 *
 * ### When to Use
 *
 * - As the contract for the `api-reference` documentation type: a root index
 *   grouped by package plus one child digest per package.
 */
import { z } from 'zod';

export const ApiShapeKindSchema = z.enum(['interface', 'type', 'enum', 'function', 'const']);

export type ApiShapeKind = z.infer<typeof ApiShapeKindSchema>;

const ApiShapePropertySchema = z.strictObject({
  name: z.string(),
  description: z.string(),
});

const ApiShapeParamSchema = z.strictObject({
  name: z.string(),
  type: z.string().optional(),
  description: z.string(),
});

const ApiShapeSignalSchema = z.strictObject({
  type: z.string().optional(),
  description: z.string(),
});

export const ApiShapeSchema = z.strictObject({
  name: z.string().min(1),
  kind: ApiShapeKindSchema,
  /** Owning pattern (the architectural unit the shape is annotated within). */
  pattern: z.string(),
  /** Cleaned JSDoc prose (comment markers, `@param`/`@returns` tags, and `@architect-*` stripped). */
  description: z.string().optional(),
  /** Verbatim declaration source, rendered in a fenced code block. */
  sourceText: z.string(),
  typeParameters: z.array(z.string()).optional(),
  extends: z.array(z.string()).optional(),
  exported: z.boolean(),
  group: z.string().optional(),
  /** Interface member docs (`{ name, description }`), when present. */
  properties: z.array(ApiShapePropertySchema).optional(),
  /** Function parameter docs, when present. */
  params: z.array(ApiShapeParamSchema).optional(),
  returns: ApiShapeSignalSchema.optional(),
  throws: z.array(ApiShapeSignalSchema).optional(),
});

export type ApiShape = z.infer<typeof ApiShapeSchema>;

const ApiReferenceGroupingEntrySchema = z.strictObject({
  childKey: z.string(),
  label: z.string(),
  patternCount: z.number().int().nonnegative(),
  shapeCount: z.number().int().nonnegative(),
});

export type ApiReferenceGroupingEntry = z.infer<typeof ApiReferenceGroupingEntrySchema>;

export const ApiReferenceDigestSchema = z.discriminatedUnion('scope', [
  z.strictObject({
    kind: z.literal('ApiReferenceDigest'),
    scope: z.literal('all'),
    shapes: z.array(ApiShapeSchema),
    groupingEntries: z.array(ApiReferenceGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('ApiReferenceDigest'),
    scope: z.literal('package'),
    scopeValue: z.string(),
    shapes: z.array(ApiShapeSchema),
  }),
]);

export type ApiReferenceDigest = z.infer<typeof ApiReferenceDigestSchema>;
