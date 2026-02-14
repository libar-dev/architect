@libar-docs
@libar-docs-pattern:RuleKeywordPoC
@libar-docs-status:completed
@libar-docs-product-area:Generation
@poc @rule-keyword
Feature: PoC - Rule Keyword Support
  This feature tests whether vitest-cucumber supports the Rule keyword
  for organizing scenarios under business rules.

  Background:
    Given a test context is initialized

  Rule: Basic arithmetic operations work correctly
    The calculator should perform standard math operations
    with correct results.

    @happy-path
    Scenario: Addition of two positive numbers
      Given the first number is 5
      And the second number is 3
      When I add the numbers
      Then the result should be 8

    @happy-path
    Scenario: Subtraction of two numbers
      Given the first number is 10
      And the second number is 4
      When I subtract the numbers
      Then the result should be 6

  Rule: Division has special constraints
    Division by zero must be handled gracefully to prevent
    system errors.

    @happy-path
    Scenario: Division of two numbers
      Given the first number is 20
      And the second number is 4
      When I divide the numbers
      Then the result should be 5

    @validation
    Scenario: Division by zero is prevented
      Given the first number is 10
      And the second number is 0
      When I attempt to divide the numbers
      Then an error should be returned with message "Division by zero"
