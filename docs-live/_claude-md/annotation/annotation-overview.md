=== ANNOTATION OVERVIEW ===

Purpose: Annotation product area overview
Detail Level: Compact summary

**How do I annotate code?** The annotation system is the ingestion boundary — it transforms annotated TypeScript and Gherkin files into `ExtractedPattern[]` objects that feed the entire downstream pipeline. Two parallel scanning paths (TypeScript AST + Gherkin parser) converge through dual-source merging. The system is fully data-driven: the `TagRegistry` defines all tags, formats, and categories — adding a new annotation requires only a registry entry, zero parser changes.

=== KEY INVARIANTS ===

- Source ownership enforced: `uses`/`used-by`/`category` belong in TypeScript only; `depends-on`/`quarter`/`team`/`phase` belong in Gherkin only. Anti-pattern detector validates at lint time
- Data-driven tag dispatch: Both AST parser and Gherkin parser use `TagRegistry.metadataTags` to determine extraction. 6 format types (`value`/`enum`/`csv`/`number`/`flag`/`quoted-value`) cover all tag shapes — zero parser changes for new tags
- Pipeline data preservation: Gherkin `Rule:` blocks, deliverables, scenarios, and all metadata flow through scanner → extractor → `ExtractedPattern` → generators without data loss
- Dual-source merge with conflict detection: Same pattern name in both TypeScript and Gherkin produces a merge conflict error. Phase mismatches between sources produce validation errors

=== API TYPES ===

| Type                             | Kind      |
| -------------------------------- | --------- |
| TagRegistry                      | interface |
| MetadataTagDefinitionForRegistry | interface |
| CategoryDefinition               | interface |
| TagDefinition                    | type      |
| CategoryTag                      | type      |
| buildRegistry                    | function  |
| METADATA_TAGS_BY_GROUP           | const     |
| CATEGORIES                       | const     |
| CATEGORY_TAGS                    | const     |

=== BEHAVIOR SPECIFICATIONS ===

--- TypeScriptTaxonomyImplementation ---

--- ShapeExtraction ---

| Rule                                             | Description                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| extract-shapes tag is defined in registry        | **Invariant:** The `extract-shapes` tag must exist with CSV format to list<br> multiple type names for extraction.       |
| Interfaces are extracted from TypeScript AST     | **Invariant:** When `@libar-docs-extract-shapes` lists an interface name,<br> the extractor must find and extract the... |
| Type aliases are extracted from TypeScript AST   | **Invariant:** Type aliases (including union types, intersection types,<br> and mapped types) are extracted when...      |
| Enums are extracted from TypeScript AST          | **Invariant:** Both string and numeric enums are extracted with their<br> complete member definitions.                   |
| Function signatures are extracted (body omitted) | **Invariant:** When a function name is listed in extract-shapes, only the<br> signature (parameters, return type,...     |
| Multiple shapes are extracted in specified order | **Invariant:** When multiple shapes are listed, they appear in the<br> documentation in the order specified in the...    |
| Extracted shapes render as fenced code blocks    | **Invariant:** Codecs render extracted shapes as TypeScript fenced code<br> blocks, grouped under an "API Types" or...   |
| Shapes can reference types from imports          | **Invariant:** Extracted shapes may reference types from imports. The<br> extractor does NOT resolve imports - it...     |
| Overloaded function signatures are all extracted | **Invariant:** When a function has multiple overload signatures, all<br> signatures are extracted together as they...    |
| Shape rendering supports grouping options        | **Invariant:** Codecs can render shapes grouped in a single code block<br> or as separate code blocks, depending on...   |

--- PatternRelationshipModel ---

| Rule                                                      | Description                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Code files declare pattern realization via implements tag | **Invariant:** Files with `@libar-docs-implements:PatternName,OtherPattern` are linked<br> to the specified patterns...  |
| Pattern inheritance uses extends relationship tag         | **Invariant:** Files with `@libar-docs-extends:BasePattern` declare that they extend<br> another pattern's...            |
| Technical dependencies use directed relationship tags     | **Invariant:** `@libar-docs-uses` declares outbound dependencies (what this<br> pattern depends on)....                  |
| Roadmap sequencing uses ordering relationship tags        | **Invariant:** `@libar-docs-depends-on` declares what must be completed first<br> (roadmap sequencing)....               |
| Cross-tier linking uses traceability tags (PDR-007)       | **Invariant:** `@libar-docs-executable-specs` on roadmap specs points to test<br> locations....                          |
| Epic/Phase/Task hierarchy uses parent-child relationships | **Invariant:** `@libar-docs-level` declares the hierarchy tier (epic, phase, task).<br> `@libar-docs-parent` links to... |
| All relationships appear in generated documentation       | **Invariant:** The PATTERNS.md dependency graph renders all relationship types<br> with distinct visual styles....       |
| Linter detects relationship violations                    | **Invariant:** The pattern linter validates that all relationship targets exist,<br> implements files don't have...      |

--- GherkinRulesSupport ---

| Rule                                                     | Description                                                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Rules flow through the entire pipeline without data loss | The @cucumber/gherkin parser extracts Rules natively. Our pipeline must<br> preserve this data through scanner,...     |
| Generators can render rules as business documentation    | Business stakeholders see rule names and descriptions as "Business Rules"<br> sections, not Given/When/Then syntax.... |
| Custom content blocks render in acceptance criteria      | DataTables and DocStrings in steps should appear in generated documentation,<br> providing structured data and code... |
| vitest-cucumber executes scenarios inside Rules          | Test execution must work for scenarios inside Rule blocks.<br> Use Rule() function with RuleScenario() instead of...   |

--- DeclarationLevelShapeTagging ---

| Rule                                                              | Description                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Declarations opt in via libar-docs-shape tag                      | **Invariant:** Only declarations with the libar-docs-shape tag in their<br> immediately preceding JSDoc are collected... |
| Reference doc configs select shapes via shapeSelectors            | **Invariant:** shapeSelectors provides three selection modes: by<br> source path + specific names (DD-6 source+names...  |
| Discovery uses existing estree parser with JSDoc comment scanning | **Invariant:** The discoverTaggedShapes function uses the existing<br> typescript-estree parse() and...                  |

--- CrossSourceValidation ---

| Rule                                            | Description |
| ----------------------------------------------- | ----------- |
| Pattern names must be consistent across sources |             |
| Circular dependencies are detected              |             |
| Dependency references must resolve              |             |

--- GherkinAstParser ---

| Rule                                                       | Description                                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Successful feature file parsing extracts complete metadata | **Invariant:** A valid feature file must produce a ParsedFeature with name, description, language, tags, and all... |
| Invalid Gherkin produces structured errors                 | **Invariant:** Malformed or incomplete Gherkin input must return a Result.err with the source file path and a...    |

--- FileDiscovery ---

| Rule                                            | Description                                                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Glob patterns match TypeScript source files     | **Invariant:** findFilesToScan must return absolute paths for all files matching the configured glob patterns....       |
| Default exclusions filter non-source files      | **Invariant:** node_modules, dist, .test.ts, .spec.ts, and .d.ts files must be excluded by default without explicit...  |
| Custom configuration extends discovery behavior | **Invariant:** User-provided exclude patterns must be applied in addition to (not replacing) the default exclusions.... |

--- DocStringMediaType ---

| Rule                                                   | Description                                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Parser preserves DocString mediaType during extraction | **Invariant:** The Gherkin parser must retain the mediaType annotation from DocString delimiters through to the...   |
| MediaType is used when rendering code blocks           | **Invariant:** The rendered code block language must match the DocString mediaType; when mediaType is absent, the... |
| renderDocString handles both string and object formats | **Invariant:** renderDocString accepts both plain string and object DocString formats; when an object has a...       |

--- AstParser ---

| Rule                                                                                 | Description                                                                                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Export types are correctly identified from TypeScript declarations                   | **Invariant:** Every exported TypeScript declaration type (function, type, interface, const, class, enum, abstract...    |
| Metadata is correctly extracted from JSDoc comments                                  | **Invariant:** Examples, multi-line descriptions, line numbers, function signatures, and standard JSDoc tags are all...  |
| Tags are extracted only from the directive section, not from description or examples | **Invariant:** Only tags appearing in the directive section (before the description) are extracted. Tags mentioned in... |
| When to Use sections are extracted in all supported formats                          | **Invariant:** When to Use content is extracted from heading format with bullet points, inline bold format, and...       |
| Relationship tags extract uses and usedBy dependencies                               | **Invariant:** The uses and usedBy relationship arrays are populated from directive tags, not from description...        |
| Edge cases and malformed input are handled gracefully                                | **Invariant:** The parser never crashes on invalid input. Files without directives return empty results. Malformed...    |

--- ShapeExtractionTesting ---

| Rule                                                                             | Description                                                                                                            |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| extract-shapes tag exists in registry with CSV format                            |                                                                                                                        |
| Interfaces are extracted from TypeScript AST                                     |                                                                                                                        |
| Property-level JSDoc is extracted for interface properties                       | The extractor uses strict adjacency (gap = 1 line) to prevent<br> interface-level JSDoc from being misattributed to... |
| Type aliases are extracted from TypeScript AST                                   |                                                                                                                        |
| Enums are extracted from TypeScript AST                                          |                                                                                                                        |
| Function signatures are extracted with body omitted                              |                                                                                                                        |
| Multiple shapes are extracted in specified order                                 |                                                                                                                        |
| Extracted shapes render as fenced code blocks                                    |                                                                                                                        |
| Imported and re-exported shapes are tracked separately                           |                                                                                                                        |
| Const declarations are extracted from TypeScript AST                             |                                                                                                                        |
| Invalid TypeScript produces error result                                         |                                                                                                                        |
| Non-exported shapes are extractable                                              |                                                                                                                        |
| Shape rendering supports grouping options                                        |                                                                                                                        |
| Annotation tags are stripped from extracted JSDoc while preserving standard tags | **Invariant:** Extracted shapes never contain @libar-docs-\* annotation lines in their jsDoc field....                 |
| Large source files are rejected to prevent memory exhaustion                     |                                                                                                                        |

--- ExtractionPipelineEnhancementsTesting ---

| Rule                                                            | Description                                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Function signatures surface full parameter types in ExportInfo  | **Invariant:** ExportInfo.signature shows full parameter types and<br> return type instead of the placeholder...         |
| Property-level JSDoc preserves full multi-line content          | **Invariant:** Property-level JSDoc preserves full multi-line content<br> without first-line truncation....              |
| Param returns and throws tags are extracted from function JSDoc | **Invariant:** JSDoc param, returns, and throws tags are extracted<br> and stored on ExtractedShape for function-kind... |
| Auto-shape discovery extracts all exported types via wildcard   | **Invariant:** When extract-shapes tag value is the wildcard character,<br> all exported declarations are extracted...   |

--- DualSourceExtractorTesting ---

| Rule                                                             | Description                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Process metadata is extracted from feature tags                  | **Invariant:** A feature file must have both @pattern and @phase tags to produce valid process metadata; missing...      |
| Deliverables are extracted from Background tables                | **Invariant:** Deliverables are sourced exclusively from Background tables; features without a Background produce an...  |
| Code and feature patterns are combined into dual-source patterns | **Invariant:** A combined pattern is produced only when both a code stub and a feature file exist for the same...        |
| Dual-source results are validated for consistency                | **Invariant:** Cross-source validation reports errors for metadata mismatches and warnings for orphaned patterns that... |
| Include tags are extracted from Gherkin feature tags             | **Invariant:** Include tags are parsed as comma-separated values; absence of the tag means the pattern has no...         |

--- DeclarationLevelShapeTaggingTesting ---

| Rule                                                              | Description                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Declarations opt in via libar-docs-shape tag                      | **Invariant:** Only declarations with the libar-docs-shape tag in their<br> immediately preceding JSDoc are collected... |
| Discovery uses existing estree parser with JSDoc comment scanning | **Invariant:** The discoverTaggedShapes function uses the existing<br> typescript-estree parse() and...                  |

--- ScannerCore ---

| Rule                                                   | Description                                                                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| scanPatterns extracts directives from TypeScript files | **Invariant:** Every file with a valid opt-in marker and JSDoc directives produces a complete ScannedFile with tags,... |
| scanPatterns collects errors without aborting          | **Invariant:** A parse failure in one file never prevents other files from being scanned; the result is always Ok...    |
| Pattern matching and exclusion filtering               | **Invariant:** Glob patterns control file discovery and exclusion patterns remove matched files before scanning....     |
| File opt-in requirement gates scanning                 | **Invariant:** Only files containing a standalone @libar-docs marker (not @libar-docs-\*) are eligible for directive... |

--- PatternTagExtraction ---

| Rule                                                                        | Description                                                                                                             |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Single value tags produce scalar metadata fields                            | **Invariant:** Each single-value tag (pattern, phase, status, brief) maps to exactly one metadata field with the...     |
| Array value tags accumulate into list metadata fields                       | **Invariant:** Tags for depends-on and enables split comma-separated values and accumulate across multiple tag...       |
| Category tags are colon-free tags filtered against known non-categories     | **Invariant:** Tags without colons become categories, except known non-category tags (acceptance-criteria,...           |
| Complex tag lists produce fully populated metadata                          | **Invariant:** All tag types (scalar, array, category) are correctly extracted from a single mixed tag list....         |
| Edge cases produce safe defaults                                            | **Invariant:** Empty or invalid inputs produce empty metadata or omit invalid fields rather than throwing errors....    |
| Convention tags support CSV values with whitespace trimming                 | **Invariant:** Convention tags split comma-separated values and trim whitespace from each value.<br> \*\*Verified...    |
| Registry-driven extraction handles enums, transforms, and value constraints | **Invariant:** Tags defined in the registry use data-driven extraction with enum validation, CSV accumulation, value... |

--- LayerInferenceTesting ---

| Rule                                                                     | Description                                                                                                                |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Timeline layer is detected from /timeline/ directory segments            | **Invariant:** Any feature file path containing a /timeline/ directory segment is classified as timeline layer....         |
| Domain layer is detected from business context directory segments        | **Invariant:** Feature files in /deciders/, /orders/, or /inventory/ directories are classified as domain layer....        |
| Integration layer is detected and takes priority over domain directories | **Invariant:** Paths containing /integration-features/ or /integration/ are classified as integration, even when they...   |
| E2E layer is detected from /e2e/ directory segments                      | **Invariant:** Any feature file path containing an /e2e/ directory segment is classified as e2e layer.<br> \*\*Verified... |
| Component layer is detected from tool-specific directory segments        | **Invariant:** Feature files in /scanner/ or /lint/ directories are classified as component layer.<br> \*\*Verified...     |
| Unknown layer is the fallback for unclassified paths                     | **Invariant:** Any feature file path that does not match a known layer pattern is classified as unknown....                |
| Path normalization handles cross-platform and case differences           | **Invariant:** Layer inference produces correct results regardless of path separators, case, or absolute vs relative...    |
| FEATURE_LAYERS constant provides validated layer enumeration             | **Invariant:** FEATURE_LAYERS is a readonly array containing exactly all 6 valid layer values.<br> **Verified by:**...     |

--- DirectiveDetection ---

| Rule                                                       | Description                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| hasDocDirectives detects @libar-docs-\* section directives | **Invariant:** hasDocDirectives must return true if and only if the source contains at least one @libar-docs-{suffix}... |
| hasFileOptIn detects file-level @libar-docs marker         | **Invariant:** hasFileOptIn must return true if and only if the source contains a bare @libar-docs tag (not followed...  |

--- ContextInference ---

| Rule                                               | Description                                                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| matchPattern supports recursive wildcard \*\*      | **Invariant:** The `**` wildcard matches files at any nesting depth below the specified directory prefix....               |
| matchPattern supports single-level wildcard /\*    | **Invariant:** The `/*` wildcard matches only direct children of the specified directory, not deeper nested files....      |
| matchPattern supports prefix matching              | **Invariant:** A trailing slash pattern matches any file whose path starts with that directory prefix.<br> \*\*Verified... |
| inferContext returns undefined when no rules match | **Invariant:** When no inference rule matches a file path, the pattern receives no inferred context and is excluded...     |
| inferContext applies first matching rule           | **Invariant:** When multiple rules could match a file path, only the first matching rule determines the inferred...        |
| Explicit archContext is not overridden             | **Invariant:** A pattern with an explicitly annotated archContext retains that value regardless of matching inference...   |
| Inference works independently of archLayer         | **Invariant:** Context inference operates on file path alone; the presence or absence of archLayer does not affect...      |
| Default rules map standard directories             | **Invariant:** Each standard source directory (validation, scanner, extractor, etc.) maps to a well-known bounded...       |

--- UsesTagTesting ---

| Rule                                                | Description                                                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Uses tag is defined in taxonomy registry            | **Invariant:** The uses and used-by tags must be registered in the taxonomy with CSV format and dependency-related...   |
| Uses tag is extracted from TypeScript files         | **Invariant:** The AST parser must extract single and comma-separated uses values from TypeScript JSDoc annotations.... |
| Used-by tag is extracted from TypeScript files      | **Invariant:** The AST parser must extract single and comma-separated used-by values from TypeScript JSDoc...           |
| Uses relationships are stored in relationship index | **Invariant:** All declared uses and usedBy relationships must be stored in the relationship index as explicitly...     |
| Schemas validate uses field correctly               | **Invariant:** DocDirective and RelationshipEntry schemas must accept uses and usedBy fields as valid CSV string...     |

--- ImplementsTagProcessing ---

| Rule                                                   | Description                                                                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Implements tag is defined in taxonomy registry         | **Invariant:** The implements tag must exist in the taxonomy registry with CSV format.<br> **Verified by:**...          |
| Files can implement a single pattern                   | **Invariant:** The AST parser must extract a single implements value and preserve it through the extraction...          |
| Files can implement multiple patterns using CSV format | **Invariant:** The AST parser must split CSV implements values into individual pattern references with whitespace...    |
| Transform builds implementedBy reverse lookup          | **Invariant:** The transform must compute an implementedBy reverse index so spec patterns know which files implement... |
| Schemas validate implements field correctly            | **Invariant:** The Zod schemas must accept implements and implementedBy fields with correct array-of-string types....   |

--- ExtendsTagTesting ---

| Rule                                         | Description                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Extends tag is defined in taxonomy registry  | **Invariant:** The extends tag must exist in the taxonomy registry with single-value format.<br> **Verified by:**...     |
| Patterns can extend exactly one base pattern | **Invariant:** A pattern may extend at most one base pattern, enforced by single-value tag format.<br> **Rationale:**... |
| Transform builds extendedBy reverse lookup   | **Invariant:** The transform must compute an extendedBy reverse index so base patterns know which patterns extend...     |
| Linter detects circular inheritance chains   | **Invariant:** Circular inheritance chains (direct or transitive) must be detected and reported as errors....            |

--- DependsOnTagTesting ---

| Rule                                                   | Description                                                                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Depends-on tag is defined in taxonomy registry         | **Invariant:** The depends-on and enables tags must exist in the taxonomy registry with CSV format.<br> \*\*Verified... |
| Depends-on tag is extracted from Gherkin files         | **Invariant:** The Gherkin parser must extract depends-on values from feature file tags, including CSV multi-value...   |
| Depends-on in TypeScript triggers anti-pattern warning | **Invariant:** The depends-on tag must only appear in Gherkin files; its presence in TypeScript is an anti-pattern....  |
| Enables tag is extracted from Gherkin files            | **Invariant:** The Gherkin parser must extract enables values from feature file tags, including CSV multi-value...      |
| Planning dependencies are stored in relationship index | **Invariant:** The relationship index must store dependsOn and enables relationships extracted from pattern...          |
