# Generation Business Rules

**Purpose:** Business rules for the Generation product area

---

**303 rules** from 61 features. 303 rules have explicit invariants.

---

## Phase 44

### Rich Content Helpers

_As a document codec author_

---

#### DocString parsing handles edge cases

> **Invariant:** DocString parsing must gracefully handle empty input, missing language hints, unclosed delimiters, and non-LF line endings without throwing errors.
>
> **Rationale:** Codecs receive uncontrolled user content from feature file descriptions; unhandled edge cases would crash document generation for the entire pipeline.

**Verified by:**

- Empty description returns empty array
- Description with no DocStrings returns single paragraph
- Single DocString parses correctly
- DocString without language hint uses text
- Unclosed DocString returns plain paragraph fallback
- Windows CRLF line endings are normalized

---

#### DataTable rendering produces valid markdown

> **Invariant:** DataTable rendering must produce a well-formed table block for any number of rows, substituting empty strings for missing cell values.
>
> **Rationale:** Malformed tables break markdown rendering and downstream tooling; missing cells would produce undefined values that corrupt table alignment.

**Verified by:**

- Single row DataTable renders correctly
- Multi-row DataTable renders correctly
- Missing cell values become empty strings

---

#### Scenario content rendering respects options

> **Invariant:** Scenario rendering must honor the includeSteps option, producing step lists only when enabled, and must include embedded DataTables when present.
>
> **Rationale:** Ignoring the includeSteps option would bloat summary views with unwanted detail, and dropping embedded DataTables would lose structured test data.

**Verified by:**

- Render scenario with steps
- Skip steps when includeSteps is false
- Render scenario with DataTable in step

---

#### Business rule rendering handles descriptions

> **Invariant:** Business rule rendering must always include the rule name as a bold paragraph, and must parse descriptions for embedded DocStrings when present.
>
> **Rationale:** Omitting the rule name makes rendered output unnavigable, and skipping DocString parsing would output raw delimiter syntax instead of formatted code blocks.

**Verified by:**

- Rule with simple description
- Rule with no description
- Rule with embedded DocString in description

---

#### DocString content is dedented when parsed

> **Invariant:** DocString code blocks must be dedented to remove common leading whitespace while preserving internal relative indentation, empty lines, and trimming trailing whitespace from each line.
>
> **Rationale:** Without dedentation, code blocks inherit the Gherkin indentation level, rendering as deeply indented and unreadable in generated markdown.

**Verified by:**

- Code block preserves internal relative indentation
- Empty lines in code block are preserved
- Trailing whitespace is trimmed from each line
- Code with mixed indentation is preserved

_rich-content-helpers.feature_

---

## Phase 99

### Test Content Blocks

_This feature demonstrates what content blocks are captured and rendered_

---

#### Business rules appear as a separate section

> **Invariant:** Every Rule block must produce a distinct Business Rule entry containing its description and associated scenarios.
>
> **Rationale:** Without guaranteed capture, rule descriptions and rich content (DocStrings, DataTables) would be silently dropped from generated documentation. Rule descriptions provide context for why this business rule exists. You can include multiple paragraphs here. This is a second paragraph explaining edge cases or exceptions.

**Verified by:**

- Scenario with DocString for rich content
- Scenario with DataTable for structured data

---

#### Multiple rules create multiple Business Rule entries

> **Invariant:** Each Rule keyword in a feature file must produce its own independent Business Rule entry in generated output.
>
> **Rationale:** Merging rules into a single entry would collapse distinct business domains, making it impossible to trace scenarios back to their governing constraint. Each Rule keyword creates a separate entry in the Business Rules section. This helps organize complex features into logical business domains.

**Verified by:**

- Simple scenario under second rule
- Scenario with examples table

_test-content-blocks.feature_

---

## Uncategorized

### Arch Generator Registration

_I want an architecture generator registered in the generator registry_

---

#### Architecture generator is registered in the registry

> **Invariant:** The generator registry must contain an "architecture" generator entry available for CLI invocation.
>
> **Rationale:** Without a registered entry, the CLI cannot discover or invoke architecture diagram generation.

**Verified by:**

- Generator is available in registry
- Generator is available in registry

  The architecture generator must be registered like other built-in
  generators so it can be invoked via CLI.

---

#### Architecture generator produces component diagram by default

> **Invariant:** Running the architecture generator without diagram type options must produce a component diagram with bounded context subgraphs.
>
> **Rationale:** A sensible default prevents users from needing to specify options for the most common use case.

**Verified by:**

- Default generation produces component diagram
- Default generation produces component diagram

  Running the architecture generator without options produces
  a component diagram (bounded context view).

---

#### Architecture generator supports diagram type options

> **Invariant:** The architecture generator must accept a diagram type option that selects between component and layered diagram output.
>
> **Rationale:** Different architectural perspectives (bounded context vs. layer hierarchy) require different diagram types, and the user must be able to select which to generate.

**Verified by:**

- Generate layered diagram with options
- Generate layered diagram with options

  The generator accepts options to specify diagram type
  (component or layered).

---

#### Architecture generator supports context filtering

> **Invariant:** When context filtering is applied, the generated diagram must include only patterns from the specified bounded contexts and exclude all others.
>
> **Rationale:** Without filtering, large monorepos would produce unreadable diagrams with dozens of bounded contexts; filtering enables focused per-context views.

**Verified by:**

- Filter to specific contexts
- Filter to specific contexts

  The generator can filter to specific bounded contexts
  for focused diagram output.

_generator-registration.feature_

### Arch Index Dataset

_As a documentation generator_

---

#### archIndex groups patterns by arch-role

> **Invariant:** Every pattern with an arch-role tag must appear in the archIndex.byRole map under its role key.
>
> **Rationale:** Diagram generators need O(1) lookup of patterns by role to render role-based groupings efficiently.

**Verified by:**

- Group patterns by role
- Group patterns by role

  The archIndex.byRole map groups patterns by their architectural role
  (command-handler

- projection
- saga
- etc.) for efficient lookup.

---

#### archIndex groups patterns by arch-context

> **Invariant:** Every pattern with an arch-context tag must appear in the archIndex.byContext map under its context key.
>
> **Rationale:** Component diagrams render bounded context subgraphs and need patterns grouped by context.

**Verified by:**

- Group patterns by context
- Group patterns by context

  The archIndex.byContext map groups patterns by bounded context
  for subgraph rendering in component diagrams.

---

#### archIndex groups patterns by arch-layer

> **Invariant:** Every pattern with an arch-layer tag must appear in the archIndex.byLayer map under its layer key.
>
> **Rationale:** Layered diagrams render layer subgraphs and need patterns grouped by architectural layer.

**Verified by:**

- Group patterns by layer
- Group patterns by layer

  The archIndex.byLayer map groups patterns by architectural layer
  (domain

- application
- infrastructure) for layered diagram rendering.

---

#### archIndex.all contains all patterns with any arch tag

> **Invariant:** archIndex.all must contain exactly the set of patterns that have at least one arch tag (role, context, or layer).
>
> **Rationale:** Consumers iterating over all architectural patterns need a single canonical list; omitting partially-tagged patterns would silently drop them from diagrams.

**Verified by:**

- archIndex.all includes all annotated patterns
- archIndex.all includes all annotated patterns

  The archIndex.all array contains all patterns that have at least
  one arch tag (role

- context
- or layer). Patterns without any arch
  tags are excluded.

---

#### Patterns without arch tags are excluded from archIndex

> **Invariant:** Patterns lacking all three arch tags (role, context, layer) must not appear in any archIndex view.
>
> **Rationale:** Including non-architectural patterns would pollute diagrams with irrelevant components.

**Verified by:**

- Non-annotated patterns excluded
- Non-annotated patterns excluded

  Patterns that have no arch-role

- arch-context
- or arch-layer are
  not included in the archIndex at all.

_arch-index.feature_

### Architecture Doc Refactoring

_Validates that ARCHITECTURE.md retains its full reference content and that_

---

#### Product area sections coexist with generated documents

> **Invariant:** Each architecture section in docs/ARCHITECTURE.md has a corresponding generated document in docs-live/product-areas/ covering equivalent content from annotated sources.
>
> **Rationale:** Manual and generated docs must coexist during the transition period. Generated docs prove that annotated sources produce equivalent coverage before manual sections are deprecated.

**Verified by:**

- Configuration Architecture section retained and generated doc exists
- Source Systems section retained and annotation product area exists
- Workflow Integration section retained and process product area exists

---

#### Four-Stage Pipeline section retains annotation format examples

> **Invariant:** The Four-Stage Pipeline section contains annotation format examples (e.g., @architect-shape, extract-shapes) and appears before the Source Systems section in document order.
>
> **Rationale:** Annotation format examples in the pipeline section demonstrate the source-first architecture. Their ordering establishes the conceptual flow: pipeline stages first, then the source systems that feed them.

**Verified by:**

- Annotation format examples appear before Source Systems

---

#### Convention extraction produces ARCHITECTURE-CODECS reference document

> **Invariant:** The ARCHITECTURE-CODECS.md reference document is generated from convention-tagged JSDoc in codec source files and contains structured sections for each codec with output file references.
>
> **Rationale:** Codec documentation must stay synchronized with source code. Convention extraction from JSDoc ensures the reference document reflects actual codec implementations rather than manually maintained descriptions that drift.

**Verified by:**

- Session codecs file produces multiple convention sections
- Convention sections include output file references
- ARCHITECTURE-CODECS document has substantial content from all codec files
- Session codec source file has structured JSDoc headings
- Convention rule titles match source heading text in generated output

---

#### Full sections coexist with generated equivalents in docs-live

> **Invariant:** Major sections of ARCHITECTURE.md (Unified Transformation, Data Flow Diagrams, Quick Reference) are retained alongside their generated equivalents in docs-live/reference/.
>
> **Rationale:** Generated reference documents (ARCHITECTURE-TYPES.md, ARCHITECTURE-CODECS.md) provide exhaustive type and codec listings, but the manual sections offer architectural narrative and design rationale that generated docs cannot yet replicate.

**Verified by:**

- Unified Transformation Architecture section retained and ARCHITECTURE-TYPES exists
- Data Flow Diagrams section retained and ARCHITECTURE-TYPES exists
- Quick Reference section retained and ARCHITECTURE-CODECS exists

---

#### MasterDataset shapes appear in ARCHITECTURE-TYPES reference

> **Invariant:** The ARCHITECTURE-TYPES.md reference document contains core MasterDataset types (MasterDataset, RuntimeMasterDataset, RawDataset) and pipeline types (PipelineOptions, PipelineResult) extracted from shape annotations.
>
> **Rationale:** Type shapes are the structural backbone of the pipeline. Generating their documentation from annotations ensures the reference always matches the actual TypeScript interfaces, eliminating manual drift.

**Verified by:**

- Core MasterDataset types appear in ARCHITECTURE-TYPES
- Pipeline types appear in ARCHITECTURE-TYPES reference
- Unified Transformation section has full MasterDataset content

---

#### Pipeline architecture convention appears in generated reference

> **Invariant:** Source files in the pipeline layer (orchestrator.ts, build-pipeline.ts) carry the pipeline-architecture convention tag, enabling convention extraction into the ARCHITECTURE-TYPES reference document.
>
> **Rationale:** Convention tags on pipeline source files are the mechanism that feeds content into generated reference docs. Without these tags, the architecture reference would have no source material to extract.

**Verified by:**

- Orchestrator source file has pipeline-architecture convention tag
- Build-pipeline source file has pipeline-architecture convention tag

---

#### Full ARCHITECTURE.md retains all sections with substantial content

> **Invariant:** ARCHITECTURE.md retains all major sections (Programmatic Usage, Extending the System, Key Design Patterns) with substantial content and remains under 1700 lines as a comprehensive reference.
>
> **Rationale:** These sections contain editorial content (usage examples, extension guides, design pattern explanations) that cannot be generated from annotations. They remain manual until procedural guide codecs can replicate their depth.

**Verified by:**

- Programmatic Usage section exists in ARCHITECTURE.md
- Extending the System section exists in ARCHITECTURE.md
- Key Design Patterns section has design pattern content
- ARCHITECTURE.md is under 1700 lines as full reference

_architecture-doc-refactoring.feature_

### Arch Tag Extraction

_As a documentation generator_

---

#### arch-role tag is defined in the registry

> **Invariant:** The tag registry must contain an arch-role tag with enum format and all valid architectural role values.
>
> **Rationale:** Without a registry-defined arch-role tag, the extractor cannot validate role values and diagrams may render invalid roles.

**Verified by:**

- arch-role tag exists with enum format
- arch-role has required enum values
- arch-role has required enum values

  Architecture roles classify components for diagram rendering.
  Valid roles: command-handler

- projection
- saga
- process-manager
- infrastructure
- repository
- decider
- read-model
- bounded-context.

---

#### arch-context tag is defined in the registry

> **Invariant:** The tag registry must contain an arch-context tag with value format for free-form bounded context names.
>
> **Rationale:** Without a registry-defined arch-context tag, bounded context groupings cannot be validated and diagrams may contain arbitrary context names.

**Verified by:**

- arch-context tag exists with value format
- arch-context tag exists with value format

  Context tags group components into bounded context subgraphs.
  Format is "value" (free-form string like "orders"

- "inventory").

---

#### arch-layer tag is defined in the registry

> **Invariant:** The tag registry must contain an arch-layer tag with enum format and exactly three values: domain, application, infrastructure.
>
> **Rationale:** Allowing arbitrary layer values would break the fixed Clean Architecture ordering that layered diagrams depend on.

**Verified by:**

- arch-layer tag exists with enum format
- arch-layer has exactly three values
- arch-layer has exactly three values

  Layer tags enable layered architecture diagrams.
  Valid layers: domain

- application
- infrastructure.

---

#### AST parser extracts arch-role from TypeScript annotations

> **Invariant:** The AST parser must extract the arch-role value from JSDoc annotations and populate the directive's archRole field.
>
> **Rationale:** If arch-role is not extracted, patterns cannot be classified by architectural role and diagram node styling is lost.

**Verified by:**

- Extract arch-role projection
- Extract arch-role command-handler
- Extract arch-role command-handler

  The AST parser must extract arch-role alongside other pattern metadata.

---

#### AST parser extracts arch-context from TypeScript annotations

> **Invariant:** The AST parser must extract the arch-context value from JSDoc annotations and populate the directive's archContext field.
>
> **Rationale:** If arch-context is not extracted, component diagrams cannot group patterns into bounded context subgraphs.

**Verified by:**

- Extract arch-context orders
- Extract arch-context inventory
- Extract arch-context inventory

  Context values are free-form strings naming the bounded context.

---

#### AST parser extracts arch-layer from TypeScript annotations

> **Invariant:** The AST parser must extract the arch-layer value from JSDoc annotations and populate the directive's archLayer field.
>
> **Rationale:** If arch-layer is not extracted, layered diagrams cannot group patterns into domain/application/infrastructure subgraphs.

**Verified by:**

- Extract arch-layer application
- Extract arch-layer infrastructure
- Extract arch-layer infrastructure

  Layer tags classify components by architectural layer.

---

#### AST parser handles multiple arch tags together

> **Invariant:** When a JSDoc block contains arch-role, arch-context, and arch-layer tags, all three must be extracted into the directive.
>
> **Rationale:** Partial extraction would cause components to be missing from role, context, or layer groupings depending on which tag was dropped.

**Verified by:**

- Extract all three arch tags
- Extract all three arch tags

  Components often have role + context + layer together.

---

#### Missing arch tags yield undefined values

> **Invariant:** Arch tag fields absent from a JSDoc block must be undefined in the extracted directive, not null or empty string.
>
> **Rationale:** Downstream consumers distinguish between "not annotated" (undefined) and "annotated with empty value" to avoid rendering ghost nodes.

**Verified by:**

- Missing arch tags are undefined
- Missing arch tags are undefined

  Components without arch tags should have undefined (not null or empty).

_arch-tag-extraction.feature_

### Business Rules Document Codec

_Tests the BusinessRulesCodec transformation from MasterDataset to RenderableDocument._

---

#### Extracts Rule blocks with Invariant and Rationale

> **Invariant:** Annotated Rule blocks must have their Invariant, Rationale, and Verified-by fields faithfully extracted and rendered.
>
> **Rationale:** These structured annotations are the primary content of business rules documentation; losing them silently produces incomplete output.

**Verified by:**

- Extracts annotated Rule with Invariant and Rationale
- Extracts unannotated Rule without showing not specified

---

#### Organizes rules by product area and phase

> **Invariant:** Rules must be grouped by product area and ordered by phase number within each group.
>
> **Rationale:** Ungrouped or misordered rules make it impossible to find domain-specific constraints or understand their delivery sequence.

**Verified by:**

- Groups rules by product area and phase
- Orders rules by phase within domain

---

#### Summary mode generates compact output

> **Invariant:** Summary mode must produce only a statistics line and omit all detailed rule headings and content.
>
> **Rationale:** AI context windows have strict token limits; including full detail in summary mode wastes context budget and degrades session quality.

**Verified by:**

- Summary mode includes statistics line
- Summary mode excludes detailed sections

---

#### Preserves code examples and tables in detailed mode

> **Invariant:** Code examples must appear only in detailed mode and must be excluded from standard mode output.
>
> **Rationale:** Code blocks in standard mode clutter the overview and push important rule summaries out of view; detailed mode is the opt-in path for full content.

**Verified by:**

- Code examples included in detailed mode
- Code examples excluded in standard mode

---

#### Generates scenario traceability links

> **Invariant:** Verification links must include the source file path so readers can locate the verifying scenario.
>
> **Rationale:** Links without file paths are unresolvable, breaking the traceability chain between business rules and their executable specifications.

**Verified by:**

- Verification links include file path

---

#### Progressive disclosure generates detail files per product area

> **Invariant:** Each product area with rules must produce a separate detail file, and the main document must link to all detail files via an index table.
>
> **Rationale:** A single monolithic document becomes unnavigable at scale; progressive disclosure lets readers drill into only the product area they need.

**Verified by:**

- Detail files are generated per product area
- Main document has product area index table with links
- Detail files have back-link to main document

---

#### Empty rules show placeholder instead of blank content

> **Invariant:** Rules with no invariant, description, or scenarios must render a placeholder message; rules with scenarios but no invariant must show the verified-by list instead.
>
> **Rationale:** Blank rule sections are indistinguishable from rendering bugs; explicit placeholders signal intentional incompleteness versus broken extraction.

**Verified by:**

- Rule without invariant or description or scenarios shows placeholder
- Rule without invariant but with scenarios shows verified-by instead

---

#### Rules always render flat for full visibility

> **Invariant:** Rule output must never use collapsible blocks regardless of rule count; all rule headings must be directly visible.
>
> **Rationale:** Business rules are compliance-critical content; hiding them behind collapsible sections risks rules being overlooked during review.

**Verified by:**

- Features with many rules render flat without collapsible blocks

---

#### Source file shown as filename text

> **Invariant:** Source file references must render as plain filename text, not as markdown links.
>
> **Rationale:** Markdown links to local file paths break in every viewer except the local filesystem, producing dead links that erode trust in the documentation.

**Verified by:**

- Source file rendered as plain text not link

---

#### Verified-by renders as checkbox list at standard level

> **Invariant:** Verified-by must render as a checkbox list of scenario names, with duplicate names deduplicated.
>
> **Rationale:** Duplicate entries inflate the checklist and mislead reviewers into thinking more verification exists than actually does.

**Verified by:**

- Rules with scenarios show verified-by checklist
- Duplicate scenario names are deduplicated

---

#### Feature names are humanized from camelCase pattern names

> **Invariant:** CamelCase pattern names must be converted to space-separated headings with trailing "Testing" suffixes stripped.
>
> **Rationale:** Raw camelCase names are unreadable in documentation headings, and "Testing" suffixes leak implementation concerns into user-facing output.

**Verified by:**

- CamelCase pattern name becomes spaced heading
- Testing suffix is stripped from feature names

_business-rules-codec.feature_

### Codec Based Generator

_Tests the CodecBasedGenerator which adapts the RenderableDocument Model (RDM)_

---

#### CodecBasedGenerator adapts codecs to generator interface

> **Invariant:** CodecBasedGenerator delegates document generation to the underlying codec and surfaces codec errors through the generator interface.
>
> **Rationale:** The adapter pattern enables codec-based rendering to integrate with the existing orchestrator without modifying either side.

**Verified by:**

- Generator delegates to codec
- Missing MasterDataset returns error
- Codec options are passed through

_codec-based.feature_

### Component Diagram Generation

_As a documentation generator_

---

#### Component diagrams group patterns by bounded context

> **Invariant:** Each distinct arch-context value must produce exactly one Mermaid subgraph containing all patterns with that context.
>
> **Rationale:** Without subgraph grouping, the visual relationship between components and their bounded context is lost, making the diagram structurally meaningless.

**Verified by:**

- Generate subgraphs for bounded contexts
- Generate subgraphs for bounded contexts

  Patterns with arch-context are grouped into Mermaid subgraphs.
  Each bounded context becomes a visual container.

---

#### Context-less patterns go to Shared Infrastructure

> **Invariant:** Patterns without an arch-context value must be placed in a "Shared Infrastructure" subgraph, never omitted from the diagram.
>
> **Rationale:** Cross-cutting infrastructure components (event bus, logger) belong to no bounded context but must still appear in the diagram.

**Verified by:**

- Shared infrastructure subgraph for context-less patterns
- Shared infrastructure subgraph for context-less patterns

  Patterns without arch-context are grouped into a
  "Shared Infrastructure" subgraph.

---

#### Relationship types render with distinct arrow styles

> **Invariant:** Each relationship type must render with its designated Mermaid arrow style: uses (-->), depends-on (-.->), implements (..->), extends (-->>).
>
> **Rationale:** Distinct arrow styles convey dependency semantics visually; conflating them loses architectural information.

**Verified by:**

- Arrow styles for relationship types
- Arrow styles for relationship types

  Arrow styles follow UML conventions:
  - uses: solid arrow (-->)
  - depends-on: dashed arrow (-.->)
  - implements: dotted arrow (..->)
  - extends: open arrow (-->>)

---

#### Arrows only connect annotated components

> **Invariant:** Relationship arrows must only be rendered when both source and target patterns exist in the architecture index.
>
> **Rationale:** Rendering an arrow to a non-existent node would produce invalid Mermaid syntax or dangling references.

**Verified by:**

- Skip arrows to non-annotated targets
- Skip arrows to non-annotated targets

  Relationships pointing to non-annotated patterns
  are not rendered (target would not exist in diagram).

---

#### Component diagram includes summary section

> **Invariant:** The generated component diagram document must include an Overview section with component count and bounded context count.
>
> **Rationale:** Without summary counts, readers cannot quickly assess diagram scope or detect missing components.

**Verified by:**

- Summary section with counts
- Summary section with counts

  The generated document starts with an overview section
  showing component counts and bounded context statistics.

---

#### Component diagram includes legend when enabled

> **Invariant:** When the legend is enabled, the document must include a Legend section explaining relationship arrow styles.
>
> **Rationale:** Without a legend, readers cannot distinguish uses, depends-on, implements, and extends arrows, making relationship semantics ambiguous.

**Verified by:**

- Legend section with arrow explanations
- Legend section with arrow explanations

  The legend explains arrow style meanings for readers.

---

#### Component diagram includes inventory table when enabled

> **Invariant:** When the inventory is enabled, the document must include a Component Inventory table with Component, Context, Role, and Layer columns.
>
> **Rationale:** The inventory provides a searchable, text-based alternative to the visual diagram for tooling and accessibility.

**Verified by:**

- Inventory table with component details
- Inventory table with component details

  The inventory lists all components with their metadata.

---

#### Empty architecture data shows guidance message

> **Invariant:** When no patterns have architecture annotations, the document must display a guidance message explaining how to add arch tags.
>
> **Rationale:** An empty diagram with no explanation would be confusing; guidance helps users onboard to the annotation system.

**Verified by:**

- No architecture data message
- No architecture data message

  If no patterns have architecture annotations

- the document explains how to add them.

_component-diagram.feature_

### Composite Codec

_Assembles reference documents from multiple codec outputs by_

---

#### CompositeCodec concatenates sections in codec array order

> **Invariant:** Sections from child codecs appear in the composite output in the same order as the codecs array.
>
> **Rationale:** Non-deterministic section ordering would make generated documents unstable across runs, breaking diff-based review workflows.

**Verified by:**

- Sections from two codecs appear in order
- Three codecs produce sections in array order

---

#### Separators between codec outputs are configurable

> **Invariant:** By default, a separator block is inserted between each child codec's sections. When separateSections is false, no separators are added.
>
> **Rationale:** Without configurable separators, consumers cannot control visual grouping — some documents need clear boundaries between codec outputs while others need seamless flow.

**Verified by:**

- Default separator between sections
- No separator when disabled

---

#### additionalFiles merge with last-wins semantics

> **Invariant:** additionalFiles from all children are merged into a single record. When keys collide, the later codec's value wins.
>
> **Rationale:** Silently dropping colliding keys would lose content without warning, while throwing on collision would prevent composing codecs that intentionally override shared file paths.

**Verified by:**

- Non-overlapping files merged
- Colliding keys use last-wins

---

#### composeDocuments works at document level without codecs

> **Invariant:** composeDocuments accepts RenderableDocument array and produces a composed RenderableDocument without requiring codecs.
>
> **Rationale:** Requiring a full codec instance for simple document merging would force unnecessary schema definitions when callers already hold pre-rendered documents.

**Verified by:**

- Direct document composition

---

#### Empty codec outputs are handled gracefully

> **Invariant:** Codecs producing empty sections arrays contribute nothing to the output. No separator is emitted for empty outputs.
>
> **Rationale:** Emitting separators around empty sections would produce orphaned dividers in the generated markdown, creating visual noise with no content between them.

**Verified by:**

- Empty codec skipped without separator

_composite-codec.feature_

### Content Deduplication

_Multiple sources may extract identical content, leading to_

---

#### Duplicate detection uses content fingerprinting

> **Invariant:** Content with identical normalized text must produce identical fingerprints.
>
> **Rationale:** Fingerprinting enables efficient duplicate detection without full text comparison.

**Verified by:**

- Identical content produces same fingerprint
- Whitespace differences are normalized
- Different content produces different fingerprints
- Similar headers with different content are preserved
- @acceptance-criteria scenarios below.

  Content fingerprints are computed from normalized text

- ignoring whitespace
  differences and minor formatting variations.

---

#### Duplicates are merged based on source priority

> **Invariant:** Higher-priority sources take precedence when merging duplicate content.
>
> **Rationale:** TypeScript sources have richer JSDoc; feature files provide behavioral context.

**Verified by:**

- TypeScript source takes priority over feature file
- Richer content takes priority when sources equal
- Source attribution is added to merged content
- @acceptance-criteria scenarios below.

  The merge strategy determines which content to keep based on source file
  priority and content richness once duplicates are detected.

---

#### Section order is preserved after deduplication

> **Invariant:** Section order matches the source mapping table order after deduplication.
>
> **Rationale:** Predictable ordering ensures consistent documentation structure.

**Verified by:**

- Original order maintained after dedup
- Empty sections after dedup are removed
- @acceptance-criteria scenarios below.

  The order of sections in the source mapping table is preserved even
  after duplicates are removed.

---

#### Deduplicator integrates with source mapper pipeline

> **Invariant:** Deduplication runs after extraction and before document assembly.
>
> **Rationale:** All content must be extracted before duplicates can be identified.

**Verified by:**

- Deduplication happens in pipeline
- @acceptance-criteria scenarios below.

  The deduplicator is called after all extractions complete but before
  the RenderableDocument is assembled.

_content-deduplication.feature_

### Convention Extractor

_Extracts convention content from MasterDataset decision records_

---

#### Empty and missing inputs produce empty results

> **Invariant:** Extraction with no tags or no matching patterns always produces an empty result.
>
> **Rationale:** Callers must be able to distinguish "no conventions found" from errors without special-casing nulls or exceptions.

**Verified by:**

- Empty convention tags returns empty array
- No matching patterns returns empty array

---

#### Convention bundles are extracted from matching patterns

> **Invariant:** Each unique convention tag produces exactly one bundle, and patterns sharing a tag are merged into that bundle.
>
> **Rationale:** Without tag-based grouping and merging, convention content would be fragmented across duplicates, making downstream rendering unreliable.

**Verified by:**

- Single pattern with one convention tag produces one bundle
- Pattern with CSV conventions contributes to multiple bundles
- Multiple patterns with same convention merge into one bundle

---

#### Structured content is extracted from rule descriptions

> **Invariant:** Invariant, rationale, and table content embedded in rule descriptions must be extracted as structured metadata, not raw text.
>
> **Rationale:** Downstream renderers depend on structured fields to produce consistent documentation; unstructured text would require re-parsing at every consumption point.

**Verified by:**

- Invariant and rationale are extracted from rule description
- Tables in rule descriptions are extracted as structured data

---

#### Code examples in rule descriptions are preserved

> **Invariant:** Fenced code blocks (including Mermaid diagrams) in rule descriptions must be extracted as typed code examples and never discarded.
>
> **Rationale:** Losing code examples during extraction would silently degrade generated documentation, removing diagrams and samples authors intended to publish.

**Verified by:**

- Mermaid diagram in rule description is extracted as code example
- Rule description without code examples has no code examples field

---

#### TypeScript JSDoc conventions are extracted alongside Gherkin

> **Invariant:** TypeScript JSDoc and Gherkin convention sources sharing the same tag must merge into a single bundle with all rules preserved from both sources.
>
> **Rationale:** Conventions are defined across both TypeScript and Gherkin; failing to merge them would split a single logical convention into incomplete fragments.

**Verified by:**

- TypeScript pattern with heading sections produces multiple rules
- TypeScript pattern without headings becomes single rule
- TypeScript and Gherkin conventions merge in same bundle
- TypeScript pattern with convention but empty description
- TypeScript description with tables is extracted correctly
- TypeScript table with escaped union pipes preserves full cell values
- TypeScript description with code examples

_convention-extractor.feature_

### Decision Doc Codec

_Validates the Decision Doc Codec that parses decision documents (ADR/PDR_

---

#### Rule blocks are partitioned by semantic prefix

> **Invariant:** Decision document rules must be partitioned into ADR sections based on their semantic prefix (e.g., "Decision:", "Context:", "Consequence:"), with non-standard rules placed in an "other" category.
>
> **Rationale:** Semantic partitioning produces structured ADR output that follows the standard ADR format — unpartitioned rules would generate a flat, unnavigable document.

**Verified by:**

- Partition rules into ADR sections
- Non-standard rules go to other category

---

#### DocStrings are extracted with language tags

> **Invariant:** DocStrings within rule descriptions must be extracted preserving their language tag (e.g., typescript, bash), defaulting to "text" when no language is specified.
>
> **Rationale:** Language tags enable syntax highlighting in generated markdown code blocks — losing the tag produces unformatted code that is harder to read.

**Verified by:**

- Extract single DocString
- Extract multiple DocStrings
- DocString without language defaults to text

---

#### Source mapping tables are parsed from rule descriptions

> **Invariant:** Markdown tables in rule descriptions with source mapping columns must be parsed into structured data, returning empty arrays when no table is present.
>
> **Rationale:** Source mapping tables drive the extraction pipeline — they define which files to read and what content to extract for each decision section.

**Verified by:**

- Parse basic source mapping table
- No source mapping returns empty

---

#### Self-reference markers are correctly detected

> **Invariant:** The "THIS DECISION" marker must be recognized as a self-reference to the current decision document, with optional rule name qualifiers parsed correctly.
>
> **Rationale:** Self-references enable decisions to extract content from their own rules — misdetecting them would trigger file-system lookups for a non-existent "THIS DECISION" file.

**Verified by:**

- Detect THIS DECISION marker
- Detect THIS DECISION with Rule
- Regular file path is not self-reference
- Parse self-reference types
- Parse self-reference with rule name

---

#### Extraction methods are normalized to known types

> **Invariant:** Extraction method strings from source mapping tables must be normalized to canonical method names for dispatcher routing.
>
> **Rationale:** Users may write extraction methods in various formats (e.g., "Decision rule description", "extract-shapes") — normalization ensures consistent dispatch regardless of formatting.

**Verified by:**

- Normalize Decision rule description
- Normalize extract-shapes
- Normalize unknown method

---

#### Complete decision documents are parsed with all content

> **Invariant:** A complete decision document must be parseable into its constituent parts including rules, DocStrings, source mappings, and self-references in a single parse operation.
>
> **Rationale:** Complete parsing validates that all codec features compose correctly — partial parsing could miss interactions between features.

**Verified by:**

- Parse complete decision document

---

#### Rules can be found by name with partial matching

> **Invariant:** Rules must be findable by exact name match or partial (substring) name match, returning undefined when no match exists.
>
> **Rationale:** Partial matching supports flexible cross-references between decisions — requiring exact matches would make references brittle to minor naming changes.

**Verified by:**

- Find rule by exact name
- Find rule by partial name
- Rule not found returns undefined

_decision-doc-codec.feature_

### Decision Doc Generator

_The Decision Doc Generator orchestrates the full documentation generation_

---

#### Output paths are determined from pattern metadata

> **Invariant:** Output file paths must be derived from pattern metadata using kebab-case conversion of the pattern name, with configurable section prefixes.
>
> **Rationale:** Consistent path derivation ensures generated files are predictable and linkable — ad-hoc paths would break cross-document references.

**Verified by:**

- Default output paths for pattern
- Custom section for compact output
- CamelCase pattern converted to kebab-case

---

#### Compact output includes only essential content

> **Invariant:** Compact output mode must include only essential decision content (type shapes, key constraints) while excluding full descriptions and verbose sections.
>
> **Rationale:** Compact output is designed for AI context windows where token budget is limited — including full descriptions would negate the space savings.

**Verified by:**

- Compact output excludes full descriptions
- Compact output includes type shapes
- Compact output handles empty content

---

#### Detailed output includes full content

> **Invariant:** Detailed output mode must include all decision content including full descriptions, consequences, and DocStrings rendered as code blocks.
>
> **Rationale:** Detailed output serves as the complete human reference — omitting any section would force readers to consult source files for the full picture.

**Verified by:**

- Detailed output includes all sections
- Detailed output includes consequences
- Detailed output includes DocStrings as code blocks

---

#### Multi-level generation produces both outputs

> **Invariant:** The generator must produce both compact and detailed output files from a single generation run, using the pattern name or patternName tag as the identifier.
>
> **Rationale:** Both output levels serve different audiences (AI vs human) — generating them together ensures consistency and eliminates the risk of one becoming stale.

**Verified by:**

- Generate both compact and detailed outputs
- Pattern name falls back to pattern.name

---

#### Generator is registered with the registry

> **Invariant:** The decision document generator must be registered with the generator registry under a canonical name and must filter input patterns to only those with source mappings.
>
> **Rationale:** Registry registration enables discovery via --list-generators — filtering to source-mapped patterns prevents empty output for patterns without decision metadata.

**Verified by:**

- Generator is registered with correct name
- Generator filters patterns by source mapping presence
- Generator processes patterns with source mappings

---

#### Source mappings are executed during generation

> **Invariant:** Source mapping tables must be executed during generation to extract content from referenced files, with missing files reported as validation errors.
>
> **Rationale:** Source mappings are the bridge between decision specs and implementation — unexecuted mappings produce empty sections, while silent missing-file errors hide broken references.

**Verified by:**

- Source mappings are executed
- Missing source files are reported as validation errors

_decision-doc-generator.feature_

### Dedent Helper

_- DocStrings in Gherkin files have consistent indentation for alignment_

---

#### Tabs are normalized to spaces before dedent

> **Invariant:** Tab characters must be converted to spaces before calculating the minimum indentation level.
>
> **Rationale:** Mixing tabs and spaces produces incorrect indentation calculations — normalizing first ensures consistent dedent depth.

**Verified by:**

- Tab-indented code is properly dedented
- Mixed tabs and spaces are normalized

---

#### Empty lines are handled correctly

> **Invariant:** Empty lines (including lines with only whitespace) must not affect the minimum indentation calculation and must be preserved in output.
>
> **Rationale:** Counting whitespace-only lines as indented content would inflate the minimum indentation, causing non-empty lines to retain unwanted leading spaces.

**Verified by:**

- Empty lines with trailing spaces are preserved
- All empty lines returns original text

---

#### Single line input is handled

> **Invariant:** Single-line input must have its leading whitespace removed without errors or unexpected transformations.
>
> **Rationale:** Failing or returning empty output on single-line input would break callers that extract individual lines from multi-line DocStrings.

**Verified by:**

- Single line with indentation is dedented
- Single line without indentation is unchanged

---

#### Unicode whitespace is handled

> **Invariant:** Non-breaking spaces and other Unicode whitespace characters must be treated as content, not as indentation to be removed.
>
> **Rationale:** Stripping Unicode whitespace as indentation would corrupt intentional formatting in source code and documentation content.

**Verified by:**

- Non-breaking space is treated as content

---

#### Relative indentation is preserved

> **Invariant:** After removing the common leading whitespace, the relative indentation between lines must remain unchanged.
>
> **Rationale:** Altering relative indentation would break the syntactic structure of extracted code blocks, making them unparseable or semantically incorrect.

**Verified by:**

- Nested code blocks preserve relative indentation
- Mixed indentation levels are preserved relatively

_dedent.feature_

### Description Header Normalization

_Pattern descriptions should not create duplicate headers when rendered._

---

#### Leading headers are stripped from pattern descriptions

> **Invariant:** Markdown headers at the start of a pattern description are removed before rendering to prevent duplicate headings under the Description section.
>
> **Rationale:** The codec already emits a "## Description" header; preserving the source header would create a redundant or conflicting heading hierarchy.

**Verified by:**

- Strip single leading markdown header
- Strip multiple leading headers
- Preserve description without leading header

---

#### Edge cases are handled correctly

> **Invariant:** Header stripping handles degenerate inputs (header-only, whitespace-only, mid-description headers) without data loss or rendering errors.
>
> **Rationale:** Patterns with unusual descriptions (header-only stubs, whitespace padding) are common in early roadmap stages; crashing on these would block documentation generation for the entire dataset.

**Verified by:**

- Empty description after stripping headers
- Description with only whitespace and headers
- Header in middle of description is preserved

---

#### stripLeadingHeaders removes only leading headers

> **Invariant:** The helper function strips only headers that appear before any non-header content; headers occurring after body text are preserved.
>
> **Rationale:** Mid-description headers are intentional structural elements authored by the user; stripping them would silently destroy document structure.

**Verified by:**

- Strips h1 header
- Strips h2 through h6 headers
- Strips leading empty lines before header
- Preserves content starting with text
- Returns empty string for header-only input
- Handles null/undefined input

_description-headers.feature_

### Description Quality Foundation

_- CamelCase pattern names (e.g., "RemainingWorkEnhancement") are hard to read_

---

#### Behavior files are verified during pattern extraction

> **Invariant:** Every timeline pattern must report whether its corresponding behavior file exists.
>
> **Rationale:** Without verification at extraction time, traceability reports would silently include broken references to non-existent behavior files.

**Verified by:**

- Behavior file existence verified during extraction
- Missing behavior file sets verification to false
- Explicit behavior file tag skips verification
- Behavior file inferred from timeline naming convention

---

#### Traceability coverage reports verified and unverified behavior files

> **Invariant:** Coverage reports must distinguish between patterns with verified behavior files and those without.
>
> **Rationale:** Conflating verified and unverified coverage would overstate test confidence, hiding gaps that should be addressed before release.

**Verified by:**

- Traceability shows covered phases with verified behavior files

---

#### Pattern names are transformed to human-readable display names

> **Invariant:** Display names must convert CamelCase to title case, handle consecutive capitals, and respect explicit title overrides.
>
> **Rationale:** CamelCase identifiers are unreadable in generated documentation; human-readable names are essential for non-developer consumers of pattern registries.

**Verified by:**

- CamelCase pattern names transformed to title case
- PascalCase with consecutive caps handled correctly
- Falls back to name when no patternName
- Explicit title tag overrides CamelCase transformation

---

#### PRD acceptance criteria are formatted with numbering and bold keywords

> **Invariant:** PRD output must number acceptance criteria and bold Given/When/Then keywords when steps are enabled.
>
> **Rationale:** Unnumbered criteria are difficult to reference in reviews; unformatted step keywords blend into prose, making scenarios harder to parse visually.

**Verified by:**

- PRD shows numbered acceptance criteria with bold keywords
- PRD respects includeScenarioSteps flag
- PRD shows full Feature description without truncation

---

#### Business values are formatted for human readability

> **Invariant:** Hyphenated business value tags must be converted to space-separated readable text in all output contexts.
>
> **Rationale:** Raw hyphenated tags like "enable-rich-prd" are annotation artifacts; displaying them verbatim in generated docs confuses readers expecting natural language.

**Verified by:**

- Hyphenated business value converted to spaces
- Business value displayed in Next Actionable table
- File extensions not treated as sentence endings

_description-quality-foundation.feature_

### Design Review Generation Tests

_Tests the full design review generation pipeline: sequence annotations are_

---

#### SequenceIndex pre-computes ordered steps from annotated rules

> **Invariant:** buildSequenceIndexEntry produces a SequenceIndexEntry with steps sorted by stepNumber, participants deduplicated with orchestrator first, and data flow types collected from Input/Output annotations.
>
> **Rationale:** Pre-computing in the transform pass avoids repeated parsing in the codec. ADR-006 mandates the MasterDataset as the sole read model.

**Verified by:**

- SequenceIndex populated for annotated pattern
- Steps sorted by step number
- Patterns without sequence annotations have no entry

---

#### Participants are deduplicated with orchestrator first

> **Invariant:** The participants array starts with the orchestrator, followed by module names in first-appearance step order, with no duplicates.
>
> **Rationale:** Sequence diagram participant declarations must be ordered and unique. The orchestrator is always the first participant as the entry point.

**Verified by:**

- Participants ordered with orchestrator first

---

#### Data flow types are extracted from Input and Output annotations

> **Invariant:** The dataFlowTypes array contains distinct type names parsed from Input and Output annotation strings using the "TypeName -- fields" format.
>
> **Rationale:** Data flow types are used by the component diagram to render hexagon nodes and by the type definitions table to show producers and consumers.

**Verified by:**

- Data flow types collected from annotations
- Prose outputs are excluded from data flow types

---

#### DesignReviewCodec produces sequence diagram with correct participant count

> **Invariant:** The rendered sequence diagram participant list includes User plus all participants from the SequenceIndexEntry. The count equals 1 (User) plus the number of unique participants.
>
> **Rationale:** Correct participant count proves the codec reads SequenceIndex data correctly and maps it to Mermaid syntax.

**Verified by:**

- Sequence diagram has correct participant count

---

#### Error scenarios produce alt blocks in sequence diagrams

> **Invariant:** Each error scenario name from a step's errorScenarios array produces an alt block in the Mermaid sequence diagram with the scenario name as the condition text.
>
> **Rationale:** Alt blocks make error handling visible in the sequence diagram, enabling design review verification of error path completeness.

**Verified by:**

- Error scenarios produce alt blocks in output

---

#### Component diagram groups modules by shared input type

> **Invariant:** Contiguous steps sharing the same Input type annotation are grouped into a single subgraph in the component diagram. Non-contiguous steps with the same input become separate subgraphs.
>
> **Rationale:** Grouping by input type reveals natural phase boundaries in the orchestration flow, making data flow architecture visible.

**Verified by:**

- Modules with same input grouped together

---

#### Component diagram module nodes are scoped per phase

> **Invariant:** Repeated modules in non-contiguous phases render with distinct Mermaid node IDs, while repeated use of the same module inside one phase reuses a single declaration.
>
> **Rationale:** Mermaid node IDs are global across the diagram. Reusing raw module IDs causes later phases to collapse into earlier declarations and misrepresent the orchestration flow.

**Verified by:**

- Repeated module in non-contiguous phases gets distinct node ids
- Repeated module in one phase is declared once

---

#### Type hexagons show field definitions from Output annotations

> **Invariant:** Output annotations with the "TypeName -- field1, field2" format produce hexagon nodes in the component diagram containing the type name and field names separated by newlines.
>
> **Rationale:** Type hexagons make central data contracts visible, enabling design reviewers to verify interface completeness.

**Verified by:**

- Type hexagon rendered with fields

---

#### Mermaid-sensitive text is escaped across rendered labels

> **Invariant:** Participant aliases, subgraph labels, type hexagon text, and edge labels escape Mermaid-sensitive characters such as quotes, pipes, and comment markers before rendering.
>
> **Rationale:** Design review diagrams are generated directly from annotations. Valid annotation text must not break Mermaid parsing when rendered into different label positions.

**Verified by:**

- Mermaid-sensitive text is escaped in rendered markdown

---

#### Design questions table includes auto-computed metrics

> **Invariant:** The Design Questions section contains a table with auto-computed step count, type count, and error path count drawn from the SequenceIndexEntry data.
>
> **Rationale:** Auto-computed metrics reduce manual counting during design reviews and highlight coverage gaps (e.g., 0 error paths).

**Verified by:**

- Design questions table has correct metrics

---

#### Invalid sequence annotations are skipped with validation warnings

> **Invariant:** Patterns with ambiguous sequence-step numbering or empty sequence-module tags are excluded from sequenceIndex and reported through malformedPatterns.
>
> **Rationale:** Design reviews should never render misleading diagrams from malformed annotations. The transform pass is the correct place to validate and suppress bad sequence entries.

**Verified by:**

- Duplicate step numbers are reported as malformed
- Sequence step without modules is reported as malformed

---

#### Process API sequence lookup resolves pattern names case-insensitively

> **Invariant:** The sequence subcommand resolves pattern names with the same case-insensitive matching behavior as other pattern-oriented process-api queries.
>
> **Rationale:** Design review consumers should not need exact display-name casing when querying sequence data from the CLI.

**Verified by:**

- Sequence lookup accepts lowercase pattern name

_design-review.feature_

### Design Review Generator Lifecycle Tests

_The design review generator cleans up stale markdown files when annotated_

---

#### Orphaned design review files are scheduled for deletion

> **Invariant:** Existing markdown files in design-reviews/ that no longer map to the current sequenceIndex must be returned in filesToDelete, while current patterns remain preserved.
>
> **Rationale:** Renaming or removing sequence-annotated patterns otherwise leaves stale design review documents behind, which misleads readers and downstream tooling.

**Verified by:**

- Renamed pattern schedules stale design review for deletion

_design-review-generator.feature_

### Documentation Orchestrator

_Tests the orchestrator's pattern merging, conflict detection, and generator_

---

#### Orchestrator coordinates full documentation generation pipeline

> **Invariant:** Non-overlapping patterns from TypeScript and Gherkin sources must merge into a unified dataset; overlapping pattern names must fail with conflict error.
>
> **Rationale:** Silent merging of conflicting patterns would produce incorrect documentation — fail-fast ensures data integrity across the pipeline.

**Verified by:**

- Non-overlapping patterns merge successfully
- Orchestrator detects pattern name conflicts
- Orchestrator detects pattern name conflicts with status mismatch
- Unknown generator name fails gracefully
- Partial success when some generators are invalid

_orchestrator.feature_

### Extract Summary

_The extractSummary function transforms multi-line pattern descriptions into_

---

#### Single-line descriptions are returned as-is when complete

> **Invariant:** A single-line description that ends with sentence-ending punctuation is returned verbatim; one without gets an appended ellipsis.
>
> **Rationale:** Summaries appear in pattern tables where readers expect grammatically complete text; an ellipsis signals intentional truncation rather than a rendering bug.

**Verified by:**

- Complete sentence on single line
- Single line without sentence ending gets ellipsis

---

#### Multi-line descriptions are combined until sentence ending

> **Invariant:** Lines are concatenated until a sentence-ending punctuation mark is found or the character limit is reached, whichever comes first.
>
> **Rationale:** Splitting at arbitrary line breaks produces sentence fragments that lose meaning; combining until a natural boundary preserves semantic completeness.

**Verified by:**

- Two lines combine into complete sentence
- Combines lines up to sentence boundary within limit
- Long multi-line text truncates when exceeds limit
- Multi-line without sentence ending gets ellipsis

---

#### Long descriptions are truncated at sentence or word boundaries

> **Invariant:** Summaries exceeding the character limit are truncated at the nearest sentence boundary if possible, otherwise at a word boundary with an appended ellipsis.
>
> **Rationale:** Sentence-boundary truncation preserves semantic completeness; word-boundary fallback avoids mid-word breaks.

**Verified by:**

- Long text truncates at sentence boundary within limit
- Long text without sentence boundary truncates at word with ellipsis

---

#### Tautological and header lines are skipped

> **Invariant:** Lines that merely repeat the pattern name or consist only of a section header label (e.g., "Problem:", "Solution:") are skipped; the summary begins with the first substantive line.
>
> **Rationale:** Tautological opening lines waste the limited summary space without adding information.

**Verified by:**

- Skips pattern name as first line
- Skips section header labels
- Skips multiple header patterns

---

#### Edge cases are handled gracefully

> **Invariant:** Degenerate inputs (empty strings, markdown-only content, bold markers) produce valid output without errors: empty input yields empty string, formatting is stripped, and multiple sentence endings use the first.
>
> **Rationale:** Summary extraction runs on every pattern in the dataset; an unhandled edge case would crash the entire documentation generation pipeline.

**Verified by:**

- Empty description returns empty string
- Markdown headers are stripped
- Bold markdown is stripped
- Multiple sentence endings - takes first complete sentence
- Question mark as sentence ending

_extract-summary.feature_

### Generated Doc Quality Tests

_Tests for the four quality fixes in GeneratedDocQuality (Phase 38):_

---

#### Behavior-specs renderer does not duplicate convention table content

> **Invariant:** Convention tables appear exactly once in the output — in the convention section. The behavior-specs section shows only metadata.
>
> **Rationale:** DD-4: Duplicate tables waste 500+ lines and agent context tokens.

**Verified by:**

- Convention rule table appears exactly once in generated output
- Behavior-specs show rule metadata without tables

---

#### ARCHITECTURE-TYPES leads with type definitions

> **Invariant:** When shapesFirst is true, shapes render before conventions.
>
> **Rationale:** ARCHITECTURE-TYPES.md should open with type definitions, not orchestrator prose.

**Verified by:**

- Shapes section appears before conventions when shapesFirst is true

---

#### Product area docs have a generated table of contents

> **Invariant:** Product area docs with 3+ H2 headings include a Contents section with anchor links.
>
> **Rationale:** Large product area docs need browser-navigable TOC for human developers.

**Verified by:**

- Product area doc with multiple sections gets a TOC

---

#### Generation compact is self-sufficient

> **Invariant:** The Generation compact contains codec inventory and pipeline summary at 4+ KB.
>
> **Rationale:** DD-2: A 1.4 KB compact for the largest area means agents have no usable summary.

**Verified by:**

- Generation compact contains enriched content

_generated-doc-quality.feature_

### Generator Registry

_Tests the GeneratorRegistry registration, lookup, and listing capabilities._

---

#### Registry manages generator registration and retrieval

> **Invariant:** Each generator name is unique within the registry; duplicate registration is rejected and lookup of unknown names returns undefined.
>
> **Rationale:** Allowing duplicate names would silently overwrite an existing generator, causing previously registered behavior to disappear without warning.

**Verified by:**

- Register generator with unique name
- Duplicate registration throws error
- Get registered generator
- Get unknown generator returns undefined
- Available returns sorted list

_registry.feature_

### Git Branch Diff

_The branch diff utility returns changed files relative to a base branch for_

---

#### getChangedFilesList returns only existing changed files

> **Invariant:** Modified and added files are returned, while deleted tracked files are excluded from the final list.
>
> **Rationale:** PR-scoped generation only needs files that still exist on the current branch; including deleted paths would force consumers to chase files that cannot be read.

**Verified by:**

- Modified and added files are returned while deleted files are excluded

---

#### Paths with spaces are preserved

> **Invariant:** A filename containing spaces is returned as the exact original path, not split into multiple tokens.
>
> **Rationale:** Whitespace splitting corrupts file paths and breaks PR-scoped generation in repositories with descriptive filenames.

**Verified by:**

- File paths with spaces are preserved

---

#### NUL-delimited rename and copy statuses use the new path

> **Invariant:** Rename and copy statuses with similarity scores must record the current path, not the old/source path.
>
> **Rationale:** Git emits statuses like R100 and C087 in real diffs; parsing the wrong side of the pair causes generators to scope output to stale paths.

**Verified by:**

- Similarity status maps to the new path

_git-branch-diff.feature_

### Implementation Link Path Normalization

_Links to implementation files in generated pattern documents should have_

---

#### Repository prefixes are stripped from implementation paths

> **Invariant:** Implementation file paths must not contain repository-level prefixes like "libar-platform/" or "monorepo/".
>
> **Rationale:** Generated links are relative to the output directory; repository prefixes produce broken paths.

**Verified by:**

- Strip libar-platform prefix from implementation paths
- Strip monorepo prefix from implementation paths
- Preserve paths without repository prefix

---

#### All implementation links in a pattern are normalized

> **Invariant:** Every implementation link in a pattern document must have its path normalized, regardless of how many implementations exist.
>
> **Rationale:** A single un-normalized link in a multi-implementation pattern produces a broken reference that undermines trust in the entire generated document.

**Verified by:**

- Multiple implementations with mixed prefixes

---

#### normalizeImplPath strips known prefixes

> **Invariant:** normalizeImplPath removes only recognized repository prefixes from the start of a path and leaves all other path segments unchanged.
>
> **Rationale:** Over-stripping would corrupt legitimate path segments that happen to match a prefix name, producing silent broken links.

**Verified by:**

- Strips libar-platform/ prefix
- Strips monorepo/ prefix
- Returns unchanged path without known prefix
- Only strips prefix at start of path

_implementation-links.feature_

### Layered Diagram Generation

_As a documentation generator_

---

#### Layered diagrams group patterns by arch-layer

> **Invariant:** Each distinct arch-layer value must produce exactly one Mermaid subgraph containing all patterns with that layer.
>
> **Rationale:** Without layer subgraphs, the Clean Architecture boundary between domain, application, and infrastructure is not visually enforced.

**Verified by:**

- Generate subgraphs for each layer
- Generate subgraphs for each layer

  Patterns with arch-layer are grouped into Mermaid subgraphs.
  Each layer becomes a visual container.

---

#### Layer order is domain to infrastructure (top to bottom)

> **Invariant:** Layer subgraphs must be rendered in Clean Architecture order: domain first, then application, then infrastructure.
>
> **Rationale:** The visual order reflects the dependency rule where outer layers depend on inner layers; reversing it would misrepresent the architecture.

**Verified by:**

- Layers render in correct order
- Layers render in correct order

  The layer subgraphs are rendered in Clean Architecture order:
  domain at top

- then application
- then infrastructure at bottom.
  This reflects the dependency rule: outer layers depend on inner layers.

---

#### Context labels included in layered diagram nodes

> **Invariant:** Each node in a layered diagram must include its bounded context name as a label, since context is not conveyed by subgraph grouping.
>
> **Rationale:** Layered diagrams group by layer, not context, so the context label is the only way to identify which bounded context a node belongs to.

**Verified by:**

- Nodes include context labels
- Nodes include context labels

  Unlike component diagrams which group by context

- layered diagrams
  include the context as a label in each node name.

---

#### Patterns without layer go to Other subgraph

> **Invariant:** Patterns that have arch-role or arch-context but no arch-layer must be placed in an "Other" subgraph, never omitted from the diagram.
>
> **Rationale:** Omitting unlayered patterns would silently hide architectural components; the "Other" group makes their missing classification visible.

**Verified by:**

- Unlayered patterns in Other subgraph
- Unlayered patterns in Other subgraph

  Patterns that have arch-role or arch-context but no arch-layer
  are grouped into an "Other" subgraph.

---

#### Layered diagram includes summary section

> **Invariant:** The generated layered diagram document must include an Overview section with annotated source file count.
>
> **Rationale:** Without summary counts, readers cannot assess diagram completeness or detect missing annotated sources.

**Verified by:**

- Summary section for layered view
- Summary section for layered view

  The generated document starts with an overview section
  specific to layered architecture visualization.

_layered-diagram.feature_

### Load Preamble Parser

_Preamble content authored as inline TypeScript SectionBlock[] literals is_

---

#### Headings are parsed into HeadingBlock

> **Invariant:** Lines starting with 1-6 hash characters followed by a space produce HeadingBlock with the correct level and text.
>
> **Rationale:** Headings are the primary structural element in preamble markdown and must map exactly to HeadingBlock level values.

**Verified by:**

- Single heading is parsed
- All heading levels are parsed correctly

---

#### Paragraphs are parsed into ParagraphBlock

> **Invariant:** Consecutive non-empty, non-construct lines produce a single ParagraphBlock with lines joined by spaces.
>
> **Rationale:** Multi-line paragraphs in markdown are a single logical block separated by blank lines.

**Verified by:**

- Single line paragraph
- Multi-line paragraph joined with space

---

#### Separators are parsed into SeparatorBlock

> **Invariant:** Lines matching exactly three or more dashes, asterisks, or underscores produce SeparatorBlock.
>
> **Rationale:** Horizontal rules serve as visual separators in preamble content and must be faithfully represented.

**Verified by:**

- Triple dash separator

---

#### Tables are parsed into TableBlock

> **Invariant:** A line starting with pipe followed by a separator row produces TableBlock with columns from the header and rows from subsequent pipe-delimited lines.
>
> **Rationale:** Tables are heavily used in preamble content for structured reference data and must preserve column names and cell values exactly.

**Verified by:**

- Simple table with header and rows

---

#### Unordered lists are parsed into ListBlock

> **Invariant:** Lines starting with dash-space or asterisk-space produce ListBlock with ordered=false and string items.
>
> **Rationale:** Unordered lists are common in preamble content for enumerating capabilities or constraints.

**Verified by:**

- Dash list items
- GFM checkbox list items

---

#### Ordered lists are parsed into ListBlock

> **Invariant:** Lines starting with a digit followed by period-space produce ListBlock with ordered=true.
>
> **Rationale:** Ordered lists represent sequential steps in procedural guides and must preserve ordering semantics.

**Verified by:**

- Numbered list items

---

#### Code blocks are parsed into CodeBlock

> **Invariant:** Fenced code blocks with a language info string produce CodeBlock with the language and content fields.
>
> **Rationale:** Code examples in preamble content must preserve the language annotation for syntax highlighting in generated docs.

**Verified by:**

- Code block with language
- Empty code block

---

#### Mermaid blocks are parsed into MermaidBlock

> **Invariant:** Code fences with the info string "mermaid" produce MermaidBlock instead of CodeBlock.
>
> **Rationale:** Mermaid diagrams have a dedicated SectionBlock type for specialized rendering in generated docs.

**Verified by:**

- Mermaid diagram block

---

#### Mixed content produces correct block sequence

> **Invariant:** A markdown document with multiple construct types produces blocks in document order with correct types.
>
> **Rationale:** Preamble files combine headings, paragraphs, code blocks, and tables in sequence. The parser must handle transitions between all state machine states correctly.

**Verified by:**

- Mixed content in sequence

---

#### Bold and inline formatting is preserved in paragraphs

> **Invariant:** Inline markdown formatting such as bold, italic, and code spans are preserved as-is in ParagraphBlock text.
>
> **Rationale:** The parser produces structural blocks. Inline formatting is the responsibility of the markdown renderer, not the block parser.

**Verified by:**

- Bold text preserved in paragraph

_load-preamble.feature_

### Mermaid Relationship Rendering

_Tests for rendering all relationship types in Mermaid dependency graphs_

---

#### Each relationship type has a distinct arrow style

> **Invariant:** Each relationship type (uses, depends-on, implements, extends) must render with a unique, visually distinguishable arrow style.
>
> **Rationale:** Identical arrow styles would make relationship semantics indistinguishable in generated diagrams.

**Verified by:**

- Uses relationships render as solid arrows
- Depends-on relationships render as dashed arrows
- Implements relationships render as dotted arrows
- Extends relationships render as solid open arrows

---

#### Pattern names are sanitized for Mermaid node IDs

> **Invariant:** Pattern names must be transformed into valid Mermaid node IDs by replacing special characters (dots, hyphens, spaces) with underscores.
>
> **Rationale:** Unsanitized names containing dots, hyphens, or spaces produce invalid Mermaid syntax that fails to render.

**Verified by:**

- Special characters are replaced

---

#### All relationship types appear in single graph

> **Invariant:** The generated Mermaid graph must combine all relationship types (uses, depends-on, implements, extends) into a single top-down graph.
>
> **Rationale:** Splitting relationship types into separate graphs would fragment the dependency picture and hide cross-type interactions.

**Verified by:**

- Complete dependency graph with all relationship types

_mermaid-rendering.feature_

### Patterns Codec

_- Need to generate a comprehensive pattern registry from extracted patterns_

---

#### Document structure includes progress tracking and category navigation

> **Invariant:** Every decoded document must contain a title, purpose, Progress section with status counts, and category navigation regardless of dataset size.
>
> **Rationale:** The PATTERNS.md is the primary entry point for understanding project scope; incomplete structure would leave consumers without context.

**Verified by:**

- Decode empty dataset
- Decode dataset with patterns - document structure
- Progress summary shows correct counts

---

#### Pattern table presents all patterns sorted by status then name

> **Invariant:** The pattern table must include every pattern in the dataset with columns for Pattern, Category, Status, and Description, sorted by status priority (completed first) then alphabetically by name.
>
> **Rationale:** Consistent ordering allows quick scanning of project progress; completed patterns at top confirm done work, while roadmap items at bottom show remaining scope.

**Verified by:**

- Pattern table includes all patterns
- Pattern table is sorted by status then name

---

#### Category sections group patterns by domain

> **Invariant:** Each category in the dataset must produce an H3 section listing its patterns, and the filterCategories option must restrict output to only the specified categories.
>
> **Rationale:** Without category grouping, consumers must scan the entire flat pattern list to find domain-relevant patterns; filtering avoids noise in focused documentation.

**Verified by:**

- Category sections with pattern lists
- Filter to specific categories

---

#### Dependency graph visualizes pattern relationships

> **Invariant:** A Mermaid dependency graph must be included when pattern relationships exist and the includeDependencyGraph option is not disabled; it must be omitted when no relationships exist or when explicitly disabled.
>
> **Rationale:** Dependency relationships are invisible in flat pattern lists; the graph reveals implementation ordering and coupling that affects planning decisions.

**Verified by:**

- Dependency graph included when relationships exist
- No dependency graph when no relationships
- Dependency graph disabled by option

---

#### Detail file generation creates per-pattern pages

> **Invariant:** When generateDetailFiles is enabled, each pattern must produce an individual markdown file at patterns/{slug}.md containing an Overview section; when disabled, no additional files must be generated.
>
> **Rationale:** Detail files enable deep-linking into specific patterns from the main registry while keeping the index document scannable.

**Verified by:**

- Generate individual pattern files when enabled
- No detail files when disabled
- Individual pattern file contains full details

_patterns-codec.feature_

### Planning Codec

_- Need to generate planning checklists, session plans, and findings documents from patterns_

---

#### PlanningChecklistCodec prepares for implementation sessions

> **Invariant:** The checklist must include pre-planning questions, definition of done with deliverables, and dependency status for all actionable phases.
>
> **Rationale:** Implementation sessions fail without upfront preparation — the checklist surfaces blockers before work begins.

**Verified by:**

- No actionable phases produces empty message
- Summary shows phases to plan count
- Pre-planning questions section
- Definition of Done with deliverables
- Acceptance criteria from scenarios
- Risk assessment section
- Dependency status shows met vs unmet
- forActivePhases option
- forNextActionable option

---

#### SessionPlanCodec generates implementation plans

> **Invariant:** The plan must include status summary, implementation approach from use cases, deliverables with status, and acceptance criteria from scenarios.
>
> **Rationale:** A structured implementation plan ensures all deliverables and acceptance criteria are visible before coding starts.

**Verified by:**

- No phases to plan produces empty message
- Summary shows status counts
- Implementation approach from useCases
- Deliverables rendering
- Acceptance criteria with steps
- Business rules section
- statusFilter option for active only
- statusFilter option for planned only

---

#### SessionFindingsCodec captures retrospective discoveries

> **Invariant:** Findings must be categorized into gaps, improvements, risks, and learnings with per-type counts in the summary.
>
> **Rationale:** Retrospective findings drive continuous improvement — categorization enables prioritized follow-up across sessions.

**Verified by:**

- No findings produces empty message
- Summary shows finding type counts
- Gaps section
- Improvements section
- Risks section includes risk field
- Learnings section
- groupBy category option
- groupBy phase option
- groupBy type option
- showSourcePhase option enabled
- showSourcePhase option disabled

_planning-codecs.feature_

### Poc Integration

_End-to-end integration tests that exercise the full documentation generation_

---

#### POC decision document is parsed correctly

> **Invariant:** The real POC decision document (Process Guard) must be parseable by the codec, extracting all source mappings with their extraction types.
>
> **Rationale:** Integration testing against the actual POC document validates that the codec works with real-world content, not just synthetic test data.

**Verified by:**

- Load actual POC decision document
- Source mappings include all extraction types

---

#### Self-references extract content from POC decision

> **Invariant:** THIS DECISION self-references in the POC document must successfully extract Context rules, Decision rules, and DocStrings from the document itself.
>
> **Rationale:** Self-references are the most common extraction type in decision docs — they must work correctly for the POC to demonstrate the end-to-end pipeline.

**Verified by:**

- Extract Context rule from THIS DECISION
- Extract Decision rule from THIS DECISION
- Extract DocStrings from THIS DECISION

---

#### TypeScript shapes are extracted from real files

> **Invariant:** The source mapper must successfully extract type shapes and patterns from real TypeScript source files referenced in the POC document.
>
> **Rationale:** TypeScript extraction is the primary mechanism for pulling implementation details into decision docs — it must work with actual project files.

**Verified by:**

- Extract shapes from types.ts
- Extract shapes from decider.ts
- Extract createViolation patterns from decider.ts

---

#### Behavior spec content is extracted correctly

> **Invariant:** The source mapper must successfully extract Rule blocks and ScenarioOutline Examples from real Gherkin feature files referenced in the POC document.
>
> **Rationale:** Behavior spec extraction bridges decision documents to executable specifications — incorrect extraction would misrepresent the verified behavior.

**Verified by:**

- Extract Rule blocks from process-guard.feature
- Extract Scenario Outline Examples from process-guard-linter.feature

---

#### JSDoc sections are extracted from CLI files

> **Invariant:** The source mapper must successfully extract JSDoc comment sections from real TypeScript CLI files referenced in the POC document.
>
> **Rationale:** CLI documentation often lives in JSDoc comments — extracting them into decision docs avoids duplicating CLI usage information manually.

**Verified by:**

- Extract JSDoc from lint-process.ts

---

#### All source mappings execute successfully

> **Invariant:** All source mappings defined in the POC decision document must execute without errors, producing non-empty extraction results.
>
> **Rationale:** End-to-end execution validates that all extraction types work with real files — a single failing mapping would produce incomplete decision documentation.

**Verified by:**

- Execute all 11 source mappings from POC

---

#### Compact output generates correctly

> **Invariant:** The compact output for the POC document must generate successfully and contain all essential sections defined by the compact format.
>
> **Rationale:** Compact output is the AI-facing artifact — verifying it against the real POC ensures the format serves its purpose of providing concise decision context.

**Verified by:**

- Generate compact output from POC
- Compact output contains essential sections

---

#### Detailed output generates correctly

> **Invariant:** The detailed output for the POC document must generate successfully and contain all sections including full content from source mappings.
>
> **Rationale:** Detailed output is the human-facing artifact — verifying it against the real POC ensures no content is lost in the generation pipeline.

**Verified by:**

- Generate detailed output from POC
- Detailed output contains full content

---

#### Generated output matches quality expectations

> **Invariant:** The generated output structure must match the expected target format, with complete validation rules and properly structured sections.
>
> **Rationale:** Quality assertions catch regressions in output formatting — structural drift in generated documents would degrade their usefulness as references.

**Verified by:**

- Compact output matches target structure
- Validation rules are complete in output

_poc-integration.feature_

### Pr Changes Codec Options

_- Need to generate PR-specific documentation from patterns_

---

#### PrChangesCodec generates review checklist when includeReviewChecklist is enabled

> **Invariant:** When includeReviewChecklist is enabled, the codec must generate a "Review Checklist" section with standard items and context-sensitive items based on pattern state (completed, active, dependencies, deliverables). When disabled, no checklist appears.
>
> **Rationale:** A context-sensitive checklist prevents reviewers from missing state-specific concerns (e.g., verifying completed patterns still work, or that dependencies are satisfied) that a static checklist would not cover.

**Verified by:**

- Review checklist generated with standard items
- Review checklist includes completed patterns item when applicable
- Review checklist includes active work item when applicable
- Review checklist includes dependencies item when patterns have dependencies
- Review checklist includes deliverables item when patterns have deliverables
- No review checklist when includeReviewChecklist is disabled

---

#### PrChangesCodec generates dependencies section when includeDependencies is enabled

> **Invariant:** When includeDependencies is enabled and patterns have dependency relationships, the codec must render a "Dependencies" section with "Depends On" and "Enables" subsections. When no dependencies exist or the option is disabled, the section is omitted.
>
> **Rationale:** Dependency visibility in PR reviews prevents merging changes that break upstream or downstream patterns, which would otherwise only surface during integration.

**Verified by:**

- Dependencies section shows depends on relationships
- Dependencies section shows enables relationships
- No dependencies section when patterns have no dependencies
- No dependencies section when includeDependencies is disabled

---

#### PrChangesCodec filters patterns by changedFiles

> **Invariant:** When changedFiles filter is set, only patterns whose source files match (including partial directory path matches) are included in the output.
>
> **Rationale:** Filtering by changed files scopes the PR document to only the patterns actually touched, preventing reviewers from wading through unrelated patterns.

**Verified by:**

- Patterns filtered by changedFiles match
- changedFiles filter matches partial paths

---

#### PrChangesCodec filters patterns by releaseFilter

> **Invariant:** When releaseFilter is set, only patterns with deliverables matching the specified release version are included.
>
> **Rationale:** Release filtering isolates the patterns scheduled for a specific version, enabling targeted release reviews without noise from other versions' deliverables.

**Verified by:**

- Patterns filtered by release version

---

#### PrChangesCodec uses OR logic for combined filters

> **Invariant:** When both changedFiles and releaseFilter are set, patterns matching either criterion are included (OR logic), and patterns matching both criteria appear only once (no duplicates).
>
> **Rationale:** OR logic maximizes PR coverage — a change may affect files not yet assigned to a release, or a release may include patterns from unchanged files.

**Verified by:**

- Combined filters match patterns meeting either criterion
- Patterns matching both criteria are not duplicated

---

#### PrChangesCodec only includes active and completed patterns

> **Invariant:** The codec must exclude roadmap and deferred patterns, including only active and completed patterns in the PR changes output.
>
> **Rationale:** PR changes reflect work that is in progress or done — roadmap and deferred patterns have no code changes to review.

**Verified by:**

- Roadmap patterns are excluded
- Deferred patterns are excluded

_pr-changes-codec-options.feature_

### Pr Changes Codec Rendering

_- Need to generate PR-specific documentation from patterns_

---

#### PrChangesCodec handles empty results gracefully

> **Invariant:** When no patterns match the applied filters, the codec must produce a valid document with a "No Changes" section describing which filters were active.
>
> **Rationale:** Reviewers need to distinguish "nothing matched" from "codec error" and understand why no patterns appear.

**Verified by:**

- No changes when no patterns match changedFiles filter
- No changes when no patterns match releaseFilter
- No changes with combined filters when nothing matches

---

#### PrChangesCodec generates summary with filter information

> **Invariant:** Every PR changes document must contain a Summary section with pattern counts and active filter information.
>
> **Rationale:** Without a summary, reviewers must scan the entire document to understand the scope and filtering context of the PR changes.

**Verified by:**

- Summary section shows pattern counts
- Summary shows release tag when releaseFilter is set
- Summary shows files filter count when changedFiles is set

---

#### PrChangesCodec groups changes by phase when sortBy is "phase"

> **Invariant:** When sortBy is "phase" (the default), patterns must be grouped under phase headings in ascending phase order.
>
> **Rationale:** Phase grouping aligns PR changes with the delivery roadmap, letting reviewers verify that changes belong to the expected implementation phase.

**Verified by:**

- Changes grouped by phase with default sortBy
- Pattern details shown within phase groups

---

#### PrChangesCodec groups changes by priority when sortBy is "priority"

> **Invariant:** When sortBy is "priority", patterns must be grouped under High/Medium/Low priority headings with correct pattern assignment.
>
> **Rationale:** Priority grouping lets reviewers focus on high-impact changes first, ensuring critical patterns receive the most review attention.

**Verified by:**

- Changes grouped by priority
- Priority groups show correct patterns

---

#### PrChangesCodec shows flat list when sortBy is "workflow"

> **Invariant:** When sortBy is "workflow", patterns must be rendered as a flat list without phase or priority grouping.
>
> **Rationale:** Workflow sorting presents patterns in review order without structural grouping, suited for quick PR reviews.

**Verified by:**

- Flat changes list with workflow sort

---

#### PrChangesCodec renders pattern details with metadata and description

> **Invariant:** Each pattern entry must include a metadata table (status, phase, business value when available) and description text.
>
> **Rationale:** Metadata and description provide the context reviewers need to evaluate whether a pattern's implementation aligns with its stated purpose and delivery status.

**Verified by:**

- Pattern detail shows metadata table
- Pattern detail shows business value when available
- Pattern detail shows description

---

#### PrChangesCodec renders deliverables when includeDeliverables is enabled

> **Invariant:** Deliverables are only rendered when includeDeliverables is enabled, and when releaseFilter is set, only deliverables matching that release are shown.
>
> **Rationale:** Deliverables add bulk to the PR document; gating them behind a flag keeps default output concise, while release filtering prevents reviewers from seeing unrelated work items.

**Verified by:**

- Deliverables shown when patterns have deliverables
- Deliverables filtered by release when releaseFilter is set
- No deliverables section when includeDeliverables is disabled

---

#### PrChangesCodec renders acceptance criteria from scenarios

> **Invariant:** When patterns have associated scenarios, the codec must render an "Acceptance Criteria" section containing scenario names and step lists.
>
> **Rationale:** Acceptance criteria give reviewers a concrete checklist to verify that the PR's implementation satisfies the behavioral requirements defined in the spec.

**Verified by:**

- Acceptance criteria rendered when patterns have scenarios
- Acceptance criteria shows scenario steps

---

#### PrChangesCodec renders business rules from Gherkin Rule keyword

> **Invariant:** When patterns have Gherkin Rule blocks, the codec must render a "Business Rules" section containing rule names and verification information.
>
> **Rationale:** Business rules surface domain invariants directly in the PR review, ensuring reviewers can verify that implementation changes respect the documented constraints.

**Verified by:**

- Business rules rendered when patterns have rules
- Business rules show rule names and verification info

_pr-changes-codec-rendering.feature_

### Pr Changes Generation

_- PR descriptions are manually written, often incomplete or inconsistent_

---

#### Release version filtering controls which phases appear in output

> **Invariant:** Only phases with deliverables matching the releaseFilter are included; roadmap phases are always excluded.
>
> **Rationale:** Including unrelated releases or unstarted roadmap items in a PR description misleads reviewers about the scope of actual changes.

**Verified by:**

- Filter phases by specific release version
- Show all active and completed phases when no releaseFilter
- Active phases with matching deliverables are included
- Roadmap phases are excluded even with matching deliverables

---

#### Patterns are grouped by phase number in the output

> **Invariant:** Each phase number produces a separate heading section in the generated output.
>
> **Rationale:** Without phase grouping, reviewers cannot distinguish which changes belong to which delivery phase, making incremental review impossible.

**Verified by:**

- Patterns grouped by phase number

---

#### Summary statistics provide a high-level overview of the PR

> **Invariant:** Summary section always shows pattern counts and release tag when a releaseFilter is active.
>
> **Rationale:** Without a summary, reviewers must read the entire document to understand the PR's scope; the release tag anchors the summary to a specific version.

**Verified by:**

- Summary shows pattern counts in table format
- Summary shows release tag when filtering

---

#### Deliverables are displayed inline with their parent patterns

> **Invariant:** When includeDeliverables is enabled, each pattern lists its deliverables with name, status, and release tag.
>
> **Rationale:** Hiding deliverables forces reviewers to cross-reference feature files to verify completion; inline display makes review self-contained.

**Verified by:**

- Deliverables shown inline with patterns
- Deliverables show release tags

---

#### Review checklist includes standard code quality verification items

> **Invariant:** Review checklist always includes code conventions, tests, documentation, and completed pattern verification items.
>
> **Rationale:** Omitting the checklist means quality gates depend on reviewer memory; a consistent checklist ensures no standard verification step is skipped.

**Verified by:**

- Review checklist includes standard code quality items
- Review checklist includes completed pattern verification

---

#### Dependencies section shows inter-pattern relationships

> **Invariant:** Dependencies section surfaces both what patterns enable and what they depend on.
>
> **Rationale:** Hidden dependencies cause merge-order mistakes and broken builds; surfacing them in the PR lets reviewers verify prerequisite work is complete.

**Verified by:**

- Dependencies shows what patterns enable
- Dependencies shows what patterns depend on

---

#### Business value can be included or excluded from pattern metadata

> **Invariant:** Business value display is controlled by the includeBusinessValue option.
>
> **Rationale:** Not all consumers need business value context; making it opt-in keeps the default output concise for technical reviewers.

**Verified by:**

- Pattern metadata includes business value when enabled
- Business value can be excluded

---

#### Output can be sorted by phase number or priority

> **Invariant:** Sorting is deterministic and respects the configured sortBy option.
>
> **Rationale:** Non-deterministic ordering produces diff noise between regenerations, making it impossible to tell if content actually changed.

**Verified by:**

- Phases sorted by phase number
- Phases sorted by priority

---

#### Edge cases produce graceful output

> **Invariant:** The generator handles missing phases, missing deliverables, and missing phase numbers without errors.
>
> **Rationale:** Crashing on incomplete data prevents PR generation entirely; graceful degradation ensures output is always available even with partial inputs.

**Verified by:**

- No matching phases produces no changes message
- Patterns without deliverables still display
- Patterns without phase show in phase 0 group

---

#### Deliverable-level filtering shows only matching deliverables within a phase

> **Invariant:** When a phase contains deliverables with different release tags, only those matching the releaseFilter are shown.
>
> **Rationale:** Showing all deliverables regardless of release tag pollutes the PR with unrelated work, obscuring what actually shipped in the target release.

**Verified by:**

- Mixed releases within single phase shows only matching deliverables

_pr-changes-generation.feature_

### Pr Changes Options

_Tests the PrChangesCodec filtering capabilities for generating PR-scoped_

---

#### Orchestrator supports PR changes generation options

> **Invariant:** PR changes output includes only patterns matching the changed files list, the release version filter, or both (OR logic when combined).
>
> **Rationale:** PR-scoped documentation must reflect exactly what changed, avoiding noise from unrelated patterns.

**Verified by:**

- PR changes filters to explicit file list
- PR changes filters by release version
- Combined filters use OR logic

_pr-changes-options.feature_

### Prd Implementation Section

_Tests the Implementations section rendering in pattern documents._

---

#### Implementation files appear in pattern docs via @architect-implements

> **Invariant:** Any TypeScript file with a matching @architect-implements tag must appear in the pattern document's Implementations section with a working file link.
>
> **Rationale:** Implementation discovery relies on tag-based linking — missing entries break traceability between specs and code.

**Verified by:**

- Implementations section renders with file links
- Implementation includes description when available

---

#### Multiple implementations are listed alphabetically

> **Invariant:** When multiple files implement the same pattern, they must be listed in ascending file path order.
>
> **Rationale:** Deterministic ordering ensures stable document output across regeneration runs.

**Verified by:**

- Multiple implementations sorted by file path

---

#### Patterns without implementations omit the section

> **Invariant:** The Implementations heading must not appear in pattern documents when no implementing files exist.
>
> **Rationale:** Rendering an empty Implementations section misleads readers into thinking implementations were expected but are missing, rather than simply not applicable.

**Verified by:**

- No implementations section when none exist

---

#### Implementation references use relative file links

> **Invariant:** Implementation file links must be relative paths starting from the patterns output directory.
>
> **Rationale:** Absolute paths break when documentation is viewed from different locations; relative paths ensure portability.

**Verified by:**

- Links are relative from patterns directory

_prd-implementation-section.feature_

### Reference Codec Core

_Parameterized codec factory that creates reference document codecs_

---

#### Empty datasets produce fallback content

> **Invariant:** A codec must always produce a valid document, even when no matching content exists in the dataset.
>
> **Rationale:** Consumers rely on a consistent document structure; a missing or null document would cause rendering failures downstream.

**Verified by:**

- Codec with no matching content produces fallback message

---

#### Convention content is rendered as sections

> **Invariant:** Convention-tagged patterns must render as distinct headed sections with their rule names, invariants, and tables preserved.
>
> **Rationale:** Conventions define project-wide constraints; losing their structure in generated docs would make them unenforceable and undiscoverable.

**Verified by:**

- Convention rules appear as H2 headings with content
- Convention tables are rendered in the document

---

#### Detail level controls output density

> **Invariant:** Each detail level (summary, standard, detailed) must produce a deterministic subset of content, with summary being the most restrictive.
>
> **Rationale:** AI session contexts have strict token budgets; uncontrolled output density wastes context window and degrades session quality.

**Verified by:**

- Summary level omits narrative and rationale
- Detailed level includes rationale and verified-by

---

#### Behavior sections are rendered from category-matching patterns

> **Invariant:** Only patterns whose category matches the configured behavior tags may appear in the Behavior Specifications section.
>
> **Rationale:** Mixing unrelated categories into a single behavior section would produce misleading documentation that conflates distinct concerns.

**Verified by:**

- Behavior-tagged patterns appear in a Behavior Specifications section

---

#### Shape sources are extracted from matching patterns

> **Invariant:** Only shapes from patterns whose file path matches the configured shapeSources glob may appear in the API Types section.
>
> **Rationale:** Including shapes from unrelated source paths would pollute the API Types section with irrelevant type definitions, breaking the scoped documentation contract.

**Verified by:**

- Shapes appear when source file matches shapeSources glob
- Summary level shows shapes as a compact table
- No shapes when source file does not match glob

---

#### Convention and behavior content compose in a single document

> **Invariant:** Convention and behavior content must coexist in the same RenderableDocument when both are present in the dataset.
>
> **Rationale:** Splitting conventions and behaviors into separate documents would force consumers to cross-reference multiple files, losing the unified view of a product area.

**Verified by:**

- Both convention and behavior sections appear when data exists

---

#### Composition order follows AD-5: conventions then shapes then behaviors

> **Invariant:** Document sections must follow the canonical order: conventions, then API types (shapes), then behavior specifications.
>
> **Rationale:** AD-5 establishes a consistent reading flow (rules, then types, then specs); violating this order would confuse readers who expect a stable document structure.

**Verified by:**

- Convention headings appear before shapes before behaviors

---

#### Convention code examples render as mermaid blocks

> **Invariant:** Mermaid diagram content in conventions must render as fenced mermaid blocks, and must be excluded at summary detail level.
>
> **Rationale:** Mermaid diagrams are visual aids that require rendering support; emitting them as plain text would produce unreadable output, and including them in summaries wastes token budget.

**Verified by:**

- Convention with mermaid content produces mermaid block in output
- Summary level omits convention code examples

_reference-codec-core.feature_

### Reference Codec Detail Rendering

_Standard detail level behavior, deep behavior rendering with structured_

---

#### Standard detail level includes narrative but omits rationale

> **Invariant:** Standard detail level renders narrative prose for convention patterns but excludes rationale sections, reserving rationale for the detailed level only.
>
> **Rationale:** Progressive disclosure prevents information overload at the standard level while ensuring readers who need deeper justification can access it at the detailed level.

**Verified by:**

- Standard level includes narrative but omits rationale

---

#### Deep behavior rendering with structured annotations

> **Invariant:** Behavior patterns render structured rule annotations (invariant, rationale, verified-by) at detailed level, invariant-only at standard level, and a truncated table at summary level.
>
> **Rationale:** Structured annotations are the primary mechanism for surfacing business rules from Gherkin sources; inconsistent rendering across detail levels would produce misleading or incomplete documentation.

**Verified by:**

- Detailed level renders structured behavior rules
- Standard level renders behavior rules without rationale
- Summary level shows behavior rules as truncated table
- Scenario names and verifiedBy merge as deduplicated list

---

#### Shape JSDoc prose renders at standard and detailed levels

> **Invariant:** Shape patterns with JSDoc prose include that prose in rendered code blocks at standard and detailed levels. Shapes without JSDoc render code blocks only.
>
> **Rationale:** JSDoc prose provides essential context for API types; omitting it would force readers to open source files to understand a shape's purpose, undermining the generated documentation's self-sufficiency.

**Verified by:**

- Standard level includes JSDoc in code blocks
- Detailed level includes JSDoc in code block and property table
- Shapes without JSDoc render code blocks only

---

#### Shape sections render param returns and throws documentation

> **Invariant:** Function shapes render parameter, returns, and throws documentation at detailed level. Standard level renders parameter tables but omits throws. Shapes without param docs skip the parameter table entirely.
>
> **Rationale:** Throws documentation is diagnostic detail that clutters standard output; separating it into detailed level keeps standard output focused on the function's contract while preserving full error documentation for consumers who need it.

**Verified by:**

- Detailed level renders param table for function shapes
- Detailed level renders returns and throws documentation
- Standard level renders param table without throws
- Shapes without param docs skip param table

---

#### Collapsible blocks wrap behavior rules for progressive disclosure

> **Invariant:** When a behavior pattern has 3 or more rules and detail level is not summary, each rule's content is wrapped in a collapsible block with the rule name and scenario count in the summary. Patterns with fewer than 3 rules render rules flat. Summary level never produces collapsible blocks.
>
> **Rationale:** Behavior sections with many rules produce substantial content at detailed level. Collapsible blocks enable progressive disclosure so readers can expand only the rules they need.

**Verified by:**

- Behavior pattern with many rules uses collapsible blocks at detailed level
- Behavior pattern with few rules does not use collapsible blocks
- Summary level never produces collapsible blocks
- Many rules use collapsible at detailed level
- Few rules render flat
- Summary level suppresses collapsible

---

#### Link-out blocks provide source file cross-references

> **Invariant:** At standard and detailed levels, each behavior pattern includes a link-out block referencing its source file path. At summary level, link-out blocks are omitted for compact output.
>
> **Rationale:** Cross-reference links enable readers to navigate from generated documentation to the annotated source files, closing the loop between generated docs and the single source of truth.

**Verified by:**

- Behavior pattern includes source file link-out at detailed level
- Standard level includes source file link-out
- Summary level omits link-out blocks
- Detailed level includes source link-out
- Standard level includes source link-out
- Summary level omits link-out

---

#### Include tags route cross-cutting content into reference documents

> **Invariant:** Patterns with matching include tags appear alongside category-selected patterns in the behavior section. The merging is additive (OR semantics).
>
> **Rationale:** Cross-cutting patterns (e.g., shared utilities, common validators) belong in multiple reference documents; without include-tag routing, these patterns would only appear in their home category, leaving dependent documents incomplete.

**Verified by:**

- Include-tagged pattern appears in behavior section
- Include-tagged pattern is additive with category-selected patterns
- Pattern without matching include tag is excluded

_reference-codec-detail-rendering.feature_

### Reference Codec Diagram

_Scoped diagram generation from diagramScope and diagramScopes config,_

---

#### Scoped diagrams are generated from diagramScope config

> **Invariant:** Diagram content is determined exclusively by diagramScope filters (archContext, include, archLayer, patterns), and filters compose via OR — a pattern matching any single filter appears in the diagram.
>
> **Rationale:** Without filter-driven scoping, diagrams would include all patterns regardless of relevance, producing unreadable visualizations that obscure architectural boundaries.

**Verified by:**

- Config with diagramScope produces mermaid block at detailed level
- Neighbor patterns appear in diagram with distinct style
- include filter selects patterns by include tag membership
- Self-contained scope produces no Related subgraph
- Multiple filter dimensions OR together
- Explicit pattern names filter selects named patterns
- Config without diagramScope produces no diagram section
- archLayer filter selects patterns by architectural layer
- archLayer and archContext compose via OR
- Summary level omits scoped diagram

---

#### Hardcoded diagram sources render deterministic output

> **Invariant:** Hardcoded diagram sources render without relationship-scoping input and emit stable, source-specific Mermaid content.
>
> **Rationale:** Domain diagrams such as pipeline and MasterDataset fan-out encode canonical architecture views that should not depend on ad-hoc test dataset shape.

**Verified by:**

- master-dataset-views source produces MasterDataset fan-out diagram
- master-dataset-views source renders expected fan-out nodes

---

#### Multiple diagram scopes produce multiple mermaid blocks

> **Invariant:** Each entry in the diagramScopes array produces an independent Mermaid block with its own title and direction, and legacy singular diagramScope remains supported as a fallback.
>
> **Rationale:** Product areas require multiple architectural views (e.g., system overview and data flow) from a single configuration, and breaking backward compatibility with the singular diagramScope would silently remove diagrams from existing consumers.

**Verified by:**

- Config with diagramScopes array produces multiple diagrams
- Diagram direction is reflected in mermaid output
- Legacy diagramScope still works when diagramScopes is absent

_reference-codec-diagrams.feature_

### Reference Codec Diagram Type

_Diagram type controls Mermaid output format including flowchart,_

---

#### Diagram type controls Mermaid output format

> **Invariant:** The diagramType field on DiagramScope selects the Mermaid output format. Supported types are graph (flowchart, default), sequenceDiagram, and stateDiagram-v2. Each type produces syntactically valid Mermaid output with type-appropriate node and edge rendering.
>
> **Rationale:** Flowcharts cannot naturally express event flows (sequence), FSM visualization (state), or temporal ordering. Multiple diagram types unlock richer architectural documentation from the same relationship data.

**Verified by:**

- Default diagramType produces flowchart
- Sequence diagram renders participant-message format
- State diagram renders state transitions
- Sequence diagram includes neighbor patterns as participants
- State diagram adds start and end pseudo-states
- C4 diagram renders system boundary format
- C4 diagram renders neighbor patterns as external systems
- Class diagram renders class members and relationships
- Class diagram renders archRole as stereotype

---

#### Edge labels and custom node shapes enrich diagram readability

> **Invariant:** Relationship edges display labels describing the relationship type (uses, depends on, implements, extends). Edge labels are enabled by default and can be disabled via showEdgeLabels false. Node shapes in flowchart diagrams vary by archRole value using Mermaid shape syntax.
>
> **Rationale:** Unlabeled edges are ambiguous without consulting a legend. Custom node shapes make archRole visually distinguishable without color reliance, improving accessibility and scanability.

**Verified by:**

- Relationship edges display type labels by default
- Edge labels can be disabled for compact diagrams
- archRole controls Mermaid node shape
- Pattern without archRole uses default rectangle shape
- Edge labels appear by default
- Edge labels can be disabled
- archRole controls node shape
- Unknown archRole falls back to rectangle

_reference-codec-diagram-types.feature_

### Reference Generator

_Registers reference document generators from project config._

---

#### Registration produces the correct number of generators

> **Invariant:** Each reference config produces exactly 2 generators (detailed + summary), plus meta-generators for product-area and non-product-area routing.
>
> **Rationale:** The count is deterministic from config — any mismatch indicates a registration bug that would silently drop generated documents.

**Verified by:**

- Generators are registered from configs plus meta-generators

---

#### Product area configs produce a separate meta-generator

> **Invariant:** Configs with productArea set route to "product-area-docs" meta-generator; configs without route to "reference-docs".
>
> **Rationale:** Product area docs are rendered into per-area subdirectories while standalone references go to the root output.

**Verified by:**

- Product area meta-generator is registered

---

#### Generator naming follows kebab-case convention

> **Invariant:** Detailed generators end in "-reference" and summary generators end in "-reference-claude".
>
> **Rationale:** Consistent naming enables programmatic discovery and distinguishes human-readable from AI-optimized outputs.

**Verified by:**

- Detailed generator has name ending in "-reference"
- Summary generator has name ending in "-reference-claude"
- Architecture-types generators are registered

---

#### Generator execution produces markdown output

> **Invariant:** Every registered generator must produce at least one non-empty output file when given matching data.
>
> **Rationale:** A generator that produces empty output wastes a pipeline slot and creates confusion when expected docs are missing.

**Verified by:**

- Product area generator with matching data produces non-empty output
- Product area generator with no patterns still produces intro
- ARCHITECTURE-TYPES generator produces shapes and convention content

_reference-generators.feature_

### Remaining Work Enhancement

_- Flat phase lists make it hard to identify what to work on next_

---

#### Priority-based sorting surfaces critical work first

> **Invariant:** Phases with higher priority always appear before lower-priority phases when sorting by priority.
>
> **Rationale:** Without priority sorting, critical work gets buried under low-priority items, delaying urgent deliverables.

**Verified by:**

- Next Actionable sorted by priority
- Undefined priority sorts last
- Priority icons displayed in table

---

#### Effort parsing converts duration strings to comparable hours

> **Invariant:** Effort strings must be parsed to a common unit (hours) for accurate sorting across different time scales.
>
> **Rationale:** Comparing raw strings like "2h" and "3d" lexicographically produces incorrect ordering; normalization to hours ensures consistent comparison.

**Verified by:**

- Phases sorted by effort ascending
- Effort parsing handles hours
- Effort parsing handles days
- Effort parsing handles weeks
- Effort parsing handles months

---

#### Quarter grouping organizes planned work into time-based buckets

> **Invariant:** Phases with a quarter tag are grouped under their quarter heading; phases without a quarter appear under Unscheduled.
>
> **Rationale:** Flat lists obscure time-based planning; grouping by quarter lets planners see what is committed per period and what remains unscheduled.

**Verified by:**

- Planned phases grouped by quarter
- Quarters sorted chronologically

---

#### Priority grouping organizes phases by urgency level

> **Invariant:** Phases are grouped under their priority heading; phases without priority appear under Unprioritized.
>
> **Rationale:** Mixing priority levels in a flat list forces readers to visually scan for urgency; grouping by priority makes triage immediate.

**Verified by:**

- Planned phases grouped by priority

---

#### Progressive disclosure prevents information overload in large backlogs

> **Invariant:** When the backlog exceeds maxNextActionable, only the top N phases are shown with a link or count for the remainder.
>
> **Rationale:** Displaying hundreds of phases in the summary overwhelms planners; progressive disclosure keeps the summary scannable while preserving access to the full backlog.

**Verified by:**

- Large backlog uses progressive disclosure
- Moderate backlog shows count without link

---

#### Edge cases are handled gracefully

> **Invariant:** Empty or fully-blocked backlogs produce meaningful output instead of errors or blank sections.
>
> **Rationale:** Blank or errored output when the backlog is empty confuses users into thinking the generator is broken rather than reflecting a genuinely empty state.

**Verified by:**

- Empty backlog handling
- All phases blocked

---

#### Default behavior preserves backward compatibility

> **Invariant:** Without explicit sortBy or groupPlannedBy options, phases are sorted by phase number in a flat list.
>
> **Rationale:** Changing default behavior would break existing consumers that rely on phase-number ordering without specifying options.

**Verified by:**

- Default sorting is by phase number
- Default grouping is none (flat list)

_remaining-work-enhancement.feature_

### Remaining Work Summary Accuracy

_Summary totals in REMAINING-WORK.md must match the sum of phase table rows._

---

#### Summary totals equal sum of phase table rows

> **Invariant:** The summary Active and Total Remaining counts must exactly equal the sum of the corresponding counts across all phase table rows.
>
> **Rationale:** A mismatch between summary and phase-level totals indicates patterns are being double-counted or dropped.

**Verified by:**

- Summary matches phase table with all patterns having phases
- Summary includes completed patterns correctly

---

#### Patterns without phases appear in Backlog row

> **Invariant:** Patterns that have no assigned phase must be grouped into a "Backlog" row in the phase table rather than being omitted.
>
> **Rationale:** Unphased patterns are still remaining work; omitting them would undercount the total.

**Verified by:**

- Summary includes backlog patterns without phase
- All patterns in backlog when none have phases

---

#### Patterns without patternName are counted using id

> **Invariant:** Pattern counting must use pattern.id as the identifier, never patternName, so that patterns with undefined names are neither double-counted nor omitted.
>
> **Rationale:** patternName is optional; relying on it for counting would miss unnamed patterns entirely.

**Verified by:**

- Patterns with undefined patternName counted correctly
- Mixed patterns with and without patternName

---

#### All phases with incomplete patterns are shown

> **Invariant:** The phase table must include every phase that contains at least one incomplete pattern, and phases with only completed patterns must be excluded.
>
> **Rationale:** Showing fully completed phases inflates the remaining work view, while omitting phases with incomplete patterns hides outstanding work.

**Verified by:**

- Multiple phases shown in order
- Completed phases not shown in remaining work

_remaining-work-totals.feature_

### Renderer Block Types

_The universal renderer converts RenderableDocument to markdown._

---

#### Document metadata renders as frontmatter before sections

> **Invariant:** Title always renders as H1, purpose and detail level render as bold key-value pairs separated by horizontal rule.
>
> **Rationale:** Consistent frontmatter structure allows downstream tooling and readers to reliably locate the document title and metadata without parsing the full body.

**Verified by:**

- Render minimal document with title only
- Render document with purpose
- Render document with detail level
- Render document with purpose and detail level

---

#### Headings render at correct markdown levels with clamping

> **Invariant:** Heading levels are clamped to the valid range 1-6 regardless of input value.
>
> **Rationale:** Markdown only supports heading levels 1-6; unclamped values would produce invalid syntax that renders as plain text in all markdown processors.

**Verified by:**

- Render headings at different levels
- Clamp heading level 0 to 1
- Clamp heading level 7 to 6

---

#### Paragraphs and separators render as plain text and horizontal rules

> **Invariant:** Paragraph content passes through unmodified, including special markdown characters. Separators render as horizontal rules.
>
> **Rationale:** The renderer is a dumb printer; altering paragraph content would break codec-controlled formatting and violate the separation between codec logic and rendering.

**Verified by:**

- Render paragraph
- Render paragraph with special characters
- Render separator

---

#### Tables render with headers, alignment, and cell escaping

> **Invariant:** Tables must escape pipe characters, convert newlines to line breaks, and pad short rows to match column count.
>
> **Rationale:** Unescaped pipes corrupt table column boundaries, raw newlines break row parsing, and short rows cause column misalignment in every markdown renderer.

**Verified by:**

- Render basic table
- Render table with alignment
- Render empty table (no columns)
- Render table with pipe character in cell
- Render table with newline in cell
- Render table with short row (fewer cells than columns)

---

#### Lists render in unordered, ordered, checkbox, and nested formats

> **Invariant:** List type determines prefix: dash for unordered, numbered for ordered, checkbox syntax for checked items. Nesting adds two-space indentation per level.
>
> **Rationale:** Incorrect prefixes or indentation levels cause markdown parsers to break list continuity, rendering nested items as separate top-level lists or plain text.

**Verified by:**

- Render unordered list
- Render ordered list
- Render checkbox list with checked items
- Render nested list

_render-blocks.feature_

### Renderer Output Formats

_The universal renderer converts RenderableDocument to markdown._

---

#### Code blocks and mermaid diagrams render with fenced syntax

> **Invariant:** Code blocks use triple backtick fencing with optional language hint. Mermaid blocks use mermaid as the language hint.
>
> **Rationale:** Inconsistent fencing breaks syntax highlighting in GitHub/IDE markdown previews and prevents Mermaid renderers from detecting diagram blocks.

**Verified by:**

- Render code block with language
- Render code block without language
- Render mermaid diagram

---

#### Collapsible blocks render as HTML details elements

> **Invariant:** Summary text is HTML-escaped to prevent injection. Collapsible content renders between details tags.
>
> **Rationale:** Unescaped HTML in summary text enables XSS when generated markdown is rendered in browsers; malformed details tags break progressive disclosure in documentation.

**Verified by:**

- Render collapsible block
- Render collapsible with HTML entities in summary
- Render nested collapsible content

---

#### Link-out blocks render as markdown links with URL encoding

> **Invariant:** Link paths with spaces are percent-encoded for valid URLs.
>
> **Rationale:** Unencoded spaces produce broken links in markdown renderers, making cross-document navigation fail silently for files with spaces in their paths.

**Verified by:**

- Render link-out block
- Render link-out with spaces in path

---

#### Multi-file documents produce correct output file collections

> **Invariant:** Output file count equals 1 (main) plus additional file count. The first output file always uses the provided base path.
>
> **Rationale:** A mismatch between expected and actual file count causes the orchestrator to write orphaned files or miss outputs, corrupting the generated documentation directory.

**Verified by:**

- Render document with additional files
- Render document without additional files

---

#### Complex documents render all block types in sequence

> **Invariant:** Multiple block types in a single document render in order without interference.
>
> **Rationale:** Block ordering reflects the codec's semantic structure; out-of-order or swallowed blocks would produce misleading documentation that diverges from the source of truth.

**Verified by:**

- Render complex document with multiple block types

---

#### Claude context renderer produces compact AI-optimized output

> **Invariant:** Claude context replaces markdown syntax with section markers, omits visual-only blocks (mermaid, separators), flattens collapsible content, and produces shorter output than markdown.
>
> **Rationale:** LLM context windows are token-limited; visual-only blocks waste tokens without adding semantic value, and verbose markdown syntax inflates context size unnecessarily.

**Verified by:**

- Claude context renders title and headings as section markers
- Claude context renders sub-headings with different markers
- Claude context omits mermaid blocks
- Claude context flattens collapsible blocks
- Claude context renders link-out as plain text
- Claude context omits separator tokens
- Claude context produces fewer characters than markdown

---

#### Claude MD module renderer produces modular-claude-md compatible output

> **Invariant:** Title renders as H3 (offset +2), section headings are offset by +2 clamped at H6, frontmatter is omitted, mermaid blocks are omitted, link-out blocks are omitted, and collapsible blocks are flattened to headings.
>
> **Rationale:** The modular-claude-md system manages CLAUDE.md as composable H3-rooted modules. Generating incompatible formats (like section markers) produces orphaned files that are never consumed.

**Verified by:**

- Module title renders as H3
- Module section headings offset by plus 2
- Module frontmatter is omitted
- Module mermaid blocks are omitted
- Module link-out blocks are omitted
- Module collapsible blocks flatten to headings
- Module heading level clamped at H6

_render-output.feature_

### Reporting Codec

_- Need to generate changelog, traceability, and overview documents_

---

#### ChangelogCodec follows Keep a Changelog format

> **Invariant:** Releases must be sorted by semver descending, unreleased patterns grouped under "[Unreleased]", and change types follow the standard order (Added, Changed, Deprecated, Removed, Fixed, Security).
>
> **Rationale:** Keep a Changelog is an industry standard format — following it ensures the output is immediately familiar to developers.

**Verified by:**

- Decode empty dataset produces changelog header only
- Unreleased section shows active and vNEXT patterns
- Release sections sorted by semver descending
- Quarter fallback for patterns without release
- Earlier section for undated patterns
- Category mapping to change types
- Exclude unreleased when option disabled
- Change type sections follow standard order

---

#### TraceabilityCodec maps timeline patterns to behavior tests

> **Invariant:** Coverage statistics must show total timeline phases, those with behavior tests, those missing, and a percentage. Gaps must be surfaced prominently.
>
> **Rationale:** Traceability ensures every planned pattern has executable verification — gaps represent unverified claims about system behavior.

**Verified by:**

- No timeline patterns produces empty message
- Coverage statistics show totals and percentage
- Coverage gaps table shows missing coverage
- Covered phases in collapsible section
- Exclude gaps when option disabled
- Exclude stats when option disabled
- Exclude covered when option disabled
- Verified behavior files indicated in output

---

#### OverviewCodec provides project architecture summary

> **Invariant:** The overview must include architecture sections from overview-tagged patterns, pattern summary with progress percentage, and timeline summary with phase counts.
>
> **Rationale:** The architecture overview is the primary entry point for understanding the project — it must provide a complete picture at a glance.

**Verified by:**

- Decode empty dataset produces minimal overview
- Architecture section from overview-tagged patterns
- Patterns summary with progress bar
- Timeline summary with phase counts
- Exclude architecture when option disabled
- Exclude patterns summary when option disabled
- Exclude timeline summary when option disabled
- Multiple overview patterns create multiple architecture subsections

_reporting-codecs.feature_

### Requirements Adr Codec

_- Need to generate product requirements documents with flexible groupings_

---

#### RequirementsDocumentCodec generates PRD-style documentation from patterns

> **Invariant:** RequirementsDocumentCodec transforms MasterDataset patterns into a PRD-style document with flexible grouping (product area, user role, or phase), optional detail file generation, and business value rendering.
>
> **Rationale:** Flexible grouping lets stakeholders view requirements through their preferred lens (area, role, or phase), and detail files provide deep-dive context without bloating the summary document.

**Verified by:**

- No patterns with PRD metadata produces empty message
- Summary shows counts and groupings
- By product area section groups patterns correctly
- By user role section uses collapsible groups
- Group by phase option changes primary grouping
- Filter by status option limits patterns
- All features table shows complete list
- Business value rendering when enabled
- Generate individual requirement detail files when enabled
- Requirement detail file contains acceptance criteria from scenarios
- Requirement detail file contains business rules section
- Implementation links from relationshipIndex

---

#### AdrDocumentCodec documents architecture decisions

> **Invariant:** AdrDocumentCodec transforms MasterDataset ADR patterns into an architecture decision record document with status tracking, category/phase/date grouping, supersession relationships, and optional detail file generation.
>
> **Rationale:** Architecture decisions lose value without status tracking and supersession chains; without them, teams act on outdated decisions and cannot trace why a previous approach was abandoned.

**Verified by:**

- No ADR patterns produces empty message
- Summary shows status counts and categories
- ADRs grouped by category
- ADRs grouped by phase option
- ADRs grouped by date (quarter) option
- ADR index table with all decisions
- ADR entries use clean text without emojis
- Context, Decision, Consequences sections from Rule keywords
- ADR supersedes rendering
- Generate individual ADR detail files when enabled
- ADR detail file contains full content
- Context
- Decision
- Consequences sections from Rule keywords

_requirements-adr-codecs.feature_

### Robustness Integration

_Document generation pipeline needs validation, deduplication, and_

---

#### Validation runs before extraction in the pipeline

> **Invariant:** Validation must complete and pass before extraction begins.
>
> **Rationale:** Prevents wasted extraction work and provides clear fail-fast behavior.

**Verified by:**

- Valid decision document generates successfully
- Invalid mapping halts pipeline before extraction
- Multiple validation errors are reported together
- @acceptance-criteria scenarios below.

  The validation layer must run first and halt the pipeline if errors
  are found

- preventing wasted extraction work.

---

#### Deduplication runs after extraction before assembly

> **Invariant:** Deduplication processes all extracted content before document assembly.
>
> **Rationale:** All sources must be extracted to identify cross-source duplicates.

**Verified by:**

- Duplicate content is removed from final output
- Non-duplicate sections are preserved
- @acceptance-criteria scenarios below.

  Content from all sources is extracted first

- then deduplicated
- then assembled into the final document.

---

#### Warnings from all stages are collected and reported

> **Invariant:** Warnings from all pipeline stages are aggregated in the result.
>
> **Rationale:** Users need visibility into non-fatal issues without blocking generation.

**Verified by:**

- Warnings are collected across pipeline stages
- Warnings do not prevent successful generation
- @acceptance-criteria scenarios below.

  Non-fatal issues from validation

- extraction
- and deduplication are
  collected and included in the result.

---

#### Pipeline provides actionable error messages

> **Invariant:** Error messages include context and fix suggestions.
>
> **Rationale:** Users should fix issues in one iteration without guessing.

**Verified by:**

- File not found error includes fix suggestion
- Invalid method error includes valid alternatives
- Extraction error includes source context
- @acceptance-criteria scenarios below.

  Errors include enough context for users to understand and fix the issue.

---

#### Existing decision documents continue to work

> **Invariant:** Valid existing decision documents generate without new errors.
>
> **Rationale:** Robustness improvements must be backward compatible.

**Verified by:**

- PoC decision document still generates
- Process Guard decision document still generates
- @acceptance-criteria scenarios below.

  The robustness improvements must not break existing valid decision
  documents that worked with the PoC.

_robustness-integration.feature_

### Rule Keyword Po C

_This feature tests whether vitest-cucumber supports the Rule keyword_

---

#### Basic arithmetic operations work correctly

> **Invariant:** Arithmetic operations must return mathematically correct results for all valid inputs.
>
> **Rationale:** Incorrect arithmetic results silently corrupt downstream calculations, making errors undetectable at their source. The calculator should perform standard math operations with correct results.

**Verified by:**

- Addition of two positive numbers
- Subtraction of two numbers

---

#### Division has special constraints

> **Invariant:** Division operations must reject a zero divisor before execution.
>
> **Rationale:** Unguarded division by zero causes runtime exceptions that crash the process instead of returning a recoverable error. Division by zero must be handled gracefully to prevent system errors.

**Verified by:**

- Division of two numbers
- Division by zero is prevented

_rule-keyword-poc.feature_

### Session Codec

_- Need to generate session context and remaining work documents from patterns_

---

#### SessionContextCodec provides working context for AI sessions

> **Invariant:** Session context must include session status with active/completed/remaining counts, phase navigation for incomplete phases, and active work grouped by phase.
>
> **Rationale:** AI agents need a compact, navigable view of current project state to make informed implementation decisions.

**Verified by:**

- Decode empty dataset produces minimal session context
- Decode dataset with timeline patterns
- Session status shows current focus
- Phase navigation for incomplete phases
- Active work grouped by phase
- Blocked items section with dependencies
- No blocked items section when disabled
- Recent completions collapsible
- Generate session phase detail files when enabled
- No detail files when disabled

---

#### RemainingWorkCodec aggregates incomplete work by phase

> **Invariant:** Remaining work must show status counts, phase-grouped navigation, priority classification (in-progress/ready/blocked), and next actionable items.
>
> **Rationale:** Remaining work visibility prevents scope blindness — knowing what's left, what's blocked, and what's ready drives efficient session planning.

**Verified by:**

- All work complete produces celebration message
- Summary shows remaining counts
- Phase navigation with remaining count
- By priority shows ready vs blocked
- Next actionable items section
- Next actionable respects maxNextActionable limit
- Sort by phase option
- Sort by priority option
- Generate remaining work detail files when enabled
- No detail files when disabled for remaining

_session-codecs.feature_

### Shape Matcher

_Matches file paths against glob patterns for TypeScript shape extraction._

---

#### Exact paths match without wildcards

> **Invariant:** A pattern without glob characters must match only the exact file path, character for character.
>
> **Rationale:** Loose matching on non-glob patterns would silently include unintended files, causing incorrect shapes to appear in generated documentation.

**Verified by:**

- Exact path matches identical path
- Exact path does not match different path

---

#### Single-level globs match one directory level

> **Invariant:** A single `*` glob must match files only within the specified directory, never crossing directory boundaries.
>
> **Rationale:** Crossing directory boundaries would violate standard glob semantics and pull in shapes from nested modules that belong to different product areas.

**Verified by:**

- Single glob matches file in target directory
- Single glob does not match nested subdirectory
- Single glob does not match wrong extension

---

#### Recursive globs match any depth

> **Invariant:** A `**` glob must match files at any nesting depth below the specified prefix, while still respecting extension and prefix constraints.
>
> **Rationale:** Recursive globs enable broad subtree selection for shape extraction; failing to respect prefix and extension constraints would leak unrelated shapes into the output.

**Verified by:**

- Recursive glob matches file at target depth
- Recursive glob matches file at deeper depth
- Recursive glob matches file at top level
- Recursive glob does not match wrong prefix

---

#### Dataset shape extraction deduplicates by name

> **Invariant:** When multiple patterns match a source glob, the returned shapes must be deduplicated by name so each shape appears at most once.
>
> **Rationale:** Duplicate shape names in generated documentation confuse readers and inflate type registries.

**Verified by:**

- Shapes are extracted from matching patterns
- Duplicate shape names are deduplicated
- No shapes returned when glob does not match

_shape-matcher.feature_

### Shape Selector

_Tests the filterShapesBySelectors function that provides fine-grained_

---

#### Reference doc configs select shapes via shapeSelectors

> **Invariant:** shapeSelectors provides three selection modes: by source path + specific names, by group tag, or by source path alone.
>
> **Rationale:** Multiple selection modes let reference docs curate precisely which shapes appear, preventing either over-inclusion of internal types or under-inclusion of public API surfaces.

**Verified by:**

- Select specific shapes by source and names
- Select all shapes in a group
- Select all tagged shapes from a source file
- shapeSources without shapeSelectors returns all shapes
- Select by source and names
- Select by group
- Select by source alone
- shapeSources backward compatibility preserved

_shape-selector.feature_

### Source Mapper

_The Source Mapper aggregates content from multiple source files based on_

---

#### Extraction methods dispatch to correct handlers

> **Invariant:** Each extraction method type (self-reference, TypeScript, Gherkin) must dispatch to the correct specialized handler based on the source file type or marker.
>
> **Rationale:** Wrong dispatch would apply TypeScript extraction logic to Gherkin files (or vice versa), producing garbled or empty results.

**Verified by:**

- Dispatch to decision extraction for THIS DECISION
- Dispatch to TypeScript extractor for .ts files
- Dispatch to behavior spec extractor for .feature files

---

#### Self-references extract from current decision document

> **Invariant:** THIS DECISION self-references must extract content from the current decision document using rule descriptions, DocStrings, or full document access.
>
> **Rationale:** Self-references avoid circular file reads — the document content is already in memory, so extraction is a lookup operation rather than a file I/O operation.

**Verified by:**

- Extract from THIS DECISION using rule description
- Extract DocStrings from THIS DECISION
- Extract full document from THIS DECISION

---

#### Multiple sources are aggregated in mapping order

> **Invariant:** When multiple source mappings target the same section, their extracted content must be aggregated in the order defined by the mapping table.
>
> **Rationale:** Mapping order is intentional — authors structure their source tables to produce a logical reading flow, and reordering would break the narrative.

**Verified by:**

- Aggregate from multiple sources
- Ordering is preserved from mapping table

---

#### Missing files produce warnings without failing

> **Invariant:** When a referenced source file does not exist, the mapper must produce a warning and continue processing remaining mappings rather than failing entirely.
>
> **Rationale:** Partial extraction is more useful than total failure — a decision document with most sections populated and one warning is better than no document at all.

**Verified by:**

- Missing source file produces warning
- Partial extraction when some files missing
- Validation checks all files before extraction

---

#### Empty extraction results produce info warnings

> **Invariant:** When extraction succeeds but produces empty results (no matching shapes, no matching rules), an informational warning must be generated.
>
> **Rationale:** Empty results often indicate stale source mappings pointing to renamed or removed content — warnings surface these issues before they reach generated output.

**Verified by:**

- Empty shapes extraction produces info warning
- No matching rules produces info warning

---

#### Extraction methods are normalized for dispatch

> **Invariant:** Extraction method strings must be normalized to canonical forms before dispatch, with unrecognized methods producing a warning.
>
> **Rationale:** Users write extraction methods in natural language — normalization bridges the gap between human-readable table entries and programmatic dispatch keys.

**Verified by:**

- Normalize various extraction method formats
- Unknown extraction method produces warning

_source-mapper.feature_

### Source Mapping Validator

_Source mappings reference files that may not exist, use invalid_

---

#### Source files must exist and be readable

> **Invariant:** All source file paths in mappings must resolve to existing, readable files.
>
> **Rationale:** Prevents extraction failures and provides clear error messages upfront.

**Verified by:**

- Existing file passes validation
- Missing file produces error with path
- Directory instead of file produces error
- THIS DECISION skips file validation
- THIS DECISION with rule reference skips file validation
- @acceptance-criteria scenarios below.

---

#### Extraction methods must be valid and supported

> **Invariant:** Extraction methods must match a known method from the supported set.
>
> **Rationale:** Invalid methods cannot extract content; suggest valid alternatives.

**Verified by:**

- Valid extraction methods pass validation
- Unknown method produces error with suggestions
- Empty method produces error
- Method aliases are normalized
- @acceptance-criteria scenarios below.

---

#### Extraction methods must be compatible with file types

> **Invariant:** Method-file combinations must be compatible (e.g., TypeScript methods for .ts files).
>
> **Rationale:** Incompatible combinations fail at extraction; catch early with clear guidance.

**Verified by:**

- TypeScript method on feature file produces error
- Gherkin method on TypeScript file produces error
- Compatible method-file combination passes
- Self-reference method on actual file produces error
- @acceptance-criteria scenarios below.

---

#### Source mapping tables must have required columns

> **Invariant:** Tables must contain Section, Source File, and Extraction Method columns.
>
> **Rationale:** Missing columns prevent extraction; alternative column names are mapped.

**Verified by:**

- Missing Section column produces error
- Missing Source File column produces error
- Alternative column names are accepted
- @acceptance-criteria scenarios below.

---

#### All validation errors are collected and returned together

> **Invariant:** Validation collects all errors before returning, not just the first.
>
> **Rationale:** Enables users to fix all issues in a single iteration.

**Verified by:**

- Multiple errors are aggregated
- Warnings are collected alongside errors
- @acceptance-criteria scenarios below.

_source-mapping-validator.feature_

### Table Extraction

_Tables in business rule descriptions should appear exactly once in output._

---

#### Tables in rule descriptions render exactly once

> **Invariant:** Each markdown table in a rule description appears exactly once in the rendered output, with no residual pipe characters in surrounding text.
>
> **Rationale:** Without deduplication, tables extracted for formatting would also remain in the raw description text, producing duplicate output.

**Verified by:**

- Single table renders once in detailed mode
- Table is extracted and properly formatted

---

#### Multiple tables in description each render exactly once

> **Invariant:** When a rule description contains multiple markdown tables, each table renders as a separate formatted table block with no merging or duplication.
>
> **Rationale:** Merging or dropping tables would lose distinct data structures that the author intentionally separated, corrupting the rendered documentation.

**Verified by:**

- Two tables in description render as two separate tables

---

#### stripMarkdownTables removes table syntax from text

> **Invariant:** stripMarkdownTables removes all pipe-delimited table syntax from input text while preserving all surrounding content unchanged.
>
> **Rationale:** If table syntax is not stripped from the raw text, the same table data appears twice in the rendered output -- once from the extracted table block and once as raw pipe characters in the description.

**Verified by:**

- Strips single table from text
- Strips multiple tables from text
- Preserves text without tables

_table-extraction.feature_

### Taxonomy Codec

_Validates the Taxonomy Codec that transforms MasterDataset into a_

---

#### Document metadata is correctly set

> **Invariant:** The taxonomy document must have the title "Taxonomy Reference", a descriptive purpose string, and a detail level reflecting the generateDetailFiles option.
>
> **Rationale:** Document metadata drives the table of contents and navigation in generated doc sites — incorrect metadata produces broken links and misleading titles.

**Verified by:**

- Document title is Taxonomy Reference
- Document purpose describes tag taxonomy
- Detail level reflects generateDetailFiles option

---

#### Categories section is generated from TagRegistry

> **Invariant:** The categories section must render all categories from the configured TagRegistry as a table, with optional linkOut to detail files when progressive disclosure is enabled.
>
> **Rationale:** Categories are the primary navigation structure in the taxonomy — missing categories leave developers unable to find the correct annotation tags.

**Verified by:**

- Categories section is included in output
- Category table has correct columns
- LinkOut to detail file when generateDetailFiles enabled

---

#### Metadata tags can be grouped by domain

> **Invariant:** When groupByDomain is enabled, metadata tags must be organized into domain-specific subsections; when disabled, a single flat table must be rendered.
>
> **Rationale:** Domain grouping improves scannability for large tag sets (21 categories in ddd-es-cqrs) while flat mode is simpler for small presets (3 categories in generic).

**Verified by:**

- With groupByDomain enabled tags are grouped into subsections
- With groupByDomain disabled single table rendered

---

#### Tags are classified into domains by hardcoded mapping

> **Invariant:** Tags must be classified into domains (Core, Relationship, Timeline, etc.) using a hardcoded mapping, with unrecognized tags placed in an "Other Tags" group.
>
> **Rationale:** Domain classification is stable across releases — hardcoding prevents miscategorization from user config errors while the "Other" fallback handles future tag additions gracefully.

**Verified by:**

- Core tags correctly classified
- Relationship tags correctly classified
- Timeline tags correctly classified
- ADR prefix matching works
- Unknown tags go to Other Tags group

---

#### Optional sections can be disabled via codec options

> **Invariant:** Format Types, Presets, and Architecture sections must each be independently disableable via their respective codec option flags.
>
> **Rationale:** Not all projects need all sections — disabling irrelevant sections reduces generated document size and prevents confusion from inapplicable content.

**Verified by:**

- includeFormatTypes disabled excludes Format Types section
- includePresets disabled excludes Presets section
- includeArchDiagram disabled excludes Architecture section

---

#### Detail files are generated for progressive disclosure

> **Invariant:** When generateDetailFiles is enabled, the codec must produce additional detail files (one per domain group) alongside the main taxonomy document; when disabled, no additional files are created.
>
> **Rationale:** Progressive disclosure keeps the main document scannable while providing deep-dive content in linked pages — monolithic documents become unwieldy for large tag sets.

**Verified by:**

- generateDetailFiles creates 3 additional files
- Detail files have correct paths
- generateDetailFiles disabled creates no additional files

---

#### Format types are documented with descriptions and examples

> **Invariant:** All 6 format types must be documented with descriptions and usage examples in the generated taxonomy.
>
> **Rationale:** Format types control how tag values are parsed — undocumented formats force developers to guess the correct syntax, leading to annotation errors.

**Verified by:**

- All 6 format types are documented

_taxonomy-codec.feature_

### Timeline Codec

_- Need to generate roadmap, milestones, and current work documents from patterns_

---

#### RoadmapDocumentCodec groups patterns by phase with progress tracking

> **Invariant:** The roadmap must include overall progress with percentage, phase navigation table, and phase sections with pattern tables.
>
> **Rationale:** The roadmap is the primary planning artifact — progress tracking at both project and phase level enables informed prioritization.

**Verified by:**

- Decode empty dataset produces minimal roadmap
- Decode dataset with multiple phases
- Progress section shows correct status counts
- Phase navigation table with progress
- Phase sections show pattern tables
- Generate phase detail files when enabled
- No detail files when disabled
- Quarterly timeline shown when quarters exist

---

#### CompletedMilestonesCodec shows only completed patterns grouped by quarter

> **Invariant:** Only completed patterns appear, grouped by quarter with navigation, recent completions, and collapsible phase details.
>
> **Rationale:** Milestone tracking provides a historical record of delivery — grouping by quarter aligns with typical reporting cadence.

**Verified by:**

- No completed patterns produces empty message
- Summary shows completed counts
- Quarterly navigation with completed patterns
- Completed phases shown in collapsible sections
- Recent completions section with limit
- Generate quarterly detail files when enabled

---

#### CurrentWorkCodec shows only active patterns with deliverables

> **Invariant:** Only active patterns appear with progress bars, deliverable tracking, and an all-active-patterns summary table.
>
> **Rationale:** Current work focus eliminates noise from completed and planned items — teams need to see only what's in flight.

**Verified by:**

- No active work produces empty message
- Summary shows overall progress
- Active phases with progress bars
- Deliverables rendered when configured
- All active patterns table
- Generate current work detail files when enabled

_timeline-codecs.feature_

### Transform Dataset

_- Generators need multiple views of the same pattern data_

---

#### Empty dataset produces valid zero-state views

> **Invariant:** An empty input produces a MasterDataset with all counts at zero and no groupings.
>
> **Rationale:** Generators must handle the zero-state gracefully; a missing or malformed empty dataset would cause null-reference errors across all rendering codecs.

**Verified by:**

- Transform empty dataset

---

#### Status and phase grouping creates navigable views

> **Invariant:** Patterns are grouped by canonical status and sorted by phase number, with per-phase status counts computed.
>
> **Rationale:** Generators need O(1) access to status-filtered and phase-ordered views without recomputing on each render pass.

**Verified by:**

- Group patterns by status
- Normalize status variants to canonical values
- Group patterns by phase
- Sort phases by phase number
- Compute per-phase status counts
- Patterns without phase are not in byPhase

---

#### Quarter and category grouping organizes by timeline and domain

> **Invariant:** Patterns are grouped by quarter and category, with only patterns bearing the relevant metadata included in each view.
>
> **Rationale:** Timeline and domain views must exclude patterns without the relevant metadata to prevent misleading counts and empty groupings in generated documentation.

**Verified by:**

- Group patterns by quarter
- Patterns without quarter are not in byQuarter
- Group patterns by category

---

#### Source grouping separates TypeScript and Gherkin origins

> **Invariant:** Patterns are partitioned by source file type, and patterns with phase metadata appear in the roadmap view.
>
> **Rationale:** Codecs that render TypeScript-specific or Gherkin-specific views depend on pre-partitioned sources; mixing sources would produce incorrect per-origin statistics and broken cross-references.

**Verified by:**

- Group patterns by source file type
- Patterns with phase are also in roadmap view

---

#### Relationship index builds bidirectional dependency graph

> **Invariant:** The relationship index contains forward and reverse lookups, with reverse lookups merged and deduplicated against explicit annotations.
>
> **Rationale:** Bidirectional navigation is required for dependency tree queries without O(n) scans per lookup.

**Verified by:**

- Build relationship index from patterns
- Build relationship index with all relationship types
- Reverse lookup computes enables from dependsOn
- Reverse lookup computes usedBy from uses
- Reverse lookup merges with explicit annotations without duplicates

---

#### Completion tracking computes project progress

> **Invariant:** Completion percentage is rounded to the nearest integer, and fully-completed requires all patterns in completed status with a non-zero total.
>
> **Rationale:** Inconsistent rounding or a false-positive fully-completed signal on an empty dataset would misrepresent project health in dashboards and generated progress reports.

**Verified by:**

- Calculate completion percentage
- Check if fully completed

---

#### Workflow integration conditionally includes delivery process data

> **Invariant:** The workflow is included in the MasterDataset only when provided, and phase names are resolved from the workflow configuration.
>
> **Rationale:** Projects without a delivery workflow must still produce valid datasets; unconditionally requiring workflow data would break standalone documentation generation.

**Verified by:**

- Include workflow in result when provided
- Result omits workflow when not provided

_transform-dataset.feature_

### Validation Rules Codec

_Validates the Validation Rules Codec that transforms MasterDataset into a_

---

#### Document metadata is correctly set

> **Invariant:** The validation rules document must have the title "Validation Rules", a purpose describing Process Guard, and a detail level reflecting the generateDetailFiles option.
>
> **Rationale:** Accurate metadata ensures the validation rules document is correctly indexed in the generated documentation site.

**Verified by:**

- Document title is Validation Rules
- Document purpose describes Process Guard
- Detail level reflects generateDetailFiles option

---

#### All validation rules are documented in a table

> **Invariant:** All 6 Process Guard validation rules must appear in the rules table with their correct severity levels (error or warning).
>
> **Rationale:** The rules table is the primary reference for understanding what Process Guard enforces — missing rules would leave developers surprised by undocumented validation failures.

**Verified by:**

- All 6 rules appear in table
- Rules have correct severity levels

---

#### FSM state diagram is generated from transitions

> **Invariant:** When includeFSMDiagram is enabled, a Mermaid state diagram showing all 4 FSM states and their transitions must be generated; when disabled, the diagram section must be omitted.
>
> **Rationale:** The state diagram is the most intuitive representation of allowed transitions — it answers "where can I go from here?" faster than a text table.

**Verified by:**

- Mermaid diagram generated when includeFSMDiagram enabled
- Diagram includes all 4 states
- FSM diagram excluded when includeFSMDiagram disabled

---

#### Protection level matrix shows status protections

> **Invariant:** When includeProtectionMatrix is enabled, a matrix showing all 4 statuses with their protection levels must be generated; when disabled, the section must be omitted.
>
> **Rationale:** The protection matrix explains why certain edits are blocked — without it, developers encounter cryptic "scope-creep" or "completed-protection" errors without understanding the underlying model.

**Verified by:**

- Matrix shows all 4 statuses with protection levels
- Protection matrix excluded when includeProtectionMatrix disabled

---

#### CLI usage is documented with options and exit codes

> **Invariant:** When includeCLIUsage is enabled, the document must include CLI example code, all 6 options, and exit code documentation; when disabled, the section must be omitted.
>
> **Rationale:** CLI documentation in the validation rules doc provides a single reference for both the rules and how to run them — separate docs would fragment the developer experience.

**Verified by:**

- CLI example code block included
- All 6 CLI options documented
- Exit codes documented
- CLI section excluded when includeCLIUsage disabled

---

#### Escape hatches are documented for special cases

> **Invariant:** When includeEscapeHatches is enabled, all 3 escape hatch mechanisms must be documented; when disabled, the section must be omitted.
>
> **Rationale:** Escape hatches prevent the validation system from becoming a blocker — developers need to know how to safely bypass rules for legitimate exceptions.

**Verified by:**

- All 3 escape hatches documented
- Escape hatches section excluded when includeEscapeHatches disabled

_validation-rules-codec.feature_

### Warning Collector

_The warning collector provides a unified system for capturing, categorizing,_

---

#### Warnings are captured with source context

> **Invariant:** Each captured warning must include the source file path, optional line number, and category for precise identification.
>
> **Rationale:** Context-free warnings are impossible to act on — developers need to know which file and line produced the warning to fix the underlying issue.

**Verified by:**

- Warning includes source file
- Warning includes line number when available
- Warning includes category

---

#### Warnings are categorized for filtering and grouping

> **Invariant:** Warnings must support multiple categories and be filterable by both category and source file.
>
> **Rationale:** Large codebases produce many warnings — filtering by category or file lets developers focus on one concern at a time instead of triaging an overwhelming flat list.

**Verified by:**

- Warning categories are supported
- Warnings can be filtered by category
- Warnings can be filtered by source file

---

#### Warnings are aggregated across the pipeline

> **Invariant:** Warnings from multiple pipeline stages must be collected into a single aggregated view, groupable by source file and summarizable by category counts.
>
> **Rationale:** Pipeline stages run independently — without aggregation, warnings would be scattered across stage outputs, making it impossible to see the full picture.

**Verified by:**

- Warnings from multiple stages are collected
- Warnings are grouped by source file
- Summary counts by category

---

#### Warnings integrate with the Result pattern

> **Invariant:** Warnings must propagate through the Result monad, being preserved in both successful and failed results and across pipeline stages.
>
> **Rationale:** The Result pattern is the standard error-handling mechanism — warnings that don't propagate through Results would be silently lost when functions compose.

**Verified by:**

- Successful result includes warnings
- Failed result includes warnings collected before failure
- Warnings propagate through pipeline

---

#### Warnings can be formatted for different outputs

> **Invariant:** Warnings must be formattable as colored console output, machine-readable JSON, and markdown for documentation, each with appropriate structure.
>
> **Rationale:** Different consumers need different formats — CI pipelines parse JSON, developers read console output, and generated docs embed markdown.

**Verified by:**

- Console format includes color and location
- JSON format is machine-readable
- Markdown format for documentation

---

#### Existing console.warn calls are migrated to collector

> **Invariant:** Pipeline components (source mapper, shape extractor) must use the warning collector instead of direct console.warn calls.
>
> **Rationale:** Direct console.warn calls bypass aggregation and filtering — migrating to the collector ensures all warnings are captured, categorized, and available for programmatic consumption.

**Verified by:**

- Source mapper uses warning collector
- Shape extractor uses warning collector

_warning-collector.feature_

### Zod Codec Migration

_- Raw JSON.parse returns unknown/any types, losing type safety at runtime_

---

#### Input codec parses and validates JSON in a single step

> **Invariant:** Every JSON string parsed through the input codec is both syntactically valid JSON and schema-conformant before returning a typed value.
>
> **Rationale:** Separating parse from validate allows invalid data to leak past the boundary — a single-step codec ensures callers never hold an unvalidated value.

**Verified by:**

- Input codec parses valid JSON to typed object
- Input codec returns error for malformed JSON
- Input codec returns validation errors for schema violations
- Input codec strips $schema field before validation

---

#### Output codec validates before serialization

> **Invariant:** Every object serialized through the output codec is schema-validated before JSON.stringify, preventing invalid data from reaching consumers.
>
> **Rationale:** Serializing without validation can produce JSON that downstream consumers cannot parse, causing failures far from the source of the invalid data.

**Verified by:**

- Output codec serializes valid object to JSON
- Output codec returns error for schema violations
- Output codec respects indent option

---

#### LintOutputSchema validates CLI lint output structure

> **Invariant:** Lint output JSON always conforms to the LintOutputSchema, ensuring consistent structure for downstream tooling.
>
> **Rationale:** Non-conformant lint output breaks CI pipeline parsers and IDE integrations that depend on a stable JSON contract.

**Verified by:**

- LintOutputSchema validates correct lint output
- LintOutputSchema rejects invalid severity

---

#### ValidationSummaryOutputSchema validates cross-source analysis output

> **Invariant:** Validation summary JSON always conforms to the ValidationSummaryOutputSchema, ensuring consistent reporting of cross-source pattern analysis.
>
> **Rationale:** Inconsistent validation summaries cause miscounted pattern coverage, leading to false confidence or missed gaps in cross-source analysis.

**Verified by:**

- ValidationSummaryOutputSchema validates correct validation output
- ValidationSummaryOutputSchema rejects invalid issue source

---

#### RegistryMetadataOutputSchema accepts arbitrary nested structures

> **Invariant:** Registry metadata codec accepts any valid JSON-serializable object without schema constraints on nested structure.
>
> **Rationale:** Registry consumers attach domain-specific metadata whose shape varies per preset — constraining the nested structure would break extensibility across presets.

**Verified by:**

- RegistryMetadataOutputSchema accepts arbitrary metadata

---

#### formatCodecError produces human-readable error output

> **Invariant:** Formatted codec errors always include the operation context and all validation error details for debugging.
>
> **Rationale:** Omitting the operation context or individual field errors forces developers to reproduce failures manually instead of diagnosing from the error message alone.

**Verified by:**

- formatCodecError includes validation errors in output

---

#### safeParse returns typed values or undefined without throwing

> **Invariant:** safeParse never throws exceptions; it returns the typed value on success or undefined on any failure.
>
> **Rationale:** Throwing on invalid input forces every call site to wrap in try/catch — returning undefined lets callers use simple conditional checks and avoids unhandled exception crashes.

**Verified by:**

- safeParse returns typed value on valid JSON
- safeParse returns undefined on malformed JSON
- safeParse returns undefined on schema violation

---

#### createFileLoader handles filesystem operations with typed errors

> **Invariant:** File loader converts all filesystem errors (ENOENT, EACCES, generic) into structured CodecError values with appropriate messages and source paths.
>
> **Rationale:** Propagating raw filesystem exceptions leaks Node.js error internals to consumers and prevents consistent error formatting across parse, validate, and I/O failures.

**Verified by:**

- createFileLoader loads and parses valid JSON file
- createFileLoader handles ENOENT error
- createFileLoader handles EACCES error
- createFileLoader handles general read error
- createFileLoader handles invalid JSON in file

_codec-migration.feature_

---

[← Back to Business Rules](../BUSINESS-RULES.md)
