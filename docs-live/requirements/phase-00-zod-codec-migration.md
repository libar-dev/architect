# ✅ Zod Codec Migration

**Purpose:** Detailed requirements for the Zod Codec Migration feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

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

## Acceptance Criteria

**Input codec parses valid JSON to typed object**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- When I parse valid JSON '{"name": "test", "count": 5}'
- Then the parse result should be successful
- And the parsed value should have name "test"
- And the parsed value should have count 5

**Input codec returns error for malformed JSON**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- When I parse malformed JSON '{invalid json' with source "config.json"
- Then the parse result should be an error
- And the error operation should be "parse"
- And the error message should contain "Invalid JSON"
- And the error source should be "config.json"

**Input codec returns validation errors for schema violations**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- When I parse JSON '{"name": 123, "count": "not a number"}' with source "bad.json"
- Then the parse result should be an error
- And the error operation should be "parse"
- And the error message should contain "Schema validation failed"
- And the error should have validation errors
- And the validation errors should mention fields:

| field |
| ----- |
| name  |
| count |

**Input codec strips $schema field before validation**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- When I parse JSON '{"$schema": "http://json-schema.org/draft-07/schema#", "name": "test", "count": 1}'
- Then the parse result should be successful
- And the parsed value should have name "test"
- And the parsed value should not have a $schema property

**Output codec serializes valid object to JSON**

- Given a simple test schema for objects with name and count
- And the output codec is created for the test schema
- When I serialize a valid object with name "output" and count 10
- Then the serialize result should be successful
- And the serialized JSON should be valid
- And the serialized JSON should contain "output"

**Output codec returns error for schema violations**

- Given a simple test schema for objects with name and count
- And the output codec is created for the test schema
- When I serialize an invalid object with wrong types and source "output.json"
- Then the serialize result should be an error
- And the error operation should be "serialize"
- And the error message should contain "Schema validation failed"
- And the error source should be "output.json"

**Output codec respects indent option**

- Given a simple test schema for objects with name and count
- And the output codec is created for the test schema
- When I serialize with name "indent" count 1 and indent 4
- Then the serialize result should be successful
- And the serialized JSON should use 4-space indentation

**LintOutputSchema validates correct lint output**

- Given the LintOutputSchema codec
- When I serialize a valid lint output:
- Then the serialize result should be successful
- And the serialized JSON should be parseable

| field             | value |
| ----------------- | ----- |
| errors            | 2     |
| warnings          | 1     |
| info              | 0     |
| filesScanned      | 10    |
| directivesChecked | 25    |

**LintOutputSchema rejects invalid severity**

- Given the LintOutputSchema codec
- When I serialize a lint output with invalid severity "critical"
- Then the serialize result should be an error
- And the error should have validation errors

**ValidationSummaryOutputSchema validates correct validation output**

- Given the ValidationSummaryOutputSchema codec
- When I serialize a valid validation summary:
- Then the serialize result should be successful
- And the serialized JSON should be parseable

| field               | value |
| ------------------- | ----- |
| typescriptPatterns  | 15    |
| gherkinPatterns     | 12    |
| matched             | 10    |
| missingInGherkin    | 5     |
| missingInTypeScript | 2     |

**ValidationSummaryOutputSchema rejects invalid issue source**

- Given the ValidationSummaryOutputSchema codec
- When I serialize a validation summary with invalid source "unknown"
- Then the serialize result should be an error
- And the error should have validation errors

**RegistryMetadataOutputSchema accepts arbitrary metadata**

- Given the RegistryMetadataOutputSchema codec
- When I serialize arbitrary nested metadata
- Then the serialize result should be successful
- And the serialized JSON should be parseable

**formatCodecError includes validation errors in output**

- Given a codec error with validation errors:
- When I format the codec error
- Then the formatted output should contain all of:

| path  | message         |
| ----- | --------------- |
| name  | Expected string |
| count | Expected number |

| text                   |
| ---------------------- |
| Codec error            |
| Validation errors:     |
| name: Expected string  |
| count: Expected number |

**safeParse returns typed value on valid JSON**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- When I safeParse valid JSON '{"name": "safe", "count": 99}'
- Then safeParse should return a value
- And the safeParsed value should have name "safe"
- And the safeParsed value should have count 99

**safeParse returns undefined on malformed JSON**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- When I safeParse malformed JSON '{invalid'
- Then safeParse should return undefined

**safeParse returns undefined on schema violation**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- When I safeParse JSON with wrong types '{"name": 123, "count": "text"}'
- Then safeParse should return undefined

**createFileLoader loads and parses valid JSON file**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- And a mock file reader that returns '{"name": "loaded", "count": 42}'
- When I create a file loader and load "test.json"
- Then the file load result should be successful
- And the loaded value should have name "loaded"
- And the loaded value should have count 42

**createFileLoader handles ENOENT error**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- And a mock file reader that throws ENOENT for "missing.json"
- When I create a file loader and load "missing.json"
- Then the file load result should be an error
- And the error message should contain "File not found"
- And the error source should be "missing.json"

**createFileLoader handles EACCES error**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- And a mock file reader that throws EACCES for "protected.json"
- When I create a file loader and load "protected.json"
- Then the file load result should be an error
- And the error message should contain "Permission denied"

**createFileLoader handles general read error**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- And a mock file reader that throws generic error "Disk failure"
- When I create a file loader and load "disk.json"
- Then the file load result should be an error
- And the error message should contain "Disk failure"

**createFileLoader handles invalid JSON in file**

- Given a simple test schema for objects with name and count
- And the codec is created for the test schema
- And a mock file reader that returns '{invalid json content'
- When I create a file loader and load "bad.json"
- Then the file load result should be an error
- And the error message should contain "Invalid JSON"

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
