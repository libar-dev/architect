# Four-tier ladder

Shared reference for every Architect session-typed skill. The ladder is discriminated by **authored status**, **file location**, and the tier's required content. `@architect-maturity` is derived from status at every tier **except idea**. An idea-tier spec authors an explicit `@architect-maturity:idea`, the opt-in marker the guard's idea-tier checks key on (status `candidate` alone is ambiguous, because the candidate tier shares it). Skills link here instead of inlining the tier table, so tier rules live in one place.

**Terminology.** "Idea inbox" is the colloquial name for `architect/specs/ideas/`, the folder that holds idea-tier specs awaiting promotion. "Idea tier" and "idea inbox" are used interchangeably across the skills and route to the same planning intent.

## Tiers

| Tier      | Authored status / location                                     | Folder                        | Line budget               | What this tier adds vs the one above                                                                                                                                                                                                                                                                                                                                   |
| --------- | -------------------------------------------------------------- | ----------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idea      | `@architect-status:candidate`; idea-tier shape                 | `architect/specs/ideas/`      | **≤30 lines (warn-only)** | User story + 1-3 invariant-only rules. Six authored tags total (the five baseline + explicit `@architect-maturity:idea`); structural-variant carve-outs (epic / slice) may add `**Members:**` and `**Usage:**` blocks. See "Epic and slice variants" below. Both still respect the ≤30 budget. Otherwise no `Background:`, no scenarios, no rationale, no verified-by. |
| Candidate | `@architect-status:candidate`; candidate-tier shape            | `architect/specs/candidates/` | **30-80 lines**           | Adds `**Open Questions:**` block + 1-2 happy-path scenarios; drops the explicit `@architect-maturity:idea` (maturity derives to `idea` from `status:candidate`, still consideration, which releases it from idea-tier gating).                                                                                                                                         |
| Plan      | `@architect-status:roadmap`; deliverables + plan-tier metadata | `architect/specs/`            | untyped (150+)            | Adds deliverables table, full scenario set, and `**Rationale:**` / `**Verified by:**` on rules. Hierarchy-axis metadata stays on the `@architect-level` / `@architect-parent` pair.                                                                                                                                                                                    |
| Design    | `@architect-status:roadmap`; plan-tier shape plus design stubs | `architect/specs/`            | untyped (300+)            | Adds stubs in `architect/stubs/<pattern>/`, error/edge/integration scenarios, ADR refs.                                                                                                                                                                                                                                                                                |

## Mandatory tags per tier

Every tier carries these five authored baseline tags, plus `@architect-level:epic|slice` for those structural variants. See "Epic and slice variants" below. **The idea tier also authors `@architect-maturity:idea`**, the explicit opt-in the guard's idea-tier checks key on. Maturity is otherwise **derived from status** (ADR-007: `idea` maturity = consideration, `plan` = delivery; `DEFAULT_MATURITY_BY_STATUS` maps `candidate→idea`, `roadmap→plan`, …) and normally left to derive (an explicit value still wins, per §04). The candidate tier drops the explicit `:idea` (deriving back to `idea` = still consideration), and `roadmap`+ derives `plan`/`design`. Tiers above idea may add metadata tags (e.g. `@architect-completed` at completion time) without changing the baseline. `@architect-product-area` is **not** an extra metadata tag. It is baseline tag #4, required from idea tier up. See the generated `docs-live/TAXONOMY.md` for the live tag set. Do not maintain a hand-curated list here.

The four-tier ladder is the maturity axis. It is independent of the hierarchy axis (`@architect-level`, `@architect-parent`), which expresses epic→phase→task→slice decomposition. A pattern at any maturity tier can be at any hierarchy level.

1. `@architect`. Gate tag
2. `@architect-pattern:<PatternName>`
3. `@architect-status:<candidate|roadmap>`. See ladder table
4. `@architect-product-area:<area>`
5. `@architect-parent:<ParentPattern>`

**Idea tier adds a 6th.** `@architect-maturity:idea`. This is the explicit discriminator the guard's `detectIdeaTier` requires (`packages/architect-guard/src/lint/idea-tier/`). Without it, an `architect/specs/ideas/` file is _not_ recognized as idea-tier and silently escapes idea-tier validation (line budget, baseline-tag count, parent requirement). Authored only at idea tier; **dropped on promotion to candidate**. Removing it is what releases the spec from idea-tier gating, and maturity then derives to `idea` from `status:candidate` (still consideration, no longer the explicit opt-in). The guard's idea-tier minimum-tag count is the five (gate, pattern, status, **maturity**, product-area), with `@architect-parent` enforced separately, matching `formal-spec/08-spec-evolution.md`'s six-tag idea minimum.

## Epic and slice variants

Idea-tier files that group other patterns or save a multi-pattern view carry `@architect-level:epic` or `@architect-level:slice`. These are **hierarchy-axis** declarations (not maturity-axis). See [`./spec-pattern-relationships.md`](./spec-pattern-relationships.md) §"Hierarchy axis" for the canonical doctrine. The variants relax two baseline rules:

- **Parent carve-out.** Epics are top-of-chain, slices are views. Neither has an `@architect-parent`. The lint and grader both exempt these levels from the parent requirement.
- **`@architect-level` is allowed (not a smell).** It is a structural hierarchy tag, not idea-tier metadata, so its presence does not violate the "additional tags are a smell" rule. An epic/slice therefore carries gate, pattern, status, `@architect-maturity:idea`, product-area, and `@architect-level`. `@architect-parent` omitted.

Epic file shape: idea template + a human-facing `**Members:**` bullet list naming each member pattern. Slice file shape: idea template + `**Members:**` + a `**Usage:**` line describing the question the slice answers. Both stay within the ≤30-line soft budget.

## Effective maturity

`@architect-maturity` is **derived from status** (ADR-007: `idea` = consideration, `plan` = delivery). An explicit value always wins (`formal-spec/04` "explicit always wins"). Canonical defaults live at `formal-spec/04-tag-registry.md` § "Status → Maturity Defaults" (`candidate→idea`, `roadmap→plan`, `active→design`, `completed→executable`). The **one place an explicit tag is _required_** is the idea tier. Elsewhere it is normally left to derive (an explicit override is permitted but rarely needed).

**Why the idea tier needs the explicit tag.** A file in `architect/specs/ideas/` must author `@architect-maturity:idea` to be recognized as idea-tier by the guard (`packages/architect-guard/src/lint/idea-tier/`). `@architect-status:candidate` alone is _not_ sufficient, because the candidate tier shares that status (and legacy specs may carry no explicit maturity), and the guard **deliberately stopped** inferring idea-tier from it (otherwise those specs cascade false positives through the idea-tier checks). PatternGraph auto-defaults `candidate→idea` for queries, but the guard's idea-tier checks (≤30-line budget, baseline-tag count, parent requirement) only fire on the explicit tag.

**Why the candidate tier drops the explicit tag.** Promoting idea→candidate **drops** the explicit `@architect-maturity:idea` (status stays `candidate`). Removing it is what releases the spec from idea-tier gating. Its maturity then derives to `idea` from `status:candidate`, still the _consideration_ track (open questions unresolved), exactly as `DEFAULT_MATURITY_BY_STATUS` prescribes. Delivery commitment (`maturity:plan`) normally arrives at the acceptance gate, when status advances to `roadmap`, though an explicit `@architect-maturity:plan` may mark delivery earlier (§04 "explicit always wins"; valid at `status:candidate` per `VALID_COMBINATIONS`). Candidate-tier files normally live in `architect/specs/candidates/` with maturity derived (no explicit tag). Plan/design tiers stay in `architect/specs/` at `@architect-status:roadmap` and are distinguished by required content and deliverables/stub files.

## Valid promotion paths

```
idea ──► candidate ──► plan ──► design
```

- **Idea → Candidate.** Add `**Open Questions:**` + 1-2 happy-path scenarios; **drop `@architect-maturity:idea`** (removing it releases the spec from idea-tier gating. Maturity derives to `idea` from `status:candidate`, still consideration. Keeping `:idea` would hold it at idea tier under the ≤30-line budget); `git mv` from `architect/specs/ideas/` to `architect/specs/candidates/`. Status stays `candidate`.
- **Candidate → Plan.** Add deliverables table, `**Rationale:**` / `**Verified by:**` on rules, full scenario set, and any retained hierarchy metadata needed for the pattern; bump `@architect-status:candidate` → `roadmap`. Edit in place. No file move.
- **Plan → Design.** Add stubs in `architect/stubs/<pattern>/`, error/edge/integration scenarios, ADR refs. Status stays `roadmap` (it transitions to `active` during the implement-spec session, not here). Edit in place.

Skipping rungs (idea → plan, candidate → design, etc.) is rejected. Promote through every rung. (The one non-spec-driven exception, backfilling shipped code that has no spec, is owned by [`architect-refactor-session`](../../architect-refactor-session/SKILL.md), not this spec-driven ladder.)

## Worked example 1, idea-tier minimum

> The pattern names and `@architect-product-area:editor` below are **illustrative**. Product-area values are repo-configured (this repo's live enum is `Annotation · Configuration · Generation · Validation · DataAPI · CoreTypes · Process · Projection`; verify in the generated `docs-live/TAXONOMY.md`). The example teaches the tag _shape_, not a value to copy.

Location: `architect/specs/ideas/copilot-context-bundle.feature`

```gherkin
@architect
@architect-pattern:CopilotContextBundle
@architect-status:candidate
@architect-maturity:idea
@architect-product-area:editor
@architect-parent:CopilotIntegration
Feature: CopilotContextBundle - assemble pattern context for AI agents

  **User Story:** As a developer, I want a single bundle of pattern context
  so that my AI agent has the architectural picture without re-reading files.

  Rule: Bundle is read-only and derived from PatternGraph
    **Invariant:** Bundle never carries data not already in the graph.
```

Six authored tags, one user story, one rule, one invariant. That is the entire shape. Adding a deliverables table or a scenario here is a smell. It means the idea is ready to promote, not that the idea-tier file should grow.

## Worked example 2, candidate-tier promotion

Starting from the idea above, promotion produces:

Location: `architect/specs/candidates/copilot-context-bundle.feature`

```gherkin
@architect
@architect-pattern:CopilotContextBundle
@architect-status:candidate
@architect-product-area:editor
@architect-parent:CopilotIntegration
Feature: CopilotContextBundle - assemble pattern context for AI agents

  **User Story:** As a developer, I want a single bundle of pattern context
  so that my AI agent has the architectural picture without re-reading files.

  **Open Questions:**
  - Does the bundle include stub content, or only their resolved targets?
  - What is the cache key, pattern name alone, or pattern + session intent?

  Rule: Bundle is read-only and derived from PatternGraph
    **Invariant:** Bundle never carries data not already in the graph.

  @acceptance-criteria @happy-path
  Scenario: Agent requests bundle for a pattern
    Given a pattern named "UserService" exists in the graph
    When the agent calls the context API with session "design"
    Then the bundle includes deliverables, stubs, and dependency tree
```

Mechanical changes: file moved `ideas/` → `candidates/`, the explicit `@architect-maturity:idea` was **dropped** (releasing the spec from idea-tier gating; maturity now derives to `idea` from `status:candidate`, still consideration), the `**Open Questions:**` block was added, and one happy-path scenario was added. Status stays `candidate`. The acceptance gate is what later flips `status:candidate` → `status:roadmap` and starts the plan-tier delta (where maturity derives to `plan` = delivery).
