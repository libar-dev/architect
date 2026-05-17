# Phase 2: Security & Performance Review

Raw reports: `02a-security-raw.md`, `02b-performance-raw.md`.

## Headline

**Security: clean. Performance: structurally healthy, but the gate doesn't measure where the campaign lands.**

- **Security audit** found no exploitable bugs and documented 5 load-bearing invariants the campaign must preserve. The narrow attack surface (markdown trust boundary) is unusually well-defended for 2152 LOC of renderer.
- **Performance audit** confirmed projection costs are graph-size-bounded, not doc-count-bounded, so 5× doc fan-out doesn't bust the budget by itself. But the perf gate has **zero end-to-end coverage of `renderMarkdown`** and only exercises `documentType: 'patterns'` — exactly the gap the campaign will widen.

## Security findings

### Verdict

No Critical or High findings. Two Low defense-in-depth items + 5 invariants.

### Low-severity defense-in-depth items

**L1 — Code-block fence escalation bounded at 4 backticks**
- **File:** `src/renderers/render-markdown.ts:1700-1702` (escalation logic), `:1704` (Mermaid block has no escalation)
- **Why it matters:** ContentFragment will route preamble markdown through this path; user-authored preamble could contain 4+ backtick sequences. Today only `decision-records.internal.ts` feeds external text via a regex that captures triple-backtick boundaries only, so it's not exploitable. Activates if the campaign adds new sources of unconstrained text.
- **Fix:** generalize fence escalation to `max(content_max_run + 1, 3)` and apply uniformly to code + Mermaid blocks.

**L2 — `CodeBlock.language` is unconstrained `z.string().optional()`**
- **File:** `src/fragments/base.ts` (schema), `render-markdown.ts` (interpolation into fence line)
- **Why it matters:** newline in `language` breaks the fence. Same activation profile as L1.
- **Fix:** `z.string().regex(/^[A-Za-z0-9_+-]*$/).optional()` at the schema layer.

### Invariants the campaign MUST preserve (highest-value output of the audit)

| ID | Invariant | Why it's load-bearing |
|---|---|---|
| **I1** | `sanitizeMarkdownLinkTarget` is the single chokepoint for link-href validation (decodes HTML entities before scheme classification, enforces `http`/`https`/`mailto` allowlist, rejects control chars). | Any new link-emitting normalizer that bypasses this opens injection routes. |
| **I2** | URL discipline is split: schema rejects malformed shape; renderer rejects unsafe targets. **The UI renderer does NOT sanitize URLs.** | Campaign-relevant: when multi-target output adds new consumers of `RenderableDocument` (e.g., Studio surfacing UI fragments), the missing UI-side sanitizer becomes exploitable. **Hardening priority when Studio comes online.** |
| **I3** | `TRUSTED_MARKDOWN` symbol is module-private (unexported). All 4 call sites feed pre-escaped substrate. | The campaign's `composeDoc(title, sections)` MUST NOT export or accept `TRUSTED_MARKDOWN`-tagged content from outside the renderer module. |
| **I4** | JSON renderer uses `isPlainObject` prototype check before stringify (anti-prototype-pollution). | If `DocDefinition.build()` returns objects with non-default prototypes, JSON output silently changes shape. Preserve the check. |
| **I5** | `parseAndProject` is the single options-parsing entry point. 113 `z.strictObject` uses, zero `z.object`. | The campaign's `DocDefinition` MUST inherit this discipline — open-shape Zod at the new trust boundary is a regression. |

## Performance findings

### Verdict

**The campaign will NOT bust the current perf gate**, but the gate doesn't measure the path the campaign multiplies. Fix H1 + H2 before W-DOCS-1 and post-campaign regressions become observable; skip them and renderer drift slips through silently.

### High-priority items

**H1 — `addRoutedDocument` re-renders each split document 2N+2 times**
- **File:** `src/renderers/render-markdown.ts:308-325, 447-466, 2054`
- **Mechanism:** `shouldSplit` pre-render + per-subdoc line-count render in `splitOversizedDocument` + final parent render + sub-file renders. For a doc that splits into N children, the renderer runs N+2 full passes when 1 would suffice.
- **Campaign impact:** the campaign fans out from ~8 docs to ~40, many of which will exercise the disclosure-split path. Today's wasted rendering becomes a noticeable hot spot.
- **Fix:** render once, cache the block stream, take size/split decisions on the cached output. Memoization keyed on `(fragment, options)`.

**H2 — Perf gate has zero end-to-end coverage of `renderMarkdown`**
- **Files:** `tests/features/perf/business-rule-set-report.steps.ts`, `tests/perf/compare-baseline.mjs`
- **What's measured today:** `parseAndProjectDocumentationBundle` (projection) and `renderJson` (JSON renderer).
- **What's NOT measured:** `renderMarkdown` end-to-end through the bundle pipeline. The 2152-LOC renderer where the campaign's 5× fan-out lands has no perf gate.
- **Campaign impact:** regressions land silently.
- **Fix:** add a perf test that exercises `parseAndProjectDocumentationBundle → renderMarkdown` for at least 3 representative `documentType` values. Establish baseline before W-DOCS-1 lands.

### Medium-priority items

**M1 — `documentationView` perf metric only exercises `documentType: 'patterns'`**
- The other 11 (soon 18+) types have no gate. Campaign adds 25+ docs through new `DocDefinition`s. None will be measured.
- **Fix:** parameterize the perf test over `documentType`; one baseline per type.

**M2 — Repeated filter passes in `src/projections/_shared/filter.ts`**
- Many projections call into shared filters that walk the graph each invocation. No memoization on filter result by `(graph_version, predicate_signature)`.
- **Campaign impact:** compounds linearly with `DocDefinition` count.
- **Fix:** add `WeakMap<Graph, Map<predicateKey, filtered[]>>` cache; invalidate on graph rebuild.

**M3 — Perf baseline is anchored to commit `ee58aac` (initial multi-package split, ~year old)**
- The `× 1.5` ceiling is anchored to year-old numbers. ~50% slack against post-W1.5 reality.
- **Fix:** regenerate baselines on a clean post-W1.5 build before the campaign starts. Don't let the campaign inherit invisible headroom.

**M4 — `documentation-types.ts:140-340` registry literal is re-evaluated on every module import**
- 200 LOC of object literals; `as const` keeps shape but each registry consumer pays the cost. Negligible alone, but the campaign adds many more consumers.
- **Fix:** part of the C1/C2 decomposition from Phase 1 — registry as data + small accessor functions.

**M5 — `renderBlock` `default` arm has a silent megabyte-comment trap**
- See raw report. Not a production hazard; flagged for awareness.

### Low-priority items

L1–L5 — minor compounding allocations in `format-utils.ts`, `base.ts`, `render-json.ts`. See raw report.

## Critical issues for Phase 3 context

Phase 3 reviewers (testing + documentation) should give weight to:

- **Perf gate coverage is the #1 testing gap** (H2 + M1). Phase 3 testing review must address: should the campaign land with parameterized `documentType` perf tests, and how should new `DocDefinition`s opt into the gate?
- **The 5 security invariants (I1–I5) need test-level enforcement.** Today they're documented-only. A regression test that calls each `parseAndProject*` with an open-shape payload and asserts rejection would lock I5. Test for `TRUSTED_MARKDOWN` import outside the renderer module would lock I3.
- **`render-markdown.ts` (2152 LOC) is under-tested for fragment-specific normalizers.** Phase 3 should map test coverage per normalizer; ContentFragment will add 6–10 more.
- **The 11 unreachable projections from INVENTORY** — Phase 3 doc review should determine whether they have feature-spec coverage (which would prove they're maintained) or are dead code (which the campaign should not preserve).
- **Documentation gap for invariants** — none of the 5 security invariants is captured in ADRs or per-module JSDoc. Phase 3 doc review should propose where to capture them so the campaign cannot accidentally violate them.
