# ✅ Gherkin Rules Support

**Purpose:** Detailed requirements for the Gherkin Rules Support feature

---

## Overview

| Property       | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Status         | completed                                              |
| Product Area   | Annotation                                             |
| Business Value | enable human readable documentation from feature files |
| Phase          | 100                                                    |

## Description

**Problem:**
Feature files were limited to flat scenario lists. Business rules, rationale,
and rich descriptions could not be captured in a way that:

- Tests ignore (vitest-cucumber skips descriptions)
- Generators render (PRD shows business context)
- Maintains single source of truth (one file, two purposes)

The Gherkin `Rule:` keyword was parsed by @cucumber/gherkin but our pipeline
dropped the data at scanner/extractor stages.

**Solution:**
Extended the documentation pipeline to capture and render:

- `Rule:` keyword as Business Rules sections
- Rule descriptions (rationale, exceptions, context)
- DataTables in steps as Markdown tables
- DocStrings in steps as code blocks

Infrastructure changes (schema, scanner, extractor) are shared by all generators.
Rendering was added to PRD generator as reference implementation.

Confirmed vitest-cucumber supports Rules via `Rule()` + `RuleScenario()` syntax.
No migration to alternative frameworks needed.

## Acceptance Criteria

**Rules are captured by AST parser**

- Given a feature file with Rule: keyword
- When parsed by gherkin-ast-parser
- Then the ParsedFeatureFile contains rules array
- And each rule has name, description, tags, scenarios, line

**Rules pass through scanner**

- Given a parsed feature file with rules
- When processed by gherkin-scanner
- Then the ScannedGherkinFile includes rules
- And scenarios inside rules are also in flat scenarios array

**Rules are mapped to ExtractedPattern**

- Given a scanned feature file with rules
- When processed by gherkin-extractor
- Then the ExtractedPattern contains rules field
- And each rule has name, description, scenarioCount, scenarioNames

**PRD generator renders Business Rules section**

- Given an ExtractedPattern with rules
- When rendered by prd-features section
- Then output contains "Business Rules" heading
- And each rule name appears as bold text
- And rule descriptions appear as paragraphs
- And verification scenarios are listed

**DataTables render as Markdown tables**

- Given a scenario step with DataTable
- When rendered in acceptance criteria
- Then output contains Markdown table with headers and rows

**DocStrings render as code blocks**

- Given a scenario step with DocString
- When rendered in acceptance criteria
- Then output contains fenced code block with content

**Rule scenarios execute with vitest-cucumber**

- Given a feature file with scenarios inside Rule blocks
- When step definitions use Rule() and RuleScenario() syntax
- Then all scenarios execute and pass

## Business Rules

**Rules flow through the entire pipeline without data loss**

The @cucumber/gherkin parser extracts Rules natively. Our pipeline must
preserve this data through scanner, extractor, and into ExtractedPattern
so generators can access rule names, descriptions, and nested scenarios.

_Verified by: Rules are captured by AST parser, Rules pass through scanner, Rules are mapped to ExtractedPattern_

**Generators can render rules as business documentation**

Business stakeholders see rule names and descriptions as "Business Rules"
sections, not Given/When/Then syntax. This enables human-readable PRDs
from the same files used for test execution.

_Verified by: PRD generator renders Business Rules section_

**Custom content blocks render in acceptance criteria**

DataTables and DocStrings in steps should appear in generated documentation,
providing structured data and code examples alongside step descriptions.

_Verified by: DataTables render as Markdown tables, DocStrings render as code blocks_

**vitest-cucumber executes scenarios inside Rules**

Test execution must work for scenarios inside Rule blocks.
Use Rule() function with RuleScenario() instead of Scenario().

_Verified by: Rule scenarios execute with vitest-cucumber_

## Deliverables

- GherkinRuleSchema (complete)
- Rule parsing in AST parser (complete)
- Rules passthrough in scanner (complete)
- Rules field in ExtractedPattern (complete)
- Rules mapping in extractor (complete)
- Business Rules rendering (complete)
- DataTable rendering in acceptance criteria (complete)
- DocString rendering in acceptance criteria (complete)

## Implementations

Files that implement this pattern:

- [`gherkin-extractor.ts`](../../src/extractor/gherkin-extractor.ts) - ## GherkinExtractor - Convert Feature Files to Pattern Documentation
- [`gherkin-ast-parser.ts`](../../src/scanner/gherkin-ast-parser.ts) - ## GherkinASTParser - Parse Feature Files Using Cucumber Gherkin
- [`gherkin-scanner.ts`](../../src/scanner/gherkin-scanner.ts) - ## GherkinScanner - Multi-Source Pattern Extraction from Feature Files

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
