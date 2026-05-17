# Pre-W-DOCS-1 cleanup — record of work landed

> **Captured:** 2026-05-17, immediately after the pre-W-DOCS-1 debt cleanup
> landed on `campaign/docs-and-skills-consolidation`.
>
> **Purpose:** record only. This file documents what shipped during the
> substrate cleanup so the next session can confirm baseline state without
> re-reading the cleanup plan. It does **not** prescribe what the next
> session should do — that's owned by `architect-session-router` against
> the research agendas already in this folder.

---

## What landed

The plan in `pre-w-docs-1-debt-cleanup.md` executed in full: 7 thematic
commits + 1 doctrine revert + 1 prettier drift fix.

| Commit    | Items   | Scope                                                      |
| --------- | ------- | ---------------------------------------------------------- |
| `882c189` | 1       | Test fixup: GUARD path + CLI help footer                   |
| `4f6a171` | 2       | Repo-wide Prettier sweep (317 files)                       |
| `fea0383` | 3-6, 11 | Projection polish (WHY comment, helpers, narrowing)        |
| `c95517c` | 8       | Drop defensive proxy method rebinding                      |
| `2864898` | 8       | Fixup for `c95517c`                                        |
| `aae1993` | 7       | Rename `EmbeddedDeliverable*Schema`                        |
| `f7f4e30` | 9       | Invert `resolveInvocationDir` precedence (cwd-first)       |
| `691da3c` | 10      | Retire `@architect-usecase` (net taxonomy: −1 tag)         |
| `1833126` | revert  | Drop operational PDR-002 + ADR-010 per maintainer doctrine |
| `37ac815` | drift   | Prettier follow-up on render-markdown.ts                   |

**Branch state:** `campaign/docs-and-skills-consolidation` is at
release-candidate state. Full gate (lint + typecheck + test + dogfood +
validate:all + guard:no-suppressions + format:check) was green when each
commit landed.

**Doctrine reinforcement** (from `1833126`): decision records
(`ADR-*`, `PDR-*`) are reserved for durable doctrine, not operational
changes. Bug-fix rationale lives in the commit message + the regression
test; taxonomy retirement consistent with prior shrinks doesn't need
ceremony. Useful when the next session decides what does/doesn't deserve
a decision record.

---

## What this folder contains, by maturity

The next session's entry point is `architect-session-router` against
whichever artifact below is the current research-finalization target.

**Research substrate** (rich; primary input for plan-tier work):

- `docgen-mapping/00-synthesis.md` — cross-corpus duplication map; 11
  cross-corpus fragments identified, canonical owners assigned, wave
  re-sequencing implied for W-DOCS-2 / W-DOCS-5
- `docgen-mapping/01-skills.md` — `.agents/skills/` + `_shared/` inventory
- `docgen-mapping/02-formal-spec.md` — formal-spec drift surfaces
- `docgen-mapping/03-docs.md` — `docs/` decomposition + ARCHITECTURE.md
- `docgen-mapping/04-docs-sources.md` — preamble salvage analysis
- `docgen-mapping/05-substrate.md` — existing disclosure substrate code map

**Ratified design context** (treat as source of truth where it overlaps
the research):

- `DECISIONS.md` — D1-D12 ratified 2026-05-17. D4'/D10/D12 frame the
  meta-self-documentation PoC and the design-from-target methodology.
- `PROPOSED-DESIGN.md` § 7 (wave breakdown), § 10 (wiki-index extension),
  § 11 (PoC scope).

**Pre-research background** (read only if a specific decision feels
under-motivated):

- `README.md`, `DEEP-DIVE.md`, `INVENTORY.md`,
  `architect-v2-breaking-changes-aggregate.md`

**Ideation specs** (minimal placeholders — likely re-shaped before they
enter the pattern graph):

- `IDEATION-SPECS.md` + `ideation-specs/*.feature`

**Historical** (audit only; do not re-execute):

- `pre-w-docs-1-debt-cleanup.md` — the plan this record closes out
- `PRE-WDOCS-READINESS.md` — pre-cleanup state; § 0 "Resolved" header
  maps each open item to its commit

---

## Substrate primitives the docs campaign will build on

Verified clean as of the cleanup commits. Listed so the next session can
confirm without re-running the survey:

- 4-axis documentation-type registry (`packages/architect-projection/src/projections/documentation-composition/documentation-type-registry.*.ts`)
- Markdown renderer dispatch with compile-time exhaustiveness (`packages/architect-projection/src/renderers/_shared/dispatch.ts:20-22`)
- Centralized route-id parsing (`packages/architect-projection/src/routing/route-id.ts:63-111`)
- `isPlainObject` + lint guard (single source + `no-restricted-syntax` rule)
- Perf gate with real ratchet `min(hard, baseline × 1.5)` (`packages/architect-projection/tests/perf/compare-baseline.mjs`)
- `parseMarkdownToBlocks` (preamble foundation, already exported from core)
- `extractShapes` + `discoverTaggedShapes` (already walks JSDoc for `@architect-extract-shapes`)
- `presentation-contracts.ts` schema present but no consumer — re-wiring is W-DOCS-1 work
- `resolveInvocationDir` is now cwd-first in both `architect-cli` and `architect-mcp` (embedding via `execFile({ cwd })` works correctly — relevant for `architect-generate` runner integration)

---

## Cross-references

- `AGENTS.md` § Session bootstrap — kernel skill load order
- `.claude/skills/architect-session-router/SKILL.md` — intent detection
  and downstream skill routing for the docs campaign sessions
- `pre-w-docs-1-debt-cleanup.md` — full plan including verification gates
  per commit
