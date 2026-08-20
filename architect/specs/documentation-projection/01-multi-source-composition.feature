@architect
@architect-pattern:MultiSourceComposition
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: MultiSourceComposition - the projection composes by union over single-owner facets

  **User Story:** As a maintainer, I want the documentation projection to compose over every source aggregate that contributes to a topic — annotated TypeScript JSDoc, executable Gherkin rules, Zod schema descriptions, decision records — by union, so that the generated read model presents the full union of what those sources know while every individual fact still traces to exactly one canonical source.

  Sources cannot disagree about a pattern: identity is single-source (`mergePatterns` rejects any name owned by both a `.ts` and a `.feature`; `ExtractedPattern` is one record per file), so "which source wins on conflict" is a non-question. Composition is union over orthogonal facets — across `@architect-implements` a production node owns "how / with what" and its test node owns "what / when" (split-ownership, architect-base §8). A fact with a canonical source is generated wherever it appears, so divergence is drift caught by the determinism gate, never a runtime precedence rule. Evidence: the single-source check is `mergePatterns` (`packages/architect-core/src/generators/pipeline/merge-patterns.ts`); the composition mechanism is settled in ADR-010.

  **Resolved (per the taxonomy cluster — born-accepted after the build, the ADR-010 pattern; the cluster is the family that exercised these. Re-open per future family if a multi-source-kind topic surfaces a case these starting rules do not cover):**
  - **Facet-ownership is implicit by source-kind** — the registry owns enumerations, ADRs own rationale, Gherkin Rules own invariants — no explicit per-topic ownership declaration. The taxonomy cluster confirmed implicit-by-kind suffices (the registry is the sole owner of every taxonomy fact); an explicit declaration layer is unnecessary ceremony until a topic needs two source kinds to co-own one facet, which has not occurred.
  - **Drift-enforcement is the determinism gate, with a dedicated paraphrase-lint deferred until drift recurs.** "Generate-or-link, never paraphrase a generatable fact" is enforced for every generated region by the determinism gate (a hand-edit inside a managed region fails `docs:check` — proven by the cluster). A standing validate-time/doc-gen-time lint that detects a *paraphrase outside* a region stays deferred until paraphrase-drift first recurs in practice; the gate already covers the generated surface.
  - **Per-doc provenance is omitted by default — it lives in the graph edge, not the rendered doc.** The taxonomy shapes shipped with no rendered "which aggregates contributed" provenance; the source edge is queryable via the read model when needed. Re-introduce a rendered provenance line only behind a disclosure level if a consumer requires it on the page.
  - **A topic covered by exactly one source kind is acceptable, not a smell.** Union over a single facet is the degenerate case of composition, not a defect — the taxonomy cluster (registry-only) is itself the MVP proof-point. Single-source-kind is the common, expected shape; multi-source-kind composition is exercised when a family that needs it (e.g. graph handle / typed tools: frozen Graph contract + MCP registry + `@architect-shape`) lands.

  Rule: A topic is projected as the union of its single-owner facets
    **Invariant:** A document for a topic draws from every source aggregate that owns one of the topic's facets, and each rendered fact traces to exactly one canonical source; because no fact is authored in two surfaces, the read model composes a union and never resolves a conflict.

  @acceptance-criteria @happy-path
  Scenario: orthogonal facets compose across the implements edge
    Given a production module carries @architect-* JSDoc ("how / with what") and its executable feature carries a Gherkin Rule with a verified-by reference ("what / when")
    When the document for that pattern is projected
    Then the rendered output unions the JSDoc prose and the Gherkin Rule's invariant text
    And neither facet overrides the other because they describe different things

  @acceptance-criteria @happy-path
  Scenario: documents compose shared and document-unique sources from a partial overlap
    Given the frozen Graph/handle and MCP tool catalogs are sources shared by the graph-handle skill and the live-documentation-api spec
    And each of those documents also carries document-unique content
    When the documents are projected
    Then both include the shared handle and typed-tool catalogs projected from the same sources
    And each additionally renders its own document-unique content

  Rule: A fact with a canonical source is generated, never paraphrased
    **Invariant:** When a fact has a canonical code or spec source (an enumeration, a count, a schema field, a handle operation, or a tool signature), every document that states it emits it from that source rather than hand-restating it, so the determinism gate makes cross-document divergence impossible by construction.

  @acceptance-criteria @happy-path
  Scenario: a canonical fact cannot drift across audiences
    Given the tag registry is the canonical source for the taxonomy tag count
    When the skill, reference, and formal-spec documents are projected
    Then all three emit the same count from the registry, not a hand-authored number
