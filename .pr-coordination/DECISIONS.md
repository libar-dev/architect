# Decisions — questions that need human judgment

> **Campaign-ephemeral, durable facts only.** This log holds the judgment-calls
> one campaign needed before code — `Question / Options / Recommendation /
Status (resolved-with-sha)` — then archived at campaign close. Keep entries
> tight: implementation detail and execution narrative belong in the consuming
> session prompt, `SESSION-REPORTS-AND-LEARNINGS.md`, or the commit body —
> **not here**. This is the _opposite_ of a durable ADR (`architect/decisions/`,
> permanent); see `.agents/skills/architect-base/references/decision-records.md`.
>
> **Resolved bodies archived** (2026-05-26) → [`archive/DECISIONS-resolved.md`](archive/DECISIONS-resolved.md).
> The standing rules they encode are distilled in the digest below; all
> campaign decisions are now resolved (D-4 closed 2026-05-26).

## Key durable decisions (standing rules future work must respect)

- **D-3** — un-patterned shipped abstractions get a code-originated `.ts` `@architect-pattern` (approve each candidate).
- **D-6** — additive `@architect-uses` on a `completed` pattern needs no `@architect-unlock-reason` (the guard is the arbiter).
- **D-7** — de-orphan fragments via the producer (`<X>Projection uses <X>`), never the re-export barrel (that inverts the dependency).
- **D-8** — `@architect-uses` is ONE comma-separated line; a second line is silently dropped. Read back via the Data API after authoring.
- **D-10** — adding `@architect-implements` to a `completed` test spec needs an `@architect-unlock-reason` (≥10 meaningful chars).
- **D-11** — producerless grouping barrels use barrel→submodule edges (GitModule precedent); fragment barrels with a producer use D-7.
- **D-12** — a `runCommand` CLI test `@architect-implements` the command's 1:1 production pattern (verify the command string).
- **D-15** — the component view filters test-feature patterns by **source path** (`tests/features/`); `implementsPatterns` is NOT a test discriminator (production sub-modules implement barrels). Grounded in value-transfer: `role`/`bounded-context` are production-owned — tag production, never mass-tag tests.
- **D-16 / D-18** — component & architecture-diagram views are **production-only**: exclude test features, decision records (`architect/decisions/`), and all working-state under `architect/`.
- **D-19** — architecture diagrams draw only **forward** dependency edges (`depends-on`/`uses` collapsed to one arrow; keep `see-also`; drop the derived `enables`). `enables`/`usedBy` are purely computed, never authored — absent from the directive vocabulary + `ExtractedPattern` fields.
- **D-21** — skills = `architect-base` (+refs), `architect-data-api`, `architect-sessions` (+refs), `architect-refactor-session` (+refs), `omo-plan-author`.
- **D-23** — `architect-sessions` is **mandatory**; `architect-refactor-session` stays **unadvertised** (the transitional non-spec-driven carve-out — still loads via its skill-description routing).

> Read-surface disclosure vocabulary (D-17): read verbs use `ContentRichness`
> (`name-only…full`), not the progressive level — see `HUD-IDEATION.md`.

- **WS-5** — `package` is resolved into `ArchIndex.byPackage` at `transformToPatternGraph()` time (derived from `pattern.source.file`, not annotated — implements ADR-006); the read API serves it cheaply via the `byPackage` index. No `@architect-package` tag is authored or extracted; package identity is infrastructure, not annotation.

## Open

None — all campaign decisions (D-1–D-23) are resolved. Full bodies → [`archive/DECISIONS-resolved.md`](archive/DECISIONS-resolved.md); the standing rules are distilled in the digest above. (D-4 — fragment-union light model — resolved 2026-05-26: shipped in WS-1.)
