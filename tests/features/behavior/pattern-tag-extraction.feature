@architect
@architect-pattern:PatternTagExtraction
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Annotation
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

  Rule: Single value tags produce scalar metadata fields

      **Invariant:** Each single-value tag (pattern, phase, status) maps to exactly one metadata field with the correct type.
      **Rationale:** Incorrect type coercion (e.g., phase as string instead of number) causes downstream pipeline failures in filtering and sorting.
      **Verified by:** Extract pattern name tag, Extract phase number tag, Extract status roadmap tag, Extract status deferred tag, Extract status completed tag, Extract status active tag

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


  Rule: Array value tags accumulate into list metadata fields

      **Invariant:** Tags for depends-on and enables split comma-separated values and accumulate across multiple tag occurrences.
      **Rationale:** Missing a dependency value silently breaks the dependency graph, causing incorrect build ordering and orphaned pattern references.
      **Verified by:** Extract single dependency, Extract comma-separated dependencies, Extract comma-separated enables

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

  Rule: Category tags are colon-free tags filtered against known non-categories

      **Invariant:** Tags without colons become categories, except known non-category tags (acceptance-criteria, happy-path) and the architect opt-in marker.
      **Rationale:** Including test-control tags (acceptance-criteria, happy-path) as categories pollutes the pattern taxonomy with non-semantic values.
      **Verified by:** Extract category tags (no colon), architect opt-in marker is NOT a category

    @happy-path @categories
    Scenario: Extract category tags (no colon)
      Given feature tags "ddd", "core", "event-sourcing", and "acceptance-criteria"
      When extracting pattern tags
      Then the metadata categories should contain "ddd"
      And the metadata categories should contain "core"
      And the metadata categories should contain "event-sourcing"
      And the metadata categories should not contain "acceptance-criteria"

    @edge-case @categories
    Scenario: architect opt-in marker is NOT a category
      Given feature tags "architect", "ddd", and "core"
      When extracting pattern tags
      Then the metadata categories should contain "ddd"
      And the metadata categories should contain "core"
      And the metadata categories should not contain "architect"

  Rule: Complex tag lists produce fully populated metadata

      **Invariant:** All tag types (scalar, array, category) are correctly extracted from a single mixed tag list.
      **Rationale:** Real feature files combine many tag types; extraction must handle all types simultaneously without interference between parsers.
      **Verified by:** Extract all metadata from complex tag list

    @happy-path @complex
    Scenario: Extract all metadata from complex tag list
      Given a complex tag list with pattern, phase, status, dependencies, enables, and categories
      When extracting pattern tags
      Then the metadata should have pattern equal to "DCB"
      And the metadata should have phase equal to 16
      And the metadata should have status equal to "roadmap"
      And the metadata dependsOn should contain "DeciderTypes"
      And the metadata enables should contain "Reservations"
      And the metadata enables should contain "MultiEntityOps"
      And the metadata categories should contain "ddd"
      And the metadata categories should contain "core"

  Rule: Edge cases produce safe defaults

      **Invariant:** Empty or invalid inputs produce empty metadata or omit invalid fields rather than throwing errors.
      **Rationale:** Throwing on malformed tags would abort extraction for the entire file, losing valid metadata from well-formed tags.
      **Verified by:** Empty tag list returns empty metadata, Invalid phase number is ignored

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

  Rule: Convention tags support CSV values with whitespace trimming

      **Invariant:** Convention tags split comma-separated values and trim whitespace from each value.
      **Rationale:** Untrimmed whitespace creates distinct values for the same convention, causing false negatives in convention-based filtering and validation.
      **Verified by:** Extract single convention tag, Extract CSV convention tags, Convention tag trims whitespace in CSV values

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

  Rule: Registry-driven extraction handles enums, transforms, and value constraints

      **Invariant:** Tags defined in the registry use data-driven extraction with enum validation, CSV accumulation, value transforms, and constraint checking.
      **Rationale:** Hard-coded if/else branches for each tag type cannot scale; registry-driven extraction ensures new tags are supported by configuration, not code changes.
      **Verified by:** Registry-driven enum tag without prior if/else branch, Registry-driven enum rejects invalid value, Registry-driven CSV tag accumulates values, Transform applies hyphen-to-space on business value, Transform applies ADR number padding, Transform strips quotes from title tag, Repeatable value tag accumulates multiple occurrences, CSV with values constraint rejects invalid values

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
