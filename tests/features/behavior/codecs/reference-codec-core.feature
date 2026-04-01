@architect
@behavior @reference-codec
@architect-pattern:ReferenceCodecCoreTesting
@architect-status:completed
@architect-unlock-reason:'Split-from-original'
@architect-implements:ReferenceDocShowcase
@architect-product-area:Generation
Feature: Reference Codec - Core Behavior

  Parameterized codec factory that creates reference document codecs
  from configuration objects. Core behavior including empty datasets,
  conventions, detail levels, shapes, composition, and mermaid blocks.

  Background:
    Given a reference codec test context

  Rule: Empty datasets produce fallback content

    **Invariant:** A codec must always produce a valid document, even when no matching content exists in the dataset.
    **Rationale:** Consumers rely on a consistent document structure; a missing or null document would cause rendering failures downstream.

    @happy-path @edge-case
    Scenario: Codec with no matching content produces fallback message
      Given a reference config with convention tags "nonexistent" and behavior tags "nonexistent"
      And an empty PatternGraph
      When decoding at detail level "standard"
      Then the document title matches the config title
      And the document contains a no-content fallback paragraph

  Rule: Convention content is rendered as sections

    **Invariant:** Convention-tagged patterns must render as distinct headed sections with their rule names, invariants, and tables preserved.
    **Rationale:** Conventions define project-wide constraints; losing their structure in generated docs would make them unenforceable and undiscoverable.

    @happy-path
    Scenario: Convention rules appear as H2 headings with content
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a PatternGraph with a convention-tagged pattern:
        | convention | ruleName         | invariant                    |
        | fsm-rules  | FSM Transitions  | Only valid transitions apply |
      When decoding at detail level "detailed"
      Then the document has a heading "FSM Transitions"
      And the document contains text "Only valid transitions apply"

    @happy-path
    Scenario: Convention tables are rendered in the document
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a PatternGraph with a convention pattern with a table
      When decoding at detail level "detailed"
      Then the document has at least 1 table

  Rule: Detail level controls output density

    **Invariant:** Each detail level (summary, standard, detailed) must produce a deterministic subset of content, with summary being the most restrictive.
    **Rationale:** AI session contexts have strict token budgets; uncontrolled output density wastes context window and degrades session quality.

    @happy-path
    Scenario: Summary level omits narrative and rationale
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a PatternGraph with a convention pattern with narrative and rationale
      When decoding at detail level "summary"
      Then the document does not contain text "Rationale"
      And the document does not contain narrative text

    @happy-path
    Scenario: Detailed level includes rationale and verified-by
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a PatternGraph with a convention pattern with narrative and rationale
      When decoding at detail level "detailed"
      Then the document contains text "Rationale"

  Rule: Behavior sections are rendered from category-matching patterns

    **Invariant:** Only patterns whose category matches the configured behavior tags may appear in the Behavior Specifications section.
    **Rationale:** Mixing unrelated categories into a single behavior section would produce misleading documentation that conflates distinct concerns.

    @happy-path
    Scenario: Behavior-tagged patterns appear in a Behavior Specifications section
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a PatternGraph with a behavior pattern in category "process-guard"
      When decoding at detail level "standard"
      Then the document has a heading "Behavior Specifications"

  Rule: Source selectors are extracted from matching patterns

    **Invariant:** Only shapes from patterns whose file path matches the configured source selector glob may appear in the API Types section.
    **Rationale:** Including shapes from unrelated source paths would pollute the API Types section with irrelevant type definitions, breaking the scoped documentation contract.

    @happy-path
    Scenario: Shapes appear when source file matches source selector glob
      Given a reference config with source selector "src/lint/*.ts"
      And a PatternGraph with a pattern at "src/lint/rules.ts" with extracted shapes
      When decoding at detail level "detailed"
      Then the document has a heading "API Types"
      And the document contains a code block with "typescript"

    @happy-path
    Scenario: Summary level shows shapes as a compact table
      Given a reference config with source selector "src/lint/*.ts"
      And a PatternGraph with a pattern at "src/lint/rules.ts" with extracted shapes
      When decoding at detail level "summary"
      Then the document has a heading "API Types"
      And the document has at least 1 table

    @edge-case
    Scenario: No shapes when source file does not match glob
      Given a reference config with source selector "src/config/*.ts"
      And a PatternGraph with a pattern at "src/lint/rules.ts" with extracted shapes
      When decoding at detail level "detailed"
      Then the document does not have a heading "API Types"

  Rule: Convention and behavior content compose in a single document

    **Invariant:** Convention and behavior content must coexist in the same RenderableDocument when both are present in the dataset.
    **Rationale:** Splitting conventions and behaviors into separate documents would force consumers to cross-reference multiple files, losing the unified view of a product area.

    @happy-path
    Scenario: Both convention and behavior sections appear when data exists
      Given a reference config with convention tags "fsm-rules" and behavior tags "process-guard"
      And a PatternGraph with both convention and behavior data
      When decoding at detail level "detailed"
      Then the document has a heading "FSM Transitions"
      And the document has a heading "Behavior Specifications"

  Rule: Composition order follows AD-5: conventions then shapes then behaviors

    **Invariant:** Document sections must follow the canonical order: conventions, then API types (shapes), then behavior specifications.
    **Rationale:** AD-5 establishes a consistent reading flow (rules, then types, then specs); violating this order would confuse readers who expect a stable document structure.

    @happy-path
    Scenario: Convention headings appear before shapes before behaviors
      Given a reference config with all three content sources
      And a PatternGraph with convention, shape, and behavior data
      When decoding at detail level "detailed"
      Then the heading "FSM Transitions" appears before "API Types"
      And the heading "API Types" appears before "Behavior Specifications"

  Rule: Convention code examples render as mermaid blocks

    **Invariant:** Mermaid diagram content in conventions must render as fenced mermaid blocks, and must be excluded at summary detail level.
    **Rationale:** Mermaid diagrams are visual aids that require rendering support; emitting them as plain text would produce unreadable output, and including them in summaries wastes token budget.

    @happy-path
    Scenario: Convention with mermaid content produces mermaid block in output
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a PatternGraph with a convention pattern with a mermaid diagram
      When decoding at detail level "detailed"
      Then the document contains a mermaid block

    @happy-path
    Scenario: Summary level omits convention code examples
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a PatternGraph with a convention pattern with a mermaid diagram
      When decoding at detail level "summary"
      Then the document does not contain a mermaid block
