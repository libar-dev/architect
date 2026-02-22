@libar-docs
@libar-docs-pattern:ArchitectureDocRefactoring
@libar-docs-status:roadmap
@libar-docs-phase:36
@libar-docs-effort:2d
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocsConsolidationStrategy
@libar-docs-business-value:decomposes-1287-line-manual-architecture-doc-into-curated-overview-with-generated-references
@libar-docs-priority:high
Feature: Architecture Document Refactoring

  **Problem:**
  ARCHITECTURE.md is 1,287 lines of manually-maintained documentation covering 14
  sections. The codec system already generates much of this content (codec references
  via convention tags, MasterDataset types via shape extraction, pipeline diagrams
  via architecture annotations). Maintaining parallel manual and generated versions
  creates drift and duplication.

  **Solution:**
  Decompose ARCHITECTURE.md into a curated architecture overview (~400 lines of
  editorial narrative) that links to generated reference documents for detailed
  content. Phase 2 established the convention-tag pattern by extracting the 368-line
  Available Codecs section. Phase 4 applies similar techniques to the remaining
  ~690 lines of consolidatable content using product area absorption, generated
  shapes, and architecture diagram references.

  **Why It Matters:**
  | Benefit | How |
  | Reduced drift | Generated sections always match current code annotations |
  | Focused overview | Editorial narrative explains "why" without duplicating "what" |
  | Dual output | Each generated section gets docs/ detailed + _claude-md/ compact versions |
  | Convention-driven | Adding a new codec only requires adding a convention tag to its JSDoc |

  **Section Disposition (line ranges approximate -- verify before Phase 4):**
  | Section | Lines | Action | Target |
  | Executive Summary | 28-69 | Keep | Editorial narrative |
  | Configuration Architecture | 70-139 | Phase 4: absorb | Configuration product area |
  | Four-Stage Pipeline | 140-343 | Keep, trim | Editorial narrative (core concepts) |
  | Unified Transformation | 345-478 | Phase 4: generate | Shapes reference doc (MasterDataset types) |
  | Codec Architecture | 481-527 | Keep | Editorial narrative (concepts only) |
  | Available Codecs | 529-534 | Phase 2: done | Pointer to ARCHITECTURE-CODECS.md |
  | Progressive Disclosure | 535-584 | Keep | Editorial narrative |
  | Source Systems | 585-692 | Phase 4: absorb | Annotation product area |
  | Key Design Patterns | 693-772 | Phase 4: absorb | CoreTypes product area |
  | Data Flow Diagrams | 774-957 | Phase 4: generate | Architecture diagrams reference |
  | Workflow Integration | 959-1068 | Phase 4: absorb | Process product area |
  | Programmatic Usage | 1070-1125 | Keep | Editorial narrative (external consumer guide) |
  | Extending the System | 1127-1194 | Keep | Editorial narrative (tutorial) |
  | Quick Reference | 1196-1287 | Phase 2: done | Pointer to ARCHITECTURE-CODECS.md + CLI |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Convention-tag codec-registry on 14 codec files | complete | src/renderable/codecs/*.ts | Yes | integration |
      | Machine-extractable JSDoc format for codecs | complete | src/renderable/codecs/*.ts | Yes | integration |
      | Codec-registry reference config | complete | delivery-process.config.ts | Yes | integration |
      | Convention-extractor heading match bugfix | complete | src/renderable/codecs/convention-extractor.ts | Yes | unit |
      | Available Codecs section replaced with pointer | complete | docs/ARCHITECTURE.md | No | n/a |
      | Configuration Architecture to product area | pending | docs/ARCHITECTURE.md | Yes | integration |
      | MasterDataset Schema to shapes reference | pending | docs/ARCHITECTURE.md | Yes | integration |
      | Source Systems to Annotation product area | pending | docs/ARCHITECTURE.md | Yes | integration |
      | Data Flow Diagrams to architecture diagrams | pending | docs/ARCHITECTURE.md | Yes | integration |
      | Workflow Integration to Process product area | pending | docs/ARCHITECTURE.md | Yes | integration |
      | Key Design Patterns to CoreTypes product area | pending | docs/ARCHITECTURE.md | Yes | integration |

  Rule: Convention-tagged JSDoc produces machine-extractable codec documentation

    **Invariant:** Every codec source file annotated with `@libar-docs-convention
    codec-registry` must have structured JSDoc following the machine-extractable
    format. The convention extractor splits multi-codec files by `## Heading` into
    separate convention rules, each rendered as its own section in the generated
    reference document.

    **Rationale:** DD-1: Convention tag approach over dedicated codec. Rather than
    creating a new "codec inventory" codec that enumerates codecs from source, the
    existing convention-tag mechanism is reused. Each codec file's JSDoc is treated
    as convention rules tagged with `codec-registry`. This avoids new codec
    infrastructure and leverages the proven convention extractor path. The reference
    codec already handles 4-layer composition, so convention tags slot into the
    existing Layer 1 (conventions) position.

    **Verified by:** Multi-codec file produces separate sections,
    Options table renders in both detail levels,
    Codec without structured JSDoc produces fallback content

    @acceptance-criteria @happy-path
    Scenario: Multi-codec file produces separate convention sections
      Given a codec file with three codecs under separate headings
        """
        ## SessionContextCodec
        **Purpose:** Current session context for AI agents.
        **Output Files:** SESSION-CONTEXT.md

        ## RemainingWorkCodec
        **Purpose:** Incomplete work across phases.
        **Output Files:** REMAINING-WORK.md

        ## CurrentWorkCodec
        **Purpose:** Active development work in progress.
        **Output Files:** CURRENT-WORK.md
        """
      And the file is annotated with @libar-docs-convention codec-registry
      When the convention extractor processes the file
      Then three separate convention rules are produced
      And each rule has its own Purpose and Output Files

    @acceptance-criteria @happy-path
    Scenario: Options table renders correctly in both detail levels
      Given a codec JSDoc with an options table
        """
        | Option | Type | Default | Description |
        | generateDetailFiles | boolean | true | Create phase detail files |
        | detailLevel | string | standard | Output verbosity level |
        """
      When the reference codec generates at detailed level
      Then the options table appears with all columns
      When the reference codec generates at summary level
      Then the options table appears in the compact output

    @acceptance-criteria @edge-case
    Scenario: Codec file without structured JSDoc produces fallback
      Given a codec file with @libar-docs-convention codec-registry
      But the JSDoc lacks structured headings
      When the convention extractor processes the file
      Then the entire JSDoc description is treated as a single convention rule

  Rule: Machine-extractable JSDoc format follows structured heading convention

    **Invariant:** DD-2: Multi-codec JSDoc splitting uses one `## Heading` per codec
    per file. Each heading block contains structured fields in a fixed order:
    `**Purpose:**` one-liner, `**Output Files:**` file paths, options table with
    Type/Default/Description columns, `**When to Use:**` bullet list, and
    `**Factory Pattern:**` code example. Fields are optional -- codecs without options
    omit the table, codecs without factory patterns omit the code block.

    **Rationale:** The convention extractor uses `## ` heading regex to split
    descriptions into rules. Without this structure, a file like `session.ts`
    (3 codecs) would produce a single undifferentiated blob. The heading text becomes
    the convention rule title in the generated reference. The fixed field order ensures
    consistent rendering across all 20+ codec entries.

    **Verified by:** Heading text becomes convention rule title,
    Field order is consistent across all codec files

    @acceptance-criteria @happy-path
    Scenario: Heading text becomes the convention rule title
      Given a codec JSDoc heading "## ValidationRulesCodec"
      When the convention extractor splits the description
      Then the convention rule title is "ValidationRulesCodec"
      And the content below the heading becomes the rule body

    @acceptance-criteria @validation
    Scenario: All codec files follow the structured format
      Given the 14 codec files tagged with codec-registry
      Then each file has at least one heading starting with "## "
      And each heading block contains a "Purpose:" field
      And each heading block contains an "Output Files:" field

  Rule: Heading match in convention extractor handles whitespace correctly

    **Invariant:** The convention extractor's heading parser uses `matchEnd` (the
    character position after the full regex match) rather than `indexOf('\n',
    heading.index)` to calculate where content starts after a heading. This prevents
    the `\s*` prefix in the heading regex from consuming leading newlines, which
    would cause `heading.index` to point to those newlines instead of the heading text.

    **Rationale:** Discovered during Phase 2 implementation. The heading regex
    `/^\s*##\s+(.+)$/gm` matches headings with optional leading whitespace. When a
    heading has leading newlines, `heading.index` points to the first newline (part
    of the `\s*` match), not the `##` character. Using `indexOf('\n', heading.index)`
    then finds the newline BEFORE the heading, producing content that includes the
    heading text itself. The fix uses the regex match's end position directly.

    **Verified by:** Heading with leading whitespace splits correctly,
    Heading at start of description splits correctly

    @acceptance-criteria @happy-path
    Scenario: Convention extraction splits headings with leading whitespace
      Given a JSDoc description with a heading preceded by blank lines
      When the convention extractor splits the description
      Then the heading text is extracted without leading whitespace
      And the content starts after the heading line

    @acceptance-criteria @edge-case
    Scenario: Heading at start of description splits correctly
      Given a JSDoc description starting directly with a heading
      When the convention extractor splits the description
      Then the heading is extracted as the first rule
      And no empty content precedes it

  Rule: Section disposition follows content-type routing

    **Invariant:** DD-3: Each ARCHITECTURE.md section is routed based on content type.
    Three routing strategies apply: (1) product area absorption -- sections describing
    a specific pipeline stage move to the corresponding product area document where
    they get live diagrams and relationship graphs; (2) generated shapes -- sections
    documenting TypeScript interfaces move to generated shape reference docs;
    (3) generated diagrams -- ASCII/text data flow diagrams are replaced by live
    Mermaid diagrams generated from architecture annotations.

    **Rationale:** The routing heuristic is: if a generated equivalent already exists,
    replace with pointer; if content is convention-taggable in source files, tag and
    generate; if editorial content that cannot be expressed as annotations, retain.
    This ensures each section lands in the location with the best maintenance model
    for its content type.

    **Verified by:** Product area absorption captures equivalent content,
    Shape reference covers MasterDataset documentation,
    No content is lost in routing

    @acceptance-criteria @happy-path
    Scenario: Product area absorption captures section content
      Given the Configuration Architecture section in ARCHITECTURE.md
      And the Configuration product area doc with annotated source content
      When the section is compared with the product area output
      Then the product area doc covers the same config resolution flow
      And the ARCHITECTURE.md section can be replaced with a pointer

    @acceptance-criteria @happy-path
    Scenario: Shape reference covers MasterDataset documentation
      Given the Unified Transformation section with MasterDataset schema
      And TypeScript types tagged with @libar-docs-shape in the source
      When a shapes reference doc config targets MasterDataset types
      Then the generated shapes section contains the same type definitions
      And the manual schema documentation can be replaced

    @acceptance-criteria @validation
    Scenario: No content is lost in section routing
      Given all sections being routed to generated equivalents
      When each manual section is compared with its target generated doc
      Then every technical fact in the manual section appears in the generated output
      And editorial context is preserved in the retained overview sections
