# ✅ Process Api Cli Subcommands

**Purpose:** Detailed requirements for the Process Api Cli Subcommands feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | DataAPI   |

## Description

Discovery subcommands: list, search, context assembly, tags/sources, extended arch, unannotated.

## Acceptance Criteria

**List all patterns returns JSON array**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/\*_/_.ts' list"
- Then exit code is 0
- And stdout is valid JSON with key "success"

**List with invalid phase shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/\*_/_.ts' list --phase abc"
- Then exit code is 1
- And output contains "Invalid --phase"

**Search returns matching patterns**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/\*_/_.ts' search Completed"
- Then exit code is 0
- And stdout is valid JSON
- And stdout contains "CompletedPattern"

**Search without query shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/\*_/_.ts' search"
- Then exit code is 1
- And output contains "Usage:"

**Context returns curated text bundle**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/\*_/_.ts' context CompletedPattern"
- Then exit code is 0
- And stdout is non-empty
- And stdout contains "CompletedPattern"

**Context without pattern name shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/\*_/_.ts' context"
- Then exit code is 1
- And output contains "Usage:"

**Overview returns executive summary text**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/\*_/_.ts' overview"
- Then exit code is 0
- And stdout is non-empty
- And stdout contains "PROGRESS"

**Dep-tree returns dependency tree text**

- Given TypeScript files with architecture annotations and dependencies
- When running "process-api -i 'src/\*_/_.ts' dep-tree ScannerService"
- Then exit code is 0
- And stdout is non-empty

**Tags returns tag usage counts**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/\*_/_.ts' tags"
- Then exit code is 0
- And stdout is valid JSON with key "data"

**Sources returns file inventory**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/\*_/_.ts' sources"
- Then exit code is 0
- And stdout is valid JSON

**Arch neighborhood returns pattern relationships**

- Given TypeScript files with architecture annotations and dependencies
- When running "process-api -i 'src/\*_/_.ts' arch neighborhood ScannerService"
- Then exit code is 0
- And stdout is valid JSON
- And stdout contains "ScannerService"

**Arch compare returns context comparison**

- Given TypeScript files with two architecture contexts
- When running "process-api -i 'src/\*_/_.ts' arch compare scanner codec"
- Then exit code is 0
- And stdout is valid JSON

**Arch coverage returns annotation coverage**

- Given TypeScript files with architecture annotations
- When running "process-api -i 'src/\*_/_.ts' arch coverage"
- Then exit code is 0
- And stdout is valid JSON

**Unannotated finds files missing libar-docs marker**

- Given TypeScript files with mixed annotations
- When running "process-api -i 'src/\*_/_.ts' unannotated"
- Then exit code is 0
- And stdout is valid JSON

## Business Rules

**CLI list subcommand filters patterns**

_Verified by: List all patterns returns JSON array, List with invalid phase shows error_

**CLI search subcommand finds patterns by fuzzy match**

_Verified by: Search returns matching patterns, Search without query shows error_

**CLI context assembly subcommands return text output**

_Verified by: Context returns curated text bundle, Context without pattern name shows error, Overview returns executive summary text, Dep-tree returns dependency tree text_

**CLI tags and sources subcommands return JSON**

_Verified by: Tags returns tag usage counts, Sources returns file inventory_

**CLI extended arch subcommands query architecture relationships**

_Verified by: Arch neighborhood returns pattern relationships, Arch compare returns context comparison, Arch coverage returns annotation coverage_

**CLI unannotated subcommand finds files without annotations**

_Verified by: Unannotated finds files missing libar-docs marker_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
