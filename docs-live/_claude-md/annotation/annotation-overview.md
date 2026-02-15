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

| Rule                                                   | Description |
| ------------------------------------------------------ | ----------- |
| Parser preserves DocString mediaType during extraction |             |
| MediaType is used when rendering code blocks           |             |
| renderDocString handles both string and object formats |             |

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

| Rule                                                             | Description |
| ---------------------------------------------------------------- | ----------- |
| Process metadata is extracted from feature tags                  |             |
| Deliverables are extracted from Background tables                |             |
| Code and feature patterns are combined into dual-source patterns |             |
| Dual-source results are validated for consistency                |             |
| Include tags are extracted from Gherkin feature tags             |             |

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

| Rule                                               | Description |
| -------------------------------------------------- | ----------- |
| matchPattern supports recursive wildcard \*\*      |             |
| matchPattern supports single-level wildcard /\*    |             |
| matchPattern supports prefix matching              |             |
| inferContext returns undefined when no rules match |             |
| inferContext applies first matching rule           |             |
| Explicit archContext is not overridden             |             |
| Inference works independently of archLayer         |             |
| Default rules map standard directories             |             |

--- UsesTagTesting ---

| Rule                                                | Description                                                                                                           |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Uses tag is defined in taxonomy registry            |                                                                                                                       |
| Uses tag is extracted from TypeScript files         |                                                                                                                       |
| Used-by tag is extracted from TypeScript files      |                                                                                                                       |
| Uses relationships are stored in relationship index | The relationship index stores uses and usedBy relationships directly<br> from pattern metadata. Unlike implements,... |
| Schemas validate uses field correctly               |                                                                                                                       |

--- ImplementsTagProcessing ---

| Rule                                                   | Description                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Implements tag is defined in taxonomy registry         | The tag registry defines `implements` with CSV format, enabling the<br> data-driven AST parser to automatically... |
| Files can implement a single pattern                   |                                                                                                                    |
| Files can implement multiple patterns using CSV format |                                                                                                                    |
| Transform builds implementedBy reverse lookup          |                                                                                                                    |
| Schemas validate implements field correctly            |                                                                                                                    |

--- ExtendsTagTesting ---

| Rule                                         | Description                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Extends tag is defined in taxonomy registry  |                                                                                                                          |
| Patterns can extend exactly one base pattern | Extends uses single-value format because pattern inheritance should be<br> single-inheritance to avoid diamond problems. |
| Transform builds extendedBy reverse lookup   |                                                                                                                          |
| Linter detects circular inheritance chains   |                                                                                                                          |

--- DependsOnTagTesting ---

| Rule                                                   | Description                                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Depends-on tag is defined in taxonomy registry         |                                                                                                                      |
| Depends-on tag is extracted from Gherkin files         |                                                                                                                      |
| Depends-on in TypeScript triggers anti-pattern warning | The depends-on tag is for planning dependencies and belongs in feature<br> files, not TypeScript code. TypeScript... |
| Enables tag is extracted from Gherkin files            |                                                                                                                      |
| Planning dependencies are stored in relationship index | The relationship index stores dependsOn and enables relationships<br> directly from pattern metadata. These are...   |
