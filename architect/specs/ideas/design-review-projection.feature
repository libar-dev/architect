@architect
@architect-pattern:DesignReviewProjection
@architect-status:candidate
@architect-maturity:idea
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: DesignReviewProjection - a design-review document type composed on the projection substrate, not a bespoke generator

  **User Story:** As a maintainer or agent in a design session, I want a design-review document — component diagrams for a pattern, and (lifting the prior generator's limit) for a slice or related set rather than only one central pattern, deliberately including not-yet-implemented specs — generated as a first-class documentation projection over the PatternGraph, so that I can see a planned pattern's shape before building it and it regenerates deterministically from the graph instead of drifting into a stale orphan.

  **Approach:** Rebuild on the ADR-010 composable-helper substrate (`buildGroupedRoutedBundle` + the shared block renderer) as a new `design-review` document type. Like every projection it reads **only** the PatternGraph (ADR-006 single read model, ADR-009 input boundary): it derives the component view from data already in the graph — dependency / `@architect-uses` / `@architect-implements` edges, role, bounded-context — and never reads scanner/extractor internals, AST, or any assistive source at projection time. It does not revive the `@sequence-orchestrator|participant|step` carrier tags the kernel subtractive audit (`82ad5a2`) removed (reintroducing a bespoke carrier contradicts ADR-010's reuse/derive-never-add-a-carrier rule). Ordered call-flow is not in the read model today and edges alone do not capture it, so the first cut is the component view; a sequence view is deferred and gated on that ordering first becoming graph data — `AssistiveCodeIntelligence` may *propose* such annotations for human acceptance (arm's length per its own invariant: AST intelligence never becomes the read model), after which the projection reads them from the graph like any other annotation, never from the AST. The prior generator was bespoke, inflexible, non-determinism-gated, and limited to a single central orchestrator pattern; lifting that limit — composing a slice or predicate-derived related set into one review via the helper's multi-group support (one diagram child per member) — plus verbosity/audience shape from progressive disclosure (`OneSourceMultipleAudiences`), is the core flexibility the rebuild unlocks. It is the cleanest greenfield proof-point for the `DocumentationProjection` capability.

  Rule: A design review reads only the PatternGraph
    **Invariant:** The projection consumes the single read model (PatternGraph) and nothing else — no scanner/extractor internals, no AST, no assistive structural-intelligence source at projection time (ADR-006, ADR-009). Every fact it renders is already a node, edge, or annotation in the graph.

  Rule: A design review is a deterministic projection, never a hand-maintained artifact
    **Invariant:** The design-review document is produced by the projection from graph data and rendered through the shared block renderer; it carries no hand-authored content and is covered by the determinism gate (`docs:all && git diff`), so it cannot drift into a stale orphan the way the removed bespoke generator's output did.

  Rule: A design review adds no new annotation surface
    **Invariant:** The projection derives from edges and annotations that already exist for other read-model purposes; it does not reintroduce the removed `@sequence-*` carrier tags or add any new membership carrier (ADR-010: reuse/derive, never add a carrier).

  Rule: Design reviews deliberately include unimplemented specs
    **Invariant:** Unlike the production-only architecture view (which excludes working-state specs per D-16/D-18), a design review includes not-yet-implemented patterns, so a planned pattern's shape is reviewable before any implementation exists.

  Rule: A design review's scope is a pattern, a slice, or a related set — not only one central pattern
    **Invariant:** The projection composes a design review around a chosen scope (a single pattern, an `@architect-level:slice` view, or a predicate-derived related set — never a new inclusion tag) and emits one routed bundle whose children are the per-member diagrams; it is not hard-limited to a single central pattern the way the removed generator was.
