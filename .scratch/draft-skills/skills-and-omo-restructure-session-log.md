# Skills + OmO Restructure — Session Log (2026-05-18)

## What this session produced

| Artifact                       | Path                                                                                                  | Purpose                                                                                                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New mandatory skill            | `.agents/skills/architect-base/SKILL.md`                                                              | Single load-first context covering identity, delivery process, PatternGraph, annotations, tiers, FSM, value transfer, ADRs, Data API basics. Replaces the broken `architect-session-router` + `architect-data-api` mandatory pair. |
| Symlinks                       | `.claude/skills/architect-base`, `.opencode/skills/architect-base`                                    | Harness discovery (Claude Code description-based activation + OpenCode skill source glob).                                                                                                                                         |
| OmO config swap                | `.opencode/oh-my-openagent.jsonc`                                                                     | All agent `skills` arrays and the enable list now point at `architect-base` only. Old broken pair no longer injected.                                                                                                              |
| OmO category bootstrap         | `.opencode/prompts/architect-kernel-bootstrap.md`                                                     | Rewritten to reference `architect-base` + load-verification convention. Still wired into all 8 categories via `prompt_append`.                                                                                                     |
| Two draft skills (this folder) | `.agents/drafts/architect-skills-management-DRAFT.md`, `.agents/drafts/omo-setup-management-DRAFT.md` | Stubs for the two maintainer-facing skills to be promoted next.                                                                                                                                                                    |

## Load verification — how to confirm `architect-base` activates

`architect-base/SKILL.md` body contains:

> When you load this skill, state briefly that the **architect-base** context is loaded so the user can confirm it activated.

Same convention restated in `.opencode/prompts/architect-kernel-bootstrap.md`. The expected behavior:

- **Claude Code** — start a new session, open any architect-scoped topic; agent should announce "architect-base context loaded." Description-based activation should fire on any architect / PatternGraph / `@architect-*` / `pnpm architect:query` mention.
- **OpenCode (OmO)** — start a fresh session against any of the 13 configured agents or any of the 8 categories. The agent should acknowledge architect-base context (skill injection working) OR at minimum acknowledge the kernel-bootstrap discipline (category `prompt_append` belt working). If neither path produces an acknowledgment, the load is genuinely broken on both surfaces.

## OmO config — sanity check against schemas

Validated against `oh-my-openagent` source at `/Users/darkomijic/dev-projects/pi-setup-hq/reference-repos/oh-my-openagent/src/config/schema/` on 2026-05-18:

- `skills.sources` — valid (`SkillSourceSchema` accepts the object form with `path` + `recursive`).
- `skills.enable` — valid (`SkillsConfigSchema` accepts `enable: string[]`).
- `agents.<name>.skills` — valid. Schema comment on `AgentOverrideConfig.skills` is `"Skill names to inject into agent prompt"` — this **is** the injection mechanism, not a redundant enable list.
- `categories.<name>.prompt_append` — valid. Supports `file://` URIs (`file:///abs`, `file://./rel`, `file://~/home`).
- All 13 referenced agent keys match `AgentOverridesSchema`.
- All 8 referenced category keys match `BuiltinCategoryNameSchema`.
- `skill:` permission is **not** a field on `AgentOverrideConfigSchema` or `CategoryConfigSchema` — top-level `permission.skill` in `.opencode/opencode.jsonc` is the only valid place. Already correctly configured.

**Verdict**: the config is schema-valid. Two independent activation paths are wired (per-agent injection + per-category prompt-append). If skills still don't load in OmO, the bug is in OmO runtime / skill-discovery, not in this configuration.

## Current `.agents/skills/` inventory

| Skill                             | Symlinked to harnesses? | Role                                                                                                   |
| --------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `_shared/` (9 files)              | yes (both)              | Doctrine fragments referenced by session skills via relative links                                     |
| `architect-base`                  | **NEW, both**           | Mandatory baseline (this session)                                                                      |
| `architect-session-router`        | yes (both)              | Intent detection + routing (broken description; superseded as mandatory)                               |
| `architect-data-api`              | yes (both)              | Verb reference (too verbose for mandatory; useful as opt-in)                                           |
| `architect-plan-session`          | yes (both)              | Idea / candidate authoring                                                                             |
| `architect-design-session`        | yes (both)              | Design-tier promotion                                                                                  |
| `architect-implement-spec`        | yes (both)              | Build a design spec end-to-end + value transfer                                                        |
| `architect-review-spec`           | yes (both)              | Pre-implementation gap review                                                                          |
| `architect-review-implementation` | yes (both)              | Post-merge value-transfer review + batched deletion                                                    |
| `architect-refactor-session`      | yes (both)              | Refactor shipped code without a spec (bundles refactor + multi-session coordination — split candidate) |
| `architect-verify-handoff`        | yes (both)              | End-of-session handoff capture                                                                         |
| `architect-cli-overview`          | **NO**                  | Prototype output from `scripts/proto/cli-catalog.ts`; not a production skill                           |

`_shared/` fragments:

```
_shared/annotation-ownership.md          # split-ownership policy
_shared/canonical-references.md          # self-containment + anti-anecdote rules
_shared/four-tier-ladder.md              # tier table + line budgets + promotion paths
_shared/fsm-transitions.md               # process-guard FSM + unlock-reason rules
_shared/multi-session-coordination.md    # .pr-coordination/ layout + coordinator+worker split
_shared/rule-block-template.md           # 4-field Rule block convention
_shared/session-preamble.md              # six universal rules
_shared/spec-pattern-relationships.md    # bipartite production↔test graph + hierarchy axis
_shared/value-transfer.md                # design-spec deletion gate
```

## Validated issues

### Issue 1 — Mandatory-pair descriptions mis-targeted (CONFIRMED)

- `architect-session-router/SKILL.md` description leads with intent-specific phrasing ("Use at the start of work in an architect-managed repo when the user says one of — capture a new idea, promote a candidate spec, design a pattern..."). Will NOT fire on generic architect-context questions, file reads in `architect/`, or PatternGraph inspection.
- `architect-data-api/SKILL.md` triggers broadly but the body is ~500 lines — way too heavy for "mandatory first load."
- Net effect: the pair only co-fires when a session-intent verb is present, but the policy requires firing **before any architect-scoped Read/Glob/Grep**. Trigger surface and policy don't match.

**Resolution this session**: `architect-base` is the new mandatory load with a broad, generic trigger surface.

### Issue 2 — Session router is too rigid (CONFIRMED)

The 7-row intent table at `architect-session-router/SKILL.md` lines 17-25 enforces "Choose exactly one. If ambiguous, ask once." This is fine for clear sessions but punishes the common case of exploratory work that doesn't match any of the 7 intents.

**Resolution**: `architect-base` is intent-agnostic. Session-specific skills load explicitly when a clear intent emerges.

### Issue 3 — Data-API skill is too verbose for mandatory load (CONFIRMED)

`architect-data-api/SKILL.md` body is ~500 lines covering CLI/MCP tradeoffs, full parity table, per-intent pre-flight commands, full verb reference, JSON shapes, deterministic gates, quirks, doctrine cross-references, anti-patterns, provenance. Reasonable as a reference; unreasonable as a mandatory load.

**Resolution**: `architect-base` § 14 has a one-page Data API essentials block.

### Issue 4 — `_shared/` fragments inserted randomly (CONFIRMED)

Sampled the seven session skills: each loads a different subset of `_shared/` files via prose links. No consistent story about which fragments are universal vs which are session-specific. Terminology proliferation:

- "Kernel" / "kernel pair" / "doctrine kernel" — 4+ different meanings across files.
- "Anti-anecdote rule" — coined in `canonical-references.md`, used as authority elsewhere.
- "Provenance" — header in `canonical-references.md` that means something different from informal usage elsewhere.
- "Maturity-driven status flips" vs "Process-Guard FSM transitions" — well-defined in `fsm-transitions.md` but easily confused.

**Resolution this session**: `architect-base` inlines its own statement of every doctrine point it carries, with NO `_shared/` references. It is genuinely standalone. The `_shared/` set keeps existing for the remaining session skills until the next restructure wave.

### Issue 5 — Refactor skill mixes refactor + session coordination (USER-REPORTED, NOT YET FIXED)

`architect-refactor-session` includes prose about `.pr-coordination/` multi-session campaigns. The user notes that coordination is rarely needed today, and harnesses with their own coordination layout (OmO uses `.sisyphus/`) don't benefit. These should be two skills.

**Next-wave fix**: split into `architect-refactor` (pure refactor doctrine) + a separate, harness-aware coordination skill.

### Issue 6 — Auto-generation as the future direction (USER-REPORTED, NOT YET ADDRESSED)

Future restructure should be auto-generated from a typed source, not relying on symlinks. Symlinks become a generator output rather than the authoring surface. The two draft maintenance skills in this folder set that posture.

## Information architecture — what `architect-base` chose to inline

Drawn from the user's prompt + the source files I read:

1. Identity statement — what Libar Architect IS.
2. Dual nature — product + dogfood delivery process in the same repo.
3. Two audiences — agents/humans doing work vs surfaces consuming projections.
4. Delivery process table — config / state / source of truth / CLI / MCP / validation / doc regen.
5. State folders — what lives where, ephemeral vs durable, which Gherkin parser sees what.
6. PatternGraph — taxonomy (7 tag groups), instances (2 surfaces), edges (5 types), projections (fragments).
7. Entry points — config, CLI, MCP, file-scanning-is-a-smell rule.
8. Validation layers — 4 layers with their CLI commands.
9. Key ADRs — 6 load-bearing, decisions-only-no-operational-context framing.
10. Annotation ownership — split-ownership + additive-not-mandatory rule.
11. Detail tiers + maturity — 6 levels (4 authored + executable + maintenance), promotion + refactor carve-out.
12. **THE detail-level doctrine** — contextual, not formulaic. User explicitly flagged this as critical.
13. FSM lifecycle — maturity flip vs process-guard, unlock-reason rule, two verification verbs.
14. Spec ↔ Pattern bipartite — two nodes joined by `@architect-implements`, two suffix conventions.
15. Value transfer high level — durable carriers, pre-deletion gate gist, "ask, don't auto-delete."
16. Data API essentials — verbs by purpose, MCP naming, three quirks worth knowing.
17. Bootstrap discipline — `overview` always, `bundle <Pattern> --mode <session>` when in scope.
18. What this skill does NOT cover — pointers to dedicated session skills.

Explicit non-goals (per user direction): no refactor carve-out execution detail; no multi-session coordination; no detailed session execution steps; no full pre-deletion checklist; no `_shared/` cross-links (intentionally standalone).

## Open items for the next iteration

| #   | Item                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Decide fate of `architect-session-router` + `architect-data-api` (deprecate, demote to opt-in, or refactor)                        |
| 2   | Split `architect-refactor-session` into refactor + (harness-aware) coordination                                                    |
| 3   | Auto-generation pipeline (typed source → per-harness bundles)                                                                      |
| 4   | Sanity-check `_shared/` for terminology drift (kernel / doctrine / anti-anecdote / provenance / self-contained) — inline or rename |
| 5   | Decide fate of `architect-cli-overview` (delete / promote / move)                                                                  |
| 6   | Diagnose OmO skill-loading runtime bug separately (config is clean per this session)                                               |
| 7   | Promote the two draft management skills in `.agents/drafts/` to live skills under `.agents/skills/`                                |

## Bottom-line state at session end

- `architect-base` is live and discoverable in both harnesses.
- OmO config swap is in place; old broken pair no longer injected.
- OmO category `prompt_append` belt is still wired (per user direction — operational dependency).
- Two draft management-skill stubs sit in `.agents/drafts/` awaiting promotion.
- The architect-base SKILL.md contains its own load-acknowledgment instruction; that's the verification signal in lieu of OmO debug logs.
