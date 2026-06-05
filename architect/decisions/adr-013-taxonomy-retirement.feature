@architect
@architect-adr:013
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-adr-layer:refinement
@architect-adr-theme:taxonomy
@architect-pattern:ADR013TaxonomyRetirement
@architect-status:completed
@architect-unlock-reason:Born-accepted-after-code-removed-the-temporal-release-and-process-metadata-residue
@architect-product-area:Process
@architect-uses:ADR001TaxonomyCanonicalValues,ADR007CoordinatedTaxonomyRedesign
Feature: ADR-013 - Retire Temporal, Release, Completion-Date, and Unpopulated Process-Metadata Taxonomy

  **Context:**
  Several temporal taxonomy dimensions arrived with the package's extraction from
  a monorepo and never earned a place in the clean-bootstrapped delivery
  process: the `@architect-quarter` tag (a calendar time-bucket), the canonical
  six-phase USDP workflow (Inception through Retrospective), the numeric
  `@architect-phase` delivery-sequence tag, the `@architect-release` axis (a
  release-tag bucket), and the `@architect-completed` completion-date field.
  The same zero-population sweep showed the broader process-metadata band —
  `@architect-effort`, `@architect-effort-actual`, `@architect-risk`,
  `@architect-priority`, `@architect-since`, `@architect-user-role`, and
  `@architect-business-value` — was also unpopulated across the live graph.
  Each is a proxy for when work happens, wired end to end — schema fields,
  pre-computed views, read-API methods, projections — yet carrying no (or near
  zero) populated data. `@architect-release` was never even a registered
  taxonomy tag: `pattern.release` was fed only by a dual-source table column
  nobody populated. They are unpopulated machinery, part of the monorepo residue
  the extraction cleanup is removing, not a live capability — and they
  re-introduce the temporal/historical state the read model must not carry
  (history lives in git).

  **Decision:**
  Retire the dimensions. The clean-bootstrapped taxonomy models no calendar or
  ordinal temporal axis, no release axis, no completion-date field, and no
  unpopulated effort/risk/priority/session/user/business-value process-metadata
  band. These unpopulated proxies are removed rather than maintained. If a
  temporal grouping or process metadata dimension is needed later it will be
  introduced deliberately on a populated dimension, not retained as residue.
  Releases, when first practiced, are derived from git tags (per the
  `ArchitectureDelta` roadmap spec), never annotated.

  1. `@architect-quarter` is retired as a canonical feature-only tag. Its
     ownership rule, its YYYY-QN format, its schema field, the by-quarter
     pre-computed view, and the quarter read-API methods are removed.

  2. The canonical six-phase USDP workflow is retired as a delivery-process
     standard. The phase constant set and the default workflow phases derived
     from it are removed.

  3. The numeric `@architect-phase` delivery-sequence tag is retired. Its schema
     field, the by-phase pre-computed view, the phase read-API methods, and the
     residual annotations on test features are removed.

  4. The `@architect-release` release axis and the `@architect-completed`
     completion-date field are retired. The `release`/`completed` schema fields,
     the parser cases, the extractor propagation (including the dual-source
     release table column), the `completed` package feature-only suffix and
     metadata-tag registration, and the release-bucketed changelog projection
     (`ReleaseNotesDigest`/`ReleaseEntry` and `buildReleaseEntries`) are removed.
     The `changelog` document type stays registered but is reshaped to a
     release-free completed-patterns view (the `completed` set in name order,
     with no calendar or ordinal fallback).

  5. The unpopulated process-metadata band is retired. `effort`,
     `effortActual`, `risk`, `priority`, `since`, `userRole`, and
     `businessValue` are absent from `ExtractedPattern`, doc-directive and
     dual-source schemas, scanners, extractors, read-model inventory, projection
     grouping/sorting options, and generated test fixtures. The guard treats the
     corresponding authored tags as removed tags. ADR-001 Rule 6 keeps only the
     canonical `team` floor plus this package's `workflow` extension.

  This record states the retirement decision; the code removal follows. Because
  the affected tables in ADR-001 (Rules 6, 7, 8) are sync-tested mirrors of live
  constants, ADR-001 is re-mirrored to the narrowed taxonomy in the same change
  that removes the constants, so the decision and the code stay consistent.
  Rule 6's package feature-only extension prose drops `completed`, leaving
  `workflow` (the canonical floor stays `team`).

  **Consequences:**
  | Type | Impact |
  | Positive | The taxonomy carries no unpopulated temporal or process-metadata machinery — schema fields, views, read-API methods, and projections that never hold data are gone |
  | Positive | Generated timeline and changelog groupings simplify to completion order, with no calendar, ordinal, or release fallback |
  | Positive | One fewer way to conflate structural grouping with delivery timing; release/changelog state is sourced from git, where it belongs |
  | Negative | Any future calendar, phase, or release grouping must be reintroduced deliberately on a populated dimension (releases via git tags per ArchitectureDelta) |
  | Negative | The retirement spans several surfaces (constants, schema, views, read-API, projections, annotations) that must be removed together under No-BC |

  Rule: The taxonomy models no calendar or ordinal temporal axis

    **Invariant:** `@architect-quarter`, the canonical six-phase USDP workflow,
    and the numeric `@architect-phase` tag are not part of the taxonomy. No
    calendar bucket or delivery-sequence ordinal is maintained as a temporal
    proxy.
    **Rationale:** Unpopulated time proxies are pure cost and invite the
    structural-temporal conflation the navigation model avoids. The clean
    bootstrap does not need a temporal axis; one can be introduced deliberately
    if and when it is.
    **Verified by:** Retired dimensions are absent from the taxonomy

    @acceptance-criteria @validation
    Scenario: Retired dimensions are absent from the taxonomy
      Given the taxonomy registry after retirement
      When the canonical tags and workflow phases are listed
      Then @architect-quarter is not a canonical feature-only tag
      And the numeric @architect-phase tag is not registered
      And no canonical six-phase USDP workflow is defined

  Rule: The release axis and completion-date field are not modeled

    **Invariant:** Neither the `@architect-release` release axis nor the
    `@architect-completed` completion-date field is part of the taxonomy or the
    read model. `release` and `completed` are absent from `ExtractedPattern`,
    the dual-source and doc-directive schemas, the parser, and the extractors;
    `completed` is not a package feature-only tag suffix and not a registered
    metadata tag; the changelog is a release-free completed-patterns view.
    Releases, when needed, are git-tag-derived per `ArchitectureDelta`, never
    annotated.
    **Rationale:** A release tag and a completion date are denormalized git
    facts; baking them into the read model re-introduces the temporal/historical
    state the read model must not carry (history lives in git). They were
    unpopulated residue — `@architect-release` was never registered at all.
    **Verified by:** The release axis and completion-date field are absent

    @acceptance-criteria @validation
    Scenario: The release axis and completion-date field are absent
      Given the taxonomy registry and read model after retirement
      When the registered tags and pattern fields are listed
      Then completed is not a package feature-only tag suffix
      And completed is not a registered metadata tag
      And the @architect-release tag is not registered
      And the changelog renders a release-free completed-patterns view

  Rule: The unpopulated process-metadata band is not modeled

    **Invariant:** `@architect-effort`, `@architect-effort-actual`,
    `@architect-risk`, `@architect-priority`, `@architect-since`,
    `@architect-user-role`, and `@architect-business-value` are not part of the
    taxonomy or the read model. `team` remains the canonical feature-only
    ownership tag, and `workflow` remains this package's feature-only extension.
    **Rationale:** The live graph populated none of these fields across any
    pattern. Keeping zero-data estimation, prioritization, risk, session,
    persona, or business-value fields would preserve dead planning machinery in
    a bootstrap read model that should carry only live state.
    **Verified by:** The process-metadata band is absent

    @acceptance-criteria @validation
    Scenario: The process-metadata band is absent
      Given the taxonomy registry and read model after retirement
      When the registered tags and pattern fields are listed
      Then effort is not a pattern field
      And effortActual is not a pattern field
      And risk is not a pattern field
      And priority is not a process-metadata pattern field
      And since is not a pattern field
      And userRole is not a pattern field
      And businessValue is not a pattern field
      And team and workflow remain feature-only process metadata
