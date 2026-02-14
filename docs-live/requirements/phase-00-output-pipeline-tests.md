# 🚧 Output Pipeline Tests

**Purpose:** Detailed requirements for the Output Pipeline Tests feature

---

## Overview

| Property     | Value  |
| ------------ | ------ |
| Status       | active |
| Product Area | API    |

## Description

Validates the output pipeline transforms: summarization, modifiers,
list filters, empty stripping, and format output.

## Acceptance Criteria

**Default mode returns summaries for pattern arrays**

- Given 3 patterns in the pipeline
- When I apply the output pipeline with default modifiers
- Then the output is an array of 3 summaries
- And each summary has a patternName field

**Count modifier returns integer**

- Given 5 patterns in the pipeline
- When I apply the output pipeline with count modifier
- Then the output is the number 5

**Names-only modifier returns string array**

- Given 3 patterns named "Alpha", "Beta", "Gamma" in the pipeline
- When I apply the output pipeline with names-only modifier
- Then the output is an array of strings "Alpha", "Beta", "Gamma"

**Fields modifier picks specific fields**

- Given 2 patterns in the pipeline
- When I apply the output pipeline with fields "patternName,status"
- Then each output object has only "patternName" and "status" keys

**Full modifier bypasses summarization**

- Given 2 patterns in the pipeline
- When I apply the output pipeline with full modifier
- Then each output object has a "directive" field

**Scalar input passes through unchanged**

- Given a scalar value in the pipeline
- When I apply the output pipeline with default modifiers
- Then the output equals the original scalar

**Fields with single field returns objects with one key**

- Given 5 patterns in the pipeline
- When I apply the output pipeline with fields "patternName"
- Then each result object has exactly 1 key

**Full combined with names-only is rejected**

- When I validate modifiers with full and names-only both true
- Then validation fails with "Conflicting modifiers"

**Full combined with count is rejected**

- When I validate modifiers with full and count both true
- Then validation fails with "Conflicting modifiers"

**Full combined with fields is rejected**

- When I validate modifiers with full and fields "patternName"
- Then validation fails with "Conflicting modifiers"

**Invalid field name is rejected**

- When I validate modifiers with fields "patternName,bogusField"
- Then validation fails with "Invalid field names: bogusField"

**Filter by status returns matching patterns**

- Given a dataset with 3 active and 2 roadmap patterns
- When I apply list filters with status "active"
- Then 3 patterns are returned

**Filter by status and category narrows results**

- Given a dataset with active patterns in categories "core" and "api"
- When I apply list filters with status "active" and category "core"
- Then only core patterns are returned

**Pagination with limit and offset**

- Given a dataset with 10 roadmap patterns
- When I apply list filters with limit 3 and offset 2
- Then 3 patterns are returned starting from index 2

**Offset beyond array length returns empty results**

- Given a dataset with 3 roadmap patterns
- When I apply list filters with status "roadmap" and limit 5 and offset 10
- Then 0 patterns are returned

**Null and empty values are stripped**

- Given an object with null, empty string, and empty array values
- When I strip empty values
- Then the result does not contain null values
- And the result does not contain empty strings
- And the result does not contain empty arrays

## Business Rules

**Output modifiers apply with correct precedence**

_Verified by: Default mode returns summaries for pattern arrays, Count modifier returns integer, Names-only modifier returns string array, Fields modifier picks specific fields, Full modifier bypasses summarization, Scalar input passes through unchanged, Fields with single field returns objects with one key_

**Modifier conflicts are rejected**

_Verified by: Full combined with names-only is rejected, Full combined with count is rejected, Full combined with fields is rejected, Invalid field name is rejected_

**List filters compose via AND logic**

_Verified by: Filter by status returns matching patterns, Filter by status and category narrows results, Pagination with limit and offset, Offset beyond array length returns empty results_

**Empty stripping removes noise**

_Verified by: Null and empty values are stripped_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
