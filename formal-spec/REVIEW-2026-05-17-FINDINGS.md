# Formal-Spec Review — 2026-05-17 Findings

> Session: review every claim in `formal-spec/*.md` against code/truth/facts and make
> fixes. Out of scope: cross-document consolidation, dedup against `architect/`,
> `docs/`, or `docs-sources/`.

This document records (a) what was changed and (b) what remains open. It is itself a
scratch/audit artifact — delete it once the action items are resolved or rolled into a
proper CHANGELOG entry for 0.2.1.

## Ground truth used

All "truth" checks against the live repo via:

- `pnpm architect:query overview` — 260 delivery patterns (114 completed, 120 active, 26 roadmap), 8 candidates
- `pnpm architect:query rules --count` — 347 rules
- `pnpm architect:query taxonomy` — canonical authored tag set
- `packages/architect-core/src/taxonomy/*.ts` — enum source of truth
  (`status-values.ts`, `arch-layer-values.ts`, `maturity-values.ts`,
  `registry-builder.ts`)
- `packages/architect-mcp/src/tool-metadata.ts` — 21 MCP tool names
- `packages/architect-cli/src/cli/pattern-graph-cli.ts --help` — 22 CLI subcommands
- `architect/decisions/` — 9 ADRs+PDRs

## Fixes applied in this review

### 1. Version normalization

- All file headers now read `Architect Spec v0.2.0` (was a mix of `v0.1.0` and
  `v0.2.0`).
- `formal-spec/package.json` version bumped `0.1.0` → `0.2.0`.
- `01-conformance.md` body "current version is 0.1.0" → "0.2.0 (Draft)".

### 2. Broken import paths

- `import { … } from '@libar-dev/architect/config'` → `from '@libar-dev/architect-core'`
  in §11 (two locations) and Appendix A Example 7. The meta package is bin-only
  post-W1 (see repo `REMAINING-WORK.md`); the old import path no longer resolves.

### 3. Reference-implementation description

- README §"Relationship to @libar-dev/architect" rewritten to reflect the post-split
  package family (5 splits + bin-only meta) with the correct CLI/MCP counts
  (22 subcommands, 21 tools).

### 4. FSM/state wording

- §00 "Four states (roadmap → active → completed, with deferred as an escape hatch)"
  → "Five status values across two tracks — candidate (refinement) and
  roadmap → active → completed with deferred (delivery)".
- §10 `status` field type now lists all five values (was missing `candidate`).

### 5. Tag drift — depends-on → uses, etc.

- `@architect-depends-on` replaced with `@architect-uses` in §00, §01, §03 (4
  locations), §05 example, §07 stub example, §08 example, §09 scope-validate doc,
  §10 relationships table, Appendix A Examples 3 and 6.
- §03 ordering convention rewritten to use only v0.2.0 canonical tags
  (gate / pattern / status / product-area / uses / see-also / bounded-context /
  arch-layer / role / level / parent), with an informative note pointing to the
  removed tags.
- §04 tag registry: every group with removed tags now carries a "Not in v0.2.0
  canonical taxonomy" callout and the table is annotated with `Removed — custom`.
  Groups affected: Planning (Group 3), Product & Business (Group 5), Release
  (Group 10), Discovery (Group 12), parts of Relationships (Group 4), Hierarchy
  (Group 7), Stub-Specific (Group 9), Process Enforcement (Group 11).
- §04 tag count summary rewritten: ~22 authored + gate + 3 aggregation ≈ 26
  canonical tags (was claimed total `50`).
- §10 archLayer type now `'domain' | 'application' | 'infrastructure'` (was 4 values
  including the non-existent `presentation`). Role values updated to the canonical
  8 from `taxonomy/registry-builder.ts`.

### 6. Pattern Graph fields

- §10 removed/relocated the following fields that don't exist in
  `@libar-dev/architect-core`:
  - `phase`, `priority`, `effort`, `effortActual`, `quarter`, `team`, `risk`,
    `workflow` (status block)
  - `dependsOn`, `enables`, `apiRef` (relationships) — replaced with the four
    authored relationship fields plus the two derived reverse edges
    (`usedBy`, `implementedBy`)
  - `businessValue`, `userRole`, `constraints` (Product & Business block) —
    removed
  - `discoveredGaps`, `discoveredImprovements`, `discoveredRisks`,
    `discoveredLearnings` (Discovery block) — removed
- Added `maturity` and `unlockReason` fields that genuinely exist.

### 7. Live Documentation API

- §12 rewritten to describe the single shipped tool `architect_documentation`
  (was three fictional tools `architect_doc`, `architect_doc_detail`,
  `architect_doc_types`). Parameter set updated to the real schema
  (`documentType`, `disclosure`, `filter`).
- Cache lifecycle table and security section updated to match the real tool name
  and parameter set.

### 8. Soft / unsourced claims

- §00 dropped the "148:1 compression" marketing line (no source in code).
- README metrics table reframed: the "With Spec Format" column is now explicitly
  labelled "reported peak across the two codebases" and a note follows reminding
  readers that the current dogfood repo is much smaller.

### 9. Dead / informative path references

- §02, §03, §11: `architect/tag-taxonomy.md` reframed from "MUST exist" to
  "OPTIONAL informative document". The configuration + `architect:query taxonomy`
  are the source of truth; no such file exists in the reference repo.
- README CHANGELOG `packages/architect-claude-plugin/MIGRATION.md` reference
  reframed as historical (the path lived in the studio repo; the equivalent
  document will live in this repo's `MIGRATION.md` at `2.0.0-pre.1` per Wave 4 of
  the repo `REMAINING-WORK.md`).

## Open items (NOT fixed in this review)

These are deliberate non-fixes — flag them for a follow-up pass.

### O-1. CHANGELOG version header

`README.md` has both a `0.2.1 (Draft)` and a `0.2.0 (Draft)` CHANGELOG section, but
the file-header versions and `package.json` say `0.2.0`. The `0.2.1` entry lists
breaking taxonomy removals that this review has now reflected in the body of the
spec.

Recommendation: either (a) bump `package.json` and all headers to `0.2.1` and treat
this review's removals as the formal `0.2.1` release, or (b) collapse the `0.2.1`
CHANGELOG entry into `0.2.0`. Not done here because either choice is editorial.

### O-2. Examples still describe a studio-shaped project

The Appendix-A and §05 / §07 examples still describe a "desktop app" / "Studio"
problem domain (project-connection, dark-mode, IPC bridge to Electron, etc.). This
is reasonable for an examples appendix but somewhat awkward now that the only
reference codebase is the architect package family itself. Out of scope per the
session instructions (avoid major reorganization).

### O-3. Aggregation tags not described in §04

The canonical taxonomy includes three aggregation tags — `@architect-overview`,
`@architect-decision`, `@architect-intro` — that target generated docs. §04 doesn't
have a dedicated group for them. Added them to the summary table; a fuller "Group
13: Aggregation" section would be cleaner.

### O-4. `@architect-maturity` introduction

`@architect-maturity` is discussed in §04 (Core Identity row + DEFAULT_MATURITY_BY_STATUS
subsection) and §08 (Idea Tier), but its enum is reflected only in the §10 status
block patch and in §04. A "Maturity vs Status" section near the top of §04 or §08
would help readers understand the auto-defaulting contract.

### O-5. Conformance §01 level requirements still reference removed tags

§01 Level 2 list (item 5) requires `@acceptance-criteria` + `@happy-path` / `@validation`
/ `@edge-case` on every scenario. Verified — these are real conventions, no fix
needed.

§01 Level 3 list (item 3) references "scope-creep" and "completed-protection" and
"invalid-status-transition" ProcessGuard rules. The repo `packages/architect-guard`
has additional rules (and may have renamed some). I did not enumerate each rule
ID against the §09 "six ProcessGuard rules" list — that should be a focused
review.

### O-6. §09 ProcessGuard rule enumeration

The spec lists six concrete ProcessGuard rules (Completed-Protection, Scope-Creep
Detection, Invalid-Status-Transition, Session-Scope, Session-Excluded,
Deliverable-Removed). I did not enumerate each rule against the actual
`packages/architect-guard/src/lint/process-guard/` source. The blocker view in
`pnpm architect:query arch blocking` does name FSM-related blocker checks but
the precise 6 vs N count was not verified. Recommend a focused pass that aligns
this list with the source.

### O-7. §08 line-budget claims

§08 idea-tier section claims "≤30 lines (warn-only soft budget — there is no
minimum)" and candidate-tier 30–80 lines. These match the agent-skills shared
references but the actual validator threshold should be cross-checked against
`packages/architect-guard/src/validation/`.

### O-8. Studio-era proof-point numbers

The README metrics table (386 patterns, 929 rules, 33 ADRs, etc.) are presented as
historical reported peaks. They are not verifiable from this repo. I added a
clarifying note but left the numbers in place. Whether to keep them or replace
with current-repo numbers is an editorial decision.

### O-9. Examples 3 / 4 / 5 / 6 still carry `@architect-business-value`-style examples elsewhere

I trimmed the headline tag blocks in Appendix A Examples 3 and 6 plus the §05
sample. The prose still occasionally refers to "business value" as a description
section heading (`**Business Value:**`) which is correct for plan-level Feature
descriptions (it is markdown prose, not a tag). No fix needed.

### O-10. Stub example uses `@architect-pattern`

The current spec and dogfood stubs both carry `@architect-pattern` in stub JSDoc.
The `architect-base/references/annotation-ownership.md` doctrine in `.agents/skills/` says **production
code** must not use `@architect-pattern` — but stubs are not production code,
they're staging artifacts, so this is consistent. Verified, no fix needed.

## Files modified

```
formal-spec/README.md
formal-spec/package.json
formal-spec/00-overview.md
formal-spec/01-conformance.md
formal-spec/02-artifact-types.md
formal-spec/03-tag-system.md
formal-spec/04-tag-registry.md
formal-spec/05-feature-spec-format.md
formal-spec/06-adr-format.md      (version header only)
formal-spec/07-stub-format.md
formal-spec/08-spec-evolution.md
formal-spec/09-delivery-lifecycle.md
formal-spec/10-pattern-graph.md
formal-spec/11-project-configuration.md
formal-spec/12-live-documentation-api.md
formal-spec/appendix-a-examples.md
```
