@architect
@behavior @shape-matcher
@architect-pattern:ShapeMatcherTesting
@architect-status:completed
@architect-implements:ReferenceDocShowcase,DeclarationLevelShapeTagging
@architect-product-area:Generation
Feature: Shape Source Pattern Matching

  Matches file paths against glob patterns for TypeScript shape extraction.
  Uses in-memory string matching (no filesystem access) per AD-6.

  Background:
    Given a shape matcher test context

  Rule: Exact paths match without wildcards

    **Invariant:** A pattern without glob characters must match only the exact file path, character for character.
    **Rationale:** Loose matching on non-glob patterns would silently include unintended files, causing incorrect shapes to appear in generated documentation.
    **Verified by:** Exact path matches identical path, Exact path does not match different path

    @happy-path
    Scenario: Exact path matches identical path
      When matching path "src/generators/types.ts" against pattern "src/generators/types.ts"
      Then the match result is true

    @happy-path
    Scenario: Exact path does not match different path
      When matching path "src/generators/types.ts" against pattern "src/generators/other.ts"
      Then the match result is false

  Rule: Single-level globs match one directory level

    **Invariant:** A single `*` glob must match files only within the specified directory, never crossing directory boundaries.
    **Rationale:** Crossing directory boundaries would violate standard glob semantics and pull in shapes from nested modules that belong to different product areas.
    **Verified by:** Single glob matches file in target directory, Single glob does not match nested subdirectory, Single glob does not match wrong extension

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

    **Invariant:** A `**` glob must match files at any nesting depth below the specified prefix, while still respecting extension and prefix constraints.
    **Rationale:** Recursive globs enable broad subtree selection for shape extraction; failing to respect prefix and extension constraints would leak unrelated shapes into the output.
    **Verified by:** Recursive glob matches file at target depth, Recursive glob matches file at deeper depth, Recursive glob matches file at top level, Recursive glob does not match wrong prefix

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

  Rule: Source selectors deduplicate matching shapes by name

    **Invariant:** When multiple patterns match a source selector, the returned shapes must be deduplicated by name so each shape appears at most once.
    **Rationale:** Duplicate shape names in generated documentation confuse readers and inflate type registries.
    **Verified by:** Shapes are selected from matching source glob patterns, Duplicate shape names are deduplicated, No shapes returned when glob does not match

    @happy-path
    Scenario: Shapes are selected from matching source glob patterns
      Given a MasterDataset with patterns:
        | filePath             | shapeName    | shapeKind  |
        | src/lint/rules.ts    | LintRule     | interface  |
        | src/lint/config.ts   | LintConfig   | type       |
      When selecting shapes with source selector "src/lint/*.ts"
      Then 2 shapes are returned
      And the shape names are "LintRule" and "LintConfig"

    @happy-path
    Scenario: Duplicate shape names are deduplicated
      Given a MasterDataset with patterns:
        | filePath             | shapeName    | shapeKind  |
        | src/lint/rules.ts    | LintRule     | interface  |
        | src/lint/config.ts   | LintRule     | type       |
      When selecting shapes with source selector "src/lint/*.ts"
      Then 1 shapes are returned

    @edge-case
    Scenario: No shapes returned when glob does not match
      Given a MasterDataset with patterns:
        | filePath                | shapeName    | shapeKind  |
        | src/other/unrelated.ts  | Unrelated    | interface  |
      When selecting shapes with source selector "src/lint/*.ts"
      Then 0 shapes are returned
