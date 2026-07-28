# Graph CLI

> **Deprecated:** `docs/` is the legacy manual-docs set, superseded by the generated docs in [`docs-live/`](../docs-live/INDEX.md). This file keeps only quick-start guidance for the `architect` bin's read surface.
>
> The retired verb CLI (24 pre-baked query verbs) was deleted by **ADR-014** (`architect/decisions/adr-014-agent-read-surface.feature`). Its replacement is the scriptable graph handle below; the operational guide is the **architect-graph-handle** skill (`.agents/skills/architect-graph-handle/SKILL.md`). The typed `architect_*` MCP tools (`architect_scope_validate`, `architect_bundle`, `architect_context`, `architect_handoff`, `architect_documentation`, …) are unchanged — the stable surface for burst-mode and Studio use.

---

## The q front door

```bash
pnpm architect:q '<js>'
```

Evaluates a JS expression (or statement body ending in `return`) with `g` — the live PatternGraph handle, built fresh from the working tree — in scope. Accessors return plain composable data, no envelopes.

```bash
pnpm architect:q 'g.api.getStatusCounts()'                            # status distribution
pnpm architect:q 'g.pattern("PatternGraphApi")'                       # one node: status, deps, files
pnpm architect:q 'g.findByConcept("taxonomy")'                        # concept → ranked patterns
pnpm architect:q 'g.byFile("packages/architect-core/src/index.ts")'   # file → owner + neighborhood
pnpm architect:q 'g.api.isValidTransition("roadmap","active")'        # deterministic FSM gate
```

The surface: `g.patterns`, `g.pattern(name)`, `g.fileToPattern(file)`, `g.findByConcept(q)`, `g.byFile(f)`, `g.bySymbol(s)`, `g.invariantsOf(x)`, `g.specsReverifying(xs)`, `g.blastRadius(files)`, `g.fanInCandidates()`, `g.graphDiff()`, `g.census()`, `g.driftFlags(fn)`, plus `g.api` (the canonical `PatternGraphAPI`: `getPattern`, `getStatusCounts`, `getCurrentWork`, `getDependencyContext`, `getRulesForPattern`, `isValidTransition`, `checkTransition`, `getPatternParseFailure`, …) and the raw shapes `g.authored` / `g.mech`.

## Named commands

```bash
pnpm architect:graph <cmd>
```

Runnable documentation over the handle: `census`, `diff`, `blast [ref]`, `fan-in`, `drift`, `maturity`, `find`, `file`, `symbol`, `invariants <Pattern>`, `specs [ref]`.

## The dangling gate (CI)

The one frozen machine contract, consumed by CI:

```bash
pnpm architect:graph dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict
```

Exit code `0` on success, `1` on failure (message on stderr).

## Reference

- **[architect-graph-handle skill](../.agents/skills/architect-graph-handle/SKILL.md)** — full surface, return shapes, recipes, decision guide.
- **ADR-014** (`architect/decisions/adr-014-agent-read-surface.feature`) — why the verb CLI is gone and what stayed frozen.
- **[Generated docs index](../docs-live/INDEX.md)** — regenerate with `pnpm docs:all`; [`docs-live/TAXONOMY.md`](../docs-live/TAXONOMY.md) is the canonical enumerated tag set.
