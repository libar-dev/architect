@libar-docs
@libar-docs-pattern:ResultMonad
@libar-docs-status:completed
@libar-docs-product-area:Types
@types @result
Feature: Result Monad
  The Result type provides explicit error handling via a discriminated union.
  This eliminates thrown exceptions in favor of type-safe error propagation.

  **Why Result over try/catch:**
  - Compile-time verification that errors are handled
  - Type narrowing via isOk/isErr guards
  - Chainable transformations via map/mapErr
  - No hidden control flow from thrown exceptions

  Background:
    Given a Result test context

  # ============================================================================
  # Result.ok - Create Success Results
  # ============================================================================

  @function:Result.ok @happy-path
  Scenario: Result.ok wraps a primitive value
    When I create a success result with value "hello"
    Then the result should be ok
    And the result value should be "hello"

  @function:Result.ok
  Scenario: Result.ok wraps an object value
    When I create a success result with object value:
      | name  | count |
      | test  | 42    |
    Then the result should be ok
    And the result value should have name "test"
    And the result value should have count 42

  @function:Result.ok
  Scenario: Result.ok wraps null value
    When I create a success result with null
    Then the result should be ok
    And the result value should be null

  @function:Result.ok
  Scenario: Result.ok wraps undefined value
    When I create a success result with undefined
    Then the result should be ok
    And the result value should be undefined

  # ============================================================================
  # Result.err - Create Error Results
  # ============================================================================

  @function:Result.err @happy-path
  Scenario: Result.err wraps an Error instance
    When I create an error result with Error "Something went wrong"
    Then the result should be err
    And the error should be an Error instance
    And the error message should be "Something went wrong"

  @function:Result.err
  Scenario: Result.err wraps a string error
    When I create an error result with string "validation failed"
    Then the result should be err
    And the error should be "validation failed"

  @function:Result.err
  Scenario: Result.err wraps a structured error object
    When I create an error result with object:
      | code    | message       |
      | E001    | Invalid input |
    Then the result should be err
    And the error should have code "E001"
    And the error should have message "Invalid input"

  # ============================================================================
  # Result.isOk / Result.isErr - Type Guards
  # ============================================================================

  @function:Result.isOk @function:Result.isErr
  Scenario: Type guards correctly identify success results
    Given a success result with value 100
    Then Result.isOk should return true
    And Result.isErr should return false

  @function:Result.isOk @function:Result.isErr
  Scenario: Type guards correctly identify error results
    Given an error result with Error "test error"
    Then Result.isOk should return false
    And Result.isErr should return true

  # ============================================================================
  # Result.unwrap - Extract Value or Throw
  # ============================================================================

  @function:Result.unwrap @happy-path
  Scenario: unwrap extracts value from success result
    Given a success result with value "extracted"
    When I call unwrap on the result
    Then unwrap should return "extracted"

  @function:Result.unwrap @error-case
  Scenario: unwrap throws the Error from error result
    Given an error result with Error "unwrap should throw this"
    When I call unwrap on the result
    Then unwrap should throw an Error with message "unwrap should throw this"

  @function:Result.unwrap @error-case
  Scenario: unwrap wraps non-Error in Error for proper stack trace
    Given an error result with string "string error"
    When I call unwrap on the result
    Then unwrap should throw an Error instance
    And the thrown error message should contain "string error"

  @function:Result.unwrap @error-case
  Scenario: unwrap serializes object error to JSON in message
    Given an error result with object:
      | code    | reason        |
      | ERR_42  | test failure  |
    When I call unwrap on the result
    Then unwrap should throw an Error instance
    And the thrown error message should contain all of:
      | substring    |
      | ERR_42       |
      | test failure |

  # ============================================================================
  # Result.unwrapOr - Extract Value with Default
  # ============================================================================

  @function:Result.unwrapOr @happy-path
  Scenario: unwrapOr returns value from success result
    Given a success result with value "actual value"
    When I call unwrapOr with default "fallback"
    Then unwrapOr should return "actual value"

  @function:Result.unwrapOr
  Scenario: unwrapOr returns default from error result
    Given an error result with Error "ignored error"
    When I call unwrapOr with default "fallback"
    Then unwrapOr should return "fallback"

  @function:Result.unwrapOr
  Scenario: unwrapOr returns numeric default from error result
    Given an error result with Error "count failed"
    When I call unwrapOr with default 0
    Then unwrapOr should return 0

  # ============================================================================
  # Result.map - Transform Success Value
  # ============================================================================

  @function:Result.map @happy-path
  Scenario: map transforms success value
    Given a success result with value 5
    When I map the result with a function that doubles the value
    Then the mapped result should be ok
    And the mapped value should be 10

  @function:Result.map
  Scenario: map passes through error unchanged
    Given an error result with Error "untouched"
    When I map the result with a function that doubles the value
    Then the mapped result should be err
    And the error message should be "untouched"

  @function:Result.map
  Scenario: map chains multiple transformations
    Given a success result with value "hello"
    When I map with uppercase then map with length
    Then the mapped result should be ok
    And the mapped value should be 5

  # ============================================================================
  # Result.mapErr - Transform Error Value
  # ============================================================================

  @function:Result.mapErr @happy-path
  Scenario: mapErr transforms error value
    Given an error result with string "original"
    When I mapErr the result to prefix with "Error: "
    Then the mapped result should be err
    And the error should be "Error: original"

  @function:Result.mapErr
  Scenario: mapErr passes through success unchanged
    Given a success result with value "preserved"
    When I mapErr the result to prefix with "Error: "
    Then the mapped result should be ok
    And the result value should be "preserved"

  @function:Result.mapErr
  Scenario: mapErr converts error type
    Given an error result with string "code:123"
    When I mapErr to parse into structured error
    Then the mapped result should be err
    And the error should have code "123"
