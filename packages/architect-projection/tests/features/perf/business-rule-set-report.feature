Feature: Projection perf report

  Rule: Projection hot paths stay under committed budgets

    Scenario: Write a budgetable BusinessRuleSet perf report
      When I generate the BusinessRuleSet perf report
      Then the perf report evidence file should be written
