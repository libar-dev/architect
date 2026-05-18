---
workflowType: ux-design
project_name: "@libar-dev/architect-* (architect package family)"
date: "2026-05-17"
synthesize_mode: "yolo"
inputDocuments:
  - docs/reverse-engineering/visual-design-system.md
  - docs/reverse-engineering/business-context.md
  - docs/reverse-engineering/functional-specification.md
coverage_score: 45
---

# Architect — UX Design Specification

> **Status: no graphical UI.** The `@libar-dev/architect-*` package family ships **no browser, mobile, or desktop UI**. The standard UX specification (component inventory, design tokens, breakpoints, WCAG-aligned accessibility) does not apply. This document captures the **presentation conventions** the CLI, MCP, and markdown projection actually use — the closest analogue this codebase has to a "design system." Many sections below are marked `[UNAVAILABLE]` rather than fabricated.

---

## User Personas

(See `prd.md` for the full treatment. One-paragraph journey maps here.)

### Persona 1: AI-augmented developer (primary)

**Profile.** A TypeScript-fluent engineer using Claude Code, OpenCode, Cursor, or a similar AI coding harness on a serious project. Comfortable with breaking changes in pre-1.0 releases.

**Journey map:**

1. **Discover.** Reads `README.md` or the methodology RFC. Decides the AI-context problem is worth investing in.
2. **Install.** `pnpm add -D @libar-dev/architect`. Authors `architect.config.ts` with `defineConfig(...)`.
3. **Wire.** Adds MCP server to `.mcp.json`; adds `architect:*` scripts to `package.json`; adds `pnpm architect:guard --staged` to lint-staged.
4. **Annotate.** Tags TypeScript files with `@architect-pattern`, `@architect-uses`, `@architect-role`. Reruns `pnpm architect:overview` to confirm the agent sees them.
5. **Use.** Day-to-day: agent reads the PatternGraph via MCP, runs `scope-validate` before design / implement, calls `handoff` at session end. Maintainer reviews `pnpm validate:all` output before merging.
6. **Evolve.** Updates pinned version when changeset notes accept the breaking change. Reads `MIGRATION.md`. Adopts new doctrine.

**Touchpoints:** `pnpm` scripts, `.mcp.json`, `architect.config.ts`, generated `docs-live/`, terminal output, agent-rendered tool responses.
**Emotions:** *(designed-for)* — confident the agent sees the same reality the human does; trusting the FSM to catch process drift; minimal friction modifying patterns.
**Pain points:** *(latent)* — first-time annotation effort; two-Gherkin-parser confusion (well-documented but still a footgun); breaking changes between pre-1.0 versions.

### Persona 2: AI coding agent (secondary, non-human)

**Profile.** Claude Code, OpenCode, or any MCP-aware coding agent.

**Journey map:**

1. **Bootstrap session.** The architect-session-router skill loads first; resolves intent (planning / design / implement / refactor / review / handoff).
2. **Pull context.** Calls `architect_overview` (recommended first call per the MCP server-instructions string), then `architect_scope_validate` for the target pattern.
3. **Read fragments, not files.** Consumes `SessionContextBundle`, `ScopeReadinessReport`, `PatternDetail` — never `Read`/`Glob`/`Grep` if the Data API offers the answer.
4. **Act.** Modifies code or specs; subject to ProcessGuard via pre-commit.
5. **Handoff.** Calls `architect_handoff` to emit `HandoffRecord` for the next session.

**Touchpoints:** MCP tool registry, JSON tool responses, the nine `.agents/skills/SKILL.md` files.
**Emotions:** *(N/A — non-human persona)*; success criteria are deterministic verdict words and stable typed shapes.
**Pain points:** *(latent)* — verdict prose changing without version bumps; tool-count discrepancy between docs and registry (Known Issue #2); stale cached PatternGraph (mitigated by `architect_rebuild` or `--watch`).

### Persona 3: Architect maintainer (tertiary)

**Profile.** CODEOWNER / committer on this repo.

**Journey map:** Lands PRs against the package family, runs `pnpm release` on the changesets cycle, tracks W1.5 backlog in `REMAINING-WORK.md`, graduates the spec at v1.0.

**Touchpoints:** Local CLI + MCP, `.changeset/`, `MAINTAINERS.md`, `REMAINING-WORK.md`, `docs/DOCS-GAP-ANALYSIS.md`.

---

## Design Constraints

(From `business-context.md` Business Constraints and `functional-specification.md` System Boundaries.)

### Hard constraints

- **No graphical UI.** CLI + MCP + markdown only.
- **No color-only signaling.** Structural cues (verdict words, headings, prefixes) over color — output must remain useful in piped / no-tty contexts.
- **No telemetry, no analytics.** The platform is committed to local-only execution.
- **Local trust boundary.** MCP runs as a child process of the agent under the user's account; no auth surface.
- **Deterministic output.** Re-running over the same source must produce byte-identical artifacts (`docs-live/`).

### Soft constraints

- **Two output modes:** human-readable text (default) and `--format json` for tooling. JSON is the contract; text is a rendering.
- **GitHub-flavored markdown** as the only generated-doc target. No HTML escape hatch.
- **Mermaid diagrams** used for dependency graphs and FSM state diagrams; consumers must render Mermaid downstream.
- **`camelCase` JSON keys** — matches the Zod schema conventions across the codebase.

---

## Component Inventory

**`[UNAVAILABLE - no UI component library exists]`**

The platform has no UI components. The closest analogues are:

- **CLI subcommands** (24 on `architect`, plus 6 other bins) — cataloged in `architecture.md` §API Contracts and `docs/CLI.md`.
- **MCP tools** (21) — cataloged in `architecture.md` §API Contracts.
- **Projection Fragments** (`PatternSummary`, `PatternDetail`, `OverviewDigest`, `ScopeReadinessReport`, `SessionContextBundle`, `HandoffRecord`, etc.) — the typed shapes returned by every CLI/MCP call. Cataloged in `data-architecture.md` §3.

If a UI is ever added (e.g., a web dashboard for the PatternGraph), this section should be rewritten from scratch.

---

## Design Tokens

**`[UNAVAILABLE - no design token system exists]`**

The platform ships no design tokens. The closest analogues:

- **Verdict vocabulary:** `PASS` / `BLOCKED` / `WARN` — appears on its own line, designed as the parse target for both humans and CI. Stable contract (per PDR-001 DD-4).
- **Severity vocabulary:** `error` / `warning` / `info` (matches ProcessGuard).
- **Status vocabulary:** `candidate` / `roadmap` / `active` / `completed` / `deferred`.
- **Maturity vocabulary:** `idea` / `plan` / `design` / `executable`.

These are the load-bearing "tokens" of the platform — their stability is what consumers depend on.

---

## Responsive Design

**`[UNAVAILABLE - terminal + markdown only]`**

Not applicable. Terminal width is detected at print time for fixed-column tables (`overview`, `status`, `list`). No breakpoints, no media queries.

---

## Accessibility Requirements

Not applicable in the WCAG sense. The accessibility commitment in this codebase is:

- **Human-readable text output** in default CLI mode — no color-only signaling for critical state.
- **Machine-readable JSON output** for every verb — agents and CI can parse without screen-scraping.
- **Deterministic verdict words** (`PASS` / `BLOCKED` / `WARN`) so downstream systems do not need to interpret prose.
- **Pattern-first headings** in generated markdown — each section is anchored by a pattern ID, not by file path. Cross-doc links stay stable when files move.

---

## User Flows

The closest analogues to user flows in this codebase are the **session-skill workflows** under `.agents/skills/` — each session skill is a documented multi-step agent workflow with its own preamble + canonical CLI bootstrap.

### Flow 1: New session bootstrap

```
Agent loads architect-session-router skill (kernel)
  ↓
Router resolves intent: planning | design | implement | review | refactor | handoff
  ↓
Router loads architect-data-api skill (kernel) — canonical CLI/MCP reference
  ↓
Router hands off to matching session skill (one of 7 downstream skills)
  ↓
Session skill issues canonical CLI bootstrap:
    pnpm architect:query -- overview
    pnpm architect:query -- scope-validate <pattern> <intent>
    pnpm architect:query -- context <pattern>
  ↓
Agent receives typed fragments, begins work
```

### Flow 2: Design-to-implementation transition

```
Author tier-1 idea (status: candidate, ≤30 lines)
  ↓
Promote to candidate (status: candidate, +open questions)
  ↓
Promote to plan (status: roadmap)
  ↓
Promote to design (status: active, deliverables + stubs)
  ↓
scope-validate design → PASS
  ↓
scope-validate implement → PASS
  ↓
Implement (annotated production code + executable Gherkin)
  ↓
Status: completed (hard-locked)
  ↓
Delete the design spec (per ADR-003 ephemeral-spec rule)
```

### Flow 3: Pre-commit gate

```
git commit
  ↓ (pre-commit hook)
pnpm exec architect-guard --staged
  ↓
ProcessGuard runs 6 rules: completed-protection, scope-creep,
                            invalid-status-transition, session-scope,
                            session-excluded, deliverable-removed
  ↓
Exit 0: commit proceeds.
Exit 1: commit blocked. Fix the violation, re-stage, re-commit.
```

### Flow 4: CI gate

```
PR opened / push to main
  ↓
pnpm typecheck && pnpm format:check && pnpm lint
  ↓
pnpm test (2828 tests)
  ↓
pnpm validate:all (DoD + anti-patterns)
  ↓
pnpm guard:no-suppressions
  ↓
pnpm exec architect-guard --all --strict
  ↓
Projection perf regression gate (baseline × 1.5)
  ↓
Merge enabled, or block with structured error.
```

(Note: the CI workflow file itself is currently absent from this worktree — see `prd.md` Known Issues #5.)

---

## Key User Journeys

(Reframed from `functional-specification.md` user stories.)

### Journey 1: First-time consumer adoption

**As an** AI-augmented developer adopting the platform for the first time, **I want** to install, configure, and wire the MCP server, **so that** my agent has structured access to my codebase within an hour.

1. Install: `pnpm add -D @libar-dev/architect`.
2. Author `architect.config.ts` at repo root via `defineConfig(...)` — define `roles`, `productAreas`, `sources.typescript`.
3. Add `architect:*` scripts to `package.json` (mirror this repo's naming).
4. Wire `.mcp.json` for Claude Code (or `claude_desktop_config.json` for Claude Desktop) per `docs/MCP-SETUP.md`.
5. Annotate the first few patterns with `@architect-pattern:Foo` JSDoc tags.
6. Run `pnpm architect:overview` — confirm `Foo` is enumerated.
7. Add `pnpm exec architect-guard --staged` to `lint-staged.config.mjs`.
8. Done.

### Journey 2: Agent picks up an in-flight campaign

**As an** AI coding agent joining a campaign mid-flight, **I want** to bootstrap session context without re-reading every file, **so that** the human doesn't have to re-explain the state of the work.

1. Load `architect-session-router` skill.
2. Detect intent (e.g., "implement pattern Foo").
3. Call `architect_overview` — get the current health snapshot.
4. Call `architect_scope_validate Foo implement --strict` — confirm `PASS`.
5. Call `architect_context Foo --session implement` — get `SessionContextBundle` with deps, stubs, deliverables, FSM state, related test files.
6. Begin work.
7. On session end, call `architect_handoff Foo --session implement --modifiedFile <path>` — emit `HandoffRecord` for the next session.

### Journey 3: Maintainer cuts a release

**As an** Architect maintainer ready to ship `2.0.0-pre.N`, **I want** the changesets pipeline to handle versioning and publishing, **so that** all six packages move in lockstep without manual edits.

1. `pnpm changeset` — author the changeset describing the changes.
2. Land changes, merge to `main`.
3. `pnpm changeset:version` — bumps versions per the `fixed` group rule.
4. `git commit -am "chore: version packages" && git push`.
5. `pnpm release` (= `pnpm build && pnpm changeset:publish`) — builds + publishes to npm.

---

## Interaction Patterns

(From `functional-specification.md` Business Rules.)

### Pattern 1: Parse once, trust thereafter (ADR-009)

External consumers call `parseAndProject*`. The parse happens once at the boundary; internal `project*` helpers assume Zod-validated input and do not re-validate. **Don't pay for the validation walk twice.**

### Pattern 2: Verdict-first output (PDR-001 DD-4)

Verbs that may block (`scope-validate`, `arch dangling --strict`) print the deterministic verdict on its own line, followed by an itemized reason list. **Read the verdict, then the reasons — never reverse the order.**

### Pattern 3: Source-first, design-spec-ephemeral (ADR-003)

`@architect-pattern` *defines* (exactly one file per pattern). `@architect-implements` is many-to-one (UML realization). Once a pattern is `executable`, **delete the design spec** — the durable artifact is the annotated production code + the executable Gherkin.

### Pattern 4: Two parsers, two paths (AGENTS.md)

- `architect/specs/`, `architect/decisions/`, `formal-spec/` → parsed by `@cucumber/gherkin` at doc-gen / PatternGraph build time. **Not executed.**
- `tests/features/`, `packages/*/tests/features/` → parsed by `@amiceli/vitest-cucumber` at test time via vitest. **Executable.**

The reverse-link is on the test side: step files carry `@architect-implements:PatternName`. The spec doesn't reference the test (because the spec might be deleted post-implementation).

### Pattern 5: Deletion over deprecation (AGENTS.md §No-BC)

No `@deprecated`, no BC aliases, no `_var` renames. **If a change breaks consumers, the right move is to break them and document the migration; never to ship a half-finished compatibility shim.**

### Pattern 6: Architecture-as-fitness-function

ProcessGuard, `arch dangling --strict`, the perf regression gate, the no-suppressions guard — all enforce architectural invariants in CI rather than reviews. **The CI gate is the architecture review.**

---

## Terminal output conventions

### Default (text) mode

- **Headings:** top-level sections use `===` underlining, sub-sections use `---` (per PDR-001 DD-1 for `scope-validate` / `handoff` text output). `[INFERRED]` for other verbs from output shape conventions in `docs/CLI.md`.
- **Tables:** fixed-width column layout for verbs like `overview`, `status`, `list`. No external table library — column widths computed at print time. `[INFERRED]`
- **Diagnostics:** verbs that may BLOCK print the deterministic verdict (`PASS` / `BLOCKED` / `WARN`) on its own line, followed by an itemized reason list.
- **Colors:** the codebase has no committed color theme; doctrine prefers structural cues over color so output remains useful in piped contexts.

### JSON mode

- Top-level shape is always an object (never a bare array) — future fields can be added without breaking consumers.
- Keys are `camelCase` (matches Zod schema conventions).
- Nested data uses Zod `strictObject` schemas — extra/unknown keys rejected at validation boundary, not silently dropped.

### Exit codes

- `0` — success.
- Non-zero — verb-specific failure. Deterministic gates (`scope-validate`, `arch dangling --strict`) exit non-zero when they `BLOCK`. The exit-code reason is also surfaced in JSON mode.

---

## Markdown projection style

`@libar-dev/architect-projection` is the codec/renderer pipeline that turns the PatternGraph into markdown via Named Domain Fragments (Zod-validated). The output drives `pnpm docs:all` → `docs-live/`.

Style choices visible in the codebase:

- **GitHub-flavored markdown** as the target — tables, fenced code blocks, task lists. No HTML escape hatch.
- **Mermaid diagrams** emitted for dependency graphs (`dep-tree`) and FSM state diagrams. Consumers rendering output must support Mermaid.
- **Pattern-first headings** — each generated section is anchored by a pattern ID (matching the annotation grammar), not by file path. This keeps cross-doc links stable when files move.
- **Codec/renderer separation** is load-bearing (ADR-005) — codecs produce typed fragments, renderers turn fragments into markdown. Same fragment can be re-rendered for different surfaces (markdown, HTML, JSON dump) without re-deriving from source.

See `architect/decisions/adr-005-*.feature` and `architect/decisions/adr-009-*.feature` for the projection trust boundary that constrains what the renderer is allowed to do.

---

## What an external consumer cares about

If you are integrating `@libar-dev/architect-*` into your own project and reading this doc:

1. **There is no UI to embed.** Wire the CLI into your scripts, the MCP server into your agent config, or import the JS API.
2. **Prefer JSON mode** when calling the CLI from automation — text mode is for humans.
3. **Render the generated markdown with Mermaid support** if you publish `docs-live/` anywhere downstream.
4. **Treat verdict words as the contract** — if a future version changes the prose around them, the verdict line itself will remain stable.

---

## Cross-references

- **CLI verb reference:** `docs/CLI.md`.
- **MCP setup:** `docs/MCP-SETUP.md`.
- **Generated markdown surface:** `docs/INDEX.md` (lists everything `pnpm docs:all` produces).
- **Codec/renderer separation:** `architect/decisions/adr-005-*.feature`.
- **Projection trust boundary:** `architect/decisions/adr-009-*.feature`.
- **Functional + non-functional requirements:** `prd.md`.
- **Architecture deep-dive:** `architecture.md`.
- **Epic / story breakdown:** `epics.md`.

---

> *This document is a placeholder shape that the BMAD template expects. The underlying truth — that the architect platform has no visual surface — is captured here so future automation does not re-attempt extraction. If a UI is ever added (e.g., a web dashboard for the PatternGraph), this document should be rewritten from scratch.*
