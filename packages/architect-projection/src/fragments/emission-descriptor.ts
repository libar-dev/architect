/**
 * @architect
 * @architect-pattern EmissionDescriptor
 * @architect-status active
 * @architect-role:contract
 * @architect-product-area:Generation
 * @architect-bounded-context:documentation-composition
 * @architect-implements TaxonomyDocumentationCluster
 * @architect-enforces-decision ADR010DocumentationCompositionHelpers
 *
 * Emission descriptor — the sink-side half of the `BundleRouting` split
 * (epic DocumentationProjection, "Resolved direction (2026-06-04) — emission mode").
 *
 * WHY THIS SHAPE
 * A View (Select × Shape × Audience) is pure and sink-agnostic. Everything that
 * is *sink-specific* — where the rendered bundle is written and in what mode —
 * moves OFF `BundleRouting` (which keeps only logical routing + `disclosureSpec`)
 * and ONTO this descriptor. This is the No-BC split the epic's rule
 * "A generated document is one emission of a sink-agnostic view" mandates; the
 * hand-written `isRoutingLike` guard (`fragments/base.ts`) is DELETED, not aliased.
 *
 * DD-1 (guard → Zod). Resolved to Zod under the Zod-first boundary doctrine — a
 * `discriminatedUnion` of `strictObject` variants. `isRoutingLike` already delegated
 * to `DisclosureSpecSchema.safeParse`, so this consolidates a half-Zod contract
 * rather than introducing Zod where there was none. Extra properties MUST fail
 * (`strictObject` variants), never silently pass — this is a generation-config trust boundary.
 *
 * DD-2 (emission mode is a discriminated union). `whole-artifact` needs only a
 * file target; `embedded-region` additionally REQUIRES a host file + at least one
 * region (host `.md` + ≥1 marker-bounded region) and is the only mode that may
 * write inside an authored file. The discriminant makes "an embedded shape with no
 * region" unrepresentable; `regions.min(1)` makes "a host with zero regions" unrepresentable.
 *
 * DD-3 (no content framework — the ADR-010 guard). The descriptor names a *write
 * target*, never a content tree. The region's content is still a fragment bundle
 * from the shared block renderer (ADR-010). Adding a composition DSL here is the
 * smuggling path the emission-mode gating question explicitly forbids — do not.
 *
 * DD-4 (the descriptor is the OPTIONAL file-sink overlay — sink-agnosticism lives
 * on the View, not on a mode). The View/bundle is the sink-agnostic thing
 * (`projectTaxonomyDigest` returns `projectSingle` — no routing at all). The emission
 * descriptor is applied OPTIONALLY (`emission?: EmissionDescriptor` on the View); its
 * ABSENCE is the baseline — the bundle handed to the API/MCP consumer or the Studio
 * view-state sink, with no markdown shape whatsoever. So `whole-artifact` is NOT a
 * sink-agnostic universal mode (the earlier overfit): it is specifically "write the
 * whole bundle to a `.md` file", sitting beside `embedded-region` as the two
 * markdown-file placements a PRESENT descriptor selects. The cluster proves it: the
 * live-API taxonomy context carries NO descriptor; `docs-live/TAXONOMY.md` is the
 * same View plus a whole-artifact descriptor.
 *
 * DD-5 (preserve the `.md` contract — reuse, don't fork). A whole-artifact
 * descriptor's markdown-file route carries the SHIPPED `.md` output contract forward:
 * `rootTarget` keeps the suffix rule already on `architect-projection`'s
 * `documentation-type-registry.ts` + the `${string}.md` template type at
 * `documentation-type-registry.output-routing.ts` — a relaxed `z.string().min(1)` WEAKENS
 * it to accept a non-`.md` filename. This descriptor is the single re-home for the routing
 * fields the registry inlines today (per GoalOrientedNavigation), so the `.md` contract is
 * defined ONCE here — the no-duplication thesis (`MultiSourceComposition`) applied to the
 * descriptor itself, not only to the documents it emits. Adding repo-relative containment
 * to `rootTarget` strengthens, rather than weakens, DD-5's intent; when output-routing
 * re-homes onto this descriptor, the registry's own `.md$` rule should tighten to this full
 * trust-boundary contract instead of carrying a parallel looser rule.
 *
 * DD-6 (one host, many regions — routing, not composition). An embedded host carries N
 * marker-bounded regions, each fed by a distinct digest selection (formal-spec: one region per
 * tag-group; skill: one per fact). The descriptor models this as a `regions[]` ROUTING MAP
 * (`source` → `regionId`) — the embedded analog of a whole-artifact child route — never per-region
 * content config (DD-3 / ADR-010 hold: a region names WHERE a selection lands, not WHAT it is).
 * This assumes the digest is exposed as a routed bundle whose children are the selectable
 * groups/facts (the natural fit with doc-gen's one-View → one-descriptor wiring); whether that
 * slicing is a routed multi-child bundle or dedicated per-selection sub-Views is the lone
 * implement-time choice — the contract pins the cardinality (N regions per host) so the spec
 * stops contradicting itself. The schema enforces `regionId` uniqueness within a host (a
 * `regions[]` `.superRefine`): two `source`s targeting one `regionId` is rejected, not
 * silently last-write-wins.
 *
 * DD-7 (descriptor path containment belongs at the parse-once trust boundary). Every
 * path-bearing field the descriptor names — embedded `hostFile`, whole-artifact `rootTarget`,
 * and the child/entity route `childDirectory` — MUST be a normalized repo-relative path:
 * no absolute roots, `~`, Windows drive roots, backslashes, or empty / `.` / `..` path
 * segments. `rootTarget` and `hostFile` additionally MUST be `.md` paths; `childDirectory`
 * is a directory and carries no suffix rule. Path containment is a property of the descriptor
 * trust boundary, not one emission mode. The schema rejects escape paths before any write; the
 * implement-time writer re-checks the resolved path stays inside the repo as defense in depth.
 *
 * NOT IN SCOPE (implementation, not contract shape): the renderer, the markdown
 * marker-scan that locates the begin/end sentinels, and the drift/diff runner
 * (that is the determinism gate, extended into the region).
 */
import { z } from 'zod';

const RepoRelativePathMessage =
  'descriptor path must be normalized and repo-relative (no absolute paths, ~ roots, Windows drive roots, backslashes, empty segments, . segments, or .. traversal segments)';

export const MarkdownFilePathSchema = z
  .string()
  .regex(/\.md$/u, 'markdown file target must end in .md');

export const RepoRelativePathSchema = z.string().superRefine((value, ctx) => {
  const segments = value.split('/');
  const hasWindowsDriveRoot = /^[A-Za-z]:/u.test(value);
  const hasUnnormalizedSegment = segments.some(
    (segment) => segment === '' || segment === '.' || segment === '..',
  );

  if (
    value.startsWith('/') ||
    value.startsWith('~') ||
    hasWindowsDriveRoot ||
    value.includes('\\') ||
    hasUnnormalizedSegment
  ) {
    ctx.addIssue({
      code: 'custom',
      message: RepoRelativePathMessage,
    });
  }
});
export type RepoRelativePath = z.infer<typeof RepoRelativePathSchema>;

export const RepoRelativeMarkdownPathSchema = RepoRelativePathSchema.and(MarkdownFilePathSchema);
export type RepoRelativeMarkdownPath = z.infer<typeof RepoRelativeMarkdownPathSchema>;

/**
 * One managed region inside the host file — a routing entry, NOT a content tree (DD-3): it pairs
 * the digest selection that feeds the region (`source`) with the stable `regionId` whose begin/end
 * markdown-comment sentinels bound the generated span:
 *   <!-- architect:gen <regionId> begin -->  …generated…  <!-- architect:gen <regionId> end -->
 * Generation writes ONLY between the sentinels; everything else is authored voice. This is the
 * embedded analog of a whole-artifact child route (DD-6) — it names WHERE a selection lands, never
 * WHAT it contains. Region identity is `(hostFile, regionId)` (S2): `regionId` is unique within its
 * host; the marker scan is host-scoped, so the same slug may legitimately recur in a different host.
 */
export const EmbeddedRegionTargetSchema = z.strictObject({
  /** The digest selection routed into this region — the route id of the bundle child the region
   *  renders (formal-spec: one per tag-group, e.g. `core-identity`; skill: one per fact, e.g.
   *  `role-enum` / `tag-count`). A routing key, not content (DD-3 / ADR-010). */
  source: z.string().regex(/^[a-z0-9-]+$/u, 'source is a lowercase kebab route id'),
  /** Stable region id; the begin/end markers are derived from it. Unique within `hostFile`. */
  regionId: z.string().regex(/^[a-z0-9-]+$/u, 'regionId is a lowercase kebab slug'),
});
export type EmbeddedRegionTarget = z.infer<typeof EmbeddedRegionTargetSchema>;

/**
 * Markdown-file sink route profile — the file-system specifics that today live inline on BOTH
 * `BundleRouting` (`fragments/base.ts`) and `SupportedDocumentationTypeRegistryEntrySchema`
 * (`documentation-type-registry.ts`). This is ONE sink's profile, not the definition of
 * whole-artifact emission: it applies only when a descriptor is present and writes to the
 * markdown-file sink; the live-API/MCP-bundle and Studio view-state sinks carry no descriptor.
 *
 * It carries the EXISTING `.md` output contract forward (DD-5) — `rootTarget` keeps the shipped
 * suffix rule, never a relaxed `z.string().min(1)`, and every descriptor path-bearing field adds
 * the repo-relative containment constraint at the parse-once boundary (DD-7). Per
 * GoalOrientedNavigation the registry's output-routing axis re-homes onto this schema, so the
 * three routing fields are defined here ONCE rather than forked across two surfaces.
 */
export const MarkdownFileRouteSchema = z.strictObject({
  /** Root document filename — MUST be a normalized repo-relative `.md` path (e.g.
   *  `docs-live/TAXONOMY.md`). Same suffix rule as the shipped registry schema; `.min(1)` would
   *  weaken it. (Former `BundleRouting.markdownRootTarget`.) */
  rootTarget: RepoRelativeMarkdownPathSchema,
  /** Child directory for entity/child routes; falls back to documentType when omitted.
   *  A normalized repo-relative directory path, not a `.md` file target. */
  childDirectory: RepoRelativePathSchema.optional(),
  /** `nested-index` → `${dir}/${slug}/INDEX.md`; otherwise flat `${dir}/${slug}.md`. */
  entityPathLayout: z.enum(['flat', 'nested-index']).optional(),
});
export type MarkdownFileRoute = z.infer<typeof MarkdownFileRouteSchema>;

/**
 * Mode `whole-artifact`: write the whole bundle to a markdown file. This is a markdown-FILE
 * placement, not a sink-agnostic universal mode (DD-4) — the sink-agnostic case is a View with
 * NO descriptor (the bundle handed to the API/MCP or view-state sink). `markdownFileRoute` is
 * therefore REQUIRED here: a whole-artifact descriptor always names the `.md` file it writes.
 */
export const WholeArtifactEmissionSchema = z.strictObject({
  mode: z.literal('whole-artifact'),
  markdownFileRoute: MarkdownFileRouteSchema,
});

/**
 * Mode `embedded-region`: the rendered bundle's selections occupy marker-bounded regions inside ONE
 * host `.md` file. A host carries N regions (DD-6) — the formal-spec shape needs one region per
 * digest tag-group (Core Identity, Classification, Relationships, ADR, Hierarchy, …) and the skill
 * shape needs two (`taxonomy-role-enum`, `taxonomy-tag-count`) — so `regions` is a list (≥1), the
 * embedded analog of whole-artifact's child routing. `hostFile` lives here once, not per region.
 */
export const EmbeddedRegionEmissionSchema = z.strictObject({
  mode: z.literal('embedded-region'),
  /** Host markdown file all the regions live in (authored prose, never wholesale-generated);
   *  a normalized repo-relative `.md` path. Same descriptor file-target contract as a
   *  whole-artifact `rootTarget` (DD-5 / DD-7). */
  hostFile: RepoRelativeMarkdownPathSchema,
  /** One entry per managed region in the host; each routes a digest selection → a marker region.
   *  At least one. Region ids are unique within the host (`(hostFile, regionId)` identity, S2). */
  regions: z
    .array(EmbeddedRegionTargetSchema)
    .min(1)
    // regionId is unique within a host — `(hostFile, regionId)` identity (S2) — enforced here so a
    // routing map with two sources targeting one region is rejected, not silently last-write-wins.
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.regionId)) {
          ctx.addIssue({
            code: 'custom',
            message: `duplicate regionId "${item.regionId}" — region identity is (hostFile, regionId); each region in a host must be unique`,
            path: [index, 'regionId'],
          });
        }
        seen.add(item.regionId);
      });
    }),
});

/**
 * The emission descriptor: the OPTIONAL file-sink overlay split off `BundleRouting`. Applied as
 * `emission?: EmissionDescriptor` on a View — a View with NO descriptor is the sink-agnostic
 * baseline (the bundle handed to the API/MCP consumer today, the Studio view-state sink tomorrow);
 * a PRESENT descriptor writes the bundle to a markdown file as one of the two placements below.
 * `BundleRouting` retains rootRouteId / childRouteIds / childPathStrategy / anchorStrategy /
 * disclosureSpec (logical, sink-agnostic); those do NOT appear here.
 */
export const EmissionDescriptorSchema = z.discriminatedUnion('mode', [
  WholeArtifactEmissionSchema,
  EmbeddedRegionEmissionSchema,
]);
export type EmissionDescriptor = z.infer<typeof EmissionDescriptorSchema>;
