@behavior @pr-changes
Feature: PR Changes Generation
  The delivery process generates PR-CHANGES.md from active or completed phases,
  formatted for PR descriptions, code reviews, and release notes.

  **Problem:**
  - PR descriptions are manually written, often incomplete or inconsistent
  - Reviewers lack structured view of what changed and why
  - Deliverable completion status scattered across feature files
  - Acceptance criteria not surfaced as review checklists
  - Dependency relationships between phases hidden from reviewers

  **Solution:**
  - Auto-generate PR-CHANGES.md with summary statistics and categorized changes
  - Include both active and completed phases (roadmap phases excluded)
  - Filter by release version (releaseFilter) or show unreleased phases only
  - Surface deliverables table with completion percentage and locations
  - Convert @acceptance-criteria scenarios into review checklist items
  - Include dependency section showing what this PR enables and requires

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
  Scenario: Show only unreleased phases when no releaseFilter
    Given completed phases with mixed release status:
      | Phase | Name             | Workflow       | Release |
      | 33    | Session Handoffs | documentation  |         |
      | 34    | Changelog Gen    | implementation |         |
      | 10    | Foundation       | implementation | v0.1.0  |
    When generating PR changes without releaseFilter
    Then the output should contain "Session Handoffs"
    And the output should contain "Changelog Gen"
    And the output should not contain "Foundation"

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
  # Category Mapping
  # ==========================================================================

  @happy-path @category-mapping
  Scenario: Workflow type maps to changelog categories
    Given completed phases with different workflows:
      | Phase | Name             | Workflow            | Release |
      | 1     | New Feature      | implementation      | v1.0.0  |
      | 2     | Code Cleanup     | refactoring         | v1.0.0  |
      | 3     | Bug Fix          | quality-improvement | v1.0.0  |
      | 4     | Docs Update      | documentation       | v1.0.0  |
    When generating PR changes with releaseFilter "v1.0.0"
    Then "New Feature" should appear under "### Added"
    And "Code Cleanup" should appear under "### Changed"
    And "Bug Fix" should appear under "### Fixed"
    And "Docs Update" should appear under "### Changed"

  # ==========================================================================
  # Summary Statistics
  # ==========================================================================

  @happy-path @summary
  Scenario: Summary shows phase and deliverable counts
    Given completed phases with deliverables:
      | Phase | Name           | Workflow       | Release | Deliverables |
      | 23    | Critical Fixes | implementation | v0.2.0  | 5            |
      | 24    | Error Handling | refactoring    | v0.2.0  | 3            |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Summary"
    And the output should contain "2 phases"
    And the output should contain "8 deliverables"

  @happy-path @summary-categories
  Scenario: Summary counts phases by category
    Given completed phases with different workflows:
      | Phase | Name         | Workflow            | Release |
      | 1     | Feature A    | implementation      | v1.0.0  |
      | 2     | Feature B    | implementation      | v1.0.0  |
      | 3     | Refactor     | refactoring         | v1.0.0  |
      | 4     | Bug Fix      | quality-improvement | v1.0.0  |
    When generating PR changes with releaseFilter "v1.0.0"
    Then the output should contain "2 new features (Added)"
    And the output should contain "1 enhancements (Changed)"
    And the output should contain "1 bug fixes (Fixed)"

  # ==========================================================================
  # Deliverables Table
  # ==========================================================================

  @happy-path @deliverables
  Scenario: Deliverables table shows phase and status
    Given completed phase 23 with deliverables:
      | Name                   | Status   | Tests | Location              |
      | Fix parseArgs bug      | Done     | 1     | src/cli/generate.ts   |
      | Add --version flag     | Done     | 1     | src/cli/*.ts          |
      | Update README language | Complete | 0     | README.md             |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Deliverables"
    And the output should contain "Fix parseArgs bug"
    And the output should contain "Add --version flag"
    And the deliverables table should show 3 items

  @happy-path @deliverables-stats
  Scenario: Deliverables section shows completion percentage
    Given completed phase 23 with deliverables:
      | Name          | Status      | Tests | Location    |
      | Completed One | Complete    | 1     | src/one.ts  |
      | Completed Two | Done        | 1     | src/two.ts  |
      | Pending One   | In Progress | 0     | src/pend.ts |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "2/3 complete"
    And the output should contain "67%"

  # ==========================================================================
  # Review Checklist
  # ==========================================================================

  @happy-path @review-checklist
  Scenario: Review checklist from acceptance criteria
    Given completed phase 23 with acceptance scenarios:
      | Scenario                           | Steps                                                    |
      | CLI handles invalid args gracefully | Given CLI, When invalid args, Then error without trace  |
      | Version flag works                 | Given CLI, When --version, Then shows package version    |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Review Checklist"
    And the output should contain "- [ ] CLI handles invalid args gracefully"
    And the output should contain "- [ ] Version flag works"

  # ==========================================================================
  # Dependencies Section
  # ==========================================================================

  @happy-path @enables
  Scenario: Dependencies shows what this PR enables
    Given completed phases with dependency relationships:
      | Phase | Name           | Workflow       | Release | Enables            |
      | 25    | Zod Migration  | refactoring    | v0.2.0  | CatalogueSchemas   |
      | 40    | Quality Fix    | quality-improvement | v0.2.0  | MermaidExpansion   |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Dependencies"
    And the output should contain "### This PR Enables"
    And the output should contain "CatalogueSchemas"
    And the output should contain "MermaidExpansion"

  @happy-path @all-deps-satisfied
  Scenario: Dependencies shows satisfaction status
    Given completed phases where all dependencies are met:
      | Phase | Name           | Workflow       | Release | DependsOn          |
      | 25    | Zod Migration  | refactoring    | v0.2.0  | Error Handling     |
    And a completed phase "Error Handling" exists
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "All dependencies satisfied"

  # ==========================================================================
  # Business Value
  # ==========================================================================

  @happy-path @business-value
  Scenario: What Changed includes business value
    Given a completed phase with business value:
      | Phase | Name           | Workflow       | Release | BusinessValue                    |
      | 34    | Changelog Gen  | implementation | v0.2.0  | Automated release notes from specs |
    When generating PR changes with releaseFilter "v0.2.0" and includeBusinessValue enabled
    Then the output should contain "### Added"
    And the output should contain "Changelog Gen"
    And the output should contain "Business Value:"
    And the output should contain "Automated release notes"

  @config @no-business-value
  Scenario: Business value can be excluded
    Given a completed phase with business value:
      | Phase | Name           | Workflow       | Release | BusinessValue                    |
      | 34    | Changelog Gen  | implementation | v0.2.0  | Automated release notes from specs |
    When generating PR changes with includeBusinessValue disabled
    Then the output should not contain "Business Value:"

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
    Then "Critical" should appear before "High Priority" in the output
    And "High Priority" should appear before "Low Priority" in the output

  # ==========================================================================
  # Edge Cases
  # ==========================================================================

  @edge-case @no-phases
  Scenario: No matching phases produces empty message
    Given no completed phases for release v0.2.0
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "## Summary"
    And the output should contain "No changes found for release v0.2.0"

  @edge-case @no-deliverables
  Scenario: No deliverables shows appropriate message
    Given completed phases without deliverables and no release:
      | Phase | Name           | Workflow       |
      | 23    | Critical Fixes | implementation |
    When generating PR changes without releaseFilter
    Then the output should contain "No deliverables found unreleased"

  @edge-case @no-acceptance-criteria
  Scenario: No acceptance criteria shows appropriate message
    Given completed phases without acceptance scenarios:
      | Phase | Name           | Workflow       | Release |
      | 23    | Critical Fixes | implementation | v0.2.0  |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "No @acceptance-criteria scenarios defined"

  @edge-case @typescript-patterns-excluded
  Scenario: TypeScript patterns without phase numbers excluded
    Given patterns from different sources:
      | Name               | Phase | Status    | Release |
      | Gherkin Phase 23   | 23    | completed | v0.2.0  |
      | TypeScript Pattern |       | completed |         |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "Gherkin Phase 23"
    And the output should not contain "TypeScript Pattern"

  # ==========================================================================
  # Deliverable-Level Filtering (Phase 42)
  # ==========================================================================

  @happy-path @mixed-release @deliverable-level
  Scenario: Mixed releases within single phase shows only matching deliverables
    Given a phase with mixed-release deliverables:
      | Phase | Name     | Deliverable | Status | Tests | Location   | Release |
      | 42    | Mixed PR | Feature A   | Done   | 1     | src/a.ts   | v0.1.0  |
      | 42    | Mixed PR | Feature B   | Done   | 1     | src/b.ts   | v0.2.0  |
      | 42    | Mixed PR | Feature C   | Done   | 1     | src/c.ts   | v0.2.0  |
    When generating PR changes with releaseFilter "v0.2.0"
    Then the output should contain "2 deliverables"
    And the output should contain "Feature B"
    And the output should contain "Feature C"
    And the output should not contain "Feature A"
