@libar-docs
@libar-docs-pattern:PatternTagExtraction
@libar-docs-status:completed
@libar-docs-product-area:Annotation
@behavior @scanner @pattern-tags
Feature: Pattern Tag Extraction from Gherkin Feature Tags
  The extractPatternTags function parses Gherkin feature tags
  into structured metadata objects for pattern processing.

  **Problem:**
  - Gherkin tags are flat strings needing semantic interpretation
  - Multiple tag formats exist: @tag:value, @libar-process-tag:value
  - Dependencies and enables can have comma-separated values
  - Category tags have no colon and must be distinguished from other tags

  **Solution:**
  - extractPatternTags parses tag strings into structured metadata
  - Normalizes both @tag:value and @libar-process-tag:value formats
  - Splits comma-separated values for dependencies and enables
  - Filters non-category tags (acceptance-criteria, happy-path, etc.)

  Background: Pattern tag extraction context
    Given a pattern tag extraction context

  # ==========================================================================
  # Single Tag Extraction
  # ==========================================================================

  @happy-path @single-tag
  Scenario: Extract pattern name tag
    Given feature tags containing "pattern:MyPattern"
    When extracting pattern tags
    Then the metadata pattern should be "MyPattern"

  @happy-path @single-tag
  Scenario: Extract phase number tag
    Given feature tags containing "phase:15"
    When extracting pattern tags
    Then the metadata phase should be 15

  @happy-path @single-tag
  Scenario: Extract status roadmap tag
    Given feature tags containing "status:roadmap"
    When extracting pattern tags
    Then the metadata status should be "roadmap"

  @happy-path @single-tag
  Scenario: Extract status deferred tag
    Given feature tags containing "status:deferred"
    When extracting pattern tags
    Then the metadata status should be "deferred"

  @happy-path @single-tag
  Scenario: Extract status completed tag
    Given feature tags containing "status:completed"
    When extracting pattern tags
    Then the metadata status should be "completed"

  @happy-path @single-tag
  Scenario: Extract status active tag
    Given feature tags containing "status:active"
    When extracting pattern tags
    Then the metadata status should be "active"

  @happy-path @brief
  Scenario: Extract brief path tag
    Given feature tags containing "brief:docs/pattern-briefs/01-my-pattern.md"
    When extracting pattern tags
    Then the metadata brief should be "docs/pattern-briefs/01-my-pattern.md"

  # ==========================================================================
  # Array Value Extraction (Dependencies/Enables)
  # ==========================================================================

  @happy-path @dependencies
  Scenario: Extract single dependency
    Given feature tags containing "depends-on:Pattern1"
    When extracting pattern tags
    Then the metadata dependsOn should contain "Pattern1"

  @happy-path @dependencies @comma-separated
  Scenario: Extract comma-separated dependencies
    Given feature tags containing "depends-on:Pattern1" and "depends-on:Pattern2,Pattern3"
    When extracting pattern tags
    Then the metadata dependsOn should contain "Pattern1"
    And the metadata dependsOn should contain "Pattern2"
    And the metadata dependsOn should contain "Pattern3"

  @happy-path @enables
  Scenario: Extract comma-separated enables
    Given feature tags containing "enables:Pattern1,Pattern2"
    When extracting pattern tags
    Then the metadata enables should contain "Pattern1"
    And the metadata enables should contain "Pattern2"

  # ==========================================================================
  # Category Tag Extraction
  # ==========================================================================

  @happy-path @categories
  Scenario: Extract category tags (no colon)
    Given feature tags "ddd", "core", "event-sourcing", and "acceptance-criteria"
    When extracting pattern tags
    Then the metadata categories should contain "ddd"
    And the metadata core flag should be true
    And the metadata categories should contain "event-sourcing"
    And the metadata categories should not contain "acceptance-criteria"

  @edge-case @categories
  Scenario: libar-docs opt-in marker is NOT a category
    Given feature tags "libar-docs", "ddd", and "core"
    When extracting pattern tags
    Then the metadata categories should contain "ddd"
    And the metadata core flag should be true
    And the metadata categories should not contain "libar-docs"

  # ==========================================================================
  # Complex Tag Extraction
  # ==========================================================================

  @happy-path @complex
  Scenario: Extract all metadata from complex tag list
    Given a complex tag list with pattern, phase, status, dependencies, enables, brief, and categories
    When extracting pattern tags
    Then the metadata should have pattern equal to "DCB"
    And the metadata should have phase equal to 16
    And the metadata should have status equal to "roadmap"
    And the metadata dependsOn should contain "DeciderTypes"
    And the metadata enables should contain "Reservations"
    And the metadata enables should contain "MultiEntityOps"
    And the metadata should have brief equal to "pattern-briefs/03-dcb.md"
    And the metadata categories should contain "ddd"
    And the metadata core flag should be true

  # ==========================================================================
  # Edge Cases
  # ==========================================================================

  @edge-case @empty
  Scenario: Empty tag list returns empty metadata
    Given an empty tag list
    When extracting pattern tags
    Then the metadata should be empty

  @edge-case @invalid-phase
  Scenario: Invalid phase number is ignored
    Given feature tags containing "phase:invalid"
    When extracting pattern tags
    Then the metadata should not have phase

  # ==========================================================================
  # Convention Tag Extraction
  # ==========================================================================

  @happy-path @convention
  Scenario: Extract single convention tag
    Given feature tags containing "convention:testing-policy"
    When extracting pattern tags
    Then the metadata convention should contain "testing-policy"

  @happy-path @convention @comma-separated
  Scenario: Extract CSV convention tags
    Given feature tags containing "convention:fsm-rules,testing-policy"
    When extracting pattern tags
    Then the metadata convention should contain "fsm-rules"
    And the metadata convention should contain "testing-policy"

  @edge-case @convention
  Scenario: Convention tag trims whitespace in CSV values
    Given feature tags containing "convention:fsm-rules, testing-policy , cli-patterns"
    When extracting pattern tags
    Then the metadata convention should contain "fsm-rules"
    And the metadata convention should contain "testing-policy"
    And the metadata convention should contain "cli-patterns"

  # ==========================================================================
  # Registry-Driven Extraction (Data-Driven Gherkin Tag Extraction)
  # ==========================================================================

  @happy-path @registry-driven
  Scenario: Registry-driven enum tag without prior if/else branch
    Given feature tags containing "adr-theme:persistence"
    When extracting pattern tags
    Then the metadata adrTheme should be "persistence"

  @happy-path @registry-driven
  Scenario: Registry-driven enum rejects invalid value
    Given feature tags containing "adr-theme:invalid-theme"
    When extracting pattern tags
    Then the metadata should not have adrTheme

  @happy-path @registry-driven
  Scenario: Registry-driven CSV tag accumulates values
    Given feature tags containing "include:pipeline-overview,codec-transformation"
    When extracting pattern tags
    Then the metadata include should contain "pipeline-overview"
    And the metadata include should contain "codec-transformation"

  @happy-path @registry-driven
  Scenario: Transform applies hyphen-to-space on business value
    Given feature tags containing "business-value:eliminates-manual-docs"
    When extracting pattern tags
    Then the metadata businessValue should be "eliminates manual docs"

  @happy-path @registry-driven
  Scenario: Transform applies ADR number padding
    Given feature tags containing "adr:5"
    When extracting pattern tags
    Then the metadata adr should be "005"

  @happy-path @registry-driven
  Scenario: Transform strips quotes from title tag
    Given feature tags containing "title:'Process Guard Linter'"
    When extracting pattern tags
    Then the metadata title should be "Process Guard Linter"

  @happy-path @registry-driven
  Scenario: Repeatable value tag accumulates multiple occurrences
    Given feature tags containing "discovered-gap:missing-tests" and "discovered-gap:no-validation"
    When extracting pattern tags
    Then the metadata discoveredGaps should contain "missing tests"
    And the metadata discoveredGaps should contain "no validation"

  @edge-case @registry-driven
  Scenario: CSV with values constraint rejects invalid values
    Given feature tags containing "convention:testing-policy,nonexistent-value,fsm-rules"
    When extracting pattern tags
    Then the metadata convention should contain "testing-policy"
    And the metadata convention should contain "fsm-rules"
    And the metadata convention should not contain "nonexistent-value"
