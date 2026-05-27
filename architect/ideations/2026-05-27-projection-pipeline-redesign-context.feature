@ideation
@ideation-status:active
@ideation-scope:projection-pipeline,documentation-projection,view-emission-model,code-deletion
@relates-to:DocumentationProjection,ADR010DocumentationCompositionHelpers,ADR006SingleReadModelArchitecture,ADR005CodecBasedMarkdownRendering
Feature: Projection Pipeline Redesign — Directional Context

  Trigger: The projection pipeline is being rearchitected from documentType-first
  (one bespoke projection per output) to source-first Views over one engine. This
  ideation carries the *why* behind a deliberately destructive rewrite, so a fresh
  session treats the breakage as intended rather than reckless. It does NOT re-teach
  process — the architect skills own the maturity ladder, the FSM, the review
  protocol, and value-transfer; the live `pnpm architect:query` API owns current
  state. Read those for how and what-now; read this for why.

  Lifetime: this is scaffolding, like any design-phase artifact. When the redesign
  lands as born-accepted ADRs + executable specs, the why has moved into those
  durable surfaces — delete this ideation. It is a bridge across the design phase,
  not documentation, and must not become the dead context it warns against.

  Rule: The core idea — sink-agnostic Views over one engine

    Architect is event-sourced. Annotated code + executable Gherkin, versioned by
    git, are the immutable event store; the projection pipeline is the read side.
    Today that read side is built documentType-first: one bespoke projection per
    output (~57 projection patterns over 6 "support" utilities — a star where almost
    every leaf is the same shape stamped again, differing only in which slice it
    selects, its fragment schema, and its renderer normalizer).

    The redesign re-pivots to source-first Views over one engine. A View is
    Select (a named slice of the single read model) by Shape (a composition tree) by
    Audience (the disclosure spec), producing a fragment bundle. An Emission is
    renderer by sink by topology, applied AFTER the View is built. A generated
    document is the degenerate emission (renderer=markdown, sink=file, pull-once,
    determinism-gated). The demanding emission — the one the contract must be
    designed against — is the live, composed Studio view: multi-source,
    push-on-graph-change, with view-local interaction state held out of the
    projection entirely.

    A family (one source, many audience-shaped outputs) is then one View times N
    emissions, and the no-duplication guarantee is structural: every fact emits from
    its one canonical slice wherever a View reads it, so divergence is drift the
    determinism gate catches — never a runtime precedence rule.

  Rule: Why this earns a destructive rewrite

    Architect grew organically into mission-critical infra (it runs on multiple
    production repos and is the read side of Libar Studio) without being designed up
    front. The 57-projection star is the fossil record of that unplanned growth:
    boilerplate, not domain structure. Documents are the cheapest sink to iterate
    against — easy to build, test, and diff — but they are a test harness, not the
    product. The real consumers are agent context bundles (API/MCP), the live Studio
    UI view-state, and composed views. A model proven only against documents
    under-fits all three.

    So the breakage is the point, not collateral:

    No-BC, pre-1.0. No shims, no deprecation markers, no superseded specs, no
    "replaces" edges, no parallel implementations. Old to new is expressed by
    deleting the old. The read model carries only live state; "what did we replace?"
    is a git log question, never a graph relation.

    The success metric is deletion. Two-thirds of the original code is already gone
    across ~24 refactoring PRs. The target here is collapsing the documentType star
    into source-first Views and removing another ~50-60% of the generation/projection
    pipeline. The redesign is validated when bespoke projections disappear, subsumed
    by the engine — not when a new document generates.

    A mid-refactor build that does not compile is the expected state. Reaching for an
    adapter to make errors go away is the violation. Change the model, follow the
    breakage through the repo, delete what the new shape obsoletes.

  Rule: The clean approach

    Top-down first. Start from a high-level design that must support all target
    features, then refine downward. That concept now exists as the
    DocumentationProjection candidate epic and its members — query it, do not
    re-derive it. This is harder than a greenfield spec because spec-driven
    refactoring touches a lot of shipped code; the design carries plan/design-grade
    direction while still on the consideration side of the lifecycle, and that is
    intentional.

    Refine against the uniform state. Specs mature (plan to design) through
    individual and group reviews held in context of the live Architect state, the
    other specs, and the implemented code — which are the same uniform graph at
    different levels of detail, all reachable through the API. That is the leverage:
    the design is reviewed against reality, not against itself.

    Prove by deletion at the highest-risk seam first. Build the composed,
    multi-source View (the design-review view: pattern plus dependency subgraph plus
    rule-coverage plus conflicts) before any single-slice document. If the engine can
    express that, it is genuinely sink-agnostic; if it can only express single-slice
    docs, it is secretly doc-shaped and will fail the UI. Each proof-point must remove
    the bespoke code it replaces.

    Record decisions born-accepted, after the build. ADR-010 is the pattern: it
    documents helpers that already shipped. Do not enshrine the View/Emission split,
    generation-mode, or read-model-reach as ADRs ahead of the code that proves them —
    premature detail-locking is the 1.0.0-pre mistake this rebuild exists to undo.

  Rule: How to tell direction from a nonsensical order

    A fresh session should refuse work that fails these, and proceed confidently on
    work that passes:

    Judge against the demanding sink. "Does it generate a nice document?" is the
    wrong test. "Could this same View feed the live Studio panel and the MCP bundle
    unchanged?" is the right one.

    Deletion is the KPI. A change that adds a projection to do something the engine
    should absorb is moving the wrong direction, even if it works.

    Incompleteness is the plan. Un-wired top-down design and partial functionality
    are expected at this phase. Flag deviations from this direction and dead context
    that should have been deleted — not the absence of finished features.

    No new framework. ADR-010 already falsified the document-authoring framework and
    the projection-kind config engine with evidence (a measured import cycle that
    inverts the renderer-to-projection layering). The only admissible generalization
    is composable helpers over the single read model and the shared block renderer.

  Rule: Where the live truth is

    This ideation is directional and will drift; the graph will not. For current
    state, query the API — the redesign lives there as the DocumentationProjection
    candidate epic and its members, and the governing decision is ADR-010
    (bundle DocumentationProjection, and pattern ADR010DocumentationCompositionHelpers).
    Trust the CLI over this note on any disagreement.

  Rule: Open architectural tensions the design must still resolve

    These are why the design is still maturing, not a task list:

    The sink-agnostic split itself. The shipped BundleRouting conflates View concerns
    (logical routing, disclosure) with emission concerns (markdown targets, file
    topology, anchor style). The split must be clean, and the emission side must be
    expressible for a UI sink, not just a file.

    Generation mode. Whole-artifact emission (determinism gate suffices) versus a
    generated region spliced into a hand-authored file (needs a boundary contract
    plus its own drift detector). This is the precise place a managed-region
    mechanism can smuggle the rejected framework back in. Upstream of everything else.

    Read-model reach. How far the read model ingests its own query surface (CLI
    verbs, MCP registry, config schema) so it becomes self-describing — preserving
    the single read model. Decides whether the index/manifest/help/command-palette
    are one emission or separately authored.

    The block-vocabulary precondition. ADR-010 already named it: two block
    vocabularies (architect-core config blocks versus architect-projection blocks)
    must collapse to one before the composition layer can build further on the shared
    renderer. It is a hard prerequisite, currently untracked.
