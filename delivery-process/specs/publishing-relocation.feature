@libar-docs
@libar-docs-pattern:PublishingRelocation
@libar-docs-status:active
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
  Delete `docs/PUBLISHING.md` after the content is moved. Update `docs/INDEX.md`
  to remove all PUBLISHING.md references (3 locations). Update the website content
  manifest to remove the dead sync target and add a link rewrite so any existing
  cross-references resolve to the GitHub-hosted MAINTAINERS.md.

  **Why It Matters:**
  | Benefit | How |
  | Correct audience | Maintainers find procedures at the repo root, not buried in website docs |
  | Cleaner website | docs/ contains only content useful to package users and developers |
  | Standard convention | MAINTAINERS.md is a recognized GitHub repository metadata file |
  | Zero information loss | All 144 lines move intact — no content is deleted, only relocated |

  **Design Session Findings (2026-03-05):**
  | Finding | Impact | Resolution |
  | PUBLISHING.md has zero relative links to other docs | No link rewriting needed in MAINTAINERS.md | Simplifies move to pure copy with header rename |
  | Original spec references non-existent Phase 6 | False dependency for INDEX.md cleanup | INDEX.md update is now deliverable #3 of this phase |
  | Website manifest maps PUBLISHING.md to /guides/publishing/ | Dead sync target after deletion | Deliverable #4 removes manifest entry |
  | docs-live/GENERATION.md references PUBLISHING.md 4 times | Generated content, auto-updated by pnpm docs:all | No manual action needed |
  | INDEX.md has 3 PUBLISHING.md references (lines 32, 260-272, 338) | Broken links and stale navigation after deletion | All 3 removed in deliverable #3 |

  **Section Audit (docs/PUBLISHING.md):**
  | Section | Lines | Level |
  | Publishing Guide (title) | 1 | H1 |
  | Prerequisites | 5-9 | H2 |
  | Version Strategy | 11-18 | H2 |
  | Publishing Workflow | 20-67 | H2 |
  | Pre-releases (Recommended for Initial Releases) | 22-36 | H3 |
  | Subsequent Pre-releases | 38-44 | H3 |
  | Stable Releases | 46-67 | H3 |
  | Automated Publishing (GitHub Actions) | 69-85 | H2 |
  | Pre-commit and Pre-push Hooks | 87-99 | H2 |
  | Pre-commit | 91-95 | H3 |
  | Pre-push | 98-99 | H3 |
  | Dry Run | 101-109 | H2 |
  | Verifying a Published Package | 111-126 | H2 |
  | Troubleshooting | 128-144 | H2 |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Create MAINTAINERS.md at repo root with all PUBLISHING.md content | complete | MAINTAINERS.md | No | n/a |
      | Delete docs/PUBLISHING.md | complete | docs/PUBLISHING.md | No | n/a |
      | Remove PUBLISHING.md entries from docs/INDEX.md (lines 32, 260-272, 338) | complete | docs/INDEX.md | No | n/a |
      | Remove PUBLISHING.md from website content-manifest.mjs guides array | complete | libar-dev-website/scripts/content-manifest.mjs | No | n/a |
      | Add MAINTAINERS.md link rewrite to content-manifest.mjs | complete | libar-dev-website/scripts/content-manifest.mjs | No | n/a |

  Rule: All publishing content moves to MAINTAINERS.md intact

    **Invariant:** MAINTAINERS.md at the repository root contains all 8 H2 sections
    previously in docs/PUBLISHING.md: Prerequisites, Version Strategy, Publishing
    Workflow (with Pre-releases, Subsequent Pre-releases, and Stable Releases
    subsections), Automated Publishing (GitHub Actions), Pre-commit and Pre-push
    Hooks, Dry Run, Verifying a Published Package, and Troubleshooting. No content
    is summarized, condensed, or omitted during the move. The H1 title changes from
    "Publishing Guide" to "Maintainer Guide" to reflect the broader MAINTAINERS.md
    convention. PUBLISHING.md contains zero relative links to other docs/ files, so
    no link rewriting is required.

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
      And MAINTAINERS.md contains the Dry Run section
      And MAINTAINERS.md contains the Verifying a Published Package section
      And MAINTAINERS.md contains the Troubleshooting section

  Rule: docs/PUBLISHING.md is deleted after relocation

    **Invariant:** After Phase 40 completes, `docs/PUBLISHING.md` does not exist.
    The file is not kept as a redirect stub or summary pointer. MAINTAINERS.md at
    the repo root is the sole location for publishing procedures.

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

  Rule: Cross-references and website manifest are updated

    **Invariant:** After Phase 40 completes, docs/INDEX.md contains zero references
    to PUBLISHING.md. The 3 locations that previously referenced it are removed:
    the Quick Navigation table row (line 32), the Detailed Table of Contents
    subsection (lines 260-272), and the Document Roles Summary row (line 338).
    The website content manifest no longer includes PUBLISHING.md in the guides
    array. A link rewrite entry maps "./PUBLISHING.md" to the GitHub blob URL for
    MAINTAINERS.md so any remaining cross-references in other docs resolve correctly
    after website deployment.

    **Rationale:** Deleting a file without updating its references creates broken
    links in both the docs/ index and the website. The INDEX.md references are
    removed entirely (not redirected) because the content is no longer in the docs/
    directory. The website manifest removal prevents a dead sync target. The link
    rewrite handles any generated docs that reference PUBLISHING.md — they will
    link to the GitHub-hosted MAINTAINERS.md instead of a 404.

    **Verified by:** INDEX.md has zero PUBLISHING.md references,
    Website manifest guides array excludes PUBLISHING.md,
    Link rewrite maps to MAINTAINERS.md GitHub URL

    @acceptance-criteria @validation
    Scenario: INDEX.md and website manifest are updated
      Given Phase 40 (PublishingRelocation) is complete
      Then docs/INDEX.md Quick Navigation table has no PUBLISHING.md row
      And docs/INDEX.md has no "PUBLISHING.md (Lines 1-144)" subsection
      And docs/INDEX.md Document Roles Summary has no PUBLISHING.md row
