@architect
@architect-pattern:ZodCodecMigration
@architect-status:completed
@architect-product-area:Generation
@behavior @codec
Feature: Zod Codec Migration
  All JSON parsing and serialization uses type-safe Zod codec pattern,
  replacing raw JSON.parse/stringify with single-step validated operations.

  **Problem:**
  - Raw JSON.parse returns unknown/any types, losing type safety at runtime
  - JSON.stringify doesn't validate output matches expected schema
  - Error handling for malformed JSON scattered across codebase
  - No structured validation errors with field-level details
  - $schema fields from JSON Schema files cause Zod strict mode failures

  **Solution:**
  - Input codec (createJsonInputCodec) combines parsing + validation in one step
  - Output codec (createJsonOutputCodec) validates before serialization
  - Structured CodecError type with operation, source, and validation details
  - $schema stripping before validation for JSON Schema compatibility
  - formatCodecError utility for consistent human-readable error output

  Background:
    Given a codec test context

  Rule: Input codec parses and validates JSON in a single step

    **Invariant:** Every JSON string parsed through the input codec is both syntactically valid JSON and schema-conformant before returning a typed value.
    **Rationale:** Separating parse from validate allows invalid data to leak past the boundary — a single-step codec ensures callers never hold an unvalidated value.

    **Verified by:** Input codec parses valid JSON to typed object, Input codec returns error for malformed JSON, Input codec returns validation errors for schema violations, Input codec strips $schema field before validation

    @function:createJsonInputCodec @happy-path
    Scenario: Input codec parses valid JSON to typed object
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      When I parse valid JSON '{"name": "test", "count": 5}'
      Then the parse result should be successful
      And the parsed value should have name "test"
      And the parsed value should have count 5

    @function:createJsonInputCodec
    Scenario: Input codec returns error for malformed JSON
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      When I parse malformed JSON '{invalid json' with source "config.json"
      Then the parse result should be an error
      And the error operation should be "parse"
      And the error message should contain "Invalid JSON"
      And the error source should be "config.json"

    @function:createJsonInputCodec
    Scenario: Input codec returns validation errors for schema violations
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      When I parse JSON '{"name": 123, "count": "not a number"}' with source "bad.json"
      Then the parse result should be an error
      And the error operation should be "parse"
      And the error message should contain "Schema validation failed"
      And the error should have validation errors
      And the validation errors should mention fields:
        | field |
        | name  |
        | count |

    @function:createJsonInputCodec
    Scenario: Input codec strips $schema field before validation
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      When I parse JSON '{"$schema": "http://json-schema.org/draft-07/schema#", "name": "test", "count": 1}'
      Then the parse result should be successful
      And the parsed value should have name "test"
      And the parsed value should not have a "$schema" property

  Rule: Output codec validates before serialization

    **Invariant:** Every object serialized through the output codec is schema-validated before JSON.stringify, preventing invalid data from reaching consumers.
    **Rationale:** Serializing without validation can produce JSON that downstream consumers cannot parse, causing failures far from the source of the invalid data.

    **Verified by:** Output codec serializes valid object to JSON, Output codec returns error for schema violations, Output codec respects indent option

    @function:createJsonOutputCodec @happy-path
    Scenario: Output codec serializes valid object to JSON
      Given a simple test schema for objects with name and count
      And the output codec is created for the test schema
      When I serialize a valid object with name "output" and count 10
      Then the serialize result should be successful
      And the serialized JSON should be valid
      And the serialized JSON should contain "output"

    @function:createJsonOutputCodec
    Scenario: Output codec returns error for schema violations
      Given a simple test schema for objects with name and count
      And the output codec is created for the test schema
      When I serialize an invalid object with wrong types and source "output.json"
      Then the serialize result should be an error
      And the error operation should be "serialize"
      And the error message should contain "Schema validation failed"
      And the error source should be "output.json"

    @function:createJsonOutputCodec
    Scenario: Output codec respects indent option
      Given a simple test schema for objects with name and count
      And the output codec is created for the test schema
      When I serialize with name "indent" count 1 and indent 4
      Then the serialize result should be successful
      And the serialized JSON should use 4-space indentation

  Rule: LintOutputSchema validates CLI lint output structure

    **Invariant:** Lint output JSON always conforms to the LintOutputSchema, ensuring consistent structure for downstream tooling.
    **Rationale:** Non-conformant lint output breaks CI pipeline parsers and IDE integrations that depend on a stable JSON contract.

    **Verified by:** LintOutputSchema validates correct lint output, LintOutputSchema rejects invalid severity

    @schema:LintOutputSchema @happy-path
    Scenario: LintOutputSchema validates correct lint output
      Given the LintOutputSchema codec
      When I serialize a valid lint output:
        | field             | value  |
        | errors            | 2      |
        | warnings          | 1      |
        | info              | 0      |
        | filesScanned      | 10     |
        | directivesChecked | 25     |
      Then the serialize result should be successful
      And the serialized JSON should be parseable

    @schema:LintOutputSchema
    Scenario: LintOutputSchema rejects invalid severity
      Given the LintOutputSchema codec
      When I serialize a lint output with invalid severity "critical"
      Then the serialize result should be an error
      And the error should have validation errors

  Rule: ValidationSummaryOutputSchema validates cross-source analysis output

    **Invariant:** Validation summary JSON always conforms to the ValidationSummaryOutputSchema, ensuring consistent reporting of cross-source pattern analysis.
    **Rationale:** Inconsistent validation summaries cause miscounted pattern coverage, leading to false confidence or missed gaps in cross-source analysis.

    **Verified by:** ValidationSummaryOutputSchema validates correct validation output, ValidationSummaryOutputSchema rejects invalid issue source

    @schema:ValidationSummaryOutputSchema @happy-path
    Scenario: ValidationSummaryOutputSchema validates correct validation output
      Given the ValidationSummaryOutputSchema codec
      When I serialize a valid validation summary:
        | field               | value |
        | typescriptPatterns  | 15    |
        | gherkinPatterns     | 12    |
        | matched             | 10    |
        | missingInGherkin    | 5     |
        | missingInTypeScript | 2     |
      Then the serialize result should be successful
      And the serialized JSON should be parseable

    @schema:ValidationSummaryOutputSchema
    Scenario: ValidationSummaryOutputSchema rejects invalid issue source
      Given the ValidationSummaryOutputSchema codec
      When I serialize a validation summary with invalid source "unknown"
      Then the serialize result should be an error
      And the error should have validation errors

  Rule: RegistryMetadataOutputSchema accepts arbitrary nested structures

    **Invariant:** Registry metadata codec accepts any valid JSON-serializable object without schema constraints on nested structure.
    **Rationale:** Registry consumers attach domain-specific metadata whose shape varies per preset — constraining the nested structure would break extensibility across presets.

    **Verified by:** RegistryMetadataOutputSchema accepts arbitrary metadata

    @schema:RegistryMetadataOutputSchema @happy-path
    Scenario: RegistryMetadataOutputSchema accepts arbitrary metadata
      Given the RegistryMetadataOutputSchema codec
      When I serialize arbitrary nested metadata
      Then the serialize result should be successful
      And the serialized JSON should be parseable

  Rule: formatCodecError produces human-readable error output

    **Invariant:** Formatted codec errors always include the operation context and all validation error details for debugging.
    **Rationale:** Omitting the operation context or individual field errors forces developers to reproduce failures manually instead of diagnosing from the error message alone.

    **Verified by:** formatCodecError includes validation errors in output

    @function:formatCodecError
    Scenario: formatCodecError includes validation errors in output
      Given a codec error with validation errors:
        | path  | message                |
        | name  | Expected string        |
        | count | Expected number        |
      When I format the codec error
      Then the formatted output should contain all of:
        | text                   |
        | Codec error            |
        | Validation errors:     |
        | name: Expected string  |
        | count: Expected number |

  Rule: safeParse returns typed values or undefined without throwing

    **Invariant:** safeParse never throws exceptions; it returns the typed value on success or undefined on any failure.
    **Rationale:** Throwing on invalid input forces every call site to wrap in try/catch — returning undefined lets callers use simple conditional checks and avoids unhandled exception crashes.

    **Verified by:** safeParse returns typed value on valid JSON, safeParse returns undefined on malformed JSON, safeParse returns undefined on schema violation

    @function:safeParse @happy-path
    Scenario: safeParse returns typed value on valid JSON
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      When I safeParse valid JSON '{"name": "safe", "count": 99}'
      Then safeParse should return a value
      And the safeParsed value should have name "safe"
      And the safeParsed value should have count 99

    @function:safeParse
    Scenario: safeParse returns undefined on malformed JSON
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      When I safeParse malformed JSON '{invalid'
      Then safeParse should return undefined

    @function:safeParse
    Scenario: safeParse returns undefined on schema violation
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      When I safeParse JSON with wrong types '{"name": 123, "count": "text"}'
      Then safeParse should return undefined

  Rule: createFileLoader handles filesystem operations with typed errors

    **Invariant:** File loader converts all filesystem errors (ENOENT, EACCES, generic) into structured CodecError values with appropriate messages and source paths.
    **Rationale:** Propagating raw filesystem exceptions leaks Node.js error internals to consumers and prevents consistent error formatting across parse, validate, and I/O failures.

    **Verified by:** createFileLoader loads and parses valid JSON file, createFileLoader handles ENOENT error, createFileLoader handles EACCES error, createFileLoader handles general read error, createFileLoader handles invalid JSON in file

    @function:createFileLoader @happy-path
    Scenario: createFileLoader loads and parses valid JSON file
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      And a mock file reader that returns '{"name": "loaded", "count": 42}'
      When I create a file loader and load "test.json"
      Then the file load result should be successful
      And the loaded value should have name "loaded"
      And the loaded value should have count 42

    @function:createFileLoader
    Scenario: createFileLoader handles ENOENT error
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      And a mock file reader that throws ENOENT for "missing.json"
      When I create a file loader and load "missing.json"
      Then the file load result should be an error
      And the error message should contain "File not found"
      And the error source should be "missing.json"

    @function:createFileLoader
    Scenario: createFileLoader handles EACCES error
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      And a mock file reader that throws EACCES for "protected.json"
      When I create a file loader and load "protected.json"
      Then the file load result should be an error
      And the error message should contain "Permission denied"

    @function:createFileLoader
    Scenario: createFileLoader handles general read error
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      And a mock file reader that throws generic error "Disk failure"
      When I create a file loader and load "disk.json"
      Then the file load result should be an error
      And the error message should contain "Disk failure"

    @function:createFileLoader
    Scenario: createFileLoader handles invalid JSON in file
      Given a simple test schema for objects with name and count
      And the codec is created for the test schema
      And a mock file reader that returns '{invalid json content'
      When I create a file loader and load "bad.json"
      Then the file load result should be an error
      And the error message should contain "Invalid JSON"
