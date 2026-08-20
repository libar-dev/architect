Feature: Projection perf report

  Rule: Projection hot paths stay under committed budgets

    Scenario: Write a budgetable projection perf report for representative documentation bundles
      When I generate the BusinessRuleSet perf report
      Then the perf report evidence file should be written
      And the perf report should include renderMarkdown metrics for representative documentation bundles
