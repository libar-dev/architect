@libar-docs
@libar-docs-pattern:DocsConsolidationStrategy
@libar-docs-status:roadmap
@libar-docs-phase:35
@libar-docs-effort:3w
@libar-docs-product-area:Generation
@libar-docs-depends-on:CodecDrivenReferenceGeneration
@libar-docs-business-value:eliminates-1600-lines-of-manually-maintained-docs-via-code-first-generation
@libar-docs-priority:high
Feature: Documentation Consolidation Strategy

  **Problem:**
  14 manually-maintained docs (~5,400 lines in `docs/`) duplicate information that
  already exists in annotated source code and generated reference documents. Code
  changes require updating both source annotations and manual docs, creating
  maintenance burden and inevitable drift. ARCHITECTURE.md alone is 1,287 lines,
  much of which the codec system already generates from annotations.

  **Solution:**
  A 6-phase consolidation that replaces manual doc sections with generated equivalents
  using convention tags, reference doc configs, product area absorption, and the
  preamble capability. Each phase identifies a section of manual documentation,
  validates that a generated equivalent exists or creates one, then replaces the
  manual content with a pointer to the generated output.

  **Why It Matters:**
  | Benefit | How |
  | Single source of truth | Manual docs cannot drift from code when generated from annotations |
  | Reduced maintenance | ~1,600 fewer manual lines to maintain across 6 phases |
  | Consistent quality | Generated docs always reflect current annotation state |
  | AI context accuracy | Compact claude-md versions stay current automatically |
  | Incremental delivery | Each phase is independently deliverable as a single PR |

  Phase-specific scenarios will be added when each phase enters `active` status.

  **Scope:**
  | Document | Lines | Disposition |
  | ARCHITECTURE.md | 1,287 | Phases 2 + 4: codec listings extracted, remaining sections decomposed |
  | PROCESS-GUARD.md | 341 | Phase 3: enhanced ValidationRulesCodec |
  | TAXONOMY.md | 105 | Phase 1: redirect to generated taxonomy output |
  | ANNOTATION-GUIDE.md | 268 | Phase 5: trim 30 lines of duplicated tag reference |
  | CONFIGURATION.md | 357 | Phase 5: trim 67 lines of duplicated preset detail |
  | INDEX.md | 354 | Phase 6: update navigation for hybrid manual+generated structure |
  | METHODOLOGY.md | 238 | Keep: philosophy and core thesis |
  | SESSION-GUIDES.md | 389 | Keep: workflow guides and checklists |
  | GHERKIN-PATTERNS.md | 515 | Keep: tutorial and instructional |
  | PROCESS-API.md | 507 | Keep: CLI reference |
  | PUBLISHING.md | 144 | Keep: operational npm publishing |
  | README.md | ~504 | Keep: landing page |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Preamble capability on ReferenceDocConfig | complete | src/renderable/codecs/reference.ts | Yes | unit |
      | Phase 1 - Taxonomy consolidation | pending | delivery-process.config.ts | Yes | integration |
      | Phase 2 - Codec listings extraction | complete | delivery-process.config.ts, src/renderable/codecs/*.ts | Yes | integration |
      | Phase 3 - Process Guard consolidation | pending | src/renderable/codecs/validation-rules.ts | Yes | integration |
      | Phase 4 - Architecture decomposition | pending | docs/ARCHITECTURE.md | Yes | integration |
      | Phase 5 - Guide trimming | pending | docs/ANNOTATION-GUIDE.md, docs/CONFIGURATION.md | No | n/a |
      | Phase 6 - Index navigation update | pending | docs/INDEX.md | No | n/a |

  Rule: Convention tags are the primary consolidation mechanism

    **Invariant:** Each consolidation phase follows the same pattern: register a
    convention tag value in `src/taxonomy/conventions.ts`, annotate source files with
    `@libar-docs-convention` tags using structured JSDoc, add a `ReferenceDocConfig`
    entry in `delivery-process.config.ts`, and replace the manual doc section with a
    pointer to the generated reference document.

    **Rationale:** Convention-tagged source code annotations are the only sustainable
    way to keep documentation in sync with implementation. The reference codec
    (`createReferenceCodec`) already handles the 4-layer composition (conventions,
    diagrams, shapes, behaviors) so each phase only needs annotation work and config.

    **Verified by:** Convention tag produces generated reference,
    Phase 2 demonstrates the pattern end-to-end

    @acceptance-criteria @happy-path
    Scenario: Convention tag produces a generated reference document
      Given source files annotated with a convention tag value
      And a ReferenceDocConfig entry matching that convention tag
      When the reference codec generates output
      Then a detailed docs/ file and a compact _claude-md/ file are produced
      And both contain the convention content extracted from source JSDoc

    @acceptance-criteria @happy-path
    Scenario: Manual doc section is replaced with pointer to generated doc
      Given a generated reference document covering a manual doc section
      When the manual section is consolidated
      Then the manual section is replaced with a 2-3 line summary and link
      And no content exists in both the manual doc and the generated doc

  Rule: Preamble preserves editorial context in generated docs

    **Invariant:** `ReferenceDocConfig.preamble` accepts `readonly SectionBlock[]`
    that are prepended before all generated content. Preamble sections appear in both
    detailed and summary (claude-md) outputs, followed by a separator. A config
    without preamble produces no extra separator or empty sections.

    **Rationale:** Not all documentation content can be extracted from code annotations.
    Introductory prose, cross-cutting context, and reading guides require human
    authorship. The preamble provides a designated place for this content within the
    generated document structure, avoiding the need for a separate hand-maintained file.

    **Verified by:** Preamble appears in both detail levels,
    Empty preamble produces no artifacts

    @acceptance-criteria @happy-path
    Scenario: Preamble sections appear before generated content
      Given a ReferenceDocConfig with preamble containing heading and paragraph blocks
      When the reference codec generates at both detail levels
      Then preamble sections appear first in both outputs
      And a separator follows the preamble before generated content

    @acceptance-criteria @edge-case
    Scenario: Config without preamble produces clean output
      Given a ReferenceDocConfig with no preamble field
      When the reference codec generates output
      Then no extra separator or empty section exists at the start

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

    @acceptance-criteria @happy-path
    Scenario: Phases can be implemented in any order
      Given the 6 consolidation phases
      Then no phase deliverable depends on another phase deliverable
      And each phase only depends on the base CodecDrivenReferenceGeneration capability

  Rule: Manual docs retain editorial and tutorial content

    **Invariant:** Documents containing philosophy (METHODOLOGY.md), workflow guides
    (SESSION-GUIDES.md), tutorials (GHERKIN-PATTERNS.md), CLI reference (PROCESS-API.md),
    and operational procedures (PUBLISHING.md) remain fully manual. These docs are
    ~2,300 lines total and contain instructional content that cannot be expressed as
    source annotations.

    **Rationale:** The consolidation targets sections most likely to drift when code
    changes: reference tables, codec listings, validation rules, API types. Editorial
    content (the "why", "how to use", and "when to use") changes at a different cadence
    and requires human judgment to update. Forcing this into annotations would produce
    worse documentation.

    **Verified by:** Retained docs have no generated equivalent,
    Consolidated docs preserve information completeness

    @acceptance-criteria @happy-path
    Scenario: Retained documents have no generated equivalent
      Given the 6 retained manual documents
      Then no ReferenceDocConfig exists targeting their content
      And their sections do not duplicate any generated output

    @acceptance-criteria @validation
    Scenario: Consolidation preserves information completeness
      Given a manual doc section being consolidated
      When compared with the generated reference that replaces it
      Then every fact in the manual section appears in the generated output
      And no information is lost in the consolidation
