@architect
@architect-pattern:ClaudeMetadataParityTesting
@architect-status:active
@architect-product-area:Annotation
Feature: Claude metadata parity in extractors
  The extractor must preserve Claude routing metadata from TypeScript directives
  and keep the sync and async Gherkin paths aligned for the same metadata fields.

  Background: Extractor parity setup
    Given the extractor parity test context is initialized

  Rule: TypeScript extraction preserves Claude metadata

    **Invariant:** Claude routing metadata from TypeScript directives must be copied onto the extracted pattern.
    **Rationale:** Generated CLAUDE.md modules depend on the extracted pattern fields, so dropping directive metadata breaks downstream document routing.
    **Verified by:** Extracted TypeScript pattern includes claudeModule, claudeSection, and claudeTags

    @acceptance-criteria @happy-path
    Scenario: Extracted TypeScript pattern keeps Claude metadata
      Given a TypeScript source file with Claude metadata directives
      When extracting the TypeScript pattern
      Then the extracted pattern should include metadata:
        | field         | value                      |
        | claudeModule  | process-guard              |
        | claudeSection | process                    |
        | claudeTags    | core-mandatory, workflow   |

  Rule: Gherkin sync and async extraction keep Claude and ADR metadata aligned

    **Invariant:** Sync and async Gherkin extraction must produce the same Claude and ADR metadata fields.
    **Rationale:** The async path is a performance optimization, not a different contract. Diverging metadata fields would make generated docs depend on call path.
    **Verified by:** Sync and async extraction match for claudeModule, claudeSection, claudeTags, adrTheme, adrLayer, and effortActual

    @acceptance-criteria @happy-path
    Scenario: Sync and async Gherkin extraction return the same metadata
      Given a Gherkin feature file with Claude and ADR metadata
      When extracting the Gherkin pattern synchronously and asynchronously
      Then the sync and async metadata should match for fields:
        | field         |
        | claudeModule  |
        | claudeSection |
        | claudeTags    |
        | adrTheme      |
        | adrLayer      |
        | effortActual   |
      And the extracted metadata should include:
        | field         | value                    |
        | claudeModule  | process-guard            |
        | claudeSection | process                  |
        | claudeTags    | core-mandatory, workflow |
        | adrTheme      | persistence              |
        | adrLayer      | foundation               |
        | effortActual  | 3h                       |
