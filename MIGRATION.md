# Migration from `@libar-dev/architect` v1 (monolith) to v2 (split package family)

The v1.0.0-pre.3 monolith published a single `@libar-dev/architect` package that exposed every JS API plus 7 bins. v2 splits the runtime into five packages — `@libar-dev/architect-core`, `-projection`, `-guard`, `-cli`, `-mcp` — and reduces the meta package `@libar-dev/architect` to a **bin-only** re-export.

This document covers:

1. [Bin → package map](#bin-package-map) — all 7 bins remain reachable via the meta package
2. [JS API → package map](#js-api-package-map) — eight symbols whose names collide across splits
3. [Graph query API replacement](#graph-query-api-replacement) — direct migration from the removed facade
4. [Migration cheatsheet](#migration-cheatsheet) — concrete before/after for common imports

The v2 line publishes under the `next` dist-tag during the `2.0.0-pre.*` pre-release; the first stable release will graduate to `latest`.

---

## Bin → package map

All 7 bins remain reachable via the meta package `@libar-dev/architect` (now bin-only — no JS exports). Each bin is also directly reachable from the split that publishes it.

| Bin                       | Published by               | Purpose                                                                                                                                                                                     |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `architect`               | `@libar-dev/architect-cli` | Graph-handle CLI: `q '<js>'` + named demos + the `dangling` CI gate (ADR-014). Pattern-state tools live on MCP (`architect_overview`, `architect_dep_tree`, `architect_scope_validate`, …). |
| `architect-generate`      | `@libar-dev/architect-cli` | Doc generation; ~13 topics via `-g` flag (architecture, roadmap, requirements-executable, decisions, taxonomy, patterns, etc.)                                                              |
| `architect-guard`         | `@libar-dev/architect-cli` | Process / FSM guard for pre-commit / pre-merge gates (`--staged`, `--all`, `--files`)                                                                                                       |
| `architect-validate`      | `@libar-dev/architect-cli` | Pattern annotation vs Gherkin feature cross-validation (`--dod`, `--anti-patterns`)                                                                                                         |
| `architect-lint-steps`    | `@libar-dev/architect-cli` | vitest-cucumber feature/step compatibility checks                                                                                                                                           |
| `architect-lint-patterns` | `@libar-dev/architect-cli` | Pattern annotation quality lint                                                                                                                                                             |
| `architect-mcp`           | `@libar-dev/architect-mcp` | MCP server (21 tools) — file watcher, pipeline session                                                                                                                                      |

**Meta package:** `@libar-dev/architect` continues to expose all 7 bins via re-export. Consumers can install just the meta and get the full CLI surface. The meta package has **no JS exports** — `import … from '@libar-dev/architect'` will fail to resolve in v2.

---

## JS API → package map

In v1, these symbols were re-exported by the monolith `@libar-dev/architect`. In v2, the meta is bin-only, and **eight names refer to different types in different splits**. The monolith hid this latent collision; the split exposes it. Consumers must repoint imports to the owning split — there is no compatibility shim (no-BC doctrine).

| v1 import from `@libar-dev/architect`                            | v2 import path                    | Notes                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BusinessRule`, `BusinessRuleSchema` (extraction shape)          | `@libar-dev/architect-core`       | The Gherkin scanner / extraction shape: `{ name, description, scenarioCount, scenarioNames, tags }`.                                                                                                                                                                                               |
| `BusinessRule`, `BusinessRuleSchema` (projection-fragment shape) | `@libar-dev/architect-projection` | The projection fragment shape — 12 fields including `id`, `feature`, `ruleName`, `package`, `invariant`, `rationale`, `verifiedBy`, `pattern`, `phase`, `productArea`. **Different type with the same name** — v1 hid this collision because the monolith chose one. v2 forces an explicit choice. |
| `Deliverable`, `DeliverableSchema`                               | `@libar-dev/architect-projection` | Two definitions exist within `-projection`: `fragments/pattern-relations/supporting.ts` and `fragments/execution-context/deliverable.ts`. Use whichever matches the projection context.                                                                                                            |
| `DeliverableManifest`, `DeliverableManifestSchema`               | `@libar-dev/architect-projection` | Same dual-definition note as above.                                                                                                                                                                                                                                                                |
| `PhaseProgress`, `PhaseProgressSchema`                           | `@libar-dev/architect-projection` | From `fragments/delivery-reporting/phase-progress.ts`.                                                                                                                                                                                                                                             |
| `StatusDistribution`, `StatusDistributionSchema`                 | `@libar-dev/architect-projection` | From `fragments/delivery-reporting/status-distribution.ts`.                                                                                                                                                                                                                                        |
| `ProjectionError`, `ProjectionErrorCode`                         | `@libar-dev/architect-core`       | From `core/src/package/`. Confusingly named — it's the package-resolver error type, not a projection-pipeline error.                                                                                                                                                                               |

---

## Graph query API replacement

The v2 pre-release removes `PatternGraphAPI`, `createPatternGraphAPI`, the `g.api` handle property, and the `QueryResult` / success / error envelope helpers. This is a No-BC removal. There are no aliases, deprecations, or compatibility exports.

The replacement has three parts:

1. `@libar-dev/architect-core/graph` is the published pure contract. It exports the deeply frozen `Graph`, `createGraph`, Graph schemas and types, and trusted pure entry/spec/impact views.
2. The `architect q` handle exposes the complete canonical PatternGraph as `g.graph` and the four deterministic FSM operations as `g.fsm`.
3. Reusable algorithms that need a caller-supplied PatternGraph remain named pure exports from `@libar-dev/architect-core`, including `getDependencyContext`, `getRulesForPattern`, pattern helpers, decision resolution, architecture inspection, and inventory.

The CLI still owns source/config/filesystem/git composition. The core Graph subpath performs no IO and does not import the TypeScript walker.

### Handle migration

| Removed facade call                           | Direct replacement                                                                                                    |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `g.api.getStatusCounts()`                     | `g.graph.counts`                                                                                                      |
| `g.api.getPatternsByStatus(status)`           | `g.graph.byStatus[status]`                                                                                            |
| `g.api.getPatternsByNormalizedStatus(status)` | `g.graph.byNormalizedStatus[status]`                                                                                  |
| `g.api.getPattern(name)`                      | `g.pattern(name)` for the need-shaped node, or `g.graph.patterns.find(p => p.name === name)` for the canonical record |
| `g.api.getPatternParseFailure(name)`          | `g.graph.featureParseFailures?.find(f => f.patternName === name)`                                                     |
| `g.api.getPatternRelationships(name)`         | `g.graph.relationshipIndex[name]`                                                                                     |
| `g.api.getCurrentWork()`                      | `g.patterns.filter(p => p.status === "active")`                                                                       |
| `g.api.getRoadmapItems()`                     | `g.graph.byStatus.roadmap`                                                                                            |
| `g.api.getCompletedPatterns()`                | `g.graph.byStatus.completed`                                                                                          |
| `g.api.listPackages()`                        | `Object.keys(g.graph.archIndex?.byPackage ?? {}).sort()`                                                              |
| `g.api.isValidTransition(from, to)`           | `g.fsm.isValidTransition(from, to)`                                                                                   |
| `g.api.checkTransition(from, to)`             | `g.fsm.validateTransition(from, to)`                                                                                  |
| `g.api.getValidTransitionsFrom(status)`       | `g.fsm.getValidTransitionsFrom(status)`                                                                               |
| `g.api.getProtectionInfo(status)`             | `g.fsm.getProtectionSummary(status)`                                                                                  |

Thin filters, groupings, work lists, relationship selections, and transitive walks stay caller scripts over the exposed fields. They do not get replacement methods.

### Programmatic migration

```ts
import {
  createGraph,
  type MechanicalCore,
  type PatternGraph,
} from '@libar-dev/architect-core/graph';
import { getDependencyContext, getRulesForPattern } from '@libar-dev/architect-core';

const g = createGraph(patternGraph, mechanicalCore);

const counts = g.graph.counts;
const canStart = g.fsm.isValidTransition('roadmap', 'active');
const dependencies = getDependencyContext(g.graph, 'MyPattern');
const rules = getRulesForPattern(g.graph, 'MyPattern');
```

`createGraph` accepts already-built canonical and mechanical values and deep-freezes every reachable public result. Use the CLI `q` front door when you need the repository's live source/config IO rather than assembling those values yourself.

Facade methods returned `{ success, data, error, metadata }` envelopes. Graph fields, Graph accessors, and pure kernels return their values directly and throw or return `undefined` according to the named function's contract. Delete envelope branching instead of recreating it around the replacement.

---

## Migration cheatsheet

```ts
// v1
import { buildPatternGraph, BusinessRule, BusinessRuleSchema } from '@libar-dev/architect';

// v2 — extraction context (the most common use)
import { buildPatternGraph } from '@libar-dev/architect-core';
import type { BusinessRule } from '@libar-dev/architect-core';
import { BusinessRuleSchema } from '@libar-dev/architect-core';

// v2 — projection-fragment context
import type { BusinessRule } from '@libar-dev/architect-projection';
import { BusinessRuleSchema } from '@libar-dev/architect-projection';
```

The meta package `@libar-dev/architect` is **no longer importable as JS** — it's bin-only. Any v1 code that did `import ... from '@libar-dev/architect'` will fail to resolve. The migration is mechanical (repoint to the owning split), but unavoidable.

For consumer-facing usage patterns and the broader package taxonomy, see the [root README](./README.md) and the per-package READMEs.
