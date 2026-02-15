# Generation Business Rules

**Purpose:** Business rules for the Generation product area

---

**211 rules** from 43 features. 25 rules have explicit invariants.

---

## Phase 44

### Rich Content Helpers

*As a document codec author*

#### DocString parsing handles edge cases

_Verified by: Empty description returns empty array, Description with no DocStrings returns single paragraph, Single DocString parses correctly, DocString without language hint uses text, Unclosed DocString returns plain paragraph fallback, Windows CRLF line endings are normalized_

#### DataTable rendering produces valid markdown

_Verified by: Single row DataTable renders correctly, Multi-row DataTable renders correctly, Missing cell values become empty strings_

#### Scenario content rendering respects options

_Verified by: Render scenario with steps, Skip steps when includeSteps is false, Render scenario with DataTable in step_

#### Business rule rendering handles descriptions

_Verified by: Rule with simple description, Rule with no description, Rule with embedded DocString in description_

#### DocString content is dedented when parsed

_Verified by: Code block preserves internal relative indentation, Empty lines in code block are preserved, Trailing whitespace is trimmed from each line, Code with mixed indentation is preserved_

*rich-content-helpers.feature*

---

## Phase 99

### Test Content Blocks

*This feature demonstrates what content blocks are captured and rendered*

#### Business rules appear as a separate section

Rule descriptions provide context for why this business rule exists.

_Verified by: Scenario with DocString for rich content, Scenario with DataTable for structured data_

#### Multiple rules create multiple Business Rule entries

Each Rule keyword creates a separate entry in the Business Rules section.

_Verified by: Simple scenario under second rule, Scenario with examples table_

*test-content-blocks.feature*

---

## Uncategorized

### Arch Generator Registration

*I want an architecture generator registered in the generator registry*

#### Architecture generator is registered in the registry

The architecture generator must be registered like other built-in
    generators so it can be invoked via CLI.

_Verified by: Generator is available in registry_

#### Architecture generator produces component diagram by default

Running the architecture generator without options produces
    a component diagram (bounded context view).

_Verified by: Default generation produces component diagram_

#### Architecture generator supports diagram type options

The generator accepts options to specify diagram type
    (component or layered).

_Verified by: Generate layered diagram with options_

#### Architecture generator supports context filtering

The generator can filter to specific bounded contexts
    for focused diagram output.

_Verified by: Filter to specific contexts_

*generator-registration.feature*

### Arch Index Dataset

*As a documentation generator*

#### archIndex groups patterns by arch-role

The archIndex.byRole map groups patterns by their architectural role
    (command-handler, projection, saga, etc.) for efficient lookup.

_Verified by: Group patterns by role_

#### archIndex groups patterns by arch-context

The archIndex.byContext map groups patterns by bounded context
    for subgraph rendering in component diagrams.

_Verified by: Group patterns by context_

#### archIndex groups patterns by arch-layer

The archIndex.byLayer map groups patterns by architectural layer
    (domain, application, infrastructure) for layered diagram rendering.

_Verified by: Group patterns by layer_

#### archIndex.all contains all patterns with any arch tag

The archIndex.all array contains all patterns that have at least
    one arch tag (role, context, or layer).

_Verified by: archIndex.all includes all annotated patterns_

#### Patterns without arch tags are excluded from archIndex

Patterns that have no arch-role, arch-context, or arch-layer are
    not included in the archIndex at all.

_Verified by: Non-annotated patterns excluded_

*arch-index.feature*

### Arch Tag Extraction

*As a documentation generator*

#### arch-role tag is defined in the registry

Architecture roles classify components for diagram rendering.

_Verified by: arch-role tag exists with enum format, arch-role has required enum values_

#### arch-context tag is defined in the registry

Context tags group components into bounded context subgraphs.

_Verified by: arch-context tag exists with value format_

#### arch-layer tag is defined in the registry

Layer tags enable layered architecture diagrams.

_Verified by: arch-layer tag exists with enum format, arch-layer has exactly three values_

#### AST parser extracts arch-role from TypeScript annotations

The AST parser must extract arch-role alongside other pattern metadata.

_Verified by: Extract arch-role projection, Extract arch-role command-handler_

#### AST parser extracts arch-context from TypeScript annotations

Context values are free-form strings naming the bounded context.

_Verified by: Extract arch-context orders, Extract arch-context inventory_

#### AST parser extracts arch-layer from TypeScript annotations

Layer tags classify components by architectural layer.

_Verified by: Extract arch-layer application, Extract arch-layer infrastructure_

#### AST parser handles multiple arch tags together

Components often have role + context + layer together.

_Verified by: Extract all three arch tags_

#### Missing arch tags yield undefined values

Components without arch tags should have undefined (not null or empty).

_Verified by: Missing arch tags are undefined_

*arch-tag-extraction.feature*

### Business Rules Document Codec

*Tests the BusinessRulesCodec transformation from MasterDataset to RenderableDocument.*

#### Extracts Rule blocks with Invariant and Rationale

_Verified by: Extracts annotated Rule with Invariant and Rationale, Extracts unannotated Rule without showing not specified_

#### Organizes rules by product area and phase

_Verified by: Groups rules by product area and phase, Orders rules by phase within domain_

#### Summary mode generates compact output

_Verified by: Summary mode includes statistics line, Summary mode excludes detailed sections_

#### Preserves code examples and tables in detailed mode

_Verified by: Code examples included in detailed mode, Code examples excluded in standard mode_

#### Generates scenario traceability links

_Verified by: Verification links include file path_

#### Progressive disclosure generates detail files per product area

_Verified by: Detail files are generated per product area, Main document has product area index table with links, Detail files have back-link to main document_

#### Empty rules show placeholder instead of blank content

_Verified by: Rule without invariant or description or scenarios shows placeholder, Rule without invariant but with scenarios shows verified-by instead_

#### Rules always render flat for full visibility

_Verified by: Features with many rules render flat without collapsible blocks_

#### Source file shown as filename text

_Verified by: Source file rendered as plain text not link_

#### Verified-by renders as compact italic line at standard level

_Verified by: Rules with scenarios show compact verified-by line, Duplicate scenario names are deduplicated_

#### Feature names are humanized from camelCase pattern names

_Verified by: CamelCase pattern name becomes spaced heading, Testing suffix is stripped from feature names_

*business-rules-codec.feature*

### Codec Based Generator

*Tests the CodecBasedGenerator which adapts the RenderableDocument Model (RDM)*

#### CodecBasedGenerator adapts codecs to generator interface

_Verified by: Generator delegates to codec, Missing MasterDataset returns error, Codec options are passed through_

*codec-based.feature*

### Component Diagram Generation

*As a documentation generator*

#### Component diagrams group patterns by bounded context

Patterns with arch-context are grouped into Mermaid subgraphs.

_Verified by: Generate subgraphs for bounded contexts_

#### Context-less patterns go to Shared Infrastructure

Patterns without arch-context are grouped into a
    "Shared Infrastructure" subgraph.

_Verified by: Shared infrastructure subgraph for context-less patterns_

#### Relationship types render with distinct arrow styles

Arrow styles follow UML conventions:
    - uses: solid arrow (-->)
    - depends-on: dashed arrow (-.->)
    - implements: dotted arrow (..->)
    - extends: open arrow (-->>)

_Verified by: Arrow styles for relationship types_

#### Arrows only connect annotated components

Relationships pointing to non-annotated patterns
    are not rendered (target would not exist in diagram).

_Verified by: Skip arrows to non-annotated targets_

#### Component diagram includes summary section

The generated document starts with an overview section
    showing component counts and bounded context statistics.

_Verified by: Summary section with counts_

#### Component diagram includes legend when enabled

The legend explains arrow style meanings for readers.

_Verified by: Legend section with arrow explanations_

#### Component diagram includes inventory table when enabled

The inventory lists all components with their metadata.

_Verified by: Inventory table with component details_

#### Empty architecture data shows guidance message

If no patterns have architecture annotations,
    the document explains how to add them.

_Verified by: No architecture data message_

*component-diagram.feature*

### Composite Codec

*Assembles reference documents from multiple codec outputs by*

#### CompositeCodec concatenates sections in codec array order

**Invariant:** Sections from child codecs appear in the composite output in the same order as the codecs array.

_Verified by: Sections from two codecs appear in order, Three codecs produce sections in array order_

#### Separators between codec outputs are configurable

**Invariant:** By default, a separator block is inserted between each child codec's sections. When separateSections is false, no separators are added.

_Verified by: Default separator between sections, No separator when disabled_

#### additionalFiles merge with last-wins semantics

**Invariant:** additionalFiles from all children are merged into a single record. When keys collide, the later codec's value wins.

_Verified by: Non-overlapping files merged, Colliding keys use last-wins_

#### composeDocuments works at document level without codecs

**Invariant:** composeDocuments accepts RenderableDocument array and produces a composed RenderableDocument without requiring codecs.

_Verified by: Direct document composition_

#### Empty codec outputs are handled gracefully

**Invariant:** Codecs producing empty sections arrays contribute nothing to the output. No separator is emitted for empty outputs.

_Verified by: Empty codec skipped without separator_

*composite-codec.feature*

### Content Deduplication

*Multiple sources may extract identical content, leading to*

#### Duplicate detection uses content fingerprinting

**Invariant:** Content with identical normalized text must produce identical fingerprints.

**Rationale:** Fingerprinting enables efficient duplicate detection without full text comparison.

_Verified by: Identical content produces same fingerprint, Whitespace differences are normalized, Different content produces different fingerprints, Similar headers with different content are preserved, @acceptance-criteria scenarios below.

    Content fingerprints are computed from normalized text, ignoring whitespace
    differences and minor formatting variations._

#### Duplicates are merged based on source priority

**Invariant:** Higher-priority sources take precedence when merging duplicate content.

**Rationale:** TypeScript sources have richer JSDoc; feature files provide behavioral context.

_Verified by: TypeScript source takes priority over feature file, Richer content takes priority when sources equal, Source attribution is added to merged content, @acceptance-criteria scenarios below.

    The merge strategy determines which content to keep based on source file
    priority and content richness once duplicates are detected._

#### Section order is preserved after deduplication

**Invariant:** Section order matches the source mapping table order after deduplication.

**Rationale:** Predictable ordering ensures consistent documentation structure.

_Verified by: Original order maintained after dedup, Empty sections after dedup are removed, @acceptance-criteria scenarios below.

    The order of sections in the source mapping table is preserved even
    after duplicates are removed._

#### Deduplicator integrates with source mapper pipeline

**Invariant:** Deduplication runs after extraction and before document assembly.

**Rationale:** All content must be extracted before duplicates can be identified.

_Verified by: Deduplication happens in pipeline, @acceptance-criteria scenarios below.

    The deduplicator is called after all extractions complete but before
    the RenderableDocument is assembled._

*content-deduplication.feature*

### Convention Extractor

*Extracts convention content from MasterDataset decision records*

#### Empty and missing inputs produce empty results

_Verified by: Empty convention tags returns empty array, No matching patterns returns empty array_

#### Convention bundles are extracted from matching patterns

_Verified by: Single pattern with one convention tag produces one bundle, Pattern with CSV conventions contributes to multiple bundles, Multiple patterns with same convention merge into one bundle_

#### Structured content is extracted from rule descriptions

_Verified by: Invariant and rationale are extracted from rule description, Tables in rule descriptions are extracted as structured data_

#### Code examples in rule descriptions are preserved

_Verified by: Mermaid diagram in rule description is extracted as code example, Rule description without code examples has no code examples field_

#### TypeScript JSDoc conventions are extracted alongside Gherkin

_Verified by: TypeScript pattern with heading sections produces multiple rules, TypeScript pattern without headings becomes single rule, TypeScript and Gherkin conventions merge in same bundle, TypeScript pattern with convention but empty description, TypeScript description with tables is extracted correctly, TypeScript description with code examples_

*convention-extractor.feature*

### Decision Doc Codec

*Validates the Decision Doc Codec that parses decision documents (ADR/PDR*

#### Rule blocks are partitioned by semantic prefix

Decision documents use Rule: blocks with semantic prefixes to organize
    content into Context, Decision, and Consequences sections (standard ADR
    format).

_Verified by: Partition rules into ADR sections, Non-standard rules go to other category_

#### DocStrings are extracted with language tags

Decision documents contain code examples as Gherkin DocStrings.

_Verified by: Extract single DocString, Extract multiple DocStrings, DocString without language defaults to text_

#### Source mapping tables are parsed from rule descriptions

Decision documents define source mappings in markdown tables.

_Verified by: Parse basic source mapping table, No source mapping returns empty_

#### Self-reference markers are correctly detected

Source files can reference the current decision document using special
    markers like "THIS DECISION", "THIS DECISION (Rule: X)", etc.

_Verified by: Detect THIS DECISION marker, Detect THIS DECISION with Rule, Regular file path is not self-reference, Parse self-reference types, Parse self-reference with rule name_

#### Extraction methods are normalized to known types

The extraction method column can be written in various formats.

_Verified by: Normalize Decision rule description, Normalize extract-shapes, Normalize unknown method_

#### Complete decision documents are parsed with all content

The parseDecisionDocument function extracts all content from an ADR/PDR.

_Verified by: Parse complete decision document_

#### Rules can be found by name with partial matching

Self-references may not have an exact rule name match.

_Verified by: Find rule by exact name, Find rule by partial name, Rule not found returns undefined_

*decision-doc-codec.feature*

### Decision Doc Generator

*The Decision Doc Generator orchestrates the full documentation generation*

#### Output paths are determined from pattern metadata

The generator computes output paths based on pattern name and optional
    section configuration.

_Verified by: Default output paths for pattern, Custom section for compact output, CamelCase pattern converted to kebab-case_

#### Compact output includes only essential content

Summary/compact output is limited to ~50 lines and includes only
    essential tables and type definitions for Claude context files.

_Verified by: Compact output excludes full descriptions, Compact output includes type shapes, Compact output handles empty content_

#### Detailed output includes full content

Detailed output is ~300 lines and includes everything: JSDoc, examples,
    full descriptions, and all extracted content.

_Verified by: Detailed output includes all sections, Detailed output includes consequences, Detailed output includes DocStrings as code blocks_

#### Multi-level generation produces both outputs

The generator can produce both compact and detailed outputs in a single
    pass for maximum utility.

_Verified by: Generate both compact and detailed outputs, Pattern name falls back to pattern.name_

#### Generator is registered with the registry

The generator is available in the registry under the name "doc-from-decision"
    and can be invoked through the standard generator interface.

_Verified by: Generator is registered with correct name, Generator filters patterns by source mapping presence, Generator processes patterns with source mappings_

#### Source mappings are executed during generation

Decision documents with source mapping tables trigger content aggregation
    from the referenced files during the generation process.

_Verified by: Source mappings are executed, Missing source files are reported as validation errors_

*decision-doc-generator.feature*

### Dedent Helper

*- DocStrings in Gherkin files have consistent indentation for alignment*

#### Tabs are normalized to spaces before dedent

_Verified by: Tab-indented code is properly dedented, Mixed tabs and spaces are normalized_

#### Empty lines are handled correctly

_Verified by: Empty lines with trailing spaces are preserved, All empty lines returns original text_

#### Single line input is handled

_Verified by: Single line with indentation is dedented, Single line without indentation is unchanged_

#### Unicode whitespace is handled

_Verified by: Non-breaking space is treated as content_

#### Relative indentation is preserved

_Verified by: Nested code blocks preserve relative indentation, Mixed indentation levels are preserved relatively_

*dedent.feature*

### Description Header Normalization

*Pattern descriptions should not create duplicate headers when rendered.*

#### Leading headers are stripped from pattern descriptions

_Verified by: Strip single leading markdown header, Strip multiple leading headers, Preserve description without leading header_

#### Edge cases are handled correctly

_Verified by: Empty description after stripping headers, Description with only whitespace and headers, Header in middle of description is preserved_

#### stripLeadingHeaders removes only leading headers

_Verified by: Strips h1 header, Strips h2 through h6 headers, Strips leading empty lines before header, Preserves content starting with text, Returns empty string for header-only input, Handles null/undefined input_

*description-headers.feature*

### Documentation Orchestrator

*Tests the orchestrator's pattern merging, conflict detection, and generator*

#### Orchestrator coordinates full documentation generation pipeline

_Verified by: Non-overlapping patterns merge successfully, Orchestrator detects pattern name conflicts, Orchestrator detects pattern name conflicts with status mismatch, Unknown generator name fails gracefully, Partial success when some generators are invalid_

*orchestrator.feature*

### Extract Summary

*The extractSummary function transforms multi-line pattern descriptions into*

#### Single-line descriptions are returned as-is when complete

_Verified by: Complete sentence on single line, Single line without sentence ending gets ellipsis_

#### Multi-line descriptions are combined until sentence ending

_Verified by: Two lines combine into complete sentence, Combines lines up to sentence boundary within limit, Long multi-line text truncates when exceeds limit, Multi-line without sentence ending gets ellipsis_

#### Long descriptions are truncated at sentence or word boundaries

_Verified by: Long text truncates at sentence boundary within limit, Long text without sentence boundary truncates at word with ellipsis_

#### Tautological and header lines are skipped

_Verified by: Skips pattern name as first line, Skips section header labels, Skips multiple header patterns_

#### Edge cases are handled gracefully

_Verified by: Empty description returns empty string, Markdown headers are stripped, Bold markdown is stripped, Multiple sentence endings - takes first complete sentence, Question mark as sentence ending_

*extract-summary.feature*

### Generator Registry

*Tests the GeneratorRegistry registration, lookup, and listing capabilities.*

#### Registry manages generator registration and retrieval

_Verified by: Register generator with unique name, Duplicate registration throws error, Get registered generator, Get unknown generator returns undefined, Available returns sorted list_

*registry.feature*

### Implementation Link Path Normalization

*Links to implementation files in generated pattern documents should have*

#### Repository prefixes are stripped from implementation paths

_Verified by: Strip libar-platform prefix from implementation paths, Strip monorepo prefix from implementation paths, Preserve paths without repository prefix_

#### All implementation links in a pattern are normalized

_Verified by: Multiple implementations with mixed prefixes_

#### normalizeImplPath strips known prefixes

_Verified by: Strips libar-platform/ prefix, Strips monorepo/ prefix, Returns unchanged path without known prefix, Only strips prefix at start of path_

*implementation-links.feature*

### Layered Diagram Generation

*As a documentation generator*

#### Layered diagrams group patterns by arch-layer

Patterns with arch-layer are grouped into Mermaid subgraphs.

_Verified by: Generate subgraphs for each layer_

#### Layer order is domain to infrastructure (top to bottom)

The layer subgraphs are rendered in Clean Architecture order:
    domain at top, then application, then infrastructure at bottom.

_Verified by: Layers render in correct order_

#### Context labels included in layered diagram nodes

Unlike component diagrams which group by context, layered diagrams
    include the context as a label in each node name.

_Verified by: Nodes include context labels_

#### Patterns without layer go to Other subgraph

Patterns that have arch-role or arch-context but no arch-layer
    are grouped into an "Other" subgraph.

_Verified by: Unlayered patterns in Other subgraph_

#### Layered diagram includes summary section

The generated document starts with an overview section
    specific to layered architecture visualization.

_Verified by: Summary section for layered view_

*layered-diagram.feature*

### Mermaid Relationship Rendering

*Tests for rendering all relationship types in Mermaid dependency graphs*

#### Each relationship type has a distinct arrow style

_Verified by: Uses relationships render as solid arrows, Depends-on relationships render as dashed arrows, Implements relationships render as dotted arrows, Extends relationships render as solid open arrows_

#### Pattern names are sanitized for Mermaid node IDs

_Verified by: Special characters are replaced_

#### All relationship types appear in single graph

_Verified by: Complete dependency graph with all relationship types_

*mermaid-rendering.feature*

### Planning Codec

*- Need to generate planning checklists, session plans, and findings documents from patterns*

#### PlanningChecklistCodec prepares for implementation sessions

_Verified by: No actionable phases produces empty message, Summary shows phases to plan count, Pre-planning questions section, Definition of Done with deliverables, Acceptance criteria from scenarios, Risk assessment section, Dependency status shows met vs unmet, forActivePhases option, forNextActionable option_

#### SessionPlanCodec generates implementation plans

_Verified by: No phases to plan produces empty message, Summary shows status counts, Implementation approach from useCases, Deliverables rendering, Acceptance criteria with steps, Business rules section, statusFilter option for active only, statusFilter option for planned only_

#### SessionFindingsCodec captures retrospective discoveries

_Verified by: No findings produces empty message, Summary shows finding type counts, Gaps section, Improvements section, Risks section includes risk field, Learnings section, groupBy category option, groupBy phase option, groupBy type option, showSourcePhase option enabled, showSourcePhase option disabled_

*planning-codecs.feature*

### Poc Integration

*End-to-end integration tests that exercise the full documentation generation*

#### POC decision document is parsed correctly

_Verified by: Load actual POC decision document, Source mappings include all extraction types_

#### Self-references extract content from POC decision

_Verified by: Extract Context rule from THIS DECISION, Extract Decision rule from THIS DECISION, Extract DocStrings from THIS DECISION_

#### TypeScript shapes are extracted from real files

_Verified by: Extract shapes from types.ts, Extract shapes from decider.ts, Extract createViolation patterns from decider.ts_

#### Behavior spec content is extracted correctly

_Verified by: Extract Rule blocks from process-guard.feature, Extract Scenario Outline Examples from process-guard-linter.feature_

#### JSDoc sections are extracted from CLI files

_Verified by: Extract JSDoc from lint-process.ts_

#### All source mappings execute successfully

_Verified by: Execute all 11 source mappings from POC_

#### Compact output generates correctly

_Verified by: Generate compact output from POC, Compact output contains essential sections_

#### Detailed output generates correctly

_Verified by: Generate detailed output from POC, Detailed output contains full content_

#### Generated output matches quality expectations

_Verified by: Compact output matches target structure, Validation rules are complete in output_

*poc-integration.feature*

### Pr Changes Codec

*- Need to generate PR-specific documentation from patterns*

#### PrChangesCodec handles empty results gracefully

_Verified by: No changes when no patterns match changedFiles filter, No changes when no patterns match releaseFilter, No changes with combined filters when nothing matches_

#### PrChangesCodec generates summary with filter information

_Verified by: Summary section shows pattern counts, Summary shows release tag when releaseFilter is set, Summary shows files filter count when changedFiles is set_

#### PrChangesCodec groups changes by phase when sortBy is "phase"

_Verified by: Changes grouped by phase with default sortBy, Pattern details shown within phase groups_

#### PrChangesCodec groups changes by priority when sortBy is "priority"

_Verified by: Changes grouped by priority, Priority groups show correct patterns_

#### PrChangesCodec shows flat list when sortBy is "workflow"

_Verified by: Flat changes list with workflow sort_

#### PrChangesCodec renders pattern details with metadata and description

_Verified by: Pattern detail shows metadata table, Pattern detail shows business value when available, Pattern detail shows description_

#### PrChangesCodec renders deliverables when includeDeliverables is enabled

_Verified by: Deliverables shown when patterns have deliverables, Deliverables filtered by release when releaseFilter is set, No deliverables section when includeDeliverables is disabled_

#### PrChangesCodec renders acceptance criteria from scenarios

_Verified by: Acceptance criteria rendered when patterns have scenarios, Acceptance criteria shows scenario steps_

#### PrChangesCodec renders business rules from Gherkin Rule keyword

_Verified by: Business rules rendered when patterns have rules, Business rules show rule names and verification info_

#### PrChangesCodec generates review checklist when includeReviewChecklist is enabled

_Verified by: Review checklist generated with standard items, Review checklist includes completed patterns item when applicable, Review checklist includes active work item when applicable, Review checklist includes dependencies item when patterns have dependencies, Review checklist includes deliverables item when patterns have deliverables, No review checklist when includeReviewChecklist is disabled_

#### PrChangesCodec generates dependencies section when includeDependencies is enabled

_Verified by: Dependencies section shows depends on relationships, Dependencies section shows enables relationships, No dependencies section when patterns have no dependencies, No dependencies section when includeDependencies is disabled_

#### PrChangesCodec filters patterns by changedFiles

_Verified by: Patterns filtered by changedFiles match, changedFiles filter matches partial paths_

#### PrChangesCodec filters patterns by releaseFilter

_Verified by: Patterns filtered by release version_

#### PrChangesCodec uses OR logic for combined filters

_Verified by: Combined filters match patterns meeting either criterion, Patterns matching both criteria are not duplicated_

#### PrChangesCodec only includes active and completed patterns

_Verified by: Roadmap patterns are excluded, Deferred patterns are excluded_

*pr-changes-codec.feature*

### Pr Changes Options

*Tests the PrChangesCodec filtering capabilities for generating PR-scoped*

#### Orchestrator supports PR changes generation options

_Verified by: PR changes filters to explicit file list, PR changes filters by release version, Combined filters use OR logic_

*pr-changes-options.feature*

### Prd Implementation Section

*Tests the Implementations section rendering in pattern documents.*

#### Implementation files appear in pattern docs via @libar-docs-implements

_Verified by: Implementations section renders with file links, Implementation includes description when available_

#### Multiple implementations are listed alphabetically

_Verified by: Multiple implementations sorted by file path_

#### Patterns without implementations omit the section

_Verified by: No implementations section when none exist_

#### Implementation references use relative file links

_Verified by: Links are relative from patterns directory_

*prd-implementation-section.feature*

### Reference Codec

*Parameterized codec factory that creates reference document codecs*

#### Empty datasets produce fallback content

_Verified by: Codec with no matching content produces fallback message_

#### Convention content is rendered as sections

_Verified by: Convention rules appear as H2 headings with content, Convention tables are rendered in the document_

#### Detail level controls output density

_Verified by: Summary level omits narrative and rationale, Detailed level includes rationale and verified-by_

#### Behavior sections are rendered from category-matching patterns

_Verified by: Behavior-tagged patterns appear in a Behavior Specifications section_

#### Shape sources are extracted from matching patterns

_Verified by: Shapes appear when source file matches shapeSources glob, Summary level shows shapes as a compact table, No shapes when source file does not match glob_

#### Convention and behavior content compose in a single document

_Verified by: Both convention and behavior sections appear when data exists_

#### Composition order follows AD-5: conventions then shapes then behaviors

_Verified by: Convention headings appear before shapes before behaviors_

#### Convention code examples render as mermaid blocks

_Verified by: Convention with mermaid content produces mermaid block in output, Summary level omits convention code examples_

#### Scoped diagrams are generated from diagramScope config

_Verified by: Config with diagramScope produces mermaid block at detailed level, Neighbor patterns appear in diagram with distinct style, include filter selects patterns by include tag membership, Self-contained scope produces no Related subgraph, Multiple filter dimensions OR together, Explicit pattern names filter selects named patterns, Config without diagramScope produces no diagram section, archLayer filter selects patterns by architectural layer, archLayer and archContext compose via OR, Summary level omits scoped diagram_

#### Multiple diagram scopes produce multiple mermaid blocks

_Verified by: Config with diagramScopes array produces multiple diagrams, Diagram direction is reflected in mermaid output, Legacy diagramScope still works when diagramScopes is absent_

#### Standard detail level includes narrative but omits rationale

_Verified by: Standard level includes narrative but omits rationale_

#### Deep behavior rendering with structured annotations

_Verified by: Detailed level renders structured behavior rules, Standard level renders behavior rules without rationale, Summary level shows behavior rules as truncated table, Scenario names and verifiedBy merge as deduplicated list_

#### Shape JSDoc prose renders at standard and detailed levels

_Verified by: Standard level includes JSDoc in code blocks, Detailed level includes JSDoc in code block and property table, Shapes without JSDoc render code blocks only_

#### Shape sections render param returns and throws documentation

_Verified by: Detailed level renders param table for function shapes, Detailed level renders returns and throws documentation, Standard level renders param table without throws, Shapes without param docs skip param table_

#### Diagram type controls Mermaid output format

**Invariant:** The diagramType field on DiagramScope selects the Mermaid output format. Supported types are graph (flowchart, default), sequenceDiagram, and stateDiagram-v2. Each type produces syntactically valid Mermaid output with type-appropriate node and edge rendering.

**Rationale:** Flowcharts cannot naturally express event flows (sequence), FSM visualization (state), or temporal ordering. Multiple diagram types unlock richer architectural documentation from the same relationship data.

_Verified by: Default diagramType produces flowchart, Sequence diagram renders participant-message format, State diagram renders state transitions, Sequence diagram includes neighbor patterns as participants, State diagram adds start and end pseudo-states, C4 diagram renders system boundary format, C4 diagram renders neighbor patterns as external systems, Class diagram renders class members and relationships, Class diagram renders archRole as stereotype_

#### Edge labels and custom node shapes enrich diagram readability

**Invariant:** Relationship edges display labels describing the relationship type (uses, depends on, implements, extends). Edge labels are enabled by default and can be disabled via showEdgeLabels false. Node shapes in flowchart diagrams vary by archRole value using Mermaid shape syntax.

**Rationale:** Unlabeled edges are ambiguous without consulting a legend. Custom node shapes make archRole visually distinguishable without color reliance, improving accessibility and scanability.

_Verified by: Relationship edges display type labels by default, Edge labels can be disabled for compact diagrams, archRole controls Mermaid node shape, Pattern without archRole uses default rectangle shape, Edge labels appear by default, Edge labels can be disabled, archRole controls node shape, Unknown archRole falls back to rectangle_

#### Collapsible blocks wrap behavior rules for progressive disclosure

**Invariant:** When a behavior pattern has 3 or more rules and detail level is not summary, each rule's content is wrapped in a collapsible block with the rule name and scenario count in the summary. Patterns with fewer than 3 rules render rules flat. Summary level never produces collapsible blocks.

**Rationale:** Behavior sections with many rules produce substantial content at detailed level. Collapsible blocks enable progressive disclosure so readers can expand only the rules they need.

_Verified by: Behavior pattern with many rules uses collapsible blocks at detailed level, Behavior pattern with few rules does not use collapsible blocks, Summary level never produces collapsible blocks, Many rules use collapsible at detailed level, Few rules render flat, Summary level suppresses collapsible_

#### Link-out blocks provide source file cross-references

**Invariant:** At standard and detailed levels, each behavior pattern includes a link-out block referencing its source file path. At summary level, link-out blocks are omitted for compact output.

**Rationale:** Cross-reference links enable readers to navigate from generated documentation to the annotated source files, closing the loop between generated docs and the single source of truth.

_Verified by: Behavior pattern includes source file link-out at detailed level, Standard level includes source file link-out, Summary level omits link-out blocks, Detailed level includes source link-out, Standard level includes source link-out, Summary level omits link-out_

#### Include tags route cross-cutting content into reference documents

**Invariant:** Patterns with matching include tags appear alongside category-selected patterns in the behavior section. The merging is additive (OR semantics).

_Verified by: Include-tagged pattern appears in behavior section, Include-tagged pattern is additive with category-selected patterns, Pattern without matching include tag is excluded_

*reference-codec.feature*

### Reference Generator

*Registers reference document generators from project config.*

#### Registration produces the correct number of generators

_Verified by: Generators are registered from configs plus meta-generators_

#### Product area configs produce a separate meta-generator

_Verified by: Product area meta-generator is registered_

#### Generator naming follows kebab-case convention

_Verified by: Detailed generator has name ending in "-reference", Summary generator has name ending in "-reference-claude"_

#### Generator execution produces markdown output

_Verified by: Product area generator with matching data produces non-empty output, Product area generator with no patterns still produces intro_

*reference-generators.feature*

### Remaining Work Summary Accuracy

*Summary totals in REMAINING-WORK.md must match the sum of phase table rows.*

#### Summary totals equal sum of phase table rows

_Verified by: Summary matches phase table with all patterns having phases, Summary includes completed patterns correctly_

#### Patterns without phases appear in Backlog row

_Verified by: Summary includes backlog patterns without phase, All patterns in backlog when none have phases_

#### Patterns without patternName are counted using id

_Verified by: Patterns with undefined patternName counted correctly, Mixed patterns with and without patternName_

#### All phases with incomplete patterns are shown

_Verified by: Multiple phases shown in order, Completed phases not shown in remaining work_

*remaining-work-totals.feature*

### Reporting Codec

*- Need to generate changelog, traceability, and overview documents*

#### ChangelogCodec follows Keep a Changelog format

_Verified by: Decode empty dataset produces changelog header only, Unreleased section shows active and vNEXT patterns, Release sections sorted by semver descending, Quarter fallback for patterns without release, Earlier section for undated patterns, Category mapping to change types, Exclude unreleased when option disabled, Change type sections follow standard order_

#### TraceabilityCodec maps timeline patterns to behavior tests

_Verified by: No timeline patterns produces empty message, Coverage statistics show totals and percentage, Coverage gaps table shows missing coverage, Covered phases in collapsible section, Exclude gaps when option disabled, Exclude stats when option disabled, Exclude covered when option disabled, Verified behavior files indicated in output_

#### OverviewCodec provides project architecture summary

_Verified by: Decode empty dataset produces minimal overview, Architecture section from overview-tagged patterns, Patterns summary with progress bar, Timeline summary with phase counts, Exclude architecture when option disabled, Exclude patterns summary when option disabled, Exclude timeline summary when option disabled, Multiple overview patterns create multiple architecture subsections_

*reporting-codecs.feature*

### Requirements Adr Codec

*- Need to generate product requirements documents with flexible groupings*

#### RequirementsDocumentCodec generates PRD-style documentation from patterns

_Verified by: No patterns with PRD metadata produces empty message, Summary shows counts and groupings, By product area section groups patterns correctly, By user role section uses collapsible groups, Group by phase option changes primary grouping, Filter by status option limits patterns, All features table shows complete list, Business value rendering when enabled, Generate individual requirement detail files when enabled, Requirement detail file contains acceptance criteria from scenarios, Requirement detail file contains business rules section, Implementation links from relationshipIndex_

#### AdrDocumentCodec documents architecture decisions

_Verified by: No ADR patterns produces empty message, Summary shows status counts and categories, ADRs grouped by category, ADRs grouped by phase option, ADRs grouped by date (quarter) option, ADR index table with all decisions, ADR entries use clean text without emojis, Context, Decision, Consequences sections from Rule keywords, ADR supersedes rendering, Generate individual ADR detail files when enabled, ADR detail file contains full content_

*requirements-adr-codecs.feature*

### Robustness Integration

*Document generation pipeline needs validation, deduplication, and*

#### Validation runs before extraction in the pipeline

**Invariant:** Validation must complete and pass before extraction begins.

**Rationale:** Prevents wasted extraction work and provides clear fail-fast behavior.

_Verified by: Valid decision document generates successfully, Invalid mapping halts pipeline before extraction, Multiple validation errors are reported together, @acceptance-criteria scenarios below.

    The validation layer must run first and halt the pipeline if errors
    are found, preventing wasted extraction work._

#### Deduplication runs after extraction before assembly

**Invariant:** Deduplication processes all extracted content before document assembly.

**Rationale:** All sources must be extracted to identify cross-source duplicates.

_Verified by: Duplicate content is removed from final output, Non-duplicate sections are preserved, @acceptance-criteria scenarios below.

    Content from all sources is extracted first, then deduplicated, then assembled into the final document._

#### Warnings from all stages are collected and reported

**Invariant:** Warnings from all pipeline stages are aggregated in the result.

**Rationale:** Users need visibility into non-fatal issues without blocking generation.

_Verified by: Warnings are collected across pipeline stages, Warnings do not prevent successful generation, @acceptance-criteria scenarios below.

    Non-fatal issues from validation, extraction, and deduplication are
    collected and included in the result._

#### Pipeline provides actionable error messages

**Invariant:** Error messages include context and fix suggestions.

**Rationale:** Users should fix issues in one iteration without guessing.

_Verified by: File not found error includes fix suggestion, Invalid method error includes valid alternatives, Extraction error includes source context, @acceptance-criteria scenarios below.

    Errors include enough context for users to understand and fix the issue._

#### Existing decision documents continue to work

**Invariant:** Valid existing decision documents generate without new errors.

**Rationale:** Robustness improvements must be backward compatible.

_Verified by: PoC decision document still generates, Process Guard decision document still generates, @acceptance-criteria scenarios below.

    The robustness improvements must not break existing valid decision
    documents that worked with the PoC._

*robustness-integration.feature*

### Rule Keyword Po C

*This feature tests whether vitest-cucumber supports the Rule keyword*

#### Basic arithmetic operations work correctly

The calculator should perform standard math operations
    with correct results.

_Verified by: Addition of two positive numbers, Subtraction of two numbers_

#### Division has special constraints

Division by zero must be handled gracefully to prevent
    system errors.

_Verified by: Division of two numbers, Division by zero is prevented_

*rule-keyword-poc.feature*

### Session Codec

*- Need to generate session context and remaining work documents from patterns*

#### SessionContextCodec provides working context for AI sessions

_Verified by: Decode empty dataset produces minimal session context, Decode dataset with timeline patterns, Session status shows current focus, Phase navigation for incomplete phases, Active work grouped by phase, Blocked items section with dependencies, No blocked items section when disabled, Recent completions collapsible, Generate session phase detail files when enabled, No detail files when disabled_

#### RemainingWorkCodec aggregates incomplete work by phase

_Verified by: All work complete produces celebration message, Summary shows remaining counts, Phase navigation with remaining count, By priority shows ready vs blocked, Next actionable items section, Next actionable respects maxNextActionable limit, Sort by phase option, Sort by priority option, Generate remaining work detail files when enabled, No detail files when disabled for remaining_

*session-codecs.feature*

### Shape Matcher

*Matches file paths against glob patterns for TypeScript shape extraction.*

#### Exact paths match without wildcards

_Verified by: Exact path matches identical path, Exact path does not match different path_

#### Single-level globs match one directory level

_Verified by: Single glob matches file in target directory, Single glob does not match nested subdirectory, Single glob does not match wrong extension_

#### Recursive globs match any depth

_Verified by: Recursive glob matches file at target depth, Recursive glob matches file at deeper depth, Recursive glob matches file at top level, Recursive glob does not match wrong prefix_

#### Dataset shape extraction deduplicates by name

_Verified by: Shapes are extracted from matching patterns, Duplicate shape names are deduplicated, No shapes returned when glob does not match_

*shape-matcher.feature*

### Shape Selector

*Tests the filterShapesBySelectors function that provides fine-grained*

#### Reference doc configs select shapes via shapeSelectors

**Invariant:** shapeSelectors provides three selection modes: by source path + specific names, by group tag, or by source path alone.

_Verified by: Select specific shapes by source and names, Select all shapes in a group, Select all tagged shapes from a source file, shapeSources without shapeSelectors returns all shapes, Select by source and names, Select by group, Select by source alone, shapeSources backward compatibility preserved_

*shape-selector.feature*

### Source Mapper

*The Source Mapper aggregates content from multiple source files based on*

#### Extraction methods dispatch to correct handlers

The source mapper dispatches to different extraction functions based on
    the extraction method specified in the source mapping table.

_Verified by: Dispatch to decision extraction for THIS DECISION, Dispatch to TypeScript extractor for .ts files, Dispatch to behavior spec extractor for .feature files_

#### Self-references extract from current decision document

THIS DECISION markers extract content from the current decision document
    rather than requiring a separate file path.

_Verified by: Extract from THIS DECISION using rule description, Extract DocStrings from THIS DECISION, Extract full document from THIS DECISION_

#### Multiple sources are aggregated in mapping order

Multiple source mappings result in content extraction from each file.

_Verified by: Aggregate from multiple sources, Ordering is preserved from mapping table_

#### Missing files produce warnings without failing

A referenced source file that does not exist produces a warning,
    but generation continues with available sources.

_Verified by: Missing source file produces warning, Partial extraction when some files missing, Validation checks all files before extraction_

#### Empty extraction results produce info warnings

Extraction that succeeds but produces no content (e.g., no shapes found)
    results in an informational warning being logged.

_Verified by: Empty shapes extraction produces info warning, No matching rules produces info warning_

#### Extraction methods are normalized for dispatch

The extraction method column can be written in various formats
    and is normalized before dispatch.

_Verified by: Normalize various extraction method formats, Unknown extraction method produces warning_

*source-mapper.feature*

### Source Mapping Validator

*Source mappings reference files that may not exist, use invalid*

#### Source files must exist and be readable

**Invariant:** All source file paths in mappings must resolve to existing, readable files.

**Rationale:** Prevents extraction failures and provides clear error messages upfront.

_Verified by: Existing file passes validation, Missing file produces error with path, Directory instead of file produces error, THIS DECISION skips file validation, THIS DECISION with rule reference skips file validation, @acceptance-criteria scenarios below._

#### Extraction methods must be valid and supported

**Invariant:** Extraction methods must match a known method from the supported set.

**Rationale:** Invalid methods cannot extract content; suggest valid alternatives.

_Verified by: Valid extraction methods pass validation, Unknown method produces error with suggestions, Empty method produces error, Method aliases are normalized, @acceptance-criteria scenarios below._

#### Extraction methods must be compatible with file types

**Invariant:** Method-file combinations must be compatible (e.g., TypeScript methods for .ts files).

**Rationale:** Incompatible combinations fail at extraction; catch early with clear guidance.

_Verified by: TypeScript method on feature file produces error, Gherkin method on TypeScript file produces error, Compatible method-file combination passes, Self-reference method on actual file produces error, @acceptance-criteria scenarios below._

#### Source mapping tables must have required columns

**Invariant:** Tables must contain Section, Source File, and Extraction Method columns.

**Rationale:** Missing columns prevent extraction; alternative column names are mapped.

_Verified by: Missing Section column produces error, Missing Source File column produces error, Alternative column names are accepted, @acceptance-criteria scenarios below._

#### All validation errors are collected and returned together

**Invariant:** Validation collects all errors before returning, not just the first.

**Rationale:** Enables users to fix all issues in a single iteration.

_Verified by: Multiple errors are aggregated, Warnings are collected alongside errors, @acceptance-criteria scenarios below._

*source-mapping-validator.feature*

### Table Extraction

*Tables in business rule descriptions should appear exactly once in output.*

#### Tables in rule descriptions render exactly once

_Verified by: Single table renders once in detailed mode, Table is extracted and properly formatted_

#### Multiple tables in description each render exactly once

_Verified by: Two tables in description render as two separate tables_

#### stripMarkdownTables removes table syntax from text

_Verified by: Strips single table from text, Strips multiple tables from text, Preserves text without tables_

*table-extraction.feature*

### Taxonomy Codec

*Validates the Taxonomy Codec that transforms MasterDataset into a*

#### Document metadata is correctly set

The taxonomy document has standard metadata fields for title, purpose,
    and detail level that describe the generated content.

_Verified by: Document title is Taxonomy Reference, Document purpose describes tag taxonomy, Detail level reflects generateDetailFiles option_

#### Categories section is generated from TagRegistry

The categories section lists all configured tag categories with their
    domain, priority, and description in a sortable table.

_Verified by: Categories section is included in output, Category table has correct columns, LinkOut to detail file when generateDetailFiles enabled_

#### Metadata tags can be grouped by domain

The groupByDomain option organizes metadata tags into subsections
    by their semantic domain (Core, Relationship, Timeline, etc.).

_Verified by: With groupByDomain enabled tags are grouped into subsections, With groupByDomain disabled single table rendered_

#### Tags are classified into domains by hardcoded mapping

The domain classification is intentionally hardcoded for documentation
    stability.

_Verified by: Core tags correctly classified, Relationship tags correctly classified, Timeline tags correctly classified, ADR prefix matching works, Unknown tags go to Other Tags group_

#### Optional sections can be disabled via codec options

The codec supports disabling format types, presets, and architecture
    diagram sections for compact output generation.

_Verified by: includeFormatTypes disabled excludes Format Types section, includePresets disabled excludes Presets section, includeArchDiagram disabled excludes Architecture section_

#### Detail files are generated for progressive disclosure

The generateDetailFiles option creates additional files for
    categories, metadata tags, and format types with detailed content.

_Verified by: generateDetailFiles creates 3 additional files, Detail files have correct paths, generateDetailFiles disabled creates no additional files_

#### Format types are documented with descriptions and examples

The Format Types section documents all supported tag value formats
    with descriptions and examples for each type.

_Verified by: All 6 format types are documented_

*taxonomy-codec.feature*

### Timeline Codec

*- Need to generate roadmap, milestones, and current work documents from patterns*

#### RoadmapDocumentCodec groups patterns by phase with progress tracking

_Verified by: Decode empty dataset produces minimal roadmap, Decode dataset with multiple phases, Progress section shows correct status counts, Phase navigation table with progress, Phase sections show pattern tables, Generate phase detail files when enabled, No detail files when disabled, Quarterly timeline shown when quarters exist_

#### CompletedMilestonesCodec shows only completed patterns grouped by quarter

_Verified by: No completed patterns produces empty message, Summary shows completed counts, Quarterly navigation with completed patterns, Completed phases shown in collapsible sections, Recent completions section with limit, Generate quarterly detail files when enabled_

#### CurrentWorkCodec shows only active patterns with deliverables

_Verified by: No active work produces empty message, Summary shows overall progress, Active phases with progress bars, Deliverables rendered when configured, All active patterns table, Generate current work detail files when enabled_

*timeline-codecs.feature*

### Validation Rules Codec

*Validates the Validation Rules Codec that transforms MasterDataset into a*

#### Document metadata is correctly set

The validation rules document has standard metadata fields for title,
    purpose, and detail level.

_Verified by: Document title is Validation Rules, Document purpose describes Process Guard, Detail level reflects generateDetailFiles option_

#### All validation rules are documented in a table

The rules table includes all 6 Process Guard validation rules with
    their severity levels and descriptions.

_Verified by: All 6 rules appear in table, Rules have correct severity levels_

#### FSM state diagram is generated from transitions

The Mermaid diagram shows all valid state transitions for the
    Process Guard FSM.

_Verified by: Mermaid diagram generated when includeFSMDiagram enabled, Diagram includes all 4 states, FSM diagram excluded when includeFSMDiagram disabled_

#### Protection level matrix shows status protections

The protection matrix documents which statuses have which protection
    levels (none, scope-locked, hard-locked).

_Verified by: Matrix shows all 4 statuses with protection levels, Protection matrix excluded when includeProtectionMatrix disabled_

#### CLI usage is documented with options and exit codes

The CLI section shows how to invoke the Process Guard linter
    with various options.

_Verified by: CLI example code block included, All 6 CLI options documented, Exit codes documented, CLI section excluded when includeCLIUsage disabled_

#### Escape hatches are documented for special cases

The escape hatches section documents how to override Process Guard
    validation for legitimate use cases.

_Verified by: All 3 escape hatches documented, Escape hatches section excluded when includeEscapeHatches disabled_

*validation-rules-codec.feature*

### Warning Collector

*The warning collector provides a unified system for capturing, categorizing,*

#### Warnings are captured with source context

Each warning includes the source location, category, and message to
    enable debugging and targeted fixes.

_Verified by: Warning includes source file, Warning includes line number when available, Warning includes category_

#### Warnings are categorized for filtering and grouping

Warning categories enable filtering by severity, source, or type
    for different reporting needs.

_Verified by: Warning categories are supported, Warnings can be filtered by category, Warnings can be filtered by source file_

#### Warnings are aggregated across the pipeline

The collector aggregates warnings from all pipeline stages, maintaining
    insertion order and source attribution.

_Verified by: Warnings from multiple stages are collected, Warnings are grouped by source file, Summary counts by category_

#### Warnings integrate with the Result pattern

The warning collector integrates with Result<T, E> to include warnings
    in successful results, enabling callers to inspect non-fatal issues.

_Verified by: Successful result includes warnings, Failed result includes warnings collected before failure, Warnings propagate through pipeline_

#### Warnings can be formatted for different outputs

The collector provides formatters for console output, JSON, and
    markdown to support different reporting needs.

_Verified by: Console format includes color and location, JSON format is machine-readable, Markdown format for documentation_

#### Existing console.warn calls are migrated to collector

All console.warn calls in the source mapper and related modules
    are replaced with warning collector calls.

_Verified by: Source mapper uses warning collector, Shape extractor uses warning collector_

*warning-collector.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
