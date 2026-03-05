@libar-docs
@libar-docs-pattern:DocsLiveConsolidation
@libar-docs-status:roadmap
@libar-docs-phase:37
@libar-docs-effort:0.5d
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocsConsolidationStrategy
@libar-docs-business-value:single-output-directory-for-all-website-published-and-claude-readable-content
@libar-docs-priority:high
Feature: Docs Live Directory Consolidation

  **Problem:**
  `docs-generated/` mixes production reference documents (ARCHITECTURE-CODECS.md,
  ARCHITECTURE-TYPES.md at 19 KB and 14 KB) with intermediate build artifacts
  (business-rules/, taxonomy/). The `_claude-md/architecture/` compact context
  files live in `docs-generated/` while the equivalent product-area compacts live
  in `docs-live/`. Website visitors and Claude agents have no single location for
  all generated reference content — they must know which directory holds which type.

  **Solution:**
  Establish `docs-live/` as the single output directory for all website-published
  and Claude-readable content. Move reference docs to `docs-live/reference/` and
  architecture compact files to `docs-live/_claude-md/architecture/` by updating
  output directory configs in `delivery-process.config.ts`. Restrict
  `docs-generated/` to intermediate artifacts: business-rules/ and taxonomy/.

  **Why It Matters:**
  | Benefit | How |
  | Clear contract | One directory for website and Claude; one for build artifacts |
  | No missed content | Claude sessions directed to docs-live/ find all compacts |
  | Simpler gitignore | docs-generated/ can be fully ignored; docs-live/ is committed |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Reference docs output → docs-live/reference/ | pending | delivery-process.config.ts | Yes | integration |
      | Architecture _claude-md/ → docs-live/_claude-md/architecture/ | pending | delivery-process.config.ts | Yes | integration |
      | Remove root-level compact duplicates from docs-generated/ | pending | delivery-process.config.ts | No | n/a |
      | Update .gitignore: docs-generated/ ignored, docs-live/ committed | pending | .gitignore | No | n/a |

  Rule: docs-live/ is the single directory for website-published content

    **Invariant:** Every file appearing on `libar.dev` or referenced by CLAUDE.md
    comes from `docs-live/`. No production reference document is published from
    `docs-generated/`. The `docs-generated/` directory contains only intermediate
    artifacts: business-rules/, taxonomy/, TAXONOMY.md, and BUSINESS-RULES.md.

    **Rationale:** DD-1: Splitting production output across two directories creates
    ambiguity about where authoritative content lives. Website configuration, CLAUDE.md
    path references, and team navigation all benefit from a single source directory.
    `docs-generated/` name signals "build cache", not "publishable output".

    **Verified by:** All reference docs accessible from docs-live/,
    docs-generated/ contains no website-published files

    @acceptance-criteria @happy-path
    Scenario: Reference docs are generated into docs-live/reference/
      Given ARCHITECTURE-CODECS.md and ARCHITECTURE-TYPES.md configured with docs-live/reference/ output
      When pnpm docs:all runs successfully
      Then docs-live/reference/ARCHITECTURE-CODECS.md exists
      And docs-live/reference/ARCHITECTURE-TYPES.md exists
      And docs-generated/docs/ directory does not exist

  Rule: All _claude-md/ compact files consolidate under docs-live/

    **Invariant:** All `_claude-md/` compact context files live under
    `docs-live/_claude-md/`. Architecture-scoped compacts (architecture-codecs,
    architecture-types) move from `docs-generated/_claude-md/architecture/` to
    `docs-live/_claude-md/architecture/`. Product-area compacts remain at
    `docs-live/_claude-md/` unchanged.

    **Rationale:** DD-2: `_claude-md/` compact versions are the Claude consumption
    contract — agents read compacts, not full product area docs. Having compacts
    split across two directories (docs-generated/ and docs-live/) means Claude
    sessions following "read from docs-live/" miss the architecture compacts entirely.

    **Verified by:** All compact files under docs-live/_claude-md/,
    No _claude-md/ files remain under docs-generated/

    @acceptance-criteria @happy-path
    Scenario: Architecture compact files output to docs-live/_claude-md/architecture/
      Given reference doc configs with claudeMdSection: architecture
      When pnpm docs:all runs
      Then docs-live/_claude-md/architecture/architecture-codecs.md exists
      And docs-live/_claude-md/architecture/architecture-types.md exists
      And docs-generated/_claude-md/ directory does not exist

    @acceptance-criteria @validation
    Scenario: docs-generated/ contains only intermediate artifacts after consolidation
      Given consolidation config changes applied
      When pnpm docs:all runs
      Then docs-generated/ contains only business-rules/, taxonomy/, TAXONOMY.md, BUSINESS-RULES.md
      And docs-generated/ contains no .md files that appear in docs-live/
