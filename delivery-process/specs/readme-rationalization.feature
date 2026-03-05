@libar-docs
@libar-docs-pattern:ReadmeRationalization
@libar-docs-status:active
@libar-docs-phase:42
@libar-docs-effort:0.5d
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocsConsolidationStrategy
@libar-docs-business-value:focused-npm-landing-page
@libar-docs-priority:medium
Feature: README Rationalization

  **Problem:**
  `README.md` is 504 lines and serves three different audiences in one document:
  (a) npm package consumers who need installation, quick start, and CLI commands (~150 lines -- keep),
  (b) enterprise pitch content -- "Proven at Scale", comparison table, "How It Compares" -- better
  suited for the libar.dev website where it can be formatted properly and kept up to date,
  (c) configuration reference (lines 440-474) that duplicates docs/CONFIGURATION.md with identical
  preset tables and code examples.

  Mixing these concerns produces a README that is too long for npm discovery, too shallow for
  enterprise evaluation, and redundant with the configuration doc. npm consumers scanning the
  package page are most impacted -- they hit 504 lines before finding the install command.

  **Solution:**
  Trim README.md from 504 lines to approximately 150 lines, keeping only the npm-appropriate
  content: badges, one-paragraph value proposition, install instructions, quick start (annotate,
  generate, enforce), one annotated code example, content block summary table, CLI command table,
  and a documentation index. Enterprise pitch sections are already fully covered by 9 website
  landing page components (Metrics.astro, Pillars.astro, DataAPI.astro, Workflows.astro,
  CodeExamples.astro, Pipeline.astro, Hero.astro, McpCallout.astro, FooterCta.astro). Remove the
  Configuration section entirely -- it duplicates docs/CONFIGURATION.md.

  **Why It Matters:**
  | Benefit | How |
  | Faster npm discovery | 150-line README places install within first 20 lines |
  | No configuration duplication | Single source of truth in docs/CONFIGURATION.md |
  | Better getting-started page | Trimmed README aligns with /delivery-process/getting-started/ URL |
  | Zero content loss | All enterprise pitch content already lives on the website |

  **Section Disposition (18 sections):**
  | Section | Lines | Range | Action | Target | Rationale |
  | Title + badges | 15 | 1-15 | KEEP | 12 | Essential npm identity |
  | Why This Exists | 15 | 17-31 | TRIM | 6 | Keep thesis paragraph, remove comparison table |
  | Built for AI-Assisted Development | 17 | 33-49 | REMOVE | 0 | Website DataAPI.astro + CodeExamples.astro |
  | Quick Start | 57 | 52-108 | TRIM | 45 | Core npm content, trim tag prefix note |
  | How It Works | 54 | 111-164 | TRIM | 20 | Keep one TS example + pipeline one-liner |
  | What Gets Generated | 17 | 167-183 | TRIM | 10 | Keep content block table, remove prose |
  | CLI Commands | 68 | 186-253 | TRIM | 25 | Keep command table, remove flags + deprecated |
  | Proven at Scale | 47 | 256-302 | EXTRACT | 0 | Identical to Metrics.astro |
  | FSM-Enforced Workflow | 32 | 305-336 | EXTRACT | 0 | Pillars.astro + Workflows.astro |
  | Data API CLI | 26 | 339-364 | EXTRACT | 0 | DataAPI.astro (richer interactive demo) |
  | Rich Relationship Model | 23 | 367-389 | EXTRACT | 0 | Pillars.astro pillar 04 |
  | How It Compares | 21 | 392-412 | EXTRACT | 0 | No npm equivalent needed |
  | Design-First Development | 4 | 416-419 | REMOVE | 0 | Pointer to METHODOLOGY.md already in doc index |
  | Document Durability Model | 4 | 422-425 | REMOVE | 0 | Pointer to METHODOLOGY.md already in doc index |
  | Use Cases | 11 | 428-438 | REMOVE | 0 | Covered by Quick Start + website |
  | Configuration | 34 | 441-474 | REMOVE | 0 | Exact duplicate of docs/CONFIGURATION.md |
  | Documentation | 23 | 477-499 | TRIM | 15 | Merge two tables into one, remove self-reference |
  | License | 3 | 502-504 | KEEP | 3 | Required |

  Line count math: KEEP (15) + TRIM (121) + separators (6) = ~142 lines.

  **Design Findings:**
  | Finding | Impact | Resolution |
  | Website has 9 landing components, not only Hero | No content creation needed -- extraction is deletion | Deliverable 3 becomes mapping doc, not content brief |
  | Metrics.astro has identical Proven at Scale claims | Section 8 (47 lines) is 100% redundant | Safe EXTRACT with zero information loss |
  | Pillars.astro covers FSM, dual-source, relationships | Sections 9, 11, 12 redundant with website | Safe EXTRACT |
  | generate-docs flags table duplicates --help output | CLI section is 68 lines but only command table is unique | Trim flags table, retain command summary only |
  | INDEX.md line 22 references README as 1-504 | Stale line count after trim | Add deliverable 5 for INDEX.md update |
  | README maps to /getting-started/ via content-manifest.mjs | Trimmed README is better getting-started page | No manifest change needed, add Rule 3 |
  | Line 93 Configuration anchor breaks when section removed | Internal link to deleted section | Replace with docs/CONFIGURATION.md link |

  **README-to-Website Component Mapping:**
  | README Section (EXTRACT) | Website Component | Coverage |
  | Proven at Scale (S8, lines 256-302) | Metrics.astro | Identical: 5x throughput, 50-65% context, 0 ESLint |
  | FSM-Enforced Workflow (S9, lines 305-336) | Pillars.astro pillar 02 + Workflows.astro | FSM concept + session patterns |
  | Data API CLI (S10, lines 339-364) | DataAPI.astro | Three-tab interactive demo, richer than README |
  | Rich Relationship Model (S11, lines 367-389) | Pillars.astro pillar 04 | Relationship tags + Mermaid diagrams |
  | How It Compares (S12, lines 392-412) | Pillars.astro (implicit) | Four pillars position against competitors |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Trim README.md to ~150 lines per section disposition table | pending | README.md | No | n/a |
      | Remove Configuration section (lines 441-474) duplicating docs/CONFIGURATION.md | pending | README.md | No | n/a |
      | Document README-to-website component mapping for extracted enterprise sections | pending | delivery-process/specs/readme-rationalization.feature | No | n/a |
      | Verify all retained links in trimmed README resolve to valid targets | pending | README.md | No | n/a |
      | Update INDEX.md Quick Navigation line count for README (1-504 to ~1-150) | pending | docs/INDEX.md | No | n/a |
      | Verify trimmed README serves as effective getting-started page at /getting-started/ | pending | README.md | No | n/a |

  Rule: README must be an npm package landing page

    **Invariant:** README.md content is scoped to what an npm package consumer needs: title and badges,
    one-paragraph value proposition, install instructions, quick start (annotate, generate, enforce),
    one annotated code example, content block summary table, CLI command table, and documentation index.

    **Rationale:** npm package pages are scanned by developers evaluating installation decisions.
    Content above 150-200 lines increases time-to-value. Enterprise pitch content (benchmark tables,
    methodology comparisons, session workflows, relationship models, comparison matrices) is not
    actionable at install time and belongs on the project website where it receives proper formatting,
    navigation, and updates without coupling to the package release cycle. The libar.dev website
    already contains 9 landing page components covering all enterprise pitch content: Metrics.astro
    (Proven at Scale), Pillars.astro (FSM, dual-source, relationships, codecs), DataAPI.astro
    (Data API CLI), Workflows.astro (session types), CodeExamples.astro (annotation examples),
    and Pipeline.astro (four-stage pipeline).

    **Verified by:** Trimmed README contains only npm-appropriate sections per disposition table

    @acceptance-criteria @happy-path
    Scenario: Trimmed README contains only npm-appropriate sections per disposition table
      Given README.md is 504 lines mixing npm content, enterprise pitch, and configuration reference
      When the rationalization is complete
      Then README.md is approximately 150 lines
      And it contains these sections: Title, Why This Exists, Quick Start, How It Works, What Gets Generated, CLI Commands, Documentation, License
      And it does not contain these sections: Built for AI-Assisted Development, Proven at Scale, FSM-Enforced Workflow, Data API CLI, Rich Relationship Model, How It Compares, Design-First Development, Document Durability Model, Use Cases, Configuration

  Rule: Configuration reference must not be duplicated in README

    **Invariant:** docs/CONFIGURATION.md is the single source of truth for preset and tag configuration.

    **Rationale:** README.md lines 441-474 reproduce the exact same preset table and config code
    examples that appear in docs/CONFIGURATION.md. Duplicate reference content diverges over time
    -- when a new preset is added, both files require updates. Removing the README copy and pointing
    to CONFIGURATION.md eliminates the divergence risk and removes approximately 34 lines from the
    README with no loss of information.

    **Verified by:** README references docs/CONFIGURATION.md instead of duplicating config content

    @acceptance-criteria @happy-path
    Scenario: README references docs/CONFIGURATION.md instead of duplicating config content
      Given README.md contains a Configuration section that duplicates docs/CONFIGURATION.md
      When the rationalization is complete
      Then README.md does not contain a Configuration code block or preset table
      And README.md contains a link to docs/CONFIGURATION.md in the documentation index
      And docs/CONFIGURATION.md remains unchanged as the authoritative configuration reference

  Rule: Trimmed README must serve as an effective getting-started page

    **Invariant:** The website publishes README.md as /delivery-process/getting-started/ via
    content-manifest.mjs (line 57). After trimming, the remaining content must serve a first-time
    visitor arriving at that URL: install instructions, a quick annotated code example, CLI commands
    to run, and navigation links to deeper documentation.

    **Rationale:** The current 504-line README is a poor getting-started page because the install
    command is buried after 50+ lines of marketing content. The trimmed 150-line version places
    install instructions within the first 20 lines and follows with practical steps -- this is a
    better getting-started experience than the current version. No manifest changes are needed;
    the trim improves alignment with the URL.

    **Verified by:** Trimmed README has install instructions within first 20 lines and links to all guide documents

    @acceptance-criteria @happy-path
    Scenario: Trimmed README has install instructions within first 20 lines and links to all guide documents
      Given the website publishes README.md as /delivery-process/getting-started/
      When the rationalization is complete
      Then install instructions appear within the first 20 lines of README.md
      And Quick Start steps cover annotate, generate, and enforce
      And the Documentation section links to CONFIGURATION.md, METHODOLOGY.md, ARCHITECTURE.md, SESSION-GUIDES.md, GHERKIN-PATTERNS.md, PROCESS-GUARD.md, VALIDATION.md, PROCESS-API.md, and TAXONOMY.md
