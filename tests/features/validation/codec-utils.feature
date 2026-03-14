@libar-docs
@libar-docs-pattern:CodecUtilsValidation
@libar-docs-status:active
@libar-docs-product-area:Validation
@validation @codec
Feature: Codec Utils Validation
  The codec utilities provide factory functions for creating type-safe JSON
  parsing and serialization pipelines using Zod schemas. They replace manual
  JSON.parse/stringify with single-step validated operations that return
  Result types for explicit error handling.

  Background:
    Given a codec utils test context

  Rule: createJsonInputCodec parses and validates JSON strings

    **Invariant:** createJsonInputCodec returns an ok Result when the input is valid JSON that conforms to the provided Zod schema, and an err Result with a descriptive CodecError otherwise.
    **Rationale:** Combining JSON parsing and schema validation into a single operation eliminates the class of bugs where parsed-but-invalid data leaks into the application.
    **Verified by:** Input codec parses valid JSON matching schema, Input codec rejects invalid JSON syntax, Input codec rejects valid JSON that fails schema validation, Input codec includes source in error when provided, Input codec safeParse returns value for valid input, Input codec safeParse returns undefined for invalid input

    @function:createJsonInputCodec @happy-path
    Scenario: Input codec parses valid JSON matching schema
      Given a Zod schema for an object with a required name string field
      When I parse the JSON string '{"name": "Alice"}' with the input codec
      Then the parse result should be ok
      And the parsed value name should be "Alice"

    @function:createJsonInputCodec @error-case
    Scenario: Input codec rejects invalid JSON syntax
      Given a Zod schema for an object with a required name string field
      When I parse the JSON string '{not valid json}' with the input codec
      Then the parse result should be err
      And the codec error operation should be "parse"
      And the codec error message should contain "Invalid JSON"

    @function:createJsonInputCodec @error-case
    Scenario: Input codec rejects valid JSON that fails schema validation
      Given a Zod schema for an object with a required name string field
      When I parse the JSON string '{"age": 30}' with the input codec
      Then the parse result should be err
      And the codec error operation should be "parse"
      And the codec error message should contain "Schema validation failed"
      And the codec error should have validation errors

    @function:createJsonInputCodec
    Scenario: Input codec includes source in error when provided
      Given a Zod schema for an object with a required name string field
      When I parse the JSON string '{"age": 30}' with source "config.json" using the input codec
      Then the parse result should be err
      And the codec error message should contain "config.json"

    @function:createJsonInputCodec
    Scenario: Input codec safeParse returns value for valid input
      Given a Zod schema for an object with a required name string field
      When I safeParse the JSON string '{"name": "Bob"}' with the input codec
      Then the safeParse result should not be undefined
      And the safeParse result name should be "Bob"

    @function:createJsonInputCodec
    Scenario: Input codec safeParse returns undefined for invalid input
      Given a Zod schema for an object with a required name string field
      When I safeParse the JSON string '{broken' with the input codec
      Then the safeParse result should be undefined

  Rule: formatCodecError formats errors for display

    **Invariant:** formatCodecError always returns a non-empty string that includes the operation type and message, and appends validation errors when present.
    **Rationale:** Consistent error formatting across all codec consumers avoids duplicated formatting logic and ensures error messages always contain enough context for debugging.
    **Verified by:** formatCodecError formats error without validation details, formatCodecError formats error with validation details

    @function:formatCodecError
    Scenario: formatCodecError formats error without validation details
      When I format a codec error with operation "parse" and message "Invalid JSON"
      Then the formatted error should contain "parse"
      And the formatted error should contain "Invalid JSON"

    @function:formatCodecError
    Scenario: formatCodecError formats error with validation details
      When I format a codec error with operation "parse" and message "Schema validation failed" and validation errors
      Then the formatted error should contain "Schema validation failed"
      And the formatted error should contain "Validation errors"
