# ✅ Poc Integration

**Purpose:** Detailed documentation for the Poc Integration pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |

## Description

End-to-end integration tests that exercise the full documentation generation
  pipeline using the actual POC decision document and real source files.

  This validates that all 11 source mappings from the POC decision document
  work correctly with real project files.

## Acceptance Criteria

**Load actual POC decision document**

- Given the POC decision document at "delivery-process/specs/doc-generation-proof-of-concept.feature"
- When parsing the decision document
- Then parsed content should have correct structure

**Source mappings include all extraction types**

- Given the POC decision document is loaded
- When inspecting source mappings
- Then mappings should include all required source types

**Extract Context rule from THIS DECISION**

- Given the POC decision document is loaded
- When extracting self-reference "THIS DECISION (Rule: Context above)"
- Then extracted content should contain context keywords

**Extract Decision rule from THIS DECISION**

- Given the POC decision document is loaded
- When extracting self-reference "THIS DECISION (Rule: Decision above)"
- Then extracted content should contain decision keywords

**Extract DocStrings from THIS DECISION**

- Given the POC decision document is loaded
- When extracting DocStrings from decision
- Then extracted DocStrings should include 3 languages

**Extract shapes from types.ts**

- Given the source mapper with base directory at project root
- When extracting from "src/lint/process-guard/types.ts" with method "@extract-shapes tag"
- Then shapes should include all expected type definitions

**Extract shapes from decider.ts**

- Given the source mapper with base directory at project root
- When extracting from "src/lint/process-guard/decider.ts" with method "@extract-shapes tag"
- Then shapes should include validateChanges function

**Extract createViolation patterns from decider.ts**

- Given the source mapper with base directory at project root
- When extracting from "src/lint/process-guard/decider.ts" with method "createViolation() patterns"
- Then extracted content should contain violation patterns

**Extract Rule blocks from process-guard.feature**

- Given the source mapper with base directory at project root
- When extracting from "tests/features/validation/process-guard.feature" with method "Rule blocks"
- Then extracted content should contain validation rule names

**Extract Scenario Outline Examples from process-guard-linter.feature**

- Given the source mapper with base directory at project root
- When extracting from "delivery-process/specs/process-guard-linter.feature" with method "Scenario Outline Examples"
- Then extracted content should contain protection level table

**Extract JSDoc from lint-process.ts**

- Given the source mapper with base directory at project root
- When extracting from "src/cli/lint-process.ts" with method "JSDoc section"
- Then extracted content should contain CLI documentation

**Execute all 11 source mappings from POC**

- Given the POC decision document is loaded
- And source mapper options configured with project root
- When executing all source mappings
- Then aggregated content should be successful with sections

**Generate compact output from POC**

- Given the POC pattern is created from decision document
- When generating with detail level "summary"
- Then compact output should be generated with essential sections

**Compact output contains essential sections**

- Given compact output is generated from POC
- Then compact output should contain essential content

**Generate detailed output from POC**

- Given the POC pattern is created from decision document
- When generating with detail level "detailed"
- Then detailed output should be generated successfully

**Detailed output contains full content**

- Given detailed output is generated from POC
- Then detailed output should contain full sections

**Compact output matches target structure**

- Given compact output is generated from POC
- When comparing to existing compact output
- Then compact output structure should be valid

**Validation rules are complete in output**

- Given detailed output is generated from POC
- Then detailed output should contain all validation rules

## Business Rules

**POC decision document is parsed correctly**

_Verified by: Load actual POC decision document, Source mappings include all extraction types_

**Self-references extract content from POC decision**

_Verified by: Extract Context rule from THIS DECISION, Extract Decision rule from THIS DECISION, Extract DocStrings from THIS DECISION_

**TypeScript shapes are extracted from real files**

_Verified by: Extract shapes from types.ts, Extract shapes from decider.ts, Extract createViolation patterns from decider.ts_

**Behavior spec content is extracted correctly**

_Verified by: Extract Rule blocks from process-guard.feature, Extract Scenario Outline Examples from process-guard-linter.feature_

**JSDoc sections are extracted from CLI files**

_Verified by: Extract JSDoc from lint-process.ts_

**All source mappings execute successfully**

_Verified by: Execute all 11 source mappings from POC_

**Compact output generates correctly**

_Verified by: Generate compact output from POC, Compact output contains essential sections_

**Detailed output generates correctly**

_Verified by: Generate detailed output from POC, Detailed output contains full content_

**Generated output matches quality expectations**

_Verified by: Compact output matches target structure, Validation rules are complete in output_

---

[← Back to Pattern Registry](../PATTERNS.md)
