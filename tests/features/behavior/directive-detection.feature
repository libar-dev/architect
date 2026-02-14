@libar-docs
@libar-docs-pattern:DirectiveDetection
@libar-docs-status:completed
@libar-docs-product-area:Annotation
@behavior @directive-detection
Feature: Directive Detection
  Pure functions that detect @libar-docs directives in TypeScript source code.
  These functions enable quick file filtering before full AST parsing.

  **Problem:**
  - Full AST parsing of every TypeScript file is expensive and slow
  - Files without documentation directives waste processing time
  - Need to distinguish file-level opt-in (@libar-docs) from section tags (@libar-docs-*)
  - Similar patterns like @libar-doc-core could cause false positives

  **Solution:**
  - hasDocDirectives: Fast regex check for any @libar-docs-* directive
  - hasFileOptIn: Validates explicit @libar-docs opt-in (not @libar-docs-*)
  - Both use regex patterns optimized for quick filtering before AST parsing
  - Negative lookahead ensures @libar-docs doesn't match @libar-docs-*

  # ==========================================================================
  # hasDocDirectives - Directive Detection
  # ==========================================================================

  @happy-path @has-doc-directives
  Scenario: Detect @libar-docs-core directive in JSDoc block
    Given source code with JSDoc containing "@libar-docs-core"
    When checking for documentation directives
    Then hasDocDirectives should return true

  @happy-path @has-doc-directives
  Scenario Outline: Detect various @libar-docs-* directives
    Given source code containing directive "<directive>"
    When checking for documentation directives
    Then hasDocDirectives should return true

    Examples: Standard category directives
      | directive               |
      | @libar-docs-core        |
      | @libar-docs-domain      |
      | @libar-docs-validation  |
      | @libar-docs-testing     |
      | @libar-docs-arch        |
      | @libar-docs-infra       |

  @happy-path @has-doc-directives
  Scenario: Detect directive anywhere in file content
    Given source code with directive in middle of file
    When checking for documentation directives
    Then hasDocDirectives should return true

  @happy-path @has-doc-directives
  Scenario: Detect multiple directives on same line
    Given source code "/** @libar-docs-core @libar-docs-validation */"
    When checking for documentation directives
    Then hasDocDirectives should return true

  @happy-path @has-doc-directives
  Scenario: Detect directive in inline comment
    Given source code "// @libar-docs-core Quick directive"
    When checking for documentation directives
    Then hasDocDirectives should return true

  @edge-case @has-doc-directives
  Scenario: Return false for content without directives
    Given source code with only standard JSDoc tags
    When checking for documentation directives
    Then hasDocDirectives should return false

  @edge-case @has-doc-directives
  Scenario: Return false for empty content in hasDocDirectives
    Given empty source code
    When checking for documentation directives
    Then hasDocDirectives should return false

  @edge-case @has-doc-directives
  Scenario Outline: Reject similar but non-matching patterns
    Given source code containing pattern "<pattern>"
    When checking for documentation directives
    Then hasDocDirectives should return false because "<reason>"

    Examples: Invalid patterns
      | pattern          | reason                  |
      | @libar-docs      | Missing category suffix |
      | @libar-doc-core  | Wrong prefix (doc)      |
      | libar-docs-core  | Missing @ symbol        |
      | @LIBAR-DOCS-CORE | Wrong case              |

  # ==========================================================================
  # hasFileOptIn - File-Level Opt-In Detection
  # ==========================================================================

  @happy-path @has-file-opt-in
  Scenario: Detect @libar-docs in JSDoc block comment
    Given source code with file-level "@libar-docs" opt-in
    When checking for file opt-in
    Then hasFileOptIn should return true

  @happy-path @has-file-opt-in
  Scenario: Detect @libar-docs with description on same line
    Given source code "/** @libar-docs This file is documented */"
    When checking for file opt-in
    Then hasFileOptIn should return true

  @happy-path @has-file-opt-in
  Scenario: Detect @libar-docs in multi-line JSDoc
    Given source code with @libar-docs in middle of multi-line JSDoc
    When checking for file opt-in
    Then hasFileOptIn should return true

  @happy-path @has-file-opt-in
  Scenario: Detect @libar-docs anywhere in file
    Given source code with @libar-docs after other content
    When checking for file opt-in
    Then hasFileOptIn should return true

  @happy-path @has-file-opt-in
  Scenario: Detect @libar-docs combined with section tags
    Given source code "/** @libar-docs @libar-docs-core */"
    When checking for file opt-in
    Then hasFileOptIn should return true

  @edge-case @has-file-opt-in
  Scenario: Return false when only section tags present
    Given source code with only "@libar-docs-core" section tag
    When checking for file opt-in
    Then hasFileOptIn should return false

  @edge-case @has-file-opt-in
  Scenario: Return false for multiple section tags without opt-in
    Given source code "/** @libar-docs-core @libar-docs-validation */"
    When checking for file opt-in
    Then hasFileOptIn should return false

  @edge-case @has-file-opt-in
  Scenario: Return false for empty content in hasFileOptIn
    Given empty source code
    When checking for file opt-in
    Then hasFileOptIn should return false

  @edge-case @has-file-opt-in
  Scenario: Return false for @libar-docs in line comment
    Given source code "// @libar-docs This is a line comment, not JSDoc"
    When checking for file opt-in
    Then hasFileOptIn should return false

  @edge-case @has-file-opt-in
  Scenario: Not confuse @libar-docs-* with @libar-docs opt-in
    Given source code "/** @libar-docs-event-sourcing */"
    When checking for file opt-in
    Then hasFileOptIn should return false
