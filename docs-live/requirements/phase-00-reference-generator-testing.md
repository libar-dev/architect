# ✅ Reference Generator Testing

**Purpose:** Detailed requirements for the Reference Generator Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

Registers all 13 reference document generators. Each config produces
TWO individual generators (detailed + summary) plus one meta-generator
("reference-docs") that produces all 26 files at once, yielding 27 total.
Generators implement DocumentGenerator directly, not via CodecBasedGenerator.

## Acceptance Criteria

**All 27 generators are registered from 13 configs plus meta-generator**

- When registering reference generators
- Then 27 generators are registered

**Detailed generator has name ending in "-reference"**

- When registering reference generators
- Then a generator named "process-guard-reference" exists
- And a generator named "session-guides-reference" exists

**Summary generator has name ending in "-reference-claude"**

- When registering reference generators
- Then a generator named "process-guard-reference-claude" exists
- And a generator named "architecture-reference-claude" exists

**Generator with matching data produces non-empty output**

- Given a MasterDataset with a convention-tagged pattern for "testing-policy"
- When running the "gherkin-patterns-reference" generator
- Then the output has 1 file
- And the output file path starts with "docs/"
- And the output file content is non-empty

**Generator with no matching data produces minimal output**

- Given an empty MasterDataset
- When running the "process-guard-reference" generator
- Then the output has 1 file
- And the output file content contains "No content found"

## Business Rules

**Registration produces the correct number of generators**

_Verified by: All 27 generators are registered from 13 configs plus meta-generator_

**Generator naming follows kebab-case convention**

_Verified by: Detailed generator has name ending in "-reference", Summary generator has name ending in "-reference-claude"_

**Generator execution produces markdown output**

_Verified by: Generator with matching data produces non-empty output, Generator with no matching data produces minimal output_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
