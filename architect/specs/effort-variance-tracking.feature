@opportunity-3
@architect
@architect-pattern:EffortVarianceTracking
@architect-status:roadmap
@architect-phase:100
@architect-effort:2d
@architect-product-area:Process
@architect-include:process-workflow
@architect-depends-on:MvpWorkflowImplementation
@architect-business-value:track-planned-vs-actual-effort-variance
@architect-priority:medium
Feature: Effort Variance Tracking - Improve Estimates Over Time

  **Problem:**
  No systematic way to track planned vs actual effort.
  Cannot learn from estimation accuracy patterns.
  No visibility into "where time goes" across workflows.

  **Solution:**
  Generate EFFORT-ANALYSIS.md report showing:
  - Phase burndown (planned vs actual per phase)
  - Estimation accuracy trends over time
  - Time distribution by workflow type (design, implementation, testing, docs)

  Uses effort and effort-actual metadata from TypeScript phase files.
  Uses workflow metadata for time distribution analysis.

  Implements Convergence Opportunity 3: Earned-Value Tracking (lightweight).

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Effort variance section renderer | pending | Yes | src/generators/sections/ |
      | Workflow distribution analyzer | pending | Yes | src/analyzers/ |
      | effort-analysis generator config | pending | No | src/generators/built-in/ |

  @acceptance-criteria
  Scenario: Generate phase variance report
    Given TypeScript phase files with effort and effort-actual metadata
    When running effort analysis generator
    Then report shows variance per phase (planned - actual)
    And variance percentage is calculated
    And overall accuracy trend is shown

  @acceptance-criteria
  Scenario: Generate workflow time distribution
    Given TypeScript phase files with workflow metadata
    When running effort analysis generator
    Then report shows effort breakdown by workflow type
    And percentages show where time is spent
