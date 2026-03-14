@architect
@architect-pattern:GitBranchDiffTesting
@architect-status:active
@architect-product-area:Generation
@architect-implements:GitBranchDiff
@git @branch-diff
Feature: Git Branch Diff
  The branch diff utility returns changed files relative to a base branch for
  PR-scoped generation. It must exclude deleted files from the returned list
  while preserving filenames exactly, including rename/copy targets and paths
  containing spaces.

  Background:
    Given a git branch diff test context

  Rule: getChangedFilesList returns only existing changed files

    **Invariant:** Modified and added files are returned, while deleted tracked files are excluded from the final list.
    **Rationale:** PR-scoped generation only needs files that still exist on the current branch; including deleted paths would force consumers to chase files that cannot be read.
    **Verified by:** Modified and added files are returned while deleted files are excluded

    @happy-path
    Scenario: Modified and added files are returned while deleted files are excluded
      Given an initialized git repository
      And these committed files exist:
        | file          | content                  |
        | src/keep.ts   | export const keep = 1;   |
        | src/remove.ts | export const remove = 1; |
      When I modify file "src/keep.ts" to "export const keep = 2;"
      And I add file "src/new.ts" with content "export const created = 1;"
      And I delete file "src/remove.ts"
      And I list changed files against "main"
      Then the changed files should include:
        | file        |
        | src/keep.ts |
        | src/new.ts  |
      And the changed files should not include:
        | file          |
        | src/remove.ts |

  Rule: Paths with spaces are preserved

    **Invariant:** A filename containing spaces is returned as the exact original path, not split into multiple tokens.
    **Rationale:** Whitespace splitting corrupts file paths and breaks PR-scoped generation in repositories with descriptive filenames.
    **Verified by:** File paths with spaces are preserved

    @edge-case
    Scenario: File paths with spaces are preserved
      Given an initialized git repository
      And a committed file "src/file with spaces.ts" with content "export const spaced = 1;"
      When I modify file "src/file with spaces.ts" to "export const spaced = 2;"
      And I list changed files against "main"
      Then the changed files should include:
        | file                    |
        | src/file with spaces.ts |

  Rule: NUL-delimited rename and copy statuses use the new path

    **Invariant:** Rename and copy statuses with similarity scores must record the current path, not the old/source path.
    **Rationale:** Git emits statuses like R100 and C087 in real diffs; parsing the wrong side of the pair causes generators to scope output to stale paths.
    **Verified by:** Similarity status maps to the new path

    @edge-case
    Scenario Outline: Similarity status maps to the new path
      Given a git name-status output with status "<status>" from "<oldPath>" to "<newPath>"
      When I parse the git name-status output
      Then the parsed modified files should include "<newPath>"

      Examples:
        | status | oldPath            | newPath            |
        | R100   | src/old-name.ts    | src/new-name.ts    |
        | R087   | src/legacy.ts      | src/current.ts     |
        | C100   | src/source.ts      | src/copied.ts      |
        | C087   | src/base name.ts   | src/copied name.ts |
