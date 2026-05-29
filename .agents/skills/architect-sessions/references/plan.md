# Plan — idea & candidate authoring

The lightest two rungs of the four-tier ladder: capture a new idea, or promote an idea to candidate. The single most common failure mode is **producing a verbose, deliverables-loaded spec for an idea that has not been committed to delivery.** Resist it.

Doctrine depth (read once if unfamiliar): the tier table + mandatory tags in [`../../architect-base/references/four-tier-ladder.md`](../../architect-base/references/four-tier-ladder.md); the optional Rule-block template (idea tier = `**Invariant:**`-only) in [`../../architect-base/references/rule-block-template.md`](../../architect-base/references/rule-block-template.md); the `*ExecutableTests` escape hatch (for "capture" requests aimed at code that already ships) in [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md).

## Gather context first

Before writing anything, get the few things that decide the spec's shape. Ask conversationally, most-important first; extract from any brief/doc the user provides and only ask about the gaps:

1. **Problem + actor** — what capability, for whom, so that what outcome? (This becomes the one-line user story.)
2. **The one invariant** — what must always be true for this to be correct? (This becomes the single Rule.)
3. **Already shipping?** — does code already implement this? If yes, **stop** — an idea/candidate/plan spec is the wrong artifact; route to the `*ExecutableTests` escape hatch (enrich an existing executable feature), never a retroactive spec.
4. **Parent / level** — which epic is this under, or is it itself an epic/slice?

If the answers aren't there yet, refining intent in conversation is a valid outcome — say so and stop. Do not manufacture detail to fill a template.

## Pre-flight

Run the everyday-verb pre-flight from [`../../architect-data-api/SKILL.md`](../../architect-data-api/SKILL.md) (`overview`, then `search` / `list --status candidate --names-only` to locate, `open-questions [--parent <Epic>]` for candidate readiness). **No `scope-validate` at this tier** — it accepts only `design` and `implement`; idea/candidate readiness is structural (the ladder reference).

## Six-tag idea-tier minimum

An idea-tier spec carries six authored tags — the five cross-tier baseline plus the explicit `@architect-maturity:idea` the guard's idea-tier checks require (without it the file is _not_ recognized as idea-tier and silently escapes idea-tier validation):

1. `@architect` — the gate tag
2. `@architect-pattern:<PatternName>`
3. `@architect-status:candidate`
4. `@architect-maturity:idea` — **idea tier only** (the guard's idea-tier opt-in); dropped on promotion to candidate, after which maturity derives from status
5. `@architect-product-area:<area>`
6. `@architect-parent:<EpicName>`

Any further tag at idea tier is a smell, **except** `@architect-level:epic` / `@architect-level:slice` — those are structural and exempt the file from the `@architect-parent` requirement.

## Idea-tier template (write exactly this shape, no more)

Location: `architect/specs/ideas/<kebab>.feature`.

```gherkin
@architect
@architect-pattern:<PatternName>
@architect-status:candidate
@architect-maturity:idea
@architect-product-area:<area>
@architect-parent:<EpicName>
Feature: <PatternName> - <one-line purpose>

  **User Story:** As a <role>, I want <capability> so that <outcome>.

  Rule: <single business constraint>
    **Invariant:** <what must always be true>
```

Six authored tags, one user story, one rule with one invariant — the ENTIRE shape. Add a second rule only if the idea genuinely encodes two distinct constraints.

### Epic / slice variants

When the file groups other patterns (epic) or saves a multi-pattern view (slice), add `@architect-level:epic` / `@architect-level:slice` and drop `@architect-parent`:

```gherkin
@architect
@architect-pattern:<EpicName>
@architect-status:candidate
@architect-maturity:idea
@architect-product-area:<area>
@architect-level:epic
Feature: <EpicName> - <one-line purpose>

  **User Story:** As <role>, we want <capability> so that <outcome>.

  **Members:**
  - <Pattern1>
  - <Pattern2>

  Rule: <single epic-level constraint>
    **Invariant:** <what must always be true>
```

A **slice** is the same with `@architect-level:slice` and a `**Usage:**` line under the members; slices live in `architect/slices/<name>.feature`. To list an epic's members from the graph instead of hand-tracking the bullet list: `pnpm architect:query list --parent <EpicName> --names-only` (unknown parent exits non-zero).

## Candidate-tier delta (only when promoting from idea)

Idea shape plus an `**Open Questions:**` block and 1-2 happy-path scenarios:

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

The promotion is mechanical: `git mv architect/specs/ideas/<kebab>.feature architect/specs/candidates/<kebab>.feature`, drop the explicit `@architect-maturity:idea` (removing it releases the spec from idea-tier gating; maturity derives to `idea` from `status:candidate`), add the open-questions block, add 1-2 scenarios. `@architect-status` stays `candidate` until the acceptance gate later flips it to `roadmap` (which becomes the plan tier).

## Notes — non-negotiable at idea tier

Block these aggressively (the idea-tier anti-pattern set; details in the ladder reference):

- **No deliverables.** Ideas are not committed to files.
- **No phase / effort / priority / release metadata.** Planning metadata means commitment.
- **No ADRs.** If an idea needs a decision, note it in the parent epic, not here.
- **No narrative.** One-line Feature description. _Needing_ more than one line means the idea is ready for candidate tier — that is signal to promote, not to grow the idea file.
- **No scenarios at idea tier.** Rules-with-invariants suffice; scenarios belong at candidate tier and above.
- **No `**Rationale:**`/`**Verified by:**` at idea tier** — those are plan-tier additions.

> **Tripwire — retroactive plan-level specs (the #1 failure mode).** If the validator reports missing Gherkin coverage for a pattern that is _already shipping_, the fix is to tag an existing executable feature with `@architect-implements:<Pattern>` and enrich it — never to author a fresh plan-level spec. A plan-level spec is meant to die after implementation; conjuring one back to "cover" shipped behavior inverts the pipeline and leaves a zombie. (Refactoring carve-out: backfilling coverage skips directly to design or executable tier, never via plan.)

## Output for this session

One of: (a) authored a fresh idea spec under `architect/specs/ideas/`; (b) promoted an idea to candidate (open questions + 1 scenario, moved to `architect/specs/candidates/`); or (c) decided not to write yet — refining intent in conversation is valid at this tier. If (c), say so and recommend re-invoking when ready.

## Do not

- Do not author scenarios at idea tier even if asked — promote to candidate first, with the explicit track flip.
- Do not skip rungs. Candidate → Plan and Plan → Design edit in place and belong to later sessions.

**Next session:** once the acceptance gate clears and the candidate is promoted to plan/`roadmap`, the design work continues in [`design.md`](design.md).
