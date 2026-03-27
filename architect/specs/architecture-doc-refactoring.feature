@architect
@architect-pattern:ArchitectureDocRefactoring
@architect-status:completed
@architect-unlock-reason:Implement-test-coverage-and-fix-spec-metadata
@architect-phase:36
@architect-effort:2d
@architect-product-area:Generation
@architect-depends-on:DocsConsolidationStrategy
@architect-business-value:decomposes-1287-line-manual-architecture-doc-into-curated-overview-with-generated-references
@architect-priority:high
Feature: Architecture Document Refactoring

  **Problem:**
  ARCHITECTURE.md is 1,287 lines of manually-maintained documentation covering 14
  sections. The codec system already generates much of this content (codec references
  via convention tags, MasterDataset types via shape extraction, pipeline diagrams
  via architecture annotations). Maintaining parallel manual and generated versions
  creates drift and duplication.

  **Solution:**
  Decompose ARCHITECTURE.md into a curated architecture overview (~320 lines of
  editorial narrative optimized for Claude as primary consumer) that links to generated
  reference documents for detailed content. Phase 2 established the convention-tag
  pattern by extracting the 368-line Available Codecs section. Phase 4 applies
  product area absorption, generated shapes, architecture diagram references, and
  usefulness-driven editorial trimming to the remaining consolidatable content.

  **Why It Matters:**
  | Benefit | How |
  | Reduced drift | Generated sections always match current code annotations |
  | Focused overview | Editorial narrative explains "why" without duplicating "what" |
  | Dual output | Each generated section gets docs/ detailed + _claude-md/ compact versions |
  | Convention-driven | Adding a new codec only requires adding a convention tag to its JSDoc |

  **Section Disposition (line ranges from original 1,287-line pre-refactoring document):**
  | Section | Lines | Action | Target |
  | Executive Summary | 28-69 | Keep | Editorial narrative |
  | Configuration Architecture | 70-139 | Phase 4: absorb | Configuration product area |
  | Four-Stage Pipeline | 140-343 | Keep, trim | Editorial narrative (core concepts) |
  | Unified Transformation | 345-478 | Phase 4: generate | Shapes reference doc (MasterDataset types) |
  | Codec Architecture | 481-527 | Keep | Editorial narrative (concepts only) |
  | Available Codecs | 529-534 | Phase 2: done | Pointer to ARCHITECTURE-CODECS.md |
  | Progressive Disclosure | 535-584 | Keep | Editorial narrative |
  | Source Systems | 585-692 | Phase 4: absorb | Annotation product area (examples merge to Pipeline) |
  | Key Design Patterns | 693-772 | Phase 4: trim | Result pointer to CoreTypes, summaries for others (DD-5) |
  | Data Flow Diagrams | 774-957 | Phase 4: generate | Architecture diagrams reference |
  | Workflow Integration | 959-1068 | Phase 4: absorb | Process product area |
  | Programmatic Usage | 1070-1125 | Phase 4: drop | Claude reads source directly (DD-9) |
  | Extending the System | 1127-1194 | Phase 4: drop | Claude infers from codec patterns (DD-9) |
  | Quick Reference | 1196-1287 | Phase 2: done | Pointer to ARCHITECTURE-CODECS.md + CLI |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Convention-tag codec-registry on 14 codec files | complete | src/renderable/codecs/*.ts | Yes | integration |
      | Machine-extractable JSDoc format for codecs | complete | src/renderable/codecs/*.ts | Yes | integration |
      | Codec-registry reference config | complete | architect.config.ts | Yes | integration |
      | Convention-extractor heading match bugfix | complete | src/renderable/codecs/convention-extractor.ts | Yes | unit |
      | Available Codecs section replaced with pointer | complete | docs/ARCHITECTURE.md | No | n/a |
      | Configuration Architecture to product area | complete | docs/ARCHITECTURE.md | Yes | integration |
      | MasterDataset Schema to shapes reference | complete | docs/ARCHITECTURE.md | Yes | integration |
      | Source Systems to Annotation product area | complete | docs/ARCHITECTURE.md | Yes | integration |
      | Data Flow Diagrams to architecture diagrams | complete | docs/ARCHITECTURE.md | Yes | integration |
      | Workflow Integration to Process product area | complete | docs/ARCHITECTURE.md | Yes | integration |
      | Key Design Patterns to CoreTypes product area | complete | docs/ARCHITECTURE.md | Yes | integration |
      | Usefulness-driven editorial trim (DD-9) | complete | docs/ARCHITECTURE.md | No | n/a |

  Rule: Convention-tagged JSDoc produces machine-extractable codec documentation

    **Invariant:** Every codec source file annotated with `@architect-convention
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
      And the file is annotated with @architect-convention codec-registry
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
      Given a codec file with @architect-convention codec-registry
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
      And TypeScript types tagged with @architect-shape in the source
      When a shapes reference doc config targets MasterDataset types
      Then the generated shapes section contains the same type definitions
      And the manual schema documentation can be replaced

    @acceptance-criteria @validation
    Scenario: No content is lost in section routing
      Given all sections being routed to generated equivalents
      When each manual section is compared with its target generated doc
      Then every technical fact in the manual section appears in the generated output
      And editorial context is preserved in the retained overview sections

  Rule: Product area absorption validates content coverage before pointer replacement

    **Invariant:** DD-4: Product area absorption replaces ARCHITECTURE.md sections with
    pointers only when the target product area document already covers the equivalent
    content. Three sections route to product areas: Configuration Architecture (L70-139)
    to CONFIGURATION.md, Source Systems (L585-692) to ANNOTATION.md, and Workflow
    Integration (L959-1068) to PROCESS.md. Annotation format examples from Source
    Systems merge into the Four-Stage Pipeline retained section rather than being lost.
    Workflow API code examples are dropped -- Claude reads source files directly.

    **Rationale:** Product area documents are generated from annotated source code and
    already contain live diagrams, relationship graphs, and API types. Absorbing manual
    Architecture sections into these generated docs eliminates drift while preserving
    the content in a maintained location. The key test is: does the product area doc
    cover the same technical facts? If yes, the manual section becomes a 4-line pointer.

    **Verified by:** Configuration section covered by product area,
    Source Systems covered with annotation examples preserved,
    Workflow Integration covered without API tutorials,
    Annotation format examples appear in Four-Stage Pipeline

    @acceptance-criteria @happy-path
    Scenario: Configuration Architecture section absorbed by Configuration product area
      Given the Configuration Architecture section in ARCHITECTURE.md (L70-139)
      And the generated CONFIGURATION.md product area document
      When the product area content is compared with the manual section
      Then CONFIGURATION.md covers config resolution flow, presets, and key types
      And the manual section is replaced with a 4-line pointer

    @acceptance-criteria @happy-path
    Scenario: Source Systems section absorbed by Annotation product area
      Given the Source Systems section in ARCHITECTURE.md (L585-692)
      And the generated ANNOTATION.md product area document
      When the product area content is compared with the manual section
      Then ANNOTATION.md covers scanner types, tag dispatch, and extraction pipeline
      And annotation format examples (L598-631) merge into Four-Stage Pipeline section
      And the manual section is replaced with a 4-line pointer

    @acceptance-criteria @happy-path
    Scenario: Workflow Integration section absorbed by Process product area
      Given the Workflow Integration section in ARCHITECTURE.md (L959-1068)
      And the generated PROCESS.md product area document
      When the product area content is compared with the manual section
      Then PROCESS.md covers FSM lifecycle, session types, and workflow handoffs
      And API code examples are dropped because Claude reads source directly
      And the manual section is replaced with a 4-line pointer

    @acceptance-criteria @validation
    Scenario: Annotation format examples preserved in Four-Stage Pipeline section
      Given the annotation format examples from Source Systems (L598-631)
      When the Source Systems section is absorbed
      Then the annotation format examples appear in the Four-Stage Pipeline section
      And the examples explain how to read and write libar-docs tags

  Rule: MasterDataset shapes generate a dedicated ARCHITECTURE-TYPES reference document

    **Invariant:** DD-6: A new ReferenceDocConfig produces ARCHITECTURE-TYPES.md using
    shapeSelectors with group master-dataset to extract MasterDataset schema types,
    RuntimeMasterDataset, RawDataset, PipelineOptions, and PipelineResult. Source files
    tagged with @architect-shape master-dataset and @architect-include master-dataset
    contribute shapes to the reference doc. The Unified Transformation section (L345-478)
    is replaced with a condensed narrative (~15 lines) and pointer to ARCHITECTURE-TYPES.md.

    **Rationale:** The MasterDataset is the central data structure -- the sole read model
    per ADR-006. It deserves dedicated reference doc treatment alongside ARCHITECTURE-CODECS.md.
    Shape extraction from TypeScript declarations provides exact type signatures that stay
    in sync with code, unlike the manual schema table in ARCHITECTURE.md.

    **Verified by:** MasterDataset shapes extracted into reference doc,
    Pipeline types included alongside schema types,
    Unified Transformation section replaced with pointer

    @acceptance-criteria @happy-path
    Scenario: MasterDataset shapes extracted via shape selectors
      Given source files tagged with @architect-shape master-dataset
      And a ReferenceDocConfig with shapeSelectors targeting master-dataset group
      When the reference codec generates ARCHITECTURE-TYPES.md
      Then MasterDatasetSchema, RuntimeMasterDataset, and RawDataset types appear
      And each shape includes its TypeScript declaration and JSDoc description

    @acceptance-criteria @happy-path
    Scenario: Pipeline types included in ARCHITECTURE-TYPES reference doc
      Given PipelineOptions and PipelineResult tagged with @architect-shape master-dataset
      And @architect-include master-dataset on their source files
      When the reference codec generates ARCHITECTURE-TYPES.md
      Then PipelineOptions and PipelineResult shapes appear in the API Types section
      And both detailed and compact outputs are produced

    @acceptance-criteria @happy-path
    Scenario: Unified Transformation section replaced with pointer and narrative
      Given the Unified Transformation section in ARCHITECTURE.md (L345-478)
      And ARCHITECTURE-TYPES.md generated with MasterDataset shapes
      When the section is consolidated
      Then the section is replaced with a condensed narrative and pointer
      And the narrative explains MasterDataset role as the sole read model
      And no type definitions remain in ARCHITECTURE.md

  Rule: Pipeline architecture convention content replaces ASCII data flow diagrams

    **Invariant:** DD-7: The Data Flow Diagrams section (L774-957) contains 4 ASCII
    diagrams totaling ~183 lines. These are replaced using a hybrid approach: convention
    tag pipeline-architecture (already registered, currently unused) on orchestrator.ts
    and build-pipeline.ts produces prose descriptions of pipeline steps and consumer
    architecture. A new master-dataset-views hardcoded diagram source generates a
    Mermaid fan-out diagram showing dataset view relationships. DD-8: Both convention
    content and diagram source are configured on the ARCHITECTURE-TYPES.md ReferenceDocConfig,
    keeping all architecture reference content in one generated document.

    **Rationale:** ASCII diagrams cannot be generated from code annotations. The hybrid
    approach maximizes generated coverage: convention-tagged JSDoc captures the narrative
    (pipeline steps, ADR-006 consumer pattern) while the hardcoded diagram source produces
    visual Mermaid output. Using the already-registered pipeline-architecture convention
    tag avoids new taxonomy entries.

    **Verified by:** Convention tag produces pipeline flow content,
    Diagram source generates Mermaid fan-out,
    Data Flow Diagrams section replaced with pointer

    @acceptance-criteria @happy-path
    Scenario: Convention tag pipeline-architecture produces pipeline flow content
      Given orchestrator.ts annotated with @architect-convention pipeline-architecture
      And build-pipeline.ts annotated with @architect-convention pipeline-architecture
      When the reference codec generates ARCHITECTURE-TYPES.md
      Then convention content describing pipeline steps appears in the document
      And consumer architecture patterns from build-pipeline.ts appear

    @acceptance-criteria @happy-path
    Scenario: master-dataset-views diagram source generates Mermaid fan-out diagram
      Given master-dataset-views added to DIAGRAM_SOURCE_VALUES in reference.ts
      And buildMasterDatasetViewsDiagram builder function implemented
      And ARCHITECTURE-TYPES.md config includes master-dataset-views in diagramScopes
      When the reference codec generates the document
      Then a Mermaid diagram showing MasterDataset view fan-out is rendered
      And the diagram appears in both detailed and compact outputs

    @acceptance-criteria @happy-path
    Scenario: Data Flow Diagrams section replaced with pointer to generated reference
      Given ARCHITECTURE-TYPES.md generated with convention content and diagrams
      When the Data Flow Diagrams section (L774-957) is consolidated
      Then the 4 ASCII diagrams are removed from ARCHITECTURE.md
      And a 5-line pointer to ARCHITECTURE-TYPES.md replaces the section

  Rule: Usefulness-driven editorial trimming targets Claude as primary consumer

    **Invariant:** DD-9: ARCHITECTURE.md serves Claude (primary audience) and human
    developers (secondary). Content retained must answer architectural "why" and "how
    things connect" questions. Content available via source file reads or generated
    reference documents is removed. Post-decomposition target: ~320 lines (~75% reduction
    from 1,287 lines). Sections dropped entirely: Programmatic Usage (L1070-1125) and
    Extending the System (L1127-1194) -- Claude reads source files directly and infers
    extension patterns from existing codec implementations. DD-5: Key Design Patterns
    section (L693-772) trimmed from ~80 to ~15 lines: Result Monad becomes a pointer to
    CORE-TYPES.md, Schema-First Validation becomes a 3-line summary with source pointer,
    Tag Registry becomes a 4-line summary with source pointer.

    **Rationale:** Claude has direct access to source files and generated reference docs.
    Duplicating this content in ARCHITECTURE.md wastes context window tokens. The
    remaining editorial sections (Executive Summary, Four-Stage Pipeline, Codec Architecture,
    Progressive Disclosure) provide the mental model and architectural "why" that cannot
    be inferred from code alone.

    **Verified by:** Tutorial sections removed for Claude efficiency,
    Four-Stage Pipeline trimmed to conceptual model,
    Key Design Patterns trimmed to pointers and summaries,
    Post-decomposition file is under target size,
    Every pointer resolves to covering generated doc

    @acceptance-criteria @validation
    Scenario: Tutorial sections removed because Claude reads source directly
      Given the Programmatic Usage section (L1070-1125)
      And the Extending the System section (L1127-1194)
      When Phase 4 editorial trimming is applied
      Then both sections are removed entirely from ARCHITECTURE.md
      And no replacement pointers are needed because content is in source files

    @acceptance-criteria @validation
    Scenario: Key Design Patterns trimmed to pointers and summaries
      Given the Key Design Patterns section (L693-772) with three subsections
      When editorial trimming is applied
      Then Result Monad subsection is replaced with a pointer to CORE-TYPES.md
      And Schema-First Validation is trimmed to a 3-line summary with source pointer
      And Tag Registry is trimmed to a 4-line summary with source pointer
      And the section shrinks from ~80 to ~15 lines

    @acceptance-criteria @validation
    Scenario: Four-Stage Pipeline trimmed to conceptual model with annotation examples
      Given the Four-Stage Pipeline section (L140-343)
      When editorial trimming is applied
      Then the section is trimmed to approximately 120 lines
      And the conceptual pipeline model is retained
      And annotation format examples merged from Source Systems are included
      And detailed function walkthrough code is removed

    @acceptance-criteria @validation
    Scenario: Post-decomposition ARCHITECTURE.md is under 400 lines
      Given all Phase 4 pointer replacements are complete
      And editorial trimming is applied to retained sections
      When the final line count is measured
      Then ARCHITECTURE.md is approximately 320 lines
      And the document contains Executive Summary, Pipeline, Codec Architecture, and Progressive Disclosure

    @acceptance-criteria @validation
    Scenario: Every pointer links to a generated doc that covers the replaced content
      Given all Phase 4 pointer replacements in ARCHITECTURE.md
      When each pointer target is checked
      Then every pointer links to an existing generated document
      And the generated document contains the technical facts from the replaced section
