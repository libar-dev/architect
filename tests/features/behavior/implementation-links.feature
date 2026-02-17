@libar-docs
@libar-docs-pattern:ImplementationLinkPathNormalization
@libar-docs-status:completed
@libar-docs-product-area:Generation
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

    **Invariant:** Implementation file paths must not contain repository-level prefixes like "libar-platform/" or "monorepo/".
    **Rationale:** Generated links are relative to the output directory; repository prefixes produce broken paths.
    **Verified by:** Strip libar-platform prefix from implementation paths, Strip monorepo prefix from implementation paths, Preserve paths without repository prefix

    Scenario: Strip libar-platform prefix from implementation paths
      Given a pattern with implementation:
        | file | description |
        | libar-platform/packages/core/src/handler.ts | Main handler |
      When the pattern detail document is generated
      Then the implementation link path is "../../packages/core/src/handler.ts"
      And the link text is "`handler.ts`"

    Scenario: Strip monorepo prefix from implementation paths
      Given a pattern with implementation:
        | file | description |
        | monorepo/packages/api/src/client.ts | API client |
      When the pattern detail document is generated
      Then the implementation link path is "../../packages/api/src/client.ts"

    Scenario: Preserve paths without repository prefix
      Given a pattern with implementation:
        | file | description |
        | packages/core/src/handler.ts | Main handler |
      When the pattern detail document is generated
      Then the implementation link path is "../../packages/core/src/handler.ts"

  # ===========================================================================
  # Rule 2: Multiple implementations all have correct paths
  # ===========================================================================

  Rule: All implementation links in a pattern are normalized

    **Invariant:** Every implementation link in a pattern document must have its path normalized, regardless of how many implementations exist.
    **Verified by:** Multiple implementations with mixed prefixes

    Scenario: Multiple implementations with mixed prefixes
      Given a pattern with implementations:
        | file | description |
        | libar-platform/packages/core/src/a.ts | File A |
        | packages/core/src/b.ts | File B |
        | libar-platform/packages/api/src/c.ts | File C |
      When the pattern detail document is generated
      # Links are sorted alphabetically by original file path before normalization
      Then the implementation links should be:
        | index | path |
        | 1 | ../../packages/api/src/c.ts |
        | 2 | ../../packages/core/src/a.ts |
        | 3 | ../../packages/core/src/b.ts |

  # ===========================================================================
  # Rule 3: normalizeImplPath helper function
  # ===========================================================================

  Rule: normalizeImplPath strips known prefixes

    **Invariant:** normalizeImplPath removes only recognized repository prefixes from the start of a path and leaves all other path segments unchanged.
    **Verified by:** Strips libar-platform/ prefix, Strips monorepo/ prefix, Returns unchanged path without known prefix, Only strips prefix at start of path

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
