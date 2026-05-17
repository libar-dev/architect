# Phase 3b: Documentation Review — `packages/architect-projection/`

Reviewed against the doc-generation consolidation campaign (DEEP-DIVE + PROPOSED-DESIGN).

---

## Summary verdict

**The package documentation is above average for a pre-1.0 library and will not block the campaign from starting.** The structural docs (`README.md`, `MIGRATION.md`, `PERF.md`, `ddd-inventory.md`) are accurate and well-maintained. The 43 projection functions and 4 renderer entry points carry `@architect-*` annotations consistently, and the `README.md` section on the markdown trust boundary is substantive. However, three gaps will actively complicate campaign authorship: (1) the five Phase 2 security invariants are invisible in code — they exist only in the review artifact, not in the package; (2) `ProgressiveDisclosurePolicySchema` and its sibling schemas have zero `.describe()` calls, making the campaign's `extractZodSchemaFields()` extractor a no-op on its most important target; (3) the four renderer `### When to Use` stubs carry a copy-pasted placeholder ("As a typed contract / data shape consumed by projection or render layers") that is factually wrong for renderers and cannot be extracted into useful campaign content. These three items should be fixed before W-DOCS-1 lands.

---

## Findings

### F1 — Five security invariants (I1–I5) are invisible at the code level

**Severity:** Critical

**What's missing:** The five load-bearing invariants identified in Phase 2 (`sanitizeMarkdownLinkTarget` as single chokepoint, UI renderer missing URL sanitizer, `TRUSTED_MARKDOWN` module-private discipline, `isPlainObject` prototype check, `parseAndProject` as single options-parsing entrypoint) have no JSDoc annotation anywhere in the codebase. `sanitizeMarkdownLinkTarget` at `render-markdown.ts:1938` is a bare `function` with no doc comment. `isPlainObject` in both `render-json.ts:203` and `fragments/base.ts:78` similarly has no doc comment. `TRUSTED_MARKDOWN` at `render-markdown.ts:85` is a bare `const` with no annotation.

**Where it should live:**

- `render-markdown.ts:1938`: JSDoc block documenting I1 (single chokepoint, HTML-entity decode before classification, allowlist enforcement). Reference: "trust-boundary invariant I1".
- `render-markdown.ts:85`: JSDoc block documenting I3 (module-private by design; `composeDoc` must not export or accept externally tagged content).
- `render-json.ts:203`: JSDoc block documenting I4 (anti-prototype-pollution; `DocDefinition.build()` must not return non-default-prototype objects).
- `render-ui.ts` file-level JSDoc: note for I2 (UI renderer does NOT sanitize URLs — hardening priority when Studio comes online).
- `projections/_shared/parse-and-project.internal.ts`: the existing prose comment is good but should be tagged as I5-enforcement and cross-reference the `z.strictObject` doctrine.

**Why it matters for the campaign:** `composeDoc` and ContentFragment's `build()` will route new content through these paths. Campaign authors need to find the invariant at the call site, not in a review artifact that will not be distributed to contributors.

**Recommendation:** Add a one-paragraph JSDoc block to each of the five functions/constants. No tags needed — prose is sufficient. For I3, add a single-line `// @invariant: module-private — do not export or widen the scope of this symbol.` comment immediately above the `TRUSTED_MARKDOWN` declaration.

---

### F2 — Zero `.describe()` calls across all 135 source files

**Severity:** Critical

**What's missing:** The campaign's `extractZodSchemaFields()` extractor (PROPOSED-DESIGN §2) is designed to parse `z.strictObject({...}).describe(...)` calls into structured field-table rows. `ProgressiveDisclosurePolicySchema`, `DisclosureSpecSchema`, `SupportedDocumentationTypeRegistryEntrySchema`, `BlockSchema` (9 variants), and `ProjectionBundle` are the schemas whose field tables the campaign intends to generate. Zero of them use `.describe()`. This means `extractZodSchemaFields()` on its primary targets would return empty rows on day one, making the generated README's "Documentation Composition Contract" table unpopulateable until annotations are backfilled.

**Where it should live:** `.describe()` calls on each field of:

- `ProgressiveDisclosurePolicySchema` (3 fields: `level`, `availability`, `purpose`) — this is the exact table the README already hand-authors.
- `DisclosureSpecSchema` (6 fields: `grouping`, `richness`, `rootShape`, `emitChildren`, `committed`, `filter`) — campaign authors need to understand these to write ContentFragments correctly.
- `ContentRichnessSchema` and `GroupingAxisSchema` enum values — these are the vocabulary for the disclosure contract.

**Why it matters for the campaign:** The README worked example in DEEP-DIVE §2 calls `extractZodSchemaFields(ctx, 'ProgressiveDisclosurePolicySchema')` as its primary demo of the extractor surface. If that call returns nothing, the most visible demo fails. This is the "dogfooding embarrassment" the review prompt identifies.

**Recommendation:** Add `.describe()` to `ProgressiveDisclosurePolicySchema` fields before W-DOCS-1 ships. Treat the three `disclosure-spec.ts` schemas as the priority set (13 fields total). Do not add `.describe()` to internal helper schemas that the campaign will never extract.

---

### F3 — All four renderer `### When to Use` stubs carry a verbatim placeholder copied from contract files

**Severity:** High

**What's missing:** Every renderer (`render-markdown.ts`, `render-compact-text.ts`, `render-json.ts`, `render-ui.ts`) has `### When to Use\n * - As a typed contract / data shape consumed by projection or render layers.` as its file-level JSDoc. This text accurately describes fragment contracts and projection files. It is factually wrong for a renderer — renderers are not contracts, they are output surfaces. The campaign's `extractJSDocProse()` and DEEP-DIVE's `@architect-renderer` JSDoc tag plan both depend on renderer entry-point prose being meaningful. Today they would extract boilerplate.

**Where it should live:** File-level JSDoc on each renderer, with distinct "When to Use" content:

- `renderMarkdown`: "Use for all documentation output targets (`docs-live/`, `package-readme`). Returns `string` for fragments, `Record<string, string>` for multi-file bundles with routing. This is the renderer where ContentFragment output will land."
- `renderCompactText`: "Use for all CLI/MCP context outputs destined for LLM consumption. Returns structured plain text with `=== SECTION ===` markers."
- `renderJson`: "Use for structured tool output (MCP tools returning JSON, `architect_status`, `architect_rules`). Validates serializability and blocks non-plain-object prototype chains."
- `renderUi`: "Use for Studio desktop UI surfaces only. Does NOT sanitize link targets — hardening required before Studio surfaces user-controlled URLs (I2)."

**Why it matters for the campaign:** DEEP-DIVE §2 says the README "Renderer Overview" section could be regenerated from `@architect-renderer` JSDoc on the 4 renderer entry points. That is currently impossible because the "When to Use" content is indistinguishable from a schema file's boilerplate. The `MIGRATION.md` "Renderer Overview" section (already 150 lines of accurate content) will also remain hand-authored rather than generated unless this is fixed first.

**Recommendation:** Rewrite the `### When to Use` body on each of the four renderer files. The `MIGRATION.md` "Renderer Overview" prose already exists and can serve as the source.

---

### F4 — `documentation-bundle.internal.ts:64` dispatch table has no doc comment explaining it is the campaign's substrate

**Severity:** High

**What's missing:** `DOCUMENTATION_PROJECTION_FACTORIES` at `documentation-bundle.internal.ts:64` is the closed dispatch table that Phase 1 (C1) identified as the campaign's primary replacement target. It has no JSDoc, no inline comment, and no cross-reference to the `DocDefinition` replacement work. Campaign implementers arriving at W-DOCS-1 will not know this is the table to delete, not extend. The `assertSupportedDocumentType` and `projectDocumentationBundleInternal` functions also have no doc comments.

**Where it should live:** A block comment immediately above `DOCUMENTATION_PROJECTION_FACTORIES`:

```ts
/**
 * Registry-driven dispatch table for the current 12 supported documentation types.
 * This is the campaign's primary deletion target: W-DOCS-1 replaces this with
 * DocDefinition.build(graph) and removes SupportedDocumentationType entirely.
 * Do NOT add new entries here — add a DocDefinition in docs-config/ instead.
 * See: PROPOSED-DESIGN.md §1, Phase 1 finding C1.
 */
```

**Why it matters for the campaign:** Without this comment, any contributor onboarding to W-DOCS-1 will be uncertain whether to extend the table or replace it. The "do not extend" instruction is not recorded anywhere reachable from the code.

**Recommendation:** Add the block comment above. Optionally add `// TODO(W-DOCS-1): delete this table and the SupportedDocumentationType union` as a one-liner if the team uses TODO conventions.

---

### F5 — `DisclosureSpec` and `LogicalRouteId` are undocumented package-level primitives with no prose JSDoc

**Severity:** High

**What's missing:** `DisclosureSpec` (`disclosure-spec.ts`) and `LogicalRouteId` (`progressive-disclosure.ts`) are exported through the public `./projections` entry point and are the two types the campaign authors will use most. Neither has any prose JSDoc. The fields `grouping`, `richness`, `emitChildren`, `committed` are opaque without documentation. `LogicalRouteId` is a branded string type but its format rules (`<docType>:index`, `<docType>:<entityId>`, etc.) appear only in README prose, not adjacent to the type itself.

**Where it should live:**

- `DisclosureSpec`: 3–5 line JSDoc explaining the four fields that govern output shape, and that `emitChildren` controls bundle fan-out.
- `LogicalRouteId`: inline comment citing the three valid formats and a note that campaign `DocDefinition.targets` depend on these IDs for routing resolution.
- `ContentRichnessSchema` values: one-line comments per enum value (`'name-only'` = only the entity name, `'summary'` = name + one-paragraph description, `'full'` = all fields rendered).

**Why it matters for the campaign:** W-DOCS-2d (ContentFragments) requires ContentFragment authors to choose disclosure levels and route IDs. Without JSDoc adjacent to these types, authors must look up the README or find the correct test fixture.

**Recommendation:** Add 2–4 line prose JSDoc blocks to `DisclosureSpec`, `DisclosureSpecSchema`, `LogicalRouteId`, and the four `ContentRichnessSchema` enum values. This is the minimum to make these types self-explanatory.

---

### F6 — `addRoutedDocument` and `splitOversizedDocument` have no invariant documentation

**Severity:** High

**What's missing:** `addRoutedDocument` (`render-markdown.ts:302`) performs 2N+2 render passes (Phase 2 H1 finding), a known performance issue. It has no doc comment explaining this behavior or the campaign impact. `splitOversizedDocument` (`render-markdown.ts:2054`) is the output-side disclosure mechanism that ContentFragments will feed into — its invariants (groups by H2, skips `_preamble` group, emits back-links) are not documented.

**Where it should live:** JSDoc blocks on both functions explaining:

- `addRoutedDocument`: the pre-render + split-render sequence, the known 2N+2 over-rendering, and the campaign note to cache before W-DOCS-1 lands (Phase 2 H1).
- `splitOversizedDocument`: the `_preamble` group behavior, the H2-boundary split contract, and the cross-reference link (`← Back to <title>`) it emits.

**Why it matters for the campaign:** Campaign implementers working on W-DOCS-1 (the doc runner) will call `addRoutedDocument` indirectly for every `DocDefinition`. Finding the 2N+2 regression in a perf regression rather than in code comments wastes session time.

**Recommendation:** 4–6 line JSDoc on each function. For `addRoutedDocument`, include a `// PERF: renders 2N+2 times for split documents — cache before W-DOCS-1` annotation at the implementation line where the extra passes happen.

---

### F7 — `blocks/schema.ts` and `fragments/base.ts` have zero `@architect-*` annotations

**Severity:** Medium

**What's missing:** `blocks/schema.ts` defines the 9-block-type catalog and the `BlockSchema` discriminated union — the deepest shared substrate the campaign builds on. It has no file-level JSDoc, no `@architect-pattern`, no `@architect-role:contract`. Similarly, `fragments/base.ts` defines `ProjectionBundle`, `BundleRouting`, and `isBundle` — the fan-out contract every renderer depends on — and has no annotations or JSDoc at all.

**Where it should live:** File-level `@architect-pattern BlockTypesCatalog @architect-role:contract` JSDoc on `blocks/schema.ts`. File-level `@architect-pattern ProjectionBundleContract @architect-role:contract` JSDoc on `fragments/base.ts`. Prose JSDoc on `ProjectionBundle` explaining the `root`/`children`/`routing` shape and that `BundleRouting` is optional but required for multi-file markdown output.

**Why it matters for the campaign:** DEEP-DIVE §2 calls `extractTypeShapes({ group: 'block-types-catalog' })` as a demo extractor. That extractor can only discover the catalog if `blocks/schema.ts` carries the `@architect-extract-shapes` or equivalent annotation. Per annotation-ownership doctrine, code-originated patterns (pure contracts with no behavior) identify themselves via `@architect-pattern` on the `.ts` source. These two files are the clearest examples of code-originated contract patterns in the package.

**Recommendation:** Add file-level `@architect-pattern` + `@architect-role:contract` annotations per the annotation-ownership doctrine for code-originated patterns. Add prose JSDoc to `ProjectionBundle` and `BundleRouting` interfaces.

---

### F8 — README's "Documentation Composition Contract" table is not regeneratable today (sync gap with schema)

**Severity:** Medium

**What's missing:** The README's "Documentation Composition Contract" section (lines 99–127) describes the four disclosure levels with human-readable purpose descriptions. `PROGRESSIVE_DISCLOSURE_POLICY` in `progressive-disclosure.ts` contains equivalent data (`level`, `availability`, `purpose`). However, the README prose uses "Level 0–3" numbering and routing-position descriptions, while `PROGRESSIVE_DISCLOSURE_POLICY.purpose` uses different wording ("Root summaries and orientation needed before any drill-down" vs README's "index content that is always visible at `<docType>:index`"). The two are substantially — but not exactly — aligned.

More importantly, `ProgressiveDisclosurePolicySchema` has no `.describe()` on its fields (F2), meaning `extractZodSchemaFields()` cannot regenerate the table until F2 is fixed. And even after F2 is fixed, the `availability` column in the schema has no counterpart in the README table.

**Where it should live:** After F2 is resolved, the README table should become a `<!-- generated:disclosure-policy:start -->...<!-- generated:disclosure-policy:end -->` fence (PROPOSED-DESIGN §6). The preamble prose above the table ("Documentation-composition projections use progressive disclosure...") stays hand-authored.

**Why it matters for the campaign:** DEEP-DIVE §2 uses the README's "Documentation Composition Contract" table as the canonical worked example of `extractZodSchemaFields()`. Drift between the hand-authored table and the schema is an embarrassment for a package that generates documentation — and currently the campaign cannot close this drift gap without F2 being fixed first.

**Recommendation:** Fix F2 (`.describe()` on `ProgressiveDisclosurePolicySchema` fields) as a prerequisite. Then note the "Level 0–3" numbering in README is not in the schema data and decide: either add a `level_number` field to `PROGRESSIVE_DISCLOSURE_POLICY`, or let the campaign generate rows without numbers and update the README format. This is a pending decision for the design session, not a pre-campaign blocker.

---

### F9 — `MIGRATION.md` is accurate but does not acknowledge the v1→v2 collision map or `2.0.0-pre.1` status

**Severity:** Medium

**What's missing:** `MIGRATION.md` is accurate about the codec-to-projection mapping and the trust boundary contract. However: (1) it does not reference the 8 collision symbols documented in `REMAINING-WORK.md` appendix W1.5.7 — the document that JS consumers need to migrate v1 → v2 imports; (2) there is no CHANGELOG anywhere in the package (the root `docs-live/CHANGELOG.md` is generated; there is no committed CHANGELOG at the package level or repo root); (3) the v1→v2 collision map draft lives only in `REMAINING-WORK.md:344`, referenced in CLAUDE.md as "will graduate to a standalone MIGRATION.md at the 2.0.0-pre.1 release" — that graduation has not happened.

**Where it should live:** `REMAINING-WORK.md` already contains the content draft. The item `[ ] Author MIGRATION.md at repo root` (line 147) is the tracked task. The per-package `docs/MIGRATION.md` should add a cross-reference banner: "For v1→v2 import path changes (8 collision symbols), see the root MIGRATION.md once published."

**Why it matters for the campaign:** The campaign will add `DocDefinition` and ContentFragment as new exports. If `MIGRATION.md` already sets a precedent for tracking API surface changes, the campaign author will know to update it. If MIGRATION.md reads as "migration complete" without any v1→v2 pointer, campaign authors will not know to add migration notes for W-DOCS-1 additions.

**Recommendation:** Add a two-line banner to `packages/architect-projection/docs/MIGRATION.md` pointing at the forthcoming root `MIGRATION.md` for v1→v2 symbol moves. This is a one-commit fix.

---

### F10 — `context/projection-context.ts` lacks `@architect-*` annotation and has partial JSDoc

**Severity:** Medium

**What's missing:** `ProjectionContext` is the type passed to every one of the 43 projection functions. It has a partial JSDoc comment (lines 24–32) explaining `packageResolver`, but no `@architect-pattern`, `@architect-role:contract`, no mention of `projectionFilter` semantics, and no note on why `perspective` and `tagExampleOverrides` are optional. `PerspectiveHint` and `TagExampleOverrides` exported from this file have no documentation.

**Where it should live:** File-level `@architect-pattern ProjectionContextContract @architect-role:contract` annotation. Prose JSDoc on the `projectionFilter` field explaining it is set by `withDocumentationFilter` for disclosure-scoped doc runs.

**Why it matters for the campaign:** `DocBuildContext` in PROPOSED-DESIGN §1 is a leaner version of `ProjectionContext` — campaign authors need to understand what they are simplifying and why `emittingDocId` is added. Without `ProjectionContext` being annotated, the extractor-based worked examples cannot automatically surface the context type signature in generated package READMEs.

**Recommendation:** Add file-level `@architect-pattern` annotation per annotation-ownership doctrine. Expand the existing JSDoc to cover all five fields in two lines each.

---

### F11 — `ddd-inventory.md` does not acknowledge the 11 unreachable projections or explain the distinction between docs:all-reachable and CLI/MCP-reachable

**Severity:** Medium

**What's missing:** `docs/ddd-inventory.md` is an accurate fragment catalog but it does not note which projections are currently wired into `docs:all` (8 of 43), which are CLI/MCP-only (16+14), and which are unreachable from any consumer (11). The INVENTORY in `.pr-coordination/` has this data but it is outside the package. Campaign authors writing DocDefinitions need to know which projection functions are battle-tested vs. newly surfaced.

**Where it should live:** A table or footer note in `ddd-inventory.md` with a "Wiring status" column (values: `docs:all`, `CLI+MCP`, `CLI only`, `MCP only`, `none`). The data already exists in INVENTORY.md — this is a one-pass copy.

**Why it matters for the campaign:** W-DOCS-5 ports 11 reference docs. Authors will call projection functions they have never called in production. Knowing `projectRoleProfile` is `none`-wired vs. `projectPatternCatalog` is battle-hardened changes their confidence level and testing approach.

**Recommendation:** Add a "Wiring status" column to each table in `ddd-inventory.md` derived from the INVENTORY data. Mark the 11 unreachable projections so campaign authors treat them with appropriate caution.

---

### F12 — `renderers/types.ts` does not document `disclosureLevel` or `disclosureSpec` field semantics

**Severity:** Medium

**What's missing:** `RenderMarkdownOptions` at `renderers/types.ts:11` exports `disclosureLevel` and `disclosureSpec` as optional fields with no documentation. These are the OUTPUT-side disclosure axis that ContentFragments will feed into. Neither field has a JSDoc comment. `disclosureSpec` in particular is the fine-grained override — its relationship to `disclosureLevel` (they compose) is undocumented.

**Where it should live:** Inline JSDoc comments on `disclosureLevel` and `disclosureSpec` fields in `RenderMarkdownOptions`. Note the composition: `disclosureLevel` applies a policy-wide filter; `disclosureSpec` overrides per-bundle routing when set.

**Why it matters for the campaign:** W-DOCS-2d (ContentFragments + disclosure integration) needs campaign authors to correctly wire the OUTPUT-side disclosure options for `renderMarkdown`. Without field documentation, authors must trace through the renderer logic (2152 LOC) to understand how the two fields interact.

**Recommendation:** 2–3 line JSDoc on each field. Can be added to `renderers/types.ts` in under 10 minutes.

---

### F13 — ADR-005, ADR-006, ADR-009 are referenced only in README and MIGRATION.md, not in the source files where violations occur

**Severity:** Low

**What's missing:** The three load-bearing ADRs governing this package are mentioned in README.md (ADR-006 at line 70) and MIGRATION.md ("Residual ADR-006 leaks" section), but nowhere in the source files where their rules are implemented or where Phase 1 found drift. `render-markdown.ts` (ADR-005 violator via `getDocumentationTypeMetadata` call) and `markdown-paths.ts` (ADR-009 violator via `routing.rootRouteId.split(':')[0]` parsing) have no ADR cross-references.

**Where it should live:** `@architect-decision adr-005` / `@architect-decision adr-009` JSDoc tags on the functions in `render-markdown.ts:50-52` and `markdown-paths.ts:26-49` that Phase 1 flagged as drift points. This is additive enrichment per annotation-ownership doctrine.

**Why it matters for the campaign:** Campaign authors fixing H3 (renderer doc-type awareness) need to find the ADR at the violation site. Today they must cross-reference README prose → ADR file → source. A `@architect-decision` tag on the offending import makes the connection discoverable by `pnpm architect:query rules --pattern MarkdownRenderer`.

**Recommendation:** Add `@architect-decision adr-005` and `@architect-decision adr-009` annotations to the two drift sites. Low effort, high discoverability.

---

### F14 — `PERF.md` does not reflect Phase 2's H2 finding (zero `renderMarkdown` end-to-end coverage)

**Severity:** Low

**What's missing:** `docs/PERF.md` accurately documents the current perf gate metrics and budgets. It does not note that `renderMarkdown` end-to-end through the documentation bundle pipeline has zero perf gate coverage (Phase 2 H2). Campaign authors setting up W-DOCS-1 will look at PERF.md, see "Budgets" and "Refresh Protocol", and not know they need to add a `renderMarkdown` gate before the campaign multiplies doc count.

**Where it should live:** A "Known gaps" section in `PERF.md`:

```
## Known gaps (pre-campaign)
- `renderMarkdown` end-to-end through `parseAndProjectDocumentationBundle` has no perf gate.
  Add before W-DOCS-1 lands — the campaign fans out from 8 to 40+ docs through this path.
  See Phase 2 finding H2.
```

**Why it matters for the campaign:** Without this note, the gap described in Phase 2 H2 stays invisible to the campaign implementer and will not be closed before W-DOCS-1 ships.

**Recommendation:** Add a 5-line "Known gaps" section to `PERF.md`. References Phase 2 H2. Low effort.

---

### F15 — `RenderMarkdownOptions.disclosureSpec` imports `DisclosureSpec` from deep path inside `documentation-composition/`

**Severity:** Low

**What's missing:** `renderers/types.ts:2` imports `DisclosureSpec` via `'../projections/documentation-composition/disclosure-spec.js'`. This is the "layering inversion" Phase 1 H7 identified: a package-level primitive lives inside one projection subdomain. The import itself works, but when campaign code in `src/doc-definition/` imports `DisclosureSpec`, it will also reach into `documentation-composition/` — across the future subdomain boundary.

**Where it should live:** This is a code issue, not a documentation issue, but it is observable through documentation: no doc, comment, or ADR cross-reference on this import explains why it crosses the subdomain boundary. Noting `// H7: DisclosureSpec belongs at package-level primitives — tracked for promotion` on the import line would make the temporary nature visible.

**Why it matters for the campaign:** W-DOCS-2d (ContentFragments) will create `src/doc-definition/types.ts` which will need `DisclosureSpec`. At that point the cross-domain import either consolidates or proliferates. A comment on the existing import signals intent.

**Recommendation:** Add a one-line `// TODO(H7): promote DisclosureSpec to src/disclosure/ when documentation-composition/ is decomposed` comment on the import in `renderers/types.ts`. Low effort; prevents the subdomain boundary from silently accumulating more cross-domain imports.

---

## JSDoc coverage matrix

| Symbol                               | `@architect-pattern` tag | `@architect-role` tag | Prose JSDoc       | I1–I5 invariant doc    |
| ------------------------------------ | ------------------------ | --------------------- | ----------------- | ---------------------- |
| `renderMarkdown` (entry point)       | Yes (MarkdownRenderer)   | Yes (codec)           | Present (general) | **Missing** (I1, I3)   |
| `renderCompactText` (entry point)    | Yes                      | Yes (codec)           | Present (general) | None (no applicable I) |
| `renderJson` (entry point)           | Yes                      | Yes (codec)           | Present (general) | **Missing** (I4)       |
| `renderUi` (entry point)             | Yes                      | Yes (codec)           | Present (general) | **Missing** (I2 note)  |
| `sanitizeMarkdownLinkTarget`         | No                       | No                    | **None**          | **Missing** (I1)       |
| `isPlainObject` (`render-json.ts`)   | No                       | No                    | **None**          | **Missing** (I4)       |
| `TRUSTED_MARKDOWN` symbol            | No                       | No                    | **None**          | **Missing** (I3)       |
| `parseAndProject` wrapper            | No                       | No                    | Present (partial) | Present (partial, I5)  |
| `ProjectionBundle` interface         | No                       | No                    | **None**          | None                   |
| `DisclosureSpec` type                | No                       | No                    | **None**          | None                   |
| `ProgressiveDisclosurePolicySchema`  | No                       | No                    | **None**          | None                   |
| `DOCUMENTATION_PROJECTION_FACTORIES` | No                       | No                    | **None**          | None                   |

---

## Dogfooding readiness table

| README section                                | Regeneratable today?                           | Regeneratable post-campaign?     | Stays manual?                     |
| --------------------------------------------- | ---------------------------------------------- | -------------------------------- | --------------------------------- |
| Package title + one-paragraph description     | No (no `@architect-package-summary` JSDoc)     | Yes (after annotation)           | No                                |
| Pipeline ASCII diagram                        | No (no `sequenceDiagram` extractor yet)        | Yes (W-DOCS-2c)                  | No                                |
| Usage example (parseAndProjectSessionContext) | No (no `extractFunctionSignature`)             | Yes (W-DOCS-2a)                  | No                                |
| Architecture invariants bullets               | No (no `adr-006` tag on `render-markdown.ts`)  | Yes (after F13 + W-DOCS-2b)      | No                                |
| Markdown/content trust boundary section       | No (no `@architect-trust-boundary` tag)        | Yes (after F1 + W-DOCS-2b)       | No                                |
| "Documentation Composition Contract" table    | No (F2: no `.describe()` calls)                | Yes (after F2 + W-DOCS-2a)       | No                                |
| Testing section                               | Mostly no (no `@architect-test-strategy` tag)  | Partial                          | Yes (preamble prose)              |
| Entry points list (sub-exports)               | No                                             | Yes (W-DOCS-2a extractImportMap) | No                                |
| "Renderer Overview" (MIGRATION.md)            | No (F3: placeholder When to Use)               | Yes (after F3)                   | No                                |
| "Residual ADR-006 leaks" (MIGRATION.md)       | No — chronological narrative                   | No                               | Yes (frozen)                      |
| "Performance gate" (PERF.md)                  | Partial (budgets table from code, prose stays) | Yes for budgets table            | Yes for prose + Known gaps        |
| Tables A/B/C codec mapping (MIGRATION.md)     | No — source side deleted                       | No                               | Yes (frozen historical reference) |
