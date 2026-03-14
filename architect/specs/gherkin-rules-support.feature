@architect
@architect-pattern:GherkinRulesSupport
@architect-status:completed
@architect-unlock-reason:Add-libar-docs-opt-in-marker
@architect-phase:100
@architect-release:v1.0.0
@architect-effort:4h
@architect-product-area:Annotation
@architect-business-value:enable-human-readable-documentation-from-feature-files
@architect-priority:high
Feature: Gherkin Rules and Custom Content Support

  **Problem:**
  Feature files were limited to flat scenario lists. Business rules, rationale,
  and rich descriptions could not be captured in a way that:
  - Tests ignore (vitest-cucumber skips descriptions)
  - Generators render (PRD shows business context)
  - Maintains single source of truth (one file, two purposes)

  The Gherkin `Rule:` keyword was parsed by @cucumber/gherkin but our pipeline
  dropped the data at scanner/extractor stages.

  **Solution:**
  Extended the documentation pipeline to capture and render:
  - `Rule:` keyword as Business Rules sections
  - Rule descriptions (rationale, exceptions, context)
  - DataTables in steps as Markdown tables
  - DocStrings in steps as code blocks

  Infrastructure changes (schema, scanner, extractor) are shared by all generators.
  Rendering was added to PRD generator as reference implementation.

  Confirmed vitest-cucumber supports Rules via `Rule()` + `RuleScenario()` syntax.
  No migration to alternative frameworks needed.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | GherkinRuleSchema | complete | No | validation-schemas/feature.ts |
      | Rule parsing in AST parser | complete | No | scanner/gherkin-ast-parser.ts |
      | Rules passthrough in scanner | complete | No | scanner/gherkin-scanner.ts |
      | Rules field in ExtractedPattern | complete | No | validation-schemas/extracted-pattern.ts |
      | Rules mapping in extractor | complete | No | extractor/gherkin-extractor.ts |
      | Business Rules rendering | complete | No | generators/sections/prd-features.ts |
      | DataTable rendering in acceptance criteria | complete | No | generators/sections/prd-features.ts |
      | DocString rendering in acceptance criteria | complete | No | generators/sections/prd-features.ts |

  Rule: Rules flow through the entire pipeline without data loss

    **Invariant:** Rule data (name, description, tags, scenarios) must be preserved through every pipeline stage from parser to ExtractedPattern.
    **Rationale:** Any data loss at an intermediate stage makes rule content invisible to all downstream generators, silently producing incomplete documentation.

    The @cucumber/gherkin parser extracts Rules natively. Our pipeline must
    preserve this data through scanner, extractor, and into ExtractedPattern
    so generators can access rule names, descriptions, and nested scenarios.

    @acceptance-criteria
    Scenario: Rules are captured by AST parser
      Given a feature file with Rule: keyword
      When parsed by gherkin-ast-parser
      Then the ParsedFeatureFile contains rules array
      And each rule has name, description, tags, scenarios, line

    @acceptance-criteria
    Scenario: Rules pass through scanner
      Given a parsed feature file with rules
      When processed by gherkin-scanner
      Then the ScannedGherkinFile includes rules
      And scenarios inside rules are also in flat scenarios array

    @acceptance-criteria
    Scenario: Rules are mapped to ExtractedPattern
      Given a scanned feature file with rules
      When processed by gherkin-extractor
      Then the ExtractedPattern contains rules field
      And each rule has name, description, scenarioCount, scenarioNames

  Rule: Generators can render rules as business documentation

    **Invariant:** Rules must render as human-readable Business Rules sections, not as raw Given/When/Then syntax.
    **Rationale:** Business stakeholders cannot interpret Gherkin step definitions; without rendering transformation, feature files remain developer-only artifacts.

    Business stakeholders see rule names and descriptions as "Business Rules"
    sections, not Given/When/Then syntax. This enables human-readable PRDs
    from the same files used for test execution.

    @acceptance-criteria
    Scenario: PRD generator renders Business Rules section
      Given an ExtractedPattern with rules
      When rendered by prd-features section
      Then output contains "Business Rules" heading
      And each rule name appears as bold text
      And rule descriptions appear as paragraphs
      And verification scenarios are listed

  Rule: Custom content blocks render in acceptance criteria

    **Invariant:** DataTables and DocStrings attached to steps must appear in generated documentation as Markdown tables and fenced code blocks respectively.
    **Rationale:** Without rendering custom content blocks, acceptance criteria lose the structured data and code examples that make them self-contained and verifiable.

    DataTables and DocStrings in steps should appear in generated documentation,
    providing structured data and code examples alongside step descriptions.

    @acceptance-criteria
    Scenario: DataTables render as Markdown tables
      Given a scenario step with DataTable
      When rendered in acceptance criteria
      Then output contains Markdown table with headers and rows

    @acceptance-criteria
    Scenario: DocStrings render as code blocks
      Given a scenario step with DocString
      When rendered in acceptance criteria
      Then output contains fenced code block with content

  Rule: vitest-cucumber executes scenarios inside Rules

    **Invariant:** Scenarios nested inside Rule blocks must be executable by vitest-cucumber using the Rule() and RuleScenario() API.
    **Rationale:** If Rule-scoped scenarios cannot execute, adding Rule blocks to feature files would break the test suite, forcing a choice between documentation structure and test coverage.

    Test execution must work for scenarios inside Rule blocks.
    Use Rule() function with RuleScenario() instead of Scenario().

    @acceptance-criteria
    Scenario: Rule scenarios execute with vitest-cucumber
      Given a feature file with scenarios inside Rule blocks
      When step definitions use Rule() and RuleScenario() syntax
      Then all scenarios execute and pass
