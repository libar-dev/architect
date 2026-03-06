@libar-docs
@libar-docs-pattern:ProceduralGuideCodec
@libar-docs-status:completed
@libar-docs-unlock-reason:DD7-DD8-preamble-migration-complete
@libar-docs-phase:35
@libar-docs-effort:3w
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocsConsolidationStrategy
@libar-docs-business-value:replaces-757-lines-of-manual-SESSION-GUIDES-and-ANNOTATION-GUIDE-with-generated-procedural-guides-using-dual-source-codec
@libar-docs-priority:medium
Feature: Procedural Guide Codec

  **Problem:**
  Two manual docs contain procedural content with no annotation source for generation:
  `docs/SESSION-GUIDES.md` (389 lines) has session decision trees, per-session checklists,
  prohibition lists, handoff templates, and discovery tag formats. `docs/ANNOTATION-GUIDE.md`
  (268 lines) has a getting-started walkthrough, shape extraction mode explanations, the Zod
  schema gotcha, file-type-specific annotation patterns, verification CLI recipes, and a
  troubleshooting table. Gap analysis (WP-7) found only ~5% of this content is
  auto-generatable from existing sources -- the remaining ~95% is procedural and editorial.

  The SessionGuidesModuleSource spec (Phase 39, completed) established 9 Rule: blocks with
  session workflow invariants and generates compact AI context to `_claude-md/workflow/`.
  However, these produce summary-level invariant statements for AI sessions, not the
  developer-facing step-by-step checklists and decision trees that SESSION-GUIDES.md provides.
  No generation path exists for the public-facing procedural guide content.

  **Solution:**
  Create a `ProceduralGuideCodec` that uses a dual-source composition pattern: auto-generated
  reference sections (tag reference tables, pattern statistics, session type contracts) are
  derived from MasterDataset and taxonomy sources, while procedural content (checklists,
  decision trees, getting-started walkthrough, troubleshooting tables) is authored as markdown
  files in `docs-sources/` and parsed into `SectionBlock[]` at config load time by
  `loadPreambleFromMarkdown()`. The codec produces two separate generated files -- one for
  session workflow guides and one for annotation guides -- since these serve different
  audiences (workflow practitioners vs annotation authors).

  Session workflow checklists are extracted from SessionGuidesModuleSource Rule: blocks and
  rendered as developer-facing checklists at the detailed level. Decision trees render as
  Mermaid flowchart diagrams, providing visual navigation that the manual docs express as
  ASCII text trees. The generated output supersedes the manual files only after reaching
  quality parity, respecting the SessionGuidesModuleSource invariant that SESSION-GUIDES.md
  "is not deleted, shortened, or replaced with a redirect" during the transition period.

  **Why It Matters:**
  | Benefit | How |
  | Zero-drift session contracts | Session type table, FSM error reference, execution order regenerated from Rule: blocks |
  | Dual audience from single source | SessionGuidesModuleSource Rule: blocks produce AI compact AND public checklists |
  | Visual decision trees | Mermaid flowcharts replace ASCII art, render correctly in Starlight website |
  | Separate guides for separate audiences | Session workflow guide and annotation guide are independent documents |
  | Quality-gated transition | Manual files retained until generated equivalents match or exceed quality |
  | Closes largest gap | WP-7 is the largest content gap (757 lines across 2 files with no generation source) |

  **Scope:**
  | Content Section | Source | Mechanism |
  | Session type decision tree | SessionGuidesModuleSource Rule 3 table | Auto-generated + Mermaid flowchart |
  | Per-session checklists (Planning, Design, Implementation) | SessionGuidesModuleSource Rules 4-6 tables | Auto-generated from Rule: block tables |
  | Session prohibition lists (Do NOT tables) | SessionGuidesModuleSource Rules 4, 6 tables | Auto-generated from Rule: block tables |
  | FSM error reference and escape hatches | SessionGuidesModuleSource Rule 7 tables | Auto-generated from Rule: block tables |
  | Handoff documentation template | SessionGuidesModuleSource Rule 8 | Auto-generated from Rule: block content |
  | Context gathering CLI commands | Cannot derive from annotations | Markdown source -> loadPreambleFromMarkdown() |
  | Getting-started annotation walkthrough | Cannot derive from annotations | Markdown source -> loadPreambleFromMarkdown() |
  | Shape extraction mode explanations | Cannot derive from annotations | Markdown source -> loadPreambleFromMarkdown() |
  | Zod schema gotcha and troubleshooting | Cannot derive from annotations | Markdown source -> loadPreambleFromMarkdown() |
  | Tag reference summary table | Taxonomy registry data | Auto-generated from MasterDataset |
  | Verification CLI recipes | Cannot derive from annotations | Markdown source -> loadPreambleFromMarkdown() |

  **Design Questions (for design session):**
  | Question | Options | Recommendation |
  | Should procedural content use new markers or preamble? | (A) New markers in Rule: blocks, (B) Preamble SectionBlock[] | (B) Preamble -- procedural content is editorial, not code-derivable |
  | Can SessionGuidesModuleSource serve both AI and public output? | (A) Yes with detail levels, (B) No, separate sources | (A) Yes -- Rule: blocks have structured tables extractable at both levels |
  | One combined codec or two separate codecs? | (A) One ProceduralGuideCodec with two configs, (B) Two separate codecs | (A) One codec -- same composition pattern, different ReferenceDocConfig entries |
  | Should ANNOTATION-GUIDE content stay manual? | (A) Fully manual, (B) Hybrid with tag reference auto-generated | (B) Hybrid -- tag reference tables derive from taxonomy, walkthrough uses preamble |
  | How to handle GHERKIN-PATTERNS.md overlap? | (A) Absorb into annotation guide, (B) Keep separate | (B) Keep separate -- GHERKIN-PATTERNS serves a different audience (spec authors vs annotation authors) |
  | Should preamble be authored as markdown or inline SectionBlock[]? | (A) Markdown parsed at config time, (B) Inline SectionBlock[] in config | (A) Markdown -- natural authoring format, reduces config by ~540 lines, preserves codec purity |

  **Design Session Findings (2026-03-06):**
  | Finding | Impact | Resolution |
  | DD-1: No new codec class needed -- reuse createReferenceCodec() with two ReferenceDocConfig entries | Eliminates codec implementation deliverable; reduces to config-only work | Two ReferenceDocConfig entries in delivery-process.config.ts with different preamble, includeTags, and output paths |
  | DD-2: SessionGuidesModuleSource Rules 3-8 tables already machine-extractable | buildBehaviorSectionsFromPatterns() + parseBusinessRuleAnnotations() + extractTablesFromDescription() handle all table formats | Use includeTags:session-workflows on SessionGuidesModuleSource to route behavior content to session guide |
  | DD-3: Checklists and decision trees use existing SectionBlock types | No new ChecklistBlock or DecisionTreeBlock needed; ListBlock with [ ] prefix = checkbox syntax; MermaidBlock = flowchart. SectionBlock[] produced by parsing markdown via loadPreambleFromMarkdown() | Zero schema/renderer changes required |
  | DD-4: Preamble is flat SectionBlock[] produced from markdown source files | No new named-section abstraction; heading blocks provide structure. Content authored as markdown in docs-sources/, parsed into SectionBlock[] at config import time -- not inline TypeScript object literals | Preserves same preamble composition pattern; authoring ergonomics improved |
  | DD-5: Annotation guide hybrid -- 95% preamble + 5% auto-generated tag tables | Stable editorial content as preamble; only tag reference tables auto-generated from taxonomy | Avoids circular dependency (guide about annotations needing annotations to generate) |
  | DD-6: Generated files in docs-live/reference/ alongside manual files in docs/ | No violation of SessionGuidesModuleSource Rule 1 invariant; side-by-side quality comparison possible | Manual files retained until quality audit confirms parity; then superseded with unlock-reason |
  | DD-7: Editorial content authored as markdown in docs-sources/ | Preamble SectionBlock[] parsed from markdown files at config import time by loadPreambleFromMarkdown(). Codec purity preserved -- codecs still receive in-memory SectionBlock[]. Config file reduced from 853 to ~310 lines (63% reduction). Natural authoring format for checklists, code blocks, tables, Mermaid diagrams | Two markdown source files: docs-sources/session-workflow-guide.md and docs-sources/annotation-guide.md |
  | DD-8: loadPreambleFromMarkdown() is a shared utility in src/renderable/ | Uses readFileSync (sync, runs at module import). Line-by-line state machine parses headings, paragraphs, code/mermaid blocks, tables, lists into SectionBlock[]. Available to all preamble consumers (ErrorGuideCodec, CliRecipeCodec) | Resolves path relative to project root. CollapsibleBlock and LinkOutBlock not parsed (no standard markdown syntax; current preamble content does not use them) |

  **Design Stubs:**
  | Stub | Purpose | Target |
  | delivery-process/stubs/procedural-guide-codec/procedural-codec-options.ts | Documents DD-1,DD-3,DD-4: no new options type, reuses ReferenceDocConfig | src/renderable/codecs/procedural-guide.ts |
  | delivery-process/stubs/procedural-guide-codec/procedural-codec.ts | Documents DD-1,DD-2,DD-5,DD-6,DD-7,DD-8: config entries with loadPreambleFromMarkdown() | delivery-process.config.ts |
  | delivery-process/stubs/procedural-guide-codec/session-guide-preamble.ts | DD-7: Markdown source file example + loadPreambleFromMarkdown() usage | delivery-process.config.ts |
  | delivery-process/stubs/procedural-guide-codec/annotation-guide-preamble.ts | DD-7: Markdown source file example + loadPreambleFromMarkdown() usage | delivery-process.config.ts |
  | delivery-process/stubs/procedural-guide-codec/load-preamble.ts | DD-8: loadPreambleFromMarkdown() utility interface and parsing spec | src/renderable/load-preamble.ts |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | ReferenceDocConfig entry for session workflow guide (DD-1: reuses createReferenceCodec) | complete | delivery-process.config.ts | Yes | integration |
      | ReferenceDocConfig entry for annotation guide (DD-1: reuses createReferenceCodec) | complete | delivery-process.config.ts | Yes | integration |
      | Add libar-docs-include:session-workflows tag to SessionGuidesModuleSource (DD-2) | complete | delivery-process/specs/session-guides-module-source.feature | No | n/a |
      | Create loadPreambleFromMarkdown() utility (DD-8) | complete | src/renderable/load-preamble.ts | Yes | unit |
      | Create session workflow guide markdown source (DD-7) | complete | docs-sources/session-workflow-guide.md | No | n/a |
      | Create annotation guide markdown source (DD-7) | complete | docs-sources/annotation-guide.md | No | n/a |
      | Migrate session workflow preamble to loadPreambleFromMarkdown() call (DD-7) | complete | delivery-process.config.ts | Yes | integration |
      | Migrate annotation guide preamble to loadPreambleFromMarkdown() call (DD-7) | complete | delivery-process.config.ts | Yes | integration |
      | Behavior spec with scenarios for procedural guide generation | n/a | tests/features/generation/procedural-guide-codec.feature | Yes | acceptance |
      | Quality comparison: generated vs manual content audit (DD-6) | n/a | docs/SESSION-GUIDES.md | No | n/a |

  Rule: Procedural guides use a dual-source codec

    **Invariant:** The ProceduralGuideCodec composes auto-generated reference sections
    (from MasterDataset and taxonomy) with manually-authored procedural content (from
    preamble `SectionBlock[]`). Auto-generated content covers ~5% of the output (tag
    reference tables, pattern statistics, session type contract tables extracted from
    Rule: blocks). The remaining ~95% is editorial preamble: checklists, decision trees,
    getting-started walkthroughs, troubleshooting tables, and verification recipes --
    authored as markdown files in `docs-sources/` and parsed into `SectionBlock[]` by
    `loadPreambleFromMarkdown()` at config load time. The codec does not attempt to
    generate procedural prose from annotations -- it provides a structured delivery
    vehicle that ensures preamble and reference content are composed in a consistent
    order with consistent formatting across both guide documents.

    **Rationale:** Gap analysis found that SESSION-GUIDES.md and ANNOTATION-GUIDE.md
    content is overwhelmingly procedural and editorial. Attempting to annotate checklists
    and walkthroughs as source code would produce worse documentation than hand-authoring.
    The dual-source pattern (proven by CodecDrivenReferenceGeneration, ErrorGuideCodec,
    and CliRecipeCodec) composes preamble editorial content with auto-generated reference
    sections. The codec's value is not in generating the procedural content but in
    providing a single output pipeline that keeps reference tables current while carrying
    editorial content in a consistent structure.

    **Verified by:** Codec output contains both preamble and generated sections,
    Generated reference sections update when source data changes

    @acceptance-criteria @happy-path
    Scenario: ProceduralGuideCodec composes preamble with generated reference
      Given a ProceduralGuideCodec configured with preamble checklist content
      And the MasterDataset contains session type metadata from SessionGuidesModuleSource
      When the codec generates the session workflow guide
      Then preamble checklist sections appear first in the output
      And auto-generated session type contract tables follow the preamble
      And tag reference tables from taxonomy data appear in the reference section

    @acceptance-criteria @validation
    Scenario: Generated reference sections update when source data changes
      Given the SessionGuidesModuleSource spec adds a new session type to Rule 3
      When the ProceduralGuideCodec regenerates the session workflow guide
      Then the session type contract table includes the new session type
      And preamble content is unchanged

  Rule: Session workflow checklists derive from annotated Rule: blocks

    **Invariant:** The SessionGuidesModuleSource spec's Rule: blocks (Rules 3-8) are the
    canonical source for session workflow invariants. The ProceduralGuideCodec extracts
    structured tables from these Rule: blocks and renders them as developer-facing
    checklists at the detailed level. The same Rule: blocks produce compact invariant
    statements for `_claude-md/workflow/` modules at the summary level. Two audiences
    (public developers and AI sessions) are served from a single annotated source with
    different rendering detail levels. The codec does not duplicate or re-derive Rule:
    block content -- it reads from MasterDataset's behavior extraction views.

    **Rationale:** SessionGuidesModuleSource already captures session type contracts
    (Rule 3), planning constraints (Rule 4), design constraints (Rule 5), implementation
    execution order (Rule 6), FSM error reference (Rule 7), and handoff patterns (Rule 8)
    as structured tables within Rule: block descriptions. These tables contain the same
    information as the manual SESSION-GUIDES.md checklists, but in a machine-extractable
    format. Rendering these as developer-facing checklists eliminates the maintenance
    burden of keeping the manual file in sync with the spec, while the compact rendering
    for AI context was already delivered by Phase 39.

    **Verified by:** Checklists render from SessionGuidesModuleSource Rule: blocks,
    Both detail levels render from the same source

    @acceptance-criteria @happy-path
    Scenario: Session checklists render from Rule: block extraction
      Given SessionGuidesModuleSource contains Rule 4 with a planning Do/Do-NOT table
      And Rule 6 with an implementation execution order list
      When the ProceduralGuideCodec renders the session workflow guide at detailed level
      Then a Planning Session section contains a checklist derived from Rule 4
      And an Implementation Session section contains a numbered execution order from Rule 6
      And the checklist items match the Rule: block table content

    @acceptance-criteria @validation
    Scenario: Summary level produces compact invariants not full checklists
      Given the ProceduralGuideCodec configured for summary detail level
      When rendering the session workflow guide
      Then session type contracts appear as a compact table
      And full checklists are omitted in favor of invariant statements
      And the summary output is suitable for AI context consumption

  Rule: Annotation guide content remains separate from session guides

    **Invariant:** The ProceduralGuideCodec produces two separate generated files via two
    `ReferenceDocConfig` entries: one for session workflow guides (replacing SESSION-GUIDES.md)
    and one for annotation guides (replacing ANNOTATION-GUIDE.md). The session workflow guide
    targets workflow practitioners who need to know session type selection, execution order,
    and FSM error recovery. The annotation guide targets annotation authors who need to know
    opt-in markers, tag syntax, shape extraction modes, and verification steps. These
    audiences overlap but have distinct primary needs. The codec class is shared; the config
    entries and preamble content differ.

    **Rationale:** SESSION-GUIDES.md and ANNOTATION-GUIDE.md serve different audiences at
    different points in the development lifecycle. Merging them into a single guide would
    force annotation authors to navigate session workflow content and vice versa. The
    existing DocsConsolidationStrategy Phase 5 (Guide trimming) already treats them as
    separate documents. Using one codec class with two config entries follows the same
    pattern as `createReferenceCodec` producing multiple documents from different configs.

    **Verified by:** Two separate generated files from two config entries,
    Session guide has no annotation walkthrough content

    @acceptance-criteria @happy-path
    Scenario: Two separate guide files are generated
      Given the ProceduralGuideCodec with two ReferenceDocConfig entries
      And one entry targets session workflow guide output
      And the other entry targets annotation guide output
      When the codec generates both documents
      Then docs-live/reference/SESSION-WORKFLOW-GUIDE.md is created
      And docs-live/reference/ANNOTATION-REFERENCE.md is created
      And the two files have no duplicated sections

    @acceptance-criteria @validation
    Scenario: Session guide contains no annotation walkthrough content
      Given the generated session workflow guide
      When inspecting its sections
      Then no getting-started annotation walkthrough appears
      And no shape extraction mode explanation appears
      And the content focuses exclusively on session types, checklists, and FSM reference

  Rule: Decision trees render as Mermaid flowcharts

    **Invariant:** Session type decision trees and annotation workflow decision trees render
    as Mermaid flowchart diagrams in the detailed output level. The session type decision
    tree replaces the ASCII art tree in SESSION-GUIDES.md with a Mermaid `graph TD` diagram
    that renders as an interactive flowchart on the Starlight website. Decision tree content
    is authored as fenced mermaid code blocks in the markdown source file, parsed into
    `MermaidBlock` entries by `loadPreambleFromMarkdown()` at config load time. At summary
    level, decision trees render as compact text tables instead of diagrams.

    **Rationale:** The manual SESSION-GUIDES.md uses an ASCII art tree for the session
    decision flow, which renders poorly on the website and cannot be interacted with.
    Mermaid flowcharts are already supported by the Starlight website (proven by product
    area docs with C4Context and graph LR diagrams). Converting decision trees to Mermaid
    provides visual clarity, click-through navigation, and consistent rendering across
    platforms. The content block type `mermaid` is already one of the 9 supported
    SectionBlock types (proven by ReferenceDocShowcase).

    **Verified by:** Decision tree renders as Mermaid flowchart,
    Summary level uses text table instead of diagram

    @acceptance-criteria @happy-path
    Scenario: Session decision tree renders as Mermaid flowchart
      Given the session workflow guide preamble contains a Mermaid graph TD diagram
      And the diagram models the session type decision flow
      When the ProceduralGuideCodec renders at detailed level
      Then the output contains a Mermaid code block with the decision tree
      And the diagram includes nodes for Planning, Design, Implementation, and Planning+Design
      And decision edges use conditional labels

    @acceptance-criteria @validation
    Scenario: Summary level renders decision tree as text table
      Given the ProceduralGuideCodec configured for summary detail level
      When rendering the session workflow guide
      Then the decision tree appears as a compact text table mapping conditions to session types
      And no Mermaid code block appears in the summary output

  Rule: Generated guide supersedes manual only at quality parity

    **Invariant:** The manual `docs/SESSION-GUIDES.md` is retained in the repository
    until the generated equivalent matches or exceeds its quality across all content
    dimensions: completeness (all checklists present), accuracy (all FSM states current),
    visual clarity (decision trees render correctly), and usability (verified by comparison
    audit). The SessionGuidesModuleSource invariant ("not deleted, shortened, or replaced
    with a redirect") is respected during the transition period. The quality comparison
    deliverable produces an explicit audit document recording which sections have parity
    and which gaps remain. Only after the audit confirms full parity is the manual file
    replaced with a pointer to the generated output.

    **Rationale:** SESSION-GUIDES.md is cited in the SessionGuidesModuleSource spec as
    "the authoritative public human reference" serving developers on libar.dev. Replacing
    it prematurely with a generated equivalent that lacks checklists, has formatting issues,
    or omits edge cases would degrade the developer experience. The quality-gated approach
    ensures the generated version earns its place as the replacement by demonstrating
    equivalent or better quality, not merely by existing. This is the same principle applied
    by DocsConsolidationStrategy: "Manual docs retain editorial and tutorial content" until
    generation quality is sufficient.

    **Verified by:** Manual file retained during transition,
    Quality audit produces explicit parity assessment

    @acceptance-criteria @happy-path
    Scenario: Manual SESSION-GUIDES.md is retained during transition
      Given the ProceduralGuideCodec has generated docs-live/reference/SESSION-WORKFLOW-GUIDE.md
      And the quality audit has not yet confirmed parity
      When inspecting the repository
      Then docs/SESSION-GUIDES.md still exists with its original content
      And docs/SESSION-GUIDES.md is not shortened or replaced with a redirect
      And docs-live/reference/SESSION-WORKFLOW-GUIDE.md exists alongside it

    @acceptance-criteria @validation
    Scenario: Quality audit produces explicit parity assessment
      Given the generated session workflow guide and the manual SESSION-GUIDES.md
      When performing the quality comparison audit
      Then an audit record documents each section of SESSION-GUIDES.md
      And each section is marked as parity-achieved or gap-remaining
      And sections with gaps include a description of what is missing
