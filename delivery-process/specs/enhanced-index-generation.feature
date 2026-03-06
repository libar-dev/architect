@libar-docs
@libar-docs-pattern:EnhancedIndexGeneration
@libar-docs-status:active
@libar-docs-phase:35
@libar-docs-effort:2w
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocsConsolidationStrategy
@libar-docs-business-value:replaces-354-line-manual-INDEX-md-with-auto-generated-navigation-hub-combining-statistics-and-editorial-reading-paths
@libar-docs-priority:medium
Feature: Enhanced Index Generation

  **Problem:**
  `docs/INDEX.md` (354 lines) is a manually maintained navigation hub with audience-based
  reading orders, per-document detailed TOC, document roles matrix, quick navigation
  table, and key concepts glossary. The auto-generated `docs-live/INDEX.md` (112 lines)
  is a simple file listing with regeneration commands. It lacks audience navigation,
  document role context, pattern statistics, and phase progress summaries. When documents
  are added, renamed, or restructured, the manual index drifts from the actual doc set.

  **Solution:**
  Create an `IndexCodec` that generates a comprehensive navigation hub by composing
  auto-generated statistics from MasterDataset pre-computed views with editorial
  navigation content via the preamble mechanism. The codec produces document listings,
  pattern counts per product area, and phase progress from `byCategory`, `byPhase`,
  `byProductArea`, and `byStatus` views. Audience reading paths, the document roles
  matrix, and the quick finder table use `ReferenceDocConfig.preamble` as manually
  authored `SectionBlock[]`. The generated output replaces both `docs/INDEX.md` and
  `docs-live/INDEX.md` with a single unified navigation document.

  **Why It Matters:**
  | Benefit | How |
  | Single navigation hub | Unifies manual docs/ and generated docs-live/ listings in one document |
  | Zero-drift statistics | Pattern counts, phase progress, product area coverage regenerated from MasterDataset |
  | Audience paths preserved | Editorial reading orders carried via preamble, not duplicated manually |
  | Document roles matrix | Audience-to-document mapping maintained in config, rendered in output |
  | Closes Phase 6 | Completes DocsConsolidationStrategy Phase 6 (Index navigation update, pending) |

  **Scope:**
  | Content Type | Auto-generatable? | Source |
  | Product area and generated doc listing | Yes | File system scan plus MasterDataset |
  | Pattern statistics per area | Yes | dataset.byProductArea view |
  | Phase progress summary | Yes | dataset.byStatus plus dataset.byPhase |
  | Audience reading paths (New User, Developer, Team Lead) | No | Preamble SectionBlock[] |
  | Document roles matrix (Audience x Document x Focus) | No | Preamble SectionBlock[] |
  | Quick finder table (If you want X, read Y) | No | Preamble SectionBlock[] |
  | Key concepts glossary | Partially | Could derive from pattern metadata or use preamble |
  | Per-document section inventory with line ranges | Partially | Would need markdown AST parsing |

  **Design Questions (for design session):**
  | Question | Options | Recommendation |
  | Create new IndexCodec or extend existing index generator? | (A) New IndexCodec, (B) Extend docs-live/INDEX.md generator | (A) New codec -- current generator is a simple file lister with no MasterDataset access |
  | How to merge manual and generated doc listings? | (A) Unified table, (B) Separate sections | (A) Unified -- users should not need to know which docs are manual vs generated |
  | Should audience paths be preamble or a new annotation type? | (A) Preamble, (B) New annotation | (A) Preamble -- reading orders are editorial judgment, not code-derivable |
  | Can key concepts be derived from pattern metadata? | (A) Yes from descriptions, (B) No, use preamble | (B) Preamble -- pattern descriptions are too granular for a glossary |
  | How to handle hybrid docs/ and docs-live/ structure? | (A) Single merged listing, (B) Two sections with cross-links | (A) Merged -- audience sees one doc set, not two directories |

  **Design Session Findings (2026-03-06):**
  | Finding | Impact | Resolution |
  | DD-1: New IndexCodec registered in CodecRegistry as document type index | Enables MasterDataset access via standard codec.decode(dataset) pipeline and free integration with generateDocument, generateAllDocuments, CodecOptions | Create createIndexCodec() factory following OverviewCodec pattern, register in CodecRegistry and DOCUMENT_TYPES |
  | DD-2: Document entries configured statically, not via filesystem discovery | Codec remains pure (no I/O), deterministic, testable. Config updated alongside document changes | IndexCodecOptions.documentEntries: readonly DocumentEntry[] with title, path, description, audience, topic |
  | DD-3: Audience reading paths are full preamble SectionBlock arrays | Reading order is editorial judgment -- no annotation can express pedagogical sequencing. Most-cited navigation aid preserved | IndexCodecOptions.preamble contains READING_ORDER_SECTIONS with 3 audience profiles |
  | DD-4: Key concepts glossary uses preamble, not annotation extraction | Pattern descriptions too granular for reader-friendly glossary. Future libar-docs-glossary annotation could replace this | KEY_CONCEPTS_SECTIONS in preamble with 6 core concept definitions |
  | DD-5: Standalone IndexCodec, NOT a ReferenceDocConfig entry | ReferenceDocConfig 4-layer composition (conventions, diagrams, shapes, behaviors) does not apply to navigation documents. Index has no convention tags, scoped diagrams, shapes, or behavior categories | IndexCodec registered directly in CodecRegistry. Reuses preamble pattern from ReferenceDocConfig without type coupling |
  | docs-live/INDEX.md is a static file, not code-generated | No existing generator to extend or replace. The current file was manually authored | New codec produces INDEX.md as its output, replacing the static file entirely |
  | Section ordering: preamble first, statistics second | Reading paths and quick finder are highest-value navigation. Statistics are supplementary context | Matches existing manual INDEX.md structure. Preamble appears before auto-generated sections |
  | computeStatusCounts and completionPercentage utilities already exist | No new utility code needed for statistics sections | Import from src/renderable/utils.ts, same as buildProductAreaIndex in reference-generators.ts |

  **Design Stubs:**
  | Stub | Location | Purpose |
  | index-codec-options.ts | delivery-process/stubs/enhanced-index-generation/index-codec-options.ts | IndexCodecOptions interface, DocumentEntry type, section visibility toggles, DD-1 and DD-5 rationale |
  | index-codec.ts | delivery-process/stubs/enhanced-index-generation/index-codec.ts | createIndexCodec() factory, buildIndexDocument pipeline, section builder signatures, DD-1 rationale |
  | index-preamble-config.ts | delivery-process/stubs/enhanced-index-generation/index-preamble-config.ts | Example preamble SectionBlock arrays, document entries, DD-2 DD-3 DD-4 rationale |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Create IndexCodec with MasterDataset-driven statistics | complete | src/renderable/codecs/index-codec.ts | Yes | unit |
      | Register IndexCodec in codec registry and generator config | complete | src/renderable/generate.ts | Yes | integration |
      | Preamble content for audience paths, document roles, quick finder | complete | docs-sources/index-navigation.md | No | n/a |
      | CodecOptions entry for enhanced INDEX.md | complete | delivery-process.config.ts | Yes | integration |
      | Replace docs/INDEX.md with pointer to generated output | complete | docs/INDEX.md | No | n/a |
      | Behavior spec with scenarios for index generation | superseded | n/a | No | n/a |

  Rule: IndexCodec composes generated statistics with editorial navigation

    **Invariant:** The IndexCodec generates document listings and pattern statistics
    from MasterDataset pre-computed views (`byCategory`, `byPhase`, `byProductArea`,
    `byStatus`), while audience reading paths, the document roles matrix, and the
    quick finder table use the `ReferenceDocConfig.preamble` mechanism as manually
    authored `SectionBlock[]`. The codec does not hardcode document metadata -- all
    statistics are derived from the dataset at generation time. Editorial content
    changes at authorial cadence via config edits, not code changes.

    **Rationale:** Approximately 40% of INDEX.md content (product area lists, file
    inventories, pattern statistics, phase progress) is directly derivable from
    MasterDataset views and drifts when patterns change status or new patterns are
    added. The remaining 60% (audience paths, document roles, quick finder) requires
    human editorial judgment about which documents serve which readers. The preamble
    mechanism cleanly separates these two content types within a single generated
    output, as proven by CodecDrivenReferenceGeneration and DocsConsolidationStrategy
    Phase 2.

    **Verified by:** Codec produces statistics from MasterDataset,
    Preamble editorial content appears before generated sections

    @acceptance-criteria @happy-path
    Scenario: IndexCodec generates pattern statistics from MasterDataset
      Given a MasterDataset with patterns across 7 product areas
      And patterns have statuses including roadmap, active, and completed
      When the IndexCodec generates the index document
      Then a product area statistics table shows pattern counts per area
      And a phase progress summary shows counts by status
      And all statistics match the MasterDataset view contents

    @acceptance-criteria @validation
    Scenario: Statistics update when patterns change status
      Given a MasterDataset where 3 patterns moved from roadmap to completed
      When the IndexCodec regenerates the index document
      Then the phase progress summary reflects the updated status counts
      And product area statistics reflect the new completed count

  Rule: Audience reading paths are first-class sections

    **Invariant:** Three audience profiles exist in the generated index: New User,
    Developer/AI, and Team Lead/CI. Each profile has a curated reading order that
    lists documents in recommended sequence with a one-line description of what each
    document provides for that audience. Reading paths appear prominently after the
    quick navigation table and before the auto-generated statistics sections. The
    reading paths are sourced from preamble, not derived from pattern metadata.

    **Rationale:** The manual INDEX.md reading orders are consistently cited as the
    most useful navigation aid by developers onboarding to the project. A flat
    alphabetical file listing (as in the current docs-live/INDEX.md) forces readers
    to guess which documents are relevant to their role. Audience-specific paths
    reduce time-to-relevance from minutes of scanning to seconds of following a
    curated sequence. This content is inherently editorial -- no annotation can
    express "read this third because it builds on concepts from document two."

    **Verified by:** Three audience reading paths appear in output,
    Reading paths precede auto-generated statistics

    @acceptance-criteria @happy-path
    Scenario: Generated index contains three audience reading paths
      Given an IndexCodec with preamble containing three audience profiles
      And the profiles are New User and Developer/AI and Team Lead/CI
      When the IndexCodec generates the index document
      Then three reading order sections appear with curated document sequences
      And each reading order lists documents with one-line descriptions
      And reading paths appear before auto-generated statistics sections

    @acceptance-criteria @validation
    Scenario: Reading paths are not derived from pattern metadata
      Given an IndexCodec with audience paths defined in preamble
      When inspecting the codec source code
      Then no audience path content is computed from MasterDataset
      And all reading order content originates from the preamble SectionBlock array

  Rule: Index unifies manual and generated doc listings

    **Invariant:** The generated index covers both `docs/` (manual reference documents)
    and `docs-live/` (generated reference documents) in a single unified navigation
    structure. Documents are organized by topic or audience, not by source directory.
    The reader does not need to know whether a document is manually authored or
    auto-generated. Each document entry includes its title, a brief description, and
    its primary audience. The directory source (docs/ or docs-live/) appears only in
    the link path, not as a section heading or organizational axis.

    **Rationale:** The current documentation set splits across two directories for
    implementation reasons (manual vs generated), but this split is meaningless to
    readers. A developer looking for architecture documentation should find one entry,
    not separate entries under "Manual Docs" and "Generated Docs" sections. The unified
    listing follows the same principle as a library catalog -- books are organized by
    subject, not by whether they were hand-typeset or digitally printed.

    **Verified by:** No section heading references docs/ or docs-live/ as category,
    Documents from both directories appear in unified tables

    @acceptance-criteria @happy-path
    Scenario: Documents from both directories appear in unified navigation
      Given manual documents exist in docs/ including ARCHITECTURE.md and METHODOLOGY.md
      And generated documents exist in docs-live/ including PRODUCT-AREAS.md and DECISIONS.md
      When the IndexCodec generates the index document
      Then all documents appear in topic-organized sections
      And no section heading uses docs/ or docs-live/ as an organizational label
      And each document entry includes title, description, and audience

    @acceptance-criteria @validation
    Scenario: Quick navigation table includes both manual and generated documents
      Given the preamble contains a quick finder table
      When the IndexCodec generates the index document
      Then the quick finder table maps goals to documents regardless of source directory
      And links resolve correctly to both docs/ and docs-live/ paths

  Rule: Document metadata drives auto-generated sections

    **Invariant:** Pattern counts per product area, phase progress summaries, and
    product area coverage percentages are derived from MasterDataset pre-computed views
    at generation time. The IndexCodec accesses `dataset.byProductArea` for area
    statistics, `dataset.byStatus` for status distribution, and `dataset.byPhase` for
    phase ordering. No statistics are hardcoded in the codec or config. When a pattern
    changes status or a new pattern is added, regenerating the index reflects the
    change without any manual update.

    **Rationale:** The manual INDEX.md has no statistics section because maintaining
    accurate counts manually is unsustainable across 196+ patterns. The MasterDataset
    pre-computed views provide O(1) access to grouped pattern data. Surfacing these
    statistics in the index gives readers an at-a-glance project health overview
    (how many patterns per area, what percentage are completed, which phases are
    active) that was previously only available via the Process Data API CLI.

    **Verified by:** Statistics section renders from MasterDataset views,
    No hardcoded counts exist in codec or config

    @acceptance-criteria @happy-path
    Scenario: Product area statistics render from MasterDataset
      Given a MasterDataset with byProductArea containing 7 product areas
      And each area has between 5 and 40 patterns
      When the IndexCodec generates the auto-generated statistics section
      Then a table shows each product area with its pattern count
      And the total across all areas matches the dataset pattern count

    @acceptance-criteria @happy-path
    Scenario: Phase progress summary shows status distribution
      Given a MasterDataset with byStatus containing roadmap, active, and completed patterns
      When the IndexCodec generates the phase progress section
      Then a summary shows the count of patterns in each status
      And a completion percentage is calculated from completed vs total

    @acceptance-criteria @validation
    Scenario: Empty product area still appears in statistics
      Given a MasterDataset where the CoreTypes product area has zero patterns
      When the IndexCodec generates the statistics section
      Then CoreTypes appears in the table with a count of zero
      And no error occurs due to the empty area
