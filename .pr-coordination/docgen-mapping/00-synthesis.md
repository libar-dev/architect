# Doc-generation IA & duplication map — cross-corpus synthesis

> **Inputs:** Five inventory reports at `/tmp/docgen-mapping/01-skills.md`,
> `02-formal-spec.md`, `03-docs.md`, `04-docs-sources.md`, `05-substrate.md`.
> Total covered: ~14,100 lines of hand-maintained markdown + the existing
> `packages/architect-projection/` substrate.
>
> **Framing:** `.pr-coordination/PROPOSED-DESIGN.md` § 10–11, `DECISIONS.md`
> D1–D12, `INVENTORY.md` § 6/§ 7. Kernel rule: **no new annotation carriers**;
> duplication closes via `ContentFragment`s + generated-insert directives over
> existing PatternGraph data (`@architect-*` JSDoc, Gherkin `Rule:`/`Scenario:`
> titles, Zod schemas in `architect-core`).

---

## 1. Corpus sizes and what survives migration

| Corpus                                                               | Files  | Lines      | Survives as                                         | Migrates to                                                         | Deletes outright                                 |
| -------------------------------------------------------------------- | ------ | ---------- | --------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| `.agents/skills/architect-*/SKILL.md` (sessions + router + data-api) | 9      | 1,767      | Skill body (slim wiki tree per D7)                  | Multi-target `WikiIndexDefinition` (skill + canonical wiki)         | —                                                |
| `.agents/skills/_shared/*.md`                                        | 9      | 1,048      | Seed ContentFragment set (already proto-fragments)  | Each split along topic-cluster boundaries; embedded at INPUT depths | `canonical-references.md` stays as doctrine root |
| `formal-spec/*.md` (00–12 + appendix + README + REVIEW)              | 16     | 4,472      | Wiki tree under `docs-live/formal-spec/` per D5     | 17 generated-inserts + 8 fragments + 1 wiki sub-tree (§ 09)         | REVIEW-FINDINGS (retired)                        |
| `docs/*.md` (15 manual docs)                                         | 15     | 5,427      | Wiki trees + single-docs under `docs-live/` per D5  | 5 wiki trees + 4 single-docs + 1 salvage-to-preamble                | 5 dead-weight files (~1,320 lines)               |
| `docs-sources/*.md` (abandoned generator inputs)                     | 8      | 1,397      | 2 KEEP + 5 SALVAGE + 1 DELETE → ~390 preamble lines | New `preamble()` content tree (authored fresh)                      | `index-navigation.md`                            |
| **Total**                                                            | **57** | **14,111** | —                                                   | —                                                                   | **~1,475 lines of pure delete**                  |

**Net hand-authored survives:** ~390 preamble lines from `docs-sources/`
(28% salvage rate) + the ~120 lines of doctrine in `_shared/canonical-references.md`

- ~1,000 lines of irreducible normative prose across `formal-spec/00`, `01`,
  `12` introductions and `docs/METHODOLOGY.md` Core-Thesis. **Everything else is
  either derivable from code/spec data or duplicated content awaiting fragment
  extraction.**

---

## 2. The cross-corpus duplication matrix — the load-bearing finding

Of all duplications surfaced by the per-corpus reports, **eleven topics appear
verbatim or near-verbatim in 3+ of the four corpuses (skills + formal-spec +
docs + docs-sources).** These are the highest-leverage ContentFragment
candidates — closing each one collapses 3–7 hand-maintained sites at once.

The matrix below maps each topic to its appearance across the four corpuses
with **depth markers** (`adv` = advanced/full / `imp` = important/summary /
`use` = useful/overview / `link` = link-only) and to its **source-of-truth**
(the canonical data behind the topic).

| #       | Topic                                                                                 | `_shared/`                                                         | session skills                                                                                                         | `formal-spec/`                                                                                                                           | `docs/`                                                                                                      | `docs-sources/`                                                               | Source-of-truth                                                                                                                      | Cross-corpus sites |
| ------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| **D1**  | **FSM / ProcessGuard transitions + protection levels**                                | `fsm-transitions.md` adv                                           | implement-spec imp, refactor-session imp, verify-handoff imp, data-api imp                                             | `09-delivery-lifecycle.md` adv (transitions, 6 rules, protection levels)                                                                 | `PROCESS-GUARD.md` adv, `VALIDATION.md` imp, `SESSION-GUIDES.md` imp                                         | `process-guard.md` adv (mostly derivable)                                     | `validation/fsm/transitions.ts` + `architect-guard/src/lint/process-guard/decider.ts` + `tests/features/process-guard-rules.feature` | **9 sites**        |
| **D2**  | **Tag registry (per-group tables + enum values)**                                     | `annotation-ownership.md` imp (purpose tables)                     | data-api imp (via taxonomy verb)                                                                                       | `04-tag-registry.md` adv (12 groups), `02-artifact-types.md` imp (required tags), `03-tag-system.md` imp (required-by-conformance-level) | `ANNOTATION-GUIDE.md` adv (tag-groups + format-types)                                                        | `annotation-guide.md` adv (older 12-group taxonomy — stale)                   | `taxonomy/registry-builder.ts` + `*-values.ts` (status/role/arch-layer/maturity/adr-category/hierarchy/format)                       | **7 sites**        |
| **D3**  | **Four-tier ladder (tiers + mandatory tags + promotion paths)**                       | `four-tier-ladder.md` adv                                          | plan-session adv, design-session imp, review-spec imp, verify-handoff use, session-router use                          | `08-spec-evolution.md` adv (Idea tier + 4 levels), `05-feature-spec-format.md` imp (plan vs design)                                      | `METHODOLOGY.md` imp (Two-Tier Spec Architecture), `SESSION-GUIDES.md` imp                                   | —                                                                             | hand-written kernel (no code mirror; tier definition + tag registry derivation)                                                      | **8 sites**        |
| **D4**  | **Rule-block 4-field template (invariant / rationale / verified-by + tier guidance)** | `rule-block-template.md` adv                                       | design-session imp, implement-spec imp, review-spec use, plan-session use, refactor-session use, value-transfer.md use | `05-feature-spec-format.md` § 6 adv, `06-adr-format.md` imp, `07-stub-format.md` use, appendix exs 3/4/5 use                             | `GHERKIN-PATTERNS.md` adv (Rule Block Structure), `METHODOLOGY.md` use, `SESSION-GUIDES.md` use              | `gherkin-patterns.md` adv                                                     | hand-written Gherkin convention + Rule extractor                                                                                     | **11 sites**       |
| **D5**  | **Annotation ownership / split-ownership policy**                                     | `annotation-ownership.md` adv (feature-owned vs code-owned tables) | design-session imp, implement-spec imp, refactor-session imp, review-implementation imp                                | `07-stub-format.md` imp (production vs stub), `08-spec-evolution.md` imp ("what survives the transfer")                                  | `ANNOTATION-GUIDE.md` adv, `METHODOLOGY.md` adv                                                              | `annotation-guide.md` adv (stale ownership model)                             | hand-written kernel (`_shared/annotation-ownership.md`) + lint-patterns rules                                                        | **9 sites**        |
| **D6**  | **Value transfer / pre-deletion gate (5-criterion)**                                  | `value-transfer.md` adv                                            | implement-spec imp, review-implementation adv (+graph-integrity), refactor-session imp (adapted variant)               | `07-stub-format.md` imp (stub lifecycle), `08-spec-evolution.md` adv ("what survives", Value Transfer Summary)                           | `METHODOLOGY.md` use (Code Stubs lifecycle)                                                                  | —                                                                             | Gherkin Rule rationale on `value-transfer-state.feature` + future `value-transfer` CLI verb                                          | **7 sites**        |
| **D7**  | **Project config schema (Zod-driven field tables)**                                   | —                                                                  | —                                                                                                                      | `11-project-configuration.md` adv (Sources/Output/Generators)                                                                            | `CONFIGURATION.md` adv, `ARCHITECTURE.md` adv (Configuration Architecture), `MCP-SETUP.md` use               | `configuration-guide.md` adv (older — `DDD_ES_CQRS_ROLES` stale)              | `architect-core/src/config/project-config-schema.ts` (Zod)                                                                           | **5 sites**        |
| **D8**  | **CLI verb reference (`overview`/`context`/`bundle`/`scope-validate`/…)**             | — (data-api owns)                                                  | data-api adv (~30 verbs), every session skill use (XREF)                                                               | `12-live-documentation-api.md` imp (CLI surface)                                                                                         | `CLI.md` adv, `SESSION-GUIDES.md` use, `PROCESS-GUARD.md` imp (CLI options), `VALIDATION.md` imp (CLI flags) | `cli-recipes.md` use, `validation-tools-guide.md` adv, `process-guard.md` adv | `architect-cli/src/commands/` (CLI Zod schemas) + CLI `--help`                                                                       | **11 sites**       |
| **D9**  | **MCP tool catalog (21 tools)**                                                       | —                                                                  | data-api adv (CLI↔MCP parity 20-row table)                                                                             | `12-live-documentation-api.md` imp (`architect_documentation` params, projection set)                                                    | `MCP-SETUP.md` adv (18-row tool table — stale count)                                                         | —                                                                             | `architect-mcp/src/tool-registry.ts` (21 tools — CLAUDE.md says 18, stale)                                                           | **4 sites**        |
| **D10** | **Canonical project layout (directory tree)**                                         | —                                                                  | —                                                                                                                      | `02-artifact-types.md` adv (Canonical Directory Layout), `11-project-configuration.md` adv (Canonical Project Layout)                    | `CONFIGURATION.md` imp (Monorepo Example), `ARCHITECTURE.md` use                                             | `configuration-guide.md` use (Monorepo Setup ASCII tree)                      | hand-authored tree (no clean code mirror — `defaults.ts` sources too narrow); fragment-only                                          | **5 sites**        |
| **D11** | **Scope-validate verdicts (PASS / WARN / BLOCKED + planning/review carve-out)**       | `fsm-transitions.md` imp                                           | data-api adv, design-session imp, implement-spec imp, review-spec imp, plan-session use                                | `09-delivery-lifecycle.md` imp (Scope-Validate Pre-Flight)                                                                               | `SESSION-GUIDES.md` imp, `PROCESS-GUARD.md` use                                                              | —                                                                             | CLI `scope-validate` verb in `architect-cli` + MCP `architect_scope_validate` tool                                                   | **8 sites**        |

### 2.1 What the matrix tells us

**Three observations from the table:**

1. **Five topics dominate — D1, D3, D4, D5, D8 each touch 8–11 sites.** These
   are the only fragments where extraction unambiguously pays back the
   substrate work. Everything beyond the eleven-row table either touches one
   corpus (intra-corpus fragments — already covered by per-corpus reports) or
   has so few sites that prose link-out is acceptable.

2. **Two source-of-truth families dominate the data side: the Zod schemas
   in `architect-core` (D1, D2, D7, D9, D11) and the FSM/decider code in
   `architect-guard` (D1, D11 partially).** A single `extractZodSchemaFields`
   extractor + a single `extractFSMTransitionMatrix` extractor + the existing
   `projectTaxonomyDigest` cover the data-side of 7 of the 11 cross-corpus
   topics. The cost of the substrate is amortized aggressively.

3. **The remaining four — D3, D4, D5, D6, D10 — are hand-written doctrine
   in `_shared/`.** They are not derivable from code today, and `DECISIONS.md`
   explicitly refuses to add carriers (D3'', D3b, no new tags). The right
   move: keep `_shared/` as the canonical source, embed it as
   ContentFragments via `preamble()` + `defineContentFragment`. The wiki
   substrate treats `_shared/*.md` files as fragment **sources**, not as
   targets.

### 2.2 The "intra-corpus only" fragments (recap from per-corpus reports)

Topics that recur within one corpus but not across — these resolve via
per-corpus ContentFragments and are tracked in the relevant inventory:

- **Skills only:** doctrine-references XREF block (7 sites), "Anti-patterns"
  vs "Do not" intra-skill repetition (6 sites), retroactive-spec tripwire
  (5 sites), recommended-next-skill table (router + verify-handoff). See
  `01-skills.md` § F (CF-recommended-next-skill is the highest-drift fix).
- **Formal-spec only:** required-tags-by-artifact-type tables (drift #29:
  §02 Type 1–4 tables are filters over §04), required-tags-by-conformance
  (drift #30: §03 6 sub-tables — same), tier-comparison plan-vs-design
  (drift #31: §05 + §08 twice). See `02-formal-spec.md` § B/C.
- **Docs only:** see `03-docs.md` § F (F8 `cli-command-catalog`,
  F10 `codec-catalog`, F13 `progressive-disclosure-split`, F14
  `scenario-tag-catalog`).

---

## 3. Canonical-owner assignments for the 11 cross-corpus fragments

The fragment substrate (PROPOSED-DESIGN § 3b) requires each ContentFragment
to declare one `canonicalDoc` that owns the `advanced` depth. Non-canonical
embeddings render at lower depths and emit a link to the canonical site via
`linkToCanonical: true`. The eleven-row table above implies the following
canonical assignments:

| Fragment ID                         | Canonical doc (route)                                                                                                          | Why this corpus owns it                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CF-fsm-transitions` (D1)           | `docs-live/formal-spec/09-delivery-lifecycle/` (wiki tree per D5)                                                              | Spec is the audience-neutral canonical; skills + docs are consumers. The wiki tree shape is mandatory because each ProcessGuard rule wants its own page (per `02-formal-spec.md` § F.1).                           |
| `CF-tag-registry` (D2)              | `docs-live/formal-spec/04-tag-registry/<group>/` (one page per group)                                                          | §04 is 85% derivable — purest data section. The per-group page shape matches the `groupName` field already in the tag registry.                                                                                    |
| `CF-four-tier-ladder` (D3)          | `.agents/skills/_shared/four-tier-ladder.md` (kernel doctrine)                                                                 | Hand-written kernel — no code source. `_shared/` is the canonical voice for this. Formal-spec § 08 imports it.                                                                                                     |
| `CF-rule-block-template` (D4)       | `.agents/skills/_shared/rule-block-template.md`                                                                                | Same — hand-written Gherkin convention with no code source.                                                                                                                                                        |
| `CF-annotation-ownership` (D5)      | `.agents/skills/_shared/annotation-ownership.md`                                                                               | Same — hand-written split-ownership kernel.                                                                                                                                                                        |
| `CF-value-transfer` (D6)            | `.agents/skills/_shared/value-transfer.md`                                                                                     | Hand-written + tied to the future `value-transfer` CLI verb. When that verb ships, the 5-criterion gate becomes derivable JSON — re-canonicalize then.                                                             |
| `CF-project-config-schema` (D7)     | `docs-live/formal-spec/11-project-configuration/`                                                                              | Zod-driven; the spec section is the natural home. `docs/CONFIGURATION.md` becomes a thin reuse.                                                                                                                    |
| `CF-cli-verb-catalog` (D8)          | `.agents/skills/architect-data-api/SKILL.md` (intent-parameterized)                                                            | The data-api skill is the canonical CLI reference per CLAUDE.md ("the canonical reference for the CLI + MCP surface"). Splitting it across formal-spec/12 + docs/CLI.md would violate the kernel.                  |
| `CF-mcp-tool-catalog` (D9)          | `.agents/skills/architect-data-api/SKILL.md` (via the CLI↔MCP parity table)                                                    | Same kernel reason. The 21-tool registry is in `architect-mcp`; the skill projects it.                                                                                                                             |
| `CF-canonical-project-layout` (D10) | `docs-live/formal-spec/02-artifact-types/` (with cross-import from § 11)                                                       | Hand-authored tree — keep one source; both §02 and §11 import it.                                                                                                                                                  |
| `CF-scope-validate-verdicts` (D11)  | `.agents/skills/_shared/fsm-transitions.md` (§ "Pre-flight: use scope-validate") OR a new `_shared/scope-validate-verdicts.md` | The verdict shape lives in the CLI output but the **interpretation** (carve-out: only `design`/`implement` are accepted; idea/candidate are structurally validated) is doctrine. Hand-written kernel is canonical. |

**Pattern:** seven of the eleven canonical sites land in `docs-live/formal-spec/`
or `.agents/skills/_shared/`. **Four land in the data-api skill or in shared
doctrine that the formal spec then imports.** This validates the
`DECISIONS.md` D5 + D7 plan: `docs/` is a deletion target; the canonical
sites are formal-spec wiki trees + `_shared/` fragments + `architect-data-api`.

---

## 4. The three disclosure axes — applied to the eleven fragments

D2 declares three orthogonal axes. The mapping below shows how each
cross-corpus fragment uses each axis:

| Fragment                            | INPUT axis (which sub-sections emit?)                                                                                         | OUTPUT axis (inline vs split files?)                                                                     | INDEX axis (depth of nav)                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `CF-fsm-transitions` (D1)           | Skill use → `imp` (matrix + brief rules); doc use → `imp`/`adv` (matrix + 6 rule pages); spec → `adv` (full + per-rule pages) | Wiki tree → split per-rule pages (`09-delivery-lifecycle/<rule-N>/`). `nested-index` layout.             | INDEX summarizes: matrix preview + rule list + Mermaid Decider topology |
| `CF-tag-registry` (D2)              | Spec → `adv` (all groups); skill use → `imp` (purpose tables only)                                                            | Wiki tree → one page per group                                                                           | INDEX = group table + group page list                                   |
| `CF-four-tier-ladder` (D3)          | Skill use → `adv` (tier rules in plan-session; carve-out in design-session); doc use → `imp`                                  | Single doc — fits ~130 lines                                                                             | INDEX from parent wiki only                                             |
| `CF-rule-block-template` (D4)       | All embed at `imp` except design-session `adv` and `_shared/` source `adv`                                                    | Single doc                                                                                               | INDEX from parent only                                                  |
| `CF-annotation-ownership` (D5)      | Mostly `imp` everywhere; design-session/`_shared/` source `adv`                                                               | Single doc                                                                                               | INDEX from parent only                                                  |
| `CF-value-transfer` (D6)            | Source `adv`; review-implementation `adv` (with graph-integrity overlay); refactor-session `adv` (adapted form)               | Single doc; possibly split when the future CLI verb mechanizes the gate                                  | INDEX from parent only                                                  |
| `CF-project-config-schema` (D7)     | Spec → `adv` (all schema field tables); docs → `adv`; MCP-SETUP → `use`                                                       | Wiki tree if §11 splits to `11-project-configuration/<topic>/` pages; otherwise single doc               | INDEX = top-level / source / output tables linked                       |
| `CF-cli-verb-catalog` (D8)          | Intent-parameterized: pre-flight bundle by session intent. Every session skill `use`; data-api `adv`                          | Wiki tree (`docs-live/cli/<verb>/`) — every verb has its own page; intent-pre-flight is an INDEX section | INDEX = parity table + per-verb pages + per-intent pre-flight section   |
| `CF-mcp-tool-catalog` (D9)          | Data-api `adv` (full 21 tools); MCP-SETUP `imp`; formal-spec/12 `imp`                                                         | Aligned with D8 — same wiki tree                                                                         | Same INDEX axis as D8                                                   |
| `CF-canonical-project-layout` (D10) | `adv` in §02 and §11 (full tree); `use` in `CONFIGURATION.md`                                                                 | Single block — fits ~70 lines                                                                            | INDEX from parent only                                                  |
| `CF-scope-validate-verdicts` (D11)  | Data-api `adv`; design/implement/review-spec skills `imp` (with planning/review carve-out note)                               | Single doc                                                                                               | INDEX from parent only                                                  |

**Pattern observation:** of the eleven fragments, **four (D1, D2, D7, D8/D9)
benefit from the full wiki-tree-with-INDEX shape**. The other seven fit in a
single doc, embedded at varying INPUT depths across consumers. This validates
the campaign's "wiki-tree is one shape among four" framing in
`PROPOSED-DESIGN.md` § 10 — most fragments are single-doc, the wiki-tree
shape pays off precisely where the data has a natural enumeration axis
(per-rule, per-group, per-verb, per-tool).

---

## 5. Implications for the W-DOCS wave sequencing

The original wave sequence (`DECISIONS.md` D6 + `PROPOSED-DESIGN.md` § 7):

```
W-DOCS-1   Substrate + meta-PoC (DocDefinition + WikiIndex + projectWikiIndex)
W-DOCS-2   Extractor catalog (2a shapes / 2b registries / 2c diagrams)
W-DOCS-2d  ContentFragments + INPUT-disclosure integration
W-DOCS-3   Multi-target output
W-DOCS-4   Generated-insert directive
W-DOCS-5   Port 11 pre-refactor reference docs
W-DOCS-6   Doctrine carriers
W-DOCS-7   Cleanup pass (delete docs/, formal-spec/ sources)
W-DOCS-8   Query surface gaps (independent)
```

### 5.1 Cross-corpus map implies a re-prioritization within W-DOCS-2

The eleven-row table makes seven extractors first-priority for **shipping
any cross-corpus fragment**:

| Extractor                                                     | Used by fragments              | Sites unlocked            |
| ------------------------------------------------------------- | ------------------------------ | ------------------------- |
| `extractTagRegistryForFormalSpec(group)`                      | D2                             | 7                         |
| `extractFSMTransitionMatrix()` + `extractProcessGuardRules()` | D1, D11                        | 9 + 8 = 17 (some overlap) |
| `extractProjectConfigSchemaForDocs()`                         | D7                             | 5                         |
| `extractCliCommands()`                                        | D8                             | 11                        |
| `extractMcpTools()`                                           | D9                             | 4                         |
| `extractScopeValidateOutcomes()`                              | D11 (subset)                   | 8                         |
| `extractZodSchemaFields()` (generic)                          | D7, plus 5 intra-corpus drifts | 5+                        |

**These overlap heavily with the W-DOCS-2 catalog already in PROPOSED-DESIGN
§ 2.** The map narrows W-DOCS-2's MVP: ship just these seven extractors
(7-8 of the ~15 listed in PROPOSED-DESIGN § 2) and the cross-corpus fragment
work in W-DOCS-2d becomes immediately tractable.

### 5.2 Cross-corpus map implies new W-DOCS sub-waves at W-DOCS-5

`DECISIONS.md` D5 names `docs/` and `formal-spec/` as deletion targets but
proposes wave allocation without considering cross-corpus reuse. The map
above suggests grouping the migration by **canonical fragment owner**:

| Sub-wave      | Canonical owner                                                                                   | What ships                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **W-DOCS-5a** | `docs-live/formal-spec/04-tag-registry/` + `09-delivery-lifecycle/` + `11-project-configuration/` | The three drift epicenters as wiki trees. Each is W-DOCS-2 extractor work + W-DOCS-2d fragment definitions + page generation in one PR. Closes 7 + 9 + 5 = **21 cross-corpus sites in three PRs.**    |
| **W-DOCS-5b** | `docs-live/formal-spec/{02, 03, 05, 06, 07, 08, 10, 12}/`                                         | Tag-table-derivable spec sections — each is a per-section wiki tree with fragments imported from W-DOCS-5a's canonical sites. Smaller per-PR scope.                                                   |
| **W-DOCS-5c** | `docs-live/architecture/`                                                                         | The 1,627-line `docs/ARCHITECTURE.md` decomposed per `03-docs.md` § D — 12 top-level pages + `06-codecs/` sub-tree. Independent of W-DOCS-5a (its fragments are codec/architecture-specific).         |
| **W-DOCS-5d** | `.agents/skills/architect-data-api/` as a multi-target wiki tree                                  | CLI + MCP catalog rationalization (D8, D9). One wiki tree per verb under `docs-live/cli/<verb>/` + per-tool under `docs-live/mcp/<tool>/`. Replaces `docs/CLI.md` + `docs/MCP-SETUP.md`.              |
| **W-DOCS-5e** | Doctrine wiki trees                                                                               | METHODOLOGY.md + SESSION-GUIDES.md as wiki trees per D7, sourcing from `_shared/*` fragments. This is the only sub-wave where the canonical owner is `_shared/` rather than `docs-live/formal-spec/`. |

### 5.3 Cross-corpus map implies W-DOCS-1 PoC is well-scoped

The meta-PoC (`docs-live/wiki-doc-generation/` + `.claude/skills/wiki-doc-generation/`)
per D4'/D10/D11/D12 deliberately uses **only intra-PoC fragments** (PROPOSED-DESIGN
§ 11.3 names `pipeline-overview`, `wiki-index-definition-shape`,
`disclosure-axes-table` — all sourced from the PoC's own code). The
cross-corpus map confirms this scoping: none of the eleven cross-corpus
fragments are required to validate the substrate. The PoC stays small;
W-DOCS-2 starts ingesting the cross-corpus extractors right after.

---

## 6. Open design questions surfaced by the synthesis

The five inventory reports independently surfaced four questions that the
PoC/design-tier sessions should answer before W-DOCS-2 / W-DOCS-5 begin:

### 6.1 Where do `_shared/*.md` fragments physically live in the new world?

D7 says skills become wiki trees with `_shared/` as ContentFragment sources.
The substrate map (`05-substrate.md`) places fragment infrastructure in
`packages/architect-projection/src/doc-definition/`. But the **fragment
content** (`_shared/four-tier-ladder.md` body) is hand-authored markdown.
Three options:

- **(a)** Keep `_shared/*.md` files in `.agents/skills/_shared/`; the
  fragment runner uses `preamble()` to load them. **No file move.** Best fit
  for the no-BC doctrine.
- **(b)** Move them under `docs-sources/_shared/`; the runner loads from
  there; the skill build re-emits them under `.agents/skills/_shared/` as a
  multi-target output. **Single source, two locations.**
- **(c)** Author them as TypeScript fragment files (`stub-format.fragment.ts`
  per PROPOSED-DESIGN § 3b); the markdown is generated. **Most type-safe
  but loses the "markdown is the source" affordance.**

Recommendation: **(a) short-term**, revisit at W-DOCS-6 if drift between
`_shared/*.md` and the rendered wiki tree under `docs-live/` becomes a
real-world problem. Markdown source preserves authorial speed.

### 6.2 How does the meta-PoC's mermaid diagram (D10) get its data?

PROPOSED-DESIGN § 11.2 says the pipeline diagram is "emitted by
`extractGraphDiagram` (or hand-built as `MermaidBlock` for the PoC) from a
`@architect-diagram pipeline` annotation on the canonical pipeline module."
The substrate map (`05-substrate.md` § C.1) shows `MermaidBlock` exists in
`SectionBlock` and `parseMarkdownToBlocks` detects mermaid fences. **No
`@architect-diagram` carrier exists today.** D3'' bans new carriers.

Resolution: the PoC builds the `MermaidBlock` inline in TypeScript inside
the fragment's `build()` function (substrate map § E.1 confirms this works
— "fragments author the richer shapes directly in TypeScript"). No new
carrier needed. Document this pattern in PROPOSED-DESIGN § 11 as a clarifying
amendment.

### 6.3 What's the policy when `formal-spec/` and `_shared/` disagree?

The cross-corpus matrix surfaces conflicts: e.g., `formal-spec/08
"What survives the transfer"` table mirrors `_shared/value-transfer.md`
Transfer checklist (drift #15), but the two tables have different column
sets (row counts differ — formal-spec has 7 categories, value-transfer.md
has 7 from→to rows but different categorization).

The canonical-references rule (`_shared/canonical-references.md`
"Anti-anecdote") says: when `_shared/` and `formal-spec/` disagree,
`_shared/` wins for skill-loaded contexts. But for documentation outputs,
the formal-spec is the audience-neutral canonical.

Resolution: **for any fragment whose canonicalDoc is in `_shared/`, the
formal-spec section that previously inlined the same content becomes
`linkToCanonical: true` at `important` depth.** The fragment definition
declares the canonical owner; renderers enforce it; the formal-spec text
shrinks to a one-paragraph framing + the link. Spec authority is preserved
for editorial framing; doctrine authority lives in `_shared/`.

### 6.4 Does W-DOCS-1 ship a complete `gte()` comparator or just the PoC subset?

`05-substrate.md` § B.2 lists `gte(level, threshold)` as a single new export
in `disclosure/levels.ts`. Trivial — `indexOf`-based. **Recommendation:
ship it complete in W-DOCS-1.** The PoC needs it; no one else can ship
without it.

---

## 7. Recommended deliverable ordering for W-DOCS-2 + W-DOCS-2d

The cross-corpus map narrows W-DOCS-2's MVP. **Ship in this order**, each
step a small PR:

1. **`extractCliCommands` + `extractMcpTools`** → unblocks D8 + D9 (15
   cross-corpus sites). These are the simplest extractors; both read Zod
   schemas in `architect-cli` and `architect-mcp`. Cheap.
2. **`extractTagRegistryForFormalSpec(group)`** → unblocks D2 + drifts
   #29/#30 (~10 intra-corpus + 7 cross-corpus sites). The largest single
   drift epicenter.
3. **`extractFSMTransitionMatrix` + `extractProcessGuardRules` +
   `extractProtectionLevels`** → unblocks D1 + D11 (~17 sites). The
   `process-guard-rules.feature` already enforces the data; no new
   verification needed.
4. **`extractProjectConfigSchemaForDocs()` (Zod-to-md)** → unblocks D7
   (5 sites). Generalizes to all Zod schemas (`extractZodSchemaFields`
   per PROPOSED-DESIGN § 2).
5. **`extractScopeValidateOutcomes`** → unblocks D11 (8 sites). Trivial
   3-row table from CLI Zod schema.
6. **`defineContentFragment` + `gte(level)` + canonical-doc enforcement**
   (W-DOCS-2d substrate) → unblocks every cross-corpus fragment.
7. **First six cross-corpus fragments** (D1, D2, D7, D8, D9, D11) —
   the data-derived ones. Validates the substrate before the doctrine
   fragments (D3, D4, D5, D6, D10) which rely purely on hand-authored
   `_shared/` content.
8. **Five doctrine fragments** (D3, D4, D5, D6, D10) — these are the
   "preamble loaded from `_shared/<topic>.md`" path. Lower risk
   because no extractor is in the loop.

### 7.1 PR cost estimate

Each step above is 1–2 sessions per `PROPOSED-DESIGN.md` § 7 sizing.
Cumulative for steps 1–8: ~10–12 sessions to clear the cross-corpus
duplication map. This sits inside W-DOCS-2 + W-DOCS-2d as originally
proposed; no new wave is needed.

---

## 8. Net answers to the user's three framing questions

> **Can PatternGraph extract what we need?**

**Yes for all eleven cross-corpus fragments.** Six (D1, D2, D7, D8, D9, D11)
are direct Zod/CLI/FSM extractor work; five (D3, D4, D5, D6, D10) are
`_shared/*.md` hand-authored doctrine that the runner loads as
`preamble()`. No new annotation carrier is required. The substrate map
confirms 12 of the 12 hardcoded dispatch table entries are already
`project*` reuse; no new graph queries are needed for the campaign.

> **Annotation-config vs rethink to something more flexible?**

**No rethink needed.** The existing annotation surface (no-new-carriers
doctrine per D3'', D3b) carries the cross-corpus IA cleanly via:

- **PatternGraph** (Zod-derived `ExtractedPattern` + tag registry) for
  D1, D2, D7, D8, D9, D11.
- **`_shared/*.md` files** treated as ContentFragment sources for D3,
  D4, D5, D6, D10.
- **Gherkin `Rule:`/`Scenario:`/`Feature:` titles** (existing executable
  spec primitives) for the wiki-index Concept Index per D3''.
- **The future `value-transfer` CLI verb** for D6's mechanization (not
  required for the PoC).

> **Progressive disclosure as the solution to rendering same information
> at different levels of detail?**

**Yes — but with the three-axis framing from D2 made explicit at the
authoring API.** The eleven-fragment table in § 2 shows that single-axis
"depth" thinking would conflate three concerns:

- **INPUT-axis** (which sub-sections does THIS fragment emit at THIS
  embedding site?) — needed by 11 of 11 fragments.
- **OUTPUT-axis** (does the resulting doc render inline or split?) — needed
  by 4 of 11 (D1, D2, D7, D8/D9 wiki-tree-shaped).
- **INDEX-axis** (how deep does navigation expose the tree?) — needed by
  the same 4.

The substrate map confirms the OUTPUT axis is fully wired; only the INPUT
and INDEX axes need code in W-DOCS-1. **The four orthogonal axes
(multi-target output, ContentFragment, generated-insert, wiki-tree-with-INDEX)
together compose to express every cross-corpus duplication site in the
matrix.**

---

## Appendix A — fragment-to-canonical-doc cross-reference for `architect.config.ts`

When the wave lands, `architect.config.ts` will declare these eleven
cross-corpus fragments alongside the per-corpus ones. Sketch shape:

```ts
// docs-config/fragments/index.ts
export { fsmTransitionsFragment } from './fsm-transitions.fragment.js';
export { tagRegistryFragment } from './tag-registry.fragment.js';
export { fourTierLadderFragment } from './four-tier-ladder.fragment.js';
export { ruleBlockTemplateFragment } from './rule-block-template.fragment.js';
export { annotationOwnershipFragment } from './annotation-ownership.fragment.js';
export { valueTransferFragment } from './value-transfer.fragment.js';
export { projectConfigSchemaFragment } from './project-config-schema.fragment.js';
export { cliVerbCatalogFragment } from './cli-verb-catalog.fragment.js';
export { mcpToolCatalogFragment } from './mcp-tool-catalog.fragment.js';
export { canonicalProjectLayoutFragment } from './canonical-project-layout.fragment.js';
export { scopeValidateVerdictsFragment } from './scope-validate-verdicts.fragment.js';
```

Each fragment's `canonicalDoc` matches the assignment in § 3 above;
consumers across `docs-live/`, `.agents/skills/`, and (for the meta-PoC)
`.claude/skills/` embed them at the depths in § 4. The build-runner
invariants from PROPOSED-DESIGN § 3b (canonical uniqueness, canonical
depth consistency, link resolvability, ID uniqueness) catch every
miswiring at build time.

---

## Provenance

- All claims cross-checked against the five inventory reports written this
  session.
- Substrate code references verified by the substrate-map fork
  (`05-substrate.md` provides file:line citations).
- CLI / MCP surface verified by the `architect-data-api` skill bootstrap
  loaded at session start.
- No source files modified. Read-only analysis.

Output companion files (this is `/tmp/docgen-mapping/00-synthesis.md`):

- `01-skills.md` — 413 lines — skills + `_shared/` inventory
- `02-formal-spec.md` — 498 lines — formal-spec drift surfaces
- `03-docs.md` — 455 lines — manual docs + ARCHITECTURE.md decomposition
- `04-docs-sources.md` — 280 lines — preamble salvage analysis
- `05-substrate.md` — 280 lines — existing disclosure substrate code map
