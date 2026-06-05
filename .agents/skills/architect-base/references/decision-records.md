# Decision Records (reference)

How architectural decisions are recorded, what may and may not go in a record, and the two very different things the word "decisions" names in this repo. The summary in [`../SKILL.md`](../SKILL.md) §7 is the always-loaded version; this is the depth.

## ADRs / PDRs — permanent, decisions-only

`architect/decisions/` holds Architecture / Product Decision Records as `.feature` records. They are **permanent** and carry **only durable, non-execution-related facts**:

**Belongs in a record:**

- The decision itself, stated plainly.
- The rationale — why this option over the alternatives.
- The durable constraint the decision imposes (the invariant future work must respect).
- References to the patterns / ADRs it currently **depends on** — live edges only, never a "supersedes" / "replaces" marker. During bootstrap the replaced record is deleted in place; "what did we replace?" is a `git log` question, not a read-model edge.

**Never belongs in a record:**

- Status, work-in-progress, "currently blocked on X".
- ETAs, sprint/phase scheduling, who is doing what this week.
- Step-by-step implementation plans or code snippets.

That line — durable decision vs operational worklog — is the whole point. A record that accretes temporal context rots the moment the work moves on, and it poisons every projection (release notes, architecture docs) that reads it as ground truth.

**Amendment rule.** _Post-1.0:_ a decision is amended by authoring a **new** ADR that supersedes the old one — never by editing the original; the history of _why we changed our mind_ is itself durable. _**During bootstrap**_ (pre-1.0, live-state — the standing context; see the repo `CLAUDE.md` / `AGENTS.md` bootstrap doctrine): consolidate **in place** — edit / slim / delete the record directly, with **no supersession metadata** (no `@architect-adr-supersedes` / `adr-superseded-by` tags, no "replaces" / "superseded-by" prose — that is read-model history the bootstrap excludes; the replaced record is deleted, not linked). An amend-chain manufactures exactly the history the read model is built to exclude, so a "new superseding ADR" for a record nobody has built on yet is residue, not provenance. The deliberate change of mind is still recorded on its own terms; what is dropped is the append-only scaffolding around it.

## Read records through the Data API, not from memory

The records are the authority; your recollection is anecdote (see [`../SKILL.md`](../SKILL.md) §"Anti-anecdote"). Read them:

```bash
pnpm architect:query documentation decisions          # the projected decision set
pnpm architect:query pattern ADR006SingleReadModelArchitecture   # a specific record
pnpm architect:query documentation architecture       # ADRs as theme/layer slices (by-theme / layered lenses)
```

ADRs also carry `@architect-adr-theme` / `@architect-adr-layer` classification, so `documentation architecture` renders them grouped into named theme clusters (e.g. `Theme: projections` = ADR-005/006/009/010) with their depends-on/see-also web, and `documentation design-review` carries the same by-theme / by-layer lenses over working-state-inclusive patterns. **"Which decisions cluster around projections / persistence / taxonomy?"** is one lens query — never grep `architect/decisions/` for it.

## The load-bearing set (and the nuance each is most often gotten wrong on)

- **ADR-003 — Source-First Pattern Architecture.** TypeScript source owns pattern identity; `@architect-implements` (authored on the test `.feature`) is the _primary_ reverse-traceability edge, distinct from derived reverse edges (`usedBy` / `enables`) which you never hand-author.
- **ADR-005 — Codec / Renderer Separation.** The `PatternGraph` is the sole codec/renderer input.
- **ADR-006 — Single Read Model.** The read model is the **`PatternGraph`** (assembled graph + `relationshipIndex` + pre-computed views), **not** `ExtractedPattern` (which is the canonical per-pattern _record contract_ the graph is built from). Feature consumers depend on the `PatternGraph`; direct `scanner/` / `extractor/` imports are sanctioned only in graph-building pipeline code.
- **ADR-007 — Coordinated Taxonomy Redesign.** The three orthogonal axes + the closed role enum — see [`./taxonomy.md`](./taxonomy.md).
- **ADR-009 — Projection Trust Boundary.** `parseAndProject*` is the raw-input trust boundary for external projection callers, parsed once.

## Not the same as a campaign `DECISIONS.md`

Two artifacts share the word "decisions" and have **opposite lifetimes** — keep them apart:

|            | `architect/decisions/` (ADRs)                                       | `.pr-coordination/DECISIONS.md`             |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------- |
| Lifetime   | **Permanent**                                                       | **Ephemeral** (one campaign)                |
| Holds      | Durable architectural decisions + rationale                         | Judgment-calls a campaign needs before code |
| Resolution | Consolidated in place (bootstrap); superseded by a new ADR post-1.0 | Resolved-with-commit-sha, then archived     |
| Audience   | All future work, all projections                                    | The workers in one campaign                 |

Filing durable architecture in the campaign log loses it when the campaign archives; filing campaign bookkeeping in an ADR poisons the permanent record. The campaign-log shape (tight `Question / Options / Recommendation / Consumed-by / Status` entries) lives in [`../../architect-refactor-session/references/multi-session-coordination.md`](../../architect-refactor-session/references/multi-session-coordination.md).

## See also

- [`../SKILL.md`](../SKILL.md) §7 — the always-loaded summary and the key-ADR list.
- [`./taxonomy.md`](./taxonomy.md) — ADR-007's classification axes in full.
