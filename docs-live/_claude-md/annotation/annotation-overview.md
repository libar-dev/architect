### Annotation Overview

**How do I annotate code?** The annotation system is the ingestion boundary — it transforms annotated TypeScript and Gherkin files into `ExtractedPattern[]` objects that feed the entire downstream pipeline. Two parallel scanning paths (TypeScript AST + Gherkin parser) converge through dual-source merging. The system is fully data-driven: the `TagRegistry` defines all tags, formats, and categories — adding a new annotation requires only a registry entry, zero parser changes.

#### Key Invariants

- Source ownership enforced: `uses`/`used-by`/`category` belong in TypeScript only; `depends-on`/`quarter`/`team`/`phase` belong in Gherkin only. Anti-pattern detector validates at lint time
- Data-driven tag dispatch: Both AST parser and Gherkin parser use `TagRegistry.metadataTags` to determine extraction. 6 format types (`value`/`enum`/`csv`/`number`/`flag`/`quoted-value`) cover all tag shapes — zero parser changes for new tags
- Pipeline data preservation: Gherkin `Rule:` blocks, deliverables, scenarios, and all metadata flow through scanner → extractor → `ExtractedPattern` → generators without data loss
- Dual-source merge with conflict detection: Same pattern name in both TypeScript and Gherkin produces a merge conflict error. Phase mismatches between sources produce validation errors

**Components:** Extractor (GherkinExtractor, DualSourceExtractor, Document Extractor), Scanner (Pattern Scanner, GherkinScanner, GherkinASTParser, TypeScript AST Parser)

#### API Types

| Type                             | Kind      |
| -------------------------------- | --------- |
| TagRegistry                      | interface |
| MetadataTagDefinitionForRegistry | interface |
| CategoryDefinition               | interface |
| CategoryTag                      | type      |
| buildRegistry                    | function  |
| isShapeOnlyDirective             | function  |
| METADATA_TAGS_BY_GROUP           | const     |
| CATEGORIES                       | const     |
| CATEGORY_TAGS                    | const     |
