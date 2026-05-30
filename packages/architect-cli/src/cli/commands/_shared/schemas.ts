import {
  AcceptedStatusSchema,
  HandoffSessionTypeSchema,
  NORMALIZED_STATUS_VALUES,
  ProcessStatusSchema,
  RenderFormatSchema,
  ScopeTypeSchema,
  SessionTypeSchema,
  StatusFilterSchema,
  getPatternName,
  listDecisionPatterns,
  parseAtBoundary,
  resolveDecisionPattern,
  type AcceptedStatusValue,
  type HandoffSessionType,
  type NormalizedStatus,
  type PatternGraph,
  type ProcessStatusValue,
  type ScopeType,
  type SessionType,
  type StatusFilterValue,
} from '@libar-dev/architect-core';
import { BundleIncludeSchema, BundleModeSchema } from '@libar-dev/architect-projection/projections';
import { ContentRichnessSchema, type ContentRichness } from '@libar-dev/architect-projection';
import { z } from 'zod';

const MAX_HANDOFF_MODIFIED_FILES = 200;

const NormalizedStatusSchema = z.enum(NORMALIZED_STATUS_VALUES);

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
    status: StatusFilterSchema.optional(),
    role: z.string().optional(),
    parent: z.string().optional(),
    package: z.string().optional(),
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
    decision: z.string().optional(),
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

export const OverviewFlagsSchema = z
  .strictObject({
    richness: ContentRichnessSchema.optional(),
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

/**
 * Defensively read the finite accepted-value set from a Zod schema.
 *
 * Zod 4 `z.enum([...])` exposes its members via `.options`, and `.describe(...)`
 * preserves both the `ZodEnum` brand and `.options` — so wrapped enums
 * (e.g. `ProgressiveDisclosureLevelSchema`, `ContentRichnessSchema`) are still
 * covered. `.options` is typed `EnumValue[]` (`string | number`), so each entry
 * is normalised to a string. Non-enum schemas (e.g. `z.number().int()`) have no
 * finite set and yield `undefined` — callers fall back to the bare message.
 */
function acceptedEnumValues(schema: z.ZodType): readonly string[] | undefined {
  if (schema instanceof z.ZodEnum) {
    return schema.options.map((option) => String(option));
  }
  return undefined;
}

export function parseSchemaValue<T>(schema: z.ZodType<T>, value: unknown, errorMessage: string): T {
  try {
    return parseAtBoundary(schema, value, errorMessage);
  } catch {
    const accepted = acceptedEnumValues(schema);
    if (accepted !== undefined && accepted.length > 0) {
      // Mirror the self-documenting `query <typo>` whitelist behaviour: keep the
      // leading token (callers may pin on it) then enumerate the accepted set and
      // echo the received value.
      throw new Error(
        `${errorMessage}: invalid value ${JSON.stringify(String(value))}. Accepted: ${accepted.join(', ')}`,
      );
    }
    throw new Error(errorMessage);
  }
}

export function parseIntegerValue(value: string, errorMessage: string): number {
  return parseSchemaValue(z.number().int(), Number.parseInt(value, 10), errorMessage);
}

/**
 * Fail-loud resolver for the `--package` filter — the dynamic analogue of the
 * `acceptedEnumValues` whitelist. `accepted` is the live set of canonical
 * workspace package ids (from `PatternGraphAPI.listPackages()`), an UNSCOPED
 * config-declared key such as `architect-core`. Returns `value` when it is in
 * the accepted set, else throws an error enumerating the accepted set — so the
 * scoped `@libar-dev/...` form and a display name both fail loud (No-BC: the
 * scoped form is rejected, not aliased). Shared by `arch packages`, `list`, and
 * `rules` so the rejection message is identical across all three surfaces.
 */
export function resolvePackageFilter(accepted: readonly string[], value: string): string {
  if (accepted.includes(value)) {
    return value;
  }
  throw new Error(
    `--package: invalid value ${JSON.stringify(value)}. Accepted: ${[...accepted].sort().join(', ')}`,
  );
}

/**
 * Fail-loud resolver for the `--decision` filter — the decision analogue of
 * `resolvePackageFilter`. Accepts any decision-reference form the kernel
 * recognizes (canonical pattern name `ADR009ProjectionTrustBoundary`, human ADR
 * id `ADR-009` / `ADR009` / `009`) and returns the canonical decision pattern
 * NAME so the projection's decision scope matches on a single normalized key.
 * An unmatched value throws an error enumerating the accepted decisions — never
 * a silent empty result (No-BC: a typo fails loud, it is not aliased away).
 */
export function resolveDecisionFilter(graph: PatternGraph, value: string): string {
  const resolved = resolveDecisionPattern(graph, value);
  if (resolved !== undefined) {
    return getPatternName(resolved);
  }
  const accepted = listDecisionPatterns(graph).map(getPatternName);
  throw new Error(
    `--decision: invalid value ${JSON.stringify(value)}. Accepted: ${[...accepted].sort().join(', ')}`,
  );
}

/**
 * Fail-loud resolver for the `--product-area` filter — the product-area analogue
 * of `resolvePackageFilter`. The accepted set is the graph's `byProductArea`
 * keys; matching is case-insensitive (the projection scope-match lowercases both
 * sides) and the canonical key is returned. An unmatched value throws an error
 * enumerating the accepted areas — never a silent empty result (No-BC: a typo
 * fails loud, it is not swallowed as zero rules).
 */
export function resolveProductAreaFilter(graph: PatternGraph, value: string): string {
  const accepted = Object.keys(graph.byProductArea);
  const match = accepted.find((area) => area.toLowerCase() === value.toLowerCase());
  if (match !== undefined) {
    return match;
  }
  throw new Error(
    `--product-area: invalid value ${JSON.stringify(value)}. Accepted: ${[...accepted].sort().join(', ')}`,
  );
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

/**
 * Boundary parser for the consumer-facing status FILTER vocabulary used by
 * `list --status` (and its MCP twin). Distinct from `parseAcceptedStatusValue`
 * (authored-tag validator) and `parseProcessStatusValue` (FSM transition
 * validator): the filter set additionally accepts the normalized bucket word
 * `planned` (roadmap ∪ deferred), so every word an agent reads in `overview` /
 * `getStatusDistribution` is a legal filter. `parseSchemaValue` auto-enumerates
 * the six accepted words on a typo so the error self-documents the bridge.
 */
export function parseStatusFilterValue(value: string): StatusFilterValue {
  return parseSchemaValue(
    StatusFilterSchema,
    value,
    `Expected status filter value, received: ${value}`,
  );
}

export function parseProcessStatusValue(value: string): ProcessStatusValue {
  return parseSchemaValue(
    ProcessStatusSchema,
    value,
    `Expected process status value, received: ${value}`,
  );
}

export function parseNormalizedStatusValue(value: string): NormalizedStatus {
  return parseSchemaValue(
    NormalizedStatusSchema,
    value,
    `Expected normalized status value (one of ${NORMALIZED_STATUS_VALUES.join(', ')}), received: ${value}`,
  );
}

export function parseRenderFormatValue(value: string): z.infer<typeof RenderFormatSchema> {
  return parseSchemaValue(RenderFormatSchema, value, '--format must be compact or json');
}

export function parseContentRichnessValue(value: string): ContentRichness {
  return parseSchemaValue(
    ContentRichnessSchema,
    value,
    '--richness must be name-only, summary, summary-with-references, or full',
  );
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
