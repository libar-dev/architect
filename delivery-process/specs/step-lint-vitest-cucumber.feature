@libar-docs
@libar-docs-pattern:StepLintVitestCucumber
@libar-docs-status:completed
@libar-docs-phase:50
@libar-docs-effort:1d
@libar-docs-product-area:Validation
@libar-docs-business-value:prevent-hours-lost-debugging-vitest-cucumber-traps
@libar-docs-priority:high
Feature: Step Lint - vitest-cucumber Static Compatibility Checker

  **Problem:**
  Hours are lost debugging vitest-cucumber-specific issues that only surface
  at test runtime. These are semantic traps at the boundary between .feature
  files and .steps.ts files: using {string} function params inside
  ScenarioOutline (should use variables object), forgetting to destructure
  the And keyword (causes StepAbleUnknowStepError), missing Rule() wrappers, and hash
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

  # ===========================================================================
  # DELIVERABLES
  # ===========================================================================

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Step lint types and rule definitions | complete | No | src/lint/steps/types.ts |
      | Feature-only checks (3 rules) | complete | Yes | src/lint/steps/feature-checks.ts |
      | Step-only checks (2 rules) | complete | Yes | src/lint/steps/step-checks.ts |
      | Cross-file checks (3 rules) | complete | Yes | src/lint/steps/cross-checks.ts |
      | Feature-to-step pair resolver | complete | Yes | src/lint/steps/pair-resolver.ts |
      | Lint runner orchestrator | complete | Yes | src/lint/steps/runner.ts |
      | Barrel exports | complete | No | src/lint/steps/index.ts |
      | CLI entry point | complete | No | src/cli/lint-steps.ts |
      | Gherkin executable specs | complete | Yes | tests/features/lint/step-lint.feature |

  # ===========================================================================
  # FEATURE-ONLY CHECKS
  # ===========================================================================

  Rule: Hash comments inside description pseudo-code-blocks are detected

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

    @acceptance-criteria @happy-path
    Scenario: Hash inside description pseudo-code-block is flagged
      Given a feature file with a Rule description containing a """ block with a hash character
      When the step linter checks the file
      Then a hash-in-description error is reported

    @acceptance-criteria @validation
    Scenario: Hash in step DocString is not flagged
      Given a feature file with a hash character inside a Given step DocString
      When the step linter checks the file
      Then no hash-in-description errors are reported

    @acceptance-criteria @edge-case
    Scenario: Section separator comments are not flagged
      Given a feature file with hash section separators between keywords
      When the step linter checks the file
      Then no hash-in-description errors are reported

  Rule: Duplicate And steps in the same scenario are detected

    **Invariant:** Multiple And steps with identical text in the same
    scenario cause vitest-cucumber step matching failures. The fix is
    to consolidate into a single step with a DataTable.

    **Rationale:** Duplicate step text silently overwrites step registrations, causing the second And to match the first handler and produce wrong or undefined behavior at runtime.

    **Verified by:** Duplicate And step text is flagged,
    Same And text in different scenarios is allowed

    @acceptance-criteria @happy-path
    Scenario: Duplicate And step text is flagged
      Given a feature file with two And steps having identical text in one scenario
      When the step linter checks the file
      Then a duplicate-and-step error is reported

    @acceptance-criteria @edge-case
    Scenario: Same And text in different scenarios is allowed
      Given a feature file with identical And text in separate scenarios
      When the step linter checks the file
      Then no duplicate-and-step errors are reported

  Rule: Dollar sign in step text is detected

    **Invariant:** The $ character in step text causes matching issues
    in vitest-cucumber's expression parser.

    **Rationale:** The dollar sign is interpreted as a special character in expression parsing, causing steps to silently fail to match and producing confusing StepAbleUnknowStepError messages.

    **Verified by:** Dollar in step text produces warning

    @acceptance-criteria @happy-path
    Scenario: Dollar in step text produces warning
      Given a feature file with a dollar sign in a When step
      When the step linter checks the file
      Then a dollar-in-step-text warning is reported

  # ===========================================================================
  # STEP-ONLY CHECKS
  # ===========================================================================

  Rule: Regex step patterns are detected

    **Invariant:** vitest-cucumber only supports string patterns with
    {string} and {int}. Regex patterns throw StepAbleStepExpressionError.

    **Rationale:** Regex patterns are a common Cucumber.js habit that compiles without error but throws at runtime in vitest-cucumber, wasting debugging time.

    **Verified by:** Regex pattern in Given is flagged

    @acceptance-criteria @happy-path
    Scenario: Regex pattern in Given is flagged
      Given a step file with "Given(/pattern/, ...)"
      When the step linter checks the file
      Then a regex-step-pattern error is reported

  Rule: Unsupported phrase type is detected

    **Invariant:** vitest-cucumber does not support {phrase}. Use {string}
    with quoted values in the feature file.

    **Rationale:** The {phrase} type is valid in standard Cucumber but unsupported in vitest-cucumber, causing silent parameter capture failures that are difficult to trace.

    **Verified by:** Phrase type in step string is flagged

    @acceptance-criteria @happy-path
    Scenario: Phrase type in step string is flagged
      Given a step file with "{phrase}" in a step pattern string
      When the step linter checks the file
      Then an unsupported-phrase-type error is reported

  # ===========================================================================
  # CROSS-FILE CHECKS
  # ===========================================================================

  Rule: ScenarioOutline function params are detected

    **Invariant:** ScenarioOutline step callbacks must use the variables
    object, not function params. Using (_ctx, value: string) means
    value will be undefined at runtime.

    **Rationale:** This is the most common vitest-cucumber trap. Function params compile and even type-check, but the values are always undefined at runtime because ScenarioOutline injects data through the variables object, not positional arguments.

    **Verified by:** Function params in ScenarioOutline are flagged,
    Function params in regular Scenario are not flagged

    @acceptance-criteria @happy-path
    Scenario: Function params in ScenarioOutline are flagged
      Given a feature file with a Scenario Outline
      And a step file using ScenarioOutline with (_ctx, value: string) callback
      When the step linter checks the paired files
      Then a scenario-outline-function-params error is reported

    @acceptance-criteria @validation
    Scenario: Function params in regular Scenario are not flagged
      Given a feature file with a regular Scenario
      And a step file using Scenario with (_ctx, value: string) callback
      When the step linter checks the paired files
      Then no scenario-outline-function-params errors are reported

  Rule: Missing And destructuring is detected

    **Invariant:** If a feature file has And steps, the step definition
    must destructure And from the scenario callback.

    **Rationale:** Without destructuring And, vitest-cucumber cannot bind And steps and throws StepAbleUnknowStepError at runtime with no indication that a missing destructure is the cause.

    **Verified by:** Missing And destructuring is flagged,
    Present And destructuring passes

    @acceptance-criteria @happy-path
    Scenario: Missing And destructuring is flagged
      Given a feature file with And steps
      And a step file that does not destructure And
      When the step linter checks the paired files
      Then a missing-and-destructuring error is reported

    @acceptance-criteria @validation
    Scenario: Present And destructuring passes
      Given a feature file with And steps
      And a step file that destructures And
      When the step linter checks the paired files
      Then no missing-and-destructuring errors are reported

  Rule: Missing Rule wrapper is detected

    **Invariant:** If a feature file has Rule: blocks, the step definition
    must destructure Rule from describeFeature.

    **Rationale:** Without the Rule() wrapper, scenarios inside Rule: blocks are invisible to vitest-cucumber and silently never execute, giving a false green test suite.

    **Verified by:** Missing Rule wrapper is flagged,
    Present Rule wrapper passes

    @acceptance-criteria @happy-path
    Scenario: Missing Rule wrapper is flagged
      Given a feature file with Rule: blocks
      And a step file that does not destructure Rule
      When the step linter checks the paired files
      Then a missing-rule-wrapper error is reported

    @acceptance-criteria @validation
    Scenario: Present Rule wrapper passes
      Given a feature file with Rule: blocks
      And a step file that destructures Rule from describeFeature
      When the step linter checks the paired files
      Then no missing-rule-wrapper errors are reported

  # ===========================================================================
  # PAIR RESOLVER
  # ===========================================================================

  Rule: Feature-to-step pairing resolves both loadFeature patterns

    **Invariant:** Step files use two loadFeature patterns: simple string
    paths and resolve(__dirname, relative) paths. Both must be paired.

    **Rationale:** Unpaired feature files cannot be cross-checked for compatibility issues, leaving ScenarioOutline param misuse and missing destructures undetected.

    **Verified by:** Simple loadFeature path is paired,
    Resolve-based loadFeature path is paired

    @acceptance-criteria @happy-path
    Scenario: Simple loadFeature path is paired
      Given a step file with "loadFeature('tests/features/foo.feature')"
      When the pair resolver processes the file
      Then the feature path is extracted as "tests/features/foo.feature"

    @acceptance-criteria @happy-path
    Scenario: Resolve-based loadFeature path is paired
      Given a step file with "loadFeature(resolve(__dirname, '../features/foo.feature'))"
      When the pair resolver processes the file
      Then the feature path is extracted as a relative path
