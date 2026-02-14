# ADR-005: ADR 005 Codec Based Markdown Rendering

**Purpose:** Architecture decision record for ADR 005 Codec Based Markdown Rendering

---

## Overview

| Property | Value        |
| -------- | ------------ |
| Status   | accepted     |
| Category | architecture |

**Context:**
The documentation generator needs to transform structured pattern data
(MasterDataset) into markdown files. The initial approach used direct
string concatenation in generator functions, mixing data selection,
formatting logic, and output assembly in a single pass. This made
generators hard to test, difficult to compose, and impossible to
render the same data in different formats (e.g., full docs vs compact
AI context).

**Decision:**
Adopt a codec architecture inspired by serialization codecs (encode/decode).
Each document type has a codec that decodes a MasterDataset into a
RenderableDocument — an intermediate representation of sections, headings,
tables, paragraphs, and code blocks. A separate renderer transforms the
RenderableDocument into markdown. This separates data selection (what to
include) from formatting (how it looks) from serialization (markdown syntax).

**Consequences:**

| Type     | Impact                                                                            |
| -------- | --------------------------------------------------------------------------------- |
| Positive | Codecs are pure functions: dataset in, document out -- trivially testable         |
| Positive | RenderableDocument is an inspectable IR -- tests assert on structure, not strings |
| Positive | Composable via CompositeCodec -- reference docs assemble from child codecs        |
| Positive | Same dataset can produce different outputs (full doc, compact doc, AI context)    |
| Negative | Extra abstraction layer between data and output                                   |
| Negative | RenderableDocument vocabulary must cover all needed output patterns               |

**Benefits:**

| Benefit                | Before (String Concat)        | After (Codec)                     |
| ---------------------- | ----------------------------- | --------------------------------- |
| Testability            | Assert on markdown strings    | Assert on typed section blocks    |
| Composability          | Copy-paste between generators | CompositeCodec assembles children |
| Format variants        | Duplicate generator logic     | Same codec, different renderer    |
| Progressive disclosure | Manual heading management     | Heading depth auto-calculated     |

## Rules

### Codecs implement a decode-only contract

**Invariant:** Every codec is a pure function that accepts a MasterDataset and returns a RenderableDocument. Codecs do not perform side effects, do not write files, and do not access the filesystem. The codec contract is decode-only because the transformation is one-directional: structured data becomes a document, never the reverse.

**Rationale:** Pure functions are deterministic and trivially testable. Given the same MasterDataset, a codec always produces the same RenderableDocument. This makes snapshot testing reliable and enables codec output comparison across versions.

**Codec call signature:**

```typescript
interface DocumentCodec {
  decode(dataset: MasterDataset): RenderableDocument;
}
```

**Verified by:**

- Codec produces deterministic output
- Codec has no side effects

### RenderableDocument is a typed intermediate representation

**Invariant:** RenderableDocument contains a title, an ordered array of SectionBlock elements, and an optional record of additional files. Each SectionBlock is a discriminated union: heading, paragraph, table, code, list, separator, or metaRow. The renderer consumes this IR without needing to know which codec produced it.

**Rationale:** A typed IR decouples codecs from rendering. Codecs express intent ("this is a table with these rows") and the renderer handles syntax ("pipe-delimited markdown with separator row"). This means switching output format (e.g., HTML instead of markdown) requires only a new renderer, not changes to every codec.

| Block Type | Purpose                       | Markdown Output             |
| ---------- | ----------------------------- | --------------------------- |
| heading    | Section title with depth      | ## Title (depth-adjusted)   |
| paragraph  | Prose text                    | Plain text with blank lines |
| table      | Structured data               | Pipe-delimited table        |
| code       | Code sample with language     | Fenced code block           |
| list       | Ordered or unordered items    | - item or 1. item           |
| separator  | Visual break between sections | ---                         |
| metaRow    | Key-value metadata            | **Key:** Value              |

**Section block types:**

**Verified by:**

- All block types render to markdown
- Unknown block type is rejected

### CompositeCodec assembles documents from child codecs

**Invariant:** CompositeCodec accepts an array of child codecs and produces a single RenderableDocument by concatenating their sections. Child codec order determines section order in the output. Separators are inserted between children by default.

**Rationale:** Reference documents combine content from multiple domains (patterns, conventions, shapes, diagrams). Rather than building a monolithic codec that knows about all content types, CompositeCodec lets each domain own its codec and composes them declaratively.

**Composition example:**

```typescript
const referenceDoc = CompositeCodec.create({
  title: 'Architecture Reference',
  codecs: [
    behaviorCodec, // patterns with rules
    conventionCodec, // decision records
    shapeCodec, // type definitions
    diagramCodec, // mermaid diagrams
  ],
});
```

**Verified by:**

- Child sections appear in codec array order
- Empty children are skipped without separators

### ADR content comes from both Feature description and Rule prefixes

**Invariant:** ADR structured content (Context, Decision, Consequences) can appear in two locations within a feature file. Both sources must be rendered. Silently dropping either source causes content loss.

**Rationale:** Early ADRs used name prefixes like "Context - ..." and "Decision - ..." on Rule blocks to structure content. Later ADRs placed Context, Decision, and Consequences as bold-annotated prose in the Feature description, reserving Rule: blocks for invariants and design rules. Both conventions are valid. The ADR codec must handle both because the codebase contains ADRs authored in each style. The Feature description lives in pattern.directive.description. If the codec only renders Rules (via partitionRulesByPrefix), then Feature description content is silently dropped -- no error, no warning. This caused confusion across two repos where ADR content appeared in the feature file but was missing from generated docs. The fix renders pattern.directive.description in buildSingleAdrDocument between the Overview metadata table and the partitioned Rules section, using renderFeatureDescription() which walks content linearly and handles prose, tables, and DocStrings with correct interleaving.

| Source              | Location                            | Example                   | Rendered Via               |
| ------------------- | ----------------------------------- | ------------------------- | -------------------------- |
| Rule prefix         | Rule: Context - ...                 | ADR-001 (taxonomy)        | partitionRulesByPrefix()   |
| Feature description | **Context:** prose in Feature block | ADR-005 (codec rendering) | renderFeatureDescription() |

**Verified by:**

- Feature description content is rendered
- Rule prefix content is rendered
- Both sources combine in single ADR

### The markdown renderer is codec-agnostic

**Invariant:** The renderer accepts any RenderableDocument regardless of which codec produced it. Rendering depends only on block types, not on document origin. This enables testing codecs and renderers independently.

**Rationale:** If the renderer knew about specific codecs, adding a new codec would require renderer changes. By operating purely on the SectionBlock discriminated union, the renderer is closed for modification but open for extension via new block types.

**Verified by:**

- Same renderer handles different codec outputs
- Renderer and codec are tested independently

---

[← Back to All Decisions](../DECISIONS.md)
