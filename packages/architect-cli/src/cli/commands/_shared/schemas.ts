import {
  AcceptedStatusSchema,
  HandoffSessionTypeSchema,
  ProcessStatusSchema,
  RenderFormatSchema,
  ScopeTypeSchema,
  SessionTypeSchema,
  parseAtBoundary,
  type AcceptedStatusValue,
  type HandoffSessionType,
  type ProcessStatusValue,
  type ScopeType,
  type SessionType,
} from '@libar-dev/architect-core';
import { BundleIncludeSchema, BundleModeSchema } from '@libar-dev/architect-projection/projections';
import { z } from 'zod';

const MAX_HANDOFF_MODIFIED_FILES = 200;

export const EmptyObjectSchema = z.strictObject({});
export const StringArraySchema = z.array(z.string()).readonly();
export const EmptyFlagsSchema = EmptyObjectSchema.readonly();

export const ContextFlagsSchema = z
  .strictObject({
    session: SessionTypeSchema.optional(),
  })
  .readonly();

export const DepTreeFlagsSchema = z
  .strictObject({
    depth: z.number().int().optional(),
  })
  .readonly();

export const FilesFlagsSchema = z
  .strictObject({
    related: z.boolean().optional(),
  })
  .readonly();

export const ScopeValidateFlagsSchema = z
  .strictObject({
    type: ScopeTypeSchema.optional(),
    strict: z.boolean().optional(),
  })
  .readonly();

export const HandoffFlagsSchema = z
  .strictObject({
    pattern: z.string().optional(),
    session: HandoffSessionTypeSchema.optional(),
    modifiedFiles: z.array(z.string()).max(MAX_HANDOFF_MODIFIED_FILES).readonly().optional(),
  })
  .readonly();

export const ListFlagsSchema = z
  .strictObject({
    status: AcceptedStatusSchema.optional(),
    role: z.string().optional(),
    parent: z.string().optional(),
    count: z.boolean().optional(),
    namesOnly: z.boolean().optional(),
  })
  .readonly();

export const OpenQuestionsFlagsSchema = z
  .strictObject({
    parent: z.string().optional(),
    format: RenderFormatSchema.optional(),
  })
  .readonly();

export const RulesFlagsSchema = z
  .strictObject({
    productArea: z.string().optional(),
    pattern: z.string().optional(),
    package: z.string().optional(),
    feature: z.string().optional(),
    onlyInvariants: z.boolean().optional(),
    count: z.boolean().optional(),
    namesOnly: z.boolean().optional(),
  })
  .readonly();

export const TaxonomyFlagsSchema = z
  .strictObject({
    count: z.boolean().optional(),
  })
  .readonly();

export const DocumentationFlagsSchema = z
  .strictObject({
    disclosure: z.string().optional(),
    filters: z.array(z.unknown()).readonly().optional(),
  })
  .readonly();

export const BundleFlagsSchema = z
  .strictObject({
    mode: BundleModeSchema.optional(),
    include: z.array(BundleIncludeSchema).min(1).readonly().optional(),
    estimateTokens: z.boolean().optional(),
  })
  .readonly();

export const ArchFlagsSchema = z
  .strictObject({
    baseline: z.string().optional(),
    writeBaseline: z.boolean().optional(),
    strict: z.boolean().optional(),
  })
  .readonly();

export function parseSchemaValue<T>(schema: z.ZodType<T>, value: unknown, errorMessage: string): T {
  try {
    return parseAtBoundary(schema, value, errorMessage);
  } catch {
    throw new Error(errorMessage);
  }
}

export function parseIntegerValue(value: string, errorMessage: string): number {
  return parseSchemaValue(z.number().int(), Number.parseInt(value, 10), errorMessage);
}

export function parseSessionTypeValue(value: string): SessionType {
  return parseSchemaValue(
    SessionTypeSchema,
    value,
    '--session must be planning, design, or implement',
  );
}

export function parseScopeTypeValue(value: string): ScopeType {
  return parseSchemaValue(ScopeTypeSchema, value, '--type must be design or implement');
}

export function parseHandoffSessionTypeValue(value: string): HandoffSessionType {
  return parseSchemaValue(
    HandoffSessionTypeSchema,
    value,
    '--session must be planning, design, implement, or review',
  );
}

export function parseAcceptedStatusValue(value: string): AcceptedStatusValue {
  return parseSchemaValue(
    AcceptedStatusSchema,
    value,
    `Expected accepted status value, received: ${value}`,
  );
}

export function parseProcessStatusValue(value: string): ProcessStatusValue {
  return parseSchemaValue(
    ProcessStatusSchema,
    value,
    `Expected process status value, received: ${value}`,
  );
}

export function parseRenderFormatValue(value: string): z.infer<typeof RenderFormatSchema> {
  return parseSchemaValue(RenderFormatSchema, value, '--format must be compact or json');
}

export function parseBundleIncludeValues(value: string): z.infer<typeof BundleIncludeSchema>[] {
  const includes = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) =>
      parseSchemaValue(BundleIncludeSchema, entry, `Unknown bundle include: ${entry}`),
    );

  if (includes.length === 0) {
    throw new Error('--include requires at least one comma-separated include block');
  }

  return includes;
}

export function parseBundleModeValue(value: string): z.infer<typeof BundleModeSchema> {
  return parseSchemaValue(
    BundleModeSchema,
    value,
    '--mode must be plan, design, implement, or review',
  );
}
