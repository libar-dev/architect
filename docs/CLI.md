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
pnpm architect:q 'g.graph.counts'                                     # status distribution
pnpm architect:q 'g.pattern("GraphHandle")'                            # one node: status, deps, files
pnpm architect:q 'g.findByConcept("taxonomy")'                        # concept → ranked patterns
pnpm architect:q 'g.byFile("packages/architect-core/src/index.ts")'   # file → owner + neighborhood
pnpm architect:q 'g.fsm.isValidTransition("roadmap","active")'        # deterministic FSM gate
```

The handle exposes `g.graph`, the complete deeply frozen PatternGraph; `g.fsm`, the four deterministic transition operations; need-shaped accessors (`g.patterns`, `g.pattern(name)`, `g.fileToPattern(file)`); trusted joins (`g.findByConcept`, `g.byFile`, `g.bySymbol`, `g.invariantsOf`, `g.specsReverifying`, `g.blastRadius`); curation helpers; and the raw `g.authored` / `g.mech` shapes. Accessors return plain data, not query envelopes.

Programmatic consumers import the frozen `Graph`, `createGraph`, schemas, types, and trusted pure views from `@libar-dev/architect-core/graph`. Named algorithms that operate on a caller-supplied PatternGraph, including `getDependencyContext` and `getRulesForPattern`, remain pure exports from `@libar-dev/architect-core`. Source, config, filesystem, and git IO remain composition-root concerns.

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
