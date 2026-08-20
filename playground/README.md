# playground — scratch home + experiment findings

**The handle graduated (ADR-014).** The two-surface graph handle that was prototyped here
now lives in the product: pure frozen contract at `@libar-dev/architect-core/graph`
(core schemas · trusted views · Graph), live IO composition in `architect-cli`, and the front door at the `architect` bin
(`pnpm architect:q '<js>'` / `pnpm architect:graph <cmd>`), regression coverage at
`tests/features/cli/graph-handle.feature`. The operational guide is the
**`architect-graph-handle` skill** (`.agents/skills/architect-graph-handle/`), including the
recipe set under its `references/`.

What remains here:

- **`scratch/`** (gitignored) — the multi-line ad-hoc script home. Drop a cut here and pipe
  it through the front door:

  ```bash
  pnpm architect:q < playground/scratch/my-cut.ts
  ```

- **`CONTEXT.md`** — the experiment findings that proved the direction (the two-surface
  model, curation-not-drift, the context-efficiency numbers). Durable working-state notes;
  the decision itself is `architect/decisions/adr-014-agent-read-surface.feature`.
- **`REVIEW-NOTES.md`** — the review record + still-open future-session scope (F1 cohort
  promotion, the maturity⟺provenance axis split, the annotation push, deletionReady).
- **`ANNOTATION-FLEET-FINDINGS.md`** — the annotation-campaign findings + verified authoring
  rules (the `@architect` marker tag, comma-form `@architect-uses`).

Prune each findings doc as its content graduates to code, an ADR, or a skill (live-state
doctrine — no dead context).
