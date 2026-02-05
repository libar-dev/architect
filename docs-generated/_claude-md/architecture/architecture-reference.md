# ArchitectureReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Design Principles

**Context:** The package follows specific architectural principles.

    **Decision:** These are the key design principles:

| Principle | Description |
| --- | --- |
| Single Source of Truth | Code and .feature files are authoritative; docs are generated projections |
| Single-Pass Transformation | All derived views computed in O(n) time, not redundant O(n) per section |
| Codec-Based Rendering | Zod 4 codecs transform MasterDataset to RenderableDocument to Markdown |
| Schema-First Validation | Zod schemas define types; runtime validation at all boundaries |
| Result Monad | Explicit error handling via Result T,E instead of exceptions |

### Four-Stage Pipeline

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

### MasterDataset Schema

- `MasterDataset` - type
- `StatusGroups` - type
- `StatusCounts` - type
- `PhaseGroup` - type
- `SourceViews` - type
- `RelationshipEntry` - type
- `ArchIndex` - type

### RenderableDocument

- `RenderableDocument` - type
- `SectionBlock` - type
- `HeadingBlock` - type
- `TableBlock` - type
- `ListBlock` - type
- `CodeBlock` - type
- `MermaidBlock` - type
- `CollapsibleBlock` - type

### Block Vocabulary

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

### Codec Factory Pattern

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

### Generator Types

- `DocumentGenerator` - interface
- `GeneratorContext` - interface
- `GeneratorOutput` - interface

### Transform Function

- `RuntimeMasterDataset` - interface
- `RawDataset` - interface
- `transformToMasterDataset` - function

### Available Codecs

**Context:** The package provides multiple specialized codecs for different documentation needs.

    **Decision:** Codecs are grouped by purpose:

    **Pattern-Focused Codecs:**

| Codec | Output | Purpose |
| --- | --- | --- |
| PatternsDocumentCodec | PATTERNS.md + patterns/*.md | Pattern registry by category |
| RequirementsDocumentCodec | PRODUCT-REQUIREMENTS.md | PRD grouped by product area |
| AdrDocumentCodec | DECISIONS.md + decisions/*.md | Architecture Decision Records |

    **Timeline-Focused Codecs:**

| Codec | Output | Purpose |
| --- | --- | --- |
| RoadmapDocumentCodec | ROADMAP.md + phases/*.md | Development roadmap by phase |
| CompletedMilestonesCodec | COMPLETED-MILESTONES.md | Historical record by quarter |
| CurrentWorkCodec | CURRENT-WORK.md | Active development work |
| ChangelogCodec | CHANGELOG.md | Keep a Changelog format |

    **Session-Focused Codecs:**

| Codec | Output | Purpose |
| --- | --- | --- |
| SessionContextCodec | SESSION-CONTEXT.md | Current session for AI agents |
| RemainingWorkCodec | REMAINING-WORK.md | Incomplete work summary |
| PrChangesCodec | working/PR-CHANGES.md | PR-scoped view by changed files |
| TraceabilityCodec | TRACEABILITY.md | Timeline to behavior coverage |

    **Planning Codecs:**

| Codec | Output | Purpose |
| --- | --- | --- |
| PlanningChecklistCodec | PLANNING-CHECKLIST.md | Pre-planning questions |
| SessionPlanCodec | SESSION-PLAN.md | Implementation plans |
| SessionFindingsCodec | SESSION-FINDINGS.md | Retrospective discoveries |

### Progressive Disclosure

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

### Codec Mapping

**Context:** Each codec is exposed via a CLI generator flag.

    **Decision:** The mapping from codec to generator name:

| Codec | Generator Name | CLI Flag |
| --- | --- | --- |
| PatternsDocumentCodec | patterns | -g patterns |
| RoadmapDocumentCodec | roadmap | -g roadmap |
| CompletedMilestonesCodec | milestones | -g milestones |
| CurrentWorkCodec | current | -g current |
| RequirementsDocumentCodec | requirements | -g requirements |
| SessionContextCodec | session | -g session |
| RemainingWorkCodec | remaining | -g remaining |
| PrChangesCodec | pr-changes | -g pr-changes |
| AdrDocumentCodec | adrs | -g adrs |
| PlanningChecklistCodec | planning-checklist | -g planning-checklist |
| SessionPlanCodec | session-plan | -g session-plan |
| SessionFindingsCodec | session-findings | -g session-findings |
| ChangelogCodec | changelog | -g changelog |
| TraceabilityCodec | traceability | -g traceability |
| OverviewCodec | overview-rdm | -g overview-rdm |
