# ✅ Poc Integration

**Purpose:** Detailed requirements for the Poc Integration feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

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

**Invariant:** The real POC decision document (Process Guard) must be parseable by the codec, extracting all source mappings with their extraction types.
**Rationale:** Integration testing against the actual POC document validates that the codec works with real-world content, not just synthetic test data.
**Verified by:** Load actual POC decision document, Source mappings include all extraction types

_Verified by: Load actual POC decision document, Source mappings include all extraction types_

**Self-references extract content from POC decision**

**Invariant:** THIS DECISION self-references in the POC document must successfully extract Context rules, Decision rules, and DocStrings from the document itself.
**Rationale:** Self-references are the most common extraction type in decision docs — they must work correctly for the POC to demonstrate the end-to-end pipeline.
**Verified by:** Extract Context rule from THIS DECISION, Extract Decision rule from THIS DECISION, Extract DocStrings from THIS DECISION

_Verified by: Extract Context rule from THIS DECISION, Extract Decision rule from THIS DECISION, Extract DocStrings from THIS DECISION_

**TypeScript shapes are extracted from real files**

**Invariant:** The source mapper must successfully extract type shapes and patterns from real TypeScript source files referenced in the POC document.
**Rationale:** TypeScript extraction is the primary mechanism for pulling implementation details into decision docs — it must work with actual project files.
**Verified by:** Extract shapes from types.ts, Extract shapes from decider.ts, Extract createViolation patterns from decider.ts

_Verified by: Extract shapes from types.ts, Extract shapes from decider.ts, Extract createViolation patterns from decider.ts_

**Behavior spec content is extracted correctly**

**Invariant:** The source mapper must successfully extract Rule blocks and ScenarioOutline Examples from real Gherkin feature files referenced in the POC document.
**Rationale:** Behavior spec extraction bridges decision documents to executable specifications — incorrect extraction would misrepresent the verified behavior.
**Verified by:** Extract Rule blocks from process-guard.feature, Extract Scenario Outline Examples from process-guard-linter.feature

_Verified by: Extract Rule blocks from process-guard.feature, Extract Scenario Outline Examples from process-guard-linter.feature_

**JSDoc sections are extracted from CLI files**

**Invariant:** The source mapper must successfully extract JSDoc comment sections from real TypeScript CLI files referenced in the POC document.
**Rationale:** CLI documentation often lives in JSDoc comments — extracting them into decision docs avoids duplicating CLI usage information manually.
**Verified by:** Extract JSDoc from lint-process.ts

_Verified by: Extract JSDoc from lint-process.ts_

**All source mappings execute successfully**

**Invariant:** All source mappings defined in the POC decision document must execute without errors, producing non-empty extraction results.
**Rationale:** End-to-end execution validates that all extraction types work with real files — a single failing mapping would produce incomplete decision documentation.
**Verified by:** Execute all 11 source mappings from POC

_Verified by: Execute all 11 source mappings from POC_

**Compact output generates correctly**

**Invariant:** The compact output for the POC document must generate successfully and contain all essential sections defined by the compact format.
**Rationale:** Compact output is the AI-facing artifact — verifying it against the real POC ensures the format serves its purpose of providing concise decision context.
**Verified by:** Generate compact output from POC, Compact output contains essential sections

_Verified by: Generate compact output from POC, Compact output contains essential sections_

**Detailed output generates correctly**

**Invariant:** The detailed output for the POC document must generate successfully and contain all sections including full content from source mappings.
**Rationale:** Detailed output is the human-facing artifact — verifying it against the real POC ensures no content is lost in the generation pipeline.
**Verified by:** Generate detailed output from POC, Detailed output contains full content

_Verified by: Generate detailed output from POC, Detailed output contains full content_

**Generated output matches quality expectations**

**Invariant:** The generated output structure must match the expected target format, with complete validation rules and properly structured sections.
**Rationale:** Quality assertions catch regressions in output formatting — structural drift in generated documents would degrade their usefulness as references.
**Verified by:** Compact output matches target structure, Validation rules are complete in output

_Verified by: Compact output matches target structure, Validation rules are complete in output_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
