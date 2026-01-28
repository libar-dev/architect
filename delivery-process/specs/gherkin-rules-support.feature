@libar-docs
@libar-docs-pattern:GherkinRulesSupport
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-libar-docs-opt-in-marker
@libar-docs-phase:100
@libar-docs-release:v1.0.0
@libar-docs-effort:4h
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:enable-human-readable-documentation-from-feature-files
@libar-docs-priority:high
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
      | GherkinRuleSchema | Complete | No | validation-schemas/feature.ts |
      | Rule parsing in AST parser | Complete | No | scanner/gherkin-ast-parser.ts |
      | Rules passthrough in scanner | Complete | No | scanner/gherkin-scanner.ts |
      | Rules field in ExtractedPattern | Complete | No | validation-schemas/extracted-pattern.ts |
      | Rules mapping in extractor | Complete | No | extractor/gherkin-extractor.ts |
      | Business Rules rendering | Complete | No | generators/sections/prd-features.ts |
      | DataTable rendering in acceptance criteria | Complete | No | generators/sections/prd-features.ts |
      | DocString rendering in acceptance criteria | Complete | No | generators/sections/prd-features.ts |

  Rule: Rules flow through the entire pipeline without data loss

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

    Test execution must work for scenarios inside Rule blocks.
    Use Rule() function with RuleScenario() instead of Scenario().

    @acceptance-criteria
    Scenario: Rule scenarios execute with vitest-cucumber
      Given a feature file with scenarios inside Rule blocks
      When step definitions use Rule() and RuleScenario() syntax
      Then all scenarios execute and pass
