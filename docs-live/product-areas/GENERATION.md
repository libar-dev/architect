# Generation Overview

**Purpose:** Generation product area overview
**Detail Level:** Full reference

---

**How does code become docs?** The generation pipeline transforms annotated source code into markdown documents. It follows a four-stage architecture: Scanner → Extractor → Transformer → Codec. Codecs are pure functions — given a MasterDataset, they produce a RenderableDocument without side effects. CompositeCodec composes multiple codecs into a single document.

## Key Invariants

- Codec purity: Every codec is a pure function (dataset in, document out). No side effects, no filesystem access. Same input always produces same output
- Config-driven generation: A single `ReferenceDocConfig` produces a complete document. Content sources compose in fixed order: conventions, diagrams, shapes, behaviors
- RenderableDocument IR: Codecs express intent ("this is a table"), the renderer handles syntax ("pipe-delimited markdown"). Switching output format requires only a new renderer

---

## Generation Components

Scoped architecture diagram showing component relationships:

```mermaid
graph TB
    subgraph generator["Generator"]
        SourceMapper[/"SourceMapper"/]
        Documentation_Generation_Orchestrator("Documentation Generation Orchestrator")
        ContentDeduplicator[/"ContentDeduplicator"/]
        CodecBasedGenerator("CodecBasedGenerator")
        FileCache[/"FileCache"/]
        TransformDataset("TransformDataset")
        DecisionDocGenerator("DecisionDocGenerator")
    end
    subgraph renderer["Renderer"]
        RenderableDocument[/"RenderableDocument"/]
        UniversalRenderer("UniversalRenderer")
        DocumentGenerator("DocumentGenerator")
        SessionCodec[("SessionCodec")]
        PatternsCodec[("PatternsCodec")]
        Shared_Mermaid_Diagram_Utilities["Shared Mermaid Diagram Utilities"]
        DecisionDocCodec[("DecisionDocCodec")]
        CompositeCodec[("CompositeCodec")]
        ArchitectureCodec[("ArchitectureCodec")]
    end
    subgraph related["Related"]
        MasterDataset["MasterDataset"]:::neighbor
        Pattern_Scanner["Pattern Scanner"]:::neighbor
        GherkinASTParser["GherkinASTParser"]:::neighbor
        ShapeExtractor["ShapeExtractor"]:::neighbor
    end
    SourceMapper -.->|depends on| DecisionDocCodec
    SourceMapper -.->|depends on| ShapeExtractor
    SourceMapper -.->|depends on| GherkinASTParser
    Documentation_Generation_Orchestrator -->|uses| Pattern_Scanner
    ArchitectureCodec -->|uses| MasterDataset
    TransformDataset -->|uses| MasterDataset
    DecisionDocGenerator -.->|depends on| DecisionDocCodec
    DecisionDocGenerator -.->|depends on| SourceMapper
    classDef neighbor stroke-dasharray: 5 5
```

---

## API Types

### RuntimeMasterDataset (interface)

```typescript
/**
 * Runtime MasterDataset with optional workflow
 *
 * Extends the Zod-compatible MasterDataset with workflow reference.
 * LoadedWorkflow contains Maps which aren't JSON-serializable,
 * so it's kept separate from the Zod schema.
 */
```

```typescript
interface RuntimeMasterDataset extends MasterDataset {
  /** Optional workflow configuration (not serializable) */
  readonly workflow?: LoadedWorkflow;
}
```

| Property | Description                                        |
| -------- | -------------------------------------------------- |
| workflow | Optional workflow configuration (not serializable) |

### RawDataset (interface)

```typescript
/**
 * Raw input data for transformation
 */
```

```typescript
interface RawDataset {
  /** Extracted patterns from TypeScript and/or Gherkin sources */
  readonly patterns: readonly ExtractedPattern[];

  /** Tag registry for category lookups */
  readonly tagRegistry: TagRegistry;

  /** Optional workflow configuration for phase names (can be undefined) */
  readonly workflow?: LoadedWorkflow | undefined;

  /** Optional rules for inferring bounded context from file paths */
  readonly contextInferenceRules?: readonly ContextInferenceRule[] | undefined;
}
```

| Property              | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| patterns              | Extracted patterns from TypeScript and/or Gherkin sources          |
| tagRegistry           | Tag registry for category lookups                                  |
| workflow              | Optional workflow configuration for phase names (can be undefined) |
| contextInferenceRules | Optional rules for inferring bounded context from file paths       |

### RenderableDocument (type)

```typescript
type RenderableDocument = {
  title: string;
  purpose?: string;
  detailLevel?: string;
  sections: SectionBlock[];
  additionalFiles?: Record<string, RenderableDocument>;
};
```

### SectionBlock (type)

```typescript
type SectionBlock =
  | HeadingBlock
  | ParagraphBlock
  | SeparatorBlock
  | TableBlock
  | ListBlock
  | CodeBlock
  | MermaidBlock
  | CollapsibleBlock
  | LinkOutBlock;
```

### HeadingBlock (type)

```typescript
type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
```

### TableBlock (type)

```typescript
type TableBlock = z.infer<typeof TableBlockSchema>;
```

### ListBlock (type)

```typescript
type ListBlock = z.infer<typeof ListBlockSchema>;
```

### CodeBlock (type)

```typescript
type CodeBlock = z.infer<typeof CodeBlockSchema>;
```

### MermaidBlock (type)

```typescript
type MermaidBlock = z.infer<typeof MermaidBlockSchema>;
```

### CollapsibleBlock (type)

```typescript
type CollapsibleBlock = {
  type: 'collapsible';
  summary: string;
  content: SectionBlock[];
};
```

### transformToMasterDataset (function)

````typescript
/**
 * Transform raw extracted data into a MasterDataset with all pre-computed views.
 *
 * This is a ONE-PASS transformation that computes:
 * - Status-based groupings (completed/active/planned)
 * - Phase-based groupings with counts
 * - Quarter-based groupings for timeline views
 * - Category-based groupings for taxonomy
 * - Source-based views (TypeScript vs Gherkin, roadmap, PRD)
 * - Aggregate statistics (counts, phase count, category count)
 * - Optional relationship index
 *
 * For backward compatibility, this function returns just the dataset.
 * Use `transformToMasterDatasetWithValidation` to get validation summary.
 *
 * @param raw - Raw dataset with patterns, registry, and optional workflow
 * @returns MasterDataset with all pre-computed views
 *
 * @example
 * ```typescript
 * const masterDataset = transformToMasterDataset({
 *   patterns: mergedPatterns,
 *   tagRegistry: registry,
 *   workflow,
 * });
 *
 * // Access pre-computed views
 * const completed = masterDataset.byStatus.completed;
 * const phase3Patterns = masterDataset.byPhase.find(p => p.phaseNumber === 3);
 * const q42024 = masterDataset.byQuarter["Q4-2024"];
 * ```
 */
````

```typescript
function transformToMasterDataset(raw: RawDataset): RuntimeMasterDataset;
```

| Parameter | Type | Description                                                |
| --------- | ---- | ---------------------------------------------------------- |
| raw       |      | Raw dataset with patterns, registry, and optional workflow |

**Returns:** MasterDataset with all pre-computed views

---

## Behavior Specifications

### TestContentBlocks

[View TestContentBlocks source](tests/features/poc/test-content-blocks.feature)

This feature demonstrates what content blocks are captured and rendered
by the PRD generator. Use this as a reference for writing rich specs.

**Overview**

The delivery process supports **rich Markdown** in descriptions:

- Bullet points work
- _Italics_ and **bold** work
- `inline code` works

**Custom Section**

You can create any section you want using bold headers.
This content will appear in the PRD Description section.

#### Business rules appear as a separate section

Rule descriptions provide context for why this business rule exists.
You can include multiple paragraphs here.

    This is a second paragraph explaining edge cases or exceptions.

**Verified by:**

- Scenario with DocString for rich content
- Scenario with DataTable for structured data

#### Multiple rules create multiple Business Rule entries

Each Rule keyword creates a separate entry in the Business Rules section.
This helps organize complex features into logical business domains.

**Verified by:**

- Simple scenario under second rule
- Scenario with examples table

### RuleKeywordPoC

[View RuleKeywordPoC source](tests/features/poc/rule-keyword-poc.feature)

This feature tests whether vitest-cucumber supports the Rule keyword
for organizing scenarios under business rules.

#### Basic arithmetic operations work correctly

The calculator should perform standard math operations
with correct results.

**Verified by:**

- Addition of two positive numbers
- Subtraction of two numbers

#### Division has special constraints

Division by zero must be handled gracefully to prevent
system errors.

**Verified by:**

- Division of two numbers
- Division by zero is prevented

### TableExtraction

[View TableExtraction source](tests/features/generators/table-extraction.feature)

Tables in business rule descriptions should appear exactly once in output.
The extractTables() function extracts tables for proper formatting, and
stripMarkdownTables() removes them from the raw text to prevent duplicates.

<details>
<summary>Tables in rule descriptions render exactly once (2 scenarios)</summary>

#### Tables in rule descriptions render exactly once

**Verified by:**

- Single table renders once in detailed mode
- Table is extracted and properly formatted

</details>

<details>
<summary>Multiple tables in description each render exactly once (1 scenarios)</summary>

#### Multiple tables in description each render exactly once

**Verified by:**

- Two tables in description render as two separate tables

</details>

<details>
<summary>stripMarkdownTables removes table syntax from text (3 scenarios)</summary>

#### stripMarkdownTables removes table syntax from text

**Verified by:**

- Strips single table from text
- Strips multiple tables from text
- Preserves text without tables

</details>

### GeneratorRegistryTesting

[View GeneratorRegistryTesting source](tests/features/generators/registry.feature)

Tests the GeneratorRegistry registration, lookup, and listing capabilities.
The registry manages document generators with name uniqueness constraints.

#### Registry manages generator registration and retrieval

**Verified by:**

- Register generator with unique name
- Duplicate registration throws error
- Get registered generator
- Get unknown generator returns undefined
- Available returns sorted list

### PrdImplementationSectionTesting

[View PrdImplementationSectionTesting source](tests/features/generators/prd-implementation-section.feature)

Tests the Implementations section rendering in pattern documents.
Verifies that code stubs with @libar-docs-implements tags appear in pattern docs
with working links to the source files.

<details>
<summary>Implementation files appear in pattern docs via @libar-docs-implements (2 scenarios)</summary>

#### Implementation files appear in pattern docs via @libar-docs-implements

**Verified by:**

- Implementations section renders with file links
- Implementation includes description when available

</details>

<details>
<summary>Multiple implementations are listed alphabetically (1 scenarios)</summary>

#### Multiple implementations are listed alphabetically

**Verified by:**

- Multiple implementations sorted by file path

</details>

<details>
<summary>Patterns without implementations omit the section (1 scenarios)</summary>

#### Patterns without implementations omit the section

**Verified by:**

- No implementations section when none exist

</details>

<details>
<summary>Implementation references use relative file links (1 scenarios)</summary>

#### Implementation references use relative file links

**Verified by:**

- Links are relative from patterns directory

</details>

### PrChangesOptions

[View PrChangesOptions source](tests/features/generators/pr-changes-options.feature)

Tests the PrChangesCodec filtering capabilities for generating PR-scoped
documentation. The codec filters patterns by changed files and/or release
version, supporting combined OR logic when both filters are provided.

#### Orchestrator supports PR changes generation options

**Verified by:**

- PR changes filters to explicit file list
- PR changes filters by release version
- Combined filters use OR logic

### DocumentationOrchestrator

[View DocumentationOrchestrator source](tests/features/generators/orchestrator.feature)

Tests the orchestrator's pattern merging, conflict detection, and generator
coordination capabilities. The orchestrator coordinates the full documentation
generation pipeline: Scanner -> Extractor -> Generators -> File Writer.

#### Orchestrator coordinates full documentation generation pipeline

**Verified by:**

- Non-overlapping patterns merge successfully
- Orchestrator detects pattern name conflicts
- Orchestrator detects pattern name conflicts with status mismatch
- Unknown generator name fails gracefully
- Partial success when some generators are invalid

### CodecBasedGeneratorTesting

[View CodecBasedGeneratorTesting source](tests/features/generators/codec-based.feature)

Tests the CodecBasedGenerator which adapts the RenderableDocument Model (RDM)
codec system to the DocumentGenerator interface. This enables codec-based
document generation to work seamlessly with the existing orchestrator.

#### CodecBasedGenerator adapts codecs to generator interface

**Verified by:**

- Generator delegates to codec
- Missing MasterDataset returns error
- Codec options are passed through

### BusinessRulesDocumentCodec

[View BusinessRulesDocumentCodec source](tests/features/generators/business-rules-codec.feature)

Tests the BusinessRulesCodec transformation from MasterDataset to RenderableDocument.
Verifies rule extraction, organization by domain/phase, and progressive disclosure.

<details>
<summary>Extracts Rule blocks with Invariant and Rationale (2 scenarios)</summary>

#### Extracts Rule blocks with Invariant and Rationale

**Verified by:**

- Extracts annotated Rule with Invariant and Rationale
- Extracts unannotated Rule without showing not specified

</details>

<details>
<summary>Organizes rules by product area and phase (2 scenarios)</summary>

#### Organizes rules by product area and phase

**Verified by:**

- Groups rules by product area and phase
- Orders rules by phase within domain

</details>

<details>
<summary>Summary mode generates compact output (2 scenarios)</summary>

#### Summary mode generates compact output

**Verified by:**

- Summary mode includes statistics line
- Summary mode excludes detailed sections

</details>

<details>
<summary>Preserves code examples and tables in detailed mode (2 scenarios)</summary>

#### Preserves code examples and tables in detailed mode

**Verified by:**

- Code examples included in detailed mode
- Code examples excluded in standard mode

</details>

<details>
<summary>Generates scenario traceability links (1 scenarios)</summary>

#### Generates scenario traceability links

**Verified by:**

- Verification links include file path

</details>

<details>
<summary>Progressive disclosure generates detail files per product area (3 scenarios)</summary>

#### Progressive disclosure generates detail files per product area

**Verified by:**

- Detail files are generated per product area
- Main document has product area index table with links
- Detail files have back-link to main document

</details>

<details>
<summary>Empty rules show placeholder instead of blank content (2 scenarios)</summary>

#### Empty rules show placeholder instead of blank content

**Verified by:**

- Rule without invariant or description or scenarios shows placeholder
- Rule without invariant but with scenarios shows verified-by instead

</details>

<details>
<summary>Rules always render flat for full visibility (1 scenarios)</summary>

#### Rules always render flat for full visibility

**Verified by:**

- Features with many rules render flat without collapsible blocks

</details>

<details>
<summary>Source file shown as filename text (1 scenarios)</summary>

#### Source file shown as filename text

**Verified by:**

- Source file rendered as plain text not link

</details>

<details>
<summary>Verified-by renders as compact italic line at standard level (2 scenarios)</summary>

#### Verified-by renders as compact italic line at standard level

**Verified by:**

- Rules with scenarios show compact verified-by line
- Duplicate scenario names are deduplicated

</details>

<details>
<summary>Feature names are humanized from camelCase pattern names (2 scenarios)</summary>

#### Feature names are humanized from camelCase pattern names

**Verified by:**

- CamelCase pattern name becomes spaced heading
- Testing suffix is stripped from feature names

</details>

### WarningCollectorTesting

[View WarningCollectorTesting source](tests/features/doc-generation/warning-collector.feature)

The warning collector provides a unified system for capturing, categorizing,
and reporting non-fatal issues during document generation. It replaces
scattered console.warn calls with structured warning handling that integrates
with the Result pattern.

<details>
<summary>Warnings are captured with source context (3 scenarios)</summary>

#### Warnings are captured with source context

Each warning includes the source location, category, and message to
enable debugging and targeted fixes.

**Verified by:**

- Warning includes source file
- Warning includes line number when available
- Warning includes category

</details>

<details>
<summary>Warnings are categorized for filtering and grouping (3 scenarios)</summary>

#### Warnings are categorized for filtering and grouping

Warning categories enable filtering by severity, source, or type
for different reporting needs.

**Verified by:**

- Warning categories are supported
- Warnings can be filtered by category
- Warnings can be filtered by source file

</details>

<details>
<summary>Warnings are aggregated across the pipeline (3 scenarios)</summary>

#### Warnings are aggregated across the pipeline

The collector aggregates warnings from all pipeline stages, maintaining
insertion order and source attribution.

**Verified by:**

- Warnings from multiple stages are collected
- Warnings are grouped by source file
- Summary counts by category

</details>

<details>
<summary>Warnings integrate with the Result pattern (3 scenarios)</summary>

#### Warnings integrate with the Result pattern

The warning collector integrates with Result<T, E> to include warnings
in successful results, enabling callers to inspect non-fatal issues.

**Verified by:**

- Successful result includes warnings
- Failed result includes warnings collected before failure
- Warnings propagate through pipeline

</details>

<details>
<summary>Warnings can be formatted for different outputs (3 scenarios)</summary>

#### Warnings can be formatted for different outputs

The collector provides formatters for console output, JSON, and
markdown to support different reporting needs.

**Verified by:**

- Console format includes color and location
- JSON format is machine-readable
- Markdown format for documentation

</details>

<details>
<summary>Existing console.warn calls are migrated to collector (2 scenarios)</summary>

#### Existing console.warn calls are migrated to collector

All console.warn calls in the source mapper and related modules
are replaced with warning collector calls.

**Verified by:**

- Source mapper uses warning collector
- Shape extractor uses warning collector

</details>

### ValidationRulesCodecTesting

[View ValidationRulesCodecTesting source](tests/features/doc-generation/validation-rules-codec.feature)

Validates the Validation Rules Codec that transforms MasterDataset into a
RenderableDocument for Process Guard validation rules reference (VALIDATION-RULES.md).

<details>
<summary>Document metadata is correctly set (3 scenarios)</summary>

#### Document metadata is correctly set

The validation rules document has standard metadata fields for title,
purpose, and detail level.

**Verified by:**

- Document title is Validation Rules
- Document purpose describes Process Guard
- Detail level reflects generateDetailFiles option

</details>

<details>
<summary>All validation rules are documented in a table (2 scenarios)</summary>

#### All validation rules are documented in a table

The rules table includes all 6 Process Guard validation rules with
their severity levels and descriptions.

**Verified by:**

- All 6 rules appear in table
- Rules have correct severity levels

</details>

<details>
<summary>FSM state diagram is generated from transitions (3 scenarios)</summary>

#### FSM state diagram is generated from transitions

The Mermaid diagram shows all valid state transitions for the
Process Guard FSM.

**Verified by:**

- Mermaid diagram generated when includeFSMDiagram enabled
- Diagram includes all 4 states
- FSM diagram excluded when includeFSMDiagram disabled

</details>

<details>
<summary>Protection level matrix shows status protections (2 scenarios)</summary>

#### Protection level matrix shows status protections

The protection matrix documents which statuses have which protection
levels (none, scope-locked, hard-locked).

**Verified by:**

- Matrix shows all 4 statuses with protection levels
- Protection matrix excluded when includeProtectionMatrix disabled

</details>

<details>
<summary>CLI usage is documented with options and exit codes (4 scenarios)</summary>

#### CLI usage is documented with options and exit codes

The CLI section shows how to invoke the Process Guard linter
with various options.

**Verified by:**

- CLI example code block included
- All 6 CLI options documented
- Exit codes documented
- CLI section excluded when includeCLIUsage disabled

</details>

<details>
<summary>Escape hatches are documented for special cases (2 scenarios)</summary>

#### Escape hatches are documented for special cases

The escape hatches section documents how to override Process Guard
validation for legitimate use cases.

**Verified by:**

- All 3 escape hatches documented
- Escape hatches section excluded when includeEscapeHatches disabled

</details>

### TaxonomyCodecTesting

[View TaxonomyCodecTesting source](tests/features/doc-generation/taxonomy-codec.feature)

Validates the Taxonomy Codec that transforms MasterDataset into a
RenderableDocument for tag taxonomy reference documentation (TAXONOMY.md).

<details>
<summary>Document metadata is correctly set (3 scenarios)</summary>

#### Document metadata is correctly set

The taxonomy document has standard metadata fields for title, purpose,
and detail level that describe the generated content.

**Verified by:**

- Document title is Taxonomy Reference
- Document purpose describes tag taxonomy
- Detail level reflects generateDetailFiles option

</details>

<details>
<summary>Categories section is generated from TagRegistry (3 scenarios)</summary>

#### Categories section is generated from TagRegistry

The categories section lists all configured tag categories with their
domain, priority, and description in a sortable table.

**Verified by:**

- Categories section is included in output
- Category table has correct columns
- LinkOut to detail file when generateDetailFiles enabled

</details>

<details>
<summary>Metadata tags can be grouped by domain (2 scenarios)</summary>

#### Metadata tags can be grouped by domain

The groupByDomain option organizes metadata tags into subsections
by their semantic domain (Core, Relationship, Timeline, etc.).

**Verified by:**

- With groupByDomain enabled tags are grouped into subsections
- With groupByDomain disabled single table rendered

</details>

<details>
<summary>Tags are classified into domains by hardcoded mapping (5 scenarios)</summary>

#### Tags are classified into domains by hardcoded mapping

The domain classification is intentionally hardcoded for documentation
stability. Core, Relationship, Timeline, ADR, and Architecture tags
have specific domain assignments.

**Verified by:**

- Core tags correctly classified
- Relationship tags correctly classified
- Timeline tags correctly classified
- ADR prefix matching works
- Unknown tags go to Other Tags group

</details>

<details>
<summary>Optional sections can be disabled via codec options (3 scenarios)</summary>

#### Optional sections can be disabled via codec options

The codec supports disabling format types, presets, and architecture
diagram sections for compact output generation.

**Verified by:**

- includeFormatTypes disabled excludes Format Types section
- includePresets disabled excludes Presets section
- includeArchDiagram disabled excludes Architecture section

</details>

<details>
<summary>Detail files are generated for progressive disclosure (3 scenarios)</summary>

#### Detail files are generated for progressive disclosure

The generateDetailFiles option creates additional files for
categories, metadata tags, and format types with detailed content.

**Verified by:**

- generateDetailFiles creates 3 additional files
- Detail files have correct paths
- generateDetailFiles disabled creates no additional files

</details>

<details>
<summary>Format types are documented with descriptions and examples (1 scenarios)</summary>

#### Format types are documented with descriptions and examples

The Format Types section documents all supported tag value formats
with descriptions and examples for each type.

**Verified by:**

- All 6 format types are documented

</details>

### SourceMappingValidatorTesting

[View SourceMappingValidatorTesting source](tests/features/doc-generation/source-mapping-validator.feature)

**Context:** Source mappings reference files that may not exist, use invalid
extraction methods, or have incompatible method-file combinations. Without
pre-flight validation, extraction fails late with confusing errors.

**Approach:** Validate file existence, extraction method validity, and format
correctness before extraction begins. Collect all errors rather than stopping
at the first one, enabling users to fix all issues in a single iteration.

<details>
<summary>Source files must exist and be readable (5 scenarios)</summary>

#### Source files must exist and be readable

**Invariant:** All source file paths in mappings must resolve to existing, readable files.

**Rationale:** Prevents extraction failures and provides clear error messages upfront.

**Verified by:**

- Existing file passes validation
- Missing file produces error with path
- Directory instead of file produces error
- THIS DECISION skips file validation
- THIS DECISION with rule reference skips file validation
- @acceptance-criteria scenarios below.

</details>

<details>
<summary>Extraction methods must be valid and supported (4 scenarios)</summary>

#### Extraction methods must be valid and supported

**Invariant:** Extraction methods must match a known method from the supported set.

**Rationale:** Invalid methods cannot extract content; suggest valid alternatives.

**Verified by:**

- Valid extraction methods pass validation
- Unknown method produces error with suggestions
- Empty method produces error
- Method aliases are normalized
- @acceptance-criteria scenarios below.

</details>

<details>
<summary>Extraction methods must be compatible with file types (4 scenarios)</summary>

#### Extraction methods must be compatible with file types

**Invariant:** Method-file combinations must be compatible (e.g., TypeScript methods for .ts files).

**Rationale:** Incompatible combinations fail at extraction; catch early with clear guidance.

**Verified by:**

- TypeScript method on feature file produces error
- Gherkin method on TypeScript file produces error
- Compatible method-file combination passes
- Self-reference method on actual file produces error
- @acceptance-criteria scenarios below.

</details>

<details>
<summary>Source mapping tables must have required columns (3 scenarios)</summary>

#### Source mapping tables must have required columns

**Invariant:** Tables must contain Section, Source File, and Extraction Method columns.

**Rationale:** Missing columns prevent extraction; alternative column names are mapped.

**Verified by:**

- Missing Section column produces error
- Missing Source File column produces error
- Alternative column names are accepted
- @acceptance-criteria scenarios below.

</details>

<details>
<summary>All validation errors are collected and returned together (2 scenarios)</summary>

#### All validation errors are collected and returned together

**Invariant:** Validation collects all errors before returning, not just the first.

**Rationale:** Enables users to fix all issues in a single iteration.

**Verified by:**

- Multiple errors are aggregated
- Warnings are collected alongside errors
- @acceptance-criteria scenarios below.

</details>

### SourceMapperTesting

[View SourceMapperTesting source](tests/features/doc-generation/source-mapper.feature)

The Source Mapper aggregates content from multiple source files based on
source mapping tables parsed from decision documents. It dispatches extraction
to appropriate handlers based on extraction method and preserves ordering.

<details>
<summary>Extraction methods dispatch to correct handlers (3 scenarios)</summary>

#### Extraction methods dispatch to correct handlers

The source mapper dispatches to different extraction functions based on
the extraction method specified in the source mapping table.

**Verified by:**

- Dispatch to decision extraction for THIS DECISION
- Dispatch to TypeScript extractor for .ts files
- Dispatch to behavior spec extractor for .feature files

</details>

<details>
<summary>Self-references extract from current decision document (3 scenarios)</summary>

#### Self-references extract from current decision document

THIS DECISION markers extract content from the current decision document
rather than requiring a separate file path.

**Verified by:**

- Extract from THIS DECISION using rule description
- Extract DocStrings from THIS DECISION
- Extract full document from THIS DECISION

</details>

<details>
<summary>Multiple sources are aggregated in mapping order (2 scenarios)</summary>

#### Multiple sources are aggregated in mapping order

Multiple source mappings result in content extraction from each file.
The aggregated content preserves the order from the mapping table.

**Verified by:**

- Aggregate from multiple sources
- Ordering is preserved from mapping table

</details>

<details>
<summary>Missing files produce warnings without failing (3 scenarios)</summary>

#### Missing files produce warnings without failing

A referenced source file that does not exist produces a warning,
but generation continues with available sources.

**Verified by:**

- Missing source file produces warning
- Partial extraction when some files missing
- Validation checks all files before extraction

</details>

<details>
<summary>Empty extraction results produce info warnings (2 scenarios)</summary>

#### Empty extraction results produce info warnings

Extraction that succeeds but produces no content (e.g., no shapes found)
results in an informational warning being logged.

**Verified by:**

- Empty shapes extraction produces info warning
- No matching rules produces info warning

</details>

<details>
<summary>Extraction methods are normalized for dispatch (2 scenarios)</summary>

#### Extraction methods are normalized for dispatch

The extraction method column can be written in various formats
and is normalized before dispatch.

**Verified by:**

- Normalize various extraction method formats
- Unknown extraction method produces warning

</details>

### RobustnessIntegration

[View RobustnessIntegration source](tests/features/doc-generation/robustness-integration.feature)

**Context:** Document generation pipeline needs validation, deduplication, and
warning collection to work together correctly for production use.

**Approach:** Integration tests verify the full pipeline with all robustness
features enabled, ensuring validation runs first, deduplication merges content,
and warnings are collected across stages.

<details>
<summary>Validation runs before extraction in the pipeline (3 scenarios)</summary>

#### Validation runs before extraction in the pipeline

**Invariant:** Validation must complete and pass before extraction begins.

**Rationale:** Prevents wasted extraction work and provides clear fail-fast behavior.

**Verified by:**

- Valid decision document generates successfully
- Invalid mapping halts pipeline before extraction
- Multiple validation errors are reported together
- @acceptance-criteria scenarios below.

  The validation layer must run first and halt the pipeline if errors
  are found

- preventing wasted extraction work.

</details>

<details>
<summary>Deduplication runs after extraction before assembly (2 scenarios)</summary>

#### Deduplication runs after extraction before assembly

**Invariant:** Deduplication processes all extracted content before document assembly.

**Rationale:** All sources must be extracted to identify cross-source duplicates.

**Verified by:**

- Duplicate content is removed from final output
- Non-duplicate sections are preserved
- @acceptance-criteria scenarios below.

  Content from all sources is extracted first

- then deduplicated
- then assembled into the final document.

</details>

<details>
<summary>Warnings from all stages are collected and reported (2 scenarios)</summary>

#### Warnings from all stages are collected and reported

**Invariant:** Warnings from all pipeline stages are aggregated in the result.

**Rationale:** Users need visibility into non-fatal issues without blocking generation.

**Verified by:**

- Warnings are collected across pipeline stages
- Warnings do not prevent successful generation
- @acceptance-criteria scenarios below.

  Non-fatal issues from validation

- extraction
- and deduplication are
  collected and included in the result.

</details>

<details>
<summary>Pipeline provides actionable error messages (3 scenarios)</summary>

#### Pipeline provides actionable error messages

**Invariant:** Error messages include context and fix suggestions.

**Rationale:** Users should fix issues in one iteration without guessing.

**Verified by:**

- File not found error includes fix suggestion
- Invalid method error includes valid alternatives
- Extraction error includes source context
- @acceptance-criteria scenarios below.

  Errors include enough context for users to understand and fix the issue.

</details>

<details>
<summary>Existing decision documents continue to work (2 scenarios)</summary>

#### Existing decision documents continue to work

**Invariant:** Valid existing decision documents generate without new errors.

**Rationale:** Robustness improvements must be backward compatible.

**Verified by:**

- PoC decision document still generates
- Process Guard decision document still generates
- @acceptance-criteria scenarios below.

  The robustness improvements must not break existing valid decision
  documents that worked with the PoC.

</details>

### PocIntegration

[View PocIntegration source](tests/features/doc-generation/poc-integration.feature)

End-to-end integration tests that exercise the full documentation generation
pipeline using the actual POC decision document and real source files.

This validates that all 11 source mappings from the POC decision document
work correctly with real project files.

<details>
<summary>POC decision document is parsed correctly (2 scenarios)</summary>

#### POC decision document is parsed correctly

**Verified by:**

- Load actual POC decision document
- Source mappings include all extraction types

</details>

<details>
<summary>Self-references extract content from POC decision (3 scenarios)</summary>

#### Self-references extract content from POC decision

**Verified by:**

- Extract Context rule from THIS DECISION
- Extract Decision rule from THIS DECISION
- Extract DocStrings from THIS DECISION

</details>

<details>
<summary>TypeScript shapes are extracted from real files (3 scenarios)</summary>

#### TypeScript shapes are extracted from real files

**Verified by:**

- Extract shapes from types.ts
- Extract shapes from decider.ts
- Extract createViolation patterns from decider.ts

</details>

<details>
<summary>Behavior spec content is extracted correctly (2 scenarios)</summary>

#### Behavior spec content is extracted correctly

**Verified by:**

- Extract Rule blocks from process-guard.feature
- Extract Scenario Outline Examples from process-guard-linter.feature

</details>

<details>
<summary>JSDoc sections are extracted from CLI files (1 scenarios)</summary>

#### JSDoc sections are extracted from CLI files

**Verified by:**

- Extract JSDoc from lint-process.ts

</details>

<details>
<summary>All source mappings execute successfully (1 scenarios)</summary>

#### All source mappings execute successfully

**Verified by:**

- Execute all 11 source mappings from POC

</details>

<details>
<summary>Compact output generates correctly (2 scenarios)</summary>

#### Compact output generates correctly

**Verified by:**

- Generate compact output from POC
- Compact output contains essential sections

</details>

<details>
<summary>Detailed output generates correctly (2 scenarios)</summary>

#### Detailed output generates correctly

**Verified by:**

- Generate detailed output from POC
- Detailed output contains full content

</details>

<details>
<summary>Generated output matches quality expectations (2 scenarios)</summary>

#### Generated output matches quality expectations

**Verified by:**

- Compact output matches target structure
- Validation rules are complete in output

</details>

### DecisionDocGeneratorTesting

[View DecisionDocGeneratorTesting source](tests/features/doc-generation/decision-doc-generator.feature)

The Decision Doc Generator orchestrates the full documentation generation
pipeline from decision documents (ADR/PDR in .feature format):

1. Decision parsing - Extract source mappings, rules, DocStrings
2. Source mapping - Aggregate content from TypeScript, Gherkin, decision sources
3. Content assembly - Build RenderableDocument from aggregated sections
4. Multi-level output - Generate compact and detailed versions

<details>
<summary>Output paths are determined from pattern metadata (3 scenarios)</summary>

#### Output paths are determined from pattern metadata

The generator computes output paths based on pattern name and optional
section configuration. Compact output goes to \_claude-md/, detailed to docs/.

**Verified by:**

- Default output paths for pattern
- Custom section for compact output
- CamelCase pattern converted to kebab-case

</details>

<details>
<summary>Compact output includes only essential content (3 scenarios)</summary>

#### Compact output includes only essential content

Summary/compact output is limited to ~50 lines and includes only
essential tables and type definitions for Claude context files.

**Verified by:**

- Compact output excludes full descriptions
- Compact output includes type shapes
- Compact output handles empty content

</details>

<details>
<summary>Detailed output includes full content (3 scenarios)</summary>

#### Detailed output includes full content

Detailed output is ~300 lines and includes everything: JSDoc, examples,
full descriptions, and all extracted content.

**Verified by:**

- Detailed output includes all sections
- Detailed output includes consequences
- Detailed output includes DocStrings as code blocks

</details>

<details>
<summary>Multi-level generation produces both outputs (2 scenarios)</summary>

#### Multi-level generation produces both outputs

The generator can produce both compact and detailed outputs in a single
pass for maximum utility.

**Verified by:**

- Generate both compact and detailed outputs
- Pattern name falls back to pattern.name

</details>

<details>
<summary>Generator is registered with the registry (3 scenarios)</summary>

#### Generator is registered with the registry

The generator is available in the registry under the name "doc-from-decision"
and can be invoked through the standard generator interface.

**Verified by:**

- Generator is registered with correct name
- Generator filters patterns by source mapping presence
- Generator processes patterns with source mappings

</details>

<details>
<summary>Source mappings are executed during generation (2 scenarios)</summary>

#### Source mappings are executed during generation

Decision documents with source mapping tables trigger content aggregation
from the referenced files during the generation process.

**Verified by:**

- Source mappings are executed
- Missing source files are reported as validation errors

</details>

### DecisionDocCodecTesting

[View DecisionDocCodecTesting source](tests/features/doc-generation/decision-doc-codec.feature)

Validates the Decision Doc Codec that parses decision documents (ADR/PDR
in .feature format) and extracts content for documentation generation.

<details>
<summary>Rule blocks are partitioned by semantic prefix (2 scenarios)</summary>

#### Rule blocks are partitioned by semantic prefix

Decision documents use Rule: blocks with semantic prefixes to organize
content into Context, Decision, and Consequences sections (standard ADR
format). Additional rules (like "Proof of Concept") are classified as other.

**Verified by:**

- Partition rules into ADR sections
- Non-standard rules go to other category

</details>

<details>
<summary>DocStrings are extracted with language tags (3 scenarios)</summary>

#### DocStrings are extracted with language tags

Decision documents contain code examples as Gherkin DocStrings.

**Verified by:**

- Extract single DocString
- Extract multiple DocStrings
- DocString without language defaults to text

</details>

<details>
<summary>Source mapping tables are parsed from rule descriptions (2 scenarios)</summary>

#### Source mapping tables are parsed from rule descriptions

Decision documents define source mappings in markdown tables.

**Verified by:**

- Parse basic source mapping table
- No source mapping returns empty

</details>

<details>
<summary>Self-reference markers are correctly detected (5 scenarios)</summary>

#### Self-reference markers are correctly detected

Source files can reference the current decision document using special
markers like "THIS DECISION", "THIS DECISION (Rule: X)", etc.

**Verified by:**

- Detect THIS DECISION marker
- Detect THIS DECISION with Rule
- Regular file path is not self-reference
- Parse self-reference types
- Parse self-reference with rule name

</details>

<details>
<summary>Extraction methods are normalized to known types (3 scenarios)</summary>

#### Extraction methods are normalized to known types

The extraction method column can be written in various formats.

**Verified by:**

- Normalize Decision rule description
- Normalize extract-shapes
- Normalize unknown method

</details>

<details>
<summary>Complete decision documents are parsed with all content (1 scenarios)</summary>

#### Complete decision documents are parsed with all content

The parseDecisionDocument function extracts all content from an ADR/PDR.

**Verified by:**

- Parse complete decision document

</details>

<details>
<summary>Rules can be found by name with partial matching (3 scenarios)</summary>

#### Rules can be found by name with partial matching

Self-references may not have an exact rule name match.

**Verified by:**

- Find rule by exact name
- Find rule by partial name
- Rule not found returns undefined

</details>

### ContentDeduplication

[View ContentDeduplication source](tests/features/doc-generation/content-deduplication.feature)

**Context:** Multiple sources may extract identical content, leading to
duplicate sections in generated documentation.

**Approach:** Use SHA-256 fingerprinting to detect duplicates, merge based
on source priority, and preserve original section order after deduplication.

<details>
<summary>Duplicate detection uses content fingerprinting (4 scenarios)</summary>

#### Duplicate detection uses content fingerprinting

**Invariant:** Content with identical normalized text must produce identical fingerprints.

**Rationale:** Fingerprinting enables efficient duplicate detection without full text comparison.

**Verified by:**

- Identical content produces same fingerprint
- Whitespace differences are normalized
- Different content produces different fingerprints
- Similar headers with different content are preserved
- @acceptance-criteria scenarios below.

  Content fingerprints are computed from normalized text

- ignoring whitespace
  differences and minor formatting variations.

</details>

<details>
<summary>Duplicates are merged based on source priority (3 scenarios)</summary>

#### Duplicates are merged based on source priority

**Invariant:** Higher-priority sources take precedence when merging duplicate content.

**Rationale:** TypeScript sources have richer JSDoc; feature files provide behavioral context.

**Verified by:**

- TypeScript source takes priority over feature file
- Richer content takes priority when sources equal
- Source attribution is added to merged content
- @acceptance-criteria scenarios below.

  The merge strategy determines which content to keep based on source file
  priority and content richness once duplicates are detected.

</details>

<details>
<summary>Section order is preserved after deduplication (2 scenarios)</summary>

#### Section order is preserved after deduplication

**Invariant:** Section order matches the source mapping table order after deduplication.

**Rationale:** Predictable ordering ensures consistent documentation structure.

**Verified by:**

- Original order maintained after dedup
- Empty sections after dedup are removed
- @acceptance-criteria scenarios below.

  The order of sections in the source mapping table is preserved even
  after duplicates are removed.

</details>

<details>
<summary>Deduplicator integrates with source mapper pipeline (1 scenarios)</summary>

#### Deduplicator integrates with source mapper pipeline

**Invariant:** Deduplication runs after extraction and before document assembly.

**Rationale:** All content must be extracted before duplicates can be identified.

**Verified by:**

- Deduplication happens in pipeline
- @acceptance-criteria scenarios below.

  The deduplicator is called after all extractions complete but before
  the RenderableDocument is assembled.

</details>

### TransformDatasetTesting

[View TransformDatasetTesting source](tests/features/behavior/transform-dataset.feature)

The transformToMasterDataset function transforms raw extracted patterns
into a MasterDataset with all pre-computed views in a single pass.
This is the core of the unified transformation pipeline.

**Problem:**

- Generators need multiple views of the same pattern data
- Computing views lazily leads to O(n\*v) complexity
- Views must be consistent with each other

**Solution:**

- Single-pass transformation computes all views in O(n)
- All views are immutable and pre-computed
- MasterDataset is the source of truth for all generators

### RichContentHelpersTesting

[View RichContentHelpersTesting source](tests/features/behavior/rich-content-helpers.feature)

As a document codec author
I need helpers to render Gherkin rich content
So that DataTables, DocStrings, and scenarios render consistently across codecs

The helpers handle edge cases like:

- Unclosed DocStrings (fallback to plain paragraph)
- Windows CRLF line endings (normalized to LF)
- Empty inputs (graceful handling)
- Missing table cells (empty string fallback)

<details>
<summary>DocString parsing handles edge cases (6 scenarios)</summary>

#### DocString parsing handles edge cases

**Verified by:**

- Empty description returns empty array
- Description with no DocStrings returns single paragraph
- Single DocString parses correctly
- DocString without language hint uses text
- Unclosed DocString returns plain paragraph fallback
- Windows CRLF line endings are normalized

</details>

<details>
<summary>DataTable rendering produces valid markdown (3 scenarios)</summary>

#### DataTable rendering produces valid markdown

**Verified by:**

- Single row DataTable renders correctly
- Multi-row DataTable renders correctly
- Missing cell values become empty strings

</details>

<details>
<summary>Scenario content rendering respects options (3 scenarios)</summary>

#### Scenario content rendering respects options

**Verified by:**

- Render scenario with steps
- Skip steps when includeSteps is false
- Render scenario with DataTable in step

</details>

<details>
<summary>Business rule rendering handles descriptions (3 scenarios)</summary>

#### Business rule rendering handles descriptions

**Verified by:**

- Rule with simple description
- Rule with no description
- Rule with embedded DocString in description

</details>

<details>
<summary>DocString content is dedented when parsed (4 scenarios)</summary>

#### DocString content is dedented when parsed

**Verified by:**

- Code block preserves internal relative indentation
- Empty lines in code block are preserved
- Trailing whitespace is trimmed from each line
- Code with mixed indentation is preserved

</details>

### UniversalMarkdownRenderer

[View UniversalMarkdownRenderer source](tests/features/behavior/render.feature)

The universal renderer converts RenderableDocument to markdown.
It is a "dumb printer" with no domain knowledge - all logic lives in codecs.

### RemainingWorkSummaryAccuracy

[View RemainingWorkSummaryAccuracy source](tests/features/behavior/remaining-work-totals.feature)

Summary totals in REMAINING-WORK.md must match the sum of phase table rows.
The backlog calculation must correctly identify patterns without phases
using pattern.id (which is always defined) rather than patternName.

<details>
<summary>Summary totals equal sum of phase table rows (2 scenarios)</summary>

#### Summary totals equal sum of phase table rows

**Verified by:**

- Summary matches phase table with all patterns having phases
- Summary includes completed patterns correctly

</details>

<details>
<summary>Patterns without phases appear in Backlog row (2 scenarios)</summary>

#### Patterns without phases appear in Backlog row

**Verified by:**

- Summary includes backlog patterns without phase
- All patterns in backlog when none have phases

</details>

<details>
<summary>Patterns without patternName are counted using id (2 scenarios)</summary>

#### Patterns without patternName are counted using id

**Verified by:**

- Patterns with undefined patternName counted correctly
- Mixed patterns with and without patternName

</details>

<details>
<summary>All phases with incomplete patterns are shown (2 scenarios)</summary>

#### All phases with incomplete patterns are shown

**Verified by:**

- Multiple phases shown in order
- Completed phases not shown in remaining work

</details>

### RemainingWorkEnhancement

[View RemainingWorkEnhancement source](tests/features/behavior/remaining-work-enhancement.feature)

Enhanced REMAINING-WORK.md generation with priority-based sorting,
quarter grouping, and progressive disclosure for better session planning.

**Problem:**

- Flat phase lists make it hard to identify what to work on next
- No visibility into relative urgency or importance of phases
- Large backlogs overwhelm planners with too much information at once
- Quarter-based planning requires manual grouping of phases
- Effort estimates are not factored into prioritization decisions

**Solution:**

- Priority-based sorting surfaces critical/high-priority work first
- Quarter grouping organizes planned work into time-based buckets
- Progressive disclosure shows summary with link to full backlog details
- Effort parsing enables sorting by estimated work duration
- Visual priority icons provide at-a-glance urgency indicators

### PrChangesGeneration

[View PrChangesGeneration source](tests/features/behavior/pr-changes-generation.feature)

The delivery process generates PR-CHANGES.md from active or completed phases,
formatted for PR descriptions, code reviews, and release notes.

**Problem:**

- PR descriptions are manually written, often incomplete or inconsistent
- Reviewers lack structured view of what changed and why
- Deliverable completion status scattered across feature files
- Dependency relationships between phases hidden from reviewers

**Solution:**

- Auto-generate PR-CHANGES.md with summary statistics and phase-grouped changes
- Include both active and completed phases (roadmap phases excluded)
- Filter by release version (releaseFilter) to show matching deliverables
- Surface deliverables inline with each pattern
- Include review checklist with standard code quality items
- Include dependency section showing what patterns enable or require

### PatternsCodecTesting

[View PatternsCodecTesting source](tests/features/behavior/patterns-codec.feature)

The PatternsDocumentCodec transforms MasterDataset into a RenderableDocument
for generating PATTERNS.md and category detail files.

**Problem:**

- Need to generate a comprehensive pattern registry from extracted patterns
- Output should include progress tracking, navigation, and categorization

**Solution:**

- Codec transforms MasterDataset → RenderableDocument in a single decode call
- Generates main document with optional category detail files

### ImplementationLinkPathNormalization

[View ImplementationLinkPathNormalization source](tests/features/behavior/implementation-links.feature)

Links to implementation files in generated pattern documents should have
correct relative paths. Repository prefixes like "libar-platform/" must
be stripped to produce valid links from the output directory.

<details>
<summary>Repository prefixes are stripped from implementation paths (3 scenarios)</summary>

#### Repository prefixes are stripped from implementation paths

**Verified by:**

- Strip libar-platform prefix from implementation paths
- Strip monorepo prefix from implementation paths
- Preserve paths without repository prefix

</details>

<details>
<summary>All implementation links in a pattern are normalized (1 scenarios)</summary>

#### All implementation links in a pattern are normalized

**Verified by:**

- Multiple implementations with mixed prefixes

</details>

<details>
<summary>normalizeImplPath strips known prefixes (4 scenarios)</summary>

#### normalizeImplPath strips known prefixes

**Verified by:**

- Strips libar-platform/ prefix
- Strips monorepo/ prefix
- Returns unchanged path without known prefix
- Only strips prefix at start of path

</details>

### ExtractSummary

[View ExtractSummary source](tests/features/behavior/extract-summary.feature)

The extractSummary function transforms multi-line pattern descriptions into
concise, single-line summaries suitable for table display in generated docs.

**Key behaviors:**

- Combines multiple lines until finding a complete sentence
- Truncates at sentence boundaries when possible
- Adds "..." for incomplete text (no sentence ending)
- Skips tautological first lines (just the pattern name)
- Skips section header labels like "Problem:", "Solution:"

<details>
<summary>Single-line descriptions are returned as-is when complete (2 scenarios)</summary>

#### Single-line descriptions are returned as-is when complete

**Verified by:**

- Complete sentence on single line
- Single line without sentence ending gets ellipsis

</details>

<details>
<summary>Multi-line descriptions are combined until sentence ending (4 scenarios)</summary>

#### Multi-line descriptions are combined until sentence ending

**Verified by:**

- Two lines combine into complete sentence
- Combines lines up to sentence boundary within limit
- Long multi-line text truncates when exceeds limit
- Multi-line without sentence ending gets ellipsis

</details>

<details>
<summary>Long descriptions are truncated at sentence or word boundaries (2 scenarios)</summary>

#### Long descriptions are truncated at sentence or word boundaries

**Verified by:**

- Long text truncates at sentence boundary within limit
- Long text without sentence boundary truncates at word with ellipsis

</details>

<details>
<summary>Tautological and header lines are skipped (3 scenarios)</summary>

#### Tautological and header lines are skipped

**Verified by:**

- Skips pattern name as first line
- Skips section header labels
- Skips multiple header patterns

</details>

<details>
<summary>Edge cases are handled gracefully (5 scenarios)</summary>

#### Edge cases are handled gracefully

**Verified by:**

- Empty description returns empty string
- Markdown headers are stripped
- Bold markdown is stripped
- Multiple sentence endings - takes first complete sentence
- Question mark as sentence ending

</details>

### DescriptionQualityFoundation

[View DescriptionQualityFoundation source](tests/features/behavior/description-quality-foundation.feature)

Enhanced documentation generation with human-readable names,
behavior file verification, and numbered acceptance criteria for PRD quality.

**Problem:**

- CamelCase pattern names (e.g., "RemainingWorkEnhancement") are hard to read
- File extensions like ".md" incorrectly trigger sentence-ending detection
- Business value tags with hyphens display as "enable-rich-prd" instead of readable text
- No way to verify behavior file traceability during extraction
- PRD acceptance criteria lack visual structure and numbering

**Solution:**

- Transform CamelCase to title case ("Remaining Work Enhancement")
- Skip file extension patterns when detecting sentence boundaries
- Convert hyphenated business values to readable phrases
- Verify behavior file existence during pattern extraction
- Number acceptance criteria and bold Given/When/Then keywords in PRD output

### DescriptionHeaderNormalization

[View DescriptionHeaderNormalization source](tests/features/behavior/description-headers.feature)

Pattern descriptions should not create duplicate headers when rendered.
If directive descriptions start with markdown headers, those headers
should be stripped before rendering under the "Description" section.

<details>
<summary>Leading headers are stripped from pattern descriptions (3 scenarios)</summary>

#### Leading headers are stripped from pattern descriptions

**Verified by:**

- Strip single leading markdown header
- Strip multiple leading headers
- Preserve description without leading header

</details>

<details>
<summary>Edge cases are handled correctly (3 scenarios)</summary>

#### Edge cases are handled correctly

**Verified by:**

- Empty description after stripping headers
- Description with only whitespace and headers
- Header in middle of description is preserved

</details>

<details>
<summary>stripLeadingHeaders removes only leading headers (6 scenarios)</summary>

#### stripLeadingHeaders removes only leading headers

**Verified by:**

- Strips h1 header
- Strips h2 through h6 headers
- Strips leading empty lines before header
- Preserves content starting with text
- Returns empty string for header-only input
- Handles null/undefined input

</details>

### ZodCodecMigration

[View ZodCodecMigration source](tests/features/behavior/codec-migration.feature)

All JSON parsing and serialization uses type-safe Zod codec pattern,
replacing raw JSON.parse/stringify with single-step validated operations.

**Problem:**

- Raw JSON.parse returns unknown/any types, losing type safety at runtime
- JSON.stringify doesn't validate output matches expected schema
- Error handling for malformed JSON scattered across codebase
- No structured validation errors with field-level details
- $schema fields from JSON Schema files cause Zod strict mode failures

**Solution:**

- Input codec (createJsonInputCodec) combines parsing + validation in one step
- Output codec (createJsonOutputCodec) validates before serialization
- Structured CodecError type with operation, source, and validation details
- $schema stripping before validation for JSON Schema compatibility
- formatCodecError utility for consistent human-readable error output

### MermaidRelationshipRendering

[View MermaidRelationshipRendering source](tests/features/behavior/pattern-relationships/mermaid-rendering.feature)

Tests for rendering all relationship types in Mermaid dependency graphs
with distinct visual styles per relationship semantics.

<details>
<summary>Each relationship type has a distinct arrow style (4 scenarios)</summary>

#### Each relationship type has a distinct arrow style

**Verified by:**

- Uses relationships render as solid arrows
- Depends-on relationships render as dashed arrows
- Implements relationships render as dotted arrows
- Extends relationships render as solid open arrows

</details>

<details>
<summary>Pattern names are sanitized for Mermaid node IDs (1 scenarios)</summary>

#### Pattern names are sanitized for Mermaid node IDs

**Verified by:**

- Special characters are replaced

</details>

<details>
<summary>All relationship types appear in single graph (1 scenarios)</summary>

#### All relationship types appear in single graph

**Verified by:**

- Complete dependency graph with all relationship types

</details>

### LayeredDiagramGeneration

[View LayeredDiagramGeneration source](tests/features/behavior/architecture-diagrams/layered-diagram.feature)

As a documentation generator
I want to generate layered architecture diagrams from metadata
So that system architecture is visualized by layer hierarchy

<details>
<summary>Layered diagrams group patterns by arch-layer (1 scenarios)</summary>

#### Layered diagrams group patterns by arch-layer

Patterns with arch-layer are grouped into Mermaid subgraphs.
Each layer becomes a visual container.

**Verified by:**

- Generate subgraphs for each layer

</details>

<details>
<summary>Layer order is domain to infrastructure (top to bottom) (1 scenarios)</summary>

#### Layer order is domain to infrastructure (top to bottom)

The layer subgraphs are rendered in Clean Architecture order:
domain at top, then application, then infrastructure at bottom.
This reflects the dependency rule: outer layers depend on inner layers.

**Verified by:**

- Layers render in correct order

</details>

<details>
<summary>Context labels included in layered diagram nodes (1 scenarios)</summary>

#### Context labels included in layered diagram nodes

Unlike component diagrams which group by context, layered diagrams
include the context as a label in each node name.

**Verified by:**

- Nodes include context labels

</details>

<details>
<summary>Patterns without layer go to Other subgraph (1 scenarios)</summary>

#### Patterns without layer go to Other subgraph

Patterns that have arch-role or arch-context but no arch-layer
are grouped into an "Other" subgraph.

**Verified by:**

- Unlayered patterns in Other subgraph

</details>

<details>
<summary>Layered diagram includes summary section (1 scenarios)</summary>

#### Layered diagram includes summary section

The generated document starts with an overview section
specific to layered architecture visualization.

**Verified by:**

- Summary section for layered view

</details>

### ArchGeneratorRegistration

[View ArchGeneratorRegistration source](tests/features/behavior/architecture-diagrams/generator-registration.feature)

As a CLI user
I want an architecture generator registered in the generator registry
So that I can run pnpm docs:architecture to generate diagrams

<details>
<summary>Architecture generator is registered in the registry (1 scenarios)</summary>

#### Architecture generator is registered in the registry

The architecture generator must be registered like other built-in
generators so it can be invoked via CLI.

**Verified by:**

- Generator is available in registry

</details>

<details>
<summary>Architecture generator produces component diagram by default (1 scenarios)</summary>

#### Architecture generator produces component diagram by default

Running the architecture generator without options produces
a component diagram (bounded context view).

**Verified by:**

- Default generation produces component diagram

</details>

<details>
<summary>Architecture generator supports diagram type options (1 scenarios)</summary>

#### Architecture generator supports diagram type options

The generator accepts options to specify diagram type
(component or layered).

**Verified by:**

- Generate layered diagram with options

</details>

<details>
<summary>Architecture generator supports context filtering (1 scenarios)</summary>

#### Architecture generator supports context filtering

The generator can filter to specific bounded contexts
for focused diagram output.

**Verified by:**

- Filter to specific contexts

</details>

### ComponentDiagramGeneration

[View ComponentDiagramGeneration source](tests/features/behavior/architecture-diagrams/component-diagram.feature)

As a documentation generator
I want to generate component diagrams from architecture metadata
So that system architecture is automatically visualized with bounded context subgraphs

<details>
<summary>Component diagrams group patterns by bounded context (1 scenarios)</summary>

#### Component diagrams group patterns by bounded context

Patterns with arch-context are grouped into Mermaid subgraphs.
Each bounded context becomes a visual container.

**Verified by:**

- Generate subgraphs for bounded contexts

</details>

<details>
<summary>Context-less patterns go to Shared Infrastructure (1 scenarios)</summary>

#### Context-less patterns go to Shared Infrastructure

Patterns without arch-context are grouped into a
"Shared Infrastructure" subgraph.

**Verified by:**

- Shared infrastructure subgraph for context-less patterns

</details>

<details>
<summary>Relationship types render with distinct arrow styles (1 scenarios)</summary>

#### Relationship types render with distinct arrow styles

Arrow styles follow UML conventions: - uses: solid arrow (-->) - depends-on: dashed arrow (-.->) - implements: dotted arrow (..->) - extends: open arrow (-->>)

**Verified by:**

- Arrow styles for relationship types

</details>

<details>
<summary>Arrows only connect annotated components (1 scenarios)</summary>

#### Arrows only connect annotated components

Relationships pointing to non-annotated patterns
are not rendered (target would not exist in diagram).

**Verified by:**

- Skip arrows to non-annotated targets

</details>

<details>
<summary>Component diagram includes summary section (1 scenarios)</summary>

#### Component diagram includes summary section

The generated document starts with an overview section
showing component counts and bounded context statistics.

**Verified by:**

- Summary section with counts

</details>

<details>
<summary>Component diagram includes legend when enabled (1 scenarios)</summary>

#### Component diagram includes legend when enabled

The legend explains arrow style meanings for readers.

**Verified by:**

- Legend section with arrow explanations

</details>

<details>
<summary>Component diagram includes inventory table when enabled (1 scenarios)</summary>

#### Component diagram includes inventory table when enabled

The inventory lists all components with their metadata.

**Verified by:**

- Inventory table with component details

</details>

<details>
<summary>Empty architecture data shows guidance message (1 scenarios)</summary>

#### Empty architecture data shows guidance message

If no patterns have architecture annotations,
the document explains how to add them.

**Verified by:**

- No architecture data message

</details>

### ArchTagExtraction

[View ArchTagExtraction source](tests/features/behavior/architecture-diagrams/arch-tag-extraction.feature)

As a documentation generator
I want architecture tags extracted from source code
So that I can generate accurate architecture diagrams

<details>
<summary>arch-role tag is defined in the registry (2 scenarios)</summary>

#### arch-role tag is defined in the registry

Architecture roles classify components for diagram rendering.
Valid roles: command-handler, projection, saga, process-manager,
infrastructure, repository, decider, read-model, bounded-context.

**Verified by:**

- arch-role tag exists with enum format
- arch-role has required enum values

</details>

<details>
<summary>arch-context tag is defined in the registry (1 scenarios)</summary>

#### arch-context tag is defined in the registry

Context tags group components into bounded context subgraphs.
Format is "value" (free-form string like "orders", "inventory").

**Verified by:**

- arch-context tag exists with value format

</details>

<details>
<summary>arch-layer tag is defined in the registry (2 scenarios)</summary>

#### arch-layer tag is defined in the registry

Layer tags enable layered architecture diagrams.
Valid layers: domain, application, infrastructure.

**Verified by:**

- arch-layer tag exists with enum format
- arch-layer has exactly three values

</details>

<details>
<summary>AST parser extracts arch-role from TypeScript annotations (2 scenarios)</summary>

#### AST parser extracts arch-role from TypeScript annotations

The AST parser must extract arch-role alongside other pattern metadata.

**Verified by:**

- Extract arch-role projection
- Extract arch-role command-handler

</details>

<details>
<summary>AST parser extracts arch-context from TypeScript annotations (2 scenarios)</summary>

#### AST parser extracts arch-context from TypeScript annotations

Context values are free-form strings naming the bounded context.

**Verified by:**

- Extract arch-context orders
- Extract arch-context inventory

</details>

<details>
<summary>AST parser extracts arch-layer from TypeScript annotations (2 scenarios)</summary>

#### AST parser extracts arch-layer from TypeScript annotations

Layer tags classify components by architectural layer.

**Verified by:**

- Extract arch-layer application
- Extract arch-layer infrastructure

</details>

<details>
<summary>AST parser handles multiple arch tags together (1 scenarios)</summary>

#### AST parser handles multiple arch tags together

Components often have role + context + layer together.

**Verified by:**

- Extract all three arch tags

</details>

<details>
<summary>Missing arch tags yield undefined values (1 scenarios)</summary>

#### Missing arch tags yield undefined values

Components without arch tags should have undefined (not null or empty).

**Verified by:**

- Missing arch tags are undefined

</details>

### ArchIndexDataset

[View ArchIndexDataset source](tests/features/behavior/architecture-diagrams/arch-index.feature)

As a documentation generator
I want an archIndex built during dataset transformation
So that I can efficiently look up patterns by role, context, and layer

<details>
<summary>archIndex groups patterns by arch-role (1 scenarios)</summary>

#### archIndex groups patterns by arch-role

The archIndex.byRole map groups patterns by their architectural role
(command-handler, projection, saga, etc.) for efficient lookup.

**Verified by:**

- Group patterns by role

</details>

<details>
<summary>archIndex groups patterns by arch-context (1 scenarios)</summary>

#### archIndex groups patterns by arch-context

The archIndex.byContext map groups patterns by bounded context
for subgraph rendering in component diagrams.

**Verified by:**

- Group patterns by context

</details>

<details>
<summary>archIndex groups patterns by arch-layer (1 scenarios)</summary>

#### archIndex groups patterns by arch-layer

The archIndex.byLayer map groups patterns by architectural layer
(domain, application, infrastructure) for layered diagram rendering.

**Verified by:**

- Group patterns by layer

</details>

<details>
<summary>archIndex.all contains all patterns with any arch tag (1 scenarios)</summary>

#### archIndex.all contains all patterns with any arch tag

The archIndex.all array contains all patterns that have at least
one arch tag (role, context, or layer). Patterns without any arch
tags are excluded.

**Verified by:**

- archIndex.all includes all annotated patterns

</details>

<details>
<summary>Patterns without arch tags are excluded from archIndex (1 scenarios)</summary>

#### Patterns without arch tags are excluded from archIndex

Patterns that have no arch-role, arch-context, or arch-layer are
not included in the archIndex at all.

**Verified by:**

- Non-annotated patterns excluded

</details>

### TimelineCodecTesting

[View TimelineCodecTesting source](tests/features/behavior/codecs/timeline-codecs.feature)

The timeline codecs (RoadmapDocumentCodec, CompletedMilestonesCodec, CurrentWorkCodec)
transform MasterDataset into RenderableDocuments for different timeline views.

**Problem:**

- Need to generate roadmap, milestones, and current work documents from patterns
- Each view requires different filtering and grouping logic

**Solution:**

- Three specialized codecs for different timeline perspectives
- Shared phase grouping with status-specific filtering

<details>
<summary>RoadmapDocumentCodec groups patterns by phase with progress tracking (8 scenarios)</summary>

#### RoadmapDocumentCodec groups patterns by phase with progress tracking

**Verified by:**

- Decode empty dataset produces minimal roadmap
- Decode dataset with multiple phases
- Progress section shows correct status counts
- Phase navigation table with progress
- Phase sections show pattern tables
- Generate phase detail files when enabled
- No detail files when disabled
- Quarterly timeline shown when quarters exist

</details>

<details>
<summary>CompletedMilestonesCodec shows only completed patterns grouped by quarter (6 scenarios)</summary>

#### CompletedMilestonesCodec shows only completed patterns grouped by quarter

**Verified by:**

- No completed patterns produces empty message
- Summary shows completed counts
- Quarterly navigation with completed patterns
- Completed phases shown in collapsible sections
- Recent completions section with limit
- Generate quarterly detail files when enabled

</details>

<details>
<summary>CurrentWorkCodec shows only active patterns with deliverables (6 scenarios)</summary>

#### CurrentWorkCodec shows only active patterns with deliverables

**Verified by:**

- No active work produces empty message
- Summary shows overall progress
- Active phases with progress bars
- Deliverables rendered when configured
- All active patterns table
- Generate current work detail files when enabled

</details>

### ShapeSelectorTesting

[View ShapeSelectorTesting source](tests/features/behavior/codecs/shape-selector.feature)

Tests the filterShapesBySelectors function that provides fine-grained
shape selection via structural discriminated union selectors.

#### Reference doc configs select shapes via shapeSelectors

**Invariant:** shapeSelectors provides three selection modes: by source path + specific names, by group tag, or by source path alone.

**Verified by:**

- Select specific shapes by source and names
- Select all shapes in a group
- Select all tagged shapes from a source file
- shapeSources without shapeSelectors returns all shapes
- Select by source and names
- Select by group
- Select by source alone
- shapeSources backward compatibility preserved

### ShapeMatcherTesting

[View ShapeMatcherTesting source](tests/features/behavior/codecs/shape-matcher.feature)

Matches file paths against glob patterns for TypeScript shape extraction.
Uses in-memory string matching (no filesystem access) per AD-6.

<details>
<summary>Exact paths match without wildcards (2 scenarios)</summary>

#### Exact paths match without wildcards

**Verified by:**

- Exact path matches identical path
- Exact path does not match different path

</details>

<details>
<summary>Single-level globs match one directory level (3 scenarios)</summary>

#### Single-level globs match one directory level

**Verified by:**

- Single glob matches file in target directory
- Single glob does not match nested subdirectory
- Single glob does not match wrong extension

</details>

<details>
<summary>Recursive globs match any depth (4 scenarios)</summary>

#### Recursive globs match any depth

**Verified by:**

- Recursive glob matches file at target depth
- Recursive glob matches file at deeper depth
- Recursive glob matches file at top level
- Recursive glob does not match wrong prefix

</details>

<details>
<summary>Dataset shape extraction deduplicates by name (3 scenarios)</summary>

#### Dataset shape extraction deduplicates by name

**Verified by:**

- Shapes are extracted from matching patterns
- Duplicate shape names are deduplicated
- No shapes returned when glob does not match

</details>

### SessionCodecTesting

[View SessionCodecTesting source](tests/features/behavior/codecs/session-codecs.feature)

The session codecs (SessionContextCodec, RemainingWorkCodec)
transform MasterDataset into RenderableDocuments for AI session context
and incomplete work aggregation views.

**Problem:**

- Need to generate session context and remaining work documents from patterns
- Each view requires different filtering, grouping, and prioritization logic

**Solution:**

- Two specialized codecs for session planning perspectives
- SessionContextCodec focuses on current work and phase navigation
- RemainingWorkCodec aggregates incomplete work with priority sorting

#### SessionContextCodec provides working context for AI sessions

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

#### RemainingWorkCodec aggregates incomplete work by phase

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

### RequirementsAdrCodecTesting

[View RequirementsAdrCodecTesting source](tests/features/behavior/codecs/requirements-adr-codecs.feature)

The RequirementsDocumentCodec and AdrDocumentCodec transform MasterDataset
into RenderableDocuments for PRD-style and architecture decision documentation.

**Problem:**

- Need to generate product requirements documents with flexible groupings
- Need to document architecture decisions with status tracking and supersession

**Solution:**

- RequirementsDocumentCodec generates PRD-style docs grouped by product area, user role, or phase
- AdrDocumentCodec generates ADR documentation with category, phase, or date groupings

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

### ReportingCodecTesting

[View ReportingCodecTesting source](tests/features/behavior/codecs/reporting-codecs.feature)

The reporting codecs (ChangelogCodec, TraceabilityCodec, OverviewCodec)
transform MasterDataset into RenderableDocuments for reporting outputs.

**Problem:**

- Need to generate changelog, traceability, and overview documents
- Each view requires different filtering, grouping, and formatting logic

**Solution:**

- Three specialized codecs for different reporting perspectives
- Keep a Changelog format for ChangelogCodec
- Coverage statistics and gap reporting for TraceabilityCodec
- Architecture and summary views for OverviewCodec

<details>
<summary>ChangelogCodec follows Keep a Changelog format (8 scenarios)</summary>

#### ChangelogCodec follows Keep a Changelog format

**Verified by:**

- Decode empty dataset produces changelog header only
- Unreleased section shows active and vNEXT patterns
- Release sections sorted by semver descending
- Quarter fallback for patterns without release
- Earlier section for undated patterns
- Category mapping to change types
- Exclude unreleased when option disabled
- Change type sections follow standard order

</details>

<details>
<summary>TraceabilityCodec maps timeline patterns to behavior tests (8 scenarios)</summary>

#### TraceabilityCodec maps timeline patterns to behavior tests

**Verified by:**

- No timeline patterns produces empty message
- Coverage statistics show totals and percentage
- Coverage gaps table shows missing coverage
- Covered phases in collapsible section
- Exclude gaps when option disabled
- Exclude stats when option disabled
- Exclude covered when option disabled
- Verified behavior files indicated in output

</details>

<details>
<summary>OverviewCodec provides project architecture summary (8 scenarios)</summary>

#### OverviewCodec provides project architecture summary

**Verified by:**

- Decode empty dataset produces minimal overview
- Architecture section from overview-tagged patterns
- Patterns summary with progress bar
- Timeline summary with phase counts
- Exclude architecture when option disabled
- Exclude patterns summary when option disabled
- Exclude timeline summary when option disabled
- Multiple overview patterns create multiple architecture subsections

</details>

### ReferenceGeneratorTesting

[View ReferenceGeneratorTesting source](tests/features/behavior/codecs/reference-generators.feature)

Registers reference document generators from project config. Configs with
`productArea` set are routed to a "product-area-docs" meta-generator;
configs without `productArea` go to "reference-docs". Each config also
produces TWO individual generators (detailed + summary).

<details>
<summary>Registration produces the correct number of generators (1 scenarios)</summary>

#### Registration produces the correct number of generators

**Verified by:**

- Generators are registered from configs plus meta-generators

</details>

<details>
<summary>Product area configs produce a separate meta-generator (1 scenarios)</summary>

#### Product area configs produce a separate meta-generator

**Verified by:**

- Product area meta-generator is registered

</details>

<details>
<summary>Generator naming follows kebab-case convention (2 scenarios)</summary>

#### Generator naming follows kebab-case convention

**Verified by:**

- Detailed generator has name ending in "-reference"
- Summary generator has name ending in "-reference-claude"

</details>

<details>
<summary>Generator execution produces markdown output (2 scenarios)</summary>

#### Generator execution produces markdown output

**Verified by:**

- Product area generator with matching data produces non-empty output
- Product area generator with no patterns still produces intro

</details>

### ReferenceCodecTesting

[View ReferenceCodecTesting source](tests/features/behavior/codecs/reference-codec.feature)

Parameterized codec factory that creates reference document codecs
from configuration objects. Each config replaces one recipe .feature file
and produces a RenderableDocument at configurable detail levels.

<details>
<summary>Empty datasets produce fallback content (1 scenarios)</summary>

#### Empty datasets produce fallback content

**Verified by:**

- Codec with no matching content produces fallback message

</details>

<details>
<summary>Convention content is rendered as sections (2 scenarios)</summary>

#### Convention content is rendered as sections

**Verified by:**

- Convention rules appear as H2 headings with content
- Convention tables are rendered in the document

</details>

<details>
<summary>Detail level controls output density (2 scenarios)</summary>

#### Detail level controls output density

**Verified by:**

- Summary level omits narrative and rationale
- Detailed level includes rationale and verified-by

</details>

<details>
<summary>Behavior sections are rendered from category-matching patterns (1 scenarios)</summary>

#### Behavior sections are rendered from category-matching patterns

**Verified by:**

- Behavior-tagged patterns appear in a Behavior Specifications section

</details>

<details>
<summary>Shape sources are extracted from matching patterns (3 scenarios)</summary>

#### Shape sources are extracted from matching patterns

**Verified by:**

- Shapes appear when source file matches shapeSources glob
- Summary level shows shapes as a compact table
- No shapes when source file does not match glob

</details>

<details>
<summary>Convention and behavior content compose in a single document (1 scenarios)</summary>

#### Convention and behavior content compose in a single document

**Verified by:**

- Both convention and behavior sections appear when data exists

</details>

<details>
<summary>Composition order follows AD-5: conventions then shapes then behaviors (1 scenarios)</summary>

#### Composition order follows AD-5: conventions then shapes then behaviors

**Verified by:**

- Convention headings appear before shapes before behaviors

</details>

<details>
<summary>Convention code examples render as mermaid blocks (2 scenarios)</summary>

#### Convention code examples render as mermaid blocks

**Verified by:**

- Convention with mermaid content produces mermaid block in output
- Summary level omits convention code examples

</details>

<details>
<summary>Scoped diagrams are generated from diagramScope config (10 scenarios)</summary>

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

</details>

<details>
<summary>Multiple diagram scopes produce multiple mermaid blocks (3 scenarios)</summary>

#### Multiple diagram scopes produce multiple mermaid blocks

**Verified by:**

- Config with diagramScopes array produces multiple diagrams
- Diagram direction is reflected in mermaid output
- Legacy diagramScope still works when diagramScopes is absent

</details>

<details>
<summary>Standard detail level includes narrative but omits rationale (1 scenarios)</summary>

#### Standard detail level includes narrative but omits rationale

**Verified by:**

- Standard level includes narrative but omits rationale

</details>

<details>
<summary>Deep behavior rendering with structured annotations (4 scenarios)</summary>

#### Deep behavior rendering with structured annotations

**Verified by:**

- Detailed level renders structured behavior rules
- Standard level renders behavior rules without rationale
- Summary level shows behavior rules as truncated table
- Scenario names and verifiedBy merge as deduplicated list

</details>

<details>
<summary>Shape JSDoc prose renders at standard and detailed levels (3 scenarios)</summary>

#### Shape JSDoc prose renders at standard and detailed levels

**Verified by:**

- Standard level includes JSDoc in code blocks
- Detailed level includes JSDoc in code block and property table
- Shapes without JSDoc render code blocks only

</details>

<details>
<summary>Shape sections render param returns and throws documentation (4 scenarios)</summary>

#### Shape sections render param returns and throws documentation

**Verified by:**

- Detailed level renders param table for function shapes
- Detailed level renders returns and throws documentation
- Standard level renders param table without throws
- Shapes without param docs skip param table

</details>

<details>
<summary>Diagram type controls Mermaid output format (9 scenarios)</summary>

#### Diagram type controls Mermaid output format

**Invariant:** The diagramType field on DiagramScope selects the Mermaid output format. Supported types are graph (flowchart, default), sequenceDiagram, and stateDiagram-v2. Each type produces syntactically valid Mermaid output with type-appropriate node and edge rendering.

**Rationale:** Flowcharts cannot naturally express event flows (sequence), FSM visualization (state), or temporal ordering. Multiple diagram types unlock richer architectural documentation from the same relationship data.

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

</details>

<details>
<summary>Edge labels and custom node shapes enrich diagram readability (4 scenarios)</summary>

#### Edge labels and custom node shapes enrich diagram readability

**Invariant:** Relationship edges display labels describing the relationship type (uses, depends on, implements, extends). Edge labels are enabled by default and can be disabled via showEdgeLabels false. Node shapes in flowchart diagrams vary by archRole value using Mermaid shape syntax.

**Rationale:** Unlabeled edges are ambiguous without consulting a legend. Custom node shapes make archRole visually distinguishable without color reliance, improving accessibility and scanability.

**Verified by:**

- Relationship edges display type labels by default
- Edge labels can be disabled for compact diagrams
- archRole controls Mermaid node shape
- Pattern without archRole uses default rectangle shape
- Edge labels appear by default
- Edge labels can be disabled
- archRole controls node shape
- Unknown archRole falls back to rectangle

</details>

<details>
<summary>Collapsible blocks wrap behavior rules for progressive disclosure (3 scenarios)</summary>

#### Collapsible blocks wrap behavior rules for progressive disclosure

**Invariant:** When a behavior pattern has 3 or more rules and detail level is not summary, each rule's content is wrapped in a collapsible block with the rule name and scenario count in the summary. Patterns with fewer than 3 rules render rules flat. Summary level never produces collapsible blocks.

**Rationale:** Behavior sections with many rules produce substantial content at detailed level. Collapsible blocks enable progressive disclosure so readers can expand only the rules they need.

**Verified by:**

- Behavior pattern with many rules uses collapsible blocks at detailed level
- Behavior pattern with few rules does not use collapsible blocks
- Summary level never produces collapsible blocks
- Many rules use collapsible at detailed level
- Few rules render flat
- Summary level suppresses collapsible

</details>

<details>
<summary>Link-out blocks provide source file cross-references (3 scenarios)</summary>

#### Link-out blocks provide source file cross-references

**Invariant:** At standard and detailed levels, each behavior pattern includes a link-out block referencing its source file path. At summary level, link-out blocks are omitted for compact output.

**Rationale:** Cross-reference links enable readers to navigate from generated documentation to the annotated source files, closing the loop between generated docs and the single source of truth.

**Verified by:**

- Behavior pattern includes source file link-out at detailed level
- Standard level includes source file link-out
- Summary level omits link-out blocks
- Detailed level includes source link-out
- Standard level includes source link-out
- Summary level omits link-out

</details>

<details>
<summary>Include tags route cross-cutting content into reference documents (3 scenarios)</summary>

#### Include tags route cross-cutting content into reference documents

**Invariant:** Patterns with matching include tags appear alongside category-selected patterns in the behavior section. The merging is additive (OR semantics).

**Verified by:**

- Include-tagged pattern appears in behavior section
- Include-tagged pattern is additive with category-selected patterns
- Pattern without matching include tag is excluded

</details>

### PrChangesCodecTesting

[View PrChangesCodecTesting source](tests/features/behavior/codecs/pr-changes-codec.feature)

The PrChangesCodec transforms MasterDataset into RenderableDocument for
PR-scoped documentation. It filters patterns by changed files and/or
release version tags, groups by phase or priority, and generates
review-focused output.

**Problem:**

- Need to generate PR-specific documentation from patterns
- Filters by changed files and release version tags
- Different grouping options (phase, priority, workflow)

**Solution:**

- PrChangesCodec with configurable filtering and grouping
- Generates review checklists and dependency sections
- OR logic for combined filters

<details>
<summary>PrChangesCodec handles empty results gracefully (3 scenarios)</summary>

#### PrChangesCodec handles empty results gracefully

**Verified by:**

- No changes when no patterns match changedFiles filter
- No changes when no patterns match releaseFilter
- No changes with combined filters when nothing matches

</details>

<details>
<summary>PrChangesCodec generates summary with filter information (3 scenarios)</summary>

#### PrChangesCodec generates summary with filter information

**Verified by:**

- Summary section shows pattern counts
- Summary shows release tag when releaseFilter is set
- Summary shows files filter count when changedFiles is set

</details>

<details>
<summary>PrChangesCodec groups changes by phase when sortBy is "phase" (2 scenarios)</summary>

#### PrChangesCodec groups changes by phase when sortBy is "phase"

**Verified by:**

- Changes grouped by phase with default sortBy
- Pattern details shown within phase groups

</details>

<details>
<summary>PrChangesCodec groups changes by priority when sortBy is "priority" (2 scenarios)</summary>

#### PrChangesCodec groups changes by priority when sortBy is "priority"

**Verified by:**

- Changes grouped by priority
- Priority groups show correct patterns

</details>

<details>
<summary>PrChangesCodec shows flat list when sortBy is "workflow" (1 scenarios)</summary>

#### PrChangesCodec shows flat list when sortBy is "workflow"

**Verified by:**

- Flat changes list with workflow sort

</details>

<details>
<summary>PrChangesCodec renders pattern details with metadata and description (3 scenarios)</summary>

#### PrChangesCodec renders pattern details with metadata and description

**Verified by:**

- Pattern detail shows metadata table
- Pattern detail shows business value when available
- Pattern detail shows description

</details>

<details>
<summary>PrChangesCodec renders deliverables when includeDeliverables is enabled (3 scenarios)</summary>

#### PrChangesCodec renders deliverables when includeDeliverables is enabled

**Verified by:**

- Deliverables shown when patterns have deliverables
- Deliverables filtered by release when releaseFilter is set
- No deliverables section when includeDeliverables is disabled

</details>

<details>
<summary>PrChangesCodec renders acceptance criteria from scenarios (2 scenarios)</summary>

#### PrChangesCodec renders acceptance criteria from scenarios

**Verified by:**

- Acceptance criteria rendered when patterns have scenarios
- Acceptance criteria shows scenario steps

</details>

<details>
<summary>PrChangesCodec renders business rules from Gherkin Rule keyword (2 scenarios)</summary>

#### PrChangesCodec renders business rules from Gherkin Rule keyword

**Verified by:**

- Business rules rendered when patterns have rules
- Business rules show rule names and verification info

</details>

<details>
<summary>PrChangesCodec generates review checklist when includeReviewChecklist is enabled (6 scenarios)</summary>

#### PrChangesCodec generates review checklist when includeReviewChecklist is enabled

**Verified by:**

- Review checklist generated with standard items
- Review checklist includes completed patterns item when applicable
- Review checklist includes active work item when applicable
- Review checklist includes dependencies item when patterns have dependencies
- Review checklist includes deliverables item when patterns have deliverables
- No review checklist when includeReviewChecklist is disabled

</details>

<details>
<summary>PrChangesCodec generates dependencies section when includeDependencies is enabled (4 scenarios)</summary>

#### PrChangesCodec generates dependencies section when includeDependencies is enabled

**Verified by:**

- Dependencies section shows depends on relationships
- Dependencies section shows enables relationships
- No dependencies section when patterns have no dependencies
- No dependencies section when includeDependencies is disabled

</details>

<details>
<summary>PrChangesCodec filters patterns by changedFiles (2 scenarios)</summary>

#### PrChangesCodec filters patterns by changedFiles

**Verified by:**

- Patterns filtered by changedFiles match
- changedFiles filter matches partial paths

</details>

<details>
<summary>PrChangesCodec filters patterns by releaseFilter (1 scenarios)</summary>

#### PrChangesCodec filters patterns by releaseFilter

**Verified by:**

- Patterns filtered by release version

</details>

<details>
<summary>PrChangesCodec uses OR logic for combined filters (2 scenarios)</summary>

#### PrChangesCodec uses OR logic for combined filters

**Verified by:**

- Combined filters match patterns meeting either criterion
- Patterns matching both criteria are not duplicated

</details>

<details>
<summary>PrChangesCodec only includes active and completed patterns (2 scenarios)</summary>

#### PrChangesCodec only includes active and completed patterns

**Verified by:**

- Roadmap patterns are excluded
- Deferred patterns are excluded

</details>

### PlanningCodecTesting

[View PlanningCodecTesting source](tests/features/behavior/codecs/planning-codecs.feature)

The planning codecs (PlanningChecklistCodec, SessionPlanCodec, SessionFindingsCodec)
transform MasterDataset into RenderableDocuments for planning and retrospective views.

**Problem:**

- Need to generate planning checklists, session plans, and findings documents from patterns
- Each view requires different filtering, grouping, and content rendering

**Solution:**

- Three specialized codecs for different planning perspectives
- PlanningChecklistCodec prepares for implementation sessions
- SessionPlanCodec generates structured implementation plans
- SessionFindingsCodec captures retrospective discoveries

<details>
<summary>PlanningChecklistCodec prepares for implementation sessions (9 scenarios)</summary>

#### PlanningChecklistCodec prepares for implementation sessions

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

</details>

<details>
<summary>SessionPlanCodec generates implementation plans (8 scenarios)</summary>

#### SessionPlanCodec generates implementation plans

**Verified by:**

- No phases to plan produces empty message
- Summary shows status counts
- Implementation approach from useCases
- Deliverables rendering
- Acceptance criteria with steps
- Business rules section
- statusFilter option for active only
- statusFilter option for planned only

</details>

<details>
<summary>SessionFindingsCodec captures retrospective discoveries (11 scenarios)</summary>

#### SessionFindingsCodec captures retrospective discoveries

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

</details>

### DedentHelper

[View DedentHelper source](tests/features/behavior/codecs/dedent.feature)

The dedent helper function normalizes indentation in code blocks extracted
from DocStrings. It handles various whitespace patterns including tabs,
mixed indentation, and edge cases.

**Problem:**

- DocStrings in Gherkin files have consistent indentation for alignment
- Tab characters vs spaces create inconsistent indentation calculation
- Edge cases like empty lines, all-empty input, single lines need handling

**Solution:**

- Normalize tabs to spaces before calculating minimum indentation
- Handle edge cases gracefully without throwing errors
- Preserve relative indentation after removing common prefix

<details>
<summary>Tabs are normalized to spaces before dedent (2 scenarios)</summary>

#### Tabs are normalized to spaces before dedent

**Verified by:**

- Tab-indented code is properly dedented
- Mixed tabs and spaces are normalized

</details>

<details>
<summary>Empty lines are handled correctly (2 scenarios)</summary>

#### Empty lines are handled correctly

**Verified by:**

- Empty lines with trailing spaces are preserved
- All empty lines returns original text

</details>

<details>
<summary>Single line input is handled (2 scenarios)</summary>

#### Single line input is handled

**Verified by:**

- Single line with indentation is dedented
- Single line without indentation is unchanged

</details>

<details>
<summary>Unicode whitespace is handled (1 scenarios)</summary>

#### Unicode whitespace is handled

**Verified by:**

- Non-breaking space is treated as content

</details>

<details>
<summary>Relative indentation is preserved (2 scenarios)</summary>

#### Relative indentation is preserved

**Verified by:**

- Nested code blocks preserve relative indentation
- Mixed indentation levels are preserved relatively

</details>

### ConventionExtractorTesting

[View ConventionExtractorTesting source](tests/features/behavior/codecs/convention-extractor.feature)

Extracts convention content from MasterDataset decision records
tagged with @libar-docs-convention. Produces structured ConventionBundles
with rule content, tables, and invariant/rationale metadata.

<details>
<summary>Empty and missing inputs produce empty results (2 scenarios)</summary>

#### Empty and missing inputs produce empty results

**Verified by:**

- Empty convention tags returns empty array
- No matching patterns returns empty array

</details>

<details>
<summary>Convention bundles are extracted from matching patterns (3 scenarios)</summary>

#### Convention bundles are extracted from matching patterns

**Verified by:**

- Single pattern with one convention tag produces one bundle
- Pattern with CSV conventions contributes to multiple bundles
- Multiple patterns with same convention merge into one bundle

</details>

<details>
<summary>Structured content is extracted from rule descriptions (2 scenarios)</summary>

#### Structured content is extracted from rule descriptions

**Verified by:**

- Invariant and rationale are extracted from rule description
- Tables in rule descriptions are extracted as structured data

</details>

<details>
<summary>Code examples in rule descriptions are preserved (2 scenarios)</summary>

#### Code examples in rule descriptions are preserved

**Verified by:**

- Mermaid diagram in rule description is extracted as code example
- Rule description without code examples has no code examples field

</details>

<details>
<summary>TypeScript JSDoc conventions are extracted alongside Gherkin (6 scenarios)</summary>

#### TypeScript JSDoc conventions are extracted alongside Gherkin

**Verified by:**

- TypeScript pattern with heading sections produces multiple rules
- TypeScript pattern without headings becomes single rule
- TypeScript and Gherkin conventions merge in same bundle
- TypeScript pattern with convention but empty description
- TypeScript description with tables is extracted correctly
- TypeScript description with code examples

</details>

### CompositeCodecTesting

[View CompositeCodecTesting source](tests/features/behavior/codecs/composite-codec.feature)

Assembles reference documents from multiple codec outputs by
concatenating RenderableDocument sections. Enables building
documents composed from any combination of existing codecs.

<details>
<summary>CompositeCodec concatenates sections in codec array order (2 scenarios)</summary>

#### CompositeCodec concatenates sections in codec array order

**Invariant:** Sections from child codecs appear in the composite output in the same order as the codecs array.

**Verified by:**

- Sections from two codecs appear in order
- Three codecs produce sections in array order

</details>

<details>
<summary>Separators between codec outputs are configurable (2 scenarios)</summary>

#### Separators between codec outputs are configurable

**Invariant:** By default, a separator block is inserted between each child codec's sections. When separateSections is false, no separators are added.

**Verified by:**

- Default separator between sections
- No separator when disabled

</details>

<details>
<summary>additionalFiles merge with last-wins semantics (2 scenarios)</summary>

#### additionalFiles merge with last-wins semantics

**Invariant:** additionalFiles from all children are merged into a single record. When keys collide, the later codec's value wins.

**Verified by:**

- Non-overlapping files merged
- Colliding keys use last-wins

</details>

<details>
<summary>composeDocuments works at document level without codecs (1 scenarios)</summary>

#### composeDocuments works at document level without codecs

**Invariant:** composeDocuments accepts RenderableDocument array and produces a composed RenderableDocument without requiring codecs.

**Verified by:**

- Direct document composition

</details>

<details>
<summary>Empty codec outputs are handled gracefully (1 scenarios)</summary>

#### Empty codec outputs are handled gracefully

**Invariant:** Codecs producing empty sections arrays contribute nothing to the output. No separator is emitted for empty outputs.

**Verified by:**

- Empty codec skipped without separator

</details>

---
