# 🚧 Reference Doc Showcase

**Purpose:** Detailed requirements for the Reference Doc Showcase feature

---

## Overview

| Property       | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Status         | active                                                       |
| Product Area   | Generation                                                   |
| Business Value | validates all content blocks via single integration document |
| Phase          | 30                                                           |

## Description

**Problem:**
The Reference Generation Sample document exercises a small fraction of the
reference codec's capabilities: 2 convention rules, 1 flowchart diagram,
2 shapes from a single file, and 1 shallow behavior pattern. Of the 9
renderable block types (heading, paragraph, separator, table, list, code,
mermaid, collapsible, link-out), only 6 are used. Behavior rendering truncates
rule descriptions to 120 characters, discarding invariants, rationale, and
verified-by content that is already extracted. Shape rendering omits JSDoc
prose at standard detail level. Diagrams support only flowcharts with no
edge labels, layer filtering, or alternative diagram types. The extraction
pipeline drops function signatures, param/returns/throws documentation, and
full property-level JSDoc.

**Solution:**
Expand the reference sample into a comprehensive showcase that exercises every
content block type across all three detail levels. This requires three tiers
of work: codec rendering enhancements (deep behavior, full shapes, rich
diagrams), extraction pipeline improvements (function signatures, param docs,
auto-shape discovery), and infrastructure enablers (codec composition,
AI-optimized rendering, data-driven tag extraction).

The sample document serves as the integration test: if REFERENCE-SAMPLE.md
renders every block type correctly at every detail level, the codec system
works end-to-end.

**Why It Matters:**
| Benefit | How |
| Integration validation | Single document tests all 9 renderable block types |
| Deep behavior content | Full rule descriptions with invariant/rationale replace 120-char truncation |
| Complete shape documentation | JSDoc prose at standard level, property tables at detailed |
| Rich diagram vocabulary | Sequence, state, C4, and class diagrams alongside flowcharts |
| Progressive disclosure | Collapsible sections for large content blocks |
| Complete API surface | Function signatures and param docs without source navigation |
| Token-efficient AI context | Dedicated renderer for LLM consumption |
| Flexible composition | CompositeCodec assembles docs from multiple codec outputs |

## Acceptance Criteria

**Detailed level renders full rule descriptions with structured content**

- Given a behavior pattern with rules containing invariant and rationale
- When the reference codec renders at detailed level
- Then each rule description appears without truncation
- And invariant text is rendered as a bold paragraph
- And rationale text is rendered as a bold paragraph
- And verified-by scenarios are rendered as a list block

**Summary level preserves compact truncation**

- Given a behavior pattern with rules containing long descriptions
- When the reference codec renders at summary level
- Then rule descriptions are truncated to 120 characters
- And no invariant or rationale paragraphs appear

**Standard level renders full descriptions without rationale**

- Given a behavior pattern with rules containing invariant and rationale
- When the reference codec renders at standard level
- Then each rule description appears without truncation
- And invariant text is rendered as a bold paragraph
- And rationale text is not rendered

**Standard level includes JSDoc prose above code blocks**

- Given shapes with JSDoc comments extracted from source
- When the reference codec renders at standard level
- Then JSDoc text appears as a paragraph before each code block

**Detailed level adds property documentation table**

- Given an interface shape with property-level JSDoc
- When the reference codec renders at detailed level
- Then a property documentation table appears after the code block
- And the table has columns "Property" and "Description"

**Shapes without JSDoc render code blocks only**

- Given shapes with no JSDoc comments
- When the reference codec renders at standard level
- Then code blocks render without a preceding paragraph

**archLayer filter selects patterns by layer**

- Given patterns annotated with archLayer "domain"
- And patterns annotated with archLayer "infrastructure"
- And a DiagramScope with archLayer "domain"
- When the scope filter runs
- Then only patterns in the domain layer appear

**archLayer and archContext compose via OR**

- Given a pattern with archLayer "domain" and archContext "orders"
- And a pattern with archLayer "infrastructure" and archContext "shared"
- And a DiagramScope with archLayer "domain" and archContext "shared"
- When the scope filter runs
- Then both patterns appear in the result

**Sequence diagram renders participant-message format**

- Given a DiagramScope with diagramType "sequenceDiagram"
- And patterns with uses relationships representing event flow
- When the scoped diagram is built
- Then the mermaid output starts with "sequenceDiagram"
- And patterns appear as participants
- And relationships appear as messages between participants

**State diagram renders state transitions**

- Given a DiagramScope with diagramType "stateDiagram-v2"
- And patterns representing FSM states with transition relationships
- When the scoped diagram is built
- Then the mermaid output starts with "stateDiagram-v2"
- And states and transitions render in state diagram syntax

**Default diagramType produces flowchart**

- Given a DiagramScope without diagramType specified
- When the scoped diagram is built
- Then the mermaid output starts with "graph"

**Detailed output contains all 9 block types**

- Given the expanded sample config with all content sources populated
- When the reference codec renders at detailed level
- Then the output contains heading blocks
- And the output contains paragraph blocks
- And the output contains separator blocks
- And the output contains table blocks
- And the output contains list blocks
- And the output contains code blocks
- And the output contains mermaid blocks
- And the output contains collapsible blocks
- And the output contains link-out blocks

**Summary output uses compact block subset**

- Given the expanded sample config with all content sources populated
- When the reference codec renders at summary level
- Then the output contains heading, paragraph, separator, and table blocks
- And the output does not contain collapsible or link-out blocks

**Relationship edges display type labels by default**

- Given scope patterns with uses and dependsOn relationships
- When the scoped diagram is built
- Then edges include relationship type labels in Mermaid syntax

**Edge labels can be disabled for compact diagrams**

- Given scope patterns with relationships
- And edge labels are disabled via showEdgeLabels false
- When the scoped diagram is built
- Then edges use the standard unlabeled arrow syntax

**archRole controls Mermaid node shape**

- Given a pattern with archRole "service" and a pattern with archRole "projection"
- When the scoped diagram is built
- Then the service node uses rounded rectangle syntax
- And the projection node uses cylinder syntax

**Function signatures populate ExportInfo**

- Given a TypeScript file with exported functions having typed parameters
- When the AST parser extracts pattern metadata
- Then ExportInfo.signature contains full parameter types and return type

**JSDoc param and returns tags appear in shape sections**

- Given a shape with @param and @returns JSDoc tags
- When the reference codec renders at detailed level
- Then parameter documentation appears in the shape section
- And return type documentation appears in the shape section

**Full property-level JSDoc preserved without truncation**

- Given an interface shape with multi-line property JSDoc
- When the shape extractor processes the file
- Then the full property JSDoc text is preserved
- And no first-line truncation occurs

**Auto-shape discovery extracts exports from shapeSources files**

- Given a TypeScript file matching a shapeSources glob pattern
- And the file has exported types but no extract-shapes annotation
- When shape extraction runs in auto-discovery mode
- Then all exported types from the file are included as shapes

**CompositeCodec combines multiple codec outputs**

- Given two codec instances producing different RenderableDocuments
- When CompositeCodec assembles them
- Then the output contains sections from both codecs in order

**renderToClaudeContext produces token-efficient output**

- Given a RenderableDocument with multiple section types
- When rendered via renderToClaudeContext
- Then the output uses section markers instead of markdown headers
- And token count is lower than equivalent markdown output

**New Gherkin tags work via registry without code changes**

- Given a tag defined in the TagRegistry with format and purpose
- When a feature file uses that tag
- Then the Gherkin extractor parses it using registry metadata
- And no new if/else branch is needed in the parser

**TypeScript JSDoc conventions extracted alongside Gherkin**

- Given a TypeScript file with Invariant and Rationale in JSDoc
- And a convention tag on the same file
- When convention extraction runs
- Then structured content from TypeScript JSDoc appears in convention output

## Business Rules

**Deep behavior rendering replaces shallow truncation**

**Invariant:** At standard and detailed levels, behavior sections render full
rule descriptions with parsed invariant, rationale, and verified-by content.
At summary level, the 120-character truncation is preserved for compact output.
Behavior rendering reuses parseBusinessRuleAnnotations from the convention
extractor rather than reimplementing structured content parsing.

    **Rationale:** The current 120-character truncation discards invariants,
    rationale, and verified-by content that is already extracted and available
    in BusinessRule.description. Reference documents need the full rule content
    to serve as authoritative documentation. The convention extractor already
    parses this structured content via parseBusinessRuleAnnotations -- the
    behavior builder should delegate to the same function.

    **Verified by:** Full rule descriptions at detailed level,
    Truncated descriptions at summary level,
    Scenario names appear as list blocks under rules

_Verified by: Detailed level renders full rule descriptions with structured content, Summary level preserves compact truncation, Standard level renders full descriptions without rationale_

**Shape sections include JSDoc prose and property documentation**

**Invariant:** At standard level, shape code blocks are preceded by JSDoc
prose when available. At detailed level, interface shapes additionally render
a property documentation table. At summary level, only the type-kind table
appears. Shapes without JSDoc render code blocks without preceding paragraph.

    **Rationale:** JSDoc on shapes contains design rationale and usage guidance
    that is already extracted by the shape extractor. Gating it behind detailed
    level wastes the data at the most common detail level (standard). The fix is
    a single condition change: reference.ts line 342 from
    detailLevel === 'detailed' to detailLevel !== 'summary'.

    **Verified by:** JSDoc renders at standard level,
    Property table renders at detailed level,
    Summary shows only type-kind table

_Verified by: Standard level includes JSDoc prose above code blocks, Detailed level adds property documentation table, Shapes without JSDoc render code blocks only_

**Diagram scope supports archLayer filtering and multiple diagram types**

**Invariant:** DiagramScope gains optional archLayer and diagramType fields.
The archLayer filter selects patterns by their architectural layer (domain,
application, infrastructure) and composes with archContext and archView via
OR logic, consistent with existing filter dimensions. The diagramType field
controls Mermaid output format: graph (default), sequenceDiagram,
stateDiagram-v2, C4Context, classDiagram. Each diagram type has its own
node and edge syntax appropriate to the Mermaid specification.

    **Rationale:** Layer-based views are fundamental to layered architecture
    documentation -- a developer reviewing the domain layer wants only deciders
    and value objects, not infrastructure adapters. Multiple diagram types unlock
    event flow documentation (sequence), FSM visualization (state), architecture
    overview (C4), and type hierarchy views (class) that flowcharts cannot
    express naturally.

    **Verified by:** archLayer filter selects domain-layer patterns,
    archLayer composes with archContext via OR,
    Sequence diagram renders participant-message format,
    State diagram renders state transitions,
    diagramType field controls Mermaid output

_Verified by: archLayer filter selects patterns by layer, archLayer and archContext compose via OR, Sequence diagram renders participant-message format, State diagram renders state transitions, Default diagramType produces flowchart_

**Every renderable block type appears in the showcase document**

**Invariant:** The generated REFERENCE-SAMPLE.md at detailed level must
contain at least one instance of each of the 9 block types: heading,
paragraph, separator, table, list, code, mermaid, collapsible, link-out.
At summary level, progressive disclosure blocks (collapsible, link-out)
are omitted for compact output.

    **Rationale:** The sample document is the integration test for the reference
    codec. If any block type is missing, there is no automated verification that
    the codec can produce it. Coverage of all 9 types validates the full
    rendering pipeline from MasterDataset through codec through renderer.

    **Verified by:** All 9 block types present in detailed output,
    Summary output uses compact block subset

_Verified by: Detailed output contains all 9 block types, Summary output uses compact block subset_

**Edge labels and custom node shapes enrich diagram readability**

**Invariant:** Relationship edges in scoped diagrams display labels
describing the relationship semantics (uses, dependsOn, implements, extends).
Edge labels are enabled by default and can be disabled via a showEdgeLabels
option for compact diagrams. Node shapes vary by archRole value -- services
use rounded rectangles, bounded contexts use subgraphs, projections use
cylinders, and sagas use hexagons.

    **Rationale:** Unlabeled edges are ambiguous -- a reader seeing a solid
    arrow cannot distinguish "uses" from "implements" without consulting an
    edge style legend. Custom node shapes leverage Mermaid's shape vocabulary
    to make archRole visually distinguishable without color reliance,
    improving accessibility.

    **Verified by:** Edge labels appear on diagram edges,
    Edge labels can be disabled,
    archRole controls node shape

_Verified by: Relationship edges display type labels by default, Edge labels can be disabled for compact diagrams, archRole controls Mermaid node shape_

**Extraction pipeline surfaces complete API documentation**

**Invariant:** ExportInfo.signature shows full function parameter types and
return type instead of the placeholder value. JSDoc param, returns, and
throws tags are extracted and stored on ExtractedShape. Property-level JSDoc
preserves full multi-line content without first-line truncation. Auto-shape
discovery mode extracts all exported types from files matching shapeSources
globs without requiring explicit extract-shapes annotations.

    **Rationale:** Function signatures are the most valuable API surface -- they
    show what a pattern exports without source navigation. The ExportInfo.signature
    field already exists in the schema but holds a lossy placeholder. The fix is
    approximately 15 lines in ast-parser.ts: threading sourceCode into
    extractFromDeclaration and slicing parameter ranges. Auto-shape discovery
    eliminates manual annotation burden for files that match shapeSources globs.

    **Verified by:** Function signatures populate ExportInfo,
    Param and returns tags appear in shape sections,
    Full property JSDoc preserved,
    Auto-shape discovery extracts without explicit tags

_Verified by: Function signatures populate ExportInfo, JSDoc param and returns tags appear in shape sections, Full property-level JSDoc preserved without truncation, Auto-shape discovery extracts exports from shapeSources files_

**Infrastructure enables flexible document composition and AI-optimized output**

**Invariant:** CompositeCodec assembles reference documents from multiple
codec outputs by concatenating RenderableDocument sections. The
renderToClaudeContext renderer produces token-efficient output using section
markers optimized for LLM consumption. The Gherkin tag extractor uses
TagRegistry metadata instead of hardcoded if/else branches, making new tag
addition a zero-code-change operation. Convention content can be extracted
from TypeScript JSDoc blocks containing structured Invariant/Rationale
annotations, not only from Gherkin Rule blocks.

    **Rationale:** CompositeCodec enables referenceDocConfigs to include content
    from any codec, not just the current 4 sources. The renderToClaudeContext
    renderer unifies two formatting paths (codec-based markdown vs hand-written
    markers in context-formatter.ts). Data-driven tag extraction cuts the
    maintenance burden of the 40-branch if/else in gherkin-ast-parser.ts roughly
    in half. TypeScript convention extraction enables self-documenting business
    rules in implementation files alongside their code.

    **Verified by:** CompositeCodec combines multiple codec outputs,
    Claude context renderer produces marker-delimited output,
    New tags work via registry without code changes,
    TypeScript JSDoc conventions extracted alongside Gherkin

_Verified by: CompositeCodec combines multiple codec outputs, renderToClaudeContext produces token-efficient output, New Gherkin tags work via registry without code changes, TypeScript JSDoc conventions extracted alongside Gherkin_

## Deliverables

- Remove 120-char rule description truncation (complete)
- Deep behavior rendering with parsed invariant/rationale (complete)
- JSDoc prose in shape sections at standard level (complete)
- archLayer filter in DiagramScope (complete)
- Edge labels on diagram relationships (complete)
- Custom node shapes per archRole (complete)
- diagramType field in DiagramScope (complete)
- Sequence diagram rendering (complete)
- State machine diagram rendering (complete)
- C4 diagram rendering (complete)
- Class diagram rendering (complete)
- List block usage for scenario names under rules (complete)
- Collapsible block for progressive disclosure (complete)
- Link-out block for cross-references (complete)
- Function signature surfacing in ExportInfo (complete)
- Param/returns/throws extraction from JSDoc (complete)
- Full property-level JSDoc without truncation (complete)
- Auto-shape discovery mode (complete)
- Convention content from TypeScript JSDoc (complete)
- CompositeCodec for multi-codec assembly (complete)
- renderToClaudeContext renderer (complete)
- Data-driven Gherkin tag extraction (complete)
- Expanded sample config with all content sources (complete)
- Sample convention decision with rich content (complete)

## Implementations

Files that implement this pattern:

- [`composite.ts`](../../src/renderable/codecs/composite.ts) - ## Composite Document Codec
- [`composite-codec.feature`](../../tests/features/behavior/codecs/composite-codec.feature) - Assembles reference documents from multiple codec outputs by
- [`convention-extractor.feature`](../../tests/features/behavior/codecs/convention-extractor.feature) - Extracts convention content from MasterDataset decision records
- [`reference-codec.feature`](../../tests/features/behavior/codecs/reference-codec.feature) - Parameterized codec factory that creates reference document codecs
- [`reference-generators.feature`](../../tests/features/behavior/codecs/reference-generators.feature) - Registers all 13 reference document generators. Each config produces
- [`shape-matcher.feature`](../../tests/features/behavior/codecs/shape-matcher.feature) - Matches file paths against glob patterns for TypeScript shape extraction.
- [`shape-selector.feature`](../../tests/features/behavior/codecs/shape-selector.feature) - Tests the filterShapesBySelectors function that provides fine-grained
- [`extraction-pipeline-enhancements.feature`](../../tests/features/extractor/extraction-pipeline-enhancements.feature) - Validates extraction pipeline capabilities for ReferenceDocShowcase:
- [`shape-extraction.feature`](../../tests/features/extractor/shape-extraction.feature) - Validates the shape extraction system that extracts TypeScript type

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
