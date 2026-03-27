### Product Area Enrichment Guide

Workflow for adding live Mermaid diagrams, enriched intros, and API Types sections to product area documents in `docs-live/product-areas/`.

**Completed:** Annotation, Configuration, CoreTypes
**Remaining:** Generation, Validation, DataAPI, Process

#### Pre-Flight (Run First)

```bash
# 1. Find unannotated TS files in the product area's source directory
pnpm architect:query -- unannotated --path src/<area-dir>

# 2. Check if product area has arch-context mappings
#    Empty [] means use @architect-include tags instead
grep -A5 '<AreaName>:' src/renderable/codecs/reference.ts | head -10

# 3. List patterns in the product area
pnpm architect:query -- list --product-area <AreaName> --names-only
```

#### Step-by-Step Workflow

| Step | Action                                                                 | Why                                          |
| ---- | ---------------------------------------------------------------------- | -------------------------------------------- |
| 1    | Add `@architect` to unannotated TS files                               | Scanner ignores files without opt-in marker  |
| 2    | Add `@architect-include:<scope>` to all feature files                  | Enables diagram scoping via `include` filter |
| 3    | Add `@architect-depends-on` to feature files                           | Creates relationship edges in diagrams       |
| 4    | Add `@architect-shape` + `@architect-include` to key type declarations | Populates API Types section                  |
| 5    | Add `@architect-product-area:<Area>` to TS file annotations            | Routes TS patterns to product area           |
| 6    | Update `PRODUCT_AREA_META` in `reference.ts` (~line 237)               | Enriched intro, invariants, `diagramScopes`  |
| 7    | `pnpm build && pnpm test && pnpm docs:product-areas`                   | Verify end-to-end                            |

#### PRODUCT_AREA_META Entry Structure

```typescript
AreaName: {
  question: 'What does this area do?',           // Shown as bold question before intro
  covers: 'capability1, capability2, capability3', // Comma-separated coverage summary
  intro: 'Full paragraph describing the area...',  // Rich prose, can use backticks
  diagramScopes: [
    { include: ['scope'], diagramType: 'C4Context', title: 'System Overview' },
    { include: ['scope'], direction: 'LR', title: 'Data Flow' },
  ],
  keyInvariants: [
    'Invariant name: Description with detail',
  ],
  keyPatterns: ['Pattern1', 'Pattern2'],
},
```

#### DiagramScope Filter Options

Filters are OR'd — a pattern matching ANY filter appears in the diagram:

| Filter                 | Source Tag                     | Best For                                         |
| ---------------------- | ------------------------------ | ------------------------------------------------ |
| `include: ['scope']`   | `@architect-include:scope`     | Areas with empty `PRODUCT_AREA_ARCH_CONTEXT_MAP` |
| `archContext: ['ctx']` | `@architect-arch-context:ctx`  | Areas with existing arch-context mappings        |
| `patterns: ['Name']`   | Direct pattern name list       | Small, curated diagrams                          |
| `archLayer: 'domain'`  | `@architect-arch-layer:domain` | Layer-filtered views                             |

#### Common Pitfalls

| Pitfall                                    | Symptom                                            | Fix                                                  |
| ------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------- |
| TS file missing `@architect` marker        | Shapes not extracted, pattern absent from registry | Add file-level `@architect` annotation block         |
| Empty `PRODUCT_AREA_ARCH_CONTEXT_MAP`      | No diagrams render                                 | Use `include` filter in `diagramScopes`              |
| No relationship tags on patterns           | Diagrams show isolated nodes (no edges)            | Add `@architect-depends-on` to feature files         |
| TS pattern name collides with Gherkin      | Duplicate pattern error                            | Use different name + `@architect-implements` to link |
| Declaration merging (`type X` + `const X`) | Shape for type alias not extracted                 | Fixed — `findDeclarations` returns arrays per name   |
| Generic arrows in `.ts` with `jsx: true`   | Parse error on `<T>(val: T) =>`                    | Fixed — `jsx` flag now based on file extension       |

#### Shape Extraction Prerequisites

For a shape to appear in the API Types section:

1. **File must have `@architect`** opt-in marker (file-level JSDoc)
2. **File must have `@architect-product-area:<Area>`** to route to product area
3. **Declaration must have `@architect-shape`** in its JSDoc (declaration-level)
4. **Declaration must have `@architect-include:<scope>`** matching the `diagramScopes` filter
5. **File must be `.ts`** (shape extraction uses typescript-estree parser)

Shape extraction works on both exported and non-exported declarations.

#### Verification Checklist

After regenerating docs, verify `docs-live/product-areas/<AREA>.md` has:

- [ ] Enriched intro paragraph (not just 1-2 sentences)
- [ ] Key Invariants section (3-4 invariants)
- [ ] Mermaid diagram(s) with nodes AND edges (not isolated nodes)
- [ ] API Types section with extracted shapes (if TS source declarations were tagged)
- [ ] Behavior Specifications listing all patterns with invariants and scenarios

```bash
# Quick verification
grep -c "mermaid" docs-live/product-areas/<AREA>.md    # Should be >= 2
grep -c "API Types" docs-live/product-areas/<AREA>.md  # Should be 1
```
