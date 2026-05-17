# Phase 2a — Security Audit: `packages/architect-projection/`

## Summary verdict

**No exploitable bugs in the current threat model. The markdown trust boundary is unusually well-implemented for a 2152-LOC renderer.** The package is a library that consumes already-validated PatternGraph data (architect-core trust boundary) and emits formatted output; it has no network surface, no auth, no I/O. Generic OWASP checks do not apply.

The audit identified **2 low-severity defense-in-depth gaps** and **5 trust-boundary invariants** the doc-gen campaign must preserve as ContentFragment and DocDefinition route more content through these paths. Of those 5 invariants, **3 are load-bearing** — if the campaign relaxes them, dormant injection paths activate.

## Findings

### L1 — Code-block fence escalation is bounded at 4 backticks (CWE-1287, CWE-79-adjacent)

**Severity:** Low (defense-in-depth)
**File:** `src/renderers/render-markdown.ts:1700-1702`

```ts
case 'code': {
  const fence = block.content.includes('```') ? '````' : '```';
  return [`${fence}${block.language ?? ''}`, block.content, fence, ''];
}
```

The renderer escalates to a 4-backtick fence only when content contains ` ``` ` (3 backticks). If `content` contains ` ```` ` (4 backticks), the closing fence matches the embedded sequence and downstream text is parsed as markdown.

**Reproduction:**
```ts
code('````\nMALICIOUS <script>alert(1)</script>\n````', 'js')
```
emits:
````
````js
````
MALICIOUS <script>alert(1)</script>
````
````

Renderers interpreting this with a permissive markdown parser may treat `MALICIOUS …` as raw markdown / inline HTML.

**Current threat model:** the only producer of code blocks from external text is `decision-records.internal.ts:296-313`, which extracts code spans from ADR markdown using regex `/```(\w*)\n([\s\S]*?)```/g`. The regex is non-greedy on the literal triple-backtick boundary, so it cannot itself capture a 4-backtick fence. Other call sites pass `stableStringify(value, 2)` or `buildFsmStateDiagram(fragment)` — internal, non-attacker-controlled.

**Why it matters for the doc-gen campaign:** ContentFragment proposal routes hand-authored markdown (preambles) through the projection layer. If preamble parsing emits `code` blocks whose content originated from less-trusted sources (e.g., `_claude-md/` includes), the dormant path activates. The fix is to compute the required fence length dynamically.

**Fix:**
```ts
function pickFence(content: string): string {
  const longestRun = (content.match(/`{3,}/g) ?? [])
    .reduce((max, run) => Math.max(max, run.length), 0);
  return '`'.repeat(Math.max(3, longestRun + 1));
}

case 'code': {
  const fence = pickFence(block.content);
  return [`${fence}${block.language ?? ''}`, block.content, fence, ''];
}
case 'mermaid': {
  const fence = pickFence(block.content);
  return [`${fence}mermaid`, block.content, fence, ''];
}
```

The mermaid branch at line 1704 has the same bug at `\`\`\`` (3 backticks) without any escalation. Apply the same fix.

---

### L2 — `CodeBlock.language` is unconstrained and is interpolated directly into the fence line

**Severity:** Low (defense-in-depth)
**File:** `src/blocks/schema.ts:121` and `src/renderers/render-markdown.ts:1701`

`language: z.string().optional()` accepts any string including newlines. The renderer interpolates it as `${fence}${block.language ?? ''}`. A `language` containing `\n` produces a fence line that ends prematurely; the next line of "language" becomes content from the renderer's perspective but the markdown reader sees it as the first content line.

**Current threat model:** the only caller that supplies a non-static language is `decision-records.internal.ts:312`, where `language` is captured by `/(\w*)/` (alphanumeric + underscore only). Not exploitable today.

**Why it matters for the doc-gen campaign:** any new caller that lets external text reach `code(content, language)` reopens this. The shape constraint belongs in the schema, not in caller discipline.

**Fix:**
```ts
language: z
  .string()
  .regex(/^[A-Za-z0-9_+\-.]*$/u, 'language must be identifier-shaped')
  .max(64)
  .optional(),
```

---

## Invariants the campaign MUST preserve

The following are not bugs — they are load-bearing properties of the current design. The doc-gen campaign cannot relax any of them without re-opening one of the holes audited above.

### I1 — `sanitizeMarkdownLinkTarget` is the single chokepoint for all markdown link `href` values

**File:** `src/renderers/render-markdown.ts:1893-1965`

Every `link-out` → markdown link path is funneled through `toMarkdownLink` → `sanitizeMarkdownLinkTarget`. The sanitizer:

- Trims and rejects empty / `//`-prefixed targets
- Decodes HTML entities (`&#x3a;`, `&colon;`, `&NewLine;`, etc.) *before* scheme classification — defeats entity-encoded `javascript:` payloads
- Rejects control characters (U+0000–U+001F, U+007F) including tab, LF, CR after decoding
- Scheme allowlist: `http`, `https`, `mailto` only — everything else (`javascript:`, `data:`, `vbscript:`, `file:`) is rejected
- `encodeURI` + paren-escaping the accepted target

`renderLinkOut` falls back to rendering plain text when the path is rejected — no dangling `[text]()` artifact.

**Campaign action:** every new path that emits a clickable link must route through `toMarkdownLink` (or equivalent) and not template `[text](path)` directly. `ContentFragment` parsers in particular must not bypass this for parsed `[](…)` syntax in preambles — they should re-emit as `linkOut` blocks so the chokepoint applies.

---

### I2 — `LinkOutBlockSchema.path` is `z.string()`; the URL discipline lives in the renderer, not the schema

**File:** `src/blocks/schema.ts:136-140`

The Zod schema accepts any string. Producers of link-out blocks rely on the renderer to sanitize. This is consistent with the rest of the pipeline — schemas validate shape, renderers validate format-specific safety.

**Campaign action:** the `render-ui.ts` consumer in Studio does **not** apply scheme allowlisting (only `isExternalPath` heuristics for path rewriting at line 671). When `RenderableDocument` lands as a new top-level input alongside `Fragment`, ensure the UI renderer either runs the same sanitizer or that Studio's React layer applies its own `href` allowlist. This is the highest-priority campaign hardening — Studio is the only renderer where unsanitized `href` becomes a live DOM attribute.

---

### I3 — Trusted-markdown construction is scoped to four call sites, all of which feed escaped substrate

**File:** `src/renderers/render-markdown.ts:784, 799, 812, 844, 896, 1398, 1855-1873`

The `TRUSTED_MARKDOWN` symbol bypasses `escapePlainMarkdownText`. Today every caller wraps content that was itself escaped (`escapePlainMarkdownText(x)` plus static template literals like `**Status:** ${...}`), so the bypass is sound. The symbol is module-private and not exported.

**Campaign action:** do **not** export `trustedMarkdown` or any wrapper. ContentFragment normalizers must compose with `escapePlainMarkdownText` like the existing fragment-specific normalizers do. If a new normalizer needs the trusted path, it must keep the wrap site adjacent to the escape site in the same function.

---

### I4 — JSON renderer rejects non-plain objects (CWE-1321 mitigation)

**File:** `src/renderers/render-json.ts:163-166, 203-210`

`isPlainObject` checks `Object.getPrototypeOf(value) === Object.prototype || null`. Class instances, `Map`/`Set`/`Date`, and prototype-polluted objects throw. Non-finite numbers, `bigint`, `function`, and `symbol` values throw with a JSON path for error attribution.

**Campaign action:** when JSON becomes a campaign target output (`docs-live/` + `_claude-md/` + JSON multi-target), do not bypass these guards. Pre-stringified payloads — if the campaign adds them — should go through `transformValue` not direct `JSON.stringify`.

---

### I5 — `parseAndProject` is the single Zod entry point for projection options

**File:** `src/projections/_shared/parse-and-project.internal.ts`

Every `parseAndProject*` wrapper threads raw caller options through one `parseAtBoundary(schema, …)` call. Inner projection code receives typed options and does no re-parsing. Zero `z.object()` usage in the package (113 `z.strictObject` uses) means cross-package contracts reject unknown fields.

**Campaign action:** the proposed `DocDefinition.build(graph)` API must define its options/inputs as `z.strictObject` schemas and route through `parseAndProject` rather than introducing a parallel "raw config" path. Phase 1 H1 already flags that `documentation-types.ts` derives types from a literal rather than from the schema; if the campaign perpetuates this for `DocDefinition`, schema-drift is guaranteed and an extra-field smuggling path opens at the new boundary.

---

## Other observations (informational)

- **Dependency hygiene:** runtime deps are exactly `@libar-dev/architect-core` (workspace) and `zod ^4.1.11`. No drift, no bloat.
- **No `eslint-disable*`, no `@ts-ignore`, no `@ts-expect-error`** in `src/`. The no-BC doctrine is upheld at the lint/type layer.
- **Three `as` casts in source** (`schema.ts:172`, `render-markdown.ts:1716-1717`). All three are interior shape-narrowing that does not cross a trust boundary — the table-cell casts widen `string[][]` to `MarkdownText[][]` (a superset, since `MarkdownText` includes plain `string`), and trusted-vs-plain dispatch happens downstream in `renderMarkdownText`.
- **`markdown-paths.ts` path construction** is fed by `LogicalRouteId` strings that match a regex (`[A-Za-z0-9][A-Za-z0-9_-]*` segments, see `fragments/base.ts:74`). `slugForFilename` collapses anything else to `[a-z0-9-]`. No traversal risk in produced filenames. Phase 1 H4's complaint about hardcoded doc-type strings is an architecture concern, not a security one — the route IDs are still bounded.
- **`<details>`/`<summary>` HTML emission** is the only raw HTML in the markdown pipeline (plus `<br>` inside table cells). `<summary>` content goes through `renderMarkdownText` → `escapeHtml`, so `</summary>` injection is blocked. `escapeTable​Cell` replaces `\n` with literal `<br>` after `escapeHtml` has already neutralized `<`, so attacker-supplied `<br onerror=…>` cannot reach the output.

## Top recommendation

Apply the two-line fix at L1 (dynamic fence length for code and mermaid blocks) and the regex constraint at L2 (`CodeBlock.language`) before the doc-gen campaign opens the code-block path to less-trusted content. Everything else in this package is already at the right altitude for a renderer of this size — the audit's load-bearing output is the **5 invariants the campaign must preserve**, not new findings.
