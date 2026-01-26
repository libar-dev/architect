Feature: Implementation Link Path Normalization

  Links to implementation files in generated pattern documents should have
  correct relative paths. Repository prefixes like "libar-platform/" must
  be stripped to produce valid links from the output directory.

  Background: Patterns codec test context
    Given a patterns codec test context

  # ===========================================================================
  # Rule 1: Strip repository prefixes from implementation paths
  # ===========================================================================

  Rule: Repository prefixes are stripped from implementation paths

    Scenario: Strip libar-platform prefix from implementation paths
      Given a pattern with implementation:
        | file | libar-platform/packages/core/src/handler.ts |
        | description | Main handler |
      When the pattern detail document is generated
      Then the implementation link path is "../../packages/core/src/handler.ts"
      And the link text is "`handler.ts`"

    Scenario: Strip monorepo prefix from implementation paths
      Given a pattern with implementation:
        | file | monorepo/packages/api/src/client.ts |
        | description | API client |
      When the pattern detail document is generated
      Then the implementation link path is "../../packages/api/src/client.ts"

    Scenario: Preserve paths without repository prefix
      Given a pattern with implementation:
        | file | packages/core/src/handler.ts |
        | description | Main handler |
      When the pattern detail document is generated
      Then the implementation link path is "../../packages/core/src/handler.ts"

  # ===========================================================================
  # Rule 2: Multiple implementations all have correct paths
  # ===========================================================================

  Rule: All implementation links in a pattern are normalized

    Scenario: Multiple implementations with mixed prefixes
      Given a pattern with implementations:
        | file | description |
        | libar-platform/packages/core/src/a.ts | File A |
        | packages/core/src/b.ts | File B |
        | libar-platform/packages/api/src/c.ts | File C |
      When the pattern detail document is generated
      Then implementation 1 link path is "../../packages/core/src/a.ts"
      And implementation 2 link path is "../../packages/core/src/b.ts"
      And implementation 3 link path is "../../packages/api/src/c.ts"

  # ===========================================================================
  # Rule 3: normalizeImplPath helper function
  # ===========================================================================

  Rule: normalizeImplPath strips known prefixes

    Scenario: Strips libar-platform/ prefix
      Given file path "libar-platform/packages/core/src/file.ts"
      When normalizeImplPath is called
      Then the result is "packages/core/src/file.ts"

    Scenario: Strips monorepo/ prefix
      Given file path "monorepo/packages/core/src/file.ts"
      When normalizeImplPath is called
      Then the result is "packages/core/src/file.ts"

    Scenario: Returns unchanged path without known prefix
      Given file path "packages/core/src/file.ts"
      When normalizeImplPath is called
      Then the result is "packages/core/src/file.ts"

    Scenario: Only strips prefix at start of path
      Given file path "packages/libar-platform/src/file.ts"
      When normalizeImplPath is called
      Then the result is "packages/libar-platform/src/file.ts"
