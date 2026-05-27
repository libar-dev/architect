@architect
@architect-pattern:MultiSourceComposition
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: MultiSourceComposition - the projection composes by union over single-owner facets

  **User Story:** As a maintainer, I want the documentation projection to compose over every source aggregate that contributes to a topic — annotated TypeScript JSDoc, executable Gherkin rules, Zod schema descriptions, decision records — by union, so that the generated read model presents the full union of what those sources know while every individual fact still traces to exactly one canonical source.

  Sources cannot disagree about a pattern: identity is single-source (`mergePatterns` rejects any name owned by both a `.ts` and a `.feature`; `ExtractedPattern` is one record per file), so "which source wins on conflict" is a non-question. Composition is union over orthogonal facets — across `@architect-implements` a production node owns "how / with what" and its test node owns "what / when" (split-ownership, architect-base §8). A fact with a canonical source is generated wherever it appears, so divergence is drift caught by the determinism gate, never a runtime precedence rule. Evidence: the single-source check is `mergePatterns` (`packages/architect-core/src/generators/pipeline/merge-patterns.ts`); the composition mechanism is settled in ADR-010.

  **Open Questions (resolved iteratively, per use-case — the full problem space is not yet visible):**
  - Facet-ownership declaration: implicit by source-kind (registry owns enumerations, ADRs own rationale, Gherkin Rules own invariants) or explicit per topic? Starting point: implicit by kind.
  - Drift-enforcement strength: starting rule is "generate-or-link, never paraphrase a generatable fact" (convention now, lint later); decide validate-time vs doc-gen-time lint when paraphrase-drift first recurs.
  - Per-doc provenance (which aggregates contributed): emit behind a disclosure level, or omit once the substrate is trusted?
  - A topic covered by exactly one source kind today — doc smell, source-kind smell, or acceptable?

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
    Given the CLI verb and MCP tool catalog is a source shared by the data-api skill and the live-documentation-api spec
    And each of those documents also carries document-unique content
    When the documents are projected
    Then both include the shared verb and tool catalog projected from the same source
    And each additionally renders its own document-unique content

  Rule: A fact with a canonical source is generated, never paraphrased
    **Invariant:** When a fact has a canonical code or spec source (an enumeration, a count, a schema field, a verb signature), every document that states it emits it from that source rather than hand-restating it, so the determinism gate makes cross-document divergence impossible by construction.

  @acceptance-criteria @happy-path
  Scenario: a canonical fact cannot drift across audiences
    Given the tag registry is the canonical source for the taxonomy tag count
    When the skill, reference, and formal-spec documents are projected
    Then all three emit the same count from the registry, not a hand-authored number
