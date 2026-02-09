@behavior @pr-changes
Feature: PR Changes Generation
  The delivery process generates PR-CHANGES.md from active or completed phases,
  formatted for PR descriptions, code reviews, and release notes.

  **Problem:**
  - PR descriptions are manually written, often incomplete or inconsistent
  - Reviewers lack structured view of what changed and why
  - Deliverable completion status scattered across feature files
  - Dependency relationships between phases hidden from reviewers

  **Solution:**
  - Auto-generate PR-CHANGES.md with summary statistics and phase-grouped changes
  - Include both active and completed phases (roadmap phases excluded)
  - Filter by release version (releaseFilter) to show matching deliverables
  - Surface deliverables inline with each pattern
  - Include review checklist with standard code quality items
  - Include dependency section showing what patterns enable or require

  # ==========================================================================
  # Release Version Filtering
  # ==========================================================================

  @happy-path @release-filter
  Scenario: Filter phases by specific release version
    Given completed phases tagged with different releases:
      | Phase | Name             | Workflow       | Release |
      | 23    | Critical Fixes   | implementation | v0.2.0  |
      | 24    | Error Handling   | refactoring    | v0.2.0  |
      | 10    | Foundation       | implementation | v0.1.0  |
      | 11    | Core Types       | implementation | v0.1.0  |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "Critical Fixes"
    And the output should contain "Error Handling"
    And the output should not contain "Foundation"
    And the output should not contain "Core Types"

  @happy-path @unreleased-only
  Scenario: Show all active and completed phases when no releaseFilter
    Given completed phases with mixed release status:
      | Phase | Name             | Workflow       | Release |
      | 33    | Session Handoffs | documentation  |         |
      | 34    | Changelog Gen    | implementation |         |
      | 10    | Foundation       | implementation | v0.1.0  |
    When generating PR changes without releaseFilter
    Then the output should contain "Session Handoffs"
    And the output should contain "Changelog Gen"
    And the output should contain "Foundation"

  @happy-path @active-phase
  Scenario: Active phases with matching deliverables are included
    Given phases with different statuses and deliverables:
      | Phase | Name              | Status    | Workflow       | Release |
      | 43    | Documentation     | active    | implementation | v0.3.0  |
      | 42    | Previous Work     | completed | implementation | v0.2.0  |
      | 44    | Future Work       | roadmap   | implementation | v0.4.0  |
    When generating PR changes with releaseFilter "v0.3.0"
    Then the output should contain "Documentation"
    And the output should not contain "Previous Work"
    And the output should not contain "Future Work"

  @happy-path @roadmap-excluded
  Scenario: Roadmap phases are excluded even with matching deliverables
    Given phases with different statuses and deliverables:
      | Phase | Name              | Status    | Workflow       | Release |
      | 50    | Planned Feature   | roadmap   | implementation | v1.0.0  |
      | 51    | Active Feature    | active    | implementation | v1.0.0  |
    When generating PR changes with releaseFilter "v1.0.0"
    Then the output should contain "Active Feature"
    And the output should not contain "Planned Feature"

  # ==========================================================================
  # Phase Grouping (Actual Codec Behavior)
  # ==========================================================================

  @happy-path @phase-grouping
  Scenario: Patterns grouped by phase number
    Given completed phases with different workflows:
      | Phase | Name             | Workflow            | Release |
      | 1     | New Feature      | implementation      | v1.0.0  |
      | 2     | Code Cleanup     | refactoring         | v1.0.0  |
      | 3     | Bug Fix          | quality-improvement | v1.0.0  |
      | 4     | Docs Update      | documentation       | v1.0.0  |
    When generating PR changes with releaseFilter "v1.0.0"
    Then the output should contain "## Changes by Phase"
    And the output should contain "### Phase 1"
    And the output should contain "### Phase 2"
    And the output should contain "### Phase 3"
    And the output should contain "### Phase 4"

  # ==========================================================================
  # Summary Statistics
  # ==========================================================================

  @happy-path @summary
  Scenario: Summary shows pattern counts in table format
    Given completed phases with deliverables:
      | Phase | Name           | Workflow       | Release | Deliverables |
      | 23    | Critical Fixes | implementation | v0.2.0  | 5            |
      | 24    | Error Handling | refactoring    | v0.2.0  | 3            |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Summary"
    And the output should contain "Patterns in PR"
    And the output should contain "Completed"

  @happy-path @summary-release-tag
  Scenario: Summary shows release tag when filtering
    Given completed phases with deliverables:
      | Phase | Name           | Workflow       | Release | Deliverables |
      | 23    | Critical Fixes | implementation | v0.2.0  | 2            |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Summary"
    And the output should contain "Release Tag"
    And the output should contain "v0.2.0"

  # ==========================================================================
  # Deliverables Display
  # ==========================================================================

  @happy-path @deliverables
  Scenario: Deliverables shown inline with patterns
    Given completed phase 23 with deliverables:
      | Name                   | Status   | Tests | Location              |
      | Fix parseArgs bug      | complete | 1     | src/cli/generate.ts   |
      | Add --version flag     | complete | 1     | src/cli/*.ts          |
      | Update README language | complete | 0     | README.md             |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "Deliverables:"
    And the output should contain "Fix parseArgs bug"
    And the output should contain "Add --version flag"
    And the output should contain "Update README language"

  @happy-path @deliverables-release-tag
  Scenario: Deliverables show release tags
    Given completed phase 23 with deliverables:
      | Name          | Status      | Tests | Location    |
      | Completed One | complete    | 1     | src/one.ts  |
      | Completed Two | complete    | 1     | src/two.ts  |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "(v0.2.0)"

  # ==========================================================================
  # Review Checklist
  # ==========================================================================

  @happy-path @review-checklist
  Scenario: Review checklist includes standard code quality items
    Given completed phase 23 with deliverables:
      | Name           | Status   | Tests | Location    |
      | Main Feature   | complete | 1     | src/main.ts |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Review Checklist"
    And the output should contain "- [ ] Code follows project conventions"
    And the output should contain "- [ ] Tests added/updated for changes"
    And the output should contain "- [ ] Documentation updated if needed"

  @happy-path @review-checklist-completed
  Scenario: Review checklist includes completed pattern verification
    Given completed phase 23 with deliverables:
      | Name           | Status   | Tests | Location    |
      | Main Feature   | complete | 1     | src/main.ts |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Review Checklist"
    And the output should contain "- [ ] Completed patterns verified working"

  # ==========================================================================
  # Dependencies Section
  # ==========================================================================

  @happy-path @enables
  Scenario: Dependencies shows what patterns enable
    Given completed phases with dependency relationships:
      | Phase | Name           | Workflow       | Release | Enables            |
      | 25    | Zod Migration  | refactoring    | v0.2.0  | CatalogueSchemas   |
      | 40    | Quality Fix    | implementation | v0.2.0  | MermaidExpansion   |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Dependencies"
    And the output should contain "### Enables"
    And the output should contain "CatalogueSchemas"
    And the output should contain "MermaidExpansion"

  @happy-path @depends-on
  Scenario: Dependencies shows what patterns depend on
    Given completed phases where all dependencies are met:
      | Phase | Name           | Workflow       | Release | DependsOn          |
      | 25    | Zod Migration  | refactoring    | v0.2.0  | Error Handling     |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Dependencies"
    And the output should contain "### Depends On"
    And the output should contain "Error Handling"

  # ==========================================================================
  # Business Value
  # ==========================================================================

  @happy-path @business-value
  Scenario: Pattern metadata includes business value when enabled
    Given a completed phase with business value:
      | Phase | Name           | Workflow       | Release | BusinessValue                    |
      | 34    | Changelog Gen  | implementation | v0.2.0  | Automated release notes from specs |
    When generating PR changes with releaseFilter "v0.2.0" and includeBusinessValue enabled
    Then the output should contain "Changelog Gen"
    And the output should contain "Business Value"
    And the output should contain "Automated release notes"

  @config @no-business-value
  Scenario: Business value can be excluded
    Given a completed phase with business value:
      | Phase | Name           | Workflow       | Release | BusinessValue                    |
      | 34    | Changelog Gen  | implementation | v0.2.0  | Automated release notes from specs |
    When generating PR changes with includeBusinessValue disabled
    Then the output should not contain "Business Value"

  # ==========================================================================
  # Sorting Options
  # ==========================================================================

  @config @sort-by-phase
  Scenario: Phases sorted by phase number
    Given completed phases in random order:
      | Phase | Name      | Workflow       | Release |
      | 40    | Phase 40  | implementation | v0.2.0  |
      | 23    | Phase 23  | implementation | v0.2.0  |
      | 31    | Phase 31  | implementation | v0.2.0  |
    When generating PR changes with sortBy "phase"
    Then Phase 23 should appear before Phase 31 in the output
    And Phase 31 should appear before Phase 40 in the output

  @config @sort-by-priority
  Scenario: Phases sorted by priority
    Given completed phases with different priorities:
      | Phase | Name          | Workflow       | Release | Priority |
      | 1     | Low Priority  | implementation | v0.2.0  | low      |
      | 2     | High Priority | implementation | v0.2.0  | high     |
      | 3     | Critical      | implementation | v0.2.0  | critical |
    When generating PR changes with sortBy "priority"
    Then "High Priority" should appear before "Low Priority" in the output

  # ==========================================================================
  # Edge Cases
  # ==========================================================================

  @edge-case @no-phases
  Scenario: No matching phases produces no changes message
    Given no completed phases for release "v0.2.0"
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "No patterns found"

  @edge-case @no-deliverables
  Scenario: Patterns without deliverables still display
    Given completed phases without deliverables:
      | Phase | Name           | Workflow       | Release |
      | 23    | Critical Fixes | implementation | v0.2.0  |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "Critical Fixes"
    And the output should not contain "Deliverables:"

  @edge-case @typescript-patterns
  Scenario: Patterns without phase show in phase 0 group
    Given patterns from different sources:
      | Name               | Phase | Status    | Release |
      | Gherkin Phase 23   | 23    | completed | v0.2.0  |
      | TypeScript Pattern |       | completed | v0.2.0  |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "Gherkin Phase 23"
    And the output should contain "TypeScript Pattern"
    And the output should contain "### Phase 0"

  # ==========================================================================
  # Deliverable-Level Filtering (Phase 42)
  # ==========================================================================

  @happy-path @mixed-release @deliverable-level
  Scenario: Mixed releases within single phase shows only matching deliverables
    Given a phase with mixed-release deliverables:
      | Phase | Name     | Deliverable | Status   | Tests | Location   | Release |
      | 42    | Mixed PR | Feature A   | complete | 1     | src/a.ts   | v0.1.0  |
      | 42    | Mixed PR | Feature B   | complete | 1     | src/b.ts   | v0.2.0  |
      | 42    | Mixed PR | Feature C   | complete | 1     | src/c.ts   | v0.2.0  |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "Feature B"
    And the output should contain "Feature C"
    And the output should not contain "Feature A"
