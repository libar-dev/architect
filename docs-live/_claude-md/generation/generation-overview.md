### Generation Overview

**How does code become docs?** The generation pipeline transforms annotated source code into markdown documents. It follows a four-stage architecture: Scanner → Extractor → Transformer → Codec. Codecs are pure functions — given a MasterDataset, they produce a RenderableDocument without side effects. CompositeCodec composes multiple codecs into a single document.

#### Key Invariants

- Codec purity: Every codec is a pure function (dataset in, document out). No side effects, no filesystem access. Same input always produces same output
- Config-driven generation: A single `ReferenceDocConfig` produces a complete document. Content sources compose in fixed order: conventions, diagrams, shapes, behaviors
- RenderableDocument IR: Codecs express intent ("this is a table"), the renderer handles syntax ("pipe-delimited markdown"). Switching output format requires only a new renderer

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
