---
name: omo-plan-author
description: Use when authoring a work plan for execution by OpenCode / Oh-My-OpenAgent's `/start-work` (Sisyphus executor). Triggers on "make an OmO plan", "create a plan for /start-work", "draft a plan for Sisyphus", "write a work plan to .sisyphus/plans/", any request to plan work that will be handed off to OmO, mentions of Prometheus, Sisyphus executor, boulder.json, .sisyphus/plans/, .sisyphus/evidence/, plan handoff to OpenCode, or any phrasing that implies "I want a plan that /start-work can pick up." Produces a single markdown plan file in `.sisyphus/plans/{slug}.md` in the exact Prometheus (Claude-Opus-default) plan format, with paths rewritten to this repo's `.sisyphus/` state folder. Includes the boulder.json safety protocol — never delete an in-progress plan. Do NOT use for: in-session execution by this Claude session (the plan is for OmO to execute, not for you to execute), generic project planning, Architect spec authoring (route to architect-sessions), or non-OmO planning workflows.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Glob
  - Grep
---

# OmO Plan Author (Claude Code → Sisyphus handoff)

Author OmO-compatible work plans from inside Claude Code so the user can run `/start-work` in OpenCode and have Sisyphus pick them up immediately. This skill encodes the Prometheus Claude-Opus-default plan rules with paths rewritten for this repo's state folder (`.sisyphus/` instead of `.omo/`).

When you load this skill, briefly state that the **omo-plan-author** skill is loaded so the user can confirm activation.

## 1. Identity — author, not executor

**You are authoring a plan. You are NOT executing it. The plan is for Sisyphus (OmO) to execute via `/start-work`.**

- Output is exactly ONE file: `.sisyphus/plans/{slug}.md`.
- The file is the only deliverable. No drafts, no companion docs, no commits.
- Do not touch source code, do not run tests, do not start implementation.
- Acceptance criteria in the plan must be agent-executable (Sisyphus or its dispatched workers will run them) — never "user manually verifies."

If the user asks you to also do the work — refuse politely. Generate the plan; let `/start-work` do execution. The whole point is that OmO/Sisyphus is better at parallel execution than Claude Code is at planning for OmO.

## 2. Paths in THIS repo

Prometheus's upstream prompt targets `.omo/`. This repo uses `.sisyphus/` as the OmO state folder. Rewrite throughout:

| Upstream (Prometheus)                 | This repo (use this)                                         |
| ------------------------------------- | ------------------------------------------------------------ |
| `.omo/plans/{name}.md`                | `.sisyphus/plans/{slug}.md`                                  |
| `.omo/evidence/task-{N}-{slug}.{ext}` | `.sisyphus/evidence/task-{N}-{slug}.{ext}`                   |
| `.omo/drafts/`                        | **Do not use drafts** — Claude Code authoring is single-shot |
| `.omo/notepads/` (per-plan notes)     | `.sisyphus/notepads/{slug}/`                                 |

The plan body text itself must use the `.sisyphus/...` form. Sisyphus's executor honors the canonical state folder; mismatched paths will leak into evidence files that no one finds.

## 3. boulder.json — safety protocol (CRITICAL)

`/start-work` will only pick up a new plan when there is **no active boulder**. `boulder.json` is OmO's "currently-executing plan" pointer.

**Rule**: never delete `boulder.json` without first confirming the prior plan is terminal.

### Read-before-delete protocol

1. **Read `.sisyphus/boulder.json`**. If it doesn't exist → safe; no boulder to remove, write the new plan and stop.
2. If it exists, parse the JSON. Inspect these fields (observed shape, 2026-05-18):
   - `active_plan` — absolute path to the plan markdown.
   - `plan_name` — short slug.
   - `started_at` — ISO timestamp.
   - `session_ids` — array of OmO session IDs that have touched this boulder.
   - `task_sessions` — object: task key → worker-session metadata (`session_id`, `agent`, `category`, `updated_at`).
3. **Treat the boulder as IN-PROGRESS / PAUSED if any of these are true**:
   - `active_plan` resolves to a file that still exists.
   - `session_ids` array is non-empty.
   - `task_sessions` object has any entry.
4. **If in-progress/paused**: STOP. Do not delete. Surface to the user:
   - The active plan name + path.
   - When it was started.
   - The most recent `task_sessions` entry.
   - Ask explicitly: "There's an in-progress boulder for `{plan_name}` (last activity {updated_at}). Are you done with it, or do you want to keep it alive and just author the new plan without clearing the boulder?"
5. **Only after the user explicitly confirms the prior plan is done**: proceed to the cleanup step below.

### Cleanup step (only when user confirms prior plan terminal)

```bash
# 1. Delete boulder.json
rm .sisyphus/boulder.json

# 2. Optionally: clean evidence + notepads for the prior plan slug
#    Match exact slug + similar-name variants (the user explicitly wants this nicety).
PRIOR_SLUG="{prior plan_name}"

# Evidence (best-effort)
ls .sisyphus/evidence/ 2>/dev/null | grep -Ei "^${PRIOR_SLUG}(-|$|\.|_)"
# Show matches first, get user confirmation, then rm.

# Notepads for the prior plan slug (and close variants)
ls .sisyphus/notepads/ 2>/dev/null | grep -Ei "^${PRIOR_SLUG}(-session[0-9]+)?$"
# Show matches first, get user confirmation, then rm -rf each matched dir.
```

**Never delete evidence or notepads silently.** Always show the match list to the user and wait for explicit confirmation. The "similar name" rule is a nicety — show fuzzy matches, let the user decide.

### When the user is starting fresh

If `boulder.json` doesn't exist, no cleanup is needed. Just write the new plan to `.sisyphus/plans/{slug}.md`.

## 4. Plan workflow

### Step 1 — Interview (if requirements are unclear)

If the user's request is ambiguous, run a short interview (3-5 targeted questions max):

- Core objective in one sentence — what does success look like?
- Scope IN / Scope OUT — what's explicitly excluded?
- Test strategy — TDD, tests-after, or no tests + agent QA only?
- Tech constraints — language, framework, existing patterns to follow?
- Parallelism affordances — independent modules vs sequential dependencies?

Skip the interview if the user has already described the work in enough detail; jump straight to plan generation.

### Step 2 — Quick research

Use `Read`, `Glob`, `Grep` (or the Explore agent) to verify any file/symbol references you plan to put in the plan. Plans that cite files that don't exist will reject in Sisyphus's compliance audit.

### Step 3 — Write the plan

Use the template in § 6 below. Write to `.sisyphus/plans/{slug}.md`.

**Incremental-write protocol** (from Prometheus — applies here too):

- Write the skeleton (all sections except individual TODO bodies) with `Write`.
- Append TODO batches (2-4 tasks per `Edit` call) using `Edit` with `oldString="---\n\n## Final Verification Wave"` as the insertion anchor.
- Read the file back at the end to verify nothing was truncated.
- **Never call `Write` twice on the same file** — it overwrites the first call.

### Step 4 — Present summary, hand off

Present to the user:

```
## Plan Generated: {slug}

**Key Decisions Made:**
- [Decision 1]: [Rationale]

**Scope:**
- IN: [list]
- OUT: [list]

**Guardrails:**
- [Must-NOT-do]

Plan saved to: `.sisyphus/plans/{slug}.md`

Next step:
- Open OpenCode, run `/start-work {slug}` to dispatch Sisyphus.
- If a boulder.json was cleared, the workspace is ready.
- If a boulder.json was preserved (prior plan in-progress), pause this plan until that one is done.
```

Do not run `/start-work` yourself — it lives in OpenCode, not Claude Code.

## 5. Long-running execution context (load-bearing for huge-scope plans)

OmO is used almost exclusively for long-running work — typical runs are **12-24-48 hours, sometimes days**. Authoring plans for this needs three context pieces that Prometheus's upstream prompt does not state explicitly but which materially change plan shape.

### 5.1 Atlas — the long-running executor

Atlas (Claude Sonnet 4.6, the `5.4` model variant — **NOT `5.5`**) is the executor of choice for plans that take days. Atlas is unusual:

- **Hundreds of compactions.** Atlas tolerates and benefits from aggressive compaction — the `5.4` compaction implementation is the only one that **sharpens** context rather than degrading it. Long runs do not erode Atlas's grasp.
- **Exhaustive.** Atlas will surface every single occurrence of a pattern, issue, or scope item, no matter how many files or how many days the search takes. Exhaustiveness is its signature.
- **Mechanical only.** Atlas cannot plan. Atlas cannot do creative work during execution. Atlas cannot make judgment calls when the plan is ambiguous.

What this means for the plan you author:

- **Exhaustive in scope statement and explicit in mechanism.** Anything Atlas has to "figure out" will stall or produce wrong output.
- **Reference patterns must be concrete `file:line` citations.** "Use the existing auth pattern" → fail. `src/services/auth.ts:45-78 — JWT refresh-token handling` → succeeds.
- **Every task's `What to do` must read as a recipe, not a goal.** Atlas does not infer recipes from goals.
- **Never hesitate to author huge plans.** 50, 100, 200 TODOs is fine. The Single-Plan Mandate (§ 6.1) is a hard rule — one file, one plan, no matter the scope.

### 5.2 Execution modes — `single-shot` / `loop` / `hybrid-loop`

Prometheus + Atlas now support three execution shapes. The mode is part of the plan and shapes its phase structure.

| Mode                                     | When to pick                                                                                                                                                                                    | Plan shape                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `single-shot`                            | Scope fits one Atlas session without breaching a hard checkpoint (rare for 24h+ scope)                                                                                                          | One linear plan, no phase markers, no handover points            |
| `loop`                                   | Full scope is fully planned up front, but execution is chunked at critical gates / mandatory commits / time splits. Atlas hands back to Prometheus on phase completion OR on critical issues.   | Full plan + explicit phase markers + handover triggers per phase |
| `hybrid-loop` (**ideal for huge scope**) | Prometheus has good context on the full scope but **only plans the first phase in detail**. When Atlas hands over, a fresh Prometheus session inspects completed work and plans the next phase. | Phase 1 detailed + Phase 2+ outlined as scope-only headlines     |

**Default to `hybrid-loop` for any plan whose full scope cannot be Atlas-executed in a single session.** Single-shot is the exception, not the rule.

The user picks the mode. If they don't say, **ask once** — it changes plan structure significantly.

When mode is `loop` or `hybrid-loop`, insert a `## Phase Plan` section between TL;DR and Context (template in § 7).

### 5.3 Gates and mandatory commits — strong-language requirements (CRITICAL)

Gates and mandatory commits do **not happen** in long Atlas runs unless the plan states them in strong, unambiguous language. This is load-bearing.

**Write gates as imperatives, not as suggestions:**

- BAD: "It might be a good idea to run tests after this task."
- BAD: "Consider committing here."
- GOOD: "**MANDATORY GATE — STOP execution until all of: (a) `pnpm typecheck` returns exit 0, (b) `pnpm test` returns 0 failures, (c) `pnpm validate:all` returns exit 0. If ANY check fails, HANDOVER to Prometheus immediately.**"

**Every commit boundary must be:**

1. **Explicitly marked** as `COMMIT: MANDATORY` or `COMMIT: NO`.
2. **Named** with the exact commit message (`type(scope): imperative summary`).
3. **Scoped** with the exact file list to stage (never `git add -A`).
4. **Pre-commit gated** with the exact verification command(s).

Atlas will obey `COMMIT: MANDATORY` + an exact message. Atlas will NOT infer commit intent from prose. Weak language = no commits.

**Handover triggers (loop / hybrid-loop only) — write as a closed list per phase:**

```
HANDOVER TO PROMETHEUS IF ANY:
- Phase scope completed AND F1-F4 verdicts all APPROVE
- A gate failed and the cause is not in the plan's "Must NOT do" list
- A reference cited in the plan resolves to a non-existent file or symbol
- More than {N} tasks have been added beyond the plan's TODO list
- {custom trigger specific to this plan}
```

The plan is the contract. If Atlas is unsure, it must hand over. Stating that weakly leads to off-plan execution that's expensive to roll back.

### 5.4 Scope estimates — buckets, NOT time

Human-time estimates are nonsensical for these plans — Atlas's clock is not a human's clock, and Atlas-on-XL routinely takes 24+ hours by design. **Drop time framing entirely.**

The `Estimated Effort` field in the TL;DR uses **scope/complexity buckets**, not duration:

| Bucket   | Meaning                                                                                  |
| -------- | ---------------------------------------------------------------------------------------- |
| `Quick`  | One focused file edit, ≤2 acceptance criteria                                            |
| `Short`  | Single module, ≤5 acceptance criteria, no cross-cutting concerns                         |
| `Medium` | Multi-module, single bounded context, ≤15 acceptance criteria                            |
| `Large`  | Multiple bounded contexts, 15-50 acceptance criteria, cross-cutting work                 |
| `XL`     | Multi-package / migration / repo-wide / dependency-bump-cascade, 50+ acceptance criteria |

Use these as **organizing buckets** when sizing waves. Never as time estimates. Never write "this will take 2 hours" or "estimated 3 days" in a plan body.

---

## 6. Non-negotiable constraints (lifted from Prometheus Claude default)

These are the same rules that Sisyphus's plan-compliance audit will check. Violate them and the plan rejects at the F1 phase.

1. **Single plan mandate.** Everything goes into ONE file in `.sisyphus/plans/`. No multi-phase split plans. Large work = longer TODO list, not multiple files.
2. **Maximum parallelism principle.** Granularity rule: one task = one module/concern = 1-3 files. If a task touches 4+ files or 2+ unrelated concerns, SPLIT IT. Target 5-8 tasks per wave; <3 per wave (except the final integration wave) means under-splitting.
3. **Dependency minimization.** Extract shared dependencies (types, interfaces, configs, schemas) as early Wave-1 tasks so subsequent waves can fan out maximally.
4. **Zero-human-intervention verification.** Every acceptance criterion must be agent-executable: command, tool invocation, file/diff check. "User manually verifies/tests/confirms" is FORBIDDEN.
5. **QA scenarios are mandatory per task.** Minimum: 1 happy-path + 1 failure/edge case. Specific selectors, concrete test data, exact assertions, evidence file path. A task without QA scenarios is incomplete and will be rejected.
6. **Evidence paths use `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.**
7. **No retroactive scope creep in the plan body** — if mid-plan you discover scope is wrong, surface to the user and re-author, do not just edit silently around it.
8. **Markdown only.** The plan is `.md`. No JSON sidecars, no scripts.

## 7. Plan template (the deliverable shape)

This is the Prometheus Claude-default template, paths rewritten to `.sisyphus/`. Render this skeleton into `.sisyphus/plans/{slug}.md` and fill in the bracketed fields.

```markdown
# {Plan Title}

## TL;DR

> **Quick Summary**: [1-2 sentences capturing the core objective and approach]
>
> **Deliverables**: [Bullet list of concrete outputs]
>
> - [Output 1]
> - [Output 2]
>
> **Estimated Effort**: [Quick | Short | Medium | Large | XL] — scope bucket, NOT duration (see § 5.4)
> **Execution Mode**: [single-shot | loop | hybrid-loop] — see § 5.2
> **Parallel Execution**: [YES - N waves | NO - sequential]
> **Critical Path**: [Task X → Task Y → Task Z]

---

## Phase Plan

<!-- INCLUDE THIS SECTION ONLY IF Execution Mode is `loop` or `hybrid-loop`. Delete the section entirely for single-shot. -->

> **Mode**: loop | hybrid-loop
> **Current phase**: {N} of {total} (this plan body covers Phase {N})

### Phase 1 — {Title}

- **Scope**: [1-2 sentences capturing what this phase delivers]
- **End condition**: [Concrete trigger — e.g., "F1-F4 verdicts all APPROVE for tasks 1-N", or "Subsystem X compiles and tests green"]
- **Mandatory commit boundaries within phase**: [List the COMMIT: MANDATORY anchors that must land before phase end]
- **Handover trigger** (closed list — Atlas hands back to Prometheus if ANY):
  - Phase scope completed AND F1-F4 verdicts all APPROVE
  - A gate failed and the cause is not in the plan's "Must NOT do" list
  - A reference cited in the plan resolves to a non-existent file or symbol
  - More than {N} tasks have been added beyond this phase's TODO list
  - [Custom trigger specific to this plan]
- **Detail level**: full TODOs in this plan body

### Phase 2 — {Title} <!-- hybrid-loop only: outlined, not planned -->

- **Scope**: [1-2 sentences — what the next phase will cover]
- **Why deferred to fresh planning**: [Why we plan this fresh after Phase 1 lands — usually: needs inspection of Phase 1's actual implementation]
- **Detail level**: TBD by next Prometheus session

### Phase N — ... <!-- additional phases for loop mode (fully planned) or hybrid-loop (headline only) -->

---

## Context

### Original Request

[User's initial description verbatim]

### Interview Summary

**Key Discussions**:

- [Point 1]: [User's decision/preference]

**Research Findings**:

- [Finding 1]: [Implication]

---

## Work Objectives

### Core Objective

[1-2 sentences]

### Concrete Deliverables

- [Exact file / endpoint / feature]

### Definition of Done

- [ ] [Verifiable condition with command]

### Must Have

- [Non-negotiable requirement]

### Must NOT Have (Guardrails)

- [Explicit exclusion]
- [AI slop pattern to avoid: excessive comments, over-abstraction, generic names like `data`/`result`/`item`/`temp`]
- [Scope boundary]

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision

- **Infrastructure exists**: [YES/NO]
- **Automated tests**: [TDD / Tests-after / None]
- **Framework**: [bun test / vitest / jest / pytest / none]
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy

Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) — run command, send keystrokes, validate output
- **API/Backend**: Use Bash (curl) — send requests, assert status + response fields
- **Library/Module**: Use Bash (bun/node REPL) — import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

> Group independent tasks into parallel waves. Each wave completes before the next begins.
> Target: 5-8 tasks per wave. Fewer than 3 per wave (except final) = under-splitting.
```

Wave 1 (Start Immediately — foundation + scaffolding):
├── Task 1: [...] [quick]
├── Task 2: [...] [quick]
└── Task 7: [...] [quick]

Wave 2 (After Wave 1 — core modules, MAX PARALLEL):
├── Task 8: [...] (depends: 3, 5, 7) [deep]
└── Task 14: [...] (depends: 5, 10) [unspecified-high]

Wave 3 (After Wave 2 — integration + UI):
├── Task 15: [...] (depends: 6, 11, 14) [deep]
└── Task 20: [...] (depends: 16) [visual-engineering]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: [task chain → ...] → F1-F4 → user okay
Parallel Speedup: ~N% faster than sequential
Max Concurrent: [N] (Wave [k])

```

### Dependency Matrix (full — show ALL tasks)

- **1**: — / 8, 14 / 1
- **8**: 3, 5, 7 / 11, 15 / 2

> Format: `{task}: {blocked-by} / {blocks} / {wave}`

### Agent Dispatch Summary

- **Wave 1**: T1-T4 → `quick`, T5 → `quick`, T6 → `quick`, T7 → `quick`
- **Wave 2**: T8 → `deep`, T9 → `unspecified-high`, T14 → `unspecified-high`
- **Wave 3**: T15 → `deep`, T16 → `visual-engineering`
- **FINAL**: F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

- [ ] 1. [Task Title]

  **What to do**:
  - [Clear implementation steps]
  - [Test cases to cover]

  **Must NOT do**:
  - [Specific exclusions from guardrails]

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `[visual-engineering | ultrabrain | artistry | quick | unspecified-low | unspecified-high | writing | deep]`
    - Reason: [Why this category fits the task domain]
  - **Skills**: [`skill-1`, `skill-2`]
    - `skill-1`: [Why needed — domain overlap explanation]
  - **Skills Evaluated but Omitted**:
    - `omitted-skill`: [Why domain doesn't overlap]

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave N (with Tasks X, Y) | Sequential
  - **Blocks**: [Tasks that depend on this task completing]
  - **Blocked By**: [Tasks this depends on] | None (can start immediately)

  **References** (CRITICAL — Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `path/to/file.ts:45-78` — [why this pattern applies]

  **API/Type References** (contracts to implement against):
  - `path/to/types.ts:TypeName` — [shape this code must satisfy]

  **Test References** (testing patterns to follow):
  - `path/to/test.ts:describe("...")` — [test structure to mirror]

  **External References** (libraries and frameworks):
  - Official docs: `https://...` — [exact section + what to use]

  **WHY Each Reference Matters**:
  - [Don't just list files — explain what pattern/info to extract]
  - Bad: `src/utils.ts` (vague, which utils? why?)
  - Good: `src/utils/validation.ts:sanitizeInput()` — use this sanitization pattern for user input

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — no human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **If TDD (tests enabled):**
  - [ ] Test file created: path/to/test.ts
  - [ ] [test command] → PASS (N tests, 0 failures)

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.

```

Scenario: [Happy path — what SHOULD work]
Tool: [Playwright / interactive_bash / Bash (curl)]
Preconditions: [Exact setup state]
Steps: 1. [Exact action — specific command/selector/endpoint] 2. [Next action — with expected intermediate state] 3. [Assertion — exact expected value]
Expected Result: [Concrete, observable, binary pass/fail]
Failure Indicators: [What specifically would mean this failed]
Evidence: .sisyphus/evidence/task-{N}-{scenario-slug}.{ext}

Scenario: [Failure/edge case]
Tool: [same format]
Preconditions: [Invalid input / missing dependency / error state]
Steps: 1. [Trigger the error condition] 2. [Assert error is handled correctly]
Expected Result: [Graceful failure with correct error message/code]
Evidence: .sisyphus/evidence/task-{N}-{scenario-slug}-error.{ext}

````

> **Specificity requirements:** specific CSS selectors, concrete test data, exact assertions, wait conditions where relevant, at least ONE failure/error scenario per task.
>
> **Anti-patterns (scenario is INVALID if it looks like this):**
> - "Verify it works correctly" — HOW? What does "correctly" mean?
> - "Check the API returns data" — WHAT data? WHAT fields?
> - "Test the component renders" — WHERE? WHAT selector?
> - Any scenario without an evidence path

**Evidence to Capture:**
- [ ] Each evidence file named: `task-{N}-{scenario-slug}.{ext}`
- [ ] Screenshots for UI, terminal output for CLI, response bodies for API

**Commit**: MANDATORY | NO (groups with N)
- **If MANDATORY**: Atlas MUST commit at this boundary. Weak language = no commit.
- Message: `type(scope): imperative summary` (exact, no placeholders)
- Files: `path/to/file1`, `path/to/file2` (exact, no `git add -A`)
- Pre-commit gate: `exact verification command(s)` — STOP commit on non-zero exit

**Gate after this task** (if applicable):
- **MANDATORY GATE**: [exact condition — e.g., "`pnpm typecheck && pnpm test` must return exit 0"]
- **On gate failure**: HANDOVER to Prometheus immediately (do NOT silently retry, do NOT mask)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user; wait for explicit "okay" before completing.
>
> **Never mark F1-F4 as checked before getting user's okay.**

- [ ] F1. **Plan Compliance Audit** — `oracle`
Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
Run `tsc --noEmit` + linter + `bun test` (or this repo's equivalent: `pnpm typecheck && pnpm test && pnpm validate:all`). Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `type(scope): desc` — file.ts, `pnpm typecheck && pnpm test` (or this repo's pre-commit chain)

---

## Success Criteria

### Verification Commands
```bash
command  # Expected: output
````

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] All evidence files exist in `.sisyphus/evidence/`
- [ ] F1-F4 verdicts all APPROVE
- [ ] User explicit "okay" recorded

---

```

## 8. What you do NOT do here

- **No Metis / Oracle / Momus dispatch.** Those are OmO-internal agents Claude Code cannot dispatch. If the user explicitly wants Momus high-accuracy review, surface that they need to open OpenCode and run the plan through Prometheus directly (this skill is the lightweight Claude-side path).
- **No `/start-work` invocation.** That command lives in OpenCode. Tell the user to run it themselves.
- **No execution.** Even if the user begs. Generate the plan, hand off, done.
- **No drafts.** Single-shot authoring — the final plan IS the artifact.
- **No edits to anything outside `.sisyphus/plans/{slug}.md`** (and conditionally `.sisyphus/boulder.json` + matched evidence/notepads on explicit cleanup).

## 9. Provenance

Source of truth for the Prometheus Claude-default plan format:

- `~/dev-projects/pi-setup-hq/reference-repos/oh-my-openagent/src/agents/prometheus/plan-template.ts` — markdown template body
- `~/dev-projects/pi-setup-hq/reference-repos/oh-my-openagent/src/agents/prometheus/identity-constraints.ts` — single-plan mandate, max-parallelism, markdown-only, incremental write protocol
- `~/dev-projects/pi-setup-hq/reference-repos/oh-my-openagent/src/agents/prometheus/plan-generation.ts` — workflow phases (Metis / Oracle / Momus — out of scope for Claude Code use)

If Prometheus changes its template upstream, refresh this skill against those files. The Claude-default variant is selected by `getPrometheusPrompt()` when the agent's model is not GPT and not Gemini.
```
