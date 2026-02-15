# Generation Business Rules

**Purpose:** Business rules for the Generation product area

---

**223 rules** from 45 features. 100 rules have explicit invariants.

---

## Phase 44

### Rich Content Helpers

*As a document codec author*

---

#### DocString parsing handles edge cases

**Verified by:**
- Empty description returns empty array
- Description with no DocStrings returns single paragraph
- Single DocString parses correctly
- DocString without language hint uses text
- Unclosed DocString returns plain paragraph fallback
- Windows CRLF line endings are normalized

---

#### DataTable rendering produces valid markdown

**Verified by:**
- Single row DataTable renders correctly
- Multi-row DataTable renders correctly
- Missing cell values become empty strings

---

#### Scenario content rendering respects options

**Verified by:**
- Render scenario with steps
- Skip steps when includeSteps is false
- Render scenario with DataTable in step

---

#### Business rule rendering handles descriptions

**Verified by:**
- Rule with simple description
- Rule with no description
- Rule with embedded DocString in description

---

#### DocString content is dedented when parsed

**Verified by:**
- Code block preserves internal relative indentation
- Empty lines in code block are preserved
- Trailing whitespace is trimmed from each line
- Code with mixed indentation is preserved

*rich-content-helpers.feature*

---

## Phase 99

### Test Content Blocks

*This feature demonstrates what content blocks are captured and rendered*

---

#### Business rules appear as a separate section

Rule descriptions provide context for why this business rule exists.

**Verified by:**
- Scenario with DocString for rich content
- Scenario with DataTable for structured data

---

#### Multiple rules create multiple Business Rule entries

Each Rule keyword creates a separate entry in the Business Rules section.

**Verified by:**
- Simple scenario under second rule
- Scenario with examples table

*test-content-blocks.feature*

---

## Uncategorized

### Arch Generator Registration

*I want an architecture generator registered in the generator registry*

---

#### Architecture generator is registered in the registry

The architecture generator must be registered like other built-in
    generators so it can be invoked via CLI.

**Verified by:**
- Generator is available in registry

---

#### Architecture generator produces component diagram by default

Running the architecture generator without options produces
    a component diagram (bounded context view).

**Verified by:**
- Default generation produces component diagram

---

#### Architecture generator supports diagram type options

The generator accepts options to specify diagram type
    (component or layered).

**Verified by:**
- Generate layered diagram with options

---

#### Architecture generator supports context filtering

The generator can filter to specific bounded contexts
    for focused diagram output.

**Verified by:**
- Filter to specific contexts

*generator-registration.feature*

### Arch Index Dataset

*As a documentation generator*

---

#### archIndex groups patterns by arch-role

The archIndex.byRole map groups patterns by their architectural role
    (command-handler, projection, saga, etc.) for efficient lookup.

**Verified by:**
- Group patterns by role

---

#### archIndex groups patterns by arch-context

The archIndex.byContext map groups patterns by bounded context
    for subgraph rendering in component diagrams.

**Verified by:**
- Group patterns by context

---

#### archIndex groups patterns by arch-layer

The archIndex.byLayer map groups patterns by architectural layer
    (domain, application, infrastructure) for layered diagram rendering.

**Verified by:**
- Group patterns by layer

---

#### archIndex.all contains all patterns with any arch tag

The archIndex.all array contains all patterns that have at least
    one arch tag (role, context, or layer).

**Verified by:**
- archIndex.all includes all annotated patterns

---

#### Patterns without arch tags are excluded from archIndex

Patterns that have no arch-role, arch-context, or arch-layer are
    not included in the archIndex at all.

**Verified by:**
- Non-annotated patterns excluded

*arch-index.feature*

### Arch Tag Extraction

*As a documentation generator*

---

#### arch-role tag is defined in the registry

Architecture roles classify components for diagram rendering.

**Verified by:**
- arch-role tag exists with enum format
- arch-role has required enum values

---

#### arch-context tag is defined in the registry

Context tags group components into bounded context subgraphs.

**Verified by:**
- arch-context tag exists with value format

---

#### arch-layer tag is defined in the registry

Layer tags enable layered architecture diagrams.

**Verified by:**
- arch-layer tag exists with enum format
- arch-layer has exactly three values

---

#### AST parser extracts arch-role from TypeScript annotations

The AST parser must extract arch-role alongside other pattern metadata.

**Verified by:**
- Extract arch-role projection
- Extract arch-role command-handler

---

#### AST parser extracts arch-context from TypeScript annotations

Context values are free-form strings naming the bounded context.

**Verified by:**
- Extract arch-context orders
- Extract arch-context inventory

---

#### AST parser extracts arch-layer from TypeScript annotations

Layer tags classify components by architectural layer.

**Verified by:**
- Extract arch-layer application
- Extract arch-layer infrastructure

---

#### AST parser handles multiple arch tags together

Components often have role + context + layer together.

**Verified by:**
- Extract all three arch tags

---

#### Missing arch tags yield undefined values

Components without arch tags should have undefined (not null or empty).

**Verified by:**
- Missing arch tags are undefined

*arch-tag-extraction.feature*

### Business Rules Document Codec

*Tests the BusinessRulesCodec transformation from MasterDataset to RenderableDocument.*

---

#### Extracts Rule blocks with Invariant and Rationale

**Verified by:**
- Extracts annotated Rule with Invariant and Rationale
- Extracts unannotated Rule without showing not specified

---

#### Organizes rules by product area and phase

**Verified by:**
- Groups rules by product area and phase
- Orders rules by phase within domain

---

#### Summary mode generates compact output

**Verified by:**
- Summary mode includes statistics line
- Summary mode excludes detailed sections

---

#### Preserves code examples and tables in detailed mode

**Verified by:**
- Code examples included in detailed mode
- Code examples excluded in standard mode

---

#### Generates scenario traceability links

**Verified by:**
- Verification links include file path

---

#### Progressive disclosure generates detail files per product area

**Verified by:**
- Detail files are generated per product area
- Main document has product area index table with links
- Detail files have back-link to main document

---

#### Empty rules show placeholder instead of blank content

**Verified by:**
- Rule without invariant or description or scenarios shows placeholder
- Rule without invariant but with scenarios shows verified-by instead

---

#### Rules always render flat for full visibility

**Verified by:**
- Features with many rules render flat without collapsible blocks

---

#### Source file shown as filename text

**Verified by:**
- Source file rendered as plain text not link

---

#### Verified-by renders as checkbox list at standard level

**Verified by:**
- Rules with scenarios show verified-by checklist
- Duplicate scenario names are deduplicated

---

#### Feature names are humanized from camelCase pattern names

**Verified by:**
- CamelCase pattern name becomes spaced heading
- Testing suffix is stripped from feature names

*business-rules-codec.feature*

### Codec Based Generator

*Tests the CodecBasedGenerator which adapts the RenderableDocument Model (RDM)*

---

#### CodecBasedGenerator adapts codecs to generator interface

**Verified by:**
- Generator delegates to codec
- Missing MasterDataset returns error
- Codec options are passed through

*codec-based.feature*

### Component Diagram Generation

*As a documentation generator*

---

#### Component diagrams group patterns by bounded context

Patterns with arch-context are grouped into Mermaid subgraphs.

**Verified by:**
- Generate subgraphs for bounded contexts

---

#### Context-less patterns go to Shared Infrastructure

Patterns without arch-context are grouped into a
    "Shared Infrastructure" subgraph.

**Verified by:**
- Shared infrastructure subgraph for context-less patterns

---

#### Relationship types render with distinct arrow styles

Arrow styles follow UML conventions:
    - uses: solid arrow (-->)
    - depends-on: dashed arrow (-.->)
    - implements: dotted arrow (..->)
    - extends: open arrow (-->>)

**Verified by:**
- Arrow styles for relationship types

---

#### Arrows only connect annotated components

Relationships pointing to non-annotated patterns
    are not rendered (target would not exist in diagram).

**Verified by:**
- Skip arrows to non-annotated targets

---

#### Component diagram includes summary section

The generated document starts with an overview section
    showing component counts and bounded context statistics.

**Verified by:**
- Summary section with counts

---

#### Component diagram includes legend when enabled

The legend explains arrow style meanings for readers.

**Verified by:**
- Legend section with arrow explanations

---

#### Component diagram includes inventory table when enabled

The inventory lists all components with their metadata.

**Verified by:**
- Inventory table with component details

---

#### Empty architecture data shows guidance message

If no patterns have architecture annotations,
    the document explains how to add them.

**Verified by:**
- No architecture data message

*component-diagram.feature*

### Composite Codec

*Assembles reference documents from multiple codec outputs by*

---

#### CompositeCodec concatenates sections in codec array order

> **Invariant:** Sections from child codecs appear in the composite output in the same order as the codecs array.

**Verified by:**
- Sections from two codecs appear in order
- Three codecs produce sections in array order

---

#### Separators between codec outputs are configurable

> **Invariant:** By default, a separator block is inserted between each child codec's sections. When separateSections is false, no separators are added.

**Verified by:**
- Default separator between sections
- No separator when disabled

---

#### additionalFiles merge with last-wins semantics

> **Invariant:** additionalFiles from all children are merged into a single record. When keys collide, the later codec's value wins.

**Verified by:**
- Non-overlapping files merged
- Colliding keys use last-wins

---

#### composeDocuments works at document level without codecs

> **Invariant:** composeDocuments accepts RenderableDocument array and produces a composed RenderableDocument without requiring codecs.

**Verified by:**
- Direct document composition

---

#### Empty codec outputs are handled gracefully

> **Invariant:** Codecs producing empty sections arrays contribute nothing to the output. No separator is emitted for empty outputs.

**Verified by:**
- Empty codec skipped without separator

*composite-codec.feature*

### Content Deduplication

*Multiple sources may extract identical content, leading to*

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

*content-deduplication.feature*

### Convention Extractor

*Extracts convention content from MasterDataset decision records*

---

#### Empty and missing inputs produce empty results

**Verified by:**
- Empty convention tags returns empty array
- No matching patterns returns empty array

---

#### Convention bundles are extracted from matching patterns

**Verified by:**
- Single pattern with one convention tag produces one bundle
- Pattern with CSV conventions contributes to multiple bundles
- Multiple patterns with same convention merge into one bundle

---

#### Structured content is extracted from rule descriptions

**Verified by:**
- Invariant and rationale are extracted from rule description
- Tables in rule descriptions are extracted as structured data

---

#### Code examples in rule descriptions are preserved

**Verified by:**
- Mermaid diagram in rule description is extracted as code example
- Rule description without code examples has no code examples field

---

#### TypeScript JSDoc conventions are extracted alongside Gherkin

**Verified by:**
- TypeScript pattern with heading sections produces multiple rules
- TypeScript pattern without headings becomes single rule
- TypeScript and Gherkin conventions merge in same bundle
- TypeScript pattern with convention but empty description
- TypeScript description with tables is extracted correctly
- TypeScript description with code examples

*convention-extractor.feature*

### Decision Doc Codec

*Validates the Decision Doc Codec that parses decision documents (ADR/PDR*

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

*decision-doc-codec.feature*

### Decision Doc Generator

*The Decision Doc Generator orchestrates the full documentation generation*

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

*decision-doc-generator.feature*

### Dedent Helper

*- DocStrings in Gherkin files have consistent indentation for alignment*

---

#### Tabs are normalized to spaces before dedent

**Verified by:**
- Tab-indented code is properly dedented
- Mixed tabs and spaces are normalized

---

#### Empty lines are handled correctly

**Verified by:**
- Empty lines with trailing spaces are preserved
- All empty lines returns original text

---

#### Single line input is handled

**Verified by:**
- Single line with indentation is dedented
- Single line without indentation is unchanged

---

#### Unicode whitespace is handled

**Verified by:**
- Non-breaking space is treated as content

---

#### Relative indentation is preserved

**Verified by:**
- Nested code blocks preserve relative indentation
- Mixed indentation levels are preserved relatively

*dedent.feature*

### Description Header Normalization

*Pattern descriptions should not create duplicate headers when rendered.*

---

#### Leading headers are stripped from pattern descriptions

**Verified by:**
- Strip single leading markdown header
- Strip multiple leading headers
- Preserve description without leading header

---

#### Edge cases are handled correctly

**Verified by:**
- Empty description after stripping headers
- Description with only whitespace and headers
- Header in middle of description is preserved

---

#### stripLeadingHeaders removes only leading headers

**Verified by:**
- Strips h1 header
- Strips h2 through h6 headers
- Strips leading empty lines before header
- Preserves content starting with text
- Returns empty string for header-only input
- Handles null/undefined input

*description-headers.feature*

### Documentation Orchestrator

*Tests the orchestrator's pattern merging, conflict detection, and generator*

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

*orchestrator.feature*

### Extract Summary

*The extractSummary function transforms multi-line pattern descriptions into*

---

#### Single-line descriptions are returned as-is when complete

**Verified by:**
- Complete sentence on single line
- Single line without sentence ending gets ellipsis

---

#### Multi-line descriptions are combined until sentence ending

**Verified by:**
- Two lines combine into complete sentence
- Combines lines up to sentence boundary within limit
- Long multi-line text truncates when exceeds limit
- Multi-line without sentence ending gets ellipsis

---

#### Long descriptions are truncated at sentence or word boundaries

**Verified by:**
- Long text truncates at sentence boundary within limit
- Long text without sentence boundary truncates at word with ellipsis

---

#### Tautological and header lines are skipped

**Verified by:**
- Skips pattern name as first line
- Skips section header labels
- Skips multiple header patterns

---

#### Edge cases are handled gracefully

**Verified by:**
- Empty description returns empty string
- Markdown headers are stripped
- Bold markdown is stripped
- Multiple sentence endings - takes first complete sentence
- Question mark as sentence ending

*extract-summary.feature*

### Generator Registry

*Tests the GeneratorRegistry registration, lookup, and listing capabilities.*

---

#### Registry manages generator registration and retrieval

**Verified by:**
- Register generator with unique name
- Duplicate registration throws error
- Get registered generator
- Get unknown generator returns undefined
- Available returns sorted list

*registry.feature*

### Implementation Link Path Normalization

*Links to implementation files in generated pattern documents should have*

---

#### Repository prefixes are stripped from implementation paths

**Verified by:**
- Strip libar-platform prefix from implementation paths
- Strip monorepo prefix from implementation paths
- Preserve paths without repository prefix

---

#### All implementation links in a pattern are normalized

**Verified by:**
- Multiple implementations with mixed prefixes

---

#### normalizeImplPath strips known prefixes

**Verified by:**
- Strips libar-platform/ prefix
- Strips monorepo/ prefix
- Returns unchanged path without known prefix
- Only strips prefix at start of path

*implementation-links.feature*

### Layered Diagram Generation

*As a documentation generator*

---

#### Layered diagrams group patterns by arch-layer

Patterns with arch-layer are grouped into Mermaid subgraphs.

**Verified by:**
- Generate subgraphs for each layer

---

#### Layer order is domain to infrastructure (top to bottom)

The layer subgraphs are rendered in Clean Architecture order:
    domain at top, then application, then infrastructure at bottom.

**Verified by:**
- Layers render in correct order

---

#### Context labels included in layered diagram nodes

Unlike component diagrams which group by context, layered diagrams
    include the context as a label in each node name.

**Verified by:**
- Nodes include context labels

---

#### Patterns without layer go to Other subgraph

Patterns that have arch-role or arch-context but no arch-layer
    are grouped into an "Other" subgraph.

**Verified by:**
- Unlayered patterns in Other subgraph

---

#### Layered diagram includes summary section

The generated document starts with an overview section
    specific to layered architecture visualization.

**Verified by:**
- Summary section for layered view

*layered-diagram.feature*

### Mermaid Relationship Rendering

*Tests for rendering all relationship types in Mermaid dependency graphs*

---

#### Each relationship type has a distinct arrow style

**Verified by:**
- Uses relationships render as solid arrows
- Depends-on relationships render as dashed arrows
- Implements relationships render as dotted arrows
- Extends relationships render as solid open arrows

---

#### Pattern names are sanitized for Mermaid node IDs

**Verified by:**
- Special characters are replaced

---

#### All relationship types appear in single graph

**Verified by:**
- Complete dependency graph with all relationship types

*mermaid-rendering.feature*

### Patterns Codec

*- Need to generate a comprehensive pattern registry from extracted patterns*

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

**Verified by:**
- Category sections with pattern lists
- Filter to specific categories

---

#### Dependency graph visualizes pattern relationships

> **Invariant:** A Mermaid dependency graph must be included when pattern relationships exist and the includeDependencyGraph option is not disabled; it must be omitted when no relationships exist or when explicitly disabled.

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

*patterns-codec.feature*

### Planning Codec

*- Need to generate planning checklists, session plans, and findings documents from patterns*

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

*planning-codecs.feature*

### Poc Integration

*End-to-end integration tests that exercise the full documentation generation*

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

*poc-integration.feature*

### Pr Changes Codec

*- Need to generate PR-specific documentation from patterns*

---

#### PrChangesCodec handles empty results gracefully

**Verified by:**
- No changes when no patterns match changedFiles filter
- No changes when no patterns match releaseFilter
- No changes with combined filters when nothing matches

---

#### PrChangesCodec generates summary with filter information

**Verified by:**
- Summary section shows pattern counts
- Summary shows release tag when releaseFilter is set
- Summary shows files filter count when changedFiles is set

---

#### PrChangesCodec groups changes by phase when sortBy is "phase"

**Verified by:**
- Changes grouped by phase with default sortBy
- Pattern details shown within phase groups

---

#### PrChangesCodec groups changes by priority when sortBy is "priority"

**Verified by:**
- Changes grouped by priority
- Priority groups show correct patterns

---

#### PrChangesCodec shows flat list when sortBy is "workflow"

**Verified by:**
- Flat changes list with workflow sort

---

#### PrChangesCodec renders pattern details with metadata and description

**Verified by:**
- Pattern detail shows metadata table
- Pattern detail shows business value when available
- Pattern detail shows description

---

#### PrChangesCodec renders deliverables when includeDeliverables is enabled

**Verified by:**
- Deliverables shown when patterns have deliverables
- Deliverables filtered by release when releaseFilter is set
- No deliverables section when includeDeliverables is disabled

---

#### PrChangesCodec renders acceptance criteria from scenarios

**Verified by:**
- Acceptance criteria rendered when patterns have scenarios
- Acceptance criteria shows scenario steps

---

#### PrChangesCodec renders business rules from Gherkin Rule keyword

**Verified by:**
- Business rules rendered when patterns have rules
- Business rules show rule names and verification info

---

#### PrChangesCodec generates review checklist when includeReviewChecklist is enabled

**Verified by:**
- Review checklist generated with standard items
- Review checklist includes completed patterns item when applicable
- Review checklist includes active work item when applicable
- Review checklist includes dependencies item when patterns have dependencies
- Review checklist includes deliverables item when patterns have deliverables
- No review checklist when includeReviewChecklist is disabled

---

#### PrChangesCodec generates dependencies section when includeDependencies is enabled

**Verified by:**
- Dependencies section shows depends on relationships
- Dependencies section shows enables relationships
- No dependencies section when patterns have no dependencies
- No dependencies section when includeDependencies is disabled

---

#### PrChangesCodec filters patterns by changedFiles

**Verified by:**
- Patterns filtered by changedFiles match
- changedFiles filter matches partial paths

---

#### PrChangesCodec filters patterns by releaseFilter

**Verified by:**
- Patterns filtered by release version

---

#### PrChangesCodec uses OR logic for combined filters

**Verified by:**
- Combined filters match patterns meeting either criterion
- Patterns matching both criteria are not duplicated

---

#### PrChangesCodec only includes active and completed patterns

**Verified by:**
- Roadmap patterns are excluded
- Deferred patterns are excluded

*pr-changes-codec.feature*

### Pr Changes Options

*Tests the PrChangesCodec filtering capabilities for generating PR-scoped*

---

#### Orchestrator supports PR changes generation options

**Verified by:**
- PR changes filters to explicit file list
- PR changes filters by release version
- Combined filters use OR logic

*pr-changes-options.feature*

### Prd Implementation Section

*Tests the Implementations section rendering in pattern documents.*

---

#### Implementation files appear in pattern docs via @libar-docs-implements

**Verified by:**
- Implementations section renders with file links
- Implementation includes description when available

---

#### Multiple implementations are listed alphabetically

**Verified by:**
- Multiple implementations sorted by file path

---

#### Patterns without implementations omit the section

**Verified by:**
- No implementations section when none exist

---

#### Implementation references use relative file links

**Verified by:**
- Links are relative from patterns directory

*prd-implementation-section.feature*

### Reference Codec

*Parameterized codec factory that creates reference document codecs*

---

#### Empty datasets produce fallback content

**Verified by:**
- Codec with no matching content produces fallback message

---

#### Convention content is rendered as sections

**Verified by:**
- Convention rules appear as H2 headings with content
- Convention tables are rendered in the document

---

#### Detail level controls output density

**Verified by:**
- Summary level omits narrative and rationale
- Detailed level includes rationale and verified-by

---

#### Behavior sections are rendered from category-matching patterns

**Verified by:**
- Behavior-tagged patterns appear in a Behavior Specifications section

---

#### Shape sources are extracted from matching patterns

**Verified by:**
- Shapes appear when source file matches shapeSources glob
- Summary level shows shapes as a compact table
- No shapes when source file does not match glob

---

#### Convention and behavior content compose in a single document

**Verified by:**
- Both convention and behavior sections appear when data exists

---

#### Composition order follows AD-5: conventions then shapes then behaviors

**Verified by:**
- Convention headings appear before shapes before behaviors

---

#### Convention code examples render as mermaid blocks

**Verified by:**
- Convention with mermaid content produces mermaid block in output
- Summary level omits convention code examples

---

#### Scoped diagrams are generated from diagramScope config

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

#### Multiple diagram scopes produce multiple mermaid blocks

**Verified by:**
- Config with diagramScopes array produces multiple diagrams
- Diagram direction is reflected in mermaid output
- Legacy diagramScope still works when diagramScopes is absent

---

#### Standard detail level includes narrative but omits rationale

**Verified by:**
- Standard level includes narrative but omits rationale

---

#### Deep behavior rendering with structured annotations

**Verified by:**
- Detailed level renders structured behavior rules
- Standard level renders behavior rules without rationale
- Summary level shows behavior rules as truncated table
- Scenario names and verifiedBy merge as deduplicated list

---

#### Shape JSDoc prose renders at standard and detailed levels

**Verified by:**
- Standard level includes JSDoc in code blocks
- Detailed level includes JSDoc in code block and property table
- Shapes without JSDoc render code blocks only

---

#### Shape sections render param returns and throws documentation

**Verified by:**
- Detailed level renders param table for function shapes
- Detailed level renders returns and throws documentation
- Standard level renders param table without throws
- Shapes without param docs skip param table

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

**Verified by:**
- Include-tagged pattern appears in behavior section
- Include-tagged pattern is additive with category-selected patterns
- Pattern without matching include tag is excluded

*reference-codec.feature*

### Reference Generator

*Registers reference document generators from project config.*

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

---

#### Generator execution produces markdown output

> **Invariant:** Every registered generator must produce at least one non-empty output file when given matching data.
>
> **Rationale:** A generator that produces empty output wastes a pipeline slot and creates confusion when expected docs are missing.

**Verified by:**
- Product area generator with matching data produces non-empty output
- Product area generator with no patterns still produces intro

*reference-generators.feature*

### Remaining Work Summary Accuracy

*Summary totals in REMAINING-WORK.md must match the sum of phase table rows.*

---

#### Summary totals equal sum of phase table rows

**Verified by:**
- Summary matches phase table with all patterns having phases
- Summary includes completed patterns correctly

---

#### Patterns without phases appear in Backlog row

**Verified by:**
- Summary includes backlog patterns without phase
- All patterns in backlog when none have phases

---

#### Patterns without patternName are counted using id

**Verified by:**
- Patterns with undefined patternName counted correctly
- Mixed patterns with and without patternName

---

#### All phases with incomplete patterns are shown

**Verified by:**
- Multiple phases shown in order
- Completed phases not shown in remaining work

*remaining-work-totals.feature*

### Reporting Codec

*- Need to generate changelog, traceability, and overview documents*

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

*reporting-codecs.feature*

### Requirements Adr Codec

*- Need to generate product requirements documents with flexible groupings*

---

#### RequirementsDocumentCodec generates PRD-style documentation from patterns

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

*requirements-adr-codecs.feature*

### Robustness Integration

*Document generation pipeline needs validation, deduplication, and*

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

*robustness-integration.feature*

### Rule Keyword Po C

*This feature tests whether vitest-cucumber supports the Rule keyword*

---

#### Basic arithmetic operations work correctly

The calculator should perform standard math operations
    with correct results.

**Verified by:**
- Addition of two positive numbers
- Subtraction of two numbers

---

#### Division has special constraints

Division by zero must be handled gracefully to prevent
    system errors.

**Verified by:**
- Division of two numbers
- Division by zero is prevented

*rule-keyword-poc.feature*

### Session Codec

*- Need to generate session context and remaining work documents from patterns*

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

*session-codecs.feature*

### Shape Matcher

*Matches file paths against glob patterns for TypeScript shape extraction.*

---

#### Exact paths match without wildcards

**Verified by:**
- Exact path matches identical path
- Exact path does not match different path

---

#### Single-level globs match one directory level

**Verified by:**
- Single glob matches file in target directory
- Single glob does not match nested subdirectory
- Single glob does not match wrong extension

---

#### Recursive globs match any depth

**Verified by:**
- Recursive glob matches file at target depth
- Recursive glob matches file at deeper depth
- Recursive glob matches file at top level
- Recursive glob does not match wrong prefix

---

#### Dataset shape extraction deduplicates by name

**Verified by:**
- Shapes are extracted from matching patterns
- Duplicate shape names are deduplicated
- No shapes returned when glob does not match

*shape-matcher.feature*

### Shape Selector

*Tests the filterShapesBySelectors function that provides fine-grained*

---

#### Reference doc configs select shapes via shapeSelectors

> **Invariant:** shapeSelectors provides three selection modes: by source path + specific names, by group tag, or by source path alone.

**Verified by:**
- Select specific shapes by source and names
- Select all shapes in a group
- Select all tagged shapes from a source file
- shapeSources without shapeSelectors returns all shapes
- Select by source and names
- Select by group
- Select by source alone
- shapeSources backward compatibility preserved

*shape-selector.feature*

### Source Mapper

*The Source Mapper aggregates content from multiple source files based on*

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

*source-mapper.feature*

### Source Mapping Validator

*Source mappings reference files that may not exist, use invalid*

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

*source-mapping-validator.feature*

### Table Extraction

*Tables in business rule descriptions should appear exactly once in output.*

---

#### Tables in rule descriptions render exactly once

**Verified by:**
- Single table renders once in detailed mode
- Table is extracted and properly formatted

---

#### Multiple tables in description each render exactly once

**Verified by:**
- Two tables in description render as two separate tables

---

#### stripMarkdownTables removes table syntax from text

**Verified by:**
- Strips single table from text
- Strips multiple tables from text
- Preserves text without tables

*table-extraction.feature*

### Taxonomy Codec

*Validates the Taxonomy Codec that transforms MasterDataset into a*

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

*taxonomy-codec.feature*

### Timeline Codec

*- Need to generate roadmap, milestones, and current work documents from patterns*

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

*timeline-codecs.feature*

### Transform Dataset

*- Generators need multiple views of the same pattern data*

---

#### Empty dataset produces valid zero-state views

> **Invariant:** An empty input produces a MasterDataset with all counts at zero and no groupings.

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

**Verified by:**
- Group patterns by quarter
- Patterns without quarter are not in byQuarter
- Group patterns by category

---

#### Source grouping separates TypeScript and Gherkin origins

> **Invariant:** Patterns are partitioned by source file type, and patterns with phase metadata appear in the roadmap view.

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

**Verified by:**
- Calculate completion percentage
- Check if fully completed

---

#### Workflow integration conditionally includes delivery process data

> **Invariant:** The workflow is included in the MasterDataset only when provided, and phase names are resolved from the workflow configuration.

**Verified by:**
- Include workflow in result when provided
- Result omits workflow when not provided

*transform-dataset.feature*

### Validation Rules Codec

*Validates the Validation Rules Codec that transforms MasterDataset into a*

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

*validation-rules-codec.feature*

### Warning Collector

*The warning collector provides a unified system for capturing, categorizing,*

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

*warning-collector.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
