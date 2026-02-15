@libar-docs
@libar-docs-pattern:DescriptionQualityFoundation
@libar-docs-status:completed
@libar-docs-product-area:Generation
@behavior @description-quality
Feature: Description Quality Foundation
  Enhanced documentation generation with human-readable names,
  behavior file verification, and numbered acceptance criteria for PRD quality.

  **Problem:**
  - CamelCase pattern names (e.g., "RemainingWorkEnhancement") are hard to read
  - File extensions like ".md" incorrectly trigger sentence-ending detection
  - Business value tags with hyphens display as "enable-rich-prd" instead of readable text
  - No way to verify behavior file traceability during extraction
  - PRD acceptance criteria lack visual structure and numbering

  **Solution:**
  - Transform CamelCase to title case ("Remaining Work Enhancement")
  - Skip file extension patterns when detecting sentence boundaries
  - Convert hyphenated business values to readable phrases
  - Verify behavior file existence during pattern extraction
  - Number acceptance criteria and bold Given/When/Then keywords in PRD output

  Rule: Behavior files are verified during pattern extraction

    **Invariant:** Every timeline pattern must report whether its corresponding behavior file exists.
    **Verified by:** Behavior file existence verified during extraction, Missing behavior file sets verification to false, Explicit behavior file tag skips verification, Behavior file inferred from timeline naming convention

    @acceptance-criteria
    Scenario: Behavior file existence verified during extraction
      Given a timeline feature "phase-37-remaining-work.feature"
      And behavior file "tests/features/behavior/remaining-work.feature" exists
      When extracting patterns from the timeline file
      Then the pattern has behaviorFile "tests/features/behavior/remaining-work.feature"
      And behaviorFileVerified is true

    @acceptance-criteria
    Scenario: Missing behavior file sets verification to false
      Given a timeline feature "phase-99-nonexistent-feature.feature"
      And no behavior file exists at "tests/features/behavior/nonexistent-feature.feature"
      When extracting patterns from the timeline file
      Then behaviorFileVerified is false

    @acceptance-criteria
    Scenario: Explicit behavior file tag skips verification
      Given a timeline feature with explicit behavior file tag
      When extracting patterns from the timeline file
      Then behaviorFileVerified is undefined
      And the explicit behavior file path is used

    @acceptance-criteria
    Scenario: Behavior file inferred from timeline naming convention
      Given a timeline feature at "tests/features/timeline/phase-37-remaining-work.feature"
      When inferring the behavior file path
      Then the inferred path is "tests/features/behavior/remaining-work.feature"

  Rule: Traceability coverage reports verified and unverified behavior files

    **Invariant:** Coverage reports must distinguish between patterns with verified behavior files and those without.
    **Verified by:** Traceability shows covered phases with verified behavior files

    @acceptance-criteria
    Scenario: Traceability shows covered phases with verified behavior files
      Given patterns with the following behavior files:
        | Phase | Name              | BehaviorFile                           | Verified |
        | 37    | Remaining Work    | tests/features/behavior/remaining-work.feature | true     |
        | 34    | Changelog Gen     | tests/features/behavior/changelog.feature      | true     |
        | 99    | No Behavior File  |                                        |          |
      When generating traceability report
      Then the coverage statistics show 2 covered phases
      And the covered table includes "Remaining Work" and "Changelog Gen"
      And the gaps section includes "No Behavior File"

  Rule: Pattern names are transformed to human-readable display names

    **Invariant:** Display names must convert CamelCase to title case, handle consecutive capitals, and respect explicit title overrides.
    **Verified by:** CamelCase pattern names transformed to title case, PascalCase with consecutive caps handled correctly, Falls back to name when no patternName, Explicit title tag overrides CamelCase transformation

    @acceptance-criteria
    Scenario: CamelCase pattern names transformed to title case
      Given a pattern with patternName "RemainingWorkEnhancement"
      When getting the display name
      Then the display name is "Remaining Work Enhancement"

    @acceptance-criteria
    Scenario: PascalCase with consecutive caps handled correctly
      Given a pattern with patternName "HTTPClientFactory"
      When getting the display name
      Then the display name is "HTTP Client Factory"

    @acceptance-criteria
    Scenario: Falls back to name when no patternName
      Given a pattern without patternName but with name "simple-feature"
      When getting the display name
      Then the display name is "simple-feature" unchanged

    @acceptance-criteria
    Scenario: Explicit title tag overrides CamelCase transformation
      Given a pattern with title "OAuth 2.0 Integration"
      And patternName "OAuth2Integration"
      When getting the display name
      Then the result is "OAuth 2.0 Integration"

  Rule: PRD acceptance criteria are formatted with numbering and bold keywords

    **Invariant:** PRD output must number acceptance criteria and bold Given/When/Then keywords when steps are enabled.
    **Verified by:** PRD shows numbered acceptance criteria with bold keywords, PRD respects includeScenarioSteps flag, PRD shows full Feature description without truncation

    @acceptance-criteria
    Scenario: PRD shows numbered acceptance criteria with bold keywords
      Given a pattern with acceptance criteria scenarios:
        | Scenario Name                      |
        | Pattern names display correctly    |
        | Behavior file verified at extract  |
      And scenarios have Given/When/Then steps
      When generating PRD with includeScenarioSteps enabled
      Then scenarios are numbered starting from 1
      And steps have bold keywords (Given, When, Then)

    @acceptance-criteria
    Scenario: PRD respects includeScenarioSteps flag
      Given a pattern with acceptance criteria scenarios
      When generating PRD with includeScenarioSteps disabled
      Then scenario names are shown
      But Given/When/Then steps are NOT rendered

    @acceptance-criteria
    Scenario: PRD shows full Feature description without truncation
      Given a pattern with a 600-character Feature description
      When generating PRODUCT-REQUIREMENTS.md
      Then the full description renders without truncation

  Rule: Business values are formatted for human readability

    **Invariant:** Hyphenated business value tags must be converted to space-separated readable text in all output contexts.
    **Verified by:** Hyphenated business value converted to spaces, Business value displayed in Next Actionable table, File extensions not treated as sentence endings

    @acceptance-criteria
    Scenario: Hyphenated business value converted to spaces
      Given a pattern with businessValue "enable-rich-prd-documentation"
      When formatting the business value
      Then the result is "enable rich prd documentation"

    @acceptance-criteria
    Scenario: Business value displayed in Next Actionable table
      Given roadmap patterns with business values:
        | Phase | Name                | BusinessValue                           | Dependencies |
        | 3     | Watch Mode          | Eliminate-manual-regeneration           |              |
        | 10    | Full Cycle Demo     | Documented-full-cycle-enables-adoption  |              |
      When generating REMAINING-WORK.md
      Then the Next Actionable table includes a Business Value column
      And the Business Value column shows expected values:
        | value |
        | Eliminate manual regeneration |
        | Documented full cycle enables adoption |

    @acceptance-criteria
    Scenario: File extensions not treated as sentence endings
      Given a description "Enhance REMAINING-WORK.md generation for better planning."
      When extracting the first sentence
      Then the result is "Enhance REMAINING-WORK.md generation for better planning."
