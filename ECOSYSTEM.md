<!--
  Libar ecosystem — session context primer (PRIVATE).
  Purpose: give any AI session across the Libar repos the cross-repo context that is
  otherwise missing at session start. Point a session here first, then load the repo's
  own AGENTS.md / CLAUDE.md. Assembled 2026-05-27; correct freely — the owner is the source of truth.
-->

# Libar Ecosystem — Session Context Primer

**One paragraph:** There is one decade-deep idea — a durable, realtime, event-sourced, provenance-linked **typed graph** of domain state — expressed across several repos. The **platform** is the crown jewel and the only thing validated in production; everything else (Architect, Studio, Libar PM, the agent runtime) is a **tool or product-experiment built _with_ or _around_ it**. Patterns are the IP: evergreen design ideas, continuously refined, re-substantiated onto whatever infrastructure the era provides. Do not over-index the satellites; weigh design against the platform, not against the toys.

## The crown jewel — `libar-platform` (the platform)

- **Path:** `~/dev-projects/new-convex-es/libar-platform`
- **What:** Convex-native **DDD / ES / CQRS** platform. Bounded contexts as _physically-isolated Convex components_ with cross-boundary execution guarantees; event store, EventBus, CommandOrchestrator, DCB (dynamic consistency boundaries), deciders, sagas, process managers, reactive projections, fat/ECST events, reservation pattern, workpool partitioning, durable function adapters, event replay. Plus **Agent-as-BC**: AI agents modeled as first-class bounded contexts (subscribe to events, checkpoints, 16-type audit, approvals, lifecycle FSM, rate/cost guards, dead letters).
- **Status (owner):** working, **not aspirational** — runs validated startup MVPs (one solo, one with two co-founders). Snapshot seen: ~150 patterns, ~90 completed.
- **Weight:** **bedrock.** This is the thing. Its value does not depend on any satellite below.

## Origin & lineage — the patterns are the IP

- **2015 — Meteor Space** (`~/dev-projects/space-mvp`, still open-source on GitHub). A by-the-book DDD/ES/CQRS framework, built from passion, ahead of its time, no product ambition. CoffeeScript + hand-built messaging, broker, isolation infra. **The 50+ pattern catalog** (`space-mvp/_reference/pattern-catalog.md`) is the seed — it even carries an explicit _"Translating to Convex"_ table.
- **The hinge:** in 2015 the _infrastructure was the tax_ — you hand-built the broker/isolation/messaging just to express the patterns. Convex now **provides** that as primitives (components = isolation, workflows = aggregates/sagas, reactivity = projections, workpool = durable processing). Same catalog, tax removed. **The IP was never the code; it was the pattern judgment**, re-substantiated three times (Meteor Space → extracted catalog → Convex platform).

## What Architect actually is (counterintuitive — read carefully)

Architect is **not** a documentation generator. It is an **AI-native language for software delivery**:

- **Git commits + annotated code are the immutable event store.** Architect _state is code_.
- **Requirements at every maturity level are code too** — idea/candidate/design specs (Gherkin), code stubs, executable Gherkin — all suspended in one **PatternGraph** (the read model).
- **Everything else is a projection** off that graph: docs, PRDs, CLI/MCP context bundles, Studio view-state. _(Tonight's hand-written package PRDs were literally Architect projections, produced by hand because this instance can't yet.)_
- **Why it works:** it front-loads design into a _graph-connected_ spec — specs ↔ stubs ↔ annotated Gherkin ↔ implemented code — so **there is nothing to invent at implementation time.** Designs are authored and reviewed iteratively (as related groups and individually); you never "pull the trigger" before the graph is ready.
- **The proof:** the platform was built with **Sonnet 3.x at 2–5 min autonomy**, on prompts as short as `Please implement: <feature>.feature` — _end of prompt_. Complexity lived in the reviewed graph, not the implementation session.

> ⚠️ **This repo (`~/dev-projects/architect`) is mid-rearchitecture — "refactored to pieces," disposable state.** Its annotations and process state are scaffolding to _replace, not reconcile_. The _proven_ expression of Architect's value is the methodology that built the platform; this standalone package family (also colocated in `architect-studio/packages/architect-*`) is being rebuilt lean. See `~/.claude/plans/we-have-a-huge-iterative-frost.md` and `packages/PRD-INDEX.md` for the current subtraction plan.

## The satellites (tools & experiments around the platform)

| Repo                     | Path                              | Role                                                                                                                                                                                                                             | Weight     |
| ------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **architect** (this)     | `~/dev-projects/architect`        | The AI-native delivery language / engine — typed PatternGraph, projection Views, FSM + drift gates. Mid-rebuild.                                                                                                                 | tool       |
| **architect-studio**     | `~/dev-projects/architect-studio` | The shell/host — Electron + cloud, `libar-ui` design system; consumes Architect projections as live view-state. Architect packages currently colocated here.                                                                     | tool/shell |
| **libar-agent**          | `~/dev-projects/libar-agent`      | Pi-native **orchestration runtime/harness** (10 agents, `task` delegation, background runtime). The "lightweight orchestration engine" Agent-as-BC was the only thing missing. _Seam: no skills system wired yet._               | runtime    |
| **pm-skills** (Libar PM) | `~/dev-projects/pm-skills`        | Product-experiment: an evidence-linked PM workspace. 65 skills · 36 wizard-commands · 8 journeys/paths · static Ladle UI + JTBD specs. Validation-stage; "almost a working product" because the skills already run in a harness. | experiment |

## The through-line — one primitive, many altitudes

An **event-sourced, provenance-linked, lifecycle-stated, decaying typed graph** recurs at every layer:

- **platform** = the canonical instance (events, aggregates, projections, sagas, BCs).
- **architect** = the same pattern applied to _delivery knowledge_ (code = events, git = store, PatternGraph = read model, dangling/determinism = consistency gate).
- **Libar PM** = the same pattern applied to _evidence_ (artifacts = aggregates, citations/"drives" = edges, evidence decay = reactive projection + process-manager-on-monitor-event). Its moat (provenance + decay) is an _emission_ of the platform, not a new build.
- **Agent-as-BC** = even the worker is a node in the graph.

## How they compose (if/when PM graduates from validation)

`architect-studio` (shell) renders → `pm-skills` (product) executed by → `libar-agent` (runtime, = Agent-as-BC orchestration) persisting/projecting through → `libar-platform` (foundation). Each seam is explicit; each layer is independently validatable. **But composition is a possibility, not a dependency** — the platform stands alone, validated.

## How to use this primer

1. Read this first for cross-repo orientation; then the repo's own `AGENTS.md`/`CLAUDE.md`.
2. **Trust live state over narrative.** Where a working surface (the platform's running code, `pnpm architect:query` output) disagrees with this doc, the live surface wins; flag the drift.
3. **The platform is the reference for "what good looks like"** — judge design against it (a live composed view), never against generated markdown.
4. Patterns are durable; implementations are substrate. When in doubt, preserve the _design idea_, re-substantiate the code.
