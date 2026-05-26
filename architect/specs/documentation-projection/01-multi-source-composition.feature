@architect
@architect-pattern:MultiSourceComposition
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: MultiSourceComposition - the projection composes over multiple source aggregates

  **User Story:** As a maintainer, I want the documentation projection to compose over every source aggregate that contributes to a topic — annotated TypeScript JSDoc, executable Gherkin rules, Zod schema descriptions, decision records — so that the generated read model presents the union of what those sources know, never a partial view from a single aggregate.

  **Open Questions:**
  - When two source aggregates carry overlapping facts and disagree (JSDoc says "X happens", Gherkin Rule says "X is forbidden"), which one wins in the projection, and how does the conflict surface to the maintainer who must reconcile it at the source?
  - Should the projection emit per-doc provenance (which source aggregates contributed) — useful at first, noise once the substrate is trusted?
  - For topics covered by exactly one source kind today, is that a doc smell, a source-kind smell, or acceptable?

  Rule: A topic with multiple relevant source aggregates is projected from all of them
    **Invariant:** When a topic is described by two or more of the available source aggregates (annotated TS, Gherkin rules, Zod schemas, decision records, JSDoc prose), the projection that produces the document for that topic draws from each; the read model does not present only one aggregate's view of the topic.

  @acceptance-criteria @happy-path
  Scenario: a topic with both annotated code and an executable rule projects from both
    Given a pattern has @architect-* JSDoc on its TypeScript module and a Gherkin Rule with a verified-by reference
    When the document for that pattern is projected
    Then the rendered output includes both the JSDoc prose and the Gherkin Rule's invariant text

  @acceptance-criteria @happy-path
  Scenario: documents compose shared and document-unique sources from a partial overlap
    Given the CLI verb and MCP tool catalog is a source shared by the data-api skill and the live-documentation-api spec
    And each of those documents also carries document-unique content
    When the documents are projected
    Then both include the shared verb and tool catalog projected from the same source
    And each additionally renders its own document-unique content
