@architect
@architect-pattern:DirectiveDetection
@architect-status:completed
@architect-product-area:Annotation
@behavior @directive-detection
Feature: Directive Detection
  Pure functions that detect @architect directives in TypeScript source code.
  These functions enable quick file filtering before full AST parsing.

  **Problem:**
  - Full AST parsing of every TypeScript file is expensive and slow
  - Files without documentation directives waste processing time
  - Need to distinguish file-level opt-in (@architect) from section tags (@architect-*)
  - Similar patterns like @libar-doc-core could cause false positives

  **Solution:**
  - hasDocDirectives: Fast regex check for any @architect-* directive
  - hasFileOptIn: Validates explicit @architect opt-in (not @architect-*)
  - Both use regex patterns optimized for quick filtering before AST parsing
  - Negative lookahead ensures @architect doesn't match @architect-*

  Rule: hasDocDirectives detects @architect-* section directives

    **Invariant:** hasDocDirectives must return true if and only if the source contains at least one @architect-{suffix} directive (case-sensitive, @ required, suffix required).
    **Rationale:** This is the first-pass filter in the scanner pipeline; false negatives cause patterns to be silently missed, while false positives only waste AST parsing time.
    **Verified by:** Detect @architect-core directive in JSDoc block, Detect various @architect-* directives, Detect directive anywhere in file content, Detect multiple directives on same line, Detect directive in inline comment, Return false for content without directives, Return false for empty content in hasDocDirectives, Reject similar but non-matching patterns

    @happy-path @has-doc-directives
    Scenario: Detect @architect-core directive in JSDoc block
      Given source code with JSDoc containing "@architect-core"
      When checking for documentation directives
      Then hasDocDirectives should return true

    @happy-path @has-doc-directives
    Scenario Outline: Detect various @architect-* directives
      Given source code containing directive "<directive>"
      When checking for documentation directives
      Then hasDocDirectives should return true

      Examples: Standard category directives
        | directive               |
        | @architect-core        |
        | @architect-domain      |
        | @architect-validation  |
        | @architect-testing     |
        | @architect-arch        |
        | @architect-infra       |

    @happy-path @has-doc-directives
    Scenario: Detect directive anywhere in file content
      Given source code with directive in middle of file
      When checking for documentation directives
      Then hasDocDirectives should return true

    @happy-path @has-doc-directives
    Scenario: Detect multiple directives on same line
      Given source code "/** @architect-core @architect-validation */"
      When checking for documentation directives
      Then hasDocDirectives should return true

    @happy-path @has-doc-directives
    Scenario: Detect directive in inline comment
      Given source code "// @architect-core Quick directive"
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
        | @architect      | Missing category suffix |
        | @libar-doc-core  | Wrong prefix (doc)      |
        | libar-docs-core  | Missing @ symbol        |
        | @LIBAR-DOCS-CORE | Wrong case              |

  Rule: hasFileOptIn detects file-level @architect marker

    **Invariant:** hasFileOptIn must return true if and only if the source contains a bare @architect tag (not followed by a hyphen) inside a JSDoc block comment; line comments and @architect-* suffixed tags must not match.
    **Rationale:** File-level opt-in is the gate for including a file in the scanner pipeline; confusing @architect-core (a section tag) with @architect (file opt-in) would either miss files or over-include them.
    **Verified by:** Detect @architect in JSDoc block comment, Detect @architect with description on same line, Detect @architect in multi-line JSDoc, Detect @architect anywhere in file, Detect @architect combined with section tags, Return false when only section tags present, Return false for multiple section tags without opt-in, Return false for empty content in hasFileOptIn, Return false for @architect in line comment, Not confuse @architect-* with @architect opt-in

    @happy-path @has-file-opt-in
    Scenario: Detect @architect in JSDoc block comment
      Given source code with file-level "@architect" opt-in
      When checking for file opt-in
      Then hasFileOptIn should return true

    @happy-path @has-file-opt-in
    Scenario: Detect @architect with description on same line
      Given source code "/** @architect This file is documented */"
      When checking for file opt-in
      Then hasFileOptIn should return true

    @happy-path @has-file-opt-in
    Scenario: Detect @architect in multi-line JSDoc
      Given source code with @architect in middle of multi-line JSDoc
      When checking for file opt-in
      Then hasFileOptIn should return true

    @happy-path @has-file-opt-in
    Scenario: Detect @architect anywhere in file
      Given source code with @architect after other content
      When checking for file opt-in
      Then hasFileOptIn should return true

    @happy-path @has-file-opt-in
    Scenario: Detect @architect combined with section tags
      Given source code "/** @architect @architect-core */"
      When checking for file opt-in
      Then hasFileOptIn should return true

    @edge-case @has-file-opt-in
    Scenario: Return false when only section tags present
      Given source code with only "@architect-core" section tag
      When checking for file opt-in
      Then hasFileOptIn should return false

    @edge-case @has-file-opt-in
    Scenario: Return false for multiple section tags without opt-in
      Given source code "/** @architect-core @architect-validation */"
      When checking for file opt-in
      Then hasFileOptIn should return false

    @edge-case @has-file-opt-in
    Scenario: Return false for empty content in hasFileOptIn
      Given empty source code
      When checking for file opt-in
      Then hasFileOptIn should return false

    @edge-case @has-file-opt-in
    Scenario: Return false for @architect in line comment
      Given source code "// @architect This is a line comment, not JSDoc"
      When checking for file opt-in
      Then hasFileOptIn should return false

    @edge-case @has-file-opt-in
    Scenario: Not confuse @architect-* with @architect opt-in
      Given source code "/** @architect-event-sourcing */"
      When checking for file opt-in
      Then hasFileOptIn should return false
