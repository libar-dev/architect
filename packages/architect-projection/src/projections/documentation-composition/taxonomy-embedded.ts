/**
 * @architect
 * @architect-pattern TaxonomyEmbeddedShapesProjection
 * @architect-status active
 * @architect-implements TaxonomyDocumentationCluster
 * @architect-role:projection
 * @architect-product-area:Generation
 * @architect-bounded-context:documentation-composition
 * @architect-uses TaxonomyDigestProjection, EmissionDescriptor
 * @architect-enforces-decision ADR010DocumentationCompositionHelpers
 *
 * Taxonomy embedded-region shapes — the two `embedded-region` emissions of the
 * single `TaxonomyDigest` View (cluster `TaxonomyDocumentationCluster`). Each is
 * the SAME digest the reference (`docs-live/TAXONOMY.md`) and live-API context
 * project from, routed into marker-bounded regions of a hand-authored host file:
 *
 * - **Skill** (`.agents/skills/architect-base/references/taxonomy.md`): two small
 *   regions — `taxonomy-role-enum` (the canonical role values) and
 *   `taxonomy-tag-count` (the live registry counts) — the facts the skill
 *   previously hand-restated, so they can no longer drift (`MultiSourceComposition`).
 * - **Formal-spec** (`formal-spec/04-tag-registry.md`): the `Classification`
 *   function-group region (`taxonomy-classification`) — the RFC's normative
 *   Classification table generated from the digest instead of hand-restated.
 *
 * This module owns the routing — which host, which `source` → which `regionId`
 * (DD-6) — and parses the `EmissionDescriptor` at the single trust boundary
 * (`EmissionDescriptorSchema.parse`), so path containment and region-id uniqueness
 * are enforced once here. It does NOT render markdown (that would invert the
 * renderer→projection layering); the CLI renders each region's body via
 * `renderTaxonomyManagedRegion` and writes it through the managed-region engine.
 *
 * The formal-spec RFC groups tags by FUNCTION (Core Identity, Classification, …),
 * whereas the digest groups by DOMAIN bucket (`Core Tags`, `Architecture Tags`,
 * `PRD Tags`, …). A function group is therefore an audience-shaped View read that
 * gathers tags across digest buckets (epic "Resolved direction (2026-06-05)"): the
 * `classification` source pulls `role` + `bounded-context` (Architecture bucket)
 * and `product-area` (PRD bucket) into one canonical enumeration table, with the
 * `Required` column projected from the registry's `required` flag (a source fact,
 * not hand-authored modality) so the WHOLE row is generated. The function-group
 * selection lives in {@link TAXONOMY_FUNCTION_GROUPS}; the renderer resolves it.
 *
 * PROOF = MINIMUM GENERATION (cluster spec): only the `Classification` function
 * group is wired end-to-end; the rest of the RFC stays authored until the seam is
 * proven. A spec-canonical tag the digest does NOT emit (`arch-layer`) stays an
 * authored note OUTSIDE the region and surfaces as a reviewable diff — it is not in
 * {@link TAXONOMY_CLASSIFICATION_TAGS}.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import {
  EmissionDescriptorSchema,
  type EmbeddedRegionTarget,
} from '../../fragments/emission-descriptor.js';
import type { TaxonomyDigest } from '../../fragments/governance/index.js';
import { projectTaxonomyDigest } from '../governance/taxonomy-digest.js';

/** Region `source` selecting the canonical role-value enum from the digest. */
export const TAXONOMY_ROLE_ENUM_SOURCE = 'role-enum';
/** Region `source` selecting the live registry counts from the digest. */
export const TAXONOMY_TAG_COUNT_SOURCE = 'tag-count';
/**
 * Region `source` selecting the formal-spec `Classification` function group — a
 * cross-bucket read (see {@link TAXONOMY_FUNCTION_GROUPS}).
 */
export const TAXONOMY_CLASSIFICATION_SOURCE = 'classification';

/**
 * Region `source` selecting the formal-spec `Relationships` function group — the
 * second function group, a single-bucket read (all four tags live in the digest's
 * Relationship Tags bucket; see {@link TAXONOMY_FUNCTION_GROUPS}).
 */
export const TAXONOMY_RELATIONSHIPS_SOURCE = 'relationships';

/**
 * The metadata tags the formal-spec `Classification` function group enumerates, in
 * RFC order. These live in DIFFERENT digest domain buckets — `product-area` in PRD
 * Tags, `bounded-context` + `role` in Architecture Tags — so the function group is
 * an audience-shaped View read across buckets, not one bucket surfacing unchanged.
 *
 * `arch-layer` is deliberately ABSENT: the formal-spec calls it canonical, but the
 * reference registry does not project it into the digest (only `adr-layer` is
 * registered). Per the cluster's starting rule the generated region emits only the
 * digest-emitted set, so `arch-layer` stays an authored note outside the region and
 * surfaces as a reviewable diff rather than silent divergence.
 */
export const TAXONOMY_CLASSIFICATION_TAGS = ['product-area', 'bounded-context', 'role'] as const;

/**
 * The metadata tags the formal-spec `Relationships` function group enumerates, in RFC
 * order. Unlike `Classification` these all live in ONE digest bucket (Relationship
 * Tags), so the function group here is a single-bucket selection rather than a
 * cross-bucket gather — and it deliberately SUBSETS that bucket: the digest carries
 * `enforces-decision` too, but the RFC's v0.2.0 canonical authored relationship set is
 * these four, so the selection drops `enforces-decision`. That a function group can
 * subset a bucket (not only gather across buckets) is the audience-read lever working.
 */
export const TAXONOMY_RELATIONSHIPS_TAGS = ['uses', 'implements', 'extends', 'see-also'] as const;

/**
 * Function-group selections: a `source` routing key → the ordered tag names the
 * group gathers across digest domain buckets. The renderer
 * (`renderTaxonomyManagedRegion`) resolves a `source` against this map before
 * falling back to a single digest domain bucket, and renders the gathered entries
 * as one canonical enumeration table. This is where the RFC's "group by function"
 * audience read is defined — the digest's own grouping is by domain bucket.
 */
export const TAXONOMY_FUNCTION_GROUPS: Readonly<Record<string, readonly string[]>> = {
  [TAXONOMY_CLASSIFICATION_SOURCE]: TAXONOMY_CLASSIFICATION_TAGS,
  [TAXONOMY_RELATIONSHIPS_SOURCE]: TAXONOMY_RELATIONSHIPS_TAGS,
};

/** Skill host — lives outside `docs-live/`, carries authored teaching prose. */
const SKILL_HOST_FILE = '.agents/skills/architect-base/references/taxonomy.md';

/** Formal-spec RFC host — lives outside `docs-live/`, carries normative prose. */
const FORMAL_SPEC_HOST_FILE = 'formal-spec/04-tag-registry.md';

/** Static generator name for the skill embedded shape. */
export const TAXONOMY_SKILL_GENERATOR = 'taxonomy-skill';

/** Static generator name for the formal-spec embedded shape. */
export const TAXONOMY_FORMAL_SPEC_GENERATOR = 'taxonomy-formal-spec';

/**
 * Static manifest of the embedded-region generators — name, description, and host
 * file known WITHOUT the graph, so the CLI can list them, resolve `-g <name>`, and
 * include them in `--all` before the pattern graph is built. The region routing is
 * dynamic (planned from the live digest in {@link projectTaxonomyEmbeddedShapes}).
 */
export interface TaxonomyEmbeddedGeneratorInfo {
  readonly name: string;
  readonly description: string;
  readonly hostFile: string;
}

export const TAXONOMY_EMBEDDED_GENERATORS: readonly TaxonomyEmbeddedGeneratorInfo[] = [
  {
    name: TAXONOMY_SKILL_GENERATOR,
    description: 'Generate the taxonomy skill reference regions (role enum + registry counts)',
    hostFile: SKILL_HOST_FILE,
  },
  {
    name: TAXONOMY_FORMAL_SPEC_GENERATOR,
    description: 'Generate the formal-spec RFC Classification function-group region',
    hostFile: FORMAL_SPEC_HOST_FILE,
  },
];

/**
 * The stable kebab `source`/`regionId` slug for a digest tag-group (`'Core Tags'`
 * → `'core-tags'`). Shared with the renderer so a region's `source` resolves back
 * to its group; the formal-spec marker ids are `taxonomy-<slug>`.
 */
export function taxonomyGroupSource(groupName: string): string {
  return groupName
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

/** A planned embedded shape: a validated host + the routed region set + its digest. */
export interface TaxonomyEmbeddedShape {
  /** Generator name the CLI registers (`taxonomy-skill` / `taxonomy-formal-spec`). */
  readonly generatorName: string;
  readonly description: string;
  /** Validated repo-relative host `.md` path (from the parsed descriptor). */
  readonly hostFile: string;
  /** Routed regions: each `source` selects a digest slice into a host `regionId`. */
  readonly regions: readonly EmbeddedRegionTarget[];
  /** The single digest the regions render from (the sink-agnostic View). */
  readonly digest: TaxonomyDigest;
}

function buildEmbeddedShape(
  generatorName: string,
  description: string,
  hostFile: string,
  regions: readonly { source: string; regionId: string }[],
  digest: TaxonomyDigest,
): TaxonomyEmbeddedShape {
  // Parse-once trust boundary (DD-7): path containment + region-id uniqueness are
  // enforced here; downstream consumers receive an already-validated descriptor.
  const descriptor = EmissionDescriptorSchema.parse({
    mode: 'embedded-region',
    hostFile,
    regions: regions.map((region) => ({ source: region.source, regionId: region.regionId })),
  });
  if (descriptor.mode !== 'embedded-region') {
    throw new Error('taxonomy embedded shape must be an embedded-region descriptor');
  }
  return {
    generatorName,
    description,
    hostFile: descriptor.hostFile,
    regions: descriptor.regions,
    digest,
  };
}

/** Plan the routed regions for one embedded generator from the live digest. */
function planRegions(
  generatorName: string,
  _digest: TaxonomyDigest,
): readonly { source: string; regionId: string }[] {
  if (generatorName === TAXONOMY_SKILL_GENERATOR) {
    return [
      { source: TAXONOMY_ROLE_ENUM_SOURCE, regionId: 'taxonomy-role-enum' },
      { source: TAXONOMY_TAG_COUNT_SOURCE, regionId: 'taxonomy-tag-count' },
    ];
  }
  if (generatorName === TAXONOMY_FORMAL_SPEC_GENERATOR) {
    // Two function groups wired: `Classification` (cross-bucket gather) and
    // `Relationships` (single-bucket subset). Both are tag-row-shaped content the
    // digest supplies; the RFC's non-tag-row content (relationship direction/blocks
    // semantics, the status→maturity mapping) stays authored — the function-group
    // abstraction's ceiling. Each region is an independent digest selection (DD-6).
    return [
      { source: TAXONOMY_CLASSIFICATION_SOURCE, regionId: 'taxonomy-classification' },
      { source: TAXONOMY_RELATIONSHIPS_SOURCE, regionId: 'taxonomy-relationships' },
    ];
  }
  throw new Error(`Unknown taxonomy embedded generator: ${generatorName}`);
}

/**
 * Plan the taxonomy cluster's embedded-region shapes from the live digest. Pass
 * `generatorNames` to materialize a subset (the CLI's `-g`/default selection);
 * omit it for all shapes (`--all`). Returns the validated host + routed regions
 * for each; the CLI renders the bodies and writes them through the managed-region
 * engine.
 */
export function projectTaxonomyEmbeddedShapes(
  context: ProjectionContext,
  generatorNames?: readonly string[],
): readonly TaxonomyEmbeddedShape[] {
  const digest = projectTaxonomyDigest(context).root;
  const selected =
    generatorNames === undefined
      ? TAXONOMY_EMBEDDED_GENERATORS
      : TAXONOMY_EMBEDDED_GENERATORS.filter((info) => generatorNames.includes(info.name));

  return selected.map((info) =>
    buildEmbeddedShape(
      info.name,
      info.description,
      info.hostFile,
      planRegions(info.name, digest),
      digest,
    ),
  );
}
