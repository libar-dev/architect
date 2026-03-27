### Generation Overview

**How does code become docs?** The generation pipeline transforms annotated source code into markdown documents through a four-stage architecture: Scanner discovers files, Extractor produces `ExtractedPattern` objects, Transformer builds MasterDataset with pre-computed views, and Codecs render to markdown via RenderableDocument IR. Nine specialized codecs handle reference docs, planning, session, reporting, timeline, ADRs, business rules, taxonomy, and composite output — each supporting three detail levels (detailed, standard, summary). The Orchestrator runs generators in registration order, producing both detailed `docs-live/` references and compact `_claude-md/` summaries.

#### Key Invariants

- Codec purity: Every codec is a pure function (dataset in, document out). No side effects, no filesystem access. Same input always produces same output
- Single read model (ADR-006): All codecs consume MasterDataset. No codec reads raw scanner/extractor output. Anti-patterns: Parallel Pipeline, Lossy Local Type, Re-derived Relationship
- Progressive disclosure: Every document renders at three detail levels (detailed, standard, summary) from the same codec. Summary feeds `_claude-md/` modules; detailed feeds `docs-live/reference/`
- Config-driven generation: A single `ReferenceDocConfig` produces a complete document. Content sources compose in fixed order: conventions, diagrams, shapes, behaviors
- RenderableDocument IR: Codecs express intent ("this is a table"), the renderer handles syntax ("pipe-delimited markdown"). Switching output format requires only a new renderer
- Composition order: Reference docs compose four content layers in fixed order. Product area docs compose five layers: intro, conventions, diagrams, shapes, business rules
- Shape extraction: TypeScript shapes (`interface`, `type`, `enum`, `function`, `const`) are extracted by declaration-level `@architect-shape` tags. Shapes include source text, JSDoc, type parameters, and property documentation
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
