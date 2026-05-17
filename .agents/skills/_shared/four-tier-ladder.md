# Four-Tier Ladder (canonical reference)

Shared reference for every Architect session-typed skill. The ladder is
discriminated by **authored status**, **file location**, and the tier's
required content. `@architect-maturity` is an effective/derived concept and
must not be authored on source. Skills link here instead of inlining the tier
table; that keeps tier rules in one place and prevents the three-skill drift
that prompted this consolidation.

**Terminology.** "Idea inbox" is the colloquial name for `architect/specs/ideas/`
— the folder that holds idea-tier specs awaiting promotion. "Idea tier" and
"idea inbox" are used interchangeably across the skills and route to the same
planning intent.

## Tiers

| Tier      | Authored status / location                                         | Folder                        | Line budget               | What this tier adds vs the one above                                                                                                                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------ | ----------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idea      | `@architect-status:candidate`; idea-tier shape                     | `architect/specs/ideas/`      | **≤30 lines (warn-only)** | User story + 1-3 invariant-only rules. Five authored tags total; structural-variant carve-outs (epic / slice) may add `**Members:**` and `**Usage:**` blocks — see "Epic and slice variants" below. Both still respect the ≤30 budget. Otherwise no `Background:`, no scenarios, no rationale, no verified-by. |
| Candidate | `@architect-status:candidate`; candidate-tier shape                | `architect/specs/candidates/` | **30-80 lines**           | Adds `**Open Questions:**` block + 1-2 happy-path scenarios.                                                                                                                                                                                                                                                   |
| Plan      | `@architect-status:roadmap`; deliverables + plan-tier metadata     | `architect/specs/`            | untyped (150+)            | Adds deliverables table, full scenario set, and `**Rationale:**` / `**Verified by:**` on rules. Hierarchy-axis metadata stays on the `@architect-level` / `@architect-parent` pair.                                                                                                                            |
| Design    | `@architect-status:roadmap`; plan-tier shape plus design scaffolds | `architect/specs/`            | untyped (300+)            | Adds stubs in `architect/stubs/<pattern>/`, error/edge/integration scenarios, ADR refs.                                                                                                                                                                                                                        |

## Mandatory tags per tier

Every tier carries these five authored baseline tags (plus `@architect-level:epic|slice` for those structural variants — see "Epic and slice variants" below). Effective maturity is derived from file location + authored status and must stay off source. Tiers above idea may add metadata tags (`@architect-completed`, `@architect-product-area`) without changing the baseline. See `pnpm architect:query taxonomy` for the live tag set; do not maintain a hand-curated list here.

The four-tier ladder is the maturity axis. It is independent of the hierarchy axis (`@architect-level`, `@architect-parent`), which expresses epic→phase→task→slice decomposition. A pattern at any maturity tier can be at any hierarchy level.

1. `@architect` — gate tag
2. `@architect-pattern:<PatternName>`
3. `@architect-status:<candidate|roadmap>` — see ladder table
4. `@architect-product-area:<area>`
5. `@architect-parent:<ParentPattern>`

## Epic and slice variants

Idea-tier files that group other patterns or save a multi-pattern view carry `@architect-level:epic` or `@architect-level:slice`. These are **hierarchy-axis** declarations (not maturity-axis); see [`./spec-pattern-relationships.md`](./spec-pattern-relationships.md) §"Hierarchy axis" for the canonical doctrine. The variants relax two baseline rules:

- **Parent carve-out.** Epics are top-of-chain, slices are views; neither has an `@architect-parent`. The lint and grader both exempt these levels from the parent requirement.
- **7th tag allowed.** `@architect-level` is a structural tag, not idea-tier metadata, so its presence does not violate the "additional tags are a smell" rule.

Epic file shape: idea template + a human-facing `**Members:**` bullet list naming each member pattern. Slice file shape: idea template + `**Members:**` + a `**Usage:**` line describing the question the slice answers. Both stay within the ≤30-line soft budget.

## Effective maturity

`@architect-maturity` remains a derived/effective concept; do not author it on
source. Canonical defaults still live at
`formal-spec/04-tag-registry.md` § "Status → Maturity Defaults", but authoring
guidance now flows through the ladder's file-location/content rules instead of
a source tag.

Practical effect at idea tier: a file in `architect/specs/ideas/` with
`@architect-status:candidate` is treated as idea-tier. Candidate-tier lives in
`architect/specs/candidates/`; plan/design tiers stay in `architect/specs/` and
are distinguished by their required content and deliverables/stub scaffolding.

## Valid promotion paths

```
idea ──► candidate ──► plan ──► design
```

- **Idea → Candidate:** add `**Open Questions:**` + 1-2 happy-path scenarios; `git mv` from `architect/specs/ideas/` to `architect/specs/candidates/`. Status stays `candidate`.
- **Candidate → Plan:** add deliverables table, `**Rationale:**` / `**Verified by:**` on rules, full scenario set, and any retained hierarchy metadata needed for the pattern; bump `@architect-status:candidate` → `roadmap`. Edit in place — no file move.
- **Plan → Design:** add stubs in `architect/stubs/<pattern>/`, error/edge/integration scenarios, ADR refs. Status stays `roadmap` (it transitions to `active` during the implement-spec session, not here). Edit in place.

Skipping rungs (idea → plan, candidate → design, etc.) is rejected — promote
through every rung. The only exception is the **refactoring carve-out**: when
backfilling coverage for code that already exists, skip directly to design or
executable tier. Never via plan-level. Rule: `formal-spec/08-spec-evolution.md`
§ "Anti-Patterns" ("Exception: Refactoring specs").

## Worked example 1 — idea-tier minimum

Location: `architect/specs/ideas/copilot-context-bundle.feature`

```gherkin
@architect
@architect-pattern:CopilotContextBundle
@architect-status:candidate
@architect-product-area:editor
Feature: CopilotContextBundle - assemble pattern context for AI agents

  **User Story:** As a developer, I want a single bundle of pattern context
  so that my AI agent has the architectural picture without re-reading files.

  Rule: Bundle is read-only and derived from PatternGraph
    **Invariant:** Bundle never carries data not already in the graph.
```

Five authored tags, one user story, one rule, one invariant. That is the entire shape.
Adding a deliverables table or a scenario here is a smell — it means the idea
is ready to promote, not that the idea-tier file should grow.

## Worked example 2 — candidate-tier promotion

Starting from the idea above, promotion produces:

Location: `architect/specs/candidates/copilot-context-bundle.feature`

```gherkin
@architect
@architect-pattern:CopilotContextBundle
@architect-status:candidate
@architect-product-area:editor
Feature: CopilotContextBundle - assemble pattern context for AI agents

  **User Story:** As a developer, I want a single bundle of pattern context
  so that my AI agent has the architectural picture without re-reading files.

  **Open Questions:**
  - Does the bundle include stub content, or only their resolved targets?
  - What is the cache key — pattern name alone, or pattern + session intent?

  Rule: Bundle is read-only and derived from PatternGraph
    **Invariant:** Bundle never carries data not already in the graph.

  @acceptance-criteria @happy-path
  Scenario: Agent requests bundle for a pattern
    Given a pattern named "UserService" exists in the graph
    When the agent calls the context API with session "design"
    Then the bundle includes deliverables, stubs, and dependency tree
```

Mechanical changes: file moved `ideas/` → `candidates/`, the
`**Open Questions:**` block was added, and one happy-path scenario was added.
Status stays `candidate`. The acceptance gate is what later flips
`status:candidate` → `status:roadmap` and starts the plan-tier delta.
