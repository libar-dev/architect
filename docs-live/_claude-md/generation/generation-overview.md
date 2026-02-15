=== GENERATION OVERVIEW ===

Purpose: Generation product area overview
Detail Level: Compact summary

**How does code become docs?** The generation pipeline transforms annotated source code into markdown documents. It follows a four-stage architecture: Scanner → Extractor → Transformer → Codec. Codecs are pure functions — given a MasterDataset, they produce a RenderableDocument without side effects. CompositeCodec composes multiple codecs into a single document.

=== KEY INVARIANTS ===

- Codec purity: Every codec is a pure function (dataset in, document out). No side effects, no filesystem access. Same input always produces same output
- Config-driven generation: A single `ReferenceDocConfig` produces a complete document. Content sources compose in fixed order: conventions, diagrams, shapes, behaviors
- RenderableDocument IR: Codecs express intent ("this is a table"), the renderer handles syntax ("pipe-delimited markdown"). Switching output format requires only a new renderer

=== API TYPES ===

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

=== BEHAVIOR SPECIFICATIONS ===

--- TestContentBlocks ---

| Rule                                                 | Description                                                                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Business rules appear as a separate section          | Rule descriptions provide context for why this business rule exists.<br> You can include multiple paragraphs here.... |
| Multiple rules create multiple Business Rule entries | Each Rule keyword creates a separate entry in the Business Rules section.<br> This helps organize complex features... |

--- RuleKeywordPoC ---

| Rule                                       | Description                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| Basic arithmetic operations work correctly | The calculator should perform standard math operations<br> with correct results. |
| Division has special constraints           | Division by zero must be handled gracefully to prevent<br> system errors.        |

--- TableExtraction ---

| Rule                                                    | Description |
| ------------------------------------------------------- | ----------- |
| Tables in rule descriptions render exactly once         |             |
| Multiple tables in description each render exactly once |             |
| stripMarkdownTables removes table syntax from text      |             |

--- GeneratorRegistryTesting ---

| Rule                                                  | Description |
| ----------------------------------------------------- | ----------- |
| Registry manages generator registration and retrieval |             |

--- PrdImplementationSectionTesting ---

| Rule                                                                   | Description |
| ---------------------------------------------------------------------- | ----------- |
| Implementation files appear in pattern docs via @libar-docs-implements |             |
| Multiple implementations are listed alphabetically                     |             |
| Patterns without implementations omit the section                      |             |
| Implementation references use relative file links                      |             |

--- PrChangesOptions ---

| Rule                                                | Description |
| --------------------------------------------------- | ----------- |
| Orchestrator supports PR changes generation options |             |

--- DocumentationOrchestrator ---

| Rule                                                            | Description                                                                                                       |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Orchestrator coordinates full documentation generation pipeline | **Invariant:** Non-overlapping patterns from TypeScript and Gherkin sources must merge into a unified dataset;... |

--- CodecBasedGeneratorTesting ---

| Rule                                                     | Description |
| -------------------------------------------------------- | ----------- |
| CodecBasedGenerator adapts codecs to generator interface |             |

--- BusinessRulesDocumentCodec ---

| Rule                                                           | Description |
| -------------------------------------------------------------- | ----------- |
| Extracts Rule blocks with Invariant and Rationale              |             |
| Organizes rules by product area and phase                      |             |
| Summary mode generates compact output                          |             |
| Preserves code examples and tables in detailed mode            |             |
| Generates scenario traceability links                          |             |
| Progressive disclosure generates detail files per product area |             |
| Empty rules show placeholder instead of blank content          |             |
| Rules always render flat for full visibility                   |             |
| Source file shown as filename text                             |             |
| Verified-by renders as checkbox list at standard level         |             |
| Feature names are humanized from camelCase pattern names       |             |

--- WarningCollectorTesting ---

| Rule                                                  | Description                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Warnings are captured with source context             | **Invariant:** Each captured warning must include the source file path, optional line number, and category for...       |
| Warnings are categorized for filtering and grouping   | **Invariant:** Warnings must support multiple categories and be filterable by both category and source file....         |
| Warnings are aggregated across the pipeline           | **Invariant:** Warnings from multiple pipeline stages must be collected into a single aggregated view, groupable by...  |
| Warnings integrate with the Result pattern            | **Invariant:** Warnings must propagate through the Result monad, being preserved in both successful and failed...       |
| Warnings can be formatted for different outputs       | **Invariant:** Warnings must be formattable as colored console output, machine-readable JSON, and markdown for...       |
| Existing console.warn calls are migrated to collector | **Invariant:** Pipeline components (source mapper, shape extractor) must use the warning collector instead of direct... |

--- ValidationRulesCodecTesting ---

| Rule                                                | Description                                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Document metadata is correctly set                  | **Invariant:** The validation rules document must have the title "Validation Rules", a purpose describing Process...     |
| All validation rules are documented in a table      | **Invariant:** All 6 Process Guard validation rules must appear in the rules table with their correct severity levels... |
| FSM state diagram is generated from transitions     | **Invariant:** When includeFSMDiagram is enabled, a Mermaid state diagram showing all 4 FSM states and their...          |
| Protection level matrix shows status protections    | **Invariant:** When includeProtectionMatrix is enabled, a matrix showing all 4 statuses with their protection levels...  |
| CLI usage is documented with options and exit codes | **Invariant:** When includeCLIUsage is enabled, the document must include CLI example code, all 6 options, and exit...   |
| Escape hatches are documented for special cases     | **Invariant:** When includeEscapeHatches is enabled, all 3 escape hatch mechanisms must be documented; when disabled,... |

--- TaxonomyCodecTesting ---

| Rule                                                       | Description                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Document metadata is correctly set                         | **Invariant:** The taxonomy document must have the title "Taxonomy Reference", a descriptive purpose string, and a...   |
| Categories section is generated from TagRegistry           | **Invariant:** The categories section must render all categories from the configured TagRegistry as a table, with...    |
| Metadata tags can be grouped by domain                     | **Invariant:** When groupByDomain is enabled, metadata tags must be organized into domain-specific subsections; when... |
| Tags are classified into domains by hardcoded mapping      | **Invariant:** Tags must be classified into domains (Core, Relationship, Timeline, etc.) using a hardcoded mapping,...  |
| Optional sections can be disabled via codec options        | **Invariant:** Format Types, Presets, and Architecture sections must each be independently disableable via their...     |
| Detail files are generated for progressive disclosure      | **Invariant:** When generateDetailFiles is enabled, the codec must produce additional detail files (one per domain...   |
| Format types are documented with descriptions and examples | **Invariant:** All 6 format types must be documented with descriptions and usage examples in the generated taxonomy.... |

--- SourceMappingValidatorTesting ---

| Rule                                                      | Description                                                                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Source files must exist and be readable                   | **Invariant:** All source file paths in mappings must resolve to existing, readable files.<br> **Rationale:**...        |
| Extraction methods must be valid and supported            | **Invariant:** Extraction methods must match a known method from the supported set.<br> **Rationale:** Invalid...       |
| Extraction methods must be compatible with file types     | **Invariant:** Method-file combinations must be compatible (e.g., TypeScript methods for .ts files)....                 |
| Source mapping tables must have required columns          | **Invariant:** Tables must contain Section, Source File, and Extraction Method columns.<br> **Rationale:** Missing...   |
| All validation errors are collected and returned together | **Invariant:** Validation collects all errors before returning, not just the first.<br> **Rationale:** Enables users... |

--- SourceMapperTesting ---

| Rule                                                   | Description                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Extraction methods dispatch to correct handlers        | **Invariant:** Each extraction method type (self-reference, TypeScript, Gherkin) must dispatch to the correct...       |
| Self-references extract from current decision document | **Invariant:** THIS DECISION self-references must extract content from the current decision document using rule...     |
| Multiple sources are aggregated in mapping order       | **Invariant:** When multiple source mappings target the same section, their extracted content must be aggregated in... |
| Missing files produce warnings without failing         | **Invariant:** When a referenced source file does not exist, the mapper must produce a warning and continue...         |
| Empty extraction results produce info warnings         | **Invariant:** When extraction succeeds but produces empty results (no matching shapes, no matching rules), an...      |
| Extraction methods are normalized for dispatch         | **Invariant:** Extraction method strings must be normalized to canonical forms before dispatch, with unrecognized...   |

--- RobustnessIntegration ---

| Rule                                                | Description                                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Validation runs before extraction in the pipeline   | **Invariant:** Validation must complete and pass before extraction begins.<br> **Rationale:** Prevents wasted...         |
| Deduplication runs after extraction before assembly | **Invariant:** Deduplication processes all extracted content before document assembly.<br> **Rationale:** All sources... |
| Warnings from all stages are collected and reported | **Invariant:** Warnings from all pipeline stages are aggregated in the result.<br> **Rationale:** Users need...          |
| Pipeline provides actionable error messages         | **Invariant:** Error messages include context and fix suggestions.<br> **Rationale:** Users should fix issues in one...  |
| Existing decision documents continue to work        | **Invariant:** Valid existing decision documents generate without new errors.<br> **Rationale:** Robustness...           |

--- PocIntegration ---

| Rule                                              | Description                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| POC decision document is parsed correctly         | **Invariant:** The real POC decision document (Process Guard) must be parseable by the codec, extracting all source...   |
| Self-references extract content from POC decision | **Invariant:** THIS DECISION self-references in the POC document must successfully extract Context rules, Decision...    |
| TypeScript shapes are extracted from real files   | **Invariant:** The source mapper must successfully extract type shapes and patterns from real TypeScript source files... |
| Behavior spec content is extracted correctly      | **Invariant:** The source mapper must successfully extract Rule blocks and ScenarioOutline Examples from real Gherkin... |
| JSDoc sections are extracted from CLI files       | **Invariant:** The source mapper must successfully extract JSDoc comment sections from real TypeScript CLI files...      |
| All source mappings execute successfully          | **Invariant:** All source mappings defined in the POC decision document must execute without errors, producing...        |
| Compact output generates correctly                | **Invariant:** The compact output for the POC document must generate successfully and contain all essential sections...  |
| Detailed output generates correctly               | **Invariant:** The detailed output for the POC document must generate successfully and contain all sections including... |
| Generated output matches quality expectations     | **Invariant:** The generated output structure must match the expected target format, with complete validation rules...   |

--- DecisionDocGeneratorTesting ---

| Rule                                              | Description                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Output paths are determined from pattern metadata | **Invariant:** Output file paths must be derived from pattern metadata using kebab-case conversion of the pattern...    |
| Compact output includes only essential content    | **Invariant:** Compact output mode must include only essential decision content (type shapes, key constraints) while... |
| Detailed output includes full content             | **Invariant:** Detailed output mode must include all decision content including full descriptions, consequences, and... |
| Multi-level generation produces both outputs      | **Invariant:** The generator must produce both compact and detailed output files from a single generation run, using... |
| Generator is registered with the registry         | **Invariant:** The decision document generator must be registered with the generator registry under a canonical name... |
| Source mappings are executed during generation    | **Invariant:** Source mapping tables must be executed during generation to extract content from referenced files,...    |

--- DecisionDocCodecTesting ---

| Rule                                                    | Description                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Rule blocks are partitioned by semantic prefix          | **Invariant:** Decision document rules must be partitioned into ADR sections based on their semantic prefix (e.g.,...    |
| DocStrings are extracted with language tags             | **Invariant:** DocStrings within rule descriptions must be extracted preserving their language tag (e.g., typescript,... |
| Source mapping tables are parsed from rule descriptions | **Invariant:** Markdown tables in rule descriptions with source mapping columns must be parsed into structured data,...  |
| Self-reference markers are correctly detected           | **Invariant:** The "THIS DECISION" marker must be recognized as a self-reference to the current decision document,...    |
| Extraction methods are normalized to known types        | **Invariant:** Extraction method strings from source mapping tables must be normalized to canonical method names for...  |
| Complete decision documents are parsed with all content | **Invariant:** A complete decision document must be parseable into its constituent parts including rules, DocStrings,... |
| Rules can be found by name with partial matching        | **Invariant:** Rules must be findable by exact name match or partial (substring) name match, returning undefined when... |

--- ContentDeduplication ---

| Rule                                                | Description                                                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Duplicate detection uses content fingerprinting     | **Invariant:** Content with identical normalized text must produce identical fingerprints.<br> **Rationale:**...        |
| Duplicates are merged based on source priority      | **Invariant:** Higher-priority sources take precedence when merging duplicate content.<br> **Rationale:** TypeScript... |
| Section order is preserved after deduplication      | **Invariant:** Section order matches the source mapping table order after deduplication.<br> **Rationale:**...          |
| Deduplicator integrates with source mapper pipeline | **Invariant:** Deduplication runs after extraction and before document assembly.<br> **Rationale:** All content must... |

--- TransformDatasetTesting ---

| Rule                                                              | Description                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Empty dataset produces valid zero-state views                     | **Invariant:** An empty input produces a MasterDataset with all counts at zero and no groupings.<br><br> \*\*Verified... |
| Status and phase grouping creates navigable views                 | **Invariant:** Patterns are grouped by canonical status and sorted by phase number, with per-phase status counts...      |
| Quarter and category grouping organizes by timeline and domain    | **Invariant:** Patterns are grouped by quarter and category, with only patterns bearing the relevant metadata...         |
| Source grouping separates TypeScript and Gherkin origins          | **Invariant:** Patterns are partitioned by source file type, and patterns with phase metadata appear in the roadmap...   |
| Relationship index builds bidirectional dependency graph          | **Invariant:** The relationship index contains forward and reverse lookups, with reverse lookups merged and...           |
| Completion tracking computes project progress                     | **Invariant:** Completion percentage is rounded to the nearest integer, and fully-completed requires all patterns in...  |
| Workflow integration conditionally includes delivery process data | **Invariant:** The workflow is included in the MasterDataset only when provided, and phase names are resolved from...    |

--- RichContentHelpersTesting ---

| Rule                                         | Description |
| -------------------------------------------- | ----------- |
| DocString parsing handles edge cases         |             |
| DataTable rendering produces valid markdown  |             |
| Scenario content rendering respects options  |             |
| Business rule rendering handles descriptions |             |
| DocString content is dedented when parsed    |             |

--- UniversalMarkdownRenderer ---

--- RemainingWorkSummaryAccuracy ---

| Rule                                              | Description |
| ------------------------------------------------- | ----------- |
| Summary totals equal sum of phase table rows      |             |
| Patterns without phases appear in Backlog row     |             |
| Patterns without patternName are counted using id |             |
| All phases with incomplete patterns are shown     |             |

--- RemainingWorkEnhancement ---

--- PrChangesGeneration ---

--- PatternsCodecTesting ---

| Rule                                                                  | Description                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Document structure includes progress tracking and category navigation | **Invariant:** Every decoded document must contain a title, purpose, Progress section with status counts, and...         |
| Pattern table presents all patterns sorted by status then name        | **Invariant:** The pattern table must include every pattern in the dataset with columns for Pattern, Category,...        |
| Category sections group patterns by domain                            | **Invariant:** Each category in the dataset must produce an H3 section listing its patterns, and the filterCategories... |
| Dependency graph visualizes pattern relationships                     | **Invariant:** A Mermaid dependency graph must be included when pattern relationships exist and the...                   |
| Detail file generation creates per-pattern pages                      | **Invariant:** When generateDetailFiles is enabled, each pattern must produce an individual markdown file at...          |

--- ImplementationLinkPathNormalization ---

| Rule                                                       | Description |
| ---------------------------------------------------------- | ----------- |
| Repository prefixes are stripped from implementation paths |             |
| All implementation links in a pattern are normalized       |             |
| normalizeImplPath strips known prefixes                    |             |

--- ExtractSummary ---

| Rule                                                           | Description |
| -------------------------------------------------------------- | ----------- |
| Single-line descriptions are returned as-is when complete      |             |
| Multi-line descriptions are combined until sentence ending     |             |
| Long descriptions are truncated at sentence or word boundaries |             |
| Tautological and header lines are skipped                      |             |
| Edge cases are handled gracefully                              |             |

--- DescriptionQualityFoundation ---

--- DescriptionHeaderNormalization ---

| Rule                                                   | Description |
| ------------------------------------------------------ | ----------- |
| Leading headers are stripped from pattern descriptions |             |
| Edge cases are handled correctly                       |             |
| stripLeadingHeaders removes only leading headers       |             |

--- ZodCodecMigration ---

--- TimelineCodecTesting ---

| Rule                                                                      | Description                                                                                                             |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| RoadmapDocumentCodec groups patterns by phase with progress tracking      | **Invariant:** The roadmap must include overall progress with percentage, phase navigation table, and phase sections... |
| CompletedMilestonesCodec shows only completed patterns grouped by quarter | **Invariant:** Only completed patterns appear, grouped by quarter with navigation, recent completions, and...           |
| CurrentWorkCodec shows only active patterns with deliverables             | **Invariant:** Only active patterns appear with progress bars, deliverable tracking, and an all-active-patterns...      |

--- ShapeSelectorTesting ---

| Rule                                                   | Description                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Reference doc configs select shapes via shapeSelectors | **Invariant:** shapeSelectors provides three selection modes: by<br> source path + specific names, by group tag, or... |

--- ShapeMatcherTesting ---

| Rule                                          | Description |
| --------------------------------------------- | ----------- |
| Exact paths match without wildcards           |             |
| Single-level globs match one directory level  |             |
| Recursive globs match any depth               |             |
| Dataset shape extraction deduplicates by name |             |

--- SessionCodecTesting ---

| Rule                                                         | Description                                                                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| SessionContextCodec provides working context for AI sessions | **Invariant:** Session context must include session status with active/completed/remaining counts, phase navigation... |
| RemainingWorkCodec aggregates incomplete work by phase       | **Invariant:** Remaining work must show status counts, phase-grouped navigation, priority classification...            |

--- RequirementsAdrCodecTesting ---

| Rule                                                                      | Description |
| ------------------------------------------------------------------------- | ----------- |
| RequirementsDocumentCodec generates PRD-style documentation from patterns |             |
| AdrDocumentCodec documents architecture decisions                         |             |

--- ReportingCodecTesting ---

| Rule                                                       | Description                                                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ChangelogCodec follows Keep a Changelog format             | **Invariant:** Releases must be sorted by semver descending, unreleased patterns grouped under "[Unreleased]", and...  |
| TraceabilityCodec maps timeline patterns to behavior tests | **Invariant:** Coverage statistics must show total timeline phases, those with behavior tests, those missing, and a... |
| OverviewCodec provides project architecture summary        | **Invariant:** The overview must include architecture sections from overview-tagged patterns, pattern summary with...  |

--- ReferenceGeneratorTesting ---

| Rule                                                   | Description                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Registration produces the correct number of generators | **Invariant:** Each reference config produces exactly 2 generators (detailed + summary), plus meta-generators for...   |
| Product area configs produce a separate meta-generator | **Invariant:** Configs with productArea set route to "product-area-docs" meta-generator; configs without route to...   |
| Generator naming follows kebab-case convention         | **Invariant:** Detailed generators end in "-reference" and summary generators end in "-reference-claude"....           |
| Generator execution produces markdown output           | **Invariant:** Every registered generator must produce at least one non-empty output file when given matching data.... |

--- ReferenceCodecTesting ---

| Rule                                                                   | Description                                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Empty datasets produce fallback content                                |                                                                                                                          |
| Convention content is rendered as sections                             |                                                                                                                          |
| Detail level controls output density                                   |                                                                                                                          |
| Behavior sections are rendered from category-matching patterns         |                                                                                                                          |
| Shape sources are extracted from matching patterns                     |                                                                                                                          |
| Convention and behavior content compose in a single document           |                                                                                                                          |
| Composition order follows AD-5: conventions then shapes then behaviors |                                                                                                                          |
| Convention code examples render as mermaid blocks                      |                                                                                                                          |
| Scoped diagrams are generated from diagramScope config                 |                                                                                                                          |
| Multiple diagram scopes produce multiple mermaid blocks                |                                                                                                                          |
| Standard detail level includes narrative but omits rationale           |                                                                                                                          |
| Deep behavior rendering with structured annotations                    |                                                                                                                          |
| Shape JSDoc prose renders at standard and detailed levels              |                                                                                                                          |
| Shape sections render param returns and throws documentation           |                                                                                                                          |
| Diagram type controls Mermaid output format                            | **Invariant:** The diagramType field on DiagramScope selects the Mermaid<br> output format. Supported types are graph... |
| Edge labels and custom node shapes enrich diagram readability          | **Invariant:** Relationship edges display labels describing the relationship<br> type (uses, depends on, implements,...  |
| Collapsible blocks wrap behavior rules for progressive disclosure      | **Invariant:** When a behavior pattern has 3 or more rules and detail level<br> is not summary, each rule's content...   |
| Link-out blocks provide source file cross-references                   | **Invariant:** At standard and detailed levels, each behavior pattern includes<br> a link-out block referencing its...   |
| Include tags route cross-cutting content into reference documents      | **Invariant:** Patterns with matching include tags appear alongside<br> category-selected patterns in the behavior...    |

--- PrChangesCodecTesting ---

| Rule                                                                              | Description |
| --------------------------------------------------------------------------------- | ----------- |
| PrChangesCodec handles empty results gracefully                                   |             |
| PrChangesCodec generates summary with filter information                          |             |
| PrChangesCodec groups changes by phase when sortBy is "phase"                     |             |
| PrChangesCodec groups changes by priority when sortBy is "priority"               |             |
| PrChangesCodec shows flat list when sortBy is "workflow"                          |             |
| PrChangesCodec renders pattern details with metadata and description              |             |
| PrChangesCodec renders deliverables when includeDeliverables is enabled           |             |
| PrChangesCodec renders acceptance criteria from scenarios                         |             |
| PrChangesCodec renders business rules from Gherkin Rule keyword                   |             |
| PrChangesCodec generates review checklist when includeReviewChecklist is enabled  |             |
| PrChangesCodec generates dependencies section when includeDependencies is enabled |             |
| PrChangesCodec filters patterns by changedFiles                                   |             |
| PrChangesCodec filters patterns by releaseFilter                                  |             |
| PrChangesCodec uses OR logic for combined filters                                 |             |
| PrChangesCodec only includes active and completed patterns                        |             |

--- PlanningCodecTesting ---

| Rule                                                        | Description                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| PlanningChecklistCodec prepares for implementation sessions | **Invariant:** The checklist must include pre-planning questions, definition of done with deliverables, and...           |
| SessionPlanCodec generates implementation plans             | **Invariant:** The plan must include status summary, implementation approach from use cases, deliverables with...        |
| SessionFindingsCodec captures retrospective discoveries     | **Invariant:** Findings must be categorized into gaps, improvements, risks, and learnings with per-type counts in the... |

--- DedentHelper ---

| Rule                                        | Description |
| ------------------------------------------- | ----------- |
| Tabs are normalized to spaces before dedent |             |
| Empty lines are handled correctly           |             |
| Single line input is handled                |             |
| Unicode whitespace is handled               |             |
| Relative indentation is preserved           |             |

--- ConventionExtractorTesting ---

| Rule                                                         | Description |
| ------------------------------------------------------------ | ----------- |
| Empty and missing inputs produce empty results               |             |
| Convention bundles are extracted from matching patterns      |             |
| Structured content is extracted from rule descriptions       |             |
| Code examples in rule descriptions are preserved             |             |
| TypeScript JSDoc conventions are extracted alongside Gherkin |             |

--- CompositeCodecTesting ---

| Rule                                                      | Description                                                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CompositeCodec concatenates sections in codec array order | **Invariant:** Sections from child codecs appear in the composite<br> output in the same order as the codecs array.... |
| Separators between codec outputs are configurable         | **Invariant:** By default, a separator block is inserted between<br> each child codec's sections. When...              |
| additionalFiles merge with last-wins semantics            | **Invariant:** additionalFiles from all children are merged into<br> a single record. When keys collide, the later...  |
| composeDocuments works at document level without codecs   | **Invariant:** composeDocuments accepts RenderableDocument array and<br> produces a composed RenderableDocument...     |
| Empty codec outputs are handled gracefully                | **Invariant:** Codecs producing empty sections arrays contribute<br> nothing to the output. No separator is emitted... |

--- MermaidRelationshipRendering ---

| Rule                                              | Description |
| ------------------------------------------------- | ----------- |
| Each relationship type has a distinct arrow style |             |
| Pattern names are sanitized for Mermaid node IDs  |             |
| All relationship types appear in single graph     |             |

--- LayeredDiagramGeneration ---

| Rule                                                    | Description                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Layered diagrams group patterns by arch-layer           | Patterns with arch-layer are grouped into Mermaid subgraphs.<br> Each layer becomes a visual container.                  |
| Layer order is domain to infrastructure (top to bottom) | The layer subgraphs are rendered in Clean Architecture order:<br> domain at top, then application, then...               |
| Context labels included in layered diagram nodes        | Unlike component diagrams which group by context, layered diagrams<br> include the context as a label in each node name. |
| Patterns without layer go to Other subgraph             | Patterns that have arch-role or arch-context but no arch-layer<br> are grouped into an "Other" subgraph.                 |
| Layered diagram includes summary section                | The generated document starts with an overview section<br> specific to layered architecture visualization.               |

--- ArchGeneratorRegistration ---

| Rule                                                         | Description                                                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Architecture generator is registered in the registry         | The architecture generator must be registered like other built-in<br> generators so it can be invoked via CLI. |
| Architecture generator produces component diagram by default | Running the architecture generator without options produces<br> a component diagram (bounded context view).    |
| Architecture generator supports diagram type options         | The generator accepts options to specify diagram type<br> (component or layered).                              |
| Architecture generator supports context filtering            | The generator can filter to specific bounded contexts<br> for focused diagram output.                          |

--- ComponentDiagramGeneration ---

| Rule                                                    | Description                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Component diagrams group patterns by bounded context    | Patterns with arch-context are grouped into Mermaid subgraphs.<br> Each bounded context becomes a visual container. |
| Context-less patterns go to Shared Infrastructure       | Patterns without arch-context are grouped into a<br> "Shared Infrastructure" subgraph.                              |
| Relationship types render with distinct arrow styles    | Arrow styles follow UML conventions:<br> - uses: solid arrow (-->)<br> - depends-on: dashed arrow (-.->)<br> -...   |
| Arrows only connect annotated components                | Relationships pointing to non-annotated patterns<br> are not rendered (target would not exist in diagram).          |
| Component diagram includes summary section              | The generated document starts with an overview section<br> showing component counts and bounded context statistics. |
| Component diagram includes legend when enabled          | The legend explains arrow style meanings for readers.                                                               |
| Component diagram includes inventory table when enabled | The inventory lists all components with their metadata.                                                             |
| Empty architecture data shows guidance message          | If no patterns have architecture annotations,<br> the document explains how to add them.                            |

--- ArchTagExtraction ---

| Rule                                                         | Description                                                                                                             |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| arch-role tag is defined in the registry                     | Architecture roles classify components for diagram rendering.<br> Valid roles: command-handler, projection, saga,...    |
| arch-context tag is defined in the registry                  | Context tags group components into bounded context subgraphs.<br> Format is "value" (free-form string like "orders",... |
| arch-layer tag is defined in the registry                    | Layer tags enable layered architecture diagrams.<br> Valid layers: domain, application, infrastructure.                 |
| AST parser extracts arch-role from TypeScript annotations    | The AST parser must extract arch-role alongside other pattern metadata.                                                 |
| AST parser extracts arch-context from TypeScript annotations | Context values are free-form strings naming the bounded context.                                                        |
| AST parser extracts arch-layer from TypeScript annotations   | Layer tags classify components by architectural layer.                                                                  |
| AST parser handles multiple arch tags together               | Components often have role + context + layer together.                                                                  |
| Missing arch tags yield undefined values                     | Components without arch tags should have undefined (not null or empty).                                                 |

--- ArchIndexDataset ---

| Rule                                                   | Description                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| archIndex groups patterns by arch-role                 | The archIndex.byRole map groups patterns by their architectural role<br> (command-handler, projection, saga, etc.)...    |
| archIndex groups patterns by arch-context              | The archIndex.byContext map groups patterns by bounded context<br> for subgraph rendering in component diagrams.         |
| archIndex groups patterns by arch-layer                | The archIndex.byLayer map groups patterns by architectural layer<br> (domain, application, infrastructure) for...        |
| archIndex.all contains all patterns with any arch tag  | The archIndex.all array contains all patterns that have at least<br> one arch tag (role, context, or layer). Patterns... |
| Patterns without arch tags are excluded from archIndex | Patterns that have no arch-role, arch-context, or arch-layer are<br> not included in the archIndex at all.               |
