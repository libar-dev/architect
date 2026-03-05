@libar-docs
@libar-docs-pattern:ReadmeRationalization
@libar-docs-status:roadmap
@libar-docs-phase:42
@libar-docs-effort:0.5d
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocsConsolidationStrategy
@libar-docs-business-value:focused-npm-landing-page
@libar-docs-priority:medium
Feature: README Rationalization

  **Problem:**
  `README.md` is 504 lines and serves three different audiences in one document:
  (a) npm package consumers who need installation, quick start, and CLI commands (~150 lines — keep),
  (b) enterprise pitch content — "Proven at Scale", comparison table, "How It Compares" — better
  suited for the libar.dev website where it can be formatted properly and kept up to date,
  (c) configuration reference (lines 440–474) that duplicates docs/CONFIGURATION.md with identical
  preset tables and code examples.

  Mixing these concerns produces a README that is too long for npm discovery, too shallow for
  enterprise evaluation, and redundant with the configuration doc. npm consumers scanning the
  package page are most impacted — they hit 504 lines before finding the install command.

  **Solution:**
  Trim README.md from 504 lines to approximately 150 lines, keeping only the npm-appropriate
  content: badges, one-paragraph value proposition, install instructions, quick start (annotate,
  generate, enforce), CLI command table, and a documentation index. Move the enterprise pitch
  sections ("Proven at Scale", "How It Compares", "Design-First Development", "Document Durability
  Model") into a candidate list for the libar.dev website. Remove the Configuration section
  entirely — it duplicates docs/CONFIGURATION.md.

  **Why It Matters:**
  | Benefit | How |
  | Faster npm discovery | 150-line README lets installers find what they need without scrolling |
  | No configuration duplication | Single source of truth in docs/CONFIGURATION.md |
  | Website-ready content | Enterprise pitch sections identified and extracted for libar.dev |
  | Consistent install experience | README matches what npm package consumers expect |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Trim README.md to ~150 lines keeping npm-appropriate content | pending | README.md | No | n/a |
      | Remove Configuration section that duplicates docs/CONFIGURATION.md | pending | README.md | No | n/a |
      | Identify and extract enterprise pitch sections for libar.dev website | pending | README.md | No | n/a |
      | Verify all retained links to docs/ files remain valid | pending | README.md | No | n/a |

  Rule: README must be an npm package landing page

    **Invariant:** README.md content is scoped to what an npm package consumer needs: install,
    quick start, CLI reference, and documentation index.

    **Rationale:** npm package pages are scanned by developers evaluating installation decisions.
    Content above 150-200 lines increases time-to-value. Enterprise pitch content (benchmark tables,
    methodology comparisons, detailed case studies) is not actionable at install time and belongs
    on the project website where it can receive proper formatting, navigation, and updates without
    coupling to the package release cycle.

    **Verified by:** Trimmed README contains install, quick start, CLI table, and docs index only

    @acceptance-criteria @happy-path
    Scenario: Trimmed README contains install, quick start, CLI table, and docs index only
      Given README.md is 504 lines mixing npm content, enterprise pitch, and configuration reference
      When the rationalization is complete
      Then README.md is approximately 150 lines
      And it contains badges, value proposition, install instructions, quick start steps, and the CLI command table
      And it contains a documentation index linking to the docs/ directory
      And it does not contain the "Proven at Scale", "How It Compares", or "Design-First Development" sections

  Rule: Configuration reference must not be duplicated in README

    **Invariant:** docs/CONFIGURATION.md is the single source of truth for preset and tag configuration.

    **Rationale:** README.md lines 440–474 reproduce the exact same preset table and config code
    examples that appear in docs/CONFIGURATION.md. Duplicate reference content diverges over time
    — when a new preset is added, both files require updates. Removing the README copy and pointing
    to CONFIGURATION.md eliminates the divergence risk and removes approximately 35 lines from the
    README with no loss of information.

    **Verified by:** README references docs/CONFIGURATION.md instead of duplicating config content

    @acceptance-criteria @happy-path
    Scenario: README references docs/CONFIGURATION.md instead of duplicating config content
      Given README.md contains a Configuration section that duplicates docs/CONFIGURATION.md
      When the rationalization is complete
      Then README.md does not contain a Configuration code block or preset table
      And README.md contains a link to docs/CONFIGURATION.md in the documentation index
      And docs/CONFIGURATION.md remains unchanged as the authoritative configuration reference
