# Handoff — WS-7 `@architect-shape` tier (annotation + rendering)

**Status:** deferred to a fresh session. WS-7 is two distinct pieces: (1) a bulk
`@architect-shape` annotation pass over contract/codec modules, and (2) a **new**
shape-rendering subsystem that does not exist yet. The rendering **home** (where
field-tables/API-reference content lives) needs deliberate architectural review — do
**not** guess it. This doc is the fresh session's complete starting point.

> Authoring note: written knowing it will be read once and acted on. The "open
> decisions" section is the actual work of the design step — resolve those first.

---

## What shipped this campaign session (baseline — all gates green)

| Commit    | What                                                                                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0f0d25a` | **Phase 0** — escape sourced architecture titles + mermaid labels (ADR-009 fix + raw-content hardening). The bug that broke the prior session.                                                                             |
| `e28392d` | **WS-5** — `package` as a first-class read-model dimension: `ArchIndex.byPackage` resolved at `transformToPatternGraph()` time; `list --package`, `arch packages`, `package` on read output; frozen help-contract updated. |
| `d1809a5` | **WS-6a** — fan-in/hub ranking section on the architecture view (`fanIn` on `ArchitectureDiagram`).                                                                                                                        |
| `1b283b2` | **WS-6b** — cross-package bounded-context table (`crossPackageContexts`).                                                                                                                                                  |
| `60145b3` | **WS-6c** — split `ARCHITECTURE.md` into a routed lens tree: root (component) + `architecture/package-seam.md` + `architecture/layered.md`; added `'package'` scope; `buildArchitectureBundle`; root↔child links.          |

Substrate now available to WS-7: `graph.archIndex.byPackage` (WS-5), the routed-docs
bundle pattern proven for `architecture` (WS-6c), and the **ADR-009 escaping discipline**
applied throughout (sourced text is escaped; only renderer-authored markdown is trusted).

**Working tree:** only `FEEDBACK.md` carries pre-existing uncommitted edits from before this
campaign session — leave them alone unless the user says otherwise.

---

## WS-7 facts (verified this session)

### Annotation side — machinery exists, data source is empty

- `@architect-shape` occurrences in `packages/*/src/**`: **0**. The tier is entirely
  unstarted on the production side.
- **Tag grammar:** `@architect-shape [optional-group]` (bare tag, or one string group
  label). Parser: `packages/architect-core/src/extractor/shape-extractor.ts:610-615`
  (`extractShapeTag`). Discovery/AST walk: same file `:629-678` (`discoverTaggedShapes`),
  which ALSO parses JSDoc `@param` / `@returns` / `@throws` and interface property docs.
- **Schema:** `packages/architect-core/src/validation-schemas/extracted-shape.ts` —
  `ExtractedShapeSchema` carries `name`, `kind` (`interface|type|enum|function|const`),
  `sourceText`, `jsDoc?`, `lineNumber`, `typeParameters?`, `extends?`, `overloads?`,
  `exported`, `group?`, `includes?`, `propertyDocs?` (`{name, jsDoc}[]`), `params?`
  (`{name, type?, description}[]`), `returns?` (`{type?, description}`), `throws?`.
- **Storage:** `packages/architect-core/src/extractor/doc-extractor.ts:198-221` calls
  `discoverTaggedShapes()` and populates `ExtractedPattern.extractedShapes[]` when shapes
  are found. So once a module is annotated, the shapes flow into the graph automatically.
- **NOT registered in the taxonomy:** `packages/architect-core/src/taxonomy/registry-builder.ts`
  has no `@architect-shape` entry. The tag is parsed but not a declared metadata tag —
  decide whether to register it (likely yes, for guard/validation consistency).

### Annotation targets (the bulk pass — ideal for `/codex-rescue-x` GPT-5.4)

- **62 `@architect-role:contract` patterns + 7 `@architect-role:codec` patterns** (≈69
  modules) — enumerate live with:
  `pnpm -s architect:query list --role contract --format json | jq` (and `--role codec`).
  Heaviest in `architect-projection` (fragment schemas), then `architect-core`
  (Result/ExtractedPattern/PatternGraph/TagRegistry/etc.), a couple in `architect-guard`.
- **Per-module annotation pattern:** add `@architect-shape` to exported
  interface/type/enum/const/function declarations; enrich JSDoc (`@param`/`@returns`/
  `@throws` on functions, property JSDoc on interface members). This is additive
  enrichment — production code MUST NOT add `@architect-pattern` (split-ownership).
- Parallelize by package/bounded-context with strict file ownership. **Sequence
  projection-fragment annotations after the rendering design lands** so churn doesn't
  collide with the rendering work.

### Rendering side — UNIMPLEMENTED (the real design work)

- No projection or fragment consumes `extractedShapes` today. Grep confirms `extractedShapes`
  appears only in `extracted-pattern.ts` (the record field) and `doc-extractor.ts` (the
  populate site) — nothing on the projection/renderer side.
- A new subsystem must: surface `extractedShapes` into a projection fragment, render
  field-tables / API-reference blocks, and route them into docs. **All sourced shape text
  (names, types, descriptions, property docs) is SOURCED → must be escaped per ADR-009**
  — the same trust boundary Phase 0 fixed for titles and mermaid labels. Use the plain
  `table`/`paragraph` block helpers (they escape), never the trusted variants, for shape
  data. This is the single most likely place to reintroduce the bug just fixed.

---

## Open decisions (resolve in the design step — do NOT guess)

1. **Rendering home (the big one).** Two grounded options:
   - **(a) Per-pattern detail in the `patterns` doc.** Surface `extractedShapes` into
     `PatternDetail` (`packages/architect-projection/src/fragments/pattern-relations/pattern-detail.ts`)
     and render a "Shape / API" field-table inside each `patterns/<pattern>.md` child. The
     `patterns` documentType already has `childDirectory: 'patterns'` routing — no new
     documentType. Shapes sit with their owning pattern. Lighter; reuses everything.
   - **(b) New `api-reference` documentType + generator.** A dedicated `API-REFERENCE.md`
     - per-module children. Cleaner separation of API surface from the pattern catalog, but
       it is a NET-NEW documentType (registry identity/output-routing/disclosure/cli-surface
       entries + a generator) — more machinery, and a new pattern, so it routes through
       `architect-sessions` plan→design, not the refactor carve-out.
   - Picking (a) vs (b) decides whether WS-7 rendering is a **refactor** (evolve the shipped
     patterns projection) or a **new pattern** (full lifecycle). This is why it needs review.
2. **Field-table shape & disclosure.** What columns (name/kind/type/description?), how
   functions vs interfaces vs enums render, and at which disclosure levels children emit
   (mirror the WS-6c `emitChildren` decision in `disclosure-matrix.ts`).
3. **Taxonomy registration** of `@architect-shape` (and whether guard validates it).
4. **Annotation depth contract** — what counts as "done" for a module (every exported
   contract symbol? only public API?). Set this before the bulk pass so Codex has a crisp bar.

---

## Recommended sequence for the fresh session

1. Load `architect-base` + `architect-data-api` + `architect-sessions` (and
   `architect-refactor-session` if rendering home = option (a)).
2. **Resolve the open decisions** (esp. rendering home) with the user — this is a design
   review, not an implementation kickoff.
3. **Build + prove the rendering subsystem** with a handful of seed `@architect-shape`
   annotations end-to-end (annotation → `extractedShapes` → fragment → field-table doc),
   gated and committed. Escape all sourced shape text (ADR-009).
4. **Delegate the ~69-module annotation bulk** to `/codex-rescue-x` (GPT-5.4) with a crisp
   brief (tag grammar, target list from the API, JSDoc enrichment pattern, the "done" bar).
   Verify via typecheck + the rendering output growing + the full gate suite.
5. Re-baseline `docs-live/` and the projection perf baseline (both will move — intended).

## Gate suite (every commit)

```
pnpm typecheck && pnpm build && pnpm test && pnpm test:dogfood
pnpm docs:all && git diff --exit-code docs-live/   # WS-7 will re-baseline intentionally
pnpm --filter @libar-dev/architect-projection run test:perf:baseline
pnpm -s architect:query arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict
pnpm validate:all && pnpm check:skills
```

## Doctrine tripwires (carried from this session)

- **ADR-009 / raw-content:** sourced text is escaped by default; only renderer-authored
  markdown/mermaid is trusted. Shape field text is sourced — escape it. (Phase 0 was
  entirely about fixing this class of bug; do not reintroduce it.)
- **No-BC:** no shims/`@ts-ignore`/`@ts-expect-error`/compat aliases; never `--no-verify`.
- **Zod-first:** `z.strictObject`, types via `z.infer`, parse once. New fragment fields
  follow the `fanIn`/`crossPackageContexts` precedent added in WS-6.
- **Refactor carve-out** (if rendering home = option (a)): evolve the shipped pattern's
  executable Gherkin in lockstep with code; additive behavior needs no `DECISIONS.md`
  entry, but any _changed_ invariant does.
- **WS-5 note for reviewers:** `transformToPatternGraph`'s `packageResolver` param is
  optional and `UNMAPPED_PACKAGE` is swallowed during `byPackage` population (best-effort;
  production config covers all roots). Flagged as a known design choice, not a bug.
