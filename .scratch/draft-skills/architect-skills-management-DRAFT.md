# DRAFT — `architect-skills-management` Skill

**Status**: draft, NOT yet a live skill. To be promoted to `.agents/skills/architect-skills-management/SKILL.md` and symlinked into `.claude/skills/` and `.opencode/skills/` once the auto-generation pipeline is in place.

## Purpose

A maintainer-facing skill for restructuring, editing, validating, and (eventually) generating the architect-\* skill family in this repo. Not for end-user work — for the human + agent shaping the skill layer.

## Trigger surface (description draft)

> MANDATORY when restructuring, auditing, or generating Architect skills in this repo. Triggers on "restructure architect skills", "fix architect skill descriptions", "audit `_shared/` fragments", "add a new architect session skill", "promote a draft skill", mentions of `.agents/skills/`, `.claude/skills/`, `.opencode/skills/`, the architect-_ skill family by name, SKILL.md frontmatter validity, description-based skill activation, or the architect skill auto-generation pipeline. Do NOT use for: generic skill creation outside the architect family (route to `skill-creator`), OpenCode / OmO configuration (route to `omo-setup-management`), or actual architect product code (`packages/architect-_/src/\*\*`). Invoke BEFORE editing any skill file or generator script in the architect skill stack.

## Operational scope

### Inventory + audit

- Read `.agents/skills/` recursively, group by `architect-*` prefix vs `_shared/` doctrine vs everything else.
- Check symlink integrity across `.agents/skills/`, `.claude/skills/`, `.opencode/skills/` — every `architect-*` directory should be a symlink target with matching parent dirs in both harness folders.
- Validate SKILL.md frontmatter: `name`, `description`, `allowed-tools` shape; description ≤ a defined length budget; description includes trigger verbs AND non-trigger negations.
- Surface description-trigger overlaps and gaps (e.g., two skills triggering on the same verb; no skill triggering on a key noun like `architect/decisions/`).

### Description engineering

- Apply the trigger / non-trigger convention (verbs the skill DOES fire on, prose mentions that do NOT fire).
- Validate descriptions are concrete (file paths, command names, tag names) rather than abstract.
- Validate non-trigger lists exist for description-based activation to behave under ambiguity.
- Catch description bloat — descriptions are read by every harness on every session; long descriptions cost context everywhere.

### `_shared/` doctrine maintenance

- Reconcile terminology drift: "kernel", "doctrine", "anti-anecdote", "provenance", "self-contained" — pick one name per concept, rename uniformly, OR inline and delete the file.
- Detect drift between a `_shared/` claim and the live CLI output (the anti-anecdote rule restated): re-run `pnpm architect:query taxonomy --format json`, `--help` invocations, etc., diff against the doctrine text.

### Per-harness rendering (the future state)

- Generator pipeline takes a canonical source (TBD format — typed YAML / TS / Gherkin) and emits per-harness output:
  - Claude Code: SKILL.md with description-driven frontmatter.
  - OpenCode + OmO: SKILL.md + entries in `oh-my-openagent.jsonc` (per-agent `skills` arrays, category `prompt_append` references).
  - Future harnesses: extend the rendering target list.
- Symlinks become outputs, not authoring surfaces.

### Validation gates (the skill enforces these on its own work)

- All symlinks resolve.
- No two skills have identical descriptions or overlapping trigger surfaces.
- `_shared/` files referenced by a skill body exist.
- The mandatory `architect-base` skill is present and discoverable in both harness directories.
- Frontmatter `name:` matches directory name.

## Out of scope

- Authoring or editing actual product code (`packages/architect-*/src/**`).
- Spec authoring (use `architect-plan-session`, `architect-design-session`).
- Generator implementation (lives in `scripts/` or a dedicated package — this skill orchestrates against the generator, doesn't replace it).
- OpenCode / OmO configuration (route to `omo-setup-management`).

## Open design questions

1. Canonical source format — typed YAML vs TS vs Gherkin (Gherkin would be poetic in the architect repo).
2. Where the generator lives — `packages/architect-skills/` (new package) vs `scripts/skills/` (private).
3. Whether OmO config gets generated too, or stays hand-authored with this skill responsible only for SKILL.md output.
4. How to handle harness-specific carve-outs (Claude Code chord shortcuts, OmO hook integration) — generator extension points vs hand-edited per harness.

## Notes captured 2026-05-18

- The `architect-session-router` + `architect-data-api` mandatory pair has misaligned trigger surfaces. Fixed in this session by creating `architect-base` as the new generic mandatory load.
- `_shared/` fragments are inlined into `architect-base` rather than referenced, because the fragment terminology is in flux.
- `architect-cli-overview` exists in `.agents/skills/` but is not symlinked (it's a prototype output). Decide its fate next session.
- Symlink-based propagation works but is fragile; auto-generation should replace it.
