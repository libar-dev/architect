@libar-docs
@behavior @shape-matcher
@libar-docs-pattern:ShapeMatcherTesting
@libar-docs-status:completed
@libar-docs-implements:ReferenceDocShowcase,DeclarationLevelShapeTagging
@libar-docs-product-area:Generation
Feature: Shape Source Pattern Matching

  Matches file paths against glob patterns for TypeScript shape extraction.
  Uses in-memory string matching (no filesystem access) per AD-6.

  Background:
    Given a shape matcher test context

  Rule: Exact paths match without wildcards

    @happy-path
    Scenario: Exact path matches identical path
      When matching path "src/generators/types.ts" against pattern "src/generators/types.ts"
      Then the match result is true

    @happy-path
    Scenario: Exact path does not match different path
      When matching path "src/generators/types.ts" against pattern "src/generators/other.ts"
      Then the match result is false

  Rule: Single-level globs match one directory level

    @happy-path
    Scenario: Single glob matches file in target directory
      When matching path "src/lint/rules.ts" against pattern "src/lint/*.ts"
      Then the match result is true

    @edge-case
    Scenario: Single glob does not match nested subdirectory
      When matching path "src/lint/sub/rules.ts" against pattern "src/lint/*.ts"
      Then the match result is false

    @edge-case
    Scenario: Single glob does not match wrong extension
      When matching path "src/lint/rules.js" against pattern "src/lint/*.ts"
      Then the match result is false

  Rule: Recursive globs match any depth

    @happy-path
    Scenario: Recursive glob matches file at target depth
      When matching path "src/generators/pipeline/transform.ts" against pattern "src/generators/**/*.ts"
      Then the match result is true

    @happy-path
    Scenario: Recursive glob matches file at deeper depth
      When matching path "src/generators/pipeline/sub/deep.ts" against pattern "src/**/*.ts"
      Then the match result is true

    @happy-path
    Scenario: Recursive glob matches file at top level
      When matching path "src/index.ts" against pattern "src/**/*.ts"
      Then the match result is true

    @edge-case
    Scenario: Recursive glob does not match wrong prefix
      When matching path "other/generators/types.ts" against pattern "src/**/*.ts"
      Then the match result is false

  Rule: Dataset shape extraction deduplicates by name

    @happy-path
    Scenario: Shapes are extracted from matching patterns
      Given a MasterDataset with patterns:
        | filePath             | shapeName    | shapeKind  |
        | src/lint/rules.ts    | LintRule     | interface  |
        | src/lint/config.ts   | LintConfig   | type       |
      When extracting shapes with source pattern "src/lint/*.ts"
      Then 2 shapes are returned
      And the shape names are "LintRule" and "LintConfig"

    @happy-path
    Scenario: Duplicate shape names are deduplicated
      Given a MasterDataset with patterns:
        | filePath             | shapeName    | shapeKind  |
        | src/lint/rules.ts    | LintRule     | interface  |
        | src/lint/config.ts   | LintRule     | type       |
      When extracting shapes with source pattern "src/lint/*.ts"
      Then 1 shapes are returned

    @edge-case
    Scenario: No shapes returned when glob does not match
      Given a MasterDataset with patterns:
        | filePath                | shapeName    | shapeKind  |
        | src/other/unrelated.ts  | Unrelated    | interface  |
      When extracting shapes with source pattern "src/lint/*.ts"
      Then 0 shapes are returned
