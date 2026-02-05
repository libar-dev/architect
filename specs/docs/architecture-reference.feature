@libar-docs
@libar-docs-pattern:ArchitectureReference
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-core
@libar-docs-arch
@libar-docs-claude-md-section:architecture
Feature: Architecture Reference - Auto-Generated Documentation

  **Problem:**
  The ARCHITECTURE.md document (1300+ lines) describes the four-stage pipeline,
  MasterDataset schema, codec system, and block vocabulary. Maintaining this
  manually leads to drift from actual TypeScript interfaces and implementations.

  **Solution:**
  Auto-generate key architecture sections from annotated source code.
  TypeScript schemas define the data structures; documentation is a projection.
  Approximately 40% of content can be extracted from source annotations.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/ARCHITECTURE-REFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/architecture/architecture-reference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Design Principles | THIS DECISION (Rule: Design Principles) | Rule block table |
| Four-Stage Pipeline | THIS DECISION (Rule: Four-Stage Pipeline) | Rule block content + Mermaid |
| MasterDataset Schema | src/validation-schemas/master-dataset.ts | extract-shapes tag |
| RenderableDocument | src/renderable/schema.ts | extract-shapes tag |
| Block Vocabulary | THIS DECISION (Rule: Block Vocabulary) | Rule block table |
| Codec Factory Pattern | THIS DECISION (Rule: Codec Factory Pattern) | Rule block content |
| Generator Types | src/generators/types.ts | extract-shapes tag |
| Transform Function | src/generators/pipeline/transform-dataset.ts | extract-shapes tag |
| Available Codecs | src/renderable/generate.ts | extract-shapes tag + Rule: Available Codecs |
| Progressive Disclosure | THIS DECISION (Rule: Progressive Disclosure) | Rule block table |
| Codec to Generator Mapping | src/renderable/generate.ts | extract-shapes tag + Rule: Codec to Generator Mapping |
| Status Normalization | src/taxonomy/normalized-status.ts | extract-shapes tag + Rule: Status Normalization |
| Result Monad Pattern | THIS DECISION (Rule: Result Monad Pattern) | Rule block content |
| Orchestrator Pipeline | THIS DECISION (Rule: Orchestrator Pipeline) | Rule block table + Mermaid |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Architecture reference feature file | Complete | specs/docs/architecture-reference.feature |
      | Generated detailed docs | Pending | docs-generated/docs/ARCHITECTURE-REFERENCE.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/architecture/architecture-reference.md |

  Rule: Design Principles

    **Context:** The package follows specific architectural principles.

    **Decision:** These are the key design principles:

| Principle | Description |
| --- | --- |
| Single Source of Truth | Code and .feature files are authoritative; docs are generated projections |
| Single-Pass Transformation | All derived views computed in O(n) time, not redundant O(n) per section |
| Codec-Based Rendering | Zod 4 codecs transform MasterDataset to RenderableDocument to Markdown |
| Schema-First Validation | Zod schemas define types; runtime validation at all boundaries |
| Result Monad | Explicit error handling via Result T,E instead of exceptions |

  Rule: Four-Stage Pipeline

    **Context:** The documentation generation pipeline consists of four stages.

    **Decision:** The four stages are:

| Stage | Purpose | Key Files | Input | Output |
| --- | --- | --- | --- | --- |
| Scanner | File discovery and AST parsing | pattern-scanner.ts, gherkin-scanner.ts | Source files | ScannedFile[] |
| Extractor | Pattern extraction from AST | doc-extractor.ts, gherkin-extractor.ts | ScannedFile[] | ExtractedPattern[] |
| Transformer | Single-pass view computation | transform-dataset.ts | ExtractedPattern[] | MasterDataset |
| Codec | Document generation | codecs/*.ts, render.ts | MasterDataset | Markdown files |

    **Pipeline Diagram:**

    """mermaid
    graph LR
        CONFIG[CONFIG] --> SCANNER
        SCANNER[SCANNER<br/>TypeScript + Gherkin<br/>files] --> EXTRACTOR
        EXTRACTOR[EXTRACTOR<br/>ExtractedPattern[]] --> TRANSFORMER
        TRANSFORMER[TRANSFORMER<br/>MasterDataset<br/>pre-computed views] --> CODEC
        CODEC[CODEC<br/>RenderableDocument<br/>to Markdown]
    """

  Rule: MasterDataset Schema

    **Context:** MasterDataset is the central data structure with all pre-computed views.

    **Decision:** The schema contains:

    - patterns: All extracted patterns (both TypeScript and Gherkin)
    - tagRegistry: Tag registry for category lookups
    - byStatus: Patterns grouped by normalized status (completed, active, planned)
    - byPhase: Patterns grouped by phase number with pre-computed counts
    - byQuarter: Patterns grouped by quarter (e.g., "Q4-2024")
    - byCategory: Patterns grouped by category
    - bySource: Patterns grouped by source type (typescript, gherkin, roadmap, prd)
    - counts: Overall status counts (completed, active, planned, total)
    - relationshipIndex: Optional dependency graph (uses, usedBy, dependsOn, enables)
    - archIndex: Optional architecture index for diagram generation

    See src/validation-schemas/master-dataset.ts for the complete Zod schema.

  Rule: RenderableDocument Schema

    **Context:** RenderableDocument is the universal intermediate format.

    **Decision:** All document codecs output this format. The renderer converts it to markdown.

    - title: Document title (becomes H1)
    - purpose: Optional description (rendered as blockquote)
    - detailLevel: Optional detail level indicator
    - sections: Array of SectionBlock (the document content)
    - additionalFiles: Record of path to RenderableDocument for progressive disclosure

    See src/renderable/schema.ts for block builders and type definitions.

  Rule: Block Vocabulary

    **Context:** RenderableDocument uses a fixed vocabulary of 9 section block types.

    **Decision:** Block types are grouped by purpose:

| Category | Block Types | Markdown Output |
| --- | --- | --- |
| Structural | heading, paragraph, separator | ## Title, text, --- |
| Content | table, list, code, mermaid | tables, lists, fenced code |
| Progressive | collapsible, link-out | details/summary, links to files |

    **Block Type Details:**

| Block | Key Properties | Usage |
| --- | --- | --- |
| heading | level (1-6), text | Section headers |
| paragraph | text | Body text |
| separator | (none) | Horizontal rules |
| table | columns, rows, alignment | Data tables |
| list | ordered, items | Bullet or numbered lists |
| code | language, content | Code snippets |
| mermaid | content | Mermaid diagrams |
| collapsible | summary, content | Expandable sections |
| link-out | text, path | Links to detail files |

  Rule: Codec Factory Pattern

    **Context:** Every codec provides both a default instance and a factory function.

    **Decision:** The two-export pattern enables both simple and customized usage:

    """typescript
    // Default codec with standard options
    import { PatternsDocumentCodec } from './codecs';
    const doc = PatternsDocumentCodec.decode(dataset);

    // Factory for custom options
    import { createPatternsCodec } from './codecs';
    const codec = createPatternsCodec({ generateDetailFiles: false });
    const doc = codec.decode(dataset);
    """

    **Common Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| generateDetailFiles | boolean | true | Create progressive disclosure files |
| detailLevel | summary, standard, detailed | standard | Output verbosity |
| limits.recentItems | number | 10 | Max recent items in summaries |
| limits.collapseThreshold | number | 5 | Items before collapsing |

  Rule: Available Codecs

    **Context:** The package provides multiple specialized codecs for different documentation needs.

    **Decision:** Codecs are grouped by purpose. Pattern-focused codecs generate pattern registries, requirements, and ADRs. Timeline-focused codecs generate roadmaps, milestones, current work, and changelogs. Session-focused codecs generate session context, remaining work, PR changes, and traceability views. Planning codecs generate checklists, session plans, and findings.

    See src/renderable/generate.ts for the complete DOCUMENT_TYPES registry with all codecs, output paths, and descriptions.

  Rule: Progressive Disclosure

    **Context:** Large documents are split into main index plus detail files.

    **Decision:** Each codec has specific split logic:

| Codec | Split By | Detail Path Pattern |
| --- | --- | --- |
| patterns | Category | patterns/category.md |
| roadmap | Phase | phases/phase-N-name.md |
| milestones | Quarter | milestones/quarter.md |
| current | Active Phase | current/phase-N-name.md |
| requirements | Product Area | requirements/area-slug.md |
| session | Incomplete Phase | sessions/phase-N-name.md |
| remaining | Incomplete Phase | remaining/phase-N-name.md |
| adrs | Category (at threshold) | decisions/category-slug.md |
| pr-changes | None | Single file only |

    **Detail Level Options:**

| Value | Behavior |
| --- | --- |
| summary | Minimal output, key metrics only |
| standard | Default with all sections |
| detailed | Maximum detail, all optional sections |

  Rule: Status Normalization

    **Context:** Source annotations use various status values that must be normalized.

    **Decision:** All status values are normalized to three canonical display states: completed, active, and planned. The STATUS_NORMALIZATION_MAP in src/taxonomy/normalized-status.ts defines the mapping from raw FSM states to display buckets.

    See src/taxonomy/normalized-status.ts for NORMALIZED_STATUS_VALUES, STATUS_NORMALIZATION_MAP, and the normalizeStatus function.

  Rule: Codec to Generator Mapping

    **Context:** Each codec is exposed via a CLI generator flag.

    **Decision:** The CODEC_MAP and CODEC_FACTORY_MAP in src/renderable/generate.ts define the mapping from generator names to codec instances and factory functions. Generator names match the CLI -g flag values (e.g., -g patterns, -g roadmap).

    See src/renderable/generate.ts for DOCUMENT_TYPES (output paths), CODEC_MAP (default instances), and CODEC_FACTORY_MAP (factory functions for custom options).

  Rule: Result Monad Pattern

    **Context:** The package uses explicit error handling instead of exceptions.

    **Decision:** All operations return Result T,E for type-safe error handling:

    """typescript
    type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

    // Usage
    const result = await scanPatterns(options);
    if (result.ok) {
      const { files } = result.value;
    } else {
      console.error(result.error);
    }
    """

    **Benefits:**
    - No exception swallowing
    - Partial success scenarios supported
    - Type-safe error handling at boundaries

  Rule: Orchestrator Pipeline

    **Context:** The orchestrator coordinates the complete documentation generation pipeline.

    **Decision:** The orchestrator executes these steps:

| Step | Operation | Key Function |
| --- | --- | --- |
| 1 | Load configuration | loadConfig() |
| 2 | Scan TypeScript sources | scanPatterns() |
| 3 | Extract TypeScript patterns | extractPatterns() |
| 4 | Scan Gherkin sources | scanGherkinFiles() |
| 5 | Extract Gherkin patterns | extractPatternsFromGherkin() |
| 6 | Merge patterns | mergePatterns() |
| 7 | Compute hierarchy | computeHierarchyChildren() |
| 8 | Transform to MasterDataset | transformToMasterDataset() |
| 9 | Run codecs | Codec.decode() for each generator |
| 10 | Write output files | fs.writeFile() |

    **Orchestrator Flow Diagram:**

    """mermaid
    flowchart TB
        A[loadConfig] --> B[scanPatterns]
        B --> C[extractPatterns]
        D[scanGherkinFiles] --> E[extractPatternsFromGherkin]
        C --> F[mergePatterns]
        E --> F
        F --> G[computeHierarchyChildren]
        G --> H[transformToMasterDataset]
        H --> I[For each generator]
        I --> J[Codec.decode]
        J --> K[renderDocumentWithFiles]
        K --> L[fs.writeFile]
    """

  @acceptance-criteria
  Scenario: Reference generates Architecture documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with pipeline architecture
    And compact docs are generated with essential reference
    And MasterDataset schema is documented
    And RenderableDocument types are documented
    And block vocabulary table is present
    And codec mapping table is present
    And Mermaid diagrams are included in output
