# Annotation Overview

**Purpose:** Annotation product area overview
**Detail Level:** Full reference

---

**How do I annotate code?** The annotation system is the ingestion boundary — it transforms annotated TypeScript and Gherkin files into `ExtractedPattern[]` objects that feed the entire downstream pipeline. Two parallel scanning paths (TypeScript AST + Gherkin parser) converge through dual-source merging. The system is fully data-driven: the `TagRegistry` defines all tags, formats, and categories — adding a new annotation requires only a registry entry, zero parser changes.

## Key Invariants

- Source ownership enforced: `uses`/`used-by`/`category` belong in TypeScript only; `depends-on`/`quarter`/`team`/`phase` belong in Gherkin only. Anti-pattern detector validates at lint time
- Data-driven tag dispatch: Both AST parser and Gherkin parser use `TagRegistry.metadataTags` to determine extraction. 6 format types (`value`/`enum`/`csv`/`number`/`flag`/`quoted-value`) cover all tag shapes — zero parser changes for new tags
- Pipeline data preservation: Gherkin `Rule:` blocks, deliverables, scenarios, and all metadata flow through scanner → extractor → `ExtractedPattern` → generators without data loss
- Dual-source merge with conflict detection: Same pattern name in both TypeScript and Gherkin produces a merge conflict error. Phase mismatches between sources produce validation errors

---

## Scanning & Extraction Boundary

Scoped architecture diagram showing component relationships:

```mermaid
C4Context
    title Scanning & Extraction Boundary
    Boundary(extractor, "Extractor") {
        System(GherkinExtractor, "GherkinExtractor")
        System(DualSourceExtractor, "DualSourceExtractor")
        System(Document_Extractor, "Document Extractor")
    }
    Boundary(scanner, "Scanner") {
        System(Pattern_Scanner, "Pattern Scanner")
        System(GherkinScanner, "GherkinScanner")
        System(GherkinASTParser, "GherkinASTParser")
        System(TypeScript_AST_Parser, "TypeScript AST Parser")
    }
    System_Ext(DocDirectiveSchema, "DocDirectiveSchema")
    System_Ext(GherkinRulesSupport, "GherkinRulesSupport")
    Rel(GherkinScanner, GherkinASTParser, "uses")
    Rel(GherkinScanner, GherkinRulesSupport, "implements")
    Rel(GherkinASTParser, GherkinRulesSupport, "implements")
    Rel(TypeScript_AST_Parser, DocDirectiveSchema, "uses")
    Rel(GherkinExtractor, GherkinASTParser, "uses")
    Rel(GherkinExtractor, GherkinRulesSupport, "implements")
    Rel(DualSourceExtractor, GherkinExtractor, "uses")
    Rel(DualSourceExtractor, GherkinScanner, "uses")
    Rel(Document_Extractor, Pattern_Scanner, "uses")
```

---

## Annotation Pipeline

Scoped architecture diagram showing component relationships:

```mermaid
graph LR
    subgraph extractor["Extractor"]
        GherkinExtractor("GherkinExtractor")
        DualSourceExtractor("DualSourceExtractor")
        Document_Extractor("Document Extractor")
    end
    subgraph scanner["Scanner"]
        Pattern_Scanner[/"Pattern Scanner"/]
        GherkinScanner[/"GherkinScanner"/]
        GherkinASTParser[/"GherkinASTParser"/]
        TypeScript_AST_Parser[/"TypeScript AST Parser"/]
    end
    subgraph related["Related"]
        DocDirectiveSchema["DocDirectiveSchema"]:::neighbor
        GherkinRulesSupport["GherkinRulesSupport"]:::neighbor
    end
    GherkinScanner -->|uses| GherkinASTParser
    GherkinScanner ..->|implements| GherkinRulesSupport
    GherkinASTParser ..->|implements| GherkinRulesSupport
    TypeScript_AST_Parser -->|uses| DocDirectiveSchema
    GherkinExtractor -->|uses| GherkinASTParser
    GherkinExtractor ..->|implements| GherkinRulesSupport
    DualSourceExtractor -->|uses| GherkinExtractor
    DualSourceExtractor -->|uses| GherkinScanner
    Document_Extractor -->|uses| Pattern_Scanner
    classDef neighbor stroke-dasharray: 5 5
```

---

## API Types

### TagRegistry (interface)

```typescript
/**
 * TagRegistry interface (matches schema from validation-schemas/tag-registry.ts)
 */
```

```typescript
interface TagRegistry {
  /** Schema version for forward/backward compatibility checking */
  version: string;
  /** Category definitions for classifying patterns by domain (e.g., core, api, ddd) */
  categories: readonly CategoryDefinitionForRegistry[];
  /** Metadata tag definitions with format, purpose, and validation rules */
  metadataTags: readonly MetadataTagDefinitionForRegistry[];
  /** Aggregation tag definitions for document-level grouping */
  aggregationTags: readonly AggregationTagDefinitionForRegistry[];
  /** Available format options for documentation output */
  formatOptions: readonly string[];
  /** Prefix for all tags (e.g., "@libar-docs-") */
  tagPrefix: string;
  /** File-level opt-in marker tag (e.g., "@libar-docs") */
  fileOptInTag: string;
}
```

| Property        | Description                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| version         | Schema version for forward/backward compatibility checking                     |
| categories      | Category definitions for classifying patterns by domain (e.g., core, api, ddd) |
| metadataTags    | Metadata tag definitions with format, purpose, and validation rules            |
| aggregationTags | Aggregation tag definitions for document-level grouping                        |
| formatOptions   | Available format options for documentation output                              |
| tagPrefix       | Prefix for all tags (e.g., "@libar-docs-")                                     |
| fileOptInTag    | File-level opt-in marker tag (e.g., "@libar-docs")                             |

### MetadataTagDefinitionForRegistry (interface)

```typescript
interface MetadataTagDefinitionForRegistry {
  /** Tag name without prefix (e.g., "pattern", "status", "phase") */
  tag: string;
  /** Value format type determining parsing rules (flag, value, enum, csv, number, quoted-value) */
  format: FormatType;
  /** Human-readable description of the tag's purpose and usage */
  purpose: string;
  /** Whether this tag must be present for valid patterns */
  required?: boolean;
  /** Whether this tag can appear multiple times on a single pattern */
  repeatable?: boolean;
  /** Valid values for enum-type tags (undefined for non-enum formats) */
  values?: readonly string[];
  /** Default value applied when tag is not specified */
  default?: string;
  /** Example usage showing tag syntax (e.g., "@libar-docs-pattern MyPattern") */
  example?: string;
  /** Maps tag name to metadata object property name (defaults to kebab-to-camelCase) */
  metadataKey?: string;
  /** Post-parse value transformer applied after format-based parsing */
  transform?: (value: string) => string;
}
```

| Property    | Description                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| tag         | Tag name without prefix (e.g., "pattern", "status", "phase")                               |
| format      | Value format type determining parsing rules (flag, value, enum, csv, number, quoted-value) |
| purpose     | Human-readable description of the tag's purpose and usage                                  |
| required    | Whether this tag must be present for valid patterns                                        |
| repeatable  | Whether this tag can appear multiple times on a single pattern                             |
| values      | Valid values for enum-type tags (undefined for non-enum formats)                           |
| default     | Default value applied when tag is not specified                                            |
| example     | Example usage showing tag syntax (e.g., "@libar-docs-pattern MyPattern")                   |
| metadataKey | Maps tag name to metadata object property name (defaults to kebab-to-camelCase)            |
| transform   | Post-parse value transformer applied after format-based parsing                            |

### CategoryDefinition (interface)

```typescript
interface CategoryDefinition {
  /** Category tag name without prefix (e.g., "core", "api", "ddd", "saga") */
  readonly tag: string;
  /** Human-readable domain name for display (e.g., "Strategic DDD", "Event Sourcing") */
  readonly domain: string;
  /** Display order priority - lower values appear first in sorted output */
  readonly priority: number;
  /** Brief description of the category's purpose and typical patterns */
  readonly description: string;
  /** Alternative tag names that map to this category (e.g., "es" for "event-sourcing") */
  readonly aliases: readonly string[];
}
```

| Property    | Description                                                                       |
| ----------- | --------------------------------------------------------------------------------- |
| tag         | Category tag name without prefix (e.g., "core", "api", "ddd", "saga")             |
| domain      | Human-readable domain name for display (e.g., "Strategic DDD", "Event Sourcing")  |
| priority    | Display order priority - lower values appear first in sorted output               |
| description | Brief description of the category's purpose and typical patterns                  |
| aliases     | Alternative tag names that map to this category (e.g., "es" for "event-sourcing") |

### TagDefinition (type)

```typescript
type TagDefinition = MetadataTagDefinitionForRegistry;
```

### CategoryTag (type)

```typescript
/**
 * Category tags as a union type
 */
```

```typescript
type CategoryTag = (typeof CATEGORIES)[number]['tag'];
```

### buildRegistry (function)

```typescript
/**
 * Build the complete tag registry from TypeScript constants
 *
 * This is THE single source of truth for the taxonomy.
 * All consumers should use this function instead of loading JSON.
 */
```

```typescript
function buildRegistry(): TagRegistry;
```

### METADATA_TAGS_BY_GROUP (const)

```typescript
/**
 * Metadata tags organized by functional group.
 * Used for documentation generation to create organized sections.
 *
 * Groups:
 * - core: Essential pattern identification (pattern, status, core, usecase, brief)
 * - relationship: Pattern dependencies and connections
 * - process: Timeline and assignment tracking
 * - prd: Product requirements documentation
 * - adr: Architecture decision records
 * - hierarchy: Epic/phase/task breakdown
 * - traceability: Two-tier spec architecture links
 * - discovery: Session discovery findings (retrospective tags)
 * - architecture: Diagram generation tags
 * - extraction: Documentation extraction control
 * - stub: Design session stub metadata
 */
```

```typescript
METADATA_TAGS_BY_GROUP = {
  core: ['pattern', 'status', 'core', 'usecase', 'brief'] as const,
  relationship: [
    'uses',
    'used-by',
    'implements',
    'extends',
    'depends-on',
    'enables',
    'see-also',
    'api-ref',
  ] as const,
  process: [
    'phase',
    'release',
    'quarter',
    'completed',
    'effort',
    'effort-actual',
    'team',
    'workflow',
    'risk',
    'priority',
  ] as const,
  prd: ['product-area', 'user-role', 'business-value', 'constraint'] as const,
  adr: [
    'adr',
    'adr-status',
    'adr-category',
    'adr-supersedes',
    'adr-superseded-by',
    'adr-theme',
    'adr-layer',
  ] as const,
  hierarchy: ['level', 'parent', 'title'] as const,
  traceability: ['executable-specs', 'roadmap-spec', 'behavior-file'] as const,
  discovery: [
    'discovered-gap',
    'discovered-improvement',
    'discovered-risk',
    'discovered-learning',
  ] as const,
  architecture: ['arch-role', 'arch-context', 'arch-layer', 'include'] as const,
  extraction: ['extract-shapes', 'shape'] as const,
  stub: ['target', 'since'] as const,
  convention: ['convention'] as const,
} as const;
```

### CATEGORIES (const)

```typescript
/**
 * All category definitions for the monorepo
 */
```

```typescript
const CATEGORIES: readonly CategoryDefinition[];
```

### CATEGORY_TAGS (const)

```typescript
/**
 * Extract all category tags as an array
 */
```

```typescript
CATEGORY_TAGS = CATEGORIES.map((c) => c.tag) as readonly CategoryTag[];
```

---

## Behavior Specifications

### TypeScriptTaxonomyImplementation

[View TypeScriptTaxonomyImplementation source](delivery-process/specs/typescript-taxonomy-implementation.feature)

As a delivery-process developer
I want taxonomy defined in TypeScript with Zod integration
So that I get compile-time safety and runtime validation

**Note (D12):** Implementation uses TypeScript as the single source of truth,
with consumers importing directly rather than generating intermediate JSON files.

### ShapeExtraction

[View ShapeExtraction source](delivery-process/specs/shape-extraction.feature)

**Problem:**
Documentation comments duplicate type definitions that exist in the same file.
As interfaces change, the JSDoc examples drift. Maintaining two copies of the
same type information violates DRY and creates documentation rot.

**Relationship to Documentation Generation:**
This capability is a critical enabler for ADR-021 (DocGenerationProofOfConcept).
Shape extraction allows code to own API type documentation while decisions own
intro/context and behavior specs own rules/examples. See the source mapping
pattern in doc-generation-proof-of-concept.feature.

Current pattern (duplication):
"""typescript
/\*\*

- @libar-docs
-
- ## API
-
- ```typescript

  ```
- // DUPLICATED from actual interface below
- interface DeciderInput {
- state: ProcessState;
- changes: ChangeDetection;
- }
- ```
  */
  ```

// The actual source of truth
export interface DeciderInput {
state: ProcessState;
changes: ChangeDetection;
}
"""

**Solution:**
New tag `@libar-docs-extract-shapes` lists type names to extract from the same file.
The extractor pulls actual TypeScript definitions from AST and inserts them into
generated documentation as fenced code blocks.

Target pattern (single source):
"""typescript
/\*\*

- @libar-docs
- @libar-docs-extract-shapes DeciderInput, ValidationResult
-
- ## API
-
- (shapes inserted at generation time)
  \*/

export interface DeciderInput {
state: ProcessState;
changes: ChangeDetection;
}
"""

**Why It Matters:**
| Benefit | How |
| Single source of truth | Types defined once, extracted for docs |
| Always-current docs | Generated from actual code definitions |
| Reduced maintenance | Change type once, docs update automatically |
| API documentation | Public interfaces documented without duplication |

<details>
<summary>extract-shapes tag is defined in registry (1 scenarios)</summary>

#### extract-shapes tag is defined in registry

**Invariant:** The `extract-shapes` tag must exist with CSV format to list multiple type names for extraction.

**Verified by:**

- Tag registry contains extract-shapes

</details>

<details>
<summary>Interfaces are extracted from TypeScript AST (5 scenarios)</summary>

#### Interfaces are extracted from TypeScript AST

**Invariant:** When `@libar-docs-extract-shapes` lists an interface name, the extractor must find and extract the complete interface definition including JSDoc comments, generics, and extends clauses.

**Verified by:**

- Extract simple interface
- Extract interface with JSDoc
- Extract interface with generics
- Extract interface with extends
- Non-existent shape produces warning

</details>

<details>
<summary>Type aliases are extracted from TypeScript AST (3 scenarios)</summary>

#### Type aliases are extracted from TypeScript AST

**Invariant:** Type aliases (including union types, intersection types, and mapped types) are extracted when listed in extract-shapes.

**Verified by:**

- Extract union type alias
- Extract mapped type
- Extract conditional type

</details>

<details>
<summary>Enums are extracted from TypeScript AST (2 scenarios)</summary>

#### Enums are extracted from TypeScript AST

**Invariant:** Both string and numeric enums are extracted with their complete member definitions.

**Verified by:**

- Extract string enum
- Extract const enum

</details>

<details>
<summary>Function signatures are extracted (body omitted) (3 scenarios)</summary>

#### Function signatures are extracted (body omitted)

**Invariant:** When a function name is listed in extract-shapes, only the signature (parameters, return type, generics) is extracted. The function body is replaced with ellipsis for documentation purposes.

**Verified by:**

- Extract function signature
- Extract async function signature
- Extract arrow function with type annotation

</details>

<details>
<summary>Multiple shapes are extracted in specified order (2 scenarios)</summary>

#### Multiple shapes are extracted in specified order

**Invariant:** When multiple shapes are listed, they appear in the documentation in the order specified in the tag, not source order.

**Verified by:**

- Shapes appear in tag order
- Mixed shape types in specified order

</details>

<details>
<summary>Extracted shapes render as fenced code blocks (2 scenarios)</summary>

#### Extracted shapes render as fenced code blocks

**Invariant:** Codecs render extracted shapes as TypeScript fenced code blocks, grouped under an "API Types" or similar section.

**Verified by:**

- Shapes render in claude module
- Shapes render in detailed docs

</details>

<details>
<summary>Shapes can reference types from imports (3 scenarios)</summary>

#### Shapes can reference types from imports

**Invariant:** Extracted shapes may reference types from imports. The extractor does NOT resolve imports - it extracts the shape as-is. Consumers understand that referenced types are defined elsewhere.

**Verified by:**

- Shape with imported type reference
- Shape extraction does not follow imports
- Re-exported type produces same warning as import

</details>

<details>
<summary>Overloaded function signatures are all extracted (2 scenarios)</summary>

#### Overloaded function signatures are all extracted

**Invariant:** When a function has multiple overload signatures, all signatures are extracted together as they represent the complete API.

**Verified by:**

- Extract overloaded function signatures
- Extract method overloads in interface

</details>

<details>
<summary>Shape rendering supports grouping options (2 scenarios)</summary>

#### Shape rendering supports grouping options

**Invariant:** Codecs can render shapes grouped in a single code block or as separate code blocks, depending on detail level.

**Verified by:**

- Grouped rendering for compact output
- Separate rendering for detailed output

</details>

### PatternRelationshipModel

[View PatternRelationshipModel source](delivery-process/specs/pattern-relationship-model.feature)

**Problem:** The delivery process lacks a comprehensive relationship model between artifacts.
Code files, roadmap specs, executable specs, and patterns exist but their relationships
are implicit or limited to basic dependency tracking (`uses`, `depends-on`).

**Solution:** Implement a relationship taxonomy inspired by UML/TML modeling practices:

- **Realization** (`implements`) - Code realizes a pattern specification
- **Generalization** (`extends`) - Pattern extends another pattern's capabilities
- **Dependency** (`uses`, `used-by`) - Technical dependencies between patterns
- **Composition** (`parent`, `level`) - Hierarchical pattern organization
- **Traceability** (`roadmap-spec`, `executable-specs`) - Cross-tier linking

**Business Value:**
| Benefit | How |
| Complete dependency graphs | All relationships rendered in Mermaid with distinct arrow styles |
| Implementation tracking | `implements` links code stubs to roadmap specs |
| Code-sourced documentation | Generated docs pull from both .feature files AND code stubs |
| Impact analysis | Know what code breaks when pattern spec changes |
| Agentic workflows | Claude can navigate from pattern to implementations and back |
| UML-grade modeling | Professional relationship semantics enable rich tooling |

<details>
<summary>Code files declare pattern realization via implements tag (4 scenarios)</summary>

#### Code files declare pattern realization via implements tag

**Invariant:** Files with `@libar-docs-implements:PatternName,OtherPattern` are linked to the specified patterns without causing conflicts. Pattern definitions remain in roadmap specs; implementation files provide supplementary metadata. Multiple files can implement the same pattern, and one file can implement multiple patterns.

**Rationale:** This mirrors UML's "realization" relationship where a class implements an interface. Code realizes the specification. Direction is code→spec (backward link). CSV format allows a single implementation file to realize multiple patterns when implementing a pattern family (e.g., durability primitives).

**Verified by:**

- Implements tag parsed from TypeScript
- Multiple patterns implemented by one file
- No conflict with pattern definition
- Multiple files implement same pattern
- Implements tag parsed
- Multiple patterns supported
- Multiple implementations of same pattern

</details>

<details>
<summary>Pattern inheritance uses extends relationship tag (3 scenarios)</summary>

#### Pattern inheritance uses extends relationship tag

**Invariant:** Files with `@libar-docs-extends:BasePattern` declare that they extend another pattern's capabilities. This is a generalization relationship where the extending pattern is a specialization of the base pattern.

**Rationale:** Pattern families exist where specialized patterns build on base patterns. For example, `ReactiveProjections` extends `ProjectionCategories`. The extends relationship enables inheritance-based documentation and validates pattern hierarchy.

**Verified by:**

- Extends tag parsed from feature file
- Extended-by reverse lookup computed
- Circular inheritance detected
- Extends tag parsed
- Extended-by computed
- Inheritance chain validated

</details>

<details>
<summary>Technical dependencies use directed relationship tags (2 scenarios)</summary>

#### Technical dependencies use directed relationship tags

**Invariant:** `@libar-docs-uses` declares outbound dependencies (what this pattern depends on). `@libar-docs-used-by` declares inbound dependencies (what depends on this pattern). Both are CSV format.

**Rationale:** These represent technical coupling between patterns. The distinction matters for impact analysis: changing a pattern affects its `used-by` consumers but not its `uses` dependencies.

**Verified by:**

- Uses rendered as solid arrows in graph
- Used-by aggregated in pattern detail
- Uses rendered as solid arrows
- Used-by aggregated correctly

</details>

<details>
<summary>Roadmap sequencing uses ordering relationship tags (2 scenarios)</summary>

#### Roadmap sequencing uses ordering relationship tags

**Invariant:** `@libar-docs-depends-on` declares what must be completed first (roadmap sequencing). `@libar-docs-enables` declares what this unlocks when completed. These are planning relationships, not technical dependencies.

**Rationale:** Sequencing is about order of work, not runtime coupling. A pattern may depend on another being complete without using its code.

**Verified by:**

- Depends-on rendered as dashed arrows
- Enables is inverse of depends-on
- Enables is inverse

</details>

<details>
<summary>Cross-tier linking uses traceability tags (PDR-007) (2 scenarios)</summary>

#### Cross-tier linking uses traceability tags (PDR-007)

**Invariant:** `@libar-docs-executable-specs` on roadmap specs points to test locations. `@libar-docs-roadmap-spec` on package specs points back to the pattern. These create bidirectional traceability.

**Rationale:** Two-tier architecture (PDR-007) separates planning specs from executable tests. Traceability tags maintain the connection for navigation and completeness checking.

**Verified by:**

- Bidirectional links established
- Orphan executable spec detected
- Orphan detection

</details>

<details>
<summary>Epic/Phase/Task hierarchy uses parent-child relationships (2 scenarios)</summary>

#### Epic/Phase/Task hierarchy uses parent-child relationships

**Invariant:** `@libar-docs-level` declares the hierarchy tier (epic, phase, task). `@libar-docs-parent` links to the containing pattern. This enables rollup progress tracking.

**Rationale:** Large initiatives decompose into phases and tasks. The hierarchy allows progress aggregation (e.g., "Epic 80% complete based on child phases").

**Verified by:**

- Parent link validated
- Invalid parent detected
- Progress rollup calculated

</details>

<details>
<summary>All relationships appear in generated documentation (2 scenarios)</summary>

#### All relationships appear in generated documentation

**Invariant:** The PATTERNS.md dependency graph renders all relationship types with distinct visual styles. Pattern detail pages list all related artifacts grouped by relationship type.

**Rationale:** Visualization makes the relationship model accessible. Different arrow styles distinguish relationship semantics at a glance.

| Relationship | Arrow Style       | Direction    | Description          |
| ------------ | ----------------- | ------------ | -------------------- |
| uses         | --> (solid)       | OUT          | Technical dependency |
| depends-on   | -.-> (dashed)     | OUT          | Roadmap sequencing   |
| implements   | ..-> (dotted)     | CODE→SPEC    | Realization          |
| extends      | -->> (solid open) | CHILD→PARENT | Generalization       |

**Verified by:**

- Graph uses distinct arrow styles
- Pattern detail page shows all relationships
- Graph uses distinct styles
- Detail page sections

</details>

<details>
<summary>Linter detects relationship violations (3 scenarios)</summary>

#### Linter detects relationship violations

**Invariant:** The pattern linter validates that all relationship targets exist, implements files don't have pattern tags, and bidirectional links are consistent.

**Rationale:** Broken relationships cause confusion and incorrect generated docs. Early detection during linting prevents propagation of errors.

**Verified by:**

- Missing relationship target detected
- Pattern tag in implements file causes error
- Asymmetric traceability detected
- Missing target detected
- Pattern conflict detected
- Asymmetric link detected

</details>

### GherkinRulesSupport

[View GherkinRulesSupport source](delivery-process/specs/gherkin-rules-support.feature)

**Problem:**
Feature files were limited to flat scenario lists. Business rules, rationale,
and rich descriptions could not be captured in a way that:

- Tests ignore (vitest-cucumber skips descriptions)
- Generators render (PRD shows business context)
- Maintains single source of truth (one file, two purposes)

The Gherkin `Rule:` keyword was parsed by @cucumber/gherkin but our pipeline
dropped the data at scanner/extractor stages.

**Solution:**
Extended the documentation pipeline to capture and render:

- `Rule:` keyword as Business Rules sections
- Rule descriptions (rationale, exceptions, context)
- DataTables in steps as Markdown tables
- DocStrings in steps as code blocks

Infrastructure changes (schema, scanner, extractor) are shared by all generators.
Rendering was added to PRD generator as reference implementation.

Confirmed vitest-cucumber supports Rules via `Rule()` + `RuleScenario()` syntax.
No migration to alternative frameworks needed.

<details>
<summary>Rules flow through the entire pipeline without data loss (3 scenarios)</summary>

#### Rules flow through the entire pipeline without data loss

The @cucumber/gherkin parser extracts Rules natively. Our pipeline must
preserve this data through scanner, extractor, and into ExtractedPattern
so generators can access rule names, descriptions, and nested scenarios.

**Verified by:**

- Rules are captured by AST parser
- Rules pass through scanner
- Rules are mapped to ExtractedPattern

</details>

<details>
<summary>Generators can render rules as business documentation (1 scenarios)</summary>

#### Generators can render rules as business documentation

Business stakeholders see rule names and descriptions as "Business Rules"
sections, not Given/When/Then syntax. This enables human-readable PRDs
from the same files used for test execution.

**Verified by:**

- PRD generator renders Business Rules section

</details>

<details>
<summary>Custom content blocks render in acceptance criteria (2 scenarios)</summary>

#### Custom content blocks render in acceptance criteria

DataTables and DocStrings in steps should appear in generated documentation,
providing structured data and code examples alongside step descriptions.

**Verified by:**

- DataTables render as Markdown tables
- DocStrings render as code blocks

</details>

<details>
<summary>vitest-cucumber executes scenarios inside Rules (1 scenarios)</summary>

#### vitest-cucumber executes scenarios inside Rules

Test execution must work for scenarios inside Rule blocks.
Use Rule() function with RuleScenario() instead of Scenario().

**Verified by:**

- Rule scenarios execute with vitest-cucumber

</details>

### DeclarationLevelShapeTagging

[View DeclarationLevelShapeTagging source](delivery-process/specs/declaration-level-shape-tagging.feature)

**Problem:**
The current shape extraction system operates at file granularity. The
libar-docs-extract-shapes tag on a pattern block extracts named declarations
from the entire file, and the reference doc config shapeSources field selects
shapes by file glob only. There is no way for a reference document to request
"only RiskLevel and RISK_LEVELS from risk-levels.ts" -- it gets every shape
the file exports. This produces noisy reference documents that include
irrelevant types alongside the focused content the document is trying to
present.

The reference doc system is designed for composing focused documents from
cherry-picked content: conventionTags filters by tag, behaviorCategories
filters by category, diagramScope filters by arch metadata. But shapeSources
is the one axis with no content-level filter -- only file-level.

**Solution:**
Introduce a lightweight libar-docs-shape annotation tag on individual
TypeScript declarations. Each tagged declaration self-identifies as a
documentable shape, optionally belonging to a named group. On the consumer
side, add shapeSelectors to ReferenceDocConfig for fine-grained selection
by name or group.

This follows how real API doc generators work: they build a symbol graph
from annotated declarations, not from whole-file text dumps. The tag lives
next to the code it describes, so refactoring (rename/move) does not break
extraction. Code remains the single source of truth with one line of
annotation overhead per declaration.

**Design Decisions:**

DD-1: Tag format is value (not flag)
The libar-docs-shape tag works bare (no value) for simple opt-in, but
also accepts an optional group name like libar-docs-shape api-types.
This enables group-based selection in shapeSelectors without a second
tag. Using format: value means undefined when bare, string when
provided. Registry entry: tag: 'shape', format: 'value', with example
'libar-docs-shape api-types'. Placed in metadataTags array in
buildRegistry() at src/taxonomy/registry-builder.ts.

DD-2: Stay on typescript-estree parser (no TS compiler API switch)
The existing extractPrecedingJsDoc() in shape-extractor.ts already finds
JSDoc above declarations by scanning the AST comments array. Checking
that JSDoc text for the libar-docs-shape tag is a string search on
already-extracted content -- zero parser changes needed. The TS compiler
APIs node.jsDoc property is not available on estree nodes, but the
comment-based approach is equivalent for declaration-level tag detection.
Cross-file resolution via parseAndGenerateServices or ts.createProgram
is deferred to a future pattern when barrel file re-exports become a
problem.

DD-3: shapeSelectors subsumes shapeSources for new configs
shapeSources remains for backward compatibility (glob-in, everything-out).
shapeSelectors provides three selection modes: by source + names, by
group tag, or by source alone (all tagged shapes from a file). Both
fields compose -- shapeSources is the coarse filter, shapeSelectors
adds precision. New configs should prefer shapeSelectors.

DD-4: Top-level declarations only in v1
Only interface, type, enum, function, and const declarations at the
module top level are eligible. No namespace-internal, class-internal,
or function-local declarations. The codebase does not use namespaces
or nested type declarations, so this constraint matches reality.
Const must be identifier-based (const X = ...), no destructuring.

DD-5: Group stored on ExtractedShape schema
The ExtractedShapeSchema gains an optional group: string field from
the libar-docs-shape tag value. This enables downstream filtering
by shapeSelectors without re-parsing source files.

DD-6: ShapeSelector is a structural discriminated union
ShapeSelector is not a tagged union with an explicit kind field.
Discrimination uses structural key presence: - group key present: group selector (select all shapes with this group) - source key present, names key present: source+names selector - source key present, no names key: source-only selector (all tagged
shapes from that source file)
Zod schema uses z.union() with three z.object() variants. The source
field uses the same glob syntax as shapeSources (exact path, single
wildcard, or recursive glob). The names field is a readonly string
array of declaration names to include. The group field is a string
matching the libar-docs-shape tag value.
This lives on ReferenceDocConfig as:
readonly shapeSelectors?: readonly ShapeSelector[]

DD-7: Tagged non-exported declarations are included
The existing findDeclarations() in shape-extractor.ts discovers all
top-level declarations regardless of export status. When a declaration
has the libar-docs-shape tag in its JSDoc, it is extracted even if not
exported. This is intentional: the tag is an explicit documentation
opt-in that overrides the export-based filtering used by the
extractAllExportedShapes() auto-discovery mode. A module-internal
type tagged for documentation is a valid use case (documenting
internal architecture in reference docs).

**Pragmatic Constraints:**
| Constraint | Rationale |
| Top-level declarations only | Codebase convention, avoids namespace recursion |
| 5 declaration kinds | interface, type, enum, function, const -- matches existing shape extractor |
| No cross-file resolution | Deferred to future pattern using parseAndGenerateServices |
| JSDoc must be within MAX_JSDOC_LINE_DISTANCE (3 lines) | Matches existing extractPrecedingJsDoc logic |
| const must be identifier-based | No destructuring support -- rare in type documentation |
| Group names are single tokens | No spaces in tag values (hyphen-separated convention) |

**Implementation Path:**
| Layer | Change | Effort |
| registry-builder.ts | Add shape tag to metadataTags array | ~5 lines |
| extracted-shape.ts | Add optional group field to ExtractedShapeSchema | ~2 lines |
| shape-extractor.ts | Add discoverTaggedShapes() and extractShapeTag() | ~50 lines |
| doc-extractor.ts | Call discoverTaggedShapes() alongside processExtractShapesTag() | ~15 lines |
| reference.ts | Add ShapeSelectorSchema + shapeSelectors to ReferenceDocConfig | ~20 lines |
| shape-matcher.ts | Add filterShapesBySelectors() function | ~30 lines |
| delivery-process.config.ts | Update showcase config to use shapeSelectors | ~5 lines |

**Integration Wiring (doc-extractor.ts):**
The existing shape extraction at doc-extractor.ts lines 167-178 handles
libar-docs-extract-shapes (pattern-level tag, names shapes by name).
The new discoverTaggedShapes() is called in addition to that path:
after parsing the source file, scan all declarations for libar-docs-shape
JSDoc tags and merge any found shapes into the patterns extractedShapes
array. Both paths contribute to the same ExtractedPattern.extractedShapes
field. Deduplication by shape name (existing behavior in shape-matcher.ts
line 86) prevents duplicates when both paths find the same declaration.

**Explored Alternatives:**
| Alternative | Why not (for v1) |
| TypeScript compiler API (ts.createProgram) | Full type resolution but requires tsconfig, slower, overkill for tag detection |
| ts-morph wrapper | Additional 2MB dependency for nicer API, same capabilities as compiler API |
| parseAndGenerateServices | Zero new deps, same package, but cross-file resolution not needed yet |
| Custom ESLint rule | ESLint infrastructure already has type checker, but rules are for linting not extraction |
| LSP protocol | Designed for IDE interactions, overkill for batch extraction |
| Name filter only (no tag) | shapeNames on config without source-side tag -- works but loses explicitness |
| Tagged union for ShapeSelector | kind field adds noise; structural discrimination is idiomatic for Zod unions |

**Future Upgrade Path:**
When cross-file resolution is needed (barrel file re-exports in monorepo),
switch shape-extractor.ts from parse() to parseAndGenerateServices() --
same typescript-eslint/typescript-estree dependency, different function
call. This gives full TypeScript type checker access: resolve re-exports
via checker.getAliasedSymbol(), expand type aliases, follow import chains.
The libar-docs-shape tag and shapeSelectors config remain unchanged.

<details>
<summary>Declarations opt in via libar-docs-shape tag (5 scenarios)</summary>

#### Declarations opt in via libar-docs-shape tag

**Invariant:** Only declarations with the libar-docs-shape tag in their immediately preceding JSDoc are collected as tagged shapes. Declarations without the tag are ignored even if they are exported. The tag value is optional -- bare libar-docs-shape opts in without a group, while libar-docs-shape group-name assigns the declaration to a named group. Tagged non-exported declarations are included (DD-7).

**Rationale:** Explicit opt-in prevents over-extraction of internal helpers. Unlike auto-discovery mode (extract-shapes \*) which grabs all exports, declaration-level tagging gives precise control. This matches how TypeDoc uses public/internal tags -- the annotation lives next to the code it describes, surviving refactors without breaking extraction.

**Verified by:**

- Tagged declaration is extracted as shape
- Untagged exported declaration is not extracted
- Group name is captured from tag value
- Bare tag works without group name
- Non-exported tagged declaration is extracted
- Tagged declaration is extracted
- Untagged export is ignored
- Bare tag works without group

</details>

<details>
<summary>Reference doc configs select shapes via shapeSelectors (4 scenarios)</summary>

#### Reference doc configs select shapes via shapeSelectors

**Invariant:** shapeSelectors provides three selection modes: by source path + specific names (DD-6 source+names variant), by group tag (DD-6 group variant), or by source path alone (DD-6 source-only variant). shapeSources remains for backward compatibility. When both are present, shapeSources provides the coarse file-level filter and shapeSelectors adds fine-grained name/group filtering on top.

**Rationale:** The reference doc system composes focused documents from cherry-picked content. Every other content axis (conventions, behaviors, diagrams) has content-level filtering. shapeSources was the only axis limited to file-level granularity. shapeSelectors closes this gap with the same explicitness as conventionTags.

**Verified by:**

- Select specific shapes by source and names
- Select all shapes in a group
- Select all tagged shapes from a source file
- shapeSources without shapeSelectors returns all shapes
- Select by source and names
- Select by group
- Select by source alone
- shapeSources backward compatibility preserved

</details>

<details>
<summary>Discovery uses existing estree parser with JSDoc comment scanning (3 scenarios)</summary>

#### Discovery uses existing estree parser with JSDoc comment scanning

**Invariant:** The discoverTaggedShapes function uses the existing typescript-estree parse() and extractPrecedingJsDoc() approach. It does not require the TypeScript compiler API, ts-morph, or parseAndGenerateServices. Tag detection is a regex match on the JSDoc comment text already extracted by the existing infrastructure. The tag regex pattern is: /libar-docs-shape(?:\s+(\S+))?/ where capture group 1 is the optional group name.

**Rationale:** The shape extractor already traverses declarations and extracts their JSDoc. Adding libar-docs-shape detection is a string search on content that is already available -- approximately 15 lines of new logic. Switching parsers would introduce churn with no benefit for the v1 use case of tag detection on top-level declarations.

**Verified by:**

- All five declaration kinds are discoverable
- JSDoc with gap larger than MAX_JSDOC_LINE_DISTANCE is not matched
- Tag coexists with other JSDoc content
- All 5 declaration kinds supported
- JSDoc gap enforcement
- Tag with other JSDoc content

</details>

### CrossSourceValidation

[View CrossSourceValidation source](delivery-process/specs/cross-source-validation.feature)

**Problem:**
The delivery process uses dual sources (TypeScript phase files and Gherkin
feature files) that must remain consistent. Currently there's no validation
to detect:

- Pattern name mismatches
- Missing spec file references
- Circular dependency chains
- Orphaned deliverables (not linked to any phase)

**Solution:**
Implement cross-source validation that scans both source types and
detects inconsistencies, broken references, and logical errors.

<details>
<summary>Pattern names must be consistent across sources (2 scenarios)</summary>

#### Pattern names must be consistent across sources

**Verified by:**

- Pattern name mismatch detected
- Pattern names match across sources

</details>

<details>
<summary>Circular dependencies are detected (2 scenarios)</summary>

#### Circular dependencies are detected

**Verified by:**

- Direct circular dependency
- Transitive circular dependency

</details>

<details>
<summary>Dependency references must resolve (2 scenarios)</summary>

#### Dependency references must resolve

**Verified by:**

- Dependency references non-existent pattern
- All dependencies resolve

</details>

### GherkinAstParser

[View GherkinAstParser source](tests/features/scanner/gherkin-parser.feature)

The Gherkin AST parser extracts feature metadata, scenarios, and steps
from .feature files for timeline generation and process documentation.

#### Successful feature file parsing extracts complete metadata

**Invariant:** A valid feature file must produce a ParsedFeature with name, description, language, tags, and all nested scenarios with their steps.

**Rationale:** Downstream generators (timeline, business rules) depend on complete AST extraction; missing fields cause silent gaps in generated documentation.

**Verified by:**

- Parse valid feature file with pattern metadata
- Parse multiple scenarios
- Handle feature without tags

#### Invalid Gherkin produces structured errors

**Invariant:** Malformed or incomplete Gherkin input must return a Result.err with the source file path and a descriptive error message.

**Rationale:** The scanner processes many feature files in batch; structured errors allow graceful degradation and per-file error reporting rather than aborting the entire scan.

**Verified by:**

- Return error for malformed Gherkin
- Return error for file without feature

### FileDiscovery

[View FileDiscovery source](tests/features/scanner/file-discovery.feature)

The file discovery system uses glob patterns to find TypeScript files
for documentation extraction. It applies sensible defaults to exclude
common non-source directories like node_modules, dist, and test files.

<details>
<summary>Glob patterns match TypeScript source files (3 scenarios)</summary>

#### Glob patterns match TypeScript source files

**Invariant:** findFilesToScan must return absolute paths for all files matching the configured glob patterns.

**Rationale:** Downstream pipeline stages (AST parser, extractor) require absolute paths to read file contents; relative paths would break when baseDir differs from cwd.

**Verified by:**

- Find TypeScript files matching glob patterns
- Return absolute paths
- Support multiple glob patterns

</details>

<details>
<summary>Default exclusions filter non-source files (4 scenarios)</summary>

#### Default exclusions filter non-source files

**Invariant:** node_modules, dist, .test.ts, .spec.ts, and .d.ts files must be excluded by default without explicit configuration.

**Rationale:** Scanning generated output (dist), third-party code (node_modules), or test files would produce false positives in the pattern registry and waste processing time.

**Verified by:**

- Exclude node_modules by default
- Exclude dist directory by default
- Exclude test files by default
- Exclude .d.ts declaration files

</details>

<details>
<summary>Custom configuration extends discovery behavior (3 scenarios)</summary>

#### Custom configuration extends discovery behavior

**Invariant:** User-provided exclude patterns must be applied in addition to (not replacing) the default exclusions.

**Verified by:**

- Respect custom exclude patterns
- Return empty array when no files match
- Handle nested directory structures

</details>

### DocStringMediaType

[View DocStringMediaType source](tests/features/scanner/docstring-mediatype.feature)

DocString language hints (mediaType) should be preserved through the parsing
pipeline from feature files to rendered output. This prevents code blocks
from being incorrectly escaped when the language hint is lost.

<details>
<summary>Parser preserves DocString mediaType during extraction (4 scenarios)</summary>

#### Parser preserves DocString mediaType during extraction

**Invariant:** The Gherkin parser must retain the mediaType annotation from DocString delimiters through to the parsed AST; DocStrings without a mediaType have undefined mediaType.

**Rationale:** Losing the mediaType causes downstream renderers to apply incorrect escaping or default language hints, corrupting code block output.

**Verified by:**

- Parse DocString with typescript mediaType
- Parse DocString with json mediaType
- Parse DocString with jsdoc mediaType
- DocString without mediaType has undefined mediaType

</details>

<details>
<summary>MediaType is used when rendering code blocks (3 scenarios)</summary>

#### MediaType is used when rendering code blocks

**Invariant:** The rendered code block language must match the DocString mediaType; when mediaType is absent, the renderer falls back to a caller-specified default language.

**Verified by:**

- TypeScript mediaType renders as typescript code block
- JSDoc mediaType prevents asterisk escaping
- Missing mediaType falls back to default language

</details>

<details>
<summary>renderDocString handles both string and object formats (2 scenarios)</summary>

#### renderDocString handles both string and object formats

**Invariant:** renderDocString accepts both plain string and object DocString formats; when an object has a mediaType, it takes precedence over the caller-supplied language parameter.

**Rationale:** Legacy callers pass raw strings while newer code passes structured objects — the renderer must handle both without breaking existing usage.

**Verified by:**

- String docString renders correctly (legacy format)
- Object docString with mediaType takes precedence

</details>

### AstParserRelationshipsEdges

[View AstParserRelationshipsEdges source](tests/features/scanner/ast-parser-relationships-edges.feature)

The AST Parser extracts @libar-docs-\* directives from TypeScript source files
using the TypeScript compiler API. It identifies exports, extracts metadata,
and validates directive structure.

#### Relationship tags extract uses and usedBy dependencies

**Invariant:** The uses and usedBy relationship arrays are populated from directive tags, not from description content. When no relationship tags exist, the fields are undefined.

**Verified by:**

- Extract @libar-docs-uses with single value
- Extract @libar-docs-uses with comma-separated values
- Extract @libar-docs-used-by with single value
- Extract @libar-docs-used-by with comma-separated values
- Extract both uses and usedBy from same directive
- NOT capture uses/usedBy values in description
- Not set uses/usedBy when no relationship tags exist

#### Edge cases and malformed input are handled gracefully

**Invariant:** The parser never crashes on invalid input. Files without directives return empty results. Malformed TypeScript returns a structured error with the file path.

**Verified by:**

- Skip comments without @libar-docs-\* tags
- Skip invalid directive with incomplete tag
- Handle malformed TypeScript gracefully
- Handle empty file gracefully
- Handle whitespace-only file
- Handle file with only comments and no exports
- Skip inline comments (non-block)
- Handle unicode characters in descriptions

### AstParserMetadata

[View AstParserMetadata source](tests/features/scanner/ast-parser-metadata.feature)

The AST Parser extracts @libar-docs-\* directives from TypeScript source files
using the TypeScript compiler API. It identifies exports, extracts metadata,
and validates directive structure.

<details>
<summary>Metadata is correctly extracted from JSDoc comments (5 scenarios)</summary>

#### Metadata is correctly extracted from JSDoc comments

**Invariant:** Examples, multi-line descriptions, line numbers, function signatures, and standard JSDoc tags are all correctly parsed and separated.

**Verified by:**

- Extract examples from directive
- Extract multi-line description
- Track line numbers correctly
- Extract function signature information
- Ignore @param and @returns in description

</details>

<details>
<summary>Tags are extracted only from the directive section, not from description or examples (4 scenarios)</summary>

#### Tags are extracted only from the directive section, not from description or examples

**Invariant:** Only tags appearing in the directive section (before the description) are extracted. Tags mentioned in description prose or example code blocks are ignored.

**Verified by:**

- Extract multiple tags from directive section
- Extract tag with description on same line
- NOT extract tags mentioned in description
- NOT extract tags mentioned in @example sections

</details>

<details>
<summary>When to Use sections are extracted in all supported formats (4 scenarios)</summary>

#### When to Use sections are extracted in all supported formats

**Invariant:** When to Use content is extracted from heading format with bullet points, inline bold format, and asterisk bullet format. When no When to Use section exists, the field is undefined.

**Verified by:**

- Extract When to Use heading format with bullet points
- Extract When to use inline format
- Extract asterisk bullets in When to Use section
- Not set whenToUse when section is missing

</details>

### AstParserExports

[View AstParserExports source](tests/features/scanner/ast-parser-exports.feature)

The AST Parser extracts @libar-docs-\* directives from TypeScript source files
using the TypeScript compiler API. It identifies exports, extracts metadata,
and validates directive structure.

#### Export types are correctly identified from TypeScript declarations

**Invariant:** Every exported TypeScript declaration type (function, type, interface, const, class, enum, abstract class, arrow function, async function, generic function, default export, re-export) is correctly classified.

**Verified by:**

- Parse function export with directive
- Parse type export with directive
- Parse interface export with directive
- Parse const export with directive
- Parse class export with directive
- Parse enum export with directive
- Parse const enum export with directive
- Parse abstract class export with directive
- Parse arrow function export with directive
- Parse async function export with directive
- Parse generic function export with directive
- Parse default export with directive
- Parse re-exports with directive
- Parse multiple exports in single statement
- Parse multiple directives in same file

### ShapeExtractionTypesTesting

[View ShapeExtractionTypesTesting source](tests/features/extractor/shape-extraction-types.feature)

Validates the shape extraction system that extracts TypeScript type
definitions (interfaces, type aliases, enums, function signatures)
from source files for documentation generation.

<details>
<summary>extract-shapes tag exists in registry with CSV format (1 scenarios)</summary>

#### extract-shapes tag exists in registry with CSV format

**Verified by:**

- Tag registry contains extract-shapes with correct format

</details>

<details>
<summary>Interfaces are extracted from TypeScript AST (5 scenarios)</summary>

#### Interfaces are extracted from TypeScript AST

**Verified by:**

- Extract simple interface
- Extract interface with JSDoc
- Extract interface with generics
- Extract interface with extends
- Non-existent shape produces not-found entry

</details>

<details>
<summary>Property-level JSDoc is extracted for interface properties (3 scenarios)</summary>

#### Property-level JSDoc is extracted for interface properties

The extractor uses strict adjacency (gap = 1 line) to prevent
interface-level JSDoc from being misattributed to the first property.

**Verified by:**

- Extract properties with adjacent JSDoc
- Interface JSDoc not attributed to first property
- Mixed documented and undocumented properties

</details>

<details>
<summary>Type aliases are extracted from TypeScript AST (3 scenarios)</summary>

#### Type aliases are extracted from TypeScript AST

**Verified by:**

- Extract union type alias
- Extract mapped type
- Extract conditional type

</details>

<details>
<summary>Enums are extracted from TypeScript AST (2 scenarios)</summary>

#### Enums are extracted from TypeScript AST

**Verified by:**

- Extract string enum
- Extract const enum

</details>

<details>
<summary>Function signatures are extracted with body omitted (2 scenarios)</summary>

#### Function signatures are extracted with body omitted

**Verified by:**

- Extract function signature
- Extract async function signature

</details>

<details>
<summary>Const declarations are extracted from TypeScript AST (2 scenarios)</summary>

#### Const declarations are extracted from TypeScript AST

**Verified by:**

- Extract const with type annotation
- Extract const without type annotation

</details>

<details>
<summary>Non-exported shapes are extractable (2 scenarios)</summary>

#### Non-exported shapes are extractable

**Verified by:**

- Extract non-exported interface
- Re-export marks internal shape as exported

</details>

### ShapeExtractionRenderingTesting

[View ShapeExtractionRenderingTesting source](tests/features/extractor/shape-extraction-rendering.feature)

Validates the shape extraction system that extracts TypeScript type
definitions (interfaces, type aliases, enums, function signatures)
from source files for documentation generation.

<details>
<summary>Multiple shapes are extracted in specified order (2 scenarios)</summary>

#### Multiple shapes are extracted in specified order

**Verified by:**

- Shapes appear in tag order not source order
- Mixed shape types in specified order

</details>

<details>
<summary>Extracted shapes render as fenced code blocks (1 scenarios)</summary>

#### Extracted shapes render as fenced code blocks

**Verified by:**

- Render shapes as markdown

</details>

<details>
<summary>Imported and re-exported shapes are tracked separately (2 scenarios)</summary>

#### Imported and re-exported shapes are tracked separately

**Verified by:**

- Imported shape produces warning
- Re-exported shape produces re-export entry

</details>

<details>
<summary>Invalid TypeScript produces error result (1 scenarios)</summary>

#### Invalid TypeScript produces error result

**Verified by:**

- Malformed TypeScript returns error

</details>

<details>
<summary>Shape rendering supports grouping options (2 scenarios)</summary>

#### Shape rendering supports grouping options

**Verified by:**

- Grouped rendering in single code block
- Separate rendering with multiple code blocks

</details>

<details>
<summary>Annotation tags are stripped from extracted JSDoc while preserving standard tags (4 scenarios)</summary>

#### Annotation tags are stripped from extracted JSDoc while preserving standard tags

**Invariant:** Extracted shapes never contain @libar-docs-\* annotation lines in their jsDoc field.

**Rationale:** Shape JSDoc is rendered in documentation output. Annotation tags are metadata for the extraction pipeline, not user-visible documentation content.

**Verified by:**

- JSDoc with only annotation tags produces no jsDoc
- Mixed JSDoc preserves standard tags and strips annotation tags
- Single-line annotation-only JSDoc produces no jsDoc
- Consecutive empty lines after tag removal are collapsed

</details>

<details>
<summary>Large source files are rejected to prevent memory exhaustion (1 scenarios)</summary>

#### Large source files are rejected to prevent memory exhaustion

**Verified by:**

- Source code exceeding 5MB limit returns error

</details>

### ExtractionPipelineEnhancementsTesting

[View ExtractionPipelineEnhancementsTesting source](tests/features/extractor/extraction-pipeline-enhancements.feature)

Validates extraction pipeline capabilities for ReferenceDocShowcase:
function signature surfacing, full property-level JSDoc,
param/returns/throws extraction, and auto-shape discovery mode.

<details>
<summary>Function signatures surface full parameter types in ExportInfo (4 scenarios)</summary>

#### Function signatures surface full parameter types in ExportInfo

**Invariant:** ExportInfo.signature shows full parameter types and return type instead of the placeholder value.

**Verified by:**

- Simple function signature is extracted with full types
- Async function keeps async prefix in signature
- Multi-parameter function has all types in signature
- Function with object parameter type preserves braces
- Simple function signature
- Async function keeps async prefix
- Multi-parameter function
- Function with object parameter type

</details>

<details>
<summary>Property-level JSDoc preserves full multi-line content (2 scenarios)</summary>

#### Property-level JSDoc preserves full multi-line content

**Invariant:** Property-level JSDoc preserves full multi-line content without first-line truncation.

**Verified by:**

- Multi-line property JSDoc is fully preserved
- Single-line property JSDoc still works
- Multi-line property JSDoc preserved
- Single-line property JSDoc unchanged

</details>

<details>
<summary>Param returns and throws tags are extracted from function JSDoc (4 scenarios)</summary>

#### Param returns and throws tags are extracted from function JSDoc

**Invariant:** JSDoc param, returns, and throws tags are extracted and stored on ExtractedShape for function-kind shapes.

**Verified by:**

- Param tags are extracted from function JSDoc
- Returns tag is extracted from function JSDoc
- Throws tags are extracted from function JSDoc
- JSDoc params with braces type syntax are parsed
- Param tags extracted
- Returns tag extracted
- Throws tags extracted
- TypeScript-style params without braces

</details>

<details>
<summary>Auto-shape discovery extracts all exported types via wildcard (3 scenarios)</summary>

#### Auto-shape discovery extracts all exported types via wildcard

**Invariant:** When extract-shapes tag value is the wildcard character, all exported declarations are extracted without listing names.

**Verified by:**

- Wildcard extracts all exported declarations
- Mixed wildcard and names produces warning
- Same-name type and const exports produce one shape
- Wildcard extracts all exports
- Non-exported declarations excluded
- Mixed wildcard and names rejected

</details>

### DualSourceExtractorTesting

[View DualSourceExtractorTesting source](tests/features/extractor/dual-source-extraction.feature)

Extracts and combines pattern metadata from both TypeScript code stubs
(@libar-docs-_) and Gherkin feature files (@libar-process-_), validates
consistency, and composes unified pattern data for documentation.

**Problem:**

- Pattern data split across code stubs and feature files
- Need to validate consistency between sources
- Deliverables defined in Background tables need extraction
- Pattern name collisions need handling

**Solution:**

- extractProcessMetadata() extracts tags from features
- extractDeliverables() parses Background tables
- combineSources() merges code + features into dual-source patterns
- validateDualSource() checks cross-source consistency

<details>
<summary>Process metadata is extracted from feature tags (4 scenarios)</summary>

#### Process metadata is extracted from feature tags

**Invariant:** A feature file must have both @pattern and @phase tags to produce valid process metadata; missing either yields null.

**Rationale:** Pattern name and phase are the minimum identifiers for placing a pattern in the roadmap — without both, the pattern cannot be tracked.

**Verified by:**

- Complete process metadata extraction
- Minimal required tags extraction
- Missing pattern tag returns null
- Missing phase tag returns null

</details>

<details>
<summary>Deliverables are extracted from Background tables (4 scenarios)</summary>

#### Deliverables are extracted from Background tables

**Invariant:** Deliverables are sourced exclusively from Background tables; features without a Background produce an empty deliverable list.

**Rationale:** The Background table is the single source of truth for deliverable tracking — extracting from other locations would create ambiguity.

**Verified by:**

- Standard deliverables table extraction
- Extended deliverables with Finding and Release
- Feature without background returns empty
- Tests column handles various formats

</details>

<details>
<summary>Code and feature patterns are combined into dual-source patterns (5 scenarios)</summary>

#### Code and feature patterns are combined into dual-source patterns

**Invariant:** A combined pattern is produced only when both a code stub and a feature file exist for the same pattern name; unmatched sources are tracked separately as code-only or feature-only.

**Rationale:** Dual-source combination ensures documentation reflects both implementation intent (code) and specification (Gherkin) — mismatches signal inconsistency.

**Verified by:**

- Matching code and feature are combined
- Code-only pattern has no matching feature
- Feature-only pattern has no matching code
- Phase mismatch creates validation error
- Pattern name collision merges sources

</details>

<details>
<summary>Dual-source results are validated for consistency (4 scenarios)</summary>

#### Dual-source results are validated for consistency

**Invariant:** Cross-source validation reports errors for metadata mismatches and warnings for orphaned patterns that are still in roadmap status.

**Rationale:** Inconsistencies between code stubs and feature files indicate drift — errors catch conflicts while warnings surface missing counterparts that may be intentional.

**Verified by:**

- Clean results have no errors
- Cross-validation errors are reported
- Orphaned roadmap code stubs produce warnings
- Feature-only roadmap patterns produce warnings

</details>

<details>
<summary>Include tags are extracted from Gherkin feature tags (3 scenarios)</summary>

#### Include tags are extracted from Gherkin feature tags

**Invariant:** Include tags are parsed as comma-separated values; absence of the tag means the pattern has no includes.

**Verified by:**

- Single include tag is extracted
- CSV include tag produces multiple values
- Feature without include tag has no include field

</details>

### DeclarationLevelShapeTaggingTesting

[View DeclarationLevelShapeTaggingTesting source](tests/features/extractor/declaration-level-shape-tagging.feature)

Tests the discoverTaggedShapes function that scans TypeScript source
code for declarations annotated with the libar-docs-shape JSDoc tag.

#### Declarations opt in via libar-docs-shape tag

**Invariant:** Only declarations with the libar-docs-shape tag in their immediately preceding JSDoc are collected as tagged shapes.

**Verified by:**

- Tagged declaration is extracted as shape
- Untagged exported declaration is not extracted
- Group name is captured from tag value
- Bare tag works without group name
- Non-exported tagged declaration is extracted
- Tagged type is found despite same-name const declaration
- Both same-name declarations tagged produces shapes for each
- Tagged declaration is extracted
- Untagged export is ignored
- Bare tag works without group

#### Discovery uses existing estree parser with JSDoc comment scanning

**Invariant:** The discoverTaggedShapes function uses the existing typescript-estree parse() and extractPrecedingJsDoc() approach.

**Verified by:**

- All five declaration kinds are discoverable
- JSDoc with gap larger than MAX_JSDOC_LINE_DISTANCE is not matched
- Tag as last line before closing JSDoc delimiter
- Hypothetical libar-docs-shape-extended tag is not matched
- Tag coexists with other JSDoc content
- Generic arrow function in non-JSX context parses correctly
- All 5 declaration kinds supported
- JSDoc gap enforcement
- Tag with other JSDoc content

### ScannerCore

[View ScannerCore source](tests/features/behavior/scanner-core.feature)

The scanPatterns function orchestrates file discovery, directive detection,
and AST parsing to extract documentation directives from TypeScript files.

**Problem:**

- Need to scan entire codebases for documentation directives efficiently
- Files without @libar-docs opt-in should be skipped to save processing time
- Parse errors in one file shouldn't prevent scanning of other files
- Must support exclusion patterns for node_modules, tests, and custom paths

**Solution:**

- scanPatterns uses glob patterns for flexible file discovery
- Two-phase filtering: quick regex check, then file opt-in validation
- Result monad pattern captures errors without failing entire scan
- Configurable exclude patterns with sensible defaults
- Extracts complete directive information (tags, description, examples, exports)

<details>
<summary>scanPatterns extracts directives from TypeScript files (3 scenarios)</summary>

#### scanPatterns extracts directives from TypeScript files

**Invariant:** Every file with a valid opt-in marker and JSDoc directives produces a complete ScannedFile with tags, description, examples, and exports.

**Rationale:** Downstream generators depend on complete directive data; partial extraction causes silent documentation gaps across the monorepo.

**Verified by:**

- Scan files and extract directives
- Skip files without directives
- Extract complete directive information

</details>

<details>
<summary>scanPatterns collects errors without aborting (2 scenarios)</summary>

#### scanPatterns collects errors without aborting

**Invariant:** A parse failure in one file never prevents other files from being scanned; the result is always Ok with errors collected separately.

**Rationale:** In a monorepo with hundreds of files, a single syntax error must not block the entire documentation pipeline.

**Verified by:**

- Collect errors for files that fail to parse
- Always return Ok result even with broken files

</details>

<details>
<summary>Pattern matching and exclusion filtering (3 scenarios)</summary>

#### Pattern matching and exclusion filtering

**Invariant:** Glob patterns control file discovery and exclusion patterns remove matched files before scanning.

**Verified by:**

- Return empty results when no patterns match
- Respect exclusion patterns
- Handle multiple files with multiple directives each

</details>

<details>
<summary>File opt-in requirement gates scanning (4 scenarios)</summary>

#### File opt-in requirement gates scanning

**Invariant:** Only files containing a standalone @libar-docs marker (not @libar-docs-\*) are eligible for directive extraction.

**Rationale:** Without opt-in gating, every TypeScript file in the monorepo would be parsed, wasting processing time on files that have no documentation directives.

**Verified by:**

- Handle files with quick directive check optimization
- Skip files without @libar-docs file-level opt-in
- Not confuse @libar-docs-\* with @libar-docs opt-in
- Detect @libar-docs opt-in combined with section tags

</details>

### PatternTagExtraction

[View PatternTagExtraction source](tests/features/behavior/pattern-tag-extraction.feature)

The extractPatternTags function parses Gherkin feature tags
into structured metadata objects for pattern processing.

**Problem:**

- Gherkin tags are flat strings needing semantic interpretation
- Multiple tag formats exist: @tag:value, @libar-process-tag:value
- Dependencies and enables can have comma-separated values
- Category tags have no colon and must be distinguished from other tags

**Solution:**

- extractPatternTags parses tag strings into structured metadata
- Normalizes both @tag:value and @libar-process-tag:value formats
- Splits comma-separated values for dependencies and enables
- Filters non-category tags (acceptance-criteria, happy-path, etc.)

<details>
<summary>Single value tags produce scalar metadata fields (7 scenarios)</summary>

#### Single value tags produce scalar metadata fields

**Invariant:** Each single-value tag (pattern, phase, status, brief) maps to exactly one metadata field with the correct type.

**Verified by:**

- Extract pattern name tag
- Extract phase number tag
- Extract status roadmap tag
- Extract status deferred tag
- Extract status completed tag
- Extract status active tag
- Extract brief path tag

</details>

<details>
<summary>Array value tags accumulate into list metadata fields (3 scenarios)</summary>

#### Array value tags accumulate into list metadata fields

**Invariant:** Tags for depends-on and enables split comma-separated values and accumulate across multiple tag occurrences.

**Verified by:**

- Extract single dependency
- Extract comma-separated dependencies
- Extract comma-separated enables

</details>

<details>
<summary>Category tags are colon-free tags filtered against known non-categories (2 scenarios)</summary>

#### Category tags are colon-free tags filtered against known non-categories

**Invariant:** Tags without colons become categories, except known non-category tags (acceptance-criteria, happy-path) and the libar-docs opt-in marker.

**Verified by:**

- Extract category tags (no colon)
- libar-docs opt-in marker is NOT a category

</details>

<details>
<summary>Complex tag lists produce fully populated metadata (1 scenarios)</summary>

#### Complex tag lists produce fully populated metadata

**Invariant:** All tag types (scalar, array, category) are correctly extracted from a single mixed tag list.

**Verified by:**

- Extract all metadata from complex tag list

</details>

<details>
<summary>Edge cases produce safe defaults (2 scenarios)</summary>

#### Edge cases produce safe defaults

**Invariant:** Empty or invalid inputs produce empty metadata or omit invalid fields rather than throwing errors.

**Verified by:**

- Empty tag list returns empty metadata
- Invalid phase number is ignored

</details>

<details>
<summary>Convention tags support CSV values with whitespace trimming (3 scenarios)</summary>

#### Convention tags support CSV values with whitespace trimming

**Invariant:** Convention tags split comma-separated values and trim whitespace from each value.

**Verified by:**

- Extract single convention tag
- Extract CSV convention tags
- Convention tag trims whitespace in CSV values

</details>

<details>
<summary>Registry-driven extraction handles enums, transforms, and value constraints (8 scenarios)</summary>

#### Registry-driven extraction handles enums, transforms, and value constraints

**Invariant:** Tags defined in the registry use data-driven extraction with enum validation, CSV accumulation, value transforms, and constraint checking.

**Verified by:**

- Registry-driven enum tag without prior if/else branch
- Registry-driven enum rejects invalid value
- Registry-driven CSV tag accumulates values
- Transform applies hyphen-to-space on business value
- Transform applies ADR number padding
- Transform strips quotes from title tag
- Repeatable value tag accumulates multiple occurrences
- CSV with values constraint rejects invalid values

</details>

### LayerInferenceTesting

[View LayerInferenceTesting source](tests/features/behavior/layer-inference.feature)

The layer inference module classifies feature files into testing layers
(timeline, domain, integration, e2e, component) based on directory path patterns.
This enables automatic filtering and documentation grouping without explicit annotations.

**Problem:**

- Manual layer annotation in every feature file is tedious and error-prone
- Inconsistent classification across projects makes filtering unreliable
- Cross-platform path differences (Windows backslashes) cause classification failures
- No fallback for unclassified features leads to missing test coverage

**Solution:**

- Directory-based inference using path pattern matching
- Priority-based pattern matching (integration checked before domain)
- Path normalization handles Windows, mixed separators, and case differences
- "unknown" fallback layer ensures all features are captured
- FEATURE_LAYERS constant provides validated layer enumeration

<details>
<summary>Timeline layer is detected from /timeline/ directory segments (3 scenarios)</summary>

#### Timeline layer is detected from /timeline/ directory segments

**Invariant:** Any feature file path containing a /timeline/ directory segment is classified as timeline layer.

**Verified by:**

- Detect timeline features from /timeline/ path
- Detect timeline features regardless of parent directories
- Detect timeline features in delivery-process package

</details>

<details>
<summary>Domain layer is detected from business context directory segments (3 scenarios)</summary>

#### Domain layer is detected from business context directory segments

**Invariant:** Feature files in /deciders/, /orders/, or /inventory/ directories are classified as domain layer.

**Verified by:**

- Detect decider features as domain
- Detect orders features as domain
- Detect inventory features as domain

</details>

<details>
<summary>Integration layer is detected and takes priority over domain directories (4 scenarios)</summary>

#### Integration layer is detected and takes priority over domain directories

**Invariant:** Paths containing /integration-features/ or /integration/ are classified as integration, even when they also contain domain directory names.

**Verified by:**

- Detect integration-features directory as integration
- Detect /integration/ directory as integration
- Integration takes priority over orders subdirectory
- Integration takes priority over inventory subdirectory

</details>

<details>
<summary>E2E layer is detected from /e2e/ directory segments (3 scenarios)</summary>

#### E2E layer is detected from /e2e/ directory segments

**Invariant:** Any feature file path containing an /e2e/ directory segment is classified as e2e layer.

**Verified by:**

- Detect e2e features from /e2e/ path
- Detect e2e features in frontend app
- Detect e2e-journeys as e2e

</details>

<details>
<summary>Component layer is detected from tool-specific directory segments (2 scenarios)</summary>

#### Component layer is detected from tool-specific directory segments

**Invariant:** Feature files in /scanner/ or /lint/ directories are classified as component layer.

**Verified by:**

- Detect scanner features as component
- Detect lint features as component

</details>

<details>
<summary>Unknown layer is the fallback for unclassified paths (3 scenarios)</summary>

#### Unknown layer is the fallback for unclassified paths

**Invariant:** Any feature file path that does not match a known layer pattern is classified as unknown.

**Verified by:**

- Return unknown for unclassified paths
- Return unknown for root-level features
- Return unknown for generic test paths

</details>

<details>
<summary>Path normalization handles cross-platform and case differences (7 scenarios)</summary>

#### Path normalization handles cross-platform and case differences

**Invariant:** Layer inference produces correct results regardless of path separators, case, or absolute vs relative paths.

**Verified by:**

- Handle Windows-style paths with backslashes
- Be case-insensitive
- Handle mixed path separators
- Handle absolute Unix paths
- Handle Windows absolute paths
- Timeline in filename only should not match
- Timeline detected even with deep nesting

</details>

<details>
<summary>FEATURE_LAYERS constant provides validated layer enumeration (3 scenarios)</summary>

#### FEATURE_LAYERS constant provides validated layer enumeration

**Invariant:** FEATURE_LAYERS is a readonly array containing exactly all 6 valid layer values.

**Verified by:**

- FEATURE_LAYERS contains all valid layer values
- FEATURE_LAYERS has exactly 6 layers
- FEATURE_LAYERS is a readonly array

</details>

### DirectiveDetection

[View DirectiveDetection source](tests/features/behavior/directive-detection.feature)

Pure functions that detect @libar-docs directives in TypeScript source code.
These functions enable quick file filtering before full AST parsing.

**Problem:**

- Full AST parsing of every TypeScript file is expensive and slow
- Files without documentation directives waste processing time
- Need to distinguish file-level opt-in (@libar-docs) from section tags (@libar-docs-\*)
- Similar patterns like @libar-doc-core could cause false positives

**Solution:**

- hasDocDirectives: Fast regex check for any @libar-docs-\* directive
- hasFileOptIn: Validates explicit @libar-docs opt-in (not @libar-docs-\*)
- Both use regex patterns optimized for quick filtering before AST parsing
- Negative lookahead ensures @libar-docs doesn't match @libar-docs-\*

#### hasDocDirectives detects @libar-docs-\* section directives

**Invariant:** hasDocDirectives must return true if and only if the source contains at least one @libar-docs-{suffix} directive (case-sensitive, @ required, suffix required).

**Rationale:** This is the first-pass filter in the scanner pipeline; false negatives cause patterns to be silently missed, while false positives only waste AST parsing time.

**Verified by:**

- Detect @libar-docs-core directive in JSDoc block
- Detect various @libar-docs-\* directives
- Detect directive anywhere in file content
- Detect multiple directives on same line
- Detect directive in inline comment
- Return false for content without directives
- Return false for empty content in hasDocDirectives
- Reject similar but non-matching patterns

#### hasFileOptIn detects file-level @libar-docs marker

**Invariant:** hasFileOptIn must return true if and only if the source contains a bare @libar-docs tag (not followed by a hyphen) inside a JSDoc block comment; line comments and @libar-docs-\* suffixed tags must not match.

**Rationale:** File-level opt-in is the gate for including a file in the scanner pipeline; confusing @libar-docs-core (a section tag) with @libar-docs (file opt-in) would either miss files or over-include them.

**Verified by:**

- Detect @libar-docs in JSDoc block comment
- Detect @libar-docs with description on same line
- Detect @libar-docs in multi-line JSDoc
- Detect @libar-docs anywhere in file
- Detect @libar-docs combined with section tags
- Return false when only section tags present
- Return false for multiple section tags without opt-in
- Return false for empty content in hasFileOptIn
- Return false for @libar-docs in line comment
- Not confuse @libar-docs-\* with @libar-docs opt-in

### ContextInference

[View ContextInference source](tests/features/behavior/context-inference.feature)

**Problem:**
Patterns in standard directories (src/validation/, src/scanner/) should
automatically receive architecture context without explicit annotation.

**Solution:**
Implement configurable inference rules that map file path patterns to
bounded contexts using wildcard matching.

<details>
<summary>matchPattern supports recursive wildcard ** (1 scenarios)</summary>

#### matchPattern supports recursive wildcard \*\*

**Invariant:** The `**` wildcard matches files at any nesting depth below the specified directory prefix.

**Rationale:** Directory hierarchies vary in depth; recursive matching ensures all nested files inherit context.

**Verified by:**

- Recursive wildcard matches nested paths

</details>

<details>
<summary>matchPattern supports single-level wildcard /* (1 scenarios)</summary>

#### matchPattern supports single-level wildcard /\*

**Invariant:** The `/*` wildcard matches only direct children of the specified directory, not deeper nested files.

**Rationale:** Some contexts apply only to a specific directory level, not its entire subtree.

**Verified by:**

- Single-level wildcard matches direct children only

</details>

<details>
<summary>matchPattern supports prefix matching (1 scenarios)</summary>

#### matchPattern supports prefix matching

**Invariant:** A trailing slash pattern matches any file whose path starts with that directory prefix.

**Verified by:**

- Prefix matching behavior

</details>

<details>
<summary>inferContext returns undefined when no rules match (2 scenarios)</summary>

#### inferContext returns undefined when no rules match

**Invariant:** When no inference rule matches a file path, the pattern receives no inferred context and is excluded from the byContext index.

**Rationale:** Unmatched files must not receive a spurious context assignment; absence of context is a valid state.

**Verified by:**

- Empty rules array returns undefined
- File path does not match any rule

</details>

<details>
<summary>inferContext applies first matching rule (2 scenarios)</summary>

#### inferContext applies first matching rule

**Invariant:** When multiple rules could match a file path, only the first matching rule determines the inferred context.

**Rationale:** Deterministic ordering prevents ambiguous context assignment when rules overlap.

**Verified by:**

- Single matching rule infers context
- First matching rule wins when multiple could match

</details>

<details>
<summary>Explicit archContext is not overridden (1 scenarios)</summary>

#### Explicit archContext is not overridden

**Invariant:** A pattern with an explicitly annotated archContext retains that value regardless of matching inference rules.

**Rationale:** Explicit annotations represent intentional developer decisions that must not be silently overwritten by automation.

**Verified by:**

- Explicit context takes precedence over inference

</details>

<details>
<summary>Inference works independently of archLayer (1 scenarios)</summary>

#### Inference works independently of archLayer

**Invariant:** Context inference operates on file path alone; the presence or absence of archLayer does not affect context assignment.

**Verified by:**

- Pattern without archLayer is still added to byContext if context is inferred

</details>

<details>
<summary>Default rules map standard directories (1 scenarios)</summary>

#### Default rules map standard directories

**Invariant:** Each standard source directory (validation, scanner, extractor, etc.) maps to a well-known bounded context name via the default rule set.

**Rationale:** Convention-based mapping eliminates the need for explicit context annotations on every file in standard directories.

**Verified by:**

- Default directory mappings

</details>

### UsesTagTesting

[View UsesTagTesting source](tests/features/behavior/pattern-relationships/uses-tag.feature)

Tests extraction and processing of @libar-docs-uses and @libar-docs-used-by
relationship tags from TypeScript files.

<details>
<summary>Uses tag is defined in taxonomy registry (2 scenarios)</summary>

#### Uses tag is defined in taxonomy registry

**Invariant:** The uses and used-by tags must be registered in the taxonomy with CSV format and dependency-related purpose descriptions.

**Verified by:**

- Uses tag exists in registry
- Used-by tag exists in registry

</details>

<details>
<summary>Uses tag is extracted from TypeScript files (2 scenarios)</summary>

#### Uses tag is extracted from TypeScript files

**Invariant:** The AST parser must extract single and comma-separated uses values from TypeScript JSDoc annotations.

**Verified by:**

- Single uses value extracted
- Multiple uses values extracted as CSV

</details>

<details>
<summary>Used-by tag is extracted from TypeScript files (2 scenarios)</summary>

#### Used-by tag is extracted from TypeScript files

**Invariant:** The AST parser must extract single and comma-separated used-by values from TypeScript JSDoc annotations.

**Verified by:**

- Single used-by value extracted
- Multiple used-by values extracted as CSV

</details>

<details>
<summary>Uses relationships are stored in relationship index (2 scenarios)</summary>

#### Uses relationships are stored in relationship index

**Invariant:** All declared uses and usedBy relationships must be stored in the relationship index as explicitly declared entries.

**Verified by:**

- Uses relationships stored in relationship index
- UsedBy relationships stored explicitly
- UsedBy relationships stored explicitly

  The relationship index stores uses and usedBy relationships directly
  from pattern metadata. Unlike implements

- these are explicit declarations.

</details>

<details>
<summary>Schemas validate uses field correctly (2 scenarios)</summary>

#### Schemas validate uses field correctly

**Invariant:** DocDirective and RelationshipEntry schemas must accept uses and usedBy fields as valid CSV string values.

**Verified by:**

- DocDirective schema accepts uses
- RelationshipEntry schema accepts usedBy

</details>

### ImplementsTagProcessing

[View ImplementsTagProcessing source](tests/features/behavior/pattern-relationships/implements-tag.feature)

Tests for the @libar-docs-implements tag which links implementation files
to their corresponding roadmap pattern specifications.

<details>
<summary>Implements tag is defined in taxonomy registry (1 scenarios)</summary>

#### Implements tag is defined in taxonomy registry

**Invariant:** The implements tag must exist in the taxonomy registry with CSV format.

**Verified by:**

- Implements tag exists in registry
- Implements tag exists in registry

  The tag registry defines `implements` with CSV format

- enabling the
  data-driven AST parser to automatically extract it.

</details>

<details>
<summary>Files can implement a single pattern (2 scenarios)</summary>

#### Files can implement a single pattern

**Invariant:** The AST parser must extract a single implements value and preserve it through the extraction pipeline.

**Verified by:**

- Parse implements with single pattern
- Implements preserved through extraction pipeline

</details>

<details>
<summary>Files can implement multiple patterns using CSV format (2 scenarios)</summary>

#### Files can implement multiple patterns using CSV format

**Invariant:** The AST parser must split CSV implements values into individual pattern references with whitespace trimming.

**Verified by:**

- Parse implements with multiple patterns
- CSV values are trimmed

</details>

<details>
<summary>Transform builds implementedBy reverse lookup (2 scenarios)</summary>

#### Transform builds implementedBy reverse lookup

**Invariant:** The transform must compute an implementedBy reverse index so spec patterns know which files implement them.

**Verified by:**

- Single implementation creates reverse lookup
- Multiple implementations aggregate

</details>

<details>
<summary>Schemas validate implements field correctly (2 scenarios)</summary>

#### Schemas validate implements field correctly

**Invariant:** The Zod schemas must accept implements and implementedBy fields with correct array-of-string types.

**Verified by:**

- DocDirective schema accepts implements
- RelationshipEntry schema accepts implementedBy

</details>

### ExtendsTagTesting

[View ExtendsTagTesting source](tests/features/behavior/pattern-relationships/extends-tag.feature)

Tests for the @libar-docs-extends tag which establishes generalization
relationships between patterns (pattern inheritance).

<details>
<summary>Extends tag is defined in taxonomy registry (1 scenarios)</summary>

#### Extends tag is defined in taxonomy registry

**Invariant:** The extends tag must exist in the taxonomy registry with single-value format.

**Verified by:**

- Extends tag exists in registry

</details>

<details>
<summary>Patterns can extend exactly one base pattern (2 scenarios)</summary>

#### Patterns can extend exactly one base pattern

**Invariant:** A pattern may extend at most one base pattern, enforced by single-value tag format.

**Rationale:** Single inheritance avoids diamond-problem ambiguity in pattern generalization hierarchies.

**Verified by:**

- Parse extends from feature file
- Extends preserved through extraction pipeline
- Extends preserved through extraction pipeline

  Extends uses single-value format because pattern inheritance should be
  single-inheritance to avoid diamond problems.

</details>

<details>
<summary>Transform builds extendedBy reverse lookup (1 scenarios)</summary>

#### Transform builds extendedBy reverse lookup

**Invariant:** The transform must compute an extendedBy reverse index so base patterns know which patterns extend them.

**Verified by:**

- Extended pattern knows its extensions

</details>

<details>
<summary>Linter detects circular inheritance chains (2 scenarios)</summary>

#### Linter detects circular inheritance chains

**Invariant:** Circular inheritance chains (direct or transitive) must be detected and reported as errors.

**Rationale:** Circular extends relationships create infinite resolution loops and undefined behavior.

**Verified by:**

- Direct circular inheritance detected
- Transitive circular inheritance detected

</details>

### DependsOnTagTesting

[View DependsOnTagTesting source](tests/features/behavior/pattern-relationships/depends-on-tag.feature)

Tests extraction of @libar-docs-depends-on and @libar-docs-enables
relationship tags from Gherkin files.

<details>
<summary>Depends-on tag is defined in taxonomy registry (2 scenarios)</summary>

#### Depends-on tag is defined in taxonomy registry

**Invariant:** The depends-on and enables tags must exist in the taxonomy registry with CSV format.

**Verified by:**

- Depends-on tag exists in registry
- Enables tag exists in registry

</details>

<details>
<summary>Depends-on tag is extracted from Gherkin files (2 scenarios)</summary>

#### Depends-on tag is extracted from Gherkin files

**Invariant:** The Gherkin parser must extract depends-on values from feature file tags, including CSV multi-value lists.

**Verified by:**

- Depends-on extracted from feature file
- Multiple depends-on values extracted as CSV

</details>

<details>
<summary>Depends-on in TypeScript triggers anti-pattern warning (1 scenarios)</summary>

#### Depends-on in TypeScript triggers anti-pattern warning

**Invariant:** The depends-on tag must only appear in Gherkin files; its presence in TypeScript is an anti-pattern.

**Rationale:** Depends-on represents planning dependencies owned by Gherkin specs, not runtime dependencies owned by TypeScript.

**Verified by:**

- Depends-on in TypeScript is detected by lint rule
- Depends-on in TypeScript is detected by lint rule

  The depends-on tag is for planning dependencies and belongs in feature
  files

- not TypeScript code. TypeScript files should use "uses" for
  runtime dependencies.

</details>

<details>
<summary>Enables tag is extracted from Gherkin files (2 scenarios)</summary>

#### Enables tag is extracted from Gherkin files

**Invariant:** The Gherkin parser must extract enables values from feature file tags, including CSV multi-value lists.

**Verified by:**

- Enables extracted from feature file
- Multiple enables values extracted as CSV

</details>

<details>
<summary>Planning dependencies are stored in relationship index (2 scenarios)</summary>

#### Planning dependencies are stored in relationship index

**Invariant:** The relationship index must store dependsOn and enables relationships extracted from pattern metadata.

**Verified by:**

- DependsOn relationships stored in relationship index
- Enables relationships stored explicitly
- Enables relationships stored explicitly

  The relationship index stores dependsOn and enables relationships
  directly from pattern metadata. These are explicit declarations.

</details>

---
