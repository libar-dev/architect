# 12 — Live Documentation API

> **Architect Spec v0.2.0** — Structured document serving through the Data API, replacing
> static markdown generation for interactive consumers.

---

## Overview

The Architect projection pipeline transforms a `PatternGraph` into `RenderableDocument`
structures — a typed intermediate format with 9 block types. Today, every consumer
immediately flattens `RenderableDocument` to markdown strings and writes static files.

The Live Documentation API introduces a new exit path: serving `RenderableDocument` as
structured JSON through the Data API. Interactive consumers — the Studio desktop app,
future web views, and MCP clients — receive typed document blocks and render them
natively, instead of parsing markdown back into structure.

```
                         PatternGraph (in memory)
                               │
                     projectDocumentationView()
                               │
                      RenderableDocument
                       ┌───────┴───────┐
                       │               │
                  renderToMarkdown   Live Documentation API
                       │               │
                  Static .md files   JSON over IPC / MCP
                  (docs-live/)       (Studio, MCP clients)
```

### Why This Matters

1. **No information loss.** Markdown flattening destroys structure — a `TableBlock` becomes
   pipe-delimited text. Serving the structured representation preserves column types,
   alignment, nesting, and block semantics.

2. **Native rendering.** Studio can render Mermaid diagrams interactively, tables with sorting
   and filtering, collapsible sections with animation, and code blocks with syntax highlighting.

3. **No new data model.** `RenderableDocument` already exists as the projection output
   contract. The API exposes what the pipeline already produces.

4. **Pure functions, trivial caching.** Projections are pure functions of `PatternGraph`.
   A projected document can be cached and invalidated atomically when the graph rebuilds.

---

## Architecture

### Pipeline Position

The Live Documentation API sits between the projection step and the render step:

```
CONFIG → SCANNER → EXTRACTOR → PATTERN GRAPH → PROJECTION → ┐
                                                             ├─→ Renderer → .md files
                                                             └─→ Live Documentation API → JSON
```

### Component Responsibilities

| Component                  | Responsibility                                          |
| -------------------------- | ------------------------------------------------------- |
| `PatternGraph`             | Single read model — input to all projections            |
| `Projection`               | Pure function: `PatternGraph → RenderableDocument`      |
| `RenderableDocument`       | Typed intermediate format (9 block types)               |
| **Live Documentation API** | Projection invocation, caching, JSON serialization      |
| `ArchitectMainProcessMcp`  | Hosts API in Studio's main process via IPC              |
| Studio React renderer      | Consumes `RenderableDocument` blocks → React components |

### Invariants

1. The API MUST NOT return markdown. The rendering boundary is the consumer's responsibility.
2. The API MUST return valid `RenderableDocument` JSON conforming to `RenderableDocumentSchema`.
3. Projections MUST remain pure functions of `PatternGraph`. The API layer handles caching.
4. The API MUST support the `additionalFiles` field for progressive disclosure.

---

## API Surface

### Tool: `architect_documentation`

A single parameterized MCP tool invokes any registered documentation projection and
returns a `RenderableDocument`. The CLI does not duplicate this typed tool. Use the graph
handle for live graph cuts and the documentation generator for static projection output:

```bash
pnpm architect:q 'g.graph.counts'
pnpm exec architect-generate --base-dir . -g patterns --check
```

| Parameter      | Type   | Required | Description                                                                                        |
| -------------- | ------ | -------- | -------------------------------------------------------------------------------------------------- |
| `documentType` | string | MUST     | Document type key from `DOCUMENT_TYPES` (e.g., `"patterns"`, `"architecture"`, `"business-rules"`) |
| `disclosure`   | string | MAY      | Progressive disclosure level supported by the projection (e.g., `"summary"`, `"standard"`)         |
| `filter`       | object | MAY      | Projection-specific filters (e.g., `{ status: "active,completed" }`)                               |

**Response:** the typed `RenderableDocument` envelope described in
"RenderableDocument as API Response Format" below, augmented with cache/metadata
fields supplied by the pipeline session.

> _Informative:_ Earlier drafts of this spec described three separate tools
> (`architect_doc`, `architect_doc_detail`, `architect_doc_types`). The shipped reference
> implementation collapses them into the single `architect_documentation` tool above;
> document-type introspection is served via the related `architect_help` tool and
> progressive disclosure is handled by the `disclosure` parameter on the same tool.

---

## RenderableDocument as API Response Format

The existing `RenderableDocument` type and its `SectionBlock` discriminated union serve as the
API's response schema. No new types are introduced.

### Block Type Reference

| Type          | Fields                                                | Rendering Hint                  |
| ------------- | ----------------------------------------------------- | ------------------------------- |
| `heading`     | `level: 1-6`, `text: string`                          | `<h1>`..`<h6>`                  |
| `paragraph`   | `text: string`                                        | May contain inline markdown     |
| `separator`   | (none)                                                | `<hr>`                          |
| `table`       | `columns: string[]`, `rows: string[][]`, `alignment?` | Sortable, scrollable            |
| `list`        | `items: ListItem[]`, `ordered: boolean`               | Nested, checkbox-aware          |
| `code`        | `content: string`, `language?: string`                | Syntax-highlighted              |
| `mermaid`     | `content: string`                                     | Rendered as interactive diagram |
| `collapsible` | `summary: string`, `content: SectionBlock[]`          | Expandable section              |
| `link-out`    | `text: string`, `path: string`                        | Navigates to file or view       |

### Document Envelope

```typescript
interface RenderableDocument {
  title: string;
  purpose?: string;
  detailLevel?: string;
  sections: SectionBlock[];
  additionalFiles?: Record<string, RenderableDocument>;
}
```

### Inline Markdown in Text Fields

`paragraph.text`, `heading.text`, table cell text, and list item text MAY contain inline
markdown (bold, italic, code spans, links). The UI renderer MUST parse inline markdown in
these fields. Block-level markdown MUST NOT appear in text fields.

---

## MVP Projection Set

Four projections selected for maximum block type coverage and practical value:

| Projection                         | Type Key         | Key Block Types                           | Options       | Progressive Disclosure |
| ---------------------------------- | ---------------- | ----------------------------------------- | ------------- | ---------------------- |
| `parseAndProjectDocumentationView` | `design-review`  | mermaid, table, heading, paragraph        | `patternName` | No                     |
| `parseAndProjectBusinessRules`     | `business-rules` | table, list, collapsible, link-out        | No            | Yes (per product area) |
| `parseAndProjectDocumentationView` | `architecture`   | mermaid, table, heading, paragraph        | No            | No                     |
| `parseAndProjectPatternCatalog`    | `patterns`       | table, list, heading, paragraph, link-out | No            | Yes (per category)     |

All document projections are served through the same `architect_documentation` tool —
expansion requires no API changes, only additional UI views.

---

## Caching Strategy

### Cache Design

Decoded documents are cached in a `Map<CacheKey, CachedDocument>`:

```typescript
interface CachedDocument {
  readonly document: RenderableDocument;
  readonly decodedAt: number;
  readonly buildGeneration: number;
}

type CacheKey = string; // `${type}::${JSON.stringify(sortedOptions)}`
```

### Cache Lifecycle

| Event                          | Cache Action                                                               |
| ------------------------------ | -------------------------------------------------------------------------- |
| `architect_documentation` call | Return cached if `buildGeneration` matches current; else project and cache |
| PatternGraph rebuild           | Increment `buildGeneration`; lazy invalidation on next access              |
| Studio disconnect              | Clear cache entirely                                                       |

The cache SHOULD impose a maximum entry count of 50 with LRU eviction.

---

## Progressive Disclosure

`RenderableDocument.additionalFiles` is an optional `Record<string, RenderableDocument>`.
In the static pipeline, each entry becomes a separate `.md` file. In the Live Documentation
API, each entry is reachable from the parent document via the `disclosure` parameter on
the same `architect_documentation` tool.

**Workflow:**

1. Client calls `architect_documentation` with `documentType` only → receives the parent
   document plus an `additionalFileKeys` list.
2. Client renders navigation affordances for each key.
3. User clicks a drill-down target → client re-invokes `architect_documentation` with
   the matching `disclosure` level (and/or `filter`).
4. API returns the nested `RenderableDocument` from cache.

Keys use static pipeline path format (e.g., `"business-rules/platform.md"`).

---

## Security Considerations

- The `documentType` parameter MUST be validated against `DOCUMENT_TYPES` before projection dispatch.
- The `disclosure` and `filter` parameters MUST be validated by the projection boundary.
- Text fields may contain user-authored content. The UI renderer MUST sanitize text to
  prevent HTML injection.
- Documents SHOULD NOT exceed 5 MB serialized over IPC.

---

## Migration Path

The static markdown pipeline (`docs-live/`) continues to operate. The Live Documentation API
is an additional exit path, not a replacement. CI pipelines, GitHub rendering, and non-Studio
consumers continue using static files.
