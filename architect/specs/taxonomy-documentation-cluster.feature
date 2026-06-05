@architect
@architect-pattern:TaxonomyDocumentationCluster
@architect-status:roadmap
@architect-product-area:Generation
@architect-parent:DocumentationProjection
@architect-uses:TaxonomyDigestProjection
@architect-see-also:ADR010DocumentationCompositionHelpers,OneSourceMultipleAudiences,MultiSourceComposition
@architect-executable-specs:packages/architect-projection/tests/features/projections/documentation-composition/taxonomy-cluster.feature
Feature: TaxonomyDocumentationCluster - the MVP proof-point: one taxonomy source, many audience-shaped documents

  **User Story:** As the maintainer building universal documentation generation, I want the taxonomy documents to be generated as one family from the single tag-registry source — a skill shape, a full reference enumeration, a normative formal-spec shape, and the live-API taxonomy context — so that this cluster validates the shared generation machinery (partial-overlap composition + per-audience progressive disclosure, no duplication) before any further document type is built.

  **Why this cluster first:** the source already generates `docs-live/TAXONOMY.md`, the audience verbosities are clear, and the cross-document drift is documented — the lowest-risk place to prove the machinery. Resulting documents need not preserve their current shapes byte-for-byte; they must carry the information and stay usable.

  **The drift this kills (live evidence, why the proof-point is real):** the four taxonomy surfaces already disagree because two are hand-authored. `docs-live/TAXONOMY.md` (generated via `projectTaxonomyDigest`) enumerates the live registry — 8 roles, 22 metadata tags incl. `shape`/`executable-specs`/`level`/`parent`, 3 aggregation tags. `formal-spec/04-tag-registry.md` (hand-authored) describes a *different* idealized set: it lists `@architect-arch-layer` (absent from the live registry), omits `shape`/`executable-specs`, marks whole groups "Removed — custom", and lands a different count. The skill `references/taxonomy.md` (hand-authored) is closest to right — it teaches the model and links live for the full enumeration rather than reproducing it — but it still **hand-restates the 8-value role enum** in prose, a generatable fact that currently matches the registry yet can silently drift; the generated skill shape preserves its link-for-the-rest template while emitting that role enum (and the live count) from the digest. Generating the two enumerations from the one registry, and the skill's role enum, turns this silent rot into a determinism-gate diff.

  **The cluster (one source → many shapes):** source = the tag registry (`architect-core`), reused through the shipped `TaxonomyDigestProjection` (`projectTaxonomyDigest`); the cluster never calls the registry builder directly, it reads the digest. Targets:
  - `.agents/skills/architect-base/references/taxonomy.md` — skill shape: the model + a link to live data, not the full enumeration.
  - `docs-live/TAXONOMY.md` — reference shape: the full enumerated tag tables.
  - `formal-spec/04-tag-registry.md` — spec shape: the enumeration inside normative prose.
  - the live-API taxonomy context that travels with `architect:query taxonomy` output.

  **Reuse basis (ADR-010):** the reference and live-API shapes already ship via `TaxonomyDigestProjection` (`projectTaxonomyDigest`, the flat `projectSingle` catalog). The two unbuilt audience shapes (skill, formal-spec) are added on the same single-source basis through per-audience progressive disclosure — no new framework, no facet helper (the cluster is single-slice; `buildFacetBundle` is not required and remains unratified, see the epic's composition-basis gating question).

  **Emission design (applies the epic's "Resolved direction (2026-06-04) — emission mode"):** the sink-agnostic `TaxonomyDigest` View (`projectSingle`, no routing) is emitted three ways, which is the whole reason this cluster is the emission-mode proof-point. The emission descriptor is the **optional file-sink overlay** the doc-gen pipeline applies; a View with no descriptor is the baseline:
  - **No descriptor — the sink-agnostic baseline (shipped):** the live-API taxonomy context (`architect:query taxonomy`) is the `TaxonomyDigest` View handed to the API/MCP consumer with **no emission descriptor at all** — no file, no markdown shape. This is the proof that the View is sink-agnostic and `whole-artifact` is not a privileged universal mode; the Studio view-state sink is the same no-descriptor case.
  - **Whole-artifact, markdown-file sink (shipped):** `docs-live/TAXONOMY.md` is the *same* View plus a whole-artifact file descriptor (the `.md` route, applied at doc-gen from the registry output-routing). The rendered bundle is written as the entire `.md` file; the determinism gate (`docs:all && git diff`) is the entire drift contract.
  - **Embedded-region, markdown-file sink (the two new shapes):** the skill `references/taxonomy.md` and the normative `formal-spec/04-tag-registry.md` — both host-authored `.md` files. Each generates only **between markdown-comment marker sentinels** inside its host `.md` file; everything outside the markers is authored voice the projection never writes. **A single host carries one or more regions:** the descriptor's `embedded-region` emission is a `regions[]` **routing map** (`source` → `regionId`, the embedded analog of whole-artifact child routing — DD-6), so each digest selection lands in its own marker-bounded span; region identity is `(hostFile, regionId)` and the marker scan is **host-scoped**, so the same `regionId` slug may recur in a different host. The sentinels are derived from a kebab `regionId` per the stub's `EmbeddedRegionTargetSchema` — `<!-- architect:gen <regionId> begin -->` … `<!-- architect:gen <regionId> end -->` — and generation rewrites only the inter-sentinel span under the **normalization contract** (Rule "Region rewrites are byte-deterministic" below): LF line endings, exactly one blank line surrounding the generated content inside each sentinel pair, and the host file's final newline preserved. The determinism gate extends into every region (regenerate region, diff), so a hand-edit inside the markers fails the gate while the authored voice changes freely.
    - *Skill shape:* the host file stays authored prose teaching the three axes and tag categories; the only generated regions are the *facts that can drift* — today the skill **hand-restates the 8-value role enum** (the code block under "The role enum is closed") and **links out for the count**. Both become small generated regions emitted from the digest, not hand-restated (`MultiSourceComposition`): `taxonomy-role-enum` (the canonical role values) and `taxonomy-tag-count` (the live metadata-tag count). The skill deliberately does NOT embed the full enumeration; its regions are small by design (`OneSourceMultipleAudiences`: agent-context budget).
    - *Formal-spec shape:* the generated region(s) are the **canonical enumeration tables** (per-tag format · required · repeatable · values · example) drawn from the digest — one region per digest-emitted group (Core Identity, Classification, Relationships, ADR, Hierarchy, …); the authored voice is the normative modality (MUST/SHOULD/MAY), the conformance prose, and the editorial "informative / removed-in-v0.2.0" classification. The entirely-removed groups (Planning, Product & Business, Discovery, Release) carry no digest-emitted tag, so they stay **wholly authored, outside any region**. The generated region narrows toward exactly the digest-emitted set, so a tag the spec calls canonical but the digest does not emit (today: `arch-layer`) surfaces as a reviewable diff instead of silent divergence (boundary rule in Open Questions).

  **Stubs:** one — `architect/stubs/taxonomy-documentation-cluster/emission-descriptor.ts` — the single genuinely-new contract shape (the `BundleRouting` split: emission descriptor as a Zod `discriminatedUnion` of the two markdown-file placements — `whole-artifact` | `embedded-region` — applied **optionally** on a View, so a View with no descriptor is the non-file-sink baseline (API/MCP, Studio view-state)). Its markdown-file route profile carries the **shipped `.md` output contract forward** (`rootTarget` keeps the suffix rule already on `architect-projection`'s `projections/documentation-composition/documentation-type-registry.ts:42` plus the `${string}.md` template type at the sibling `documentation-type-registry.output-routing.ts:7` — never a relaxed non-empty string) and strengthens every descriptor path-bearing field (`rootTarget`, embedded `hostFile`, and child-route `childDirectory`) to the same normalized repo-relative containment contract at the parse-once trust boundary. `rootTarget` and `hostFile` additionally require `.md`; `childDirectory` is a directory and carries no suffix rule. That additive containment rule means the registry's own `.md$` rule should tighten to the descriptor's full contract when output-routing re-homes here, rather than carrying a parallel looser rule. The profile still **unifies the two routing-field names that diverge today** — `BundleRouting.markdownChildDirectory` (`architect-projection`'s `fragments/base.ts`) vs the registry's `childDirectory`, and `markdownRootTarget` vs the descriptor's `rootTarget` — so the markdown-file contract is defined once. (The third file-sink field, `entityPathLayout`, is already named consistently across `BundleRouting`, the registry, and the descriptor, so it is carried forward unchanged — only two of the three are renamed.) The descriptor is the **target** the registry's output-routing axis re-homes onto *later* (owned by `GoalOrientedNavigation` — a prerequisite-of relationship, not a dependency: this cluster builds the descriptor and the single injector that feeds it, `architect-projection`'s `documentation-bundle.internal.ts`, and leaves the registry schema untouched). The shape data (tag names, counts, per-tag metadata) is registry-derived, not a design decision, so it earns no stub. The renderer, the region marker-scan, the **multi-target write path**, and the **region-aware drift runner** are implementation, not contract shape — but they are **substantial net-new infrastructure** (no marker scan exists in the tree today, and the generator writes only under a single output dir), so they are named as deliverables and pinned by the rules below, never hand-waved.

  **Sequencing & prerequisites:** the cluster ships in a No-BC-safe order.
  1. **R8 block-vocab reconciliation lands first** — a prerequisite the epic owns (`architect-core`'s config `SectionBlock` and `architect-projection`'s `BlockSchema` reconciled to one, `00-documentation-projection.feature`; `.pr-coordination/DOCS-IA-FINDINGS.md` §6 R8). A shipped-contract refactor under the refactoring carve-out, not part of this cluster — but the embedded shapes render through the shared block renderer, so it precedes them.
  2. **Descriptor + logical-routing split** (this cluster), ordered to keep the tree compiling: introduce `emission-descriptor.ts` + a Zod schema for the slimmed logical `BundleRouting` → migrate the sole file-sink injector (`documentation-bundle.internal.ts`) and the renderer call sites (`markdown-paths.ts`, `render-markdown.ts`, `renderers/types.ts`) → delete `isRoutingLike` and re-point `isBundle` → remove the three file-sink fields from the `BundleRouting` interface **in the same commit** the descriptor takes them over → **and in that same commit** migrate the executable step files that still spread the removed file-sink fields onto a typed `BundleRouting` (≥3 do today — `render-markdown.feature.steps.ts`, `config-documentation.steps.ts`, `registry-contract.steps.ts`): a typed `BundleRouting` literal breaks the moment the interface fields are removed, so this is not a follow-up step.
  3. **Ship the two complete shapes** (whole-artifact `TAXONOMY.md`, no-descriptor live-API context) first — they work post-split with no new infrastructure.
  4. **Build the multi-target write path + region-aware gate, then the two embedded shapes** + the formal-spec reconciliation diffs.
  5. **`GoalOrientedNavigation` comes after** — it re-homes the registry's output-routing axis onto *this* descriptor, so this cluster is its prerequisite, not its dependency.

  **Open Questions:**
  - The agent-context size budget for the skill shape is owned by `OneSourceMultipleAudiences` — resolve there, not here.
  - Formal-spec canonical-vs-recognized boundary — **three sets, not two.** A tag can be (a) *spec-canonical* — the formal-spec calls it a MUST; (b) *digest-emitted* — present in `projectTaxonomyDigest`'s registry (the live 22 metadata + 3 aggregation tags), which is exactly what the generated region can render; or (c) *scanner-recognized but undigested* — parsed into pattern metadata yet absent from the digest (e.g. `usecase`, `target`, `unlock-reason`, `maturity`). They diverge today: `arch-layer` is spec-canonical but **not digest-emitted** (an `arch-layer-values.ts` enum exists in `architect-core`, yet the tag is not projected into the registry — so the reconciliation is "enum-exists-but-tag-unprojected," not "unknown tag"); `shape`/`executable-specs` are digest-emitted but spec-silent. **Resolved starting rule (the rule the first reconciliation diff applies):** the generated region emits the **digest-emitted** set; a spec-canonical tag the digest does not emit (`arch-layer`) stays an **authored-informative note outside the region**; a digest-emitted tag the spec omits (`shape`, `executable-specs`) **enters the region**. The genuinely-deferred part is only the per-tag *editorial* judgement — whether a scanner-recognized-but-undigested tag (`maturity`, `unlock-reason`, …) warrants promoting into the digest or stays authored — resolved per-tag at implement as each diff lands.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Emission mode | Location |
      | Reference shape (full enumeration) | complete | whole-artifact (markdown-file) | docs-live/TAXONOMY.md (`projectTaxonomyDigest`) |
      | Live-API taxonomy context | complete | no descriptor (API sink) | `architect:query taxonomy` |
      | Skill shape (model + link-to-live) | pending | embedded-region (markdown-file) | .agents/skills/architect-base/references/taxonomy.md |
      | Formal-spec shape (enumeration in normative prose) | pending | embedded-region (markdown-file) | formal-spec/04-tag-registry.md |
      | Emission descriptor (BundleRouting split) | pending | n/a (contract) | architect/stubs/taxonomy-documentation-cluster/emission-descriptor.ts → packages/architect-projection/src/fragments/ |
      | Multi-target write path | pending | n/a (infrastructure) | doc-gen writes one or more regions into a host `.md` outside the single output dir (`architect-cli`'s `cli/generate-docs.ts` resolveOutputDirectory/writeGeneratedFiles) |
      | Region-aware determinism gate | pending | n/a (infrastructure) | `reportDriftAndExit` (`architect-cli`'s `cli/generate-docs.ts`) extended to scan markers + diff only the inter-marker span; closes the docs-live-only coverage hole |

  Rule: The taxonomy documents are one generation family from the tag registry
    **Invariant:** The skill, reference, formal-spec, and live-API taxonomy documents are all generated from the tag registry as one family; every generatable fact a document embeds is emitted from the registry rather than hand-restated — the full per-tag enumeration in the reference and formal-spec shapes, the tag count and the role enum in the skill shape, the tag set and counts in the live-API context — and the difference between documents is which facts each audience embeds, plus verbosity and style (progressive disclosure), not separately-authored content. A taxonomy fact cannot drift across the four because none of them is its independent author: a shape that omits a fact links to live data for it (the skill links rather than embedding the enumeration), it never hand-restates a copy.

    **Rationale:** A single canonical source (the tag registry) with audience-shaped read models is the no-duplication guarantee (`MultiSourceComposition`) made concrete on the lowest-risk cluster; the determinism gate (`docs:all && git diff`) turns "no hand-restated fact" into an enforced invariant rather than a convention.

    **Verified by:** `docs-live/TAXONOMY.md` regenerates from `projectTaxonomyDigest` under the determinism gate; the live `architect:query taxonomy` emits the same tag set and counts.

    @acceptance-criteria @happy-path
    Scenario: the registry materializes the reference and live-API shapes from one source
      Given the tag registry is the single source for taxonomy content
      When the documentation projection runs
      Then the reference shape emits the full enumerated tag tables from the registry
      And the live-API taxonomy context emits the same tag set and counts from the registry
      And neither is hand-authored, so the determinism gate makes cross-shape divergence impossible

    @acceptance-criteria @happy-path
    Scenario: the skill and formal-spec shapes draw from the same registry at different disclosure depths
      Given the skill shape needs the model plus a link to live data
      And the formal-spec shape needs the full enumeration inside normative prose
      When those two audience shapes are generated
      Then the formal-spec shape emits the full per-tag enumeration from the registry
      And the skill shape emits only the facts it shows — the tag count and the role enum — from the same registry, and links to live data for the rest instead of embedding the enumeration
      And neither hand-restates any fact it shows, so the difference is which facts each audience embeds, set by progressive disclosure

    @acceptance-criteria @integration
    Scenario: the same registry count cannot diverge across the four shapes
      Given the registry has a single metadata-tag count
      When the reference, live-API, skill, and formal-spec shapes are all generated
      Then every shape that states the count emits the same registry-derived number
      And the formal-spec shape no longer carries a hand-authored count that drifts from the reference shape

    @acceptance-criteria @boundary
    Scenario: a spec-canonical tag the digest does not emit surfaces as a reviewable diff
      Given the formal-spec calls a tag canonical (e.g. `arch-layer`) but the digest does not emit it
      When the formal-spec generated region is regenerated from the digest-emitted set
      Then the absent tag does not appear inside the region
      And it remains an authored-informative note outside the region, so the divergence is a reviewable diff rather than silent divergence

  Rule: Embedded-region shapes generate only inside their managed-region markers; the authored voice is host-owned
    **Invariant:** For an `embedded-region` shape (the skill and formal-spec shapes), the projection writes only the span between each region's begin/end marker sentinels; the host-authored content outside the markers is never generated and is preserved verbatim across regeneration. A host file may carry **multiple** regions (the descriptor's `regions[]` routing map — formal-spec: one per digest tag-group; skill: `taxonomy-role-enum` + `taxonomy-tag-count`); each region is written independently from its own digest selection, and the content of **sibling regions** as well as all authored prose outside the region being written is preserved verbatim. Region identity is `(hostFile, regionId)` — `regionId` is unique within its host and the marker scan is host-scoped. The determinism gate extends into every region — regenerating and diffing detects any hand-edit inside the markers — so a generatable fact embedded in authored prose stays generated (`MultiSourceComposition`) while the authored voice stays free to evolve without tripping the gate.

    **Rationale:** This is the emission-mode resolution made concrete on the first embedded shapes: a delimited write target keeps generated facts drift-free without letting managed-region machinery smuggle a `ContentFragment`/`WikiIndex` framework past ADR-010 (the region's content is still a fragment bundle from the shared block renderer). It is what lets a hand-authored skill and a normative RFC carry generated facts without becoming fully-generated artifacts.

    **Verified by:** regenerating `taxonomy.md` / `04-tag-registry.md` rewrites only the marked region and leaves the surrounding authored prose byte-identical; the determinism gate fails on a hand-edit inside the markers and passes on an edit to the authored voice outside them.

    @acceptance-criteria @happy-path
    Scenario: regeneration rewrites only the marked region and preserves the authored voice
      Given an embedded-region shape whose host file has authored prose around a marker-bounded generated region
      When the projection regenerates the document
      Then the content between the begin/end markers is rewritten from the registry
      And the authored prose outside the markers is preserved byte-for-byte

    @acceptance-criteria @error
    Scenario: a hand-edit inside the managed region is caught by the determinism gate
      Given a maintainer hand-edits a fact inside the begin/end markers of an embedded-region shape
      When the determinism gate regenerates the region and diffs it
      Then the gate fails because the regenerated region no longer matches the committed region

    @acceptance-criteria @boundary
    Scenario: editing the authored voice outside the markers does not trip the gate
      Given a maintainer edits the normative framing prose outside the markers of the formal-spec shape
      When the determinism gate regenerates the region and diffs it
      Then the gate passes because generation never touches content outside the markers

    @acceptance-criteria @happy-path
    Scenario: a host with multiple regions rewrites each from its own selection and preserves the prose between them
      Given a host file with two marker-bounded regions from the same digest, each routed by a distinct `source`
      When the projection regenerates the document
      Then each region is rewritten from its own digest selection
      And the authored prose between the two regions is preserved byte-for-byte
      And neither region's rewrite disturbs the other region's content

    @acceptance-criteria @boundary
    Scenario: the same region id in two different host files is not a collision
      Given two host files that each declare a region with the same `regionId` slug
      When the projection writes both hosts
      Then each region is written in its own host because region identity is `(hostFile, regionId)` and the marker scan is host-scoped
      And neither host is treated as a duplicate of the other

    @acceptance-criteria @error
    Scenario: a malformed, duplicated, or nested region marker fails loudly rather than writing
      Given a host file whose begin/end markers for a region id are missing, unbalanced, duplicated within the same host, or nested/interleaved with another region's markers
      When the projection attempts to write that region
      Then generation aborts with a diagnostic naming the region id and host file
      And no partial or mislocated content is written to the host

  Rule: Region rewrites are byte-deterministic (the normalization contract)
    **Invariant:** When the projection rewrites a region, the inter-sentinel span is normalized so that regenerating an unchanged registry produces a byte-identical host file: line endings inside the span are LF; there is exactly one blank line between each sentinel and the generated content it bounds; and the host file's trailing-newline state is preserved. Content outside the markers — including its original (possibly CRLF) line endings and whitespace — is never touched.

    **Rationale:** The embedded hosts are hand-authored and live outside `docs-live/`, so they carry whatever EOL/whitespace the author's editor produced. Without a normalization contract a CRLF host, a stray trailing space, or a missing final newline would make a freshly-regenerated region differ byte-for-byte from the committed one and fail the gate on a no-op regeneration — a false positive that erodes trust in the whole drift-killing mechanism. Pinning the in-region byte policy (and leaving the out-of-region bytes alone) is what lets the gate be exact on hosts the projection does not own.

    **Verified by:** regenerating an unchanged region twice produces byte-identical output regardless of the host's surrounding EOL convention; a host saved with CRLF endings outside the markers still passes the gate after a no-op regeneration.

    @acceptance-criteria @boundary
    Scenario: a no-op regeneration of an unchanged region is byte-stable across host EOL conventions
      Given a host file saved with CRLF line endings and trailing whitespace in an authored section outside the markers
      And a region whose registry-derived content has not changed
      When the projection regenerates that region
      Then the inter-sentinel span is emitted with LF endings and the normalized blank-line layout
      And the bytes outside the markers (including their CRLF endings) are left untouched
      And the determinism gate reports no drift

    @acceptance-criteria @error
    Scenario: a blank-line edit inside a region is caught, an authored-voice EOL change outside is not
      Given a maintainer alters the blank-line layout inside a region's markers
      When the determinism gate regenerates and diffs the region
      Then the gate fails because the normalized in-region bytes no longer match
      And an EOL change to the authored prose outside the markers does not trip the gate

  Rule: Descriptor paths stay repo-contained and covered by the determinism gate
    **Invariant:** Any descriptor path-bearing field — embedded `hostFile`, whole-artifact `rootTarget`, or markdown child-route `childDirectory` — must be a normalized repo-relative path. `hostFile` and `rootTarget` are markdown file targets and additionally require the `.md` suffix; `childDirectory` is a directory and carries no suffix rule. The descriptor parse-once trust boundary rejects absolute paths, `~` roots, Windows drive roots, backslashes, and empty, `.`, or `..` path segments before generation can write; the implement-time writer also re-enforces containment after resolving accepted descriptor paths. For embedded-region shapes, accepted hosts may live outside the single configured doc output directory (the skill `references/taxonomy.md` and `formal-spec/04-tag-registry.md` both live outside `docs-live/`), but the determinism gate reaches those regions — regenerating and diffing covers every embedded host file, so a drifted region fails the gate regardless of where the host lives. There is no generated taxonomy fact the `docs:all && git diff` contract (or its `docs:check` proxy) cannot see.

    **Rationale:** The descriptor is the parse-once boundary for every path it names, including the child-route directory used to derive child/entity write targets, so it cannot defer path containment to a downstream writer. Whole-artifact `rootTarget` and embedded `hostFile` share the same repo-relative `.md` file-target contract, while `childDirectory` shares the containment contract without the suffix rule. The registry's current `.md$` rule tightens to the descriptor's full file-target contract when output-routing re-homes onto this descriptor. Today the write path resolves one output directory per generator and the drift check compares whole files under it; an embedded host outside `docs-live/` would be written but never diffed — a silent coverage hole that defeats the cluster's entire drift-killing purpose. Closing it (CI diffs the embedded hosts directly, or the generated-docs manifest records per-host region hashes) makes the gate the enforcement mechanism for all generated facts, not only files under `docs-live/`.

    **Verified by:** descriptor parse rejects absolute or repo-escaping `hostFile`, `rootTarget`, and `childDirectory` values; after regeneration, a hand-edit to a generated region in either embedded host (outside `docs-live/`) fails `docs:check`; the live `docs:all && git diff` contract reports the host file dirty.

    @acceptance-criteria @happy-path
    Scenario: the determinism gate reaches an embedded region outside docs-live
      Given an embedded-region shape whose host file lives outside the configured doc output directory
      When the determinism gate (`docs:check`) runs
      Then it regenerates and diffs that host file's region alongside the docs-live artifacts
      And an unchanged region reports no drift

    @acceptance-criteria @error
    Scenario: a drifted region in an out-of-tree host fails the gate
      Given a maintainer hand-edits a generated region in formal-spec/04-tag-registry.md (outside docs-live)
      When the determinism gate runs
      Then the gate fails and reports that host file dirty
      And the failure is not masked by the gate's docs-live-only scope

    @acceptance-criteria @error
    Scenario: an embedded host that has not yet been region-prepared fails loudly rather than writing silently
      Given a configured embedded-region target whose host file exists but carries no begin/end markers for the routed regionId, or whose host file is missing entirely
      When the projection attempts to write that region
      Then generation aborts with a diagnostic naming the host file and the absent regionId
      And it does not create the host under the doc output directory nor write the content to a fallback location

    @acceptance-criteria @boundary @error
    Scenario: any descriptor path outside the repo is rejected before writing
      Given a descriptor whose embedded `hostFile`, whole-artifact `rootTarget`, or markdown child-route `childDirectory` is absolute or contains a `..` traversal segment
      When the descriptor is parsed at the generation trust boundary
      Then validation fails with a diagnostic naming the offending descriptor path and the repo-relative path constraint
      And generation does not resolve, create, or write any descriptor path outside the repo
      And the implement-time writer re-enforces containment after resolving accepted descriptor paths
