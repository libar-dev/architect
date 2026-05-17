# Migration from `@libar-dev/architect` v1 (monolith) to v2 (split package family)

The v1.0.0-pre.3 monolith published a single `@libar-dev/architect` package that exposed every JS API plus 7 bins. v2 splits the runtime into five packages — `@libar-dev/architect-core`, `-projection`, `-guard`, `-cli`, `-mcp` — and reduces the meta package `@libar-dev/architect` to a **bin-only** re-export.

This document covers:

1. [Bin → package map](#bin-package-map) — all 7 bins remain reachable via the meta package
2. [JS API → package map](#js-api-package-map) — eight symbols whose names collide across splits
3. [Migration cheatsheet](#migration-cheatsheet) — concrete before/after for common imports

The v2 line publishes under the `next` dist-tag during the `2.0.0-pre.*` pre-release; the first stable release will graduate to `latest`.

---

## Bin → package map

All 7 bins remain reachable via the meta package `@libar-dev/architect` (now bin-only — no JS exports). Each bin is also directly reachable from the split that publishes it.

| Bin | Published by | Purpose |
|---|---|---|
| `architect` | `@libar-dev/architect-cli` | Pattern-graph query CLI: `overview`, `status`, `context`, `dep-tree`, `scope-validate`, `list`, `bundle`, etc. |
| `architect-generate` | `@libar-dev/architect-cli` | Doc generation; ~13 topics via `-g` flag (architecture, roadmap, requirements-executable, decisions, taxonomy, patterns, etc.) |
| `architect-guard` | `@libar-dev/architect-cli` | Process / FSM guard for pre-commit / pre-merge gates (`--staged`, `--all`, `--files`) |
| `architect-validate` | `@libar-dev/architect-cli` | Pattern annotation vs Gherkin feature cross-validation (`--dod`, `--anti-patterns`) |
| `architect-lint-steps` | `@libar-dev/architect-cli` | vitest-cucumber feature/step compatibility checks |
| `architect-lint-patterns` | `@libar-dev/architect-cli` | Pattern annotation quality lint |
| `architect-mcp` | `@libar-dev/architect-mcp` | MCP server (21 tools) — file watcher, pipeline session |

**Meta package:** `@libar-dev/architect` continues to expose all 7 bins via re-export. Consumers can install just the meta and get the full CLI surface. The meta package has **no JS exports** — `import … from '@libar-dev/architect'` will fail to resolve in v2.

---

## JS API → package map

In v1, these symbols were re-exported by the monolith `@libar-dev/architect`. In v2, the meta is bin-only, and **eight names refer to different types in different splits**. The monolith hid this latent collision; the split exposes it. Consumers must repoint imports to the owning split — there is no compatibility shim (no-BC doctrine).

| v1 import from `@libar-dev/architect` | v2 import path | Notes |
|---|---|---|
| `BusinessRule`, `BusinessRuleSchema` (extraction shape) | `@libar-dev/architect-core` | The Gherkin scanner / extraction shape: `{ name, description, scenarioCount, scenarioNames, tags }`. |
| `BusinessRule`, `BusinessRuleSchema` (projection-fragment shape) | `@libar-dev/architect-projection` | The projection fragment shape — 12 fields including `id`, `feature`, `ruleName`, `package`, `invariant`, `rationale`, `verifiedBy`, `pattern`, `phase`, `productArea`. **Different type with the same name** — v1 hid this collision because the monolith chose one. v2 forces an explicit choice. |
| `Deliverable`, `DeliverableSchema` | `@libar-dev/architect-projection` | Two definitions exist within `-projection`: `fragments/pattern-relations/supporting.ts` and `fragments/execution-context/deliverable.ts`. Use whichever matches the projection context. |
| `DeliverableManifest`, `DeliverableManifestSchema` | `@libar-dev/architect-projection` | Same dual-definition note as above. |
| `PhaseProgress`, `PhaseProgressSchema` | `@libar-dev/architect-projection` | From `fragments/delivery-reporting/phase-progress.ts`. |
| `StatusDistribution`, `StatusDistributionSchema` | `@libar-dev/architect-projection` | From `fragments/delivery-reporting/status-distribution.ts`. |
| `ProjectionError`, `ProjectionErrorCode` | `@libar-dev/architect-core` | From `core/src/package/`. Confusingly named — it's the package-resolver error type, not a projection-pipeline error. |

---

## Migration cheatsheet

```ts
// v1
import {
  buildPatternGraph,
  BusinessRule,
  BusinessRuleSchema,
} from '@libar-dev/architect';

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
