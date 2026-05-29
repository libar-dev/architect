# Architect package family — PRD index & subtraction view

A one-page map of what the six packages _are now_ — recorded from code, not from the (disposable) annotations. Per-package detail lives in each `packages/<pkg>/PRD.md`. This view is direction-agnostic: it serves both the loop-closing MVP for this instance and the types-primary / live-HTML greenfield reimagining.

## The family (strictly acyclic)

```
architect-core            ← no intra-repo deps — the read model
  ├─ architect-projection  ← core                          fragments / projections / renderers
  ├─ architect-guard       ← core                          FSM gates / linters
  ├─ architect-cli         ← core, projection, guard       verbs + bins
  └─ architect-mcp         ← core, projection              MCP tools + watcher
architect (meta)          ← install-deps all; re-exposes 7 bins (6 → cli, 1 → mcp)
```

## Scale & subtraction (measured from code)

| Package        | Files | ~LOC   | Patterns | Public surface                                                                                    | Deletion-candidate (cut lens)                                                                                            |
| -------------- | ----- | ------ | -------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **core**       | ~106  | ~12.5k | ~36      | ~200-symbol barrel; read-api, Zod schemas, FSM rules, taxonomy, scan→extract→merge→graph pipeline | small — `config/presentation-contracts.ts` stranded in the read-model root + a dead `markdown-parser` cluster (~240 LOC) |
| **projection** | 153   | ~18k   | 121      | 44 fragments · 51 `projectX` · 14 `parseAndProjectX` · 13-docType star · 4 renderers              | **~55–60%** — the documentType star (~2k LOC) + `render-markdown.ts` (2,544 LOC) special-casing                          |
| **guard**      | 38    | ~9.2k  | 21       | process guard, DoD, dangling-baseline, git helpers, FSM (imported from core), lints               | ~2k — idea-tier soft lint (447, warning-only), step-lint (~1.4k), anti-patterns                                          |
| **cli**        | thin  | small  | 8        | 6 bins (4 are 1-line guard re-exports); 24 verbs → ~38 surfaces                                   | **29 of 33** read/slice verbs — derivable from one naked emission                                                        |
| **mcp**        | 7     | ~1.6k  | 9        | 21 tools, pipeline session, chokidar live-rebuild                                                 | **18 of 21** read tools — same naked-emission logic; + `SectionedDocument` builders leaked into the transport            |
| **meta/shell** | —     | —      | —        | 7 bin shims, root scripts, `architect.config.ts`, shared tsconfig base                            | 5 per-docType `docs:*` scripts (subsumed by `docs:all`)                                                                  |

## What survives — the irreducible core (same for the MVP loop _and_ the greenfield)

- **core** read model: scan→extract→merge→`PatternGraph`, schemas, FSM, taxonomy, `createPatternGraphAPI()`.
- **projection**: the ADR-010 helpers (`projectSingle` / `buildGroupedRoutedBundle`), the read-model→fragment skeleton, and the **UI / JSON renderers** (what Studio renders today / what a typed live-HTML emission needs tomorrow).
- **guard**: the deterministic gates only — FSM transition validation, DoD, dangling-reference.
- the **thin cli/mcp composition** + ~4 gate surfaces: `scope-validate`, `query isValidTransition`, `arch dangling`, `handoff`.
- **one naked typed emission** — and `arch graph` is already approximately that.

## The headline

Two cuts dominate, and they converge on the same answer:

1. **The docgen documentType star + the markdown renderer** (~10k LOC; the heaviest 55–60% of the heaviest package). Markdown is the minor sink; the agent emission and Studio / live-HTML are the real ones.
2. **The verb/tool layer** (CLI 29/33, MCP 18/21) — collapses to one naked typed emission + a handful of gates.

Remove those (plus the non-gating lints and the stranded core/shell bits) and roughly a **third of the family's LOC and the majority of its API surface** goes — while the surviving core is exactly what both the loop-closing MVP and the types-primary/live-HTML greenfield need. The direction can stay undecided; the keep-set does not.

## Drift corrections surfaced while mapping (recorded-from-code beat the docs)

- Root `package.json` has **no** `pkg:*` or `ci:architect:*` script families — AGENTS.md/CLAUDE.md overstate the script surface.
- `architect-lint-patterns` bin may be **dangling** — no wired root-script entrypoint; confirm it's reached by the guard pipeline.
- `architect-mcp` has **no** `architect-guard` dependency (core + projection only); guard/FSM is reached indirectly via `projectScopeReadinessReport`.
- `pnpm -s architect:query list --package <pkg>` returned empty — consistent with the disposable annotations; all inventory was taken from code.
