@behavior @reference-codec
@libar-docs-pattern:ReferenceCodecTesting
@libar-docs-product-area:Codec
Feature: Reference Document Codec

  Parameterized codec factory that creates reference document codecs
  from configuration objects. Each config replaces one recipe .feature file
  and produces a RenderableDocument at configurable detail levels.

  Background:
    Given a reference codec test context

  Rule: Empty datasets produce fallback content

    @happy-path @edge-case
    Scenario: Codec with no matching content produces fallback message
      Given a reference config with convention tags "nonexistent" and behavior tags "nonexistent"
      And an empty MasterDataset
      When decoding at detail level "standard"
      Then the document title matches the config title
      And the document contains a no-content fallback paragraph

  Rule: Convention content is rendered as sections

    @happy-path
    Scenario: Convention rules appear as H2 headings with content
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a MasterDataset with a convention-tagged pattern:
        | convention | ruleName         | invariant                    |
        | fsm-rules  | FSM Transitions  | Only valid transitions apply |
      When decoding at detail level "detailed"
      Then the document has a heading "FSM Transitions"
      And the document contains text "Only valid transitions apply"

    @happy-path
    Scenario: Convention tables are rendered in the document
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a MasterDataset with a convention pattern with a table
      When decoding at detail level "detailed"
      Then the document has at least 1 table

  Rule: Detail level controls output density

    @happy-path
    Scenario: Summary level omits narrative and rationale
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a MasterDataset with a convention pattern with narrative and rationale
      When decoding at detail level "summary"
      Then the document does not contain text "Rationale"
      And the document does not contain narrative text

    @happy-path
    Scenario: Detailed level includes rationale and verified-by
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a MasterDataset with a convention pattern with narrative and rationale
      When decoding at detail level "detailed"
      Then the document contains text "Rationale"

  Rule: Behavior sections are rendered from category-matching patterns

    @happy-path
    Scenario: Behavior-tagged patterns appear in a Behavior Specifications section
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern in category "process-guard"
      When decoding at detail level "standard"
      Then the document has a heading "Behavior Specifications"

  Rule: Shape sources are extracted from matching patterns

    @happy-path
    Scenario: Shapes appear when source file matches shapeSources glob
      Given a reference config with shapeSources "src/lint/*.ts"
      And a MasterDataset with a pattern at "src/lint/rules.ts" with extracted shapes
      When decoding at detail level "detailed"
      Then the document has a heading "API Types"
      And the document contains a code block with "typescript"

    @happy-path
    Scenario: Summary level shows shapes as a compact table
      Given a reference config with shapeSources "src/lint/*.ts"
      And a MasterDataset with a pattern at "src/lint/rules.ts" with extracted shapes
      When decoding at detail level "summary"
      Then the document has a heading "API Types"
      And the document has at least 1 table

    @edge-case
    Scenario: No shapes when source file does not match glob
      Given a reference config with shapeSources "src/config/*.ts"
      And a MasterDataset with a pattern at "src/lint/rules.ts" with extracted shapes
      When decoding at detail level "detailed"
      Then the document does not have a heading "API Types"

  Rule: Convention and behavior content compose in a single document

    @happy-path
    Scenario: Both convention and behavior sections appear when data exists
      Given a reference config with convention tags "fsm-rules" and behavior tags "process-guard"
      And a MasterDataset with both convention and behavior data
      When decoding at detail level "detailed"
      Then the document has a heading "FSM Transitions"
      And the document has a heading "Behavior Specifications"

  Rule: Composition order follows AD-5: conventions then shapes then behaviors

    @happy-path
    Scenario: Convention headings appear before shapes before behaviors
      Given a reference config with all three content sources
      And a MasterDataset with convention, shape, and behavior data
      When decoding at detail level "detailed"
      Then the heading "FSM Transitions" appears before "API Types"
      And the heading "API Types" appears before "Behavior Specifications"

  Rule: Convention code examples render as mermaid blocks

    @happy-path
    Scenario: Convention with mermaid content produces mermaid block in output
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a MasterDataset with a convention pattern with a mermaid diagram
      When decoding at detail level "detailed"
      Then the document contains a mermaid block

    @happy-path
    Scenario: Summary level omits convention code examples
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a MasterDataset with a convention pattern with a mermaid diagram
      When decoding at detail level "summary"
      Then the document does not contain a mermaid block

  Rule: Scoped diagrams are generated from diagramScope config

    @happy-path
    Scenario: Config with diagramScope produces mermaid block at detailed level
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with arch-annotated patterns in context "lint"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the document has a heading "Component Overview"

    @happy-path
    Scenario: Neighbor patterns appear in diagram with distinct style
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with arch patterns where lint uses validation
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "neighbor"
      And the mermaid diagram includes a Related subgraph
      And the mermaid diagram includes dashed neighbor styling

    @happy-path
    Scenario: archView filter selects patterns by view membership
      Given a reference config with diagramScope archView "pipeline-stages"
      And a MasterDataset with patterns in arch view "pipeline-stages"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "PatternScanner"

    @edge-case
    Scenario: Self-contained scope produces no Related subgraph
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with self-contained lint patterns
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content does not contain "Related"

    @edge-case
    Scenario: Multiple filter dimensions OR together
      Given a reference config with diagramScope combining archContext and archView
      And a MasterDataset where one pattern matches archContext and another matches archView
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains both "LintRules" and "DocExtractor"

    @happy-path
    Scenario: Explicit pattern names filter selects named patterns
      Given a reference config with diagramScope patterns "LintRules"
      And a MasterDataset with multiple arch-annotated patterns
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "LintRules"
      And the mermaid content does not contain "DocExtractor"

    @edge-case
    Scenario: Config without diagramScope produces no diagram section
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a MasterDataset with arch-annotated patterns in context "lint"
      When decoding at detail level "detailed"
      Then the document does not have a heading "Component Overview"

    @happy-path
    Scenario: Summary level omits scoped diagram
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with arch-annotated patterns in context "lint"
      When decoding at detail level "summary"
      Then the document does not contain a mermaid block

  Rule: Multiple diagram scopes produce multiple mermaid blocks

    @happy-path
    Scenario: Config with diagramScopes array produces multiple diagrams
      Given a reference config with two diagramScopes
      And a MasterDataset with patterns in two different arch views
      When decoding at detail level "detailed"
      Then the document contains 2 mermaid blocks
      And the document has headings "Codec Transformation" and "Pipeline Data Flow"

    @happy-path
    Scenario: Diagram direction is reflected in mermaid output
      Given a reference config with LR direction diagramScope
      And a MasterDataset with patterns in arch view "pipeline-stages"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "graph LR"

    @edge-case
    Scenario: Legacy diagramScope still works when diagramScopes is absent
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with arch-annotated patterns in context "lint"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the document has a heading "Component Overview"

  Rule: Standard detail level includes narrative but omits rationale

    @happy-path
    Scenario: Standard level includes narrative but omits rationale
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a MasterDataset with a convention pattern with narrative and rationale
      When decoding at detail level "standard"
      Then the document contains narrative text
      And the document does not contain text "Rationale"
