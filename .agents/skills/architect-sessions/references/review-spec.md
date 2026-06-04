# Review (spec) — pre-implementation gap-finding

Find gaps in a spec **before** implementation so the implementer has a complete prompt. **Do not rewrite content.** Do not generate enriched session prompts. Output is a compact gap list.

> This is the **pre-implementation** review. To review **completed implementations** (verify value transfer + decide batched deletion), use [`review-implementation.md`](review-implementation.md). The two do not overlap — pick by lifecycle phase.

Doctrine depth (for judgment calls about Gherkin or pattern conventions): the optional Rule-block template + tier guidance in [`../../architect-base/references/rule-block-template.md`](../../architect-base/references/rule-block-template.md); the tier table in [`../../architect-base/references/four-tier-ladder.md`](../../architect-base/references/four-tier-ladder.md); the bipartite conventions + `*ExecutableTests` escape hatch in [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md).

## Gather context first

Know what "complete" means for _this_ spec before scanning for gaps:

1. **Tier** — idea/candidate (structural checklist below) or plan/design (`scope-validate` gate + full checklist)?
2. **Normative source** — what ADR / redesign / brief does the spec derive from? You'll check coverage against it.
3. **Scope of review** — one spec, or several concurrent ones that might collide on the same files?

## Pre-flight

Run the pre-flight from [`../../architect-data-api/SKILL.md`](../../architect-data-api/SKILL.md): `overview`, `scope-validate`, the review-mode `bundle`, `dep-tree`, `arch blocking`, `files --related`. The `scope-validate` verdict (PASS / WARN / BLOCKED) frames the rest. For pre-implementation shape review, also run `pnpm architect:query documentation design-review` — it draws the live pattern graph _including this not-yet-built spec_ as a component map (by-layer / by-package / by-theme), classified nodes annotated `Name (role · status)` (e.g. `MCPServer (service · completed)`; unbuilt specs render status-only `(candidate)` / `(roadmap)`), so you see how the planned pattern slots into the existing graph instead of grepping feature files.

**Tier note.** `scope-validate` accepts only `design` and `implement`. For idea/candidate reviews, skip the CLI gate and use the structural checklist below.

### Idea/candidate-tier structural checklist (no CLI verb)

- **File location matches maturity.** Idea → `architect/specs/ideas/`; candidate → `architect/specs/candidates/`. Mismatch is a gap.
- **Idea-tier six-tag baseline present** (`@architect`, `@architect-pattern`, `@architect-status`, `@architect-maturity:idea`, `@architect-product-area`, `@architect-parent`). The explicit `@architect-maturity:idea` is **required** at idea tier — it is the guard's idea-tier opt-in, so its absence (the file is not recognized as idea-tier) is a gap. Epic/slice swap `@architect-parent` for `@architect-level`. A candidate-tier spec normally has no explicit maturity (it derives to `idea` from `status:candidate`). The maturity gap to catch is a **stray `@architect-maturity:idea` on a non-idea-tier file** — it mis-gates the spec as idea-tier. Do **not** flag an explicit `@architect-maturity:plan` override (delivery track, valid per §04 "explicit always wins" + ADR-007) — that is permitted, not a gap.
- **Line budget honoured.** Idea ≤30 (warn-only); candidate 30-80. Over-budget = premature-promotion gap.
- **No deliverables / no phase/effort/priority/release tags at idea tier** = premature plan-tier-metadata gap.
- **Rules carry `**Invariant:**` only at idea tier** — adding `**Rationale:**`/`**Verified by:**` there is a gap.
- **Candidate carries `**Open Questions:**` + 1-2 happy-path scenarios.** Missing open-questions is the most common gap. Inventory with `pnpm architect:query open-questions [--parent <Epic>] [--format json]`.
- **No retroactive idea spec for shipped code** — if the pattern already has production code, the idea spec is the wrong artifact; flag it.

## The gap-finding checklist (plan/design tier)

1. **Normative source coverage.** Read the ADR/redesign/brief. Are all its types, constants, and constraints represented in the spec's deliverables? Grep for them in the referenced files.
2. **Deliverable path correctness.** Each `Background:` path must exist (or be one the spec explicitly creates). Check with `pnpm architect:query files <pattern>` + direct existence. A typo ships a broken implementation.
3. **Type reuse.** If a Zod schema / interface already exists in `packages/`, the spec should reference and reuse it, not redefine it.
4. **Dependency chain.** `pnpm architect:query dep-tree <pattern>` — anything blocking? `arch blocking` is the global view. A dependency that is `roadmap` and unimplemented means not-ready.
5. **Scope-validate state.** PASS = ready; WARN = recoverable miss; BLOCKED = upstream dependency or invariant violation.
6. **Implied file modifications.** Does the source imply changes the `Background:` table omits? Common miss: a new type in a shared package needing a barrel re-export.
7. **Edge cases vs scenarios.** For each Rule, is there both a happy-path and at least one error/boundary scenario?
8. **Stub completeness.** Does every architecturally-relevant pattern in the deliverables have a stub? (Stubs are for shape decisions, not trivial functions.)
9. **Overlap with concurrent specs.** Two specs in the same phase touching the same files is a sequencing hazard — surface it.
10. **Ephemeral readiness.** When implemented and deleted, will value transfer cleanly? Does every rule have an `**Invariant:**`? Does every decision have enough rationale to become a JSDoc annotation? A spec that won't transfer cleanly will leave debt.
11. **Graph fit (optional).** `pnpm architect:query documentation design-review` renders the in-scope spec status-annotated `(role · status)` in the live component graph (by-layer / by-package / by-theme); confirm its depends-on edges land in the expected layer/package cluster and no dependency is unexpectedly an unbuilt `(roadmap)` / `(candidate)` node.

## Output format (compact, no rewrites)

```
**Gaps found in <PatternName> design spec**

1. <gap>: <one-sentence description> — owner: <which deliverable>
2. <gap>: <one-sentence description> — owner: <which deliverable>
```

Found nothing? Say so in one sentence. Do not produce an elaborate "looks good" restatement.

## Anti-patterns (stop)

- **Rewriting the spec** — surface the gap; let the design author fix it.
- **Generating wrapper / enriched-prompt documents** — the spec is the prompt.
- **Implementing what's missing** — this is review; an unclear deliverable is the gap "deliverable unclear," not "I'll write it."
- **Reading source via Read/Glob/Grep before the CLI bootstrap** — `files` / `dep-tree` first.

## Do not

- Do not transition the FSM here.
- Do not delete the design spec — that's [`implement.md`](implement.md), after value transfer.
- Do not paraphrase the spec back as a summary — surface gaps only.

**Next session:** route gap fixes back to [`design.md`](design.md); when `scope-validate <pattern> implement` is PASS, proceed to [`implement.md`](implement.md).
