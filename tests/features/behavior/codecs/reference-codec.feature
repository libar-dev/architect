@libar-docs
@behavior @reference-codec
@libar-docs-pattern:ReferenceCodecTesting
@libar-docs-status:completed
@libar-docs-implements:ReferenceDocShowcase
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
    Scenario: include filter selects patterns by include tag membership
      Given a reference config with diagramScope include "pipeline-stages"
      And a MasterDataset with patterns in include "pipeline-stages"
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
      Given a reference config with diagramScope combining archContext and include
      And a MasterDataset where one pattern matches archContext and another matches include
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
      And a MasterDataset with patterns in two different include groups
      When decoding at detail level "detailed"
      Then the document contains 2 mermaid blocks
      And the document has headings "Codec Transformation" and "Pipeline Data Flow"

    @happy-path
    Scenario: Diagram direction is reflected in mermaid output
      Given a reference config with LR direction diagramScope
      And a MasterDataset with patterns in include "pipeline-stages"
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

  Rule: Diagram type controls Mermaid output format

    **Invariant:** The diagramType field on DiagramScope selects the Mermaid
    output format. Supported types are graph (flowchart, default),
    sequenceDiagram, and stateDiagram-v2. Each type produces syntactically
    valid Mermaid output with type-appropriate node and edge rendering.

    **Rationale:** Flowcharts cannot naturally express event flows (sequence),
    FSM visualization (state), or temporal ordering. Multiple diagram types
    unlock richer architectural documentation from the same relationship data.

    **Verified by:** Default diagramType produces flowchart,
    Sequence diagram renders participant-message format,
    State diagram renders state transitions,
    Sequence diagram includes neighbor patterns as participants,
    State diagram adds start and end pseudo-states

    @acceptance-criteria @happy-path
    Scenario: Default diagramType produces flowchart
      Given a reference config with diagramScope archContext "orders"
      And a MasterDataset with arch-annotated patterns in context "orders"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content starts with "graph"

    @acceptance-criteria @happy-path
    Scenario: Sequence diagram renders participant-message format
      Given a reference config with diagramScope archContext "orders" and diagramType "sequenceDiagram"
      And a MasterDataset with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content starts with "sequenceDiagram"
      And the mermaid content contains "participant" declarations
      And the mermaid content contains message arrows between participants

    @acceptance-criteria @happy-path
    Scenario: State diagram renders state transitions
      Given a reference config with diagramScope archContext "workflow" and diagramType "stateDiagram-v2"
      And a MasterDataset with patterns in context "workflow" with dependsOn relationships
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content starts with "stateDiagram-v2"
      And the mermaid content contains state transition syntax

    @acceptance-criteria @edge-case
    Scenario: Sequence diagram includes neighbor patterns as participants
      Given a reference config with diagramScope archContext "orders" and diagramType "sequenceDiagram"
      And a MasterDataset with an orders pattern that uses an external pattern
      When decoding at detail level "detailed"
      Then the mermaid content contains participant declarations for both scope and neighbor patterns

    @acceptance-criteria @edge-case
    Scenario: State diagram adds start and end pseudo-states
      Given a reference config with diagramScope archContext "workflow" and diagramType "stateDiagram-v2"
      And a MasterDataset with a linear dependsOn chain of workflow patterns
      When decoding at detail level "detailed"
      Then the mermaid content contains a start pseudo-state transition
      And the mermaid content contains an end pseudo-state transition

    @acceptance-criteria @happy-path
    Scenario: C4 diagram renders system boundary format
      Given a reference config with diagramScope archContext "orders" and diagramType "C4Context"
      And a MasterDataset with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the mermaid content starts with "C4Context"
      And the mermaid content contains a Boundary block for "orders"
      And the mermaid content contains System declarations
      And the mermaid content contains Rel declarations

    @acceptance-criteria @happy-path
    Scenario: C4 diagram renders neighbor patterns as external systems
      Given a reference config with diagramScope archContext "orders" and diagramType "C4Context"
      And a MasterDataset with an orders pattern that uses an external pattern
      When decoding at detail level "detailed"
      Then the mermaid content contains a System_Ext declaration

    @acceptance-criteria @happy-path
    Scenario: Class diagram renders class members and relationships
      Given a reference config with diagramScope archContext "orders" and diagramType "classDiagram"
      And a MasterDataset with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the mermaid content starts with "classDiagram"
      And the mermaid content contains class declarations with members
      And the mermaid content contains relationship arrows

    @acceptance-criteria @happy-path
    Scenario: Class diagram renders archRole as stereotype
      Given a reference config with diagramScope archContext "orders" and diagramType "classDiagram"
      And a MasterDataset with a service pattern and a projection pattern in context "orders"
      When decoding at detail level "detailed"
      Then the mermaid content contains a service stereotype
      And the mermaid content contains a projection stereotype

  Rule: Edge labels and custom node shapes enrich diagram readability

    **Invariant:** Relationship edges display labels describing the relationship
    type (uses, depends on, implements, extends). Edge labels are enabled by
    default and can be disabled via showEdgeLabels false. Node shapes in
    flowchart diagrams vary by archRole value using Mermaid shape syntax.

    **Rationale:** Unlabeled edges are ambiguous without consulting a legend.
    Custom node shapes make archRole visually distinguishable without color
    reliance, improving accessibility and scanability.

    **Verified by:** Edge labels appear by default,
    Edge labels can be disabled,
    archRole controls node shape,
    Unknown archRole falls back to rectangle

    @acceptance-criteria @happy-path
    Scenario: Relationship edges display type labels by default
      Given a reference config with diagramScope archContext "orders"
      And a MasterDataset with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the mermaid content contains labeled edges with relationship type text

    @acceptance-criteria @happy-path
    Scenario: Edge labels can be disabled for compact diagrams
      Given a reference config with diagramScope archContext "orders" and showEdgeLabels false
      And a MasterDataset with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the mermaid content contains unlabeled edges

    @acceptance-criteria @happy-path
    Scenario: archRole controls Mermaid node shape
      Given a reference config with diagramScope archContext "orders"
      And a MasterDataset with a service pattern and a projection pattern in context "orders"
      When decoding at detail level "detailed"
      Then the service node uses rounded rectangle syntax
      And the projection node uses cylinder syntax

    @acceptance-criteria @edge-case
    Scenario: Pattern without archRole uses default rectangle shape
      Given a reference config with diagramScope archContext "orders"
      And a MasterDataset with a pattern without archRole in context "orders"
      When decoding at detail level "detailed"
      Then the node uses default rectangle syntax

  Rule: Collapsible blocks wrap behavior rules for progressive disclosure

    **Invariant:** When a behavior pattern has 3 or more rules and detail level
    is not summary, each rule's content is wrapped in a collapsible block with the
    rule name and scenario count in the summary. Patterns with fewer than 3 rules
    render rules flat. Summary level never produces collapsible blocks.

    **Rationale:** Behavior sections with many rules produce substantial content at
    detailed level. Collapsible blocks enable progressive disclosure so readers can
    expand only the rules they need.

    **Verified by:** Many rules use collapsible at detailed level,
    Few rules render flat,
    Summary level suppresses collapsible

    @acceptance-criteria @happy-path
    Scenario: Behavior pattern with many rules uses collapsible blocks at detailed level
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern with 3 structured rules
      When decoding at detail level "detailed"
      Then the document contains at least 1 collapsible block
      And each collapsible block summary includes a rule name

    @acceptance-criteria @happy-path
    Scenario: Behavior pattern with few rules does not use collapsible blocks
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern with 2 structured rules
      When decoding at detail level "detailed"
      Then the document does not contain collapsible blocks

    @acceptance-criteria @happy-path
    Scenario: Summary level never produces collapsible blocks
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern with 3 structured rules
      When decoding at detail level "summary"
      Then the document does not contain collapsible blocks

  Rule: Link-out blocks provide source file cross-references

    **Invariant:** At standard and detailed levels, each behavior pattern includes
    a link-out block referencing its source file path. At summary level, link-out
    blocks are omitted for compact output.

    **Rationale:** Cross-reference links enable readers to navigate from generated
    documentation to the annotated source files, closing the loop between generated
    docs and the single source of truth.

    **Verified by:** Detailed level includes source link-out,
    Standard level includes source link-out,
    Summary level omits link-out

    @acceptance-criteria @happy-path
    Scenario: Behavior pattern includes source file link-out at detailed level
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern in category "process-guard"
      When decoding at detail level "detailed"
      Then the document contains at least 1 link-out block
      And the link-out path references a source file

    @acceptance-criteria @happy-path
    Scenario: Standard level includes source file link-out
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern in category "process-guard"
      When decoding at detail level "standard"
      Then the document contains at least 1 link-out block

    @acceptance-criteria @happy-path
    Scenario: Summary level omits link-out blocks
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a MasterDataset with a behavior pattern in category "process-guard"
      When decoding at detail level "summary"
      Then the document does not contain link-out blocks
