# ✅ Decision Doc Generator Testing

**Purpose:** Detailed requirements for the Decision Doc Generator Testing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Generation |

## Description

The Decision Doc Generator orchestrates the full documentation generation
  pipeline from decision documents (ADR/PDR in .feature format):

  1. Decision parsing - Extract source mappings, rules, DocStrings
  2. Source mapping - Aggregate content from TypeScript, Gherkin, decision sources
  3. Content assembly - Build RenderableDocument from aggregated sections
  4. Multi-level output - Generate compact and detailed versions

## Acceptance Criteria

**Default output paths for pattern**

- Given pattern name "ProcessGuard"
- When determining output paths
- Then compact path should be "_claude-md/generated/process-guard.md"
- And detailed path should contain "PROCESS-GUARD"

**Custom section for compact output**

- Given pattern name "ProcessGuard"
- And section "validation"
- When determining output paths
- Then compact path should be "_claude-md/validation/process-guard.md"

**CamelCase pattern converted to kebab-case**

- Given pattern name "MyComplexPatternName"
- When determining output paths
- Then compact path should contain "my-complex-pattern-name"

**Compact output excludes full descriptions**

- Given a decision document with context and description
- When generating compact output
- Then output should have detail level "summary"
- And output should have purpose containing "Compact"

**Compact output includes type shapes**

- Given a decision document with extracted shapes
- When generating compact output
- Then output sections should reference shapes

**Compact output handles empty content**

- Given a decision document with no content
- When generating compact output
- Then output should contain placeholder text

**Detailed output includes all sections**

- Given a decision document with context and decision rules
- When generating detailed output
- Then output should have detail level "detailed"
- And output sections should include Context and Decision

**Detailed output includes consequences**

- Given a decision document with consequences
- When generating detailed output
- Then output sections should include "Consequences"

**Detailed output includes DocStrings as code blocks**

- Given a decision document with DocStrings
- When generating detailed output
- Then output should contain code blocks

**Generate both compact and detailed outputs**

- Given a complete decision document with source mappings
- When generating multi-level output
- Then 2 output files should be produced
- And files should be in both "_claude-md/" and "docs/"

**Pattern name falls back to pattern.name**

- Given a pattern with only the name field
- When generating multi-level output
- Then generation should succeed using the name field

**Generator is registered with correct name**

- When checking generator registry
- Then "doc-from-decision" should be available
- And generator should have description about decision documents

**Generator filters patterns by source mapping presence**

- Given patterns without source mappings
- When running generator
- Then generator should produce no output files

**Generator processes patterns with source mappings**

- Given patterns with source mapping tables
- When running generator
- Then generator should produce output files

**Source mappings are executed**

- Given a decision document with source mappings
- And source files exist
- When generating from decision
- Then aggregated content should be included

**Missing source files are reported as validation errors**

- Given a decision document referencing missing files
- When generating from decision
- Then validation errors are reported for missing files

## Business Rules

**Output paths are determined from pattern metadata**

The generator computes output paths based on pattern name and optional
    section configuration. Compact output goes to _claude-md/, detailed to docs/.

_Verified by: Default output paths for pattern, Custom section for compact output, CamelCase pattern converted to kebab-case_

**Compact output includes only essential content**

Summary/compact output is limited to ~50 lines and includes only
    essential tables and type definitions for Claude context files.

_Verified by: Compact output excludes full descriptions, Compact output includes type shapes, Compact output handles empty content_

**Detailed output includes full content**

Detailed output is ~300 lines and includes everything: JSDoc, examples,
    full descriptions, and all extracted content.

_Verified by: Detailed output includes all sections, Detailed output includes consequences, Detailed output includes DocStrings as code blocks_

**Multi-level generation produces both outputs**

The generator can produce both compact and detailed outputs in a single
    pass for maximum utility.

_Verified by: Generate both compact and detailed outputs, Pattern name falls back to pattern.name_

**Generator is registered with the registry**

The generator is available in the registry under the name "doc-from-decision"
    and can be invoked through the standard generator interface.

_Verified by: Generator is registered with correct name, Generator filters patterns by source mapping presence, Generator processes patterns with source mappings_

**Source mappings are executed during generation**

Decision documents with source mapping tables trigger content aggregation
    from the referenced files during the generation process.

_Verified by: Source mappings are executed, Missing source files are reported as validation errors_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
