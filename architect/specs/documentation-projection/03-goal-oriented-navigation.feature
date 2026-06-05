@architect
@architect-pattern:GoalOrientedNavigation
@architect-status:roadmap
@architect-product-area:Generation
@architect-parent:DocumentationProjection
@architect-see-also:EmissionDescriptor,TaxonomyDocumentationCluster,ADR006SingleReadModelArchitecture,ADR009ProjectionTrustBoundary,ADR010DocumentationCompositionHelpers
Feature: GoalOrientedNavigation - navigation surfaces are projections of the read model's index

  **User Story:** As a reader of the documentation read model, I want to state my goal in plain language and reach the relevant slice without knowing the filename, directory, or section structure of the output, so that the projected shape is not a prerequisite for finding what I need — the navigation surface itself is a projection over what the read model contains.

  **Why this proof-point (the second deliverable family):** the taxonomy cluster proved one source → many *audience* shapes and shipped the emission descriptor (`EmissionDescriptor`); this proof-point proves the *other* axis the epic's emission model asserts — that the **navigation surface and the output routing are themselves projections**, not a hand-maintained registry. It is the cluster's designated successor (a prerequisite-of relationship, not a dependency: the cluster builds the `EmissionDescriptor` contract this re-homes onto; that contract is already shipped). It also lands the single deferral the cluster carried forward — single-doc whole-artifact output routing *through* the descriptor (the cluster's step-5 re-home). Resulting surfaces need not preserve current shapes byte-for-byte; they must carry the navigation information and stay usable (the epic's whole-corpus principle).

  **The drift this kills:** today the set of documents, their filenames, and their child directories are a hand-maintained static table (`DOCUMENTATION_TYPE_OUTPUT_ROUTING` + the static doc-type identity list the `index` generator renders), and the CLI writes each doc under a per-generator output directory (`resolveOutputDirectory` / `generator.outputPath`) that never consults the shipped `EmissionDescriptor`. A document that stops emitting (or a new family that starts) requires a hand edit to the index table to stay correct, and the routing contract is forked across two surfaces (the registry's `${string}.md` rule and the descriptor's repo-relative `.md` contract). Projecting the navigation index over the families that *actually emitted*, and routing every write *through* the descriptor, turns both into determinism-gate-covered projections.

  **Retires (No-BC):** when this navigation projection ships, the projected navigation index over the families that actually emitted supersedes and DELETES the **identity-list axis** of the static `DocumentationTypeRegistry` (the document-type enumeration becomes a projection over the families that actually emitted) and subsumes the static-index-link special-casing (the epic's "never ships a structurally-empty document to keep a static index link alive" concern); the registry's output-routing, disclosure, and cli-surface axes are not deleted here but **re-home onto the epic's `BundleRouting` split / emission descriptor** (`MarkdownFileRoute` — `rootTarget` / `childDirectory` / `entityPathLayout`, already shipped on `EmissionDescriptor`), which still drives `generate-docs` / `docs:all` and the `ci:pre-push` determinism gate, and the completed fragment-kind-keyed `GeneratorDegeneracyGuard` is a separate build guard that survives — the epic's "the navigation index … retiring the static document-type registry" is owned here. Old→new is expressed by deletion, never a "replaces" graph edge (event-sourced doctrine — "what did we replace?" is a git-log question).

  **Reuse basis (ADR-010 / ADR-009):** the navigation surface composes on the shipped `rootShape:navigation` disclosure primitive (`disclosure/spec.ts`, `render-markdown.ts`) + the shared block renderer — no new framework, no facet helper (single-slice, like the taxonomy cluster; `buildFacetBundle` stays unratified per the epic's composition-basis gating question). The output-routing re-home is a `MarkdownFileRoute` migration onto the parse-once descriptor trust boundary (ADR-009), not a new contract. The navigation index reads the single read model (ADR-006): the catalog of emitted families is a graph-derived projection, never a parallel hand-list.

  **Resolved questions (this family exercises them, so they resolve here — born-accepted after the build per the ADR-010 pattern):**
  - **Single-document read models get no separate navigation surface — the document is its own navigation.** A goal-shaped surface is projected only for **multi-page** read models (the Rule scopes to "every multi-page topic"). A sub-300-line single-document topic already exposes its structure through its own headings and disclosure depth; projecting a separate goal-index over one page is empty ceremony the epic's "never ships a structurally-empty document" rule forbids. Single-doc topics are out of scope by construction.
  - **"My goal" is a fixed, source-declared intent catalog, projected — not a runtime text-search interface.** A projection is a pure function of the read model (epic Rule "A projection is a pure function of the read model"); free-text search is **view-local interaction state owned by the sink** (epic Rule "View-local interaction state never enters a projection"). So the projection emits the source-declared goal→page intent catalog; a sink that wants a literal search box consumes that catalog as a sink concern, never an index baked into the projection. (This keeps the navigation surface a co-equal pull-projection across the markdown, API/MCP, and Studio sinks.)
  - **Two goals that legitimately route to the same slice surface as two entries, not one.** The navigation is goal-keyed, not page-keyed — the reader arrives by stating a goal, so two distinct goals landing on the same page are two legitimate entries both pointing at it; deduplicating by target page would erase the intent the surface exists to serve. The page itself is not duplicated — only the index entries differ.

  **Open Questions:**
  - Where do source-declared reader intents live for a multi-page family whose pages are graph entities (per-pattern, per-package) rather than authored topics — a config-level intent map keyed by family, an annotation on the family's View, or derived from the family's grouping axis? (Resolved per-family at implement as the first multi-page family with non-trivial intents lands; the taxonomy/patterns families' intents are grouping-derived, so the catalog is a projection of the existing grouping for them.)

  **Stubs:** none. The re-home's contract (`MarkdownFileRoute` on `EmissionDescriptor`) is already shipped, and the navigation index is a projection over the shipped `rootShape:navigation` primitive + the live family-emission set — registry-derived data, not a new design decision, so it earns no stub (the cluster's "shape data is registry-derived, earns no stub" reasoning). The genuinely net-new work is the **deletion** of the static identity-list axis and the **migration** of the write path off `generator.outputPath` onto `emission.markdownFileRoute`, both named as deliverables and pinned by the rules below.

  **Sequencing:** after `TaxonomyDocumentationCluster` completes (so `EmissionDescriptor` reaches `completed` and the descriptor is the single, settled routing contract). The descriptor and its sole doc-gen injector (`documentation-bundle.internal.ts`) already ship; this family attaches the registry's `DOCUMENTATION_TYPE_OUTPUT_ROUTING` rows to a whole-artifact descriptor per document type, switches the CLI to write via `emission.markdownFileRoute.rootTarget`, and deletes the static identity list once the navigation projection covers it.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Emission mode | Location |
      | Navigation index projection (goal-to-page, named-thing-to-page, reading order) over emitted families | pending | projection (no descriptor) | `architect-projection` navigation projection built on `rootShape:navigation` (`disclosure/spec.ts`, `render-markdown.ts`); supersedes the `index` generator's static doc-type list (`architect-cli`'s `cli/generate-docs.ts` `renderDocumentationIndex`) |
      | Output-routing re-home onto the emission descriptor | pending | whole-artifact (markdown-file) | migrate `DOCUMENTATION_TYPE_OUTPUT_ROUTING` (`documentation-type-registry.output-routing.ts`) onto `MarkdownFileRoute`; CLI writes via `emission.markdownFileRoute.rootTarget` instead of `resolveOutputDirectory` / `generator.outputPath` (`architect-cli`'s `cli/generate-docs.ts`) |
      | Single-doc whole-artifact descriptor wiring (the cluster's step-5 deferral) | pending | whole-artifact (markdown-file) | `docs-live/TAXONOMY.md` (and every whole-artifact doc) routes through `emission.markdownFileRoute.rootTarget` rather than `generator.outputPath`; the registry's `${string}.md` rule tightens to the descriptor's full repo-relative `.md` contract |
      | Retire the static identity-list axis of `DocumentationTypeRegistry` | pending | n/a (deletion) | delete the hand-maintained doc-type enumeration the navigation index now projects; subsume the empty-doc static-link special-casing (No-BC) |

  Rule: The goal-oriented navigation projection emits a goal-shaped surface for every multi-page topic it covers
    **Invariant:** When the goal-oriented navigation projection is built, every multi-page documentation read model it covers carries a navigation surface that is itself a projection — goal-to-page, named-thing-to-page, and a recommended reading order for common goals — so a reader who knows their goal reaches the right page without traversing the file tree. A single-document read model carries no separate navigation surface: the document is its own navigation. This is the acceptance criterion of a built deliverable (the epic files GoalOrientedNavigation as a concrete artifact, not a standing capability-invariant like the three the epic upholds), satisfied once the navigation projection ships for the live multi-page corpus.

    **Rationale:** The projected shape (filenames, directories, section order) must not be a prerequisite for finding content; making navigation a projection over the read model's index — rather than a hand-maintained table of contents — is what lets a reader navigate by goal and what keeps the index from drifting as families are added or retired. Scoping to multi-page topics keeps the epic's "never ships a structurally-empty document" rule intact (a one-page topic's own headings are its navigation).

    **Verified by:** the navigation projection emits a goal-keyed surface for each multi-page family in the live corpus; a single-document topic produces no separate navigation surface.

    @acceptance-criteria @happy-path
    Scenario: a reader names a goal and lands on the right page
      Given a multi-page read model with N child pages and declared reader intents
      When the topic index is projected
      Then each declared intent maps to a numbered path of child pages with rationale per step

    @acceptance-criteria @boundary
    Scenario: a single-document topic carries no separate navigation surface
      Given a single-document read model under the multi-page threshold
      When the navigation projection runs
      Then no separate goal-shaped navigation surface is emitted for it
      And the document's own headings and disclosure depth are its navigation

    @acceptance-criteria @happy-path
    Scenario: two goals routing to the same page surface as two entries
      Given two distinct declared intents that legitimately resolve to the same child page
      When the topic index is projected
      Then both intents appear as separate entries that point at the page
      And the entries are not deduplicated by their shared target

  Rule: The navigation index is a projection over emitted families, never a static document-type list
    **Invariant:** The catalog of documents the navigation index presents is a projection over the families that actually emitted in this run, read from the single read model — not a hand-maintained document-type enumeration. A document type whose source dimension produced no live family does not appear in the index (no structurally-empty index link), and a newly-emitting family appears without a hand edit. The static identity-list axis of `DocumentationTypeRegistry` is deleted when this projection ships (No-BC; old→new by deletion).

    **Rationale:** A hand-maintained index table is exactly the parallel write side the epic's "Documentation has no independent write side" invariant forbids — it can list a document that no longer emits or omit one that started, drift the determinism gate cannot see. Projecting the index over the emission set makes the catalog a derived fact under the gate and subsumes the empty-doc static-link special-casing the epic flags.

    **Verified by:** the navigation index lists exactly the families that emitted; a doc type with no live source family is absent from the index; the static doc-type identity list is gone from the generator surface.

    @acceptance-criteria @happy-path
    Scenario: the navigation index lists exactly the families that emitted
      Given a generation run in which a subset of document families emit
      When the navigation index is projected
      Then it lists every family that emitted and only those
      And it is read from the read model, not from a hand-maintained document-type table

    @acceptance-criteria @boundary
    Scenario: a document type with no live source family is absent from the index
      Given a document type whose source dimension carries no live data in this repo
      When the navigation index is projected
      Then that document type does not appear as an index entry
      And no structurally-empty document is generated to keep its link alive

  Rule: Output routing is the emission descriptor's job, not the generator's output path
    **Invariant:** Every whole-artifact document is written through its emission descriptor's `markdownFileRoute.rootTarget` (the parse-once, repo-relative `.md` trust boundary), not through a per-generator output directory derived outside the descriptor. The registry's output-routing rows (`markdownRootTarget` / `childDirectory` / `entityPathLayout`) re-home onto `MarkdownFileRoute` and are defined exactly once there; the registry's standalone `${string}.md` rule tightens to the descriptor's full repo-relative `.md` contract rather than carrying a parallel looser copy.

    **Rationale:** The epic's "A generated document is one emission of a sink-agnostic view" rule requires the destination to be applied *after* the view is built, by the descriptor — the same boundary the embedded-region shapes already write through. Routing single-doc whole-artifact output through the descriptor (the cluster's deferred step-5) makes the markdown-file contract single-sourced (`MultiSourceComposition` applied to the descriptor itself) and brings every write under one parse-once containment check (ADR-009).

    **Verified by:** a whole-artifact document writes to the path named by its descriptor's `markdownFileRoute.rootTarget`; the determinism gate is unchanged by the re-home; the registry no longer carries a routing rule the descriptor also carries.

    @acceptance-criteria @integration
    Scenario: a whole-artifact document writes through its descriptor's route
      Given a whole-artifact document type with an emission descriptor naming its `rootTarget`
      When the documentation projection is generated to the markdown-file sink
      Then the document is written to the descriptor's `markdownFileRoute.rootTarget`
      And the write does not consult a per-generator output path derived outside the descriptor
      And the determinism gate reports no drift for the re-homed document

    @acceptance-criteria @boundary @error
    Scenario: a descriptor route outside the repo is rejected before the re-homed write
      Given a re-homed document whose descriptor `rootTarget` is absolute or contains a `..` traversal segment
      When the descriptor is parsed at the generation trust boundary
      Then validation fails naming the offending route and the repo-relative `.md` constraint
      And no whole-artifact write occurs outside the repo

  Rule: Reader intents are source-declared and projected; search is a sink concern
    **Invariant:** The goals a reader can state are a fixed catalog declared at the source (or derived from a family's grouping axis) and projected as a pure function of the read model; the projection never embeds a free-text search index. A sink that offers literal text search consumes the projected intent catalog — search is view-local interaction state the sink owns, never read-model-derived.

    **Rationale:** Baking a search interface into the projection would make it stateful for one sink's benefit, the exact line the epic's "A projection is a pure function of the read model" and "View-local interaction state never enters a projection" rules draw. A source-declared catalog keeps the navigation surface a co-equal pull-projection across the markdown, API/MCP, and Studio view-state sinks.

    **Verified by:** the projected navigation surface carries the source-declared intent catalog and no search index; the same catalog feeds every sink unchanged.

    @acceptance-criteria @happy-path
    Scenario: the projection emits the intent catalog, not a search interface
      Given a multi-page family with source-declared reader intents
      When the navigation surface is projected
      Then it emits the fixed intent catalog as goal-to-page entries
      And it contains no free-text search index
      And a sink offering text search consumes the catalog rather than a projection-embedded index
