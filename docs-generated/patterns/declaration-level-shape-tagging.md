# ✅ Declaration Level Shape Tagging

**Purpose:** Detailed documentation for the Declaration Level Shape Tagging pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |
| Phase | 31 |

## Description

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
    Discrimination uses structural key presence:
    - group key present: group selector (select all shapes with this group)
    - source key present, names key present: source+names selector
    - source key present, no names key: source-only selector (all tagged
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

## Dependencies

- Depends on: ShapeExtraction
- Depends on: ReferenceDocShowcase

## Implementations

Files that implement this pattern:

- [`shape-matcher.feature`](../../tests/features/behavior/codecs/shape-matcher.feature) - Matches file paths against glob patterns for TypeScript shape extraction.
- [`shape-selector.feature`](../../tests/features/behavior/codecs/shape-selector.feature) - Tests the filterShapesBySelectors function that provides fine-grained
- [`declaration-level-shape-tagging.feature`](../../tests/features/extractor/declaration-level-shape-tagging.feature) - Tests the discoverTaggedShapes function that scans TypeScript source

## Acceptance Criteria

**Tagged declaration is extracted as shape**

- Given a TypeScript source file containing:
- When discoverTaggedShapes runs on the source
- Then 1 shape is returned
- And the shape has name "RiskLevel" and kind "interface"

```typescript
/** @libar-docs-shape */
export interface RiskLevel {
  readonly name: string;
  readonly severity: number;
}
```

**Untagged exported declaration is not extracted**

- Given a TypeScript source file containing:
- When discoverTaggedShapes runs on the source
- Then 0 shapes are returned

```typescript
/** Internal helper, not tagged for docs */
export function normalizeInput(raw: string): string {
  return raw.trim().toLowerCase();
}

export type InternalState = 'idle' | 'busy';
```

**Group name is captured from tag value**

- Given a TypeScript source file containing:
- When discoverTaggedShapes runs on the source
- Then 1 shape is returned
- And the shape has name "RiskLevel" and group "api-types"

```typescript
/** @libar-docs-shape api-types */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
```

**Bare tag works without group name**

- Given a TypeScript source file containing:
- When discoverTaggedShapes runs on the source
- Then 1 shape is returned
- And the shape has name "Priority" and no group

```typescript
/** @libar-docs-shape */
export enum Priority { Low, Medium, High }
```

**Non-exported tagged declaration is extracted**

- Given a TypeScript source file containing:
- When discoverTaggedShapes runs on the source
- Then 1 shape is returned
- And the shape has name "InternalConfig" and kind "interface"
- And the shape has exported false

```typescript
/** @libar-docs-shape internal-types */
interface InternalConfig {
  readonly maxRetries: number;
}
```

**Select specific shapes by source and names**

- Given a MasterDataset with patterns containing these extracted shapes:
- And a reference doc config with shapeSelectors:
- When the shape selector filtering runs
- Then 2 shapes are returned: "RiskLevel" and "RISK_LEVELS"
- And "RiskCalculator" is not included

| Pattern Source | Shape Name | Group | Kind |
| --- | --- | --- | --- |
| src/taxonomy/risk-levels.ts | RiskLevel | api-types | type |
| src/taxonomy/risk-levels.ts | RISK_LEVELS | api-types | const |
| src/taxonomy/risk-levels.ts | RiskCalculator |  | function |

```json
[{ "source": "src/taxonomy/risk-levels.ts", "names": ["RiskLevel", "RISK_LEVELS"] }]
```

**Select all shapes in a group**

- Given a MasterDataset with patterns containing these extracted shapes:
- And a reference doc config with shapeSelectors:
- When the shape selector filtering runs
- Then 2 shapes are returned: "RiskLevel" and "ProcessStatus"
- And "StatusHelper" is not included

| Pattern Source | Shape Name | Group | Kind |
| --- | --- | --- | --- |
| src/taxonomy/risk-levels.ts | RiskLevel | api-types | type |
| src/taxonomy/status-values.ts | ProcessStatus | api-types | type |
| src/taxonomy/status-values.ts | StatusHelper |  | function |

```json
[{ "group": "api-types" }]
```

**Select all tagged shapes from a source file**

- Given a MasterDataset with patterns containing these extracted shapes:
- And a reference doc config with shapeSelectors:
- When the shape selector filtering runs
- Then 3 shapes are returned from risk-levels.ts
- And "ProcessStatus" from status-values.ts is not included

| Pattern Source | Shape Name | Group | Kind |
| --- | --- | --- | --- |
| src/taxonomy/risk-levels.ts | RiskLevel | api-types | type |
| src/taxonomy/risk-levels.ts | RISK_LEVELS | api-types | const |
| src/taxonomy/risk-levels.ts | RiskCalculator |  | function |
| src/taxonomy/status-values.ts | ProcessStatus | api-types | type |

```json
[{ "source": "src/taxonomy/risk-levels.ts" }]
```

**shapeSources without shapeSelectors returns all shapes**

- Given a MasterDataset with patterns containing extracted shapes
- And a reference doc config with shapeSources "src/taxonomy/*.ts" only
- And no shapeSelectors configured
- When the reference codec renders
- Then all extracted shapes from matching files appear
- And behavior is identical to pre-existing extractShapesFromDataset

**All five declaration kinds are discoverable**

- Given a TypeScript source file containing:
- When discoverTaggedShapes runs on the source
- Then 5 shapes are returned
- And the shapes have kinds "interface", "type", "enum", "function", "const"
- And all shapes have group "core-types"

```typescript
/** @libar-docs-shape core-types */
export interface Config {
  readonly name: string;
}

/** @libar-docs-shape core-types */
export type Status = 'active' | 'inactive';

/** @libar-docs-shape core-types */
export enum Priority { Low, Medium, High }

/** @libar-docs-shape core-types */
export function validate(input: string): boolean {
  return input.length > 0;
}

/** @libar-docs-shape core-types */
export const MAX_RETRIES: number = 3;
```

**JSDoc with gap larger than MAX_JSDOC_LINE_DISTANCE is not matched**

- Given a TypeScript source file containing:
- When discoverTaggedShapes runs on the source
- Then 0 shapes are returned

```typescript
/** @libar-docs-shape */


// unrelated comment


export interface TooFar {
  readonly value: string;
}
```

**Tag coexists with other JSDoc content**

- Given a TypeScript source file containing:
- When discoverTaggedShapes runs on the source
- Then 1 shape is returned
- And the shape has name "RiskLevel" and group "risk-types"
- And the shape JSDoc contains "Represents risk severity levels"

```typescript
/**
 * Represents risk severity levels.
 *
 * @libar-docs-shape risk-types
 * @see RiskCalculator
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
```

## Business Rules

**Declarations opt in via libar-docs-shape tag**

**Invariant:** Only declarations with the libar-docs-shape tag in their
    immediately preceding JSDoc are collected as tagged shapes. Declarations
    without the tag are ignored even if they are exported. The tag value
    is optional -- bare libar-docs-shape opts in without a group, while
    libar-docs-shape group-name assigns the declaration to a named group.
    Tagged non-exported declarations are included (DD-7).

    **Rationale:** Explicit opt-in prevents over-extraction of internal
    helpers. Unlike auto-discovery mode (extract-shapes *) which grabs all
    exports, declaration-level tagging gives precise control. This matches
    how TypeDoc uses public/internal tags -- the annotation lives next to
    the code it describes, surviving refactors without breaking extraction.

    **Verified by:** Tagged declaration is extracted,
    Untagged export is ignored,
    Group name is captured from tag value,
    Bare tag works without group,
    Non-exported tagged declaration is extracted

_Verified by: Tagged declaration is extracted as shape, Untagged exported declaration is not extracted, Group name is captured from tag value, Bare tag works without group name, Non-exported tagged declaration is extracted_

**Reference doc configs select shapes via shapeSelectors**

**Invariant:** shapeSelectors provides three selection modes: by
    source path + specific names (DD-6 source+names variant), by group
    tag (DD-6 group variant), or by source path alone (DD-6 source-only
    variant). shapeSources remains for backward compatibility. When both
    are present, shapeSources provides the coarse file-level filter and
    shapeSelectors adds fine-grained name/group filtering on top.

    **Rationale:** The reference doc system composes focused documents
    from cherry-picked content. Every other content axis (conventions,
    behaviors, diagrams) has content-level filtering. shapeSources was
    the only axis limited to file-level granularity. shapeSelectors
    closes this gap with the same explicitness as conventionTags.

    **Verified by:** Select by source and names,
    Select by group,
    Select by source alone,
    shapeSources backward compatibility preserved

_Verified by: Select specific shapes by source and names, Select all shapes in a group, Select all tagged shapes from a source file, shapeSources without shapeSelectors returns all shapes_

**Discovery uses existing estree parser with JSDoc comment scanning**

**Invariant:** The discoverTaggedShapes function uses the existing
    typescript-estree parse() and extractPrecedingJsDoc() approach. It
    does not require the TypeScript compiler API, ts-morph, or
    parseAndGenerateServices. Tag detection is a regex match on the
    JSDoc comment text already extracted by the existing infrastructure.
    The tag regex pattern is: /libar-docs-shape(?:\s+(\S+))?/
    where capture group 1 is the optional group name.

    **Rationale:** The shape extractor already traverses declarations
    and extracts their JSDoc. Adding libar-docs-shape detection is a
    string search on content that is already available -- approximately
    15 lines of new logic. Switching parsers would introduce churn with
    no benefit for the v1 use case of tag detection on top-level
    declarations.

    **Verified by:** All 5 declaration kinds supported,
    JSDoc gap enforcement,
    Tag with other JSDoc content

_Verified by: All five declaration kinds are discoverable, JSDoc with gap larger than MAX_JSDOC_LINE_DISTANCE is not matched, Tag coexists with other JSDoc content_

---

[← Back to Pattern Registry](../PATTERNS.md)
