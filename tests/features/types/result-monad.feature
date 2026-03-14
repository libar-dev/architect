@architect
@architect-pattern:ResultMonad
@architect-status:completed
@architect-product-area:CoreTypes
@architect-include:core-types
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

  Rule: Result.ok wraps values into success results

    **Invariant:** Result.ok always produces a result where isOk is true, regardless of the wrapped value type (primitives, objects, null, undefined).
    **Rationale:** Consumers rely on isOk to branch logic; if Result.ok could produce an ambiguous state, every call site would need defensive checks beyond the type guard.
    **Verified by:** Result.ok wraps a primitive value, Result.ok wraps an object value, Result.ok wraps null value, Result.ok wraps undefined value

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

  Rule: Result.err wraps values into error results

    **Invariant:** Result.err always produces a result where isErr is true, supporting Error instances, strings, and structured objects as error values.
    **Rationale:** Supporting multiple error value types allows callers to propagate rich context (structured objects) or simple messages (strings) without forcing a single error representation.
    **Verified by:** Result.err wraps an Error instance, Result.err wraps a string error, Result.err wraps a structured error object

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

  Rule: Type guards distinguish success from error results

    **Invariant:** isOk and isErr are mutually exclusive: exactly one returns true for any Result value.
    **Rationale:** If both guards could return true (or both false), TypeScript type narrowing would break, leaving the value/error branch unreachable or unsound.
    **Verified by:** Type guards correctly identify success results, Type guards correctly identify error results

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

  Rule: unwrap extracts the value or throws the error

    **Invariant:** unwrap on a success result returns the value; unwrap on an error result always throws an Error instance (wrapping non-Error values for stack trace preservation).
    **Rationale:** Wrapping non-Error values in Error instances ensures stack traces are always available for debugging, preventing the loss of call-site context when string or object errors are thrown.
    **Verified by:** unwrap extracts value from success result, unwrap throws the Error from error result, unwrap wraps non-Error in Error for proper stack trace, unwrap serializes object error to JSON in message

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

  Rule: unwrapOr extracts the value or returns a default

    **Invariant:** unwrapOr on a success result returns the contained value (ignoring the default); on an error result it returns the provided default value.
    **Rationale:** Providing a safe fallback path avoids forcing callers to handle errors explicitly when a sensible default exists, reducing boilerplate in non-critical error recovery.
    **Verified by:** unwrapOr returns value from success result, unwrapOr returns default from error result, unwrapOr returns numeric default from error result

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

  Rule: map transforms the success value without affecting errors

    **Invariant:** map applies the transformation function only to success results; error results pass through unchanged. Multiple maps can be chained.
    **Rationale:** Skipping the transformation on error results enables chained pipelines to short-circuit on the first failure without requiring explicit error checks at each step.
    **Verified by:** map transforms success value, map passes through error unchanged, map chains multiple transformations

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

  Rule: mapErr transforms the error value without affecting successes

    **Invariant:** mapErr applies the transformation function only to error results; success results pass through unchanged. Error types can be converted.
    **Rationale:** Allowing error-type conversion at boundaries (e.g., low-level I/O errors to domain errors) keeps success paths untouched and preserves the original value through error-handling layers.
    **Verified by:** mapErr transforms error value, mapErr passes through success unchanged, mapErr converts error type

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
