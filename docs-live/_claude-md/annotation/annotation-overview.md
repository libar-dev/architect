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

--- LayerInferenceTesting ---

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
