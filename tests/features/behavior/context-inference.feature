@architect
@architect-pattern:ContextInference
@architect-status:completed
@architect-product-area:Annotation
@behavior @context-inference
Feature: Context Auto-Inference from File Paths

  **Problem:**
  Patterns in standard directories (src/validation/, src/scanner/) should
  automatically receive architecture context without explicit annotation.

  **Solution:**
  Implement configurable inference rules that map file path patterns to
  bounded contexts using wildcard matching.

  Background:
    Given a context inference test context

  # ═══════════════════════════════════════════════════════════════════════════
  # Pattern Matching - Recursive Wildcard
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: matchPattern supports recursive wildcard **

    **Invariant:** The `**` wildcard matches files at any nesting depth below the specified directory prefix.
    **Rationale:** Directory hierarchies vary in depth; recursive matching ensures all nested files inherit context.
    **Verified by:** Recursive wildcard matches nested paths

    @happy-path @pattern-matching
    Scenario Outline: Recursive wildcard matches nested paths
      Given a pattern rule "<pattern>" for context "test-context"
      And a pattern at file path "<filePath>" with archLayer "application"
      When transforming to master dataset with rules
      Then the pattern archContext should be "<expectedContext>"

      Examples:
        | pattern           | filePath                          | expectedContext |
        | src/validation/** | src/validation/rules.ts           | test-context    |
        | src/validation/** | src/validation/deep/nested.ts     | test-context    |
        | src/validation/** | src/validation2/file.ts           | none            |
        | src/validation/** | src/other/file.ts                 | none            |
        | src/validation/** | other/validation/rules.ts         | none            |

  # ═══════════════════════════════════════════════════════════════════════════
  # Pattern Matching - Single-Level Wildcard
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: matchPattern supports single-level wildcard /*

    **Invariant:** The `/*` wildcard matches only direct children of the specified directory, not deeper nested files.
    **Rationale:** Some contexts apply only to a specific directory level, not its entire subtree.
    **Verified by:** Single-level wildcard matches direct children only

    @happy-path @pattern-matching
    Scenario Outline: Single-level wildcard matches direct children only
      Given a pattern rule "<pattern>" for context "test-context"
      And a pattern at file path "<filePath>" with archLayer "application"
      When transforming to master dataset with rules
      Then the pattern archContext should be "<expectedContext>"

      Examples:
        | pattern          | filePath                      | expectedContext |
        | src/validation/* | src/validation/rules.ts       | test-context    |
        | src/validation/* | src/validation/deep/nested.ts | none            |
        | src/validation/* | src/validation2/file.ts       | none            |

  # ═══════════════════════════════════════════════════════════════════════════
  # Pattern Matching - Prefix Matching
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: matchPattern supports prefix matching

    **Invariant:** A trailing slash pattern matches any file whose path starts with that directory prefix.
    **Rationale:** Without prefix matching, users would need separate wildcard patterns for each nesting depth, making rule configuration verbose and error-prone.
    **Verified by:** Prefix matching behavior

    @edge-case @pattern-matching
    Scenario Outline: Prefix matching behavior
      Given a pattern rule "<pattern>" for context "test-context"
      And a pattern at file path "<filePath>" with archLayer "application"
      When transforming to master dataset with rules
      Then the pattern archContext should be "<expectedContext>"

      Examples:
        | pattern         | filePath                  | expectedContext |
        | src/validation/ | src/validation/rules.ts   | test-context    |
        | src/validation/ | src/other/file.ts         | none            |

  # ═══════════════════════════════════════════════════════════════════════════
  # Context Inference - No Match Cases
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: inferContext returns undefined when no rules match

    **Invariant:** When no inference rule matches a file path, the pattern receives no inferred context and is excluded from the byContext index.
    **Rationale:** Unmatched files must not receive a spurious context assignment; absence of context is a valid state.
    **Verified by:** Empty rules array returns undefined, File path does not match any rule

    @edge-case @inference
    Scenario: Empty rules array returns undefined
      Given no context inference rules
      And a pattern at file path "src/unknown/file.ts" with archLayer "application"
      When transforming to master dataset with rules
      Then the pattern has no inferred archContext
      And the pattern is not in archIndex byContext

    @edge-case @inference
    Scenario: File path does not match any rule
      Given default context inference rules
      And a pattern at file path "unknown/path/file.ts" with archLayer "application"
      When transforming to master dataset with rules
      Then the pattern has no inferred archContext
      And the pattern is not in archIndex byContext

  # ═══════════════════════════════════════════════════════════════════════════
  # Context Inference - Matching Cases
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: inferContext applies first matching rule

    **Invariant:** When multiple rules could match a file path, only the first matching rule determines the inferred context.
    **Rationale:** Deterministic ordering prevents ambiguous context assignment when rules overlap.
    **Verified by:** Single matching rule infers context, First matching rule wins when multiple could match

    @happy-path @inference
    Scenario: Single matching rule infers context
      Given default context inference rules
      And a pattern at file path "src/validation/rules.ts" with archLayer "application"
      When transforming to master dataset with rules
      Then the pattern archContext should be "validation"
      And the pattern appears in archIndex byContext under "validation"

    @edge-case @inference
    Scenario: First matching rule wins when multiple could match
      Given context inference rules:
        | pattern           | context    |
        | src/validation/** | validation |
        | src/**            | general    |
      And a pattern at file path "src/validation/rules.ts" with archLayer "application"
      When transforming to master dataset with rules
      Then the pattern archContext should be "validation"

  # ═══════════════════════════════════════════════════════════════════════════
  # Explicit Context Precedence
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: Explicit archContext is not overridden

    **Invariant:** A pattern with an explicitly annotated archContext retains that value regardless of matching inference rules.
    **Rationale:** Explicit annotations represent intentional developer decisions that must not be silently overwritten by automation.
    **Verified by:** Explicit context takes precedence over inference

    @happy-path @inference
    Scenario: Explicit context takes precedence over inference
      Given default context inference rules
      And a pattern at file path "src/validation/rules.ts" with archLayer "application" and archContext "custom"
      When transforming to master dataset with rules
      Then the pattern archContext should be "custom"
      And the pattern appears in archIndex byContext under "custom"

  # ═══════════════════════════════════════════════════════════════════════════
  # Inference Works Without archLayer
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: Inference works independently of archLayer

    **Invariant:** Context inference operates on file path alone; the presence or absence of archLayer does not affect context assignment.
    **Rationale:** Coupling context inference to archLayer would prevent context-based queries from finding patterns that lack explicit layer annotations.
    **Verified by:** Pattern without archLayer is still added to byContext if context is inferred

    @edge-case @inference
    Scenario: Pattern without archLayer is still added to byContext if context is inferred
      Given default context inference rules
      And a pattern at file path "src/validation/rules.ts" without archLayer
      When transforming to master dataset with rules
      Then the pattern is in archIndex all
      And the pattern appears in archIndex byContext under "validation"

  # ═══════════════════════════════════════════════════════════════════════════
  # Default Rules Integration
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: Default rules map standard directories

    **Invariant:** Each standard source directory (validation, scanner, extractor, etc.) maps to a well-known bounded context name via the default rule set.
    **Rationale:** Convention-based mapping eliminates the need for explicit context annotations on every file in standard directories.
    **Verified by:** Default directory mappings

    @integration @default-rules
    Scenario Outline: Default directory mappings
      Given default context inference rules
      And a pattern at file path "<filePath>" with archLayer "application"
      When transforming to master dataset with rules
      Then the pattern archContext should be "<expectedContext>"

      Examples:
        | filePath                      | expectedContext |
        | src/validation/types.ts       | validation      |
        | src/scanner/index.ts          | scanner         |
        | src/extractor/gherkin.ts      | extractor       |
        | src/generators/pipeline.ts    | generator       |
        | src/renderable/schema.ts      | renderer        |
        | src/taxonomy/registry.ts      | taxonomy        |
        | src/config/loader.ts          | config          |
        | src/lint/rules.ts             | lint            |
        | src/api/state.ts              | api             |
        | src/cli/generate-docs.ts      | cli             |
        | src/types/branded.ts          | types           |
