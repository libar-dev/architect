# Worker preamble — every session pins this

Every `sessions/NN-*.md` prompt inherits these rules. Read this file first.

## 1. Mandatory skill loading (do this before anything else)

Two skills are **mandatory** and must be loaded at session start:

- **`architect-base`** — the vocabulary: PatternGraph, tags, FSM, tiers, ADRs, the
  annotation-ownership + value-transfer doctrine.
- **`architect-data-api`** — the canonical query surface (`pnpm architect:query`).

Also load the session-shape skill for the work at hand:

- **`architect-refactor-session`** — for additive annotation enrichment of shipped
  code (this campaign's default). Its coordination doctrine lives in
  `architect-refactor-session/references/multi-session-coordination.md`.
- **`architect-sessions`** — for any spec-driven session (idea/candidate authoring,
  design, implement, review-spec, review-implementation, handoff). Per-session
  execution detail lives behind progressive disclosure in
  `architect-sessions/references/`.

Doctrine depth (the former `_shared/` kernel) now lives under
`architect-base/references/` (taxonomy, four-tier-ladder, fsm-transitions,
annotation-ownership, spec-pattern-relationships, rule-block-template,
decision-records). When a skill body and the **live CLI output** disagree, the
CLI wins (per `architect-base` §"Anti-anecdote").

## 2. API-first — this is the whole point of the campaign

The reason this campaign exists is so agents can **use the Data API instead of
grepping** to understand the repo. So model that behaviour: practice the API
extensively.

**For any question about pattern STATE, always use the API — never grep/Read to learn it:**

```bash
pnpm architect:query overview                      # start here, every session
pnpm architect:query bundle <Pattern> --format json   # the default pre-flight
pnpm architect:query pattern <Pattern>             # full detail
pnpm architect:query dep-tree <Pattern>            # dependency chain
pnpm architect:query arch neighborhood <Pattern>   # local subgraph
pnpm architect:query arch orphans                  # the campaign's progress metric
pnpm architect:query arch bounded-context <name>   # contents of a context
pnpm architect:query search <fragment>             # locate by name fragment
```

Reaching for `grep`/`Read` to answer "what's the status / deps / role of X?" is the
**grep-first anti-pattern** this campaign is killing. Stop and use a verb.

**The ONE legitimate use of code-reading in this campaign:** verifying the concrete
**import facts** needed to author a correct `@architect-uses` edge — i.e. _"does
this file actually import that symbol?"_ That fact is not yet in the graph (it's
what we're adding), so `grep`/`Read` on the specific file is correct and required.
Never author an edge you have not confirmed against the real import. A
plausible-but-false edge is worse than a missing one — it lies to every future query.

## 3. The six universal rules (floor for every session)

1. **Gates are non-negotiable** — run the full sequence in `EXECUTION-PLAN.md §6`
   (mirrored in architect-base §6 / CLAUDE.md) before any commit/handoff; a failing gate
   is stop-and-surface, never `--no-verify`.
2. **Capture decisions before code** — anything needing judgment goes to
   `DECISIONS.md` before the edit that depends on it.
3. **Stage explicit files** — never `git add -A` on this branch.
4. **Scope discipline** — if investigation surfaces extra scope, classify
   (same-root-cause → inline; different → defer to `DECISIONS.md` or a new session);
   never land a surface-only commit.
5. **Incomplete scope is next-session input** — record it, don't silently absorb it.
6. **Append a tight entry** to `SESSION-REPORTS-AND-LEARNINGS.md` at session end
   (< 20 lines): commit sha, scope discovered, rules for next session.

## 4. Annotation method (this campaign)

- Additive `.ts` JSDoc only. Reverse edges (`usedBy`/`enables`) derive from
  `@architect-uses` — never author them directly.
- `@architect-uses A, B` — **space-separated, no colon**. `@architect-role:` /
  `@architect-bounded-context:` use a colon. Do not mix.
- Touching `completed` patterns for edge-only enrichment needs **no**
  `@architect-unlock-reason` (D-6). The process guard is the arbiter.
- No-BC: no `@ts-ignore`, `eslint-disable`, `@deprecated`, compat aliases.
