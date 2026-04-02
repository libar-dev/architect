@architect
@architect-pattern:BusinessRulesDocumentCodec
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Generation
@architect-implements:BusinessRulesGenerator
Feature: Business Rules Document Codec

  Tests the BusinessRulesCodec transformation from PatternGraph to RenderableDocument.
  Verifies rule extraction, organization by domain/phase, and progressive disclosure.

  Background: Business rules codec test context
    Given a business rules codec test context

  # ===========================================================================
  # Rule 1: Extracts Rule blocks with Invariant and Rationale
  # ===========================================================================

  Rule: Extracts Rule blocks with Invariant and Rationale

    **Invariant:** Annotated Rule blocks must have their Invariant, Rationale, and Verified-by fields faithfully extracted and rendered.
    **Rationale:** These structured annotations are the primary content of business rules documentation; losing them silently produces incomplete output.

    Scenario: Extracts annotated Rule with Invariant and Rationale
      Given a pattern with a rule containing:
        | Field | Value |
        | name | Reservations prevent race conditions |
        | invariant | Only one reservation can exist for a given key at a time |
        | rationale | Check-then-create patterns have TOCTOU vulnerabilities |
        | verifiedBy | Concurrent reservations scenario |
      When decoding with BusinessRulesCodec in detailed mode
      Then the document contains rule "Reservations prevent race conditions"
      And the document contains invariant text "Only one reservation can exist"
      And the document contains rationale text "Check-then-create patterns"
      And the document contains verified by link to "Concurrent reservations scenario"

    Scenario: Extracts unannotated Rule without showing not specified
      Given a pattern with a rule containing:
        | Field | Value |
        | name | Events are immutable |
        | description | Events cannot be modified after creation |
      When decoding with BusinessRulesCodec in detailed mode
      Then the document contains rule "Events are immutable"
      And the document contains description "Events cannot be modified"
      And the document does not contain "not specified"

  # ===========================================================================
  # Rule 2: Organizes rules by domain category and phase
  # ===========================================================================

  Rule: Organizes rules by product area and phase

    **Invariant:** Rules must be grouped by product area and ordered by phase number within each group.
    **Rationale:** Ungrouped or misordered rules make it impossible to find domain-specific constraints or understand their delivery sequence.

    Scenario: Groups rules by product area and phase
      Given patterns with rules in these categories:
        | Category | Rule Name |
        | ddd | Reservations prevent race conditions |
        | event-sourcing | Events are immutable |
        | cqrs | Projections must declare category |
      When decoding with BusinessRulesCodec in standard mode
      Then the document has product area sections with phases

    Scenario: Orders rules by phase within domain
      Given patterns with rules in these phases:
        | Phase | Rule Name |
        | 16 | DCB enables cross-entity validation |
        | 20 | Events contain full context |
        | 20 | Reservations prevent race conditions |
      When decoding with BusinessRulesCodec in standard mode
      Then phase 16 content appears before phase 20 content

  # ===========================================================================
  # Rule 3: Summary mode generates compact output
  # ===========================================================================

  Rule: Summary mode generates compact output

    **Invariant:** Summary mode must produce only a statistics line and omit all detailed rule headings and content.
    **Rationale:** AI context windows have strict token limits; including full detail in summary mode wastes context budget and degrades session quality.

    Scenario: Summary mode includes statistics line
      Given multiple patterns with a total of 5 rules
      When decoding with BusinessRulesCodec in summary mode
      Then the document has a summary line with rule count 5

    Scenario: Summary mode excludes detailed sections
      Given multiple patterns with a total of 5 rules
      When decoding with BusinessRulesCodec in summary mode
      Then the document does not have detailed rule headings

  # ===========================================================================
  # Rule 4: Code examples and tables
  # ===========================================================================

  Rule: Preserves code examples and tables in detailed mode

    **Invariant:** Code examples must appear only in detailed mode and must be excluded from standard mode output.
    **Rationale:** Code blocks in standard mode clutter the overview and push important rule summaries out of view; detailed mode is the opt-in path for full content.

    Scenario: Code examples included in detailed mode
      Given a pattern with a rule containing code examples
      When decoding with BusinessRulesCodec in detailed mode with code examples enabled
      Then the document contains code blocks

    Scenario: Code examples excluded in standard mode
      Given a pattern with a rule containing code examples
      When decoding with BusinessRulesCodec in standard mode
      Then the document does not contain code blocks with language hints

  # ===========================================================================
  # Rule 5: Traceability links
  # ===========================================================================

  Rule: Generates scenario traceability links

    **Invariant:** Verification links must include the source file path so readers can locate the verifying scenario.
    **Rationale:** Links without file paths are unresolvable, breaking the traceability chain between business rules and their executable specifications.

    Scenario: Verification links include file path
      Given a pattern with scenarios in "reservation-pattern.feature" at line 42
      When decoding with BusinessRulesCodec in detailed mode with verification enabled
      Then the verification links include "reservation-pattern.feature"

  # ===========================================================================
  # Rule 6: Progressive disclosure splits by product area
  # ===========================================================================

  Rule: Progressive disclosure generates detail files per product area

    **Invariant:** Each product area with rules must produce a separate detail file, and the main document must link to all detail files via an index table.
    **Rationale:** A single monolithic document becomes unnavigable at scale; progressive disclosure lets readers drill into only the product area they need.

    Scenario: Detail files are generated per product area
      Given patterns with rules in product areas:
        | ProductArea | RuleName |
        | Annotation | Tags validate on scan |
        | Generation | Codecs transform data |
        | Validation | FSM enforces transitions |
      When decoding with BusinessRulesCodec with detail files enabled
      Then the document has 3 additional files for product areas

    Scenario: Main document has product area index table with links
      Given patterns with rules in product areas:
        | ProductArea | RuleName |
        | Annotation | Tags validate on scan |
        | Generation | Codecs transform data |
      When decoding with BusinessRulesCodec with detail files enabled
      Then the document has a table with column "Product Area"
      And the table contains link text "Annotation"

    Scenario: Detail files have back-link to main document
      Given patterns with rules in product areas:
        | ProductArea | RuleName |
        | Annotation | Tags validate on scan |
      When decoding with BusinessRulesCodec with detail files enabled
      Then additional file "business-rules/annotation.md" contains back-link

  # ===========================================================================
  # Rule 7: Empty rules show placeholder instead of blank content
  # ===========================================================================

  Rule: Empty rules show placeholder instead of blank content

    **Invariant:** Rules with no invariant, description, or scenarios must render a placeholder message; rules with scenarios but no invariant must show the verified-by list instead.
    **Rationale:** Blank rule sections are indistinguishable from rendering bugs; explicit placeholders signal intentional incompleteness versus broken extraction.

    Scenario: Rule without invariant or description or scenarios shows placeholder
      Given a pattern with a rule containing:
        | Field | Value |
        | name | Placeholder rule |
      When decoding with BusinessRulesCodec in standard mode
      Then the document contains rule "Placeholder rule"
      And the document contains "No invariant or description specified"

    Scenario: Rule without invariant but with scenarios shows verified-by instead
      Given a pattern with a rule that has no invariant but 2 scenarios
      When decoding with BusinessRulesCodec in standard mode
      Then the document does not contain "No invariant or description specified"
      And the document contains "Verified by"

  # ===========================================================================
  # Rule 8: Rules always render flat without collapsible blocks
  # ===========================================================================

  Rule: Rules always render flat for full visibility

    **Invariant:** Rule output must never use collapsible blocks regardless of rule count; all rule headings must be directly visible.
    **Rationale:** Business rules are compliance-critical content; hiding them behind collapsible sections risks rules being overlooked during review.

    Scenario: Features with many rules render flat without collapsible blocks
      Given a pattern with 4 rules each having 2 scenarios
      When decoding with BusinessRulesCodec in standard mode
      Then the document does not contain collapsible blocks
      And all rule headings are directly visible

  # ===========================================================================
  # Rule 9: Source shown as filename text not broken links
  # ===========================================================================

  Rule: Source file shown as filename text

    **Invariant:** Source file references must render as plain filename text, not as markdown links.
    **Rationale:** Markdown links to local file paths break in every viewer except the local filesystem, producing dead links that erode trust in the documentation.

    Scenario: Source file rendered as plain text not link
      Given a pattern with a rule in file "tests/features/my-feature.feature"
      When decoding with BusinessRulesCodec in standard mode
      Then the document contains "my-feature.feature"

  # ===========================================================================
  # Rule 10: Verified-by renders as compact italic line
  # ===========================================================================

  Rule: Verified-by renders as checkbox list at standard level

    **Invariant:** Verified-by must render as a checkbox list of scenario names, with duplicate names deduplicated.
    **Rationale:** Duplicate entries inflate the checklist and mislead reviewers into thinking more verification exists than actually does.

    Scenario: Rules with scenarios show verified-by checklist
      Given a pattern with a rule having scenarios "Create order" and "Cancel order"
      When decoding with BusinessRulesCodec in standard mode
      Then the document contains verified-by with scenario names

    Scenario: Duplicate scenario names are deduplicated
      Given a pattern with a rule having duplicate scenario names
      When decoding with BusinessRulesCodec in standard mode
      Then the verified-by list contains each scenario name only once

  # ===========================================================================
  # Rule 11: Feature names are humanized from camelCase
  # ===========================================================================

  Rule: Feature names are humanized from camelCase pattern names

    **Invariant:** CamelCase pattern names must be converted to space-separated headings with trailing "Testing" suffixes stripped.
    **Rationale:** Raw camelCase names are unreadable in documentation headings, and "Testing" suffixes leak implementation concerns into user-facing output.

    Scenario: CamelCase pattern name becomes spaced heading
      Given a pattern named "ConfigResolution" with a rule
      When decoding with BusinessRulesCodec in standard mode
      Then the document contains heading "Config Resolution"

    Scenario: Testing suffix is stripped from feature names
      Given a pattern named "ProcessGuardTesting" with a rule
      When decoding with BusinessRulesCodec in standard mode
      Then the document contains heading "Process Guard"
