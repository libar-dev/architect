@architect
@architect-pattern:RuleKeywordPoC
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Generation
@architect-implements:GherkinRulesSupport
@poc @rule-keyword
Feature: PoC - Rule Keyword Support
  This feature tests whether vitest-cucumber supports the Rule keyword
  for organizing scenarios under business rules.

  Background:
    Given a test context is initialized

  Rule: Basic arithmetic operations work correctly

    **Invariant:** Arithmetic operations must return mathematically correct results for all valid inputs.
    **Rationale:** Incorrect arithmetic results silently corrupt downstream calculations, making errors undetectable at their source.

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

    **Invariant:** Division operations must reject a zero divisor before execution.
    **Rationale:** Unguarded division by zero causes runtime exceptions that crash the process instead of returning a recoverable error.

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
