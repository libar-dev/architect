@architect
@behavior @reference-codec
@architect-pattern:ReferenceCodecDetailRendering
@architect-status:completed
@architect-unlock-reason:'Split-from-original'
@architect-implements:ReferenceDocShowcase
@architect-product-area:Generation
Feature: Reference Codec - Detail Level Rendering

  Standard detail level behavior, deep behavior rendering with structured
  annotations, shape JSDoc prose, param/returns/throws documentation,
  collapsible blocks, link-out blocks, and include tags.

  Background:
    Given a reference codec test context

  Rule: Standard detail level includes narrative but omits rationale

    **Invariant:** Standard detail level renders narrative prose for convention patterns but excludes rationale sections, reserving rationale for the detailed level only.
    **Rationale:** Progressive disclosure prevents information overload at the standard level while ensuring readers who need deeper justification can access it at the detailed level.

    @happy-path
    Scenario: Standard level includes narrative but omits rationale
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a PatternGraph with a convention pattern with narrative and rationale
      When decoding at detail level "standard"
      Then the document contains narrative text
      And the document does not contain text "Rationale"

  Rule: Deep behavior rendering with structured annotations

    **Invariant:** Behavior patterns render structured rule annotations (invariant, rationale, verified-by) at detailed level, invariant-only at standard level, and a truncated table at summary level.
    **Rationale:** Structured annotations are the primary mechanism for surfacing business rules from Gherkin sources; inconsistent rendering across detail levels would produce misleading or incomplete documentation.

    @happy-path
    Scenario: Detailed level renders structured behavior rules
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a PatternGraph with a behavior pattern with structured rules
      When decoding at detail level "detailed"
      Then the document has a heading "Invariant Rule"
      And the document contains text "Must follow FSM transitions"
      And the rendered output includes rationale "Prevents state corruption"
      And the document contains a verified-by list with "Scenario A" and "Scenario B"

    @happy-path
    Scenario: Standard level renders behavior rules without rationale
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a PatternGraph with a behavior pattern with structured rules
      When decoding at detail level "standard"
      Then the document has a heading "Invariant Rule"
      And the document contains text "Must follow FSM transitions"
      And the document does not contain text "Prevents state corruption"

    @happy-path
    Scenario: Summary level shows behavior rules as truncated table
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a PatternGraph with a behavior pattern with structured rules
      When decoding at detail level "summary"
      Then the document has at least 1 table
      And the document does not have a heading "Invariant Rule"

    @edge-case
    Scenario: Scenario names and verifiedBy merge as deduplicated list
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a PatternGraph with a behavior pattern with overlapping scenarioNames and verifiedBy
      When decoding at detail level "detailed"
      Then the document contains a verified-by list with 3 unique entries

  Rule: Shape JSDoc prose renders at standard and detailed levels

    **Invariant:** Shape patterns with JSDoc prose include that prose in rendered code blocks at standard and detailed levels. Shapes without JSDoc render code blocks only.
    **Rationale:** JSDoc prose provides essential context for API types; omitting it would force readers to open source files to understand a shape's purpose, undermining the generated documentation's self-sufficiency.

    @happy-path
    Scenario: Standard level includes JSDoc in code blocks
      Given a reference config with source selector "src/lint/*.ts"
      And a PatternGraph with a shape pattern with JSDoc
      When decoding at detail level "standard"
      Then the document contains text "Input to the process guard decider function"

    @happy-path
    Scenario: Detailed level includes JSDoc in code block and property table
      Given a reference config with source selector "src/lint/*.ts"
      And a PatternGraph with a shape pattern with JSDoc and property docs
      When decoding at detail level "detailed"
      Then the document contains text "Input to the process guard decider function"
      And the document has at least 1 table

    @edge-case
    Scenario: Shapes without JSDoc render code blocks only
      Given a reference config with source selector "src/lint/*.ts"
      And a PatternGraph with a shape pattern without JSDoc
      When decoding at detail level "standard"
      Then the document does not contain text "Input to the process guard"
      And the document contains a code block with "typescript"

  Rule: Shape sections render param returns and throws documentation

    **Invariant:** Function shapes render parameter, returns, and throws documentation at detailed level. Standard level renders parameter tables but omits throws. Shapes without param docs skip the parameter table entirely.
    **Rationale:** Throws documentation is diagnostic detail that clutters standard output; separating it into detailed level keeps standard output focused on the function's contract while preserving full error documentation for consumers who need it.

    @happy-path
    Scenario: Detailed level renders param table for function shapes
      Given a reference config with source selector "src/lint/*.ts"
      And a PatternGraph with a function shape with param docs
      When decoding at detail level "detailed"
      Then the document has a table with columns "Parameter" and "Type" and "Description"
      And the table contains param "orderId" with description "The unique order identifier"

    @happy-path
    Scenario: Detailed level renders returns and throws documentation
      Given a reference config with source selector "src/lint/*.ts"
      And a PatternGraph with a function shape with returns and throws docs
      When decoding at detail level "detailed"
      Then the rendered output contains returns paragraph with type and description
      And the document has a table with columns "Exception" and "Description"

    @happy-path
    Scenario: Standard level renders param table without throws
      Given a reference config with source selector "src/lint/*.ts"
      And a PatternGraph with a function shape with param and throws docs
      When decoding at detail level "standard"
      Then the document has a table with columns "Parameter" and "Type" and "Description"
      And the document does not have a table with column "Exception"

    @edge-case
    Scenario: Shapes without param docs skip param table
      Given a reference config with source selector "src/lint/*.ts"
      And a PatternGraph with a shape pattern with JSDoc
      When decoding at detail level "detailed"
      Then the document does not have a table with column "Parameter"

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
      And a PatternGraph with a behavior pattern with 3 structured rules
      When decoding at detail level "detailed"
      Then the document contains at least 1 collapsible block
      And each collapsible block summary includes a rule name

    @acceptance-criteria @happy-path
    Scenario: Behavior pattern with few rules does not use collapsible blocks
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a PatternGraph with a behavior pattern with 2 structured rules
      When decoding at detail level "detailed"
      Then the document does not contain collapsible blocks

    @acceptance-criteria @happy-path
    Scenario: Summary level never produces collapsible blocks
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a PatternGraph with a behavior pattern with 3 structured rules
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
      And a PatternGraph with a behavior pattern in category "process-guard"
      When decoding at detail level "detailed"
      Then the document contains at least 1 link-out block
      And the link-out path references a source file

    @acceptance-criteria @happy-path
    Scenario: Standard level includes source file link-out
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a PatternGraph with a behavior pattern in category "process-guard"
      When decoding at detail level "standard"
      Then the document contains at least 1 link-out block

    @acceptance-criteria @happy-path
    Scenario: Summary level omits link-out blocks
      Given a reference config with convention tags "" and behavior tags "process-guard"
      And a PatternGraph with a behavior pattern in category "process-guard"
      When decoding at detail level "summary"
      Then the document does not contain link-out blocks

  Rule: Include tags route cross-cutting content into reference documents

    **Invariant:** Patterns with matching include tags appear alongside
    category-selected patterns in the behavior section. The merging
    is additive (OR semantics).
    **Rationale:** Cross-cutting patterns (e.g., shared utilities, common validators) belong in multiple reference documents; without include-tag routing, these patterns would only appear in their home category, leaving dependent documents incomplete.

    **Verified by:** Include-tagged pattern appears in behavior section,
    Include-tagged pattern is additive with category-selected patterns,
    Pattern without matching include tag is excluded

    @acceptance-criteria @happy-path
    Scenario: Include-tagged pattern appears in behavior section
      Given a reference config with includeTags "reference-sample"
      And a PatternGraph with a pattern that has include "reference-sample"
      When decoding at detail level "standard"
      Then the document has a heading "Behavior Specifications"
      And the document contains text "IncludedPattern"

    @acceptance-criteria @happy-path
    Scenario: Include-tagged pattern is additive with category-selected patterns
      Given a reference config with behavior tags "lint" and includeTags "reference-sample"
      And a PatternGraph with a category pattern and an include-tagged pattern
      When decoding at detail level "standard"
      Then the document contains text "LintPattern"
      And the document contains text "IncludedPattern"

    @acceptance-criteria @edge-case
    Scenario: Pattern without matching include tag is excluded
      Given a reference config with includeTags "reference-sample"
      And a PatternGraph with a pattern that has include "other-doc"
      When decoding at detail level "standard"
      Then the document does not have a heading "Behavior Specifications"
