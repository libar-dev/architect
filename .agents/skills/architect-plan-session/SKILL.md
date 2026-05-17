---
name: architect-plan-session
description: Use when capturing a new idea, refining a candidate spec, or deciding what to build next in the Architect platform. Enforces the minimum-Gherkin-by-tier philosophy — idea specs are ≤30 lines (warn-only soft budget) with 6 tags and invariant-only rules, candidates add open questions and a single happy-path scenario, plan and design tiers come later. Prevents the verbose-spec anti-pattern. Do NOT use for: design-tier work (stubs, deliverables tables, exhaustive scenarios — route to architect-design-session), implementing already-shipped code (retroactive specs are forbidden — route to architect-implement-spec to enrich an existing executable feature instead), or generic product brainstorming outside the Architect pattern model.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Architect Plan-Tier Session

You are at the lightest tier of spec authoring. The single most common failure
mode is **producing a verbose, deliverables-loaded spec for an idea that has
not been committed to delivery**. Resist it.

## Doctrine references

This skill operates under shared references — read them once per
session if you haven't:

- [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md) —
  tier table, mandatory tags, valid promotion paths.
- [`../_shared/rule-block-template.md`](../_shared/rule-block-template.md)
  — at idea tier, `**Invariant:**`-only Rule blocks; the full 4-field
  template applies only at plan tier and below.
- [`../_shared/spec-pattern-relationships.md`](../_shared/spec-pattern-relationships.md)
  — when the "what to capture" is for code that already ships, route
  to the `*ExecutableTests` escape hatch instead of authoring an
  idea/candidate/plan-tier spec for it (this is the formal exit from
  the retroactive-plan-level-spec anti-pattern).
- [`../_shared/canonical-references.md`](../_shared/canonical-references.md)
  — anti-anecdote rule; defer to the live taxonomy
  (`pnpm architect:query taxonomy --format json`) and `formal-spec/`
  over sample notes.

## Pre-flight

You are here because the router selected `planning` intent. Run the canonical
planning pre-flight from
[`../architect-data-api/SKILL.md`](../architect-data-api/SKILL.md) §"Planning"
— it covers `overview`, `list --status candidate`, `open-questions`, and
`context --session planning`.

Note: `scope-validate` only accepts `design` or `implement`. There is no
`scope-validate <pattern> planning`. Skip it at this tier — idea/candidate
readiness is structural (see the four-tier ladder below).

## Four-Tier Ladder

Canonical reference: [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md).
Read it once for the tier table, mandatory tags, `DEFAULT_MATURITY_BY_STATUS`
defaults, and the valid promotion paths, then return here for plan-tier
authoring guidance.

This skill operates on the **first two rungs** of the ladder — idea and
candidate. Plan and design tiers belong to other skills.

### Five-tag idea-tier minimum

An idea-tier spec carries five authored tags. `@architect-maturity` is derived
and must not be written on source; the tier is conveyed by file location and
the minimum idea-tier shape.

1. `@architect` — the gate tag
2. `@architect-pattern:<PatternName>`
3. `@architect-status:candidate`
4. `@architect-product-area:<area>`
5. `@architect-parent:<EpicName>`

Any additional tag at idea tier is a smell, **except** `@architect-level:epic` or `@architect-level:slice` — those are structural and exempt the file from the `@architect-parent` requirement.

## Idea-tier template (write exactly this shape, no more)

Location: `architect/specs/ideas/<kebab>.feature`.

```gherkin
@architect
@architect-pattern:<PatternName>
@architect-status:candidate
@architect-product-area:<area>
Feature: <PatternName> - <one-line purpose>

  **User Story:** As a <role>, I want <capability> so that <outcome>.

  Rule: <single business constraint>
    **Invariant:** <what must always be true>
```

That is the ENTIRE shape at idea tier. Five authored tags, one user story, one
rule with one invariant. Add a second rule only if the idea genuinely encodes
two distinct constraints.

### Epic / slice variants

When the file groups other patterns (epic) or saves a multi-pattern view (slice), add `@architect-level:epic` or `@architect-level:slice` and drop `@architect-parent`. Use these shapes:

**Epic:**

```gherkin
@architect
@architect-pattern:<EpicName>
@architect-status:candidate
@architect-product-area:<area>
Feature: <EpicName> - <one-line purpose>

  **User Story:** As <role>, we want <capability> so that <outcome>.

  **Members:**
  - <Pattern1>
  - <Pattern2>

  Rule: <single epic-level constraint>
    **Invariant:** <what must always be true>
```

**Slice:** same as epic with `@architect-level:slice` and a `**Usage:**` line under the members. Slices live in `architect/slices/<name>.feature`, not `architect/specs/ideas/`.

To list the members of an existing epic directly from the graph (instead of
hand-tracking them in the `**Members:**` bullet list), run
`pnpm architect:query list --parent <EpicName> --names-only`. Unknown parent
names exit non-zero with `Parent pattern not found: <Name>`.

## Candidate-tier delta (add only when promoting from idea)

Idea shape plus:

```gherkin
  **Open Questions:**
  - <question 1>
  - <question 2>

  @acceptance-criteria @happy-path
  Scenario: <shortest representative happy path>
    Given <precondition>
    When <action>
    Then <outcome>
```

The promotion delta is mechanical: `git mv` the file from
`architect/specs/ideas/<kebab>.feature` to
`architect/specs/candidates/<kebab>.feature`, add the `**Open Questions:**`
block, and add 1-2 happy-path scenarios. `@architect-status` stays `candidate`
until the acceptance gate promotes the spec to `roadmap` (which becomes the
plan tier).

## Anti-patterns at idea tier (block these aggressively)

The following five rules are the idea-tier anti-pattern set codified in `formal-spec/08-spec-evolution.md` § "Anti-Patterns at Idea Tier" and inlined in [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md). They are non-negotiable at the idea tier of the four-tier ladder:

- **Do not add deliverables.** Ideas are not committed to files.
- **Do not add phase/effort/priority.** Planning metadata means commitment.
- **Do not add ADRs.** If an idea requires a decision, note it in the parent epic, not here.
- **Do not write narrative descriptions.** One-line Feature description only. If you need more than one line, the idea is ready for candidate tier.
- **Do not enumerate scenarios.** Rules with invariants are sufficient at idea tier.

### Additional anti-patterns (this skill, applies to all planning-tier work)

- **No `**Rationale:**`or`**Verified by:**` on rules at idea tier.** Those are plan-tier additions.
- **No retroactive plan-level specs.** If you discover code that already implements the idea, do NOT author a plan-level spec for it. Tag an existing executable feature with `@architect-implements:<Pattern>` and enrich it. Plan-level specs are for _planned_ work only.

> **Tripwire — retroactive plan-level specs.** This is the single most common
> failure mode of this session type. If the validator reports missing Gherkin
> coverage for a pattern that is _already shipping_, the correct fix is to tag
> an existing executable feature with `@architect-implements:<Pattern>` and
> enrich its rich content — never to author a fresh plan-level spec in
> `architect/specs/`. A plan-level spec is supposed to die after implementation;
> conjuring one back to "cover" shipped behavior inverts the pipeline and
> leaves a zombie spec behind. Refactoring exception: when backfilling coverage
> for code that already exists, skip to design-level or executable tier
> directly. Never via plan-level. See `formal-spec/08-spec-evolution.md`
> § "Anti-Patterns" ("Exception: Refactoring specs").

## Promotion deltas

Full promotion table lives in [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md)
under "Valid promotion paths". The plan-session skill is responsible for the
**Idea → Candidate** transition only:

- Add `**Open Questions:**` block + 1-2 happy-path scenarios
- `git mv architect/specs/ideas/<kebab>.feature architect/specs/candidates/<kebab>.feature`
- `@architect-status` stays `candidate` until the acceptance gate later

Candidate → Plan and Plan → Design promotions are out of scope here — they
edit in place, and they belong to subsequent sessions.

## Output for this session

Either:

- (a) you authored a fresh idea spec under `architect/specs/ideas/`, or
- (b) you promoted an existing idea to candidate tier (added open questions + one scenario, moved it to `architect/specs/candidates/`), or
- (c) you decided not to write anything yet — refining intent in conversation is a valid outcome at this tier.

If (c), say so explicitly and recommend the user re-invoke when ready.

## Do not

- Do not invoke `architect-design-session` from here. Promotion to design tier
  is a separate decision and a separate session.
- Do not author scenarios at idea tier even if the user asks for them — promote
  to candidate first, with the explicit track flip.
- Do not skip the dogfooding feedback step from the router skill.
