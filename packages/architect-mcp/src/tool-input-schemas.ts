/**
 * Composable Zod input schema primitives for MCP tool registration.
 * Each tool's inputSchema is built from these shared pieces so that
 * repeated patterns (pattern-name references, depth bounds, session enums)
 * are defined once and composed.
 */
import {
  AcceptedStatusSchema,
  HandoffSessionTypeSchema,
  NonEmptySafeStringSchema,
  ScopeTypeSchema,
  SafeStringSchema,
  SessionTypeSchema,
} from '@libar-dev/architect-core';
import {
  PatternBundleOptionsSchema,
  OpenQuestionListOptionsSchema,
  ProjectDocumentationBundleOptionsSchema,
  TaxonomyDigestOptionsSchema,
} from '@libar-dev/architect-projection/projections';
import {
  ContentRichnessSchema,
  ProgressiveDisclosureLevelSchema,
} from '@libar-dev/architect-projection/disclosure';
import { z } from 'zod';

export const MAX_HANDOFF_MODIFIED_FILES = 200;

function createStrictReadonlyObjectSchema<TShape extends z.ZodRawShape>(
  shape: TShape,
): z.ZodReadonly<z.ZodObject<TShape>> {
  return z.strictObject(shape).readonly();
}

export const OptionalRelatedShape = {
  related: z.boolean().optional(),
} satisfies z.ZodRawShape;

export const OptionalDepthShape = {
  maxDepth: z.number().int().min(1).max(50).optional(),
} satisfies z.ZodRawShape;

export const OptionalSessionShape = {
  session: SessionTypeSchema.optional(),
} satisfies z.ZodRawShape;

export const RequiredScopeShape = {
  session: ScopeTypeSchema,
} satisfies z.ZodRawShape;

export const OptionalStrictShape = {
  strict: z.boolean().optional(),
} satisfies z.ZodRawShape;

export const OptionalHandoffSessionShape = {
  session: HandoffSessionTypeSchema.optional(),
} satisfies z.ZodRawShape;

export const OptionalModifiedFilesShape = {
  modifiedFiles: z
    .array(NonEmptySafeStringSchema)
    .max(MAX_HANDOFF_MODIFIED_FILES)
    .readonly()
    .optional(),
} satisfies z.ZodRawShape;

export const DocumentTypeShape = {
  documentType: ProjectDocumentationBundleOptionsSchema.unwrap().shape.documentType,
} satisfies z.ZodRawShape;

export const DocumentationFilterSchema = z
  .strictObject({
    status: z.array(AcceptedStatusSchema).min(1).optional(),
  })
  .readonly();

export const OptionalContentRichnessShape = {
  disclosure: ContentRichnessSchema.optional(),
} satisfies z.ZodRawShape;

export const OptionalDocumentationOptionsShape = {
  disclosure: ProgressiveDisclosureLevelSchema.optional(),
  filter: DocumentationFilterSchema.optional(),
} satisfies z.ZodRawShape;

export const SearchQueryShape = {
  query: NonEmptySafeStringSchema,
} satisfies z.ZodRawShape;

export const ListFilterShape = {
  status: AcceptedStatusSchema.optional(),
  role: SafeStringSchema.optional(),
  namesOnly: z.boolean().optional(),
  count: z.boolean().optional(),
} satisfies z.ZodRawShape;

export const OpenQuestionsFilterShape = OpenQuestionListOptionsSchema.unwrap().shape;

const { pattern: _bundlePattern, ...bundleOptionsShape } =
  PatternBundleOptionsSchema.unwrap().shape;

export const BundleOptionsShape = bundleOptionsShape;

export const RulesFilterShape = {
  pattern: SafeStringSchema.optional(),
  productArea: SafeStringSchema.optional(),
  onlyInvariants: z.boolean().optional(),
} satisfies z.ZodRawShape;

/**
 * MCP input shape for `architect_taxonomy`. Derived from the projection's
 * own `TaxonomyDigestOptionsSchema` so the boundary contract is the
 * projection contract — adding a field to the projection schema flows to
 * MCP automatically.
 */
export const TaxonomyOptionsShape = TaxonomyDigestOptionsSchema.unwrap().shape;

/** Empty input — tools that take no parameters. */
export const EmptyInputSchema = z.union([createStrictReadonlyObjectSchema({}), z.undefined()]);

/** Pattern name reference — used by most tools that target a single pattern. */
export const PatternNameSchema = NonEmptySafeStringSchema;

export { createStrictReadonlyObjectSchema };
