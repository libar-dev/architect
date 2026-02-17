@opportunity-8
@libar-docs
@capstone
@libar-docs-pattern:LivingRoadmapCLI
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:5d
@libar-docs-product-area:Process
@libar-docs-include:process-workflow
@libar-docs-depends-on:MvpWorkflowImplementation
@libar-docs-business-value:query-roadmap-with-natural-language
@libar-docs-priority:high
Feature: Living Roadmap CLI - Interactive Queries Over Reality

  **Problem:**
  Roadmap is a static document that requires regeneration.
  No interactive way to answer "what's next?" or "what's blocked?"
  Critical path analysis requires manual inspection.

  **Solution:**
  Add interactive CLI commands for roadmap queries:
  - `pnpm roadmap:next` - Show next actionable phase
  - `pnpm roadmap:blocked` - Show phases waiting on dependencies
  - `pnpm roadmap:path-to --phase N` - Show critical path to target
  - `pnpm roadmap:status` - Quick summary (completed/active/roadmap counts)

  This is the capstone for Setup A (Framework Roadmap OS).
  Transforms roadmap from "document to maintain" to "queries over reality".

  Implements Convergence Opportunity 8: Living Roadmap That Compiles.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | roadmap:next CLI command | pending | Yes | src/cli/ |
      | roadmap:blocked CLI command | pending | Yes | src/cli/ |
      | roadmap:path-to CLI command | pending | Yes | src/cli/ |
      | roadmap:status CLI command | pending | Yes | src/cli/ |
      | Dependency graph analyzer | pending | Yes | src/analyzers/ |
      | Critical path calculator | pending | Yes | src/analyzers/ |

  @acceptance-criteria
  Scenario: Query next actionable phase
    Given TypeScript phase files with dependencies and status
    When running pnpm roadmap:next
    Then output shows the next phase that can be started
    And dependencies are verified as complete
    And estimated effort is shown

  @acceptance-criteria
  Scenario: Query blocked phases
    Given TypeScript phase files with depends-on metadata
    When running pnpm roadmap:blocked
    Then output shows phases waiting on incomplete dependencies
    And blocking dependencies are listed per phase

  @acceptance-criteria
  Scenario: Calculate critical path to target
    Given a target phase with transitive dependencies
    When running pnpm roadmap:path-to --phase N
    Then output shows all phases that must complete first
    And total estimated effort is calculated
    And phases are ordered by dependency graph

  @acceptance-criteria
  Scenario: Quick status summary
    Given TypeScript phase files with completed, active, and roadmap status
    When running pnpm roadmap:status
    Then output shows counts per status
    And overall progress percentage is shown
    And active phase details are highlighted
