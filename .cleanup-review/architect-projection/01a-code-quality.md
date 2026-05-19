# Code Quality Review — `@libar-dev/architect-projection`

Scope: `packages/architect-projection/src/**` (146 TS files, ~15.3k LOC).
Lens: ADR-009 content-safety boundary, no-BC + Zod-first discipline, perf gate
discipline, silent-failure / re-parse / allocation hot-spot detection.

Findings are file-anchored to `packages/architect-projection/src/...`; all paths
in this report are workspace-relative for brevity (resolve against
`/Users/darkomijic/dev-projects/architect/`).

---

## Critical

### C1. Markdown link sanitiser preserves HTML-entity-encoded payload — XSS via decoded href

- **Evidence**: `src/renderers/render-markdown.ts:1996-2023` — `sanitizeMarkdownLinkTarget`
  decodes HTML entities into `classified`, runs the scheme allow-list and `//` check
  against `classified`, then returns `encodeURI(trimmed)` — i.e. the **original** input
  with HTML entities **still encoded**.
- **Impact**: An attacker-controlled path like
  `&#x6a;&#x61;vascript:alert(1)` decodes to `javascript:` for classification (so the
  scheme test correctly rejects… wait — the regex `/^([a-z][a-z0-9+.-]*):/i` runs on
  the decoded `classified`, so the dangerous scheme is detected). BUT — only when the
  payload begins with the entity. Inputs that resolve to `https://...` on classify but
  whose surviving `trimmed` form contains entity-encoded fragments that downstream
  Markdown→HTML parsers will decode in the `href` slot (e.g. CommonMark/GFM treat entity
  refs in URL contexts as literal characters during AST construction) still slip through:
  `https://attacker.example.com/&#x22;&#x20;onmouseover=&#x22;alert(1)` will survive
  `encodeURI` (which does not encode `&` or `;`) and emerge as an HTML attribute
  injection in the final href. Even worse — `encodeURI` preserves `#`, so
  `https://x/#&#x22;` round-trips unchanged.
- **Remediation**: Encode the **decoded** form (after entity resolution + control-char
  filter) rather than the original `trimmed`. Concretely:
  ```ts
  return encodeURI(classified).replace(/[()]/g, encodeURIComponent);
  ```
  Add a fixture-test for `&#x22;` and `&amp;` survival inside an otherwise valid
  https:// target.
- **Verification**: `pnpm test --filter @libar-dev/architect-projection` with a new
  case asserting the output href contains **no** unencoded `&` or `;` characters.

### C2. Markdown link sanitiser uses ASCII-only control-character check on Unicode string

- **Evidence**: `src/renderers/render-markdown.ts:2097-2110` — `isControlCharacter`
  tests `codePoint <= 0x1f || codePoint === 0x7f`. The U+2028 / U+2029 line/paragraph
  separators, U+0085 NEL, and the U+202E right-to-left override (RLO) — all
  classically used to confuse URL classification — pass through.
- **Impact**: An attacker-supplied link target containing U+2028 (LINE SEPARATOR)
  produces a JS-string newline inside the rendered href when the host page contains a
  `<script>` tag that templates the URL; some HTML sanitisers also tokenise on Unicode
  whitespace differently from `encodeURI`. RLO can flip the visible scheme of a
  link, so a URL displayed as `https://safe.example.com` may resolve to a different
  target after RTL reordering in the browser address bar / status preview.
- **Remediation**: Extend control-char check to include U+0085, U+2028, U+2029, and
  the bidi-control set (U+202A–U+202E, U+2066–U+2069). Also reject U+FEFF (BOM)
  inside link targets.
- **Verification**: Targeted unit test feeding `https://example.com @evil` and
  asserting `null`.

### C3. `escapePlainMarkdownLine` does not escape `=` runs → setext-heading injection

- **Evidence**: `src/renderers/render-markdown.ts:1967-1980`. The regex
  `/^(\s*)(-{3,}|_{3,}|\*{3,})(\s*)$/` escapes horizontal-rule rows for `-`, `_`, `*`
  but **not** for `=`. A user-controlled paragraph value containing the line
  `=========` immediately under non-empty text gets promoted into a setext H1.
- **Impact**: Lower-severity than C1/C2 — no XSS — but it lets attacker content
  inject document structure (headings) into trusted docs (e.g. release notes,
  business rules, traceability tables). Headings drive ToC generation, split routing,
  and bundle backlinks, so the consequences cascade.
- **Remediation**: Extend the horizontal-rule branch to cover `=`:
  ```ts
  .replace(/^(\s*)(-{3,}|=+|_{3,}|\*{3,})(\s*)$/, '$1\\$2$3');
  ```
  And in the multi-line path, also escape lines composed entirely of `=` to prevent
  a value-supplied `=` line from underlining the preceding line.
- **Verification**: Snapshot test asserting `paragraph('foo\n========')` does not
  produce an `# foo` H1 in the rendered Markdown.

---

## High

### H1. Routed child paths silently dropped when non-canonical — no diagnostic, hard to debug

- **Evidence**: `src/renderers/render-markdown.ts:407-414`. If a configured
  `markdownChildDirectory` produces a path that survives
  `normalizeRoutedOutputPath` but differs from the raw input (e.g. trims trailing
  slashes), or returns `null`, the child is silently dropped from output. The root
  path goes through `normalizeRequiredRoutedOutputPath` and **throws**, but children
  follow the silent path.
- **Impact**: A misconfigured `documentation-type-registry` entry produces incomplete
  output (no children) with no error surfaced to the caller. The CLI/MCP consumers
  see "successful" generation while documents are missing.
- **Remediation**: Either throw (matching root behaviour) or surface via the
  `onRenderDocument` hook with a `phase: 'rejected'` event. Throwing is simpler and
  consistent.
- **Verification**: Add a fixture with `markdownChildDirectory: '../escape'` and
  assert the renderer throws rather than returning `{}`.

### H2. JSON renderer drops bundle routing fields → projection-trust-boundary surface loss

- **Evidence**: `src/renderers/render-json.ts:85-104`. `serializeBundle` only emits
  `{anchorStrategy, childRouteIds, childPathStrategy, rootRouteId}` from
  `BundleRouting`. The other authored fields — `disclosureSpec`,
  `markdownRootTarget`, `markdownChildDirectory`, `entityPathLayout` — are dropped.
- **Impact**: Studio / MCP clients receiving JSON cannot reconstruct the same
  documents the markdown renderer produces. The "Codec / Renderer Separation"
  contract (ADR-005) is broken — JSON is meant to be the structured-IR mirror of
  markdown output.
- **Remediation**: Either (a) widen `JsonRoutingMetadata` to a full mirror of
  `BundleRouting` with a `transformObject`-style passthrough, or (b) document that
  JSON output is deliberately a narrower projection and require markdown-bound
  fields move to a sibling envelope. Choose (a) — the asymmetry is a footgun.
- **Verification**: Round-trip test: parse `renderJson(...)` output, hand
  `{root, children, routing}` back to a synthesised input, expect lossless
  reconstruction.

### H3. `sanitizeMarkdownLinkTarget` accepts `mailto:` without RFC-5322 mail-target validation

- **Evidence**: `src/renderers/render-markdown.ts:2014-2019` allows `mailto:` and then
  returns `encodeURI(trimmed)`. Mailto targets aren't validated — anything from
  `mailto:javascript:alert(1)` (rejected by encodeURI but not by the scheme allow-list)
  through `mailto:?subject=...&body=...` with smuggled control chars passes.
- **Impact**: Mailto links are a known phishing vector. Attacker-controlled
  `mailto:?body=<smuggled phishing>` lets a user-controlled fragment template a
  pre-filled email in the user's mail client.
- **Remediation**: For `mailto:`, additionally require the path component to match a
  conservative `/^mailto:[^?#]+(@[^?#]+)?(\?.+)?$/` and reject query strings entirely
  (or pass them through `encodeURIComponent`).
- **Verification**: Test that `mailto:?body=<smuggle>` fails sanitisation.

### H4. `decodeLinkTargetForClassification` is incomplete — `&apos;`, `&quot;`, and decimal entities for `\r` survive

- **Evidence**: `src/renderers/render-markdown.ts:2074-2095` decodes `&colon;`,
  `&sol;`, `&Tab;`, `&NewLine;` named entities plus `&#NN;` / `&#xHH;` numerics.
  But the input `&#x0D;` (carriage return) decodes via numeric → `\r` which IS
  a control char → rejected. However `&#x09;` decodes to `\t` → also rejected.
  **But** the named-entity table is incomplete: `&Tab;` covers tab but not `&tab;`
  (HTML named entities are case-sensitive in MathML; the regex is case-insensitive
  but the named entities tested are explicit and a real HTML parser would also
  accept `&apos;`, `&quot;` which are not handled here). A target containing
  `https://example.com&quot;` survives because `&quot;` is not decoded, then
  `encodeURI` preserves `&;`, then the markdown→HTML processor decodes it to `"`
  inside the href.
- **Impact**: HTML-attribute breakout from inside a `href="…"` context once the
  Markdown is converted to HTML.
- **Remediation**: Drop the named-entity allow-list and use a complete HTML5 entity
  decoder (e.g. `entities` package), OR run a final `encodeURIComponent`-style pass
  on the decoded form so `"`, `'`, `<`, `>` cannot appear in the emitted href.
- **Verification**: Fixture `https://x/?q=&quot;` → assert emitted href has no
  literal `&quot;`.

### H5. `dependency-tree.internal.ts:113` clones the entire visited Set per recursion → O(N²) allocations

- **Evidence**: `buildTreeNode` calls `const nextVisited = new Set(visited);` before
  each recursive descent. For a graph of N reachable nodes the total work is
  O(N²) Set allocations + copies just to preserve sibling-branch isolation.
- **Impact**: The perf gate fires when fixture-fixture growth changes; this is the
  kind of cliff that won't show up at 36 patterns but bites at 200+. The package
  ships an explicit perf budget (`baseline × 1.5`) — this code is the obvious place
  to regress it.
- **Remediation**: Mutate-and-rollback the single shared `visited` Set:
  ```ts
  visited.add(name);
  const children = ...recurse...
  visited.delete(name);
  ```
  Allocation count drops from O(N) to 0.
- **Verification**: Bench `pnpm --filter @libar-dev/architect-projection test:perf`
  before/after with a deepened fixture.

### H6. `pr-change-review.internal.ts` re-normalises `changedFiles` per pattern → O(p × m) allocations

- **Evidence**: `src/projections/documentation-composition/pr-change-review.internal.ts:85-95`.
  Inside `patternMatchesChangedFiles`, `changedFiles.map(normalizePath)` is called
  on **every pattern**.
- **Impact**: For a PR touching 50 files in a 260-pattern graph that's 13k
  redundant string allocations per projection call. Also the inner
  `references.some` over the per-pattern reference list is unbatched.
- **Remediation**: Pre-normalise once in `buildPrChangeReview` and pass a
  `ReadonlySet<string>` for O(1) membership; structure the `endsWith` checks as
  a separate suffix-trie pass if needed.
- **Verification**: Add a benchmark variant in the perf suite parameterised on
  PR size; verify the baseline holds at 50-file PRs.

### H7. `session-context.internal.ts` uses `Array.prototype.some` for consumer/neighbour de-dup → O(n²)

- **Evidence**: `src/projections/execution-context/session-context.internal.ts:107-123`.
  `consumers.some((entry) => entry.name === consumerName)` (and the equivalent for
  `architectureNeighbors`) inside an outer `for` loop. For a pattern with k
  consumers and j neighbours, this is O(k² + j²) per focal pattern.
- **Impact**: Session-context projections are on every `architect context` /
  `architect bundle` call — both CLI and MCP hot paths.
- **Remediation**: Use a `Set<string>` seen-by-name and push into the array only on
  first sight, mirroring `flattenDependencies` two functions below.
- **Verification**: Existing tests cover ordering — a `Set`-backed implementation
  must preserve insertion order to stay equivalent.

### H8. `requirePattern` fuzzy-suggestion path scans entire graph on every "not found" → DoS surface

- **Evidence**: `src/projections/_shared/pattern-helpers.internal.ts:85-93` calls
  `context.graph.patterns.map(getPatternName)` then `findBestMatch` (Levenshtein
  over every name). On a 260-pattern graph this is acceptable for one error; under
  bulk projection that fails mid-flight (e.g. `bundle` for a misspelled pattern,
  `dep-tree` for a missing parent) it can compound.
- **Impact**: Not a runtime hot path in the success case, but a slow error path
  invites partial-failure scenarios where a batch processor amplifies latency on
  invalid input.
- **Remediation**: Cache the lowercased name list on the `ProjectionContext` (it's
  immutable per call). Cap Levenshtein scans by length difference (`abs(len(q) -
  len(name)) > MAX` short-circuits).
- **Verification**: Microbenchmark the failure path; assert sub-ms even with a 1k
  pattern graph.

### H9. `architecture-diagram.internal.ts` does not sanitise pattern names embedded in Mermaid labels

- **Evidence**: `src/projections/documentation-composition/architecture-diagram.internal.ts:117-132`.
  `label` is built as `` `${name}${roleSuffix}` `` where `roleSuffix` is
  `<br/>(${pattern.role.trim()})`. The label is then dropped into the Mermaid
  source as `["${label}"]`. A pattern name or role containing `"]` (or quote-like
  characters) breaks out of the label.
- **Impact**: Mermaid `click NodeId href "…"` directives can be injected. Pattern
  names come from `@architect-pattern:` annotations, which are repo-trusted but
  this surface is also fed by user-supplied feature files in downstream consumers
  of the package. Mermaid renderers (GitHub, mermaid.live) execute click handlers.
- **Remediation**: Escape `"` and `]` (and `\`) inside Mermaid label text; or
  switch to the safer Mermaid "fenced label" syntax. The contract should match
  Mermaid's own attribute-escape rules:
  ```ts
  const escaped = label.replace(/(["\\#])/g, '\\$1').replace(/\n/g, '<br/>');
  ```
- **Verification**: Unit test feeding `name = 'Evil"] click x "/path/to/evil`.

### H10. Path canonicaliser silently re-encodes percent sequences but allows them in segments

- **Evidence**: `src/renderers/render-markdown.ts:2058`. The check
  `/%2f|%5c|%2e|%0[0-9a-f]|%1[0-9a-f]|%7f/iu` rejects encoded `/`, `\\`, `.`,
  control chars in path segments. But the function returns `trimmed` unchanged
  if those patterns aren't matched — so a segment like `foo%20bar.md` survives
  with the literal `%20`. When the Markdown is consumed downstream, the link
  text shows one form but resolves to another (`foo bar.md`).
- **Impact**: Mostly cosmetic in trusted environments, but for federated
  consumers (Studio web) it's a subtle linkrot trap: a checked-in `.md` does not
  match the encoded route id.
- **Remediation**: Either fully reject any `%` in canonical paths or fully decode
  before validation and re-encode on output. The current "block five things,
  allow the rest" is brittle.
- **Verification**: Existing tests for the encoded-`.` and encoded-`/` paths;
  add a positive case for `foo%20bar.md` and decide policy.

---

## Medium

### M1. `parseBusinessRuleAnnotations` duplicated between `_shared/pattern-helpers` and `governance/business-rules.internal`

- **Evidence**:
  - `src/projections/_shared/pattern-helpers.internal.ts:349-400`
  - `src/projections/governance/business-rules.internal.ts:535-577`
  Identical regex, identical normalisation, two implementations that have already
  drifted slightly (the governance one uses `normalizeLineEndings`, the shared
  one does not).
- **Impact**: One bug-fix touches two files; future drift is silent. Violates DRY
  with no compensating clarity.
- **Remediation**: Consolidate in `_shared/pattern-helpers.internal.ts` (or a new
  `_shared/business-rule-annotations.internal.ts`) and have governance import.
  Apply line-ending normalisation to both call sites.
- **Verification**: After consolidation, both fragment outputs must remain
  byte-identical (snapshot tests).

### M2. `resolveIndexedEntry` falls back to O(n) lowercase scan over the entire index

- **Evidence**: `src/projections/_shared/pattern-helpers.internal.ts:288-318`. When
  the canonical-name lookup misses, the function does
  `Object.entries(index)` then a linear `toLowerCase` walk.
- **Impact**: Every `getRelationships` call that fails the first two probes pays
  O(n) — and `getRelationships` is invoked from many projections, including the
  hot `buildOverviewDigest` blocking-loop (`operational-insights/index.ts:152`).
- **Remediation**: Build a lowercased-name index once (lazily on context) and
  cache it on `ProjectionContext`. Or normalise every key in the underlying graph
  index ahead of time.
- **Verification**: Add a perf baseline case where pattern names are queried via
  off-canonical casing; budget should stay flat.

### M3. `projectPatternDetail` calls `requirePattern` then several helpers re-`requirePattern`

- **Evidence**: `src/projections/pattern-relations/pattern-detail.ts:58-78`:
  `requirePattern` once at the top, but `normalizePatternRelationships`
  (`_shared/pattern-helpers.internal.ts:121`) calls `requirePattern` again, and
  `resolveStubRefs` calls `getRelationships` which already happened above.
- **Impact**: For each `projectPatternDetail` call we do 3-4 pattern lookups when 1
  suffices. `projectPatternDetail` is invoked once per bundle entry — multiplier on
  every `bundle` call.
- **Remediation**: Have `normalizePatternRelationships` and `resolveStubRefs`
  accept an `ExtractedPattern` and a memoised `relationships`, not a name.
- **Verification**: Track count of `findPatternByName` calls in a perf trace.

### M4. `filterPatterns(patterns, undefined)` always allocates a copy

- **Evidence**: `src/projections/_shared/filter.ts:22-29`. The `undefined` branch
  returns `[...patterns]` instead of `patterns` (or a `readonly` alias).
- **Impact**: Many projections call `filterPatterns` once or twice per call. On a
  260-pattern graph that's an extra ~260-element array allocation per
  invocation — multiplied by every projection in a bundle.
- **Remediation**: Return the readonly input directly when `filter === undefined`
  and adjust the return type to `readonly ExtractedPattern[]`. Callers that
  mutate must pre-copy locally.
- **Verification**: TS error surface guides remediation; perf baseline remains
  or improves.

### M5. `buildPatternBundle` token-estimation does `JSON.stringify({pattern, blocks})` per entry

- **Evidence**: `src/projections/pattern-relations/bundle.internal.ts:188-191` and
  `:143`. When `estimateTokens === true`, every bundle entry serialises the full
  payload to compute character length.
- **Impact**: For a 30-member bundle with `estimateTokens: true` we re-stringify
  the full pattern × blocks tree N times. The render layer already serialises;
  this is duplicative.
- **Remediation**: Pass the rendered length back from the codec, or estimate from
  block sizes alone (sum of `docstring.length`, `JSON.stringify(rules).length`,
  …) without round-tripping the entire entry.
- **Verification**: Bench `architect bundle ... --estimate-tokens` against the
  same call without the flag; gap should be small.

### M6. `appendBundleBackLink` and `linkOut('← Back to …', …)` emit a left-arrow character — not escaped

- **Evidence**: `src/renderers/render-markdown.ts:1690-1704` and `:2151`. The text
  arg `'← Back to …'` carries Unicode arrow + path text; passed to `linkOut`
  whose label is then rendered via `renderMarkdownLinkText` → `escapePlainMarkdownText`
  which HTML-escapes. So the literal `←` flows through as-is. That's fine in
  isolation, but `rootTitle` is user-controlled (pattern title), so
  `'← Back to ${rootTitle}'` interpolates an unescaped value through the linkOut
  block — `linkOut.text` is **declared as string**, and `renderLinkOut` ultimately
  calls `toMarkdownLink` which escapes the text via `renderMarkdownLinkText`. So
  it's safe. **Update**: confirmed via re-read — `renderLinkOut` (line 1891-1898)
  routes through `toMarkdownLink` which escapes. Not a finding; noting for the
  cross-cutting "trust your own helpers" rule.
- **Verdict**: not a finding (kept for review continuity).

### M7. `documentation-type-registry.ts` `parse()` at module-init throws on schema mismatch with no provenance

- **Evidence**: `src/projections/documentation-composition/documentation-type-registry.ts:51`.
  `SupportedDocumentationTypeRegistryEntrySchema.parse(metadata)` runs at import.
  A failure raises a generic ZodError without telling the importer which
  documentation key failed.
- **Impact**: A typo in a doc-definition manifests as "Cannot import" with a
  cryptic Zod issue path. Slow to debug.
- **Remediation**: Wrap in `safeParse` and rethrow with the definition key:
  ```ts
  const result = Schema.safeParse(metadata);
  if (!result.success) throw new Error(`Documentation type "${definition.key}" failed registry validation: ${result.error.message}`);
  ```
- **Verification**: Mutation test — corrupt one definition and confirm the error
  names the culprit.

### M8. `containsControlCharacters` iterates by JS code-units, not code-points uniformly

- **Evidence**: `src/renderers/render-markdown.ts:2102-2110`. The `for...of`
  iteration over a string yields code points, then `codePointAt(0)` of each
  one-character string. This is fine, but the comment "decode entities before
  classification" combined with not normalising astral characters means a lone
  surrogate (U+D800) silently passes — `codePointAt(0)` returns the lone
  surrogate code unit which is above 0x1F. Lone surrogates are invalid Unicode
  and should not appear in a URL.
- **Impact**: Low — most input paths come from canonical sources. Defence-in-depth.
- **Remediation**: Add `if (codePoint >= 0xD800 && codePoint <= 0xDFFF) return true;`
  to `isControlCharacter`.
- **Verification**: Unit test feeding a lone-surrogate string.

### M9. `humanizeKey` re-runs three regexes per call; called repeatedly per fragment field

- **Evidence**: `src/_internal/format-utils.ts:8-16`. Invoked in every renderer
  for each fragment field key. Not cached.
- **Impact**: Modest, but every projection passes through this. A `Map<string,string>`
  memo would eliminate redundant work without changing semantics.
- **Remediation**: Wrap with a per-process `Map` cache (no eviction needed — key
  cardinality is bounded by the fragment schema).
- **Verification**: Perf microbench on `humanizeKey('patternName')` × 100k.

### M10. `renderTable` width computation walks rows three times

- **Evidence**: `src/renderers/render-markdown.ts:1797-1802` + earlier escape pass.
  We escape the rows, then compute `widths` by walking again, then pad-cell walk
  to emit. Three full passes of the table cells.
- **Impact**: Modest. Tables in this package are bounded (≤ a few dozen cols).
  Still a perf-budget sink for the larger requirement/business-rule tables.
- **Remediation**: Compute widths during the escape pass:
  ```ts
  const widths = columns.map(() => 0);
  const escapedColumns = columns.map((c, i) => {
    const cell = escapeTableCell(c);
    widths[i] = Math.max(widths[i], cell.length, 3);
    return cell;
  });
  // rows similarly
  ```
- **Verification**: Perf baseline; should never regress, may improve.

### M11. `routing` JSON serialisation iterates `childrenEntries` twice

- **Evidence**: `src/renderers/render-json.ts:75-97`. Once for `serializedChildren`,
  once for `serializedRouting.childRouteIds`. Each does its own sort.
- **Impact**: Bundles with many children pay 2× sort. Minor.
- **Remediation**: Sort once, drive both maps from the sorted keys array.
- **Verification**: Output equivalence (sort already deterministic).

### M12. `pushUnique` in file-reading-list and several internal helpers use `Array.includes` linear scan

- **Evidence**: `src/projections/execution-context/file-reading-list.internal.ts:128-132`
  and similar in dependency-tree's `childNames.includes(usedBy)`.
- **Impact**: O(n²) on long paths/dep lists. Bounded today but easy to drift.
- **Remediation**: Use a `Set` companion when pushing > ~10 items; keep the
  ordered array as the output shape.
- **Verification**: Same outputs, smaller perf-budget headroom margin.

---

## Low

### L1. `Render-ui` JSDoc declares the renderer is **not** a hardening boundary — but UI still gets unescaped pattern names in labels

- **Evidence**: `src/renderers/render-ui.ts:11-13` (the invariant comment). UI
  blocks are emitted with raw `paragraph(value)` (e.g. line 209) where `value` is
  a relationship string. The contract says callers must sanitise upstream.
  Reviewers should know this is a deliberate ADR-009 carve-out — the UI consumes
  trusted fragment data and the **renderer of the UI layer** (React component) is
  responsible for escaping.
- **Impact**: As-documented; recording for completeness so reviewers don't flag it
  as inconsistent.
- **Remediation**: None required. Consider linking ADR-009 from the file
  docstring to make the rationale more discoverable.

### L2. `safeDecodeURIComponent` returns the original value on decode failure — silent fallback

- **Evidence**: `src/renderers/render-ui.ts:667-673`. Used in
  `normalizePathToken`. Decode failures pass through silently.
- **Impact**: The UI path-token normaliser falls back to the raw path on
  malformed `%XX`, so links can still match. Could mask data corruption.
- **Remediation**: Either accept (current behaviour is reasonable for normalisation)
  or log a diagnostic via an injectable channel.

### L3. `getConstructorName` walks the prototype chain only one level

- **Evidence**: `src/renderers/render-json.ts:205-217`. If a class is anonymous
  or inherits from an anonymous wrapper, the error message becomes a generic
  `"object"`.
- **Impact**: Debug-only; misleading error.
- **Remediation**: Walk up to a maximum of 3 levels until a named constructor is
  found.

### L4. `dispatchByKind` cast is documented but still load-bearing

- **Evidence**: `src/renderers/_shared/dispatch.ts:30-37`. The cast is justified
  by an invariant comment but TypeScript cannot verify it.
- **Impact**: A future contributor renaming a fragment kind without updating the
  table key silently bypasses the dispatch and falls through to the generic
  branch.
- **Remediation**: At test setup time, assert
  `every kind in KindTable -> handler returns fragment.kind === key`. Or replace
  with a generated dispatcher.

### L5. `summarizeTokenEstimates` reads `?.chars ?? 0` from each estimate even when its sibling `tokens` is known

- **Evidence**: `src/projections/pattern-relations/bundle.internal.ts:181-186`. The
  function recomputes tokens from char totals via `finalizeTokenEstimate`. For
  large bundles this introduces a precision drift vs the sum of per-entry
  `tokens` values.
- **Impact**: Off-by-one on the bundle aggregate vs the sum of children. Cosmetic.
- **Remediation**: Sum `chars` AND `tokens` independently or document the
  expected drift.

### L6. `groupByH2` builds an artificial `'_preamble'` group label — magic string

- **Evidence**: `src/renderers/render-markdown.ts:2202-2204`. The literal
  `'_preamble'` is used as a sentinel within the same function; if any H2
  heading text were ever `'_preamble'` (unlikely but not impossible — `\_preamble`
  becomes `_preamble` after de-escape), the grouping would collide.
- **Impact**: Theoretical.
- **Remediation**: Use a unique `Symbol` or an `{ type: 'preamble' }` tagged
  union instead of a string sentinel.

### L7. `escapePlainMarkdownText` escapes `!` even when not preceded by `[` — image-syntax overzealous

- **Evidence**: `src/renderers/render-markdown.ts:1968`. `!` is unconditionally
  escaped. Markdown only treats `!` as significant when followed by `[`. The
  conservative escape is safe but produces noisy `\!` in normal prose.
- **Impact**: Output quality only.
- **Remediation**: Lookahead in regex (`!(?=\[)`). Lower priority unless docs-live
  noise becomes a flagged concern.

### L8. Two minor unused alias re-exports in `documentation-type-registry.ts`

- **Evidence**: `src/projections/documentation-composition/documentation-type-registry.ts:46`
  re-exports `DocumentationTypeMetadata = SupportedDocumentationTypeMetadata` —
  the alias is a stale shim from a rename and appears to be unused outside the
  file (verify with `grep`).
- **Impact**: Dead alias against the no-BC doctrine.
- **Remediation**: Delete the alias and any unused re-exports; confirm no
  consumers in the workspace.

### L9. `buildArchitectureNeighborhood` field order does not match other neighbourhood projections

- **Evidence**: `src/projections/pattern-relations/architecture-neighborhood.internal.ts:45-58`
  returns `{pattern, context, role, layer, uses, usedBy, dependsOn, ...}`. Other
  pattern-relations fragments sort keys alphabetically for the renderer (UI
  layer relies on `getOrderedFieldKeys`). Not a correctness issue but breaks the
  visual consistency assumption.
- **Impact**: Cosmetic / UI ordering.
- **Remediation**: Either rely on UI-layer ordering everywhere, or sort consistently
  at projection time.

### L10. `parseLogicalRouteId` throws plain `Error`, not `ProjectionError`

- **Evidence**: `src/routing/route-id.ts:63-71`. Other projection-layer failures use
  `ProjectionError` with codes; this one throws an untyped `Error`.
- **Impact**: Inconsistent error surface — callers cannot pattern-match on a code.
- **Remediation**: Introduce a `'INVALID_ROUTE_ID'` `ProjectionErrorCode` and use
  `ProjectionError`.

---

## Cross-cutting themes

- **Link-sanitisation correctness is the single biggest risk surface** (C1–C2, H3,
  H4). The current pipeline does "decode for classification, emit the original",
  which is exactly the variant most likely to round-trip an XSS payload through
  a downstream HTML parser. The fix is consistently small: emit the **decoded**
  form, encode that, and lean on a complete entity decoder.
- **Silent skips around the path canonicaliser** (H1, L2, M8) hide configuration
  bugs. Either throw or surface via the injected `onRenderDocument` hook —
  diagnostic fidelity matters for the perf-gated pipeline.
- **Allocation-heavy hot paths in dependency walks and PR-review** (H5, H6, H7, M3,
  M4) sit directly under the perf gate budget. Each is a small fix individually;
  collectively they reclaim meaningful headroom.
- **Re-parse discipline is excellent.** The single `parseAndProject` boundary
  helper is used uniformly, no internal `safeParse`/`.parse` calls on hot paths
  besides one acceptable module-init parse in the doc registry (M7). The
  trusted-markdown bypass is properly renderer-private. The Zod-first +
  `z.strictObject` discipline holds repo-wide — zero violations.
- **Helper duplication is creeping in** (M1 parseBusinessRuleAnnotations and a
  near-duplicate scenario deduper in two files). Consolidate while the drift is
  cosmetic; later it will be semantic.
- **Error-surface consistency is mostly there but routing throws plain `Error`** (L10).
  The repo invests in typed errors with codes via `ProjectionError` — keeping
  the routing layer aligned makes downstream pattern-matching deterministic.

End of findings (28 items: 3 Critical, 10 High, 12 Medium, 10 Low — Medium count
includes M6 self-retracted on re-read; net actionable items 27).
