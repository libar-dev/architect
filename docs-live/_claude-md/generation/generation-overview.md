### Generation Overview

**How does code become docs?** The generation pipeline transforms annotated source code into markdown documents through a four-stage architecture. **Stage 1 — Scanner** (`src/scanner/`): Discovers TypeScript and Gherkin files, parses AST structure, and detects opt-in via `@libar-docs` markers. **Stage 2 — Extractor** (`src/extractor/`): Extracts patterns from TypeScript JSDoc annotations and Gherkin tags, producing `ExtractedPattern` objects with metadata, relationships, shapes, rules, and deliverables. **Stage 3 — Transformer** (`src/generators/pipeline/`): Builds `MasterDataset` with pre-computed views (`byStatus`, `byCategory`, `byPhase`, `byProductArea`) for O(1) access. All consumers share a single `buildMasterDataset()` factory — no parallel pipelines (ADR-006). **Stage 4 — Codec** (`src/renderable/`): Pure functions that transform MasterDataset into RenderableDocument — an intermediate representation with 9 block types (heading, paragraph, table, list, code, mermaid, collapsible, linkOut, separator). The renderer converts IR to markdown syntax. The codec inventory includes: **ReferenceDocumentCodec** (4-layer composition: conventions, diagrams, shapes, behaviors), **PlanningCodec** (roadmap and remaining work), **SessionCodec** (current work and session findings), **ReportingCodec** (changelog), **TimelineCodec** (timeline and traceability), **RequirementsAdrCodec** (ADR generation), **BusinessRulesCodec** (Gherkin rule extraction), **TaxonomyCodec** (tag registry docs), **CompositeCodec** (composes multiple codecs into a single document). Every codec supports three detail levels — **detailed** (full reference with rationale, code examples, and verified-by lists), **standard** (narrative without rationale), and **summary** (compact tables for `_claude-md/` modules). The Orchestrator (`src/generators/orchestrator.ts`) runs registered generators in order. Each generator creates codec instances from configuration, decodes the shared MasterDataset, renders to markdown, and writes output files to `docs-live/` (reference docs) or `docs-live/_claude-md/` (AI-optimized compacts). Product area docs are a special case — they filter the entire MasterDataset to a single area, compose 5 sections (intro, conventions, diagrams, shapes, business rules), and generate both detailed and summary versions with a progressive disclosure index.

#### Key Invariants

- Codec purity: Every codec is a pure function (dataset in, document out). No side effects, no filesystem access. Same input always produces same output
- Single read model (ADR-006): All codecs consume MasterDataset. No codec reads raw scanner/extractor output. Anti-patterns: Parallel Pipeline, Lossy Local Type, Re-derived Relationship
- Progressive disclosure: Every document renders at three detail levels (detailed, standard, summary) from the same codec. Summary feeds `_claude-md/` modules; detailed feeds `docs-live/reference/`
- Config-driven generation: A single `ReferenceDocConfig` produces a complete document. Content sources compose in fixed order: conventions, diagrams, shapes, behaviors
- RenderableDocument IR: Codecs express intent ("this is a table"), the renderer handles syntax ("pipe-delimited markdown"). Switching output format requires only a new renderer
- Composition order: Reference docs compose four content layers in fixed order. Product area docs compose five layers: intro, conventions, diagrams, shapes, business rules
- Shape extraction: TypeScript shapes (`interface`, `type`, `enum`, `function`, `const`) are extracted by declaration-level `@libar-docs-shape` tags. Shapes include source text, JSDoc, type parameters, and property documentation
- Generator registration: Generators self-register via `registerGenerator()`. The orchestrator runs them in registration order. Each generator owns its output files and codec configuration

#### API Types

| Type                     | Kind      |
| ------------------------ | --------- |
| RuntimeMasterDataset     | interface |
| RawDataset               | interface |
| RenderableDocument       | type      |
| SectionBlock             | type      |
| HeadingBlock             | type      |
| TableBlock               | type      |
| ListBlock                | type      |
| CodeBlock                | type      |
| MermaidBlock             | type      |
| CollapsibleBlock         | type      |
| transformToMasterDataset | function  |
