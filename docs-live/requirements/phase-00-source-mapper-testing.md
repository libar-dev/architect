# ✅ Source Mapper Testing

**Purpose:** Detailed requirements for the Source Mapper Testing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Generation |

## Description

The Source Mapper aggregates content from multiple source files based on
  source mapping tables parsed from decision documents. It dispatches extraction
  to appropriate handlers based on extraction method and preserves ordering.

## Acceptance Criteria

**Dispatch to decision extraction for THIS DECISION**

- Given a source mapping with:
- And a decision document with rules
- When executing source mapping
- Then extraction should use decision extractor
- And extracted section should have name "Intro"

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Intro | THIS DECISION | Decision rule description |

**Dispatch to TypeScript extractor for .ts files**

- Given a source mapping with:
- And the TypeScript file exists with shapes
- When executing source mapping
- Then extraction should use TypeScript extractor
- And extracted section should have name "API Types"

| Section | Source File | Extraction Method |
| --- | --- | --- |
| API Types | src/test-types.ts | @extract-shapes tag |

**Dispatch to behavior spec extractor for .feature files**

- Given a source mapping with:
- And the feature file exists with rules
- When executing source mapping
- Then extraction should use behavior spec extractor
- And extracted section should have name "Validation Rules"

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Validation Rules | tests/features/test.feature | Rule blocks |

**Extract from THIS DECISION using rule description**

- Given a decision with context rule "Context - Why we need this"
- And a source mapping referencing "THIS DECISION (Rule: Context)"
- When executing source mapping
- Then content should contain the context rule description

**Extract DocStrings from THIS DECISION**

- Given a decision with DocStrings containing code examples
- And a source mapping referencing "THIS DECISION (DocString)"
- When executing source mapping
- Then content should contain code blocks

**Extract full document from THIS DECISION**

- Given a decision with description and rules
- And a source mapping referencing "THIS DECISION"
- When executing source mapping
- Then content should be extracted

**Aggregate from multiple sources**

- Given source mappings:
- And all source files exist
- When executing source mapping
- Then 3 sections should be extracted
- And sections should be in mapping order

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Intro | THIS DECISION | Decision rule description |
| API Types | src/test-types.ts | @extract-shapes tag |
| Rules | tests/features/test.feature | Rule blocks |

**Ordering is preserved from mapping table**

- Given source mappings:
- And all source files exist
- When executing source mapping
- Then sections should be in order:

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Third | THIS DECISION | Decision rule description |
| First | src/test-types.ts | @extract-shapes tag |
| Second | tests/features/test.feature | Rule blocks |

| Index | Name |
| --- | --- |
| 1 | Third |
| 2 | First |
| 3 | Second |

**Missing source file produces warning**

- Given a source mapping referencing "nonexistent.ts"
- When executing source mapping
- Then a warning should be produced for "nonexistent.ts"
- And extraction should continue

**Partial extraction when some files missing**

- Given source mappings:
- When executing source mapping
- Then 1 section should be extracted
- And 1 warning should be produced

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Present | THIS DECISION | Decision rule description |
| Missing | nonexistent.ts | @extract-shapes tag |

**Validation checks all files before extraction**

- Given source mappings with multiple missing files
- When validating source mappings
- Then all missing files should produce warnings
- And validation should complete without error

**Empty shapes extraction produces info warning**

- Given a source mapping for a TypeScript file without shapes
- When executing source mapping
- Then an info warning should be produced
- And section should still be included with empty content

**No matching rules produces info warning**

- Given a source mapping for a feature file without rules
- When executing source mapping
- Then an info warning should be produced

**Normalize various extraction method formats**

- Given extraction methods:
- When normalizing each method
- Then all methods should normalize correctly

| Input | Expected |
| --- | --- |
| Decision rule description | DECISION_RULE_DESCRIPTION |
| @extract-shapes tag | EXTRACT_SHAPES |
| Rule blocks | RULE_BLOCKS |
| Scenario Outline Examples | SCENARIO_OUTLINE_EXAMPLES |
| JSDoc section | JSDOC_SECTION |
| Fenced code block | FENCED_CODE_BLOCK |

**Unknown extraction method produces warning**

- Given a source mapping with unknown extraction method
- When validating source mappings
- Then an info warning should be produced for unknown method

## Business Rules

**Extraction methods dispatch to correct handlers**

The source mapper dispatches to different extraction functions based on
    the extraction method specified in the source mapping table.

_Verified by: Dispatch to decision extraction for THIS DECISION, Dispatch to TypeScript extractor for .ts files, Dispatch to behavior spec extractor for .feature files_

**Self-references extract from current decision document**

THIS DECISION markers extract content from the current decision document
    rather than requiring a separate file path.

_Verified by: Extract from THIS DECISION using rule description, Extract DocStrings from THIS DECISION, Extract full document from THIS DECISION_

**Multiple sources are aggregated in mapping order**

Multiple source mappings result in content extraction from each file.
    The aggregated content preserves the order from the mapping table.

_Verified by: Aggregate from multiple sources, Ordering is preserved from mapping table_

**Missing files produce warnings without failing**

A referenced source file that does not exist produces a warning,
    but generation continues with available sources.

_Verified by: Missing source file produces warning, Partial extraction when some files missing, Validation checks all files before extraction_

**Empty extraction results produce info warnings**

Extraction that succeeds but produces no content (e.g., no shapes found)
    results in an informational warning being logged.

_Verified by: Empty shapes extraction produces info warning, No matching rules produces info warning_

**Extraction methods are normalized for dispatch**

The extraction method column can be written in various formats
    and is normalized before dispatch.

_Verified by: Normalize various extraction method formats, Unknown extraction method produces warning_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
