# ✅ Result Monad

**Purpose:** Detailed requirements for the Result Monad feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | CoreTypes |

## Description

The Result type provides explicit error handling via a discriminated union.
This eliminates thrown exceptions in favor of type-safe error propagation.

**Why Result over try/catch:**

- Compile-time verification that errors are handled
- Type narrowing via isOk/isErr guards
- Chainable transformations via map/mapErr
- No hidden control flow from thrown exceptions

## Acceptance Criteria

**Result.ok wraps a primitive value**

- When I create a success result with value "hello"
- Then the result should be ok
- And the result value should be "hello"

**Result.ok wraps an object value**

- When I create a success result with object value:
- Then the result should be ok
- And the result value should have name "test"
- And the result value should have count 42

| name | count |
| ---- | ----- |
| test | 42    |

**Result.ok wraps null value**

- When I create a success result with null
- Then the result should be ok
- And the result value should be null

**Result.ok wraps undefined value**

- When I create a success result with undefined
- Then the result should be ok
- And the result value should be undefined

**Result.err wraps an Error instance**

- When I create an error result with Error "Something went wrong"
- Then the result should be err
- And the error should be an Error instance
- And the error message should be "Something went wrong"

**Result.err wraps a string error**

- When I create an error result with string "validation failed"
- Then the result should be err
- And the error should be "validation failed"

**Result.err wraps a structured error object**

- When I create an error result with object:
- Then the result should be err
- And the error should have code "E001"
- And the error should have message "Invalid input"

| code | message       |
| ---- | ------------- |
| E001 | Invalid input |

**Type guards correctly identify success results**

- Given a success result with value 100
- Then Result.isOk should return true
- And Result.isErr should return false

**Type guards correctly identify error results**

- Given an error result with Error "test error"
- Then Result.isOk should return false
- And Result.isErr should return true

**unwrap extracts value from success result**

- Given a success result with value "extracted"
- When I call unwrap on the result
- Then unwrap should return "extracted"

**unwrap throws the Error from error result**

- Given an error result with Error "unwrap should throw this"
- When I call unwrap on the result
- Then unwrap should throw an Error with message "unwrap should throw this"

**unwrap wraps non-Error in Error for proper stack trace**

- Given an error result with string "string error"
- When I call unwrap on the result
- Then unwrap should throw an Error instance
- And the thrown error message should contain "string error"

**unwrap serializes object error to JSON in message**

- Given an error result with object:
- When I call unwrap on the result
- Then unwrap should throw an Error instance
- And the thrown error message should contain all of:

| code   | reason       |
| ------ | ------------ |
| ERR_42 | test failure |

| substring    |
| ------------ |
| ERR_42       |
| test failure |

**unwrapOr returns value from success result**

- Given a success result with value "actual value"
- When I call unwrapOr with default "fallback"
- Then unwrapOr should return "actual value"

**unwrapOr returns default from error result**

- Given an error result with Error "ignored error"
- When I call unwrapOr with default "fallback"
- Then unwrapOr should return "fallback"

**unwrapOr returns numeric default from error result**

- Given an error result with Error "count failed"
- When I call unwrapOr with default 0
- Then unwrapOr should return 0

**map transforms success value**

- Given a success result with value 5
- When I map the result with a function that doubles the value
- Then the mapped result should be ok
- And the mapped value should be 10

**map passes through error unchanged**

- Given an error result with Error "untouched"
- When I map the result with a function that doubles the value
- Then the mapped result should be err
- And the error message should be "untouched"

**map chains multiple transformations**

- Given a success result with value "hello"
- When I map with uppercase then map with length
- Then the mapped result should be ok
- And the mapped value should be 5

**mapErr transforms error value**

- Given an error result with string "original"
- When I mapErr the result to prefix with "Error: "
- Then the mapped result should be err
- And the error should be "Error: original"

**mapErr passes through success unchanged**

- Given a success result with value "preserved"
- When I mapErr the result to prefix with "Error: "
- Then the mapped result should be ok
- And the result value should be "preserved"

**mapErr converts error type**

- Given an error result with string "code:123"
- When I mapErr to parse into structured error
- Then the mapped result should be err
- And the error should have code "123"

## Business Rules

**Result.ok wraps values into success results**

**Invariant:** Result.ok always produces a result where isOk is true, regardless of the wrapped value type (primitives, objects, null, undefined).
**Verified by:** Result.ok wraps a primitive value, Result.ok wraps an object value, Result.ok wraps null value, Result.ok wraps undefined value

_Verified by: Result.ok wraps a primitive value, Result.ok wraps an object value, Result.ok wraps null value, Result.ok wraps undefined value_

**Result.err wraps values into error results**

**Invariant:** Result.err always produces a result where isErr is true, supporting Error instances, strings, and structured objects as error values.
**Verified by:** Result.err wraps an Error instance, Result.err wraps a string error, Result.err wraps a structured error object

_Verified by: Result.err wraps an Error instance, Result.err wraps a string error, Result.err wraps a structured error object_

**Type guards distinguish success from error results**

**Invariant:** isOk and isErr are mutually exclusive: exactly one returns true for any Result value.
**Verified by:** Type guards correctly identify success results, Type guards correctly identify error results

_Verified by: Type guards correctly identify success results, Type guards correctly identify error results_

**unwrap extracts the value or throws the error**

**Invariant:** unwrap on a success result returns the value; unwrap on an error result always throws an Error instance (wrapping non-Error values for stack trace preservation).
**Verified by:** unwrap extracts value from success result, unwrap throws the Error from error result, unwrap wraps non-Error in Error for proper stack trace, unwrap serializes object error to JSON in message

_Verified by: unwrap extracts value from success result, unwrap throws the Error from error result, unwrap wraps non-Error in Error for proper stack trace, unwrap serializes object error to JSON in message_

**unwrapOr extracts the value or returns a default**

**Invariant:** unwrapOr on a success result returns the contained value (ignoring the default); on an error result it returns the provided default value.
**Verified by:** unwrapOr returns value from success result, unwrapOr returns default from error result, unwrapOr returns numeric default from error result

_Verified by: unwrapOr returns value from success result, unwrapOr returns default from error result, unwrapOr returns numeric default from error result_

**map transforms the success value without affecting errors**

**Invariant:** map applies the transformation function only to success results; error results pass through unchanged. Multiple maps can be chained.
**Verified by:** map transforms success value, map passes through error unchanged, map chains multiple transformations

_Verified by: map transforms success value, map passes through error unchanged, map chains multiple transformations_

**mapErr transforms the error value without affecting successes**

**Invariant:** mapErr applies the transformation function only to error results; success results pass through unchanged. Error types can be converted.
**Verified by:** mapErr transforms error value, mapErr passes through success unchanged, mapErr converts error type

_Verified by: mapErr transforms error value, mapErr passes through success unchanged, mapErr converts error type_

## Implementations

Files that implement this pattern:

- [`result.ts`](../../src/types/result.ts) - ## Result Monad - Type Definitions

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
