@libar-docs
@libar-docs-pattern:DocsConsolidationStrategy
@libar-docs-status:roadmap
@libar-docs-phase:35
@libar-docs-effort:4w
@libar-docs-product-area:Generation
@libar-docs-depends-on:CodecDrivenReferenceGeneration
@libar-docs-business-value:right-size-all-14-manual-docs-via-generation-relocation-and-audience-alignment
@libar-docs-priority:high
Feature: Documentation Consolidation Strategy

  **Problem:**
  14 manually-maintained docs (~5,400 lines in `docs/`) duplicate information that
  already exists in annotated source code and generated reference documents. Code
  changes require updating both source annotations and manual docs, creating
  maintenance burden and inevitable drift.

  **Solution:**
  A 6-phase consolidation that replaces manual doc sections with generated equivalents
  using convention tags, reference doc configs, product area absorption, and the
  preamble capability. Each phase validates that a generated equivalent exists or
  creates one, then replaces the manual content with a pointer to the generated output.

  **Why It Matters:**
  | Benefit | How |
  | Single source of truth | Manual docs cannot drift from code when generated from annotations |
  | Reduced maintenance | ~2,400 fewer manual lines to maintain across 10 phases |
  | Consistent quality | Generated docs always reflect current annotation state |
  | AI context accuracy | Compact claude-md versions stay current automatically |
  | Incremental delivery | Each phase is independently deliverable as a single PR |

  **Scope:**
  | Document | Lines | Disposition |
  | ARCHITECTURE.md | 1,287 | Phases 2 + 4: codec listings extracted, remaining sections decomposed to ~320 lines |
  | PROCESS-GUARD.md | 341 | Phase 3: enhanced ValidationRulesCodec |
  | TAXONOMY.md | 105 | Phase 1: redirect to generated taxonomy output |
  | ANNOTATION-GUIDE.md | 268 | Phase 5: trim 30 lines of duplicated tag reference |
  | CONFIGURATION.md | 357 | Phase 5: trim 67 lines of duplicated preset detail |
  | INDEX.md | 354 | Phase 6: update navigation for hybrid manual+generated structure |
  | METHODOLOGY.md | 238 | Keep: philosophy and core thesis |
  | SESSION-GUIDES.md | 389 | Phase 39: retained as public reference; CLAUDE.md session section generated from annotated behavior specs |
  | GHERKIN-PATTERNS.md | 515 | Phase 41: trim to ~250 lines, Step Linting moves to VALIDATION.md |
  | PROCESS-API.md | 507 | Phase 43: keep prose, generate 3 reference tables from CLI schema |
  | PUBLISHING.md | 144 | Phase 40: relocate to MAINTAINERS.md at repo root |
  | README.md | ~504 | Phase 42: trim to ~150 lines, move pitch content to website |
  | docs-generated/ structure | n/a | Phase 37: consolidate to docs-live/ as single output directory |
  | Generated doc quality | n/a | Phase 38: fix REFERENCE-SAMPLE duplication, enrich Generation compact, add TOC |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Preamble capability on ReferenceDocConfig | complete | src/renderable/codecs/reference.ts | Yes | unit |
      | Phase 1 - Taxonomy consolidation | pending | delivery-process.config.ts | Yes | integration |
      | Phase 2 - Codec listings extraction | complete | delivery-process.config.ts, src/renderable/codecs/*.ts | Yes | integration |
      | Phase 3 - Process Guard consolidation | complete | src/renderable/codecs/validation-rules.ts | Yes | integration |
      | Phase 4 - Architecture decomposition | complete | docs/ARCHITECTURE.md | Yes | integration |
      | Phase 5 - Guide trimming | pending | docs/ANNOTATION-GUIDE.md, docs/CONFIGURATION.md | No | n/a |
      | Phase 6 - Index navigation update | pending | docs/INDEX.md | No | n/a |
      | Phase 37 - docs-live/ directory consolidation | complete | delivery-process.config.ts | Yes | integration |
      | Phase 38 - Generated doc quality improvements | pending | src/renderable/codecs/reference.ts | Yes | integration |
      | Phase 39 - Session workflow CLAUDE.md module generation | complete | delivery-process/specs/, _claude-md/workflow/ | No | n/a |
      | Phase 40 - PUBLISHING.md relocation to MAINTAINERS.md | complete | docs/PUBLISHING.md | No | n/a |
      | Phase 41 - GHERKIN-PATTERNS.md restructure | complete | docs/GHERKIN-PATTERNS.md, docs/VALIDATION.md | No | n/a |
      | Phase 42 - README.md rationalization | complete | README.md | No | n/a |
      | Phase 43 - PROCESS-API.md hybrid generation | complete | docs/PROCESS-API.md, src/cli/ | Yes | integration |
      | Promote architecture generator from preview to docs:all | complete | package.json, delivery-process.config.ts | No | n/a |
      | Promote changelog generator from preview to docs:all | complete | package.json, delivery-process.config.ts | No | n/a |

  Rule: Convention tags are the primary consolidation mechanism

    **Invariant:** Each consolidation phase follows the same pattern: register a
    convention tag value in `src/taxonomy/conventions.ts`, annotate source files with
    `@libar-docs-convention` tags using structured JSDoc, add a `ReferenceDocConfig`
    entry in `delivery-process.config.ts`, and replace the manual doc section with a
    pointer to the generated reference document.

    **Rationale:** Convention-tagged annotations are the only sustainable way to keep
    docs in sync with implementation. The reference codec (`createReferenceCodec`)
    already handles the 4-layer composition so each phase only needs annotation work
    and config — no new codec infrastructure required.

    **Verified by:** Convention tag produces generated reference,
    Phase 2 demonstrates the pattern end-to-end

    @acceptance-criteria @happy-path
    Scenario: Convention tag produces a generated reference document
      Given source files annotated with a convention tag value
      And a ReferenceDocConfig entry matching that convention tag
      When the reference codec generates output
      Then a detailed docs/ file and a compact _claude-md/ file are produced
      And both contain the convention content extracted from source JSDoc

  Rule: Preamble preserves editorial context in generated docs

    **Invariant:** `ReferenceDocConfig.preamble` accepts `readonly SectionBlock[]`
    that are prepended before all generated content. Preamble sections appear in both
    detailed and summary (claude-md) outputs, followed by a separator. A config
    without preamble produces no extra separator or empty sections.

    **Rationale:** Not all documentation content can be extracted from code annotations.
    Introductory prose, cross-cutting context, and reading guides require human
    authorship. The preamble provides a designated place for this content within the
    generated document structure, avoiding a separate hand-maintained file.

    **Verified by:** Preamble appears in both detail levels,
    Empty preamble produces no artifacts

    @acceptance-criteria @happy-path
    Scenario: Preamble sections appear before generated content
      Given a ReferenceDocConfig with preamble containing heading and paragraph blocks
      When the reference codec generates at both detail levels
      Then preamble sections appear first in both outputs
      And a separator follows the preamble before generated content

  Rule: Each consolidation phase is independently deliverable

    **Invariant:** Each phase can be implemented and validated independently. A phase
    is complete when: the manual doc section has been replaced with a pointer to the
    generated equivalent, `pnpm docs:all` produces the generated output without errors,
    and the generated content covers the replaced manual content. No phase requires
    another uncompleted phase to function.

    **Rationale:** Independent phases allow incremental consolidation without blocking
    on the full initiative. Each merged PR reduces manual maintenance immediately.
    Phase ordering in the plan is a suggested sequence (simplest first), not a
    dependency chain.

    **Verified by:** Phases have no inter-dependencies,
    Each phase validates independently

    @acceptance-criteria @happy-path
    Scenario: Completed phase validates independently
      Given Phase 2 (codec listings) is complete
      And Phase 1 (taxonomy) is not started
      When running documentation generation
      Then Phase 2 generated output is correct
      And no errors relate to incomplete phases

  Rule: Manual docs retain editorial and tutorial content

    **Invariant:** Documents containing philosophy (METHODOLOGY.md), workflow guides
    (SESSION-GUIDES.md), tutorials (GHERKIN-PATTERNS.md), CLI reference (PROCESS-API.md),
    and operational procedures (PUBLISHING.md) remain fully manual. These docs are
    ~2,300 lines total and contain instructional content that cannot be expressed as
    source annotations.

    **Rationale:** The consolidation targets sections most likely to drift when code
    changes: reference tables, codec listings, validation rules, API types. Editorial
    content changes at a different cadence and requires human judgment to update.
    Forcing this into annotations would produce worse documentation.

    **Verified by:** Retained docs have no generated equivalent,
    Consolidated docs preserve information completeness

    @acceptance-criteria @happy-path
    Scenario: Retained documents have no generated equivalent
      Given the 6 retained manual documents
      Then no ReferenceDocConfig exists targeting their content
      And their sections do not duplicate any generated output

  Rule: Audience alignment determines document location

    **Invariant:** Each document lives in the location matching its primary audience:
    `docs/` (deployed to libar.dev) for content that serves package users and developers;
    repo root for GitHub-visible metadata (CONTRIBUTING.md, SECURITY.md, MAINTAINERS.md);
    CLAUDE.md for AI session context. A document appearing in docs/ must be useful to
    a developer or user visiting the website — maintainer-only operational procedures
    (npm publishing workflow, GitHub Actions setup) belong at the repo root.

    **Rationale:** The audit found PUBLISHING.md (maintainer-only) in docs/ alongside
    user-facing guides. SESSION-GUIDES.md (AI session procedures) duplicates CLAUDE.md
    with 95% overlap. Audience mismatches increase website noise for users and
    create drift risk when the same content lives in two locations.

    **Verified by:** No maintainer-only content in docs/,
    No AI-session content duplicated between docs/ and CLAUDE.md

    @acceptance-criteria @happy-path
    Scenario: Maintainer content does not appear in website docs
      Given the docs/ directory after Phase 40 (PublishingRelocation)
      Then no file in docs/ contains npm publishing or GitHub Actions workflow instructions
      And those instructions exist in MAINTAINERS.md at the repo root
