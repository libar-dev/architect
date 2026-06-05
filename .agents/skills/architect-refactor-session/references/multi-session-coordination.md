# Multi-Session / PR Coordination (canonical reference)

**This skill is only for non-spec-driven development. DO NOT USE for refactoring based on a design-level spec.**

The convention for any pull request whose work is large or risky enough
that a single agent session cannot land it cleanly in one pass. This is
**not refactor-specific** — feature PRs with cross-cutting changes,
review follow-up waves, dep-bump waves, security-audit fixes, and staged
migrations all benefit. Refactor PRs benefit most because they
concentrate the "scope expands mid-session" risk.

A small PR (one logical chunk, one session) does not need the full
package layout, but it still benefits from `DECISIONS.md` and the
scope-discovery rule below.

## When this applies

- **Always:** any PR with ≥2 logical chunks, any review follow-up,
  any modernization sweep, any staged migration, any refactor that
  touches ≥3 packages.
- **Strongly recommended:** any PR with ≥1 architectural decision,
  any PR likely to surface drift mid-session, any PR a fresh agent
  session could not complete from the diff alone.
- **Optional:** a 1-commit PR with no decisions and no cross-cutting
  surface — the lone `DECISIONS.md` + the scope-discovery rule are
  enough; the folder layout is overhead.

## The campaign rules (beyond the universal three)

The three universal session rules — **Data API first**, **gates
non-negotiable**, **commit hygiene** — are the floor for every session
(stated in [`../../architect-sessions/SKILL.md`](../../architect-sessions/SKILL.md)
§"Universal session rules"). A campaign adds three more, which the
sections below operationalize:

4. **Decisions captured before code.** Anything needing human judgment
   goes to `DECISIONS.md` (template below) _before_ the edit that
   depends on it. Without this separation, agents fabricate answers
   under pressure.
5. **Incomplete scope is next-session input, not silent debt.** When
   investigation surfaces drift mid-session, stop and classify
   (same-root-cause → fix inline + record; different-root-cause →
   defer + record). Never land a surface-only commit. See
   "Scope-discovery handling" below — the single most-reused heuristic
   across multi-session work.
6. **Per-session learnings propagate forward.** After each session the
   coordinator appends one tight entry to the learnings log and
   rewrites the unstarted prompts' "Scope discipline" sections with
   newly-discovered rules. Preambles are calibrated against real
   surprises, not boilerplate.

This file adds the package layout, the templates, and the
campaign-specific discipline (coordinator split, scope-discovery
handling) on top of those six.

## Folder layout — `.pr-coordination/`

Coordination artifacts live in a committed plan package at the repo
root:

```
.pr-coordination/
  EXECUTION-PLAN.md             # calibrated scope, ordering, gates, closing invariants
  CONFIRMED-ISSUES.md           # verified findings + session assignment (review-driven only)
  DECISIONS.md                  # items needing human judgment, captured before code
  SESSION-REPORTS-AND-LEARNINGS.md   # append-only per-session entries
  sessions/
    NN-slug.md                  # one paste-ready prompt per session (00-, 01-, …)
  state.json                    # phase tracking (current session, phase, last commit)
```

Archives: `.pr-coordination-archive-<YYYY-MM-DD>/`, gitignored. Move
the package after the campaign closes to keep the active folder for
the next campaign.

The package is **committed to git** so every agent runtime
(Claude Code, OpenCode, Codex/GPT, …) sees the same convention.
Per-agent persistent memory (`~/.claude/`, opencode session store)
MUST NOT hold convention-level guidance — it hides context from other
runtimes.

## Coordinator + worker split (≥3 sessions)

A campaign with three or more sessions defaults to a
**coordinator-plus-worker** topology. The split is load-bearing.

- **The coordinator** (typically a long-lived session) holds the
  campaign's working memory: decisions, drift surfaces, prior-session
  learnings, the unstarted-session prompts. It **never touches code**,
  never runs gates, never makes commits. Its only job is the
  prompt-and-memory pipeline — pre-session brief, mid-campaign drift
  classification, post-session learning extraction, and propagation
  of new rules into the next session's prompt.
- **The workers** (fresh agent sessions, any runtime) read the plan
  package + the curated learnings log, execute one session prompt,
  run gates, commit, return. Workers do not read each other's
  transcripts. That asymmetry preserves the "any agent runtime can
  resume" property.
- **Self-restraint defines the coordinator.** A coordinator that runs
  gates becomes another worker; a coordinator that does less is the
  load-bearing primitive.

Worker session prompts under `sessions/NN-slug.md` are
**paste-ready**: a fresh agent opens the file, executes it, runs
gates, commits, returns. Runtime-specific shortcuts (Claude Code's
`/fork`, OpenCode skill names) are **optional conveniences** described
by the underlying action ("run a parallel inventory subagent") so any
runtime can execute the prompt.

## DECISIONS.md template

```
# Decisions — questions that need human judgment

> Tight entries only. Implementation details live in the session
> prompt that consumes the decision, not here. Rewrites that bloat
> this file with code snippets or step-by-step plans should be
> rejected.

## D-1 — <one-line question>

- **Question:** <what is being decided>
- **Options:** <A / B / C with one-line tradeoff each>
- **Recommendation:** <option + brief rationale>
- **Consumed by:** sessions/<NN-slug.md>
- **Status:** open | resolved (<commit-sha>)
```

Rules: capture the decision **before** writing the code that depends
on it. Without this separation, agents fabricate answers under
pressure.

## SESSION-REPORTS-AND-LEARNINGS.md template

```
# Session reports and learnings

> Append-only log. One entry per session. Keep entries tight (< 20
> lines per session). Lengthy session recaps are an anti-pattern.

## Session N — <one-line title>

Completed Session N scope (<commit-sha>) [+ <inline-fix-shas>].

**Additional scope discovered:** <short description, if any>.
<Why it matters in one or two sentences.>

**Resolution:** inline (same commit) | deferred to Session M | recorded in DECISIONS.md as D-X.

### Rules for upcoming sessions

1. <generalized rule, max 5 bullets>

### Suggested edits to remaining session prompts

- <concrete edit to one or more unstarted prompts, max 5 bullets>
```

The "Additional scope discovered" section is the single most-reused
heuristic across multi-session work. It is what the **scope-discovery
rule** below produces.

## Scope-discovery handling — load-bearing rule

When investigation surfaces drift or additional scope mid-session:

1. **Do not follow the prompt blindly.** Stop and classify before
   writing code that papers over the surprise.
2. **Same-root-cause** (the surprise shares a root cause with the
   planned scope) → fix inline in the same commit; record what was
   found and the rule it generalizes in
   `SESSION-REPORTS-AND-LEARNINGS.md`.
3. **Different-root-cause** (the surprise is independent) → defer
   cleanly. Record either in `DECISIONS.md` (if it needs human
   judgment) or in the learnings log (if it just needs a new
   session). Do not silently absorb it into the current commit.
4. **Never land a surface-only commit.** Gates must pass at HEAD;
   resolve and verify in the same commit, or defer cleanly. No
   silent debt.
5. **The coordinator propagates.** After the session, the coordinator
   rewrites unstarted-session prompts' "Scope discipline" sections
   with the newly-discovered rules. Preambles are calibrated against
   real surprises, not boilerplate.

This rule applies whether or not the campaign uses the full package
layout. A 1-session PR that surfaces unexpected scope still records
the finding (in the PR description, or a `NOTES.md`) and decides
inline-vs-defer before continuing.

## Gates discipline

- A campaign's `Gates` block is a **complete** list of test suites,
  not just the obvious ones. Partial gate coverage allows
  pre-existing failures to spill into a later session.
- Validation cadence is explicit: run `pnpm typecheck` between
  phases, then run `pnpm typecheck && pnpm test && pnpm validate:all`
  before any commit or handoff. Keep the closest targeted typecheck
  / test slice after each deliverable; the full sequence is the
  canonical commit-or-handoff gate.
- A failing gate is stop-and-surface. No silencing, no mocking, no
  `--no-verify`, no `--no-gpg-sign` shortcuts. A failing gate command
  or targeted slice still stops the session until the result is
  surfaced and resolved or cleanly deferred.
- Every commit lands with all gates green. If a session uncovers a
  pre-existing failure unrelated to its scope, that is a
  scope-discovery event — apply the rule above.

## Commit hygiene

- `chore(scope): imperative summary` on coordination commits;
  `fix(scope): …` / `feat(scope): …` on substantive commits.
- Body references issue ids when relevant (e.g.,
  `Closes P0-1, P0-2 from .pr-coordination/CONFIRMED-ISSUES.md`).
- Never `git add -A` on a multi-commit campaign branch — sweeps WIP
  into commits. Stage explicit files.

## Sibling references

- [`../../architect-sessions/SKILL.md`](../../architect-sessions/SKILL.md)
  §"Universal session rules" — the three universal rules (Data API
  first, gates, commit hygiene) that the campaign rules above build on.
- [`../../architect-base/SKILL.md`](../../architect-base/SKILL.md)
  §"Anti-anecdote" — the templates above are deliberately abstract;
  past campaign artifacts are anecdote, useful for understanding why
  the rule exists but not authoritative for what the rule is.
- [`../../architect-base/references/four-tier-ladder.md`](../../architect-base/references/four-tier-ladder.md)
  — the refactoring carve-out (skip idea / candidate / plan to
  executable-tier — a `*ExecutableTests` feature — when backfilling
  coverage for already-shipped code) is one of the scope-discovery
  patterns Rule 5 anticipates.
