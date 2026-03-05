@libar-docs
@libar-docs-pattern:PublishingRelocation
@libar-docs-status:roadmap
@libar-docs-phase:40
@libar-docs-effort:0.25d
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocsConsolidationStrategy
@libar-docs-business-value:move-maintainer-only-npm-and-ci-publishing-procedures-to-correct-repo-root-audience
@libar-docs-priority:medium
Feature: PUBLISHING.md Relocation to MAINTAINERS.md

  **Problem:**
  `docs/PUBLISHING.md` (144 lines) is deployed to libar.dev as part of the `docs/`
  directory, but its content is exclusively maintainer-only operational procedure:
  npm authentication setup, 2FA workflow, version bump commands (pre-releases,
  patch/minor/major), GitHub Actions release configuration, pre-commit and pre-push
  hook descriptions, dry-run verification, and post-publish troubleshooting. A
  developer or user browsing libar.dev has no use for these procedures — they are
  targeted at the one or two people with npm publish access to the `@libar-dev`
  organization. Placing maintainer procedures in the user-facing docs/ directory
  creates audience misalignment and adds noise to the website.

  **Solution:**
  Move the full content of `docs/PUBLISHING.md` into a new `MAINTAINERS.md` file
  at the repository root. MAINTAINERS.md is a standard GitHub-visible location for
  maintainer guidance — it appears in the repository root alongside CONTRIBUTING.md
  and README.md, is findable by maintainers, and is not deployed to the website.
  Delete `docs/PUBLISHING.md` after the content is moved. The `docs/INDEX.md`
  navigation entry is removed in Phase 6 (IndexNavigationUpdate).

  **Why It Matters:**
  | Benefit | How |
  | Correct audience | Maintainers find procedures at the repo root, not buried in website docs |
  | Cleaner website | docs/ contains only content useful to package users and developers |
  | Standard convention | MAINTAINERS.md is a recognized GitHub repository metadata file |
  | Zero information loss | All 144 lines move intact — no content is deleted, only relocated |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Create MAINTAINERS.md at repo root with PUBLISHING.md content | pending | MAINTAINERS.md | No | n/a |
      | Delete docs/PUBLISHING.md | pending | docs/PUBLISHING.md | No | n/a |

  Rule: All publishing content moves to MAINTAINERS.md intact

    **Invariant:** MAINTAINERS.md at the repository root contains all sections
    previously in docs/PUBLISHING.md: Prerequisites, Version Strategy, Publishing
    Workflow (pre-releases and stable), Automated Publishing via GitHub Actions,
    Pre-commit and Pre-push Hooks, Dry Run, Verifying a Published Package, and
    Troubleshooting. No content is summarized, condensed, or omitted during the
    move. The only changes permitted are updating any relative links that previously
    pointed to other docs/ files.

    **Rationale:** The relocation is a pure audience-alignment fix, not a content
    review. Condensing content during the move would conflate two concerns. The
    maintainer procedures are complete and accurate — they simply live in the wrong
    location. A faithful copy ensures no institutional knowledge is lost in
    translation.

    **Verified by:** MAINTAINERS.md contains all PUBLISHING.md sections,
    No content omitted or summarized during relocation

    @acceptance-criteria @happy-path
    Scenario: MAINTAINERS.md contains all publishing procedure sections
      Given the content of docs/PUBLISHING.md before Phase 40
      When MAINTAINERS.md is created at the repository root
      Then MAINTAINERS.md contains the Prerequisites section
      And MAINTAINERS.md contains the Version Strategy table
      And MAINTAINERS.md contains the Publishing Workflow section with pre-release and stable release commands
      And MAINTAINERS.md contains the Automated Publishing section describing the GitHub Actions workflow

  Rule: docs/PUBLISHING.md is deleted after relocation

    **Invariant:** After Phase 40 completes, `docs/PUBLISHING.md` does not exist.
    The file is not kept as a redirect stub or summary pointer. MAINTAINERS.md at
    the repo root is the sole location for publishing procedures. No retained file
    in docs/ contains a hyperlink to the deleted PUBLISHING.md after Phase 6
    completes the index cleanup.

    **Rationale:** A deleted file cannot serve the wrong audience. Keeping
    docs/PUBLISHING.md as a stub pointing to MAINTAINERS.md would still deploy
    a maintainer-only page to the website. The correct fix is deletion, not
    redirection. Maintainers navigating to the repo root will find MAINTAINERS.md
    via standard GitHub repository conventions.

    **Verified by:** File deleted from docs/, No broken links in retained docs

    @acceptance-criteria @validation
    Scenario: docs/PUBLISHING.md is absent after Phase 40 completes
      Given Phase 40 (PublishingRelocation) is complete
      Then docs/PUBLISHING.md does not exist in the repository
      And MAINTAINERS.md exists at the repository root
      And no retained file in docs/ contains a hyperlink to PUBLISHING.md
