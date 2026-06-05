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
 *
 * This module owns the routing — which host, which `source` → which `regionId`
 * (DD-6) — and parses the `EmissionDescriptor` at the single trust boundary
 * (`EmissionDescriptorSchema.parse`), so path containment and region-id uniqueness
 * are enforced once here. It does NOT render markdown (that would invert the
 * renderer→projection layering); the CLI renders each region's body via
 * `renderTaxonomyManagedRegion` and writes it through the managed-region engine.
 *
 * NOT YET WIRED — the formal-spec shape (`formal-spec/04-tag-registry.md`). The
 * formal-spec RFC groups tags by FUNCTION (Core Identity, Classification, …) with
 * normative modality (`MUST`/`SHOULD`) in its tables, whereas the digest groups by
 * domain bucket (`Core Tags`, `Relationship Tags`, …) with a boolean `Required`.
 * The design is RESOLVED (epic "Resolved direction (2026-06-05)"): modality is a
 * projected source fact (the required-ness in the guard's tier checks + the
 * registry's `required` flags, projected into the digest so the whole row is
 * generated), the RFC's function grouping is an audience-shaped View read over the
 * one digest, and projecting modality dissolves the marker column-span problem.
 * Remaining work is an implement session on ONE proof slice (the `Classification`
 * function group wired end-to-end), not a design call. The capability it builds on
 * — per-group table rendering (`renderTaxonomyManagedRegion` group branch) and
 * N-regions-per-host writing — is built and tested.
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

/** Skill host — lives outside `docs-live/`, carries authored teaching prose. */
const SKILL_HOST_FILE = '.agents/skills/architect-base/references/taxonomy.md';

/** Static generator name for the skill embedded shape. */
export const TAXONOMY_SKILL_GENERATOR = 'taxonomy-skill';

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
