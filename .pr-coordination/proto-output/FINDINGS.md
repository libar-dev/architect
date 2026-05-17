# Documentation projection — prototype findings (D8 CLI catalog)

> **Captured:** 2026-05-17, immediately after running `scripts/proto/cli-catalog.ts`.
> **Inputs:** the architect-cli `COMMANDS` Zod schemas + hand-coded editorial framing.
> **Outputs:** `.agents/skills/architect-cli-overview/SKILL.md` (94 lines, skill shape) + `.pr-coordination/proto-output/cli-docs/INDEX.md` (365 lines, full reference shape).
> **Purpose:** validate the design captured by `architect/specs/documentation-projection/` before any substrate code lands in `architect-projection`.

---

## 1. What the prototype proved

The four campaign capabilities each have concrete evidence from this run.

### `DocumentationProjection` (epic)
Two audience-shaped read models materialized from one source aggregate composition — no parallel narrative file was authored, and re-running the script regenerates both deterministically. The script is the projection; the markdown files are the read model materializations. **Epic invariant holds for this scope.**

### `MultiSourceComposition`
The script composed across **three source aggregates** and rendered them into both outputs:
1. **Schema-derived** (Zod `COMMANDS` object) — names, helpSignature, helpDetail.body, helpDetail.examples, requiresCliContext for 24 verbs.
2. **Editorial framing** (hand-coded in the script, lifted from `architect-data-api/SKILL.md`) — intent bundles, deterministic gates, known quirks.
3. **MCP parity** (hand-coded from `architect-data-api/SKILL.md`'s parity table; the real source is `architect-mcp/src/tool-registry.ts`).

Spec-01 invariant — "the projection draws from each source aggregate" — holds. The Open Question about conflict resolution did NOT trigger; no two aggregates carried overlapping facts in this scope.

### `OneSourceMultipleAudiences`
Same `CliCatalog` read model fed both `renderSkill()` and `renderDocs()`. Shared content (intent bundles, gates, anti-patterns / quirks) appears in both at different depths; audience-specific bits (skill's "When this fires"; docs' "Find what you need" lookup table and per-verb alphabetical reference) appear in only one. Cross-reference from skill → docs resolves to `.pr-coordination/proto-output/cli-docs/INDEX.md`.

**Spec-02 invariant holds.** Open Question on audience-side adapters: the prototype put audience-specific framing **in the renderers** (`renderSkill` knows about frontmatter and "When this fires"; `renderDocs` knows about the lookup table). That is fine at this scale; at 10+ audiences, fragment-level audience tagging would be the better pattern. Captured as a design question for substrate work (§ 3 below).

### `GoalOrientedNavigation`
The docs `INDEX.md` opens with a small "Find what you need" lookup — intent → section anchor. That's a navigation projection over the section heads, not hand-authored navigation. **Spec-03 invariant holds at small scale.** The Open Question about "single-document read models" got an answer for this case: a 365-line single doc benefits from a small lookup table but doesn't need a wiki-tree INDEX. The 3-axis model's INDEX axis correctly stays unused here.

### `SourceCanonical`
**This is where the substrate hit its biggest gap.** See § 2.

---

## 2. Substrate gaps surfaced

### Gap A — Editorial framing has no source aggregate today (load-bearing)
The intent bundles, deterministic-gate purposes, quirk catalogue, and MCP parity rows were **hand-coded in the prototype script**. In the production projection they must live somewhere. Three plausible homes:

| Option | Where it lives | Tradeoff |
|---|---|---|
| **A1.** Per-command JSDoc | `@architect-cli-intent: planning` + `@architect-cli-note: "candidate readiness signal"` on each command module | Pro: full `SourceCanonical` compliance. Con: scatters editorial framing across 5 command files; intent bundles need a composition layer to re-aggregate. |
| **A2.** `_shared/cli-catalog.md` doctrine | A markdown file with structured sections, loaded by a preamble fragment | Pro: editorial-shaped voice lives in editorial-shaped file. Con: parallel narrative file — exactly what `SourceCanonical` forbids. |
| **A3.** TypeScript fragment file | `docs-config/cli-catalog/editorial.fragment.ts` exporting typed bundle data | Pro: type-safe, colocates with the projection. Con: still a parallel-write source; lives outside the package source tree. |

**Recommendation:** Mix of A1 and A3. Per-command intent-bundle membership tags as JSDoc (`@architect-cli-intent`), with the cross-cutting framing (gate definitions, parity table, quirks) in a TypeScript fragment file that the projection consumes. Quirks could plausibly live as JSDoc on the relevant module too.

**Implication for `SourceCanonical`:** the invariant currently reads "every doc-claim source lives in the same file or package as the artifact it describes." If editorial framing lives in `docs-config/`, that's outside the package source tree — the invariant either accepts an editorial-framing carve-out or the framing migrates to JSDoc/`_shared/`. Worth refining the invariant in the spec before W-DOCS-1.

### Gap B — Most commands carry no `helpDetail.body` or `helpDetail.examples`
The schema-derived source aggregate was thinner than expected. Of 24 commands, only one (`query`, the whitelisted-methods passthrough) carries body lines; only one carries examples. The docs page's "Per-verb reference" section is consequently sparse — verb signatures + "Requires CLI context" flag, often nothing more.

**Implication:** either (a) commands should carry richer `helpDetail` (adds value to live `--help` output too — defensible), or (b) JSDoc-derived prose feeds the per-verb section (per Gap A1), or (c) per-verb shape data (parameters, return shapes) is structurally extracted from Zod schemas. The prototype skipped (c); production needs at least one of these.

### Gap C — MCP twin discovery wasn't joined
The MCP parity table was hand-typed in the script. The real join is `cli-cli-schema.COMMANDS` ⋈ `architect-mcp.tool-registry.ARCHITECT_MCP_TOOLS` by name pattern (snake_cased CLI name with `architect_` prefix). A real extractor performs this join. Adding it gives `MultiSourceComposition` a fourth aggregate live and surfaces parity drift automatically.

### Gap D — Audience-side adapter pattern wasn't tested
Spec 02's Open Question — "audience-specific bits in adapters or in the source?" — the prototype answered "in the renderer" by hard-coding `renderSkill`'s "When this fires" and `renderDocs`'s lookup table. At 2 audiences this is fine; at N audiences (skill + docs + Studio UI + JSON bundle + CLI compact-text) the pattern needs a more disciplined home. Best candidate: a `BlockSchema` variant (or a fragment-level audience tag) declaring which audiences a section belongs to.

---

## 3. Where progressive disclosure (3-axis) held vs. cracked

| Axis | Question | Result | Notes |
|---|---|---|---|
| **INPUT** | Which sub-sections does this fragment emit at this embedding site? | **Held cleanly.** | Skill emits a strict subset of what docs emits, plus skill-specific framing. The same `CliCatalog` source supports both depths without needing per-fragment disclosure logic. |
| **OUTPUT** | Inline or split-into-files rendering? | **Not exercised.** | Both outputs are single-file. A wiki tree would activate the OUTPUT axis; we deliberately stayed single-file to keep the prototype tight. |
| **INDEX** | How deep does navigation expose the tree? | **Not exercised in the wiki-tree sense.** | The docs `INDEX.md` has a "Find what you need" lookup which is a small INDEX projection. A multi-page wiki would need much more (file map, concept index, reading paths). The 3-axis split is correctly sized — INDEX stays inert when OUTPUT stays inline. |

**Verdict:** the 3-axis disclosure model from `DECISIONS.md` D2 holds up. INPUT carried the entire prototype; OUTPUT + INDEX remain to be exercised when we hit a topic that needs wiki-tree fan-out. **No revision to the 3-axis model is suggested by this prototype.**

What would push the model harder: a topic where INPUT depth and OUTPUT split-vs-inline disagree (e.g., a fragment that wants `advanced` INPUT depth at site A and `important` INPUT depth at site B, while ALSO needing OUTPUT split at site A only). The CLI catalog didn't generate such a case — D1 (FSM) might, because FSM transitions naturally enumerate per-rule pages.

---

## 4. Question for the campaign — does the skill output meet the bar?

Read the generated `.agents/skills/architect-cli-overview/SKILL.md` cold. Does it actually serve a session that needs a verb-by-intent lookup? Two specific questions:

1. **Compared to the existing `architect-data-api` skill body** (which carries the full reference plus the same intent bundles), is the lighter compact skill genuinely more useful for sessions that already know what they want, or is it just a partial copy with a link? If the latter, the OneSourceMultipleAudiences invariant is satisfied but the *value* of the second audience is questionable.
2. **The docs `INDEX.md` at 365 lines** — is that a reasonable single-doc shape for "generated CLI reference", or should we have split it into a wiki tree (per-verb page + INDEX) immediately? My read: single-doc is right here; per-verb pages would be padding because most commands carry sparse `helpDetail`.

---

## 5. Recommended next steps

If the prototype passes the "is this useful?" reading test:

1. **Sharpen `SourceCanonical` invariant** in `architect/specs/documentation-projection/04-source-canonical.feature` — add an explicit carve-out for editorial framing (per Gap A) OR commit to JSDoc/per-command sourcing.
2. **Add `@architect-cli-intent` annotation carrier** (or equivalent) — the smallest source-side change that unblocks A1 above. Note: this contradicts DECISIONS.md D3'' ("no new annotation carriers"). The campaign now has a real reason to reopen that decision. Surface to design tier explicitly.
3. **Try D1 (FSM/ProcessGuard) next** as a second prototype — exercises OUTPUT (per-rule pages) + INDEX axes the CLI catalog didn't reach.
4. **Substrate work for W-DOCS-1** can now be specified concretely: `DocDefinition`, `composeDoc`, `ContentFragment` definitions need to support the read-model composition pattern the prototype hand-rolled (catalog object → renderer functions).

If the reading test fails (skill is fluff, docs are sparse):

- Iterate the prototype with richer per-command source (start with adding `helpDetail.body` to 5-10 verbs and see whether the docs page becomes substantively better) — this is cheap and the answer dictates whether Gap B is load-bearing.

---

## 6. Artifacts

- `scripts/proto/cli-catalog.ts` — the projection script (single source).
- `.agents/skills/architect-cli-overview/SKILL.md` — agent-shaped read model.
- `.pr-coordination/proto-output/cli-docs/INDEX.md` — human-reader-shaped read model.
- This file.

The prototype script, both outputs, and this findings document together capture one full pass over the documentation-projection design. They can all be deleted alongside `.pr-coordination/` once the lessons land in design-tier specs.
