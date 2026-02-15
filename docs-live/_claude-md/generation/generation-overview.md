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

| Rule                                                    | Description                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tables in rule descriptions render exactly once         | **Invariant:** Each markdown table in a rule description appears exactly once in the rendered output, with no...        |
| Multiple tables in description each render exactly once | **Invariant:** When a rule description contains multiple markdown tables, each table renders as a separate formatted... |
| stripMarkdownTables removes table syntax from text      | **Invariant:** stripMarkdownTables removes all pipe-delimited table syntax from input text while preserving all...      |

--- GeneratorRegistryTesting ---

| Rule                                                  | Description                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Registry manages generator registration and retrieval | **Invariant:** Each generator name is unique within the registry; duplicate registration is rejected and lookup of... |

--- PrdImplementationSectionTesting ---

| Rule                                                                   | Description                                                                                                            |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Implementation files appear in pattern docs via @libar-docs-implements | **Invariant:** Any TypeScript file with a matching @libar-docs-implements tag must appear in the pattern document's... |
| Multiple implementations are listed alphabetically                     | **Invariant:** When multiple files implement the same pattern, they must be listed in ascending file path order....    |
| Patterns without implementations omit the section                      | **Invariant:** The Implementations heading must not appear in pattern documents when no implementing files exist....   |
| Implementation references use relative file links                      | **Invariant:** Implementation file links must be relative paths starting from the patterns output directory....        |

--- PrChangesOptions ---

| Rule                                                | Description                                                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Orchestrator supports PR changes generation options | **Invariant:** PR changes output includes only patterns matching the changed files list, the release version filter,... |

--- DocumentationOrchestrator ---

| Rule                                                            | Description                                                                                                       |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Orchestrator coordinates full documentation generation pipeline | **Invariant:** Non-overlapping patterns from TypeScript and Gherkin sources must merge into a unified dataset;... |

--- CodecBasedGeneratorTesting ---

| Rule                                                     | Description                                                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CodecBasedGenerator adapts codecs to generator interface | **Invariant:** CodecBasedGenerator delegates document generation to the underlying codec and surfaces codec errors... |

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

| Rule                                         | Description                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| DocString parsing handles edge cases         | **Invariant:** DocString parsing must gracefully handle empty input, missing language hints, unclosed delimiters, and... |
| DataTable rendering produces valid markdown  | **Invariant:** DataTable rendering must produce a well-formed table block for any number of rows, substituting empty...  |
| Scenario content rendering respects options  | **Invariant:** Scenario rendering must honor the includeSteps option, producing step lists only when enabled, and...     |
| Business rule rendering handles descriptions | **Invariant:** Business rule rendering must always include the rule name as a bold paragraph, and must parse...          |
| DocString content is dedented when parsed    | **Invariant:** DocString code blocks must be dedented to remove common leading whitespace while preserving internal...   |

--- UniversalMarkdownRenderer ---

--- RemainingWorkSummaryAccuracy ---

| Rule                                              | Description                                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Summary totals equal sum of phase table rows      | **Invariant:** The summary Active and Total Remaining counts must exactly equal the sum of the corresponding counts... |
| Patterns without phases appear in Backlog row     | **Invariant:** Patterns that have no assigned phase must be grouped into a "Backlog" row in the phase table rather...  |
| Patterns without patternName are counted using id | **Invariant:** Pattern counting must use pattern.id as the identifier, never patternName, so that patterns with...     |
| All phases with incomplete patterns are shown     | **Invariant:** The phase table must include every phase that contains at least one incomplete pattern, and phases...   |

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

| Rule                                                       | Description                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Repository prefixes are stripped from implementation paths | **Invariant:** Implementation file paths must not contain repository-level prefixes like "libar-platform/" or...        |
| All implementation links in a pattern are normalized       | **Invariant:** Every implementation link in a pattern document must have its path normalized, regardless of how many... |
| normalizeImplPath strips known prefixes                    | **Invariant:** normalizeImplPath removes only recognized repository prefixes from the start of a path and leaves all... |

--- ExtractSummary ---

| Rule                                                           | Description                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Single-line descriptions are returned as-is when complete      | **Invariant:** A single-line description that ends with sentence-ending punctuation is returned verbatim; one without... |
| Multi-line descriptions are combined until sentence ending     | **Invariant:** Lines are concatenated until a sentence-ending punctuation mark is found or the character limit is...     |
| Long descriptions are truncated at sentence or word boundaries | **Invariant:** Summaries exceeding the character limit are truncated at the nearest sentence boundary if possible,...    |
| Tautological and header lines are skipped                      | **Invariant:** Lines that merely repeat the pattern name or consist only of a section header label (e.g., "Problem:",... |
| Edge cases are handled gracefully                              | **Invariant:** Degenerate inputs (empty strings, markdown-only content, bold markers) produce valid output without...    |

--- DescriptionQualityFoundation ---

--- DescriptionHeaderNormalization ---

| Rule                                                   | Description                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Leading headers are stripped from pattern descriptions | **Invariant:** Markdown headers at the start of a pattern description are removed before rendering to prevent...       |
| Edge cases are handled correctly                       | **Invariant:** Header stripping handles degenerate inputs (header-only, whitespace-only, mid-description headers)...   |
| stripLeadingHeaders removes only leading headers       | **Invariant:** The helper function strips only headers that appear before any non-header content; headers occurring... |

--- ZodCodecMigration ---

--- MermaidRelationshipRendering ---

| Rule                                              | Description                                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Each relationship type has a distinct arrow style | **Invariant:** Each relationship type (uses, depends-on, implements, extends) must render with a unique, visually...   |
| Pattern names are sanitized for Mermaid node IDs  | **Invariant:** Pattern names must be transformed into valid Mermaid node IDs by replacing special characters (dots,... |
| All relationship types appear in single graph     | **Invariant:** The generated Mermaid graph must combine all relationship types (uses, depends-on, implements,...       |

--- LayeredDiagramGeneration ---

| Rule                                                    | Description                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Layered diagrams group patterns by arch-layer           | **Invariant:** Each distinct arch-layer value must produce exactly one Mermaid subgraph containing all patterns with... |
| Layer order is domain to infrastructure (top to bottom) | **Invariant:** Layer subgraphs must be rendered in Clean Architecture order: domain first, then application, then...    |
| Context labels included in layered diagram nodes        | **Invariant:** Each node in a layered diagram must include its bounded context name as a label, since context is not... |
| Patterns without layer go to Other subgraph             | **Invariant:** Patterns that have arch-role or arch-context but no arch-layer must be placed in an "Other" subgraph,... |
| Layered diagram includes summary section                | **Invariant:** The generated layered diagram document must include an Overview section with annotated source file...    |

--- ArchGeneratorRegistration ---

| Rule                                                         | Description                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Architecture generator is registered in the registry         | **Invariant:** The generator registry must contain an "architecture" generator entry available for CLI invocation....    |
| Architecture generator produces component diagram by default | **Invariant:** Running the architecture generator without diagram type options must produce a component diagram with...  |
| Architecture generator supports diagram type options         | **Invariant:** The architecture generator must accept a diagram type option that selects between component and...        |
| Architecture generator supports context filtering            | **Invariant:** When context filtering is applied, the generated diagram must include only patterns from the specified... |

--- ComponentDiagramGeneration ---

| Rule                                                    | Description                                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Component diagrams group patterns by bounded context    | **Invariant:** Each distinct arch-context value must produce exactly one Mermaid subgraph containing all patterns...   |
| Context-less patterns go to Shared Infrastructure       | **Invariant:** Patterns without an arch-context value must be placed in a "Shared Infrastructure" subgraph, never...   |
| Relationship types render with distinct arrow styles    | **Invariant:** Each relationship type must render with its designated Mermaid arrow style: uses (-->), depends-on...   |
| Arrows only connect annotated components                | **Invariant:** Relationship arrows must only be rendered when both source and target patterns exist in the...          |
| Component diagram includes summary section              | **Invariant:** The generated component diagram document must include an Overview section with component count and...   |
| Component diagram includes legend when enabled          | **Invariant:** When the legend is enabled, the document must include a Legend section explaining relationship arrow... |
| Component diagram includes inventory table when enabled | **Invariant:** When the inventory is enabled, the document must include a Component Inventory table with Component,... |
| Empty architecture data shows guidance message          | **Invariant:** When no patterns have architecture annotations, the document must display a guidance message...         |

--- ArchTagExtraction ---

| Rule                                                         | Description                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| arch-role tag is defined in the registry                     | **Invariant:** The tag registry must contain an arch-role tag with enum format and all valid architectural role...       |
| arch-context tag is defined in the registry                  | **Invariant:** The tag registry must contain an arch-context tag with value format for free-form bounded context...      |
| arch-layer tag is defined in the registry                    | **Invariant:** The tag registry must contain an arch-layer tag with enum format and exactly three values: domain,...     |
| AST parser extracts arch-role from TypeScript annotations    | **Invariant:** The AST parser must extract the arch-role value from JSDoc annotations and populate the directive's...    |
| AST parser extracts arch-context from TypeScript annotations | **Invariant:** The AST parser must extract the arch-context value from JSDoc annotations and populate the directive's... |
| AST parser extracts arch-layer from TypeScript annotations   | **Invariant:** The AST parser must extract the arch-layer value from JSDoc annotations and populate the directive's...   |
| AST parser handles multiple arch tags together               | **Invariant:** When a JSDoc block contains arch-role, arch-context, and arch-layer tags, all three must be extracted...  |
| Missing arch tags yield undefined values                     | **Invariant:** Arch tag fields absent from a JSDoc block must be undefined in the extracted directive, not null or...    |

--- ArchIndexDataset ---

| Rule                                                   | Description                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| archIndex groups patterns by arch-role                 | **Invariant:** Every pattern with an arch-role tag must appear in the archIndex.byRole map under its role key....        |
| archIndex groups patterns by arch-context              | **Invariant:** Every pattern with an arch-context tag must appear in the archIndex.byContext map under its context...    |
| archIndex groups patterns by arch-layer                | **Invariant:** Every pattern with an arch-layer tag must appear in the archIndex.byLayer map under its layer key....     |
| archIndex.all contains all patterns with any arch tag  | **Invariant:** archIndex.all must contain exactly the set of patterns that have at least one arch tag (role, context,... |
| Patterns without arch tags are excluded from archIndex | **Invariant:** Patterns lacking all three arch tags (role, context, layer) must not appear in any archIndex view....     |

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

| Rule                                          | Description                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Exact paths match without wildcards           | **Invariant:** A pattern without glob characters must match only the exact file path, character for character....      |
| Single-level globs match one directory level  | **Invariant:** A single `*` glob must match files only within the specified directory, never crossing directory...     |
| Recursive globs match any depth               | **Invariant:** A `**` glob must match files at any nesting depth below the specified prefix, while still respecting... |
| Dataset shape extraction deduplicates by name | **Invariant:** When multiple patterns match a source glob, the returned shapes must be deduplicated by name so each... |

--- SessionCodecTesting ---

| Rule                                                         | Description                                                                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| SessionContextCodec provides working context for AI sessions | **Invariant:** Session context must include session status with active/completed/remaining counts, phase navigation... |
| RemainingWorkCodec aggregates incomplete work by phase       | **Invariant:** Remaining work must show status counts, phase-grouped navigation, priority classification...            |

--- RequirementsAdrCodecTesting ---

| Rule                                                                      | Description                                                                                                            |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| RequirementsDocumentCodec generates PRD-style documentation from patterns | **Invariant:** RequirementsDocumentCodec transforms MasterDataset patterns into a PRD-style document with flexible...  |
| AdrDocumentCodec documents architecture decisions                         | **Invariant:** AdrDocumentCodec transforms MasterDataset ADR patterns into an architecture decision record document... |

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

| Rule                                                                              | Description                                                                                                              |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| PrChangesCodec handles empty results gracefully                                   | **Invariant:** When no patterns match the applied filters, the codec must produce a valid document with a "No...         |
| PrChangesCodec generates summary with filter information                          | **Invariant:** Every PR changes document must contain a Summary section with pattern counts and active filter...         |
| PrChangesCodec groups changes by phase when sortBy is "phase"                     | **Invariant:** When sortBy is "phase" (the default), patterns must be grouped under phase headings in ascending phase... |
| PrChangesCodec groups changes by priority when sortBy is "priority"               | **Invariant:** When sortBy is "priority", patterns must be grouped under High/Medium/Low priority headings with...       |
| PrChangesCodec shows flat list when sortBy is "workflow"                          | **Invariant:** When sortBy is "workflow", patterns must be rendered as a flat list without phase or priority...          |
| PrChangesCodec renders pattern details with metadata and description              | **Invariant:** Each pattern entry must include a metadata table (status, phase, business value when available) and...    |
| PrChangesCodec renders deliverables when includeDeliverables is enabled           | **Invariant:** Deliverables are only rendered when includeDeliverables is enabled, and when releaseFilter is set,...     |
| PrChangesCodec renders acceptance criteria from scenarios                         | **Invariant:** When patterns have associated scenarios, the codec must render an "Acceptance Criteria" section...        |
| PrChangesCodec renders business rules from Gherkin Rule keyword                   | **Invariant:** When patterns have Gherkin Rule blocks, the codec must render a "Business Rules" section containing...    |
| PrChangesCodec generates review checklist when includeReviewChecklist is enabled  | **Invariant:** When includeReviewChecklist is enabled, the codec must generate a "Review Checklist" section with...      |
| PrChangesCodec generates dependencies section when includeDependencies is enabled | **Invariant:** When includeDependencies is enabled and patterns have dependency relationships, the codec must render...  |
| PrChangesCodec filters patterns by changedFiles                                   | **Invariant:** When changedFiles filter is set, only patterns whose source files match (including partial directory...   |
| PrChangesCodec filters patterns by releaseFilter                                  | **Invariant:** When releaseFilter is set, only patterns with deliverables matching the specified release version are...  |
| PrChangesCodec uses OR logic for combined filters                                 | **Invariant:** When both changedFiles and releaseFilter are set, patterns matching either criterion are included (OR...  |
| PrChangesCodec only includes active and completed patterns                        | **Invariant:** The codec must exclude roadmap and deferred patterns, including only active and completed patterns in...  |

--- PlanningCodecTesting ---

| Rule                                                        | Description                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| PlanningChecklistCodec prepares for implementation sessions | **Invariant:** The checklist must include pre-planning questions, definition of done with deliverables, and...           |
| SessionPlanCodec generates implementation plans             | **Invariant:** The plan must include status summary, implementation approach from use cases, deliverables with...        |
| SessionFindingsCodec captures retrospective discoveries     | **Invariant:** Findings must be categorized into gaps, improvements, risks, and learnings with per-type counts in the... |

--- DedentHelper ---

| Rule                                        | Description                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Tabs are normalized to spaces before dedent | **Invariant:** Tab characters must be converted to spaces before calculating the minimum indentation level....           |
| Empty lines are handled correctly           | **Invariant:** Empty lines (including lines with only whitespace) must not affect the minimum indentation calculation... |
| Single line input is handled                | **Invariant:** Single-line input must have its leading whitespace removed without errors or unexpected...                |
| Unicode whitespace is handled               | **Invariant:** Non-breaking spaces and other Unicode whitespace characters must be treated as content, not as...         |
| Relative indentation is preserved           | **Invariant:** After removing the common leading whitespace, the relative indentation between lines must remain...       |

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
