# 🚧 Step Lint Vitest Cucumber

**Purpose:** Detailed requirements for the Step Lint Vitest Cucumber feature

---

## Overview

| Property       | Value                                              |
| -------------- | -------------------------------------------------- |
| Status         | active                                             |
| Product Area   | Validation                                         |
| Business Value | prevent hours lost debugging vitest cucumber traps |
| Phase          | 50                                                 |

## Description

**Problem:**
Hours are lost debugging vitest-cucumber-specific issues that only surface
at test runtime. These are semantic traps at the boundary between .feature
files and .steps.ts files: using {string} function params inside
ScenarioOutline (should use variables object), forgetting to destructure
And (causes StepAbleUnknowStepError), missing Rule() wrappers, and hash
comments inside description pseudo-code-blocks. All are statically
detectable but no existing linter catches them.

**Solution:**
A dedicated lint-steps CLI that statically analyzes .feature and .steps.ts
files for vitest-cucumber compatibility. Three check categories:

- Feature-only: hash-in-description, duplicate-and-step, dollar-in-step-text
- Step-only: regex-step-pattern, unsupported-phrase-type
- Cross-file: scenario-outline-function-params, missing-and-destructuring,
  missing-rule-wrapper

Reuses LintViolation/LintSummary from the existing lint engine for
consistent output formatting. Regex-based scanning (no TypeScript AST
needed). Feature-to-step pairing via loadFeature() path extraction.

## Acceptance Criteria

**Hash inside description pseudo-code-block is flagged**

- Given a feature file with a Rule description containing a """ block with #
- When the step linter checks the file
- Then a hash-in-description error is reported

**Hash in step DocString is not flagged**

- Given a feature file with # inside a Given step DocString
- When the step linter checks the file
- Then no hash-in-description errors are reported

**Section separator comments are not flagged**

- Given a feature file with # section separators between keywords
- When the step linter checks the file
- Then no hash-in-description errors are reported

**Duplicate And step text is flagged**

- Given a feature file with two And steps having identical text in one scenario
- When the step linter checks the file
- Then a duplicate-and-step error is reported

**Same And text in different scenarios is allowed**

- Given a feature file with identical And text in separate scenarios
- When the step linter checks the file
- Then no duplicate-and-step errors are reported

**Dollar in step text produces warning**

- Given a feature file with $ in a When step
- When the step linter checks the file
- Then a dollar-in-step-text warning is reported

**Regex pattern in Given is flagged**

- Given a step file with "Given(/pattern/, ...)"
- When the step linter checks the file
- Then a regex-step-pattern error is reported

**Phrase type in step string is flagged**

- Given a step file with "{phrase}" in a step pattern string
- When the step linter checks the file
- Then an unsupported-phrase-type error is reported

**Function params in ScenarioOutline are flagged**

- Given a feature file with a Scenario Outline
- And a step file using ScenarioOutline with (\_ctx, value: string) callback
- When the step linter checks the paired files
- Then a scenario-outline-function-params error is reported

**Function params in regular Scenario are not flagged**

- Given a feature file with a regular Scenario
- And a step file using Scenario with (\_ctx, value: string) callback
- When the step linter checks the paired files
- Then no scenario-outline-function-params errors are reported

**Missing And destructuring is flagged**

- Given a feature file with And steps
- And a step file that does not destructure And
- When the step linter checks the paired files
- Then a missing-and-destructuring error is reported

**Present And destructuring passes**

- Given a feature file with And steps
- And a step file that destructures And
- When the step linter checks the paired files
- Then no missing-and-destructuring errors are reported

**Missing Rule wrapper is flagged**

- Given a feature file with Rule: blocks
- And a step file that does not destructure Rule
- When the step linter checks the paired files
- Then a missing-rule-wrapper error is reported

**Present Rule wrapper passes**

- Given a feature file with Rule: blocks
- And a step file that destructures Rule from describeFeature
- When the step linter checks the paired files
- Then no missing-rule-wrapper errors are reported

**Simple loadFeature path is paired**

- Given a step file with "loadFeature('tests/features/foo.feature')"
- When the pair resolver processes the file
- Then the feature path is extracted as "tests/features/foo.feature"

**Resolve-based loadFeature path is paired**

- Given a step file with "loadFeature(resolve(\_\_dirname, '../features/foo.feature'))"
- When the pair resolver processes the file
- Then the feature path is extracted as a relative path

## Business Rules

**Hash comments inside description pseudo-code-blocks are detected**

**Invariant:** A # at the start of a line inside a """ block within a
Feature or Rule description terminates the description context, because
the Gherkin parser treats # as a comment even inside descriptions.
The """ delimiters in descriptions are NOT real DocStrings.

    **Rationale:** This is the most confusing Gherkin parser trap. Authors
    embed code examples using """ and expect # comments to be protected.
    The resulting parse error gives no hint about the actual cause.

    **Verified by:** Hash inside description pseudo-code-block is flagged,
    Hash in step DocString is not flagged,
    Section separator comments are not flagged

_Verified by: Hash inside description pseudo-code-block is flagged, Hash in step DocString is not flagged, Section separator comments are not flagged_

**Duplicate And steps in the same scenario are detected**

**Invariant:** Multiple And steps with identical text in the same
scenario cause vitest-cucumber step matching failures. The fix is
to consolidate into a single step with a DataTable.

    **Verified by:** Duplicate And step text is flagged,
    Same And text in different scenarios is allowed

_Verified by: Duplicate And step text is flagged, Same And text in different scenarios is allowed_

**Dollar sign in step text is detected**

**Invariant:** The $ character in step text causes matching issues
in vitest-cucumber's expression parser.

    **Verified by:** Dollar in step text produces warning

_Verified by: Dollar in step text produces warning_

**Regex step patterns are detected**

**Invariant:** vitest-cucumber only supports string patterns with
{string} and {int}. Regex patterns throw StepAbleStepExpressionError.

    **Verified by:** Regex pattern in Given is flagged

_Verified by: Regex pattern in Given is flagged_

**Unsupported phrase type is detected**

**Invariant:** vitest-cucumber does not support {phrase}. Use {string}
with quoted values in the feature file.

    **Verified by:** Phrase type in step string is flagged

_Verified by: Phrase type in step string is flagged_

**ScenarioOutline function params are detected**

**Invariant:** ScenarioOutline step callbacks must use the variables
object, not function params. Using (\_ctx, value: string) means
value will be undefined at runtime.

    **Verified by:** Function params in ScenarioOutline are flagged,
    Function params in regular Scenario are not flagged

_Verified by: Function params in ScenarioOutline are flagged, Function params in regular Scenario are not flagged_

**Missing And destructuring is detected**

**Invariant:** If a feature file has And steps, the step definition
must destructure And from the scenario callback.

    **Verified by:** Missing And destructuring is flagged,
    Present And destructuring passes

_Verified by: Missing And destructuring is flagged, Present And destructuring passes_

**Missing Rule wrapper is detected**

**Invariant:** If a feature file has Rule: blocks, the step definition
must destructure Rule from describeFeature.

    **Verified by:** Missing Rule wrapper is flagged,
    Present Rule wrapper passes

_Verified by: Missing Rule wrapper is flagged, Present Rule wrapper passes_

**Feature-to-step pairing resolves both loadFeature patterns**

**Invariant:** Step files use two loadFeature patterns: simple string
paths and resolve(\_\_dirname, relative) paths. Both must be paired.

    **Verified by:** Simple loadFeature path is paired,
    Resolve-based loadFeature path is paired

_Verified by: Simple loadFeature path is paired, Resolve-based loadFeature path is paired_

## Deliverables

- Step lint types and rule definitions (complete)
- Feature-only checks (3 rules) (complete)
- Step-only checks (2 rules) (complete)
- Cross-file checks (3 rules) (complete)
- Feature-to-step pair resolver (complete)
- Lint runner orchestrator (complete)
- Barrel exports (complete)
- CLI entry point (complete)
- Gherkin executable specs (complete)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
