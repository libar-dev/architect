# Process API Validation Learnings

> **Purpose:** Consolidated learnings from the first real-world validation of the Process API
> during a design session for DataAPIDesignSessionSupport.
>
> **Branch:** `feature/process-api-cli`
> **Date:** 2026-02-07
> **Session:** Design session using Opus 4.6, 10m 57s, 59% context consumed

---

## 1. Effectiveness Baseline

### API Command Usage (Measured In-Session)

| Command                    | Value      | What It Replaced                                     |
| -------------------------- | ---------- | ---------------------------------------------------- |
| `context --session design` | **High**   | 2 explore agents for metadata + dependency status    |
| `stubs <pattern>`          | **High**   | glob+grep for stub existence check (instant vs ~30s) |
| `dep-tree`                 | **Medium** | Manual dependency chain verification                 |
| `status`                   | **Medium** | Pattern count confirmation after stub creation       |
| `overview`                 | **Low**    | Project health context (nice but not essential)      |
| `search`                   | **Low**    | Confirmed pattern visibility in pipeline             |

**Result: ~60% explore agent elimination on first use with a simple 4-deliverable spec.**

### What Still Required File Reads

| File Read                      | Why                                             | Category      |
| ------------------------------ | ----------------------------------------------- | ------------- |
| Spec file (full scenario text) | Design decisions need acceptance criteria text  | Comprehension |
| Context-assembler.ts           | Understanding type/interface patterns to follow | Comprehension |
| Context-formatter.ts           | `=== MARKERS ===` formatting conventions        | Comprehension |
| Existing ADR/PDR format        | Template for decision spec structure            | Comprehension |

**Key insight:** All file reads were for _comprehension_ (how things are built), not _navigation_ (what exists and how it relates). The API covers navigation completely. This boundary is correct and should not be crossed.

### Explore Agent Breakdown

The single explore agent launched during the session consumed 29 tool calls across ~2 minutes. Its work broke down as:

| Task                                    | Tool Calls | Could API Replace?                                                  |
| --------------------------------------- | ---------- | ------------------------------------------------------------------- |
| Read ProcessStateAPI method signatures  | 5          | No — comprehension query                                            |
| Read CLI subcommand routing pattern     | 4          | No — implementation pattern learning                                |
| Read context-assembler types/functions  | 6          | Partially — types are comprehension, but function list could be API |
| Read stub-resolver functions            | 3          | Partially — `stubs` command covers existence, but not internal API  |
| Read context-formatter conventions      | 3          | No — formatting pattern learning                                    |
| Search for discovery tag extraction     | 4          | No — implementation detail                                          |
| Check existing stub directory structure | 4          | Yes — `stubs` command covers this                                   |

**Observation:** ~15% of explore agent work (stub directory checks) was redundant with API commands. The agent launched the explore agent early before fully leveraging CLI commands. In future sessions, the prompt should explicitly say "run API commands FIRST, then launch explore agents only for comprehension questions."

### Token Efficiency

| Metric                  | Pre-API (estimated) | With API | Reduction    |
| ----------------------- | ------------------- | -------- | ------------ |
| Total tokens            | 250-300K            | 189K     | 25-35%       |
| Explore agents launched | 5-7                 | 1        | ~80%         |
| Context consumed        | ~80%                | 59%      | 25% headroom |

---

## 2. Navigation vs. Comprehension Split

The API answers **graph queries** (what exists, what depends on what, what's blocking).
File reads answer **content queries** (how is this implemented, what patterns does it follow).

These are genuinely different concerns. Merging them would bloat the API without improving session quality.

**Scale prediction:** In the monorepo, the navigation problem grows quadratically (cross-package deps, shared contexts, multi-package stubs) while comprehension stays linear (you read one file at a time). The API's value increases disproportionately with codebase size.

**Monorepo estimate:** 75-80% explore agent elimination once the deliverables gap (item 3A below) is closed. The remaining 20-25% is the irreducible minimum — reading implementation files to understand their patterns.

---

## 3. Priority Improvements

### 3A. Include deliverables table in `context --session design` [HIGH — Do Before Monorepo Bump]

**Gap:** `context --session design` omits the deliverables table. The session-type inclusion matrix in `context-assembler.ts` shows deliverables only for `implement`.

**Impact:** During the design session, the agent had to read the spec file separately to see the 4 deliverables. The deliverables table defines stub targets — it's critical input for design sessions.

**Fix:** In the session-type inclusion matrix, enable deliverables for `design` sessions. The data is already computed; it just needs to be included in the output.

**Estimated effort:** Small — a few lines in `context-assembler.ts` and `context-formatter.ts`.

### 3B. Extend description in context output [HIGH — Bundle with 3A]

**Gap:** `context --session design` truncates the pattern description to the first line. The agent received: "Starting a design or implementation session requires manually compiling elaborate context prompts." — just the first sentence.

**Impact:** The full Problem/Solution block is the actual design input. Including the first paragraph (or first 5-10 lines) would make the design context self-contained.

**Fix:** In `summarizePattern()` or the context formatter, extend description to include the full Problem/Solution block rather than truncating at first line.

**Estimated effort:** Small — adjust truncation logic in the summarizer or formatter.

### 3C. `pattern --full` with scenario text [MEDIUM — Next PR]

**Gap:** The biggest file read was the spec itself — specifically Rule descriptions with validation checklists and acceptance criteria scenarios.

**Impact:** A command like `pattern <name> --full` that includes extracted scenario names and Rule descriptions (not full Gherkin syntax, just structured content) would eliminate spec file reads during design sessions.

**Fix:** Requires extracting Rule descriptions from the Gherkin AST output. The data exists in `ExtractedPattern` (scenarios, rules, descriptions are parsed) but isn't surfaced through the CLI.

**Estimated effort:** Medium — needs Gherkin content extraction and formatting.

### 3D. Decision specs not visible in `process:query` [LOW — Awareness Only]

**Observation:** `pnpm process:query -- search PDR002` returned no matches because the `process:query` script's `--features` glob only includes `specs/*.feature` and `releases/*.feature`, not `decisions/*.feature`.

**Impact:** Low — decision specs are a different concern (architectural decisions, not delivery patterns). They're correctly scanned by `pnpm docs:decisions` and `pnpm docs:changelog`. However, when `scope-validate` checks for PDR references (the `design-decisions-recorded` check), it will need to look at stub `extractDecisionItems()` output, not search for decision patterns.

**Action:** No change needed. The current pipeline scope is correct. This is documented here for awareness during `scope-validate` implementation.

### 3E. Deprioritize CLI Ergonomics (Caching/REPL)

**Agent observation:** "The CLI response times (~5s per command) were fine for session use. The bottleneck isn't speed — it's information completeness per command."

**Action:** DataAPICLIErgonomics stays deferred. Improving output quality per command (3A, 3B, 3C) has higher ROI than making commands faster.

---

## 4. Design Quality Improvements Observed

The design session with API access produced noticeably better decisions than prior sessions in this PR:

| Aspect                    | Prior Sessions                         | API-Assisted Session                                              |
| ------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Pure function discipline  | Mixed — some shell deps in core logic  | Strict — git integration opt-in via `--git` flag, core logic pure |
| Cross-cutting consistency | Ad-hoc severity levels                 | Mapped to Process Guard's existing BLOCKED/WARN model             |
| File organization         | Cargo-culted assembler/formatter split | Pragmatic co-location justified by simplicity                     |
| Composability             | Monolithic validators                  | Individual check functions, each independently testable           |
| Code duplication          | Significant across 4 implemented specs | Identified and addressed — reuse of existing building blocks      |

**Hypothesis:** Better navigation → better architectural awareness → better design decisions. When the agent can quickly see how existing code is structured (via `arch neighborhood`, `stubs`, `context`), it makes decisions that align with established patterns rather than inventing ad-hoc solutions.

---

## 5. Monorepo Integration Plan

### Commands to Validate First

| Command                    | Why It Matters at Scale                                              | Test Case                                                     |
| -------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| `arch compare`             | Cross-BC comparison across packages — impossible with explore agents | Compare `orders` and `inventory` bounded contexts             |
| `arch coverage`            | Annotation gaps across 6 packages — hopeless manually                | Run across full monorepo scan                                 |
| `dep-tree`                 | Cross-package dependency chains                                      | `dep-tree AgentChurnRiskCompletion` (spans DS-1 through DS-4) |
| `arch neighborhood`        | Cross-package relationships                                          | `arch neighborhood EventStore` (used by everything)           |
| `context --session design` | Multi-package session context assembly                               | DS-3 (LLM Integration — depends on DS-2 outputs)              |

### Pre-Bump Checklist

- [ ] Fix 3A: Include deliverables in `--session design` context
- [ ] Fix 3B: Extend description to full Problem/Solution block
- [ ] Update CLAUDE.md with new subcommand documentation
- [ ] Commit and update dist
- [ ] Bump package version in monorepo
- [ ] Update monorepo's DESIGN-SESSION-GUIDE.md with Process API commands
- [ ] Run DS-3 as first monorepo validation

### Prompt Template (Validated)

```markdown
## Design Session: <SpecName>

Design session for the next spec: **<SpecName>** (Phase X, N deliverables, M subcommands: `cmd1`, `cmd2`).

Dependencies are done: <DepA> + <DepB> both completed.

### Session rules

- This is a design session — no implementation code, no FSM transitions.
- Record decisions as `.feature` files in `delivery-process/decisions/`.
- Code stubs go in `delivery-process/stubs/<SpecName>/`.
- Make breaking changes freely — nothing is released.

### Process API commands

Run these FIRST for context gathering, BEFORE launching explore agents:

    pnpm process:query -- context <SpecName> --session design
    pnpm process:query -- dep-tree <SpecName>
    pnpm process:query -- overview
    pnpm process:query -- stubs <SpecName>
    pnpm process:query -- arch neighborhood <DependencyPattern>
    pnpm process:query -- list --status completed --names-only

Only use explore agents for comprehension questions (implementation patterns,
formatting conventions, type definitions) that the API doesn't cover.

### Effectiveness log

At session end, note:

1. Which API commands you used and what they provided
2. Where you still needed explore agents or file reads
3. Any missing information in command output

### Key context

@process-api-integration-assessment.md
@docs/INDEX.md
@docs/METHODOLOGY.md
@docs/SESSION-GUIDES.md
```

### Prompt Learnings

| Observation                                                                 | Improvement                                                            |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Agent launched explore agent before exhausting API commands                 | Added "Run these FIRST" + "Only use explore agents for comprehension"  |
| `@file` references in prompt were critical for providing assessment context | Keep `@process-api-integration-assessment.md` as standard reference    |
| Session rules (no impl, no FSM) were respected perfectly                    | Lean rules work — no need for verbose guardrails                       |
| Effectiveness log was self-reported honestly by the model                   | Trust the model to self-report; the log is the key validation artifact |

---

## 6. Self-Referential Validation

The design session designed `scope-validate` (pre-flight session check) and `handoff` (session state capture) — the very tools the session would have benefited from. Key observations:

- `scope-validate` would have automated the "are my deps done? can I transition?" checks done manually via `dep-tree` + `overview`
- `handoff` would have captured the effectiveness log automatically
- The stubs immediately appeared in the pipeline (pattern count 152 → 154), validating the annotation system
- `stubs DataAPIDesignSessionSupport` instantly confirmed new stubs were scanned — would have required glob+grep before
- `status` command showed pattern count jump 152 → 154 and planned count 28 → 30 — the stubs are immediately tracked as planned patterns with real-time pipeline feedback
- The handoff-generator stub references `SessionType` from context-assembler — cross-stub imports won't resolve (stubs aren't compiled) but the `@libar-docs-uses` annotation correctly captures the dependency for the pipeline

---

## 7. Key Numbers Summary

| Metric                        | Value                                       |
| ----------------------------- | ------------------------------------------- |
| Explore agent elimination     | 60% (conservative baseline)                 |
| Token reduction               | 25-35%                                      |
| Context headroom              | 41% remaining (vs ~20% in pre-API sessions) |
| Session duration              | 10m 57s                                     |
| Files created                 | 3 (1 decision spec, 2 code stubs)           |
| Design decisions              | 7 (DD-1 through DD-7)                       |
| Monorepo prediction           | 75-80% elimination after 3A fix             |
| Irreducible file-read minimum | 20-25% (comprehension queries)              |
