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
    Scenario: archLayer filter selects patterns by architectural layer
      Given a reference config with diagramScope archLayer "domain"
      And a MasterDataset with patterns in domain and infrastructure layers
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "DomainPattern"
      And the mermaid content does not contain "InfraPattern"

    @happy-path
    Scenario: archLayer and archContext compose via OR
      Given a reference config with diagramScope archLayer "domain" and archContext "shared"
      And a MasterDataset with a domain-layer pattern and a shared-context pattern
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains both "DomainPattern" and "SharedPattern"

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

  Rule: Deep behavior rendering with structured annotations

    @happy-path
    Scenario: Detailed level renders structured behavior rules
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern with structured rules
      When decoding at detail level "detailed"
      Then the document has a heading "Invariant Rule"
      And the document contains text "Must follow FSM transitions"
      And the rendered output includes rationale "Prevents state corruption"
      And the document contains a verified-by list with "Scenario A" and "Scenario B"

    @happy-path
    Scenario: Standard level renders behavior rules without rationale
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern with structured rules
      When decoding at detail level "standard"
      Then the document has a heading "Invariant Rule"
      And the document contains text "Must follow FSM transitions"
      And the document does not contain text "Prevents state corruption"

    @happy-path
    Scenario: Summary level shows behavior rules as truncated table
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern with structured rules
      When decoding at detail level "summary"
      Then the document has at least 1 table
      And the document does not have a heading "Invariant Rule"

    @edge-case
    Scenario: Scenario names and verifiedBy merge as deduplicated list
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern with overlapping scenarioNames and verifiedBy
      When decoding at detail level "detailed"
      Then the document contains a verified-by list with 3 unique entries

  Rule: Shape JSDoc prose renders at standard and detailed levels

    @happy-path
    Scenario: Standard level includes JSDoc paragraph before code blocks
      Given a reference config with shapeSources "src/lint/*.ts"
      And a MasterDataset with a shape pattern with JSDoc
      When decoding at detail level "standard"
      Then the document contains text "Input to the process guard decider function"

    @happy-path
    Scenario: Detailed level includes JSDoc paragraph and property table
      Given a reference config with shapeSources "src/lint/*.ts"
      And a MasterDataset with a shape pattern with JSDoc and property docs
      When decoding at detail level "detailed"
      Then the document contains text "Input to the process guard decider function"
      And the document has at least 1 table

    @edge-case
    Scenario: Shapes without JSDoc render code blocks only
      Given a reference config with shapeSources "src/lint/*.ts"
      And a MasterDataset with a shape pattern without JSDoc
      When decoding at detail level "standard"
      Then the document does not contain text "Input to the process guard"
      And the document contains a code block with "typescript"

  Rule: Shape sections render param returns and throws documentation

    @happy-path
    Scenario: Detailed level renders param table for function shapes
      Given a reference config with shapeSources "src/lint/*.ts"
      And a MasterDataset with a function shape with param docs
      When decoding at detail level "detailed"
      Then the document has a table with columns "Parameter" and "Type" and "Description"
      And the table contains param "orderId" with description "The unique order identifier"

    @happy-path
    Scenario: Detailed level renders returns and throws documentation
      Given a reference config with shapeSources "src/lint/*.ts"
      And a MasterDataset with a function shape with returns and throws docs
      When decoding at detail level "detailed"
      Then the rendered output contains returns paragraph with type and description
      And the document has a table with columns "Exception" and "Description"

    @happy-path
    Scenario: Standard level renders param table without throws
      Given a reference config with shapeSources "src/lint/*.ts"
      And a MasterDataset with a function shape with param and throws docs
      When decoding at detail level "standard"
      Then the document has a table with columns "Parameter" and "Type" and "Description"
      And the document does not have a table with column "Exception"

    @edge-case
    Scenario: Shapes without param docs skip param table
      Given a reference config with shapeSources "src/lint/*.ts"
      And a MasterDataset with a shape pattern with JSDoc
      When decoding at detail level "detailed"
      Then the document does not have a table with column "Parameter"
