# DRAFT — `omo-setup-management` Skill

**Status**: draft, NOT yet a live skill. To be promoted to `.agents/skills/omo-setup-management/SKILL.md` and symlinked into `.opencode/skills/` only (Claude Code does not consume it).

## Purpose

A maintainer-facing skill for configuring, validating, and diagnosing the Oh-My-OpenAgent / OpenCode setup in this repo (and reproducibly across other architect-managed repos). Not for end-user work — for the human + agent shaping the OmO integration.

## Trigger surface (description draft)

> Use when configuring, validating, or diagnosing the OpenCode / Oh-My-OpenAgent setup. Triggers on "validate my OmO config", "OmO skills aren't loading", "doctor reports wrong models", "category prompt-append isn't firing", "set up OmO in a new repo", mentions of `.opencode/opencode.jsonc`, `.opencode/oh-my-openagent.jsonc`, `~/.config/opencode/`, OmO Zod schemas, `bunx oh-my-openagent doctor`, `opencode models --refresh`, the OmO agent / category lists, `prompt_append`, `skills.enable`, OmO permission rules, or the OmO `agents.<name>.skills` injection mechanism. Do NOT use for: Claude Code harness configuration (use `update-config`), generic skill restructure (route to `architect-skills-management`), or the OmO source code itself (live at `~/dev-projects/pi-setup-hq/reference-repos/oh-my-openagent/`). Invoke BEFORE editing any OpenCode / OmO config or prompt file in this repo.

## Operational scope

### Config sanity (the validation pass)

- Parse `.opencode/opencode.jsonc` and `.opencode/oh-my-openagent.jsonc` (and the user-level equivalents at `~/.config/opencode/`) against the live OmO Zod schemas in `/Users/darkomijic/dev-projects/pi-setup-hq/reference-repos/oh-my-openagent/src/config/schema/`.
- Verify:
  - `skills.sources` paths exist; the glob matches real SKILL.md files.
  - Every name in `skills.enable` corresponds to a `SKILL.md` whose frontmatter `name:` matches.
  - Every agent key in `agents` is in `AgentOverridesSchema` (closed set: `build`, `plan`, `sisyphus`, `hephaestus`, `sisyphus-junior`, `OpenCode-Builder`, `prometheus`, `metis`, `momus`, `oracle`, `librarian`, `explore`, `multimodal-looker`, `atlas`).
  - Every category key is in `BuiltinCategoryNameSchema` (`visual-engineering`, `ultrabrain`, `deep`, `artistry`, `quick`, `unspecified-low`, `unspecified-high`, `writing`).
  - Every `file://` URI in `prompt_append` resolves to a real file.
  - `permission.skill` rules live in `opencode.jsonc` only (NOT in `oh-my-openagent.jsonc` — schema does not allow it).

### User-level vs project-level reconciliation

- Document the workflow gap: project-level OmO is hard to enable cleanly when user-level OmO is also configured.
- Capture the right pattern for disabling OmO at user level when a specific project doesn't want it.

### Diagnostic / doctor wrapper

- Run `bunx oh-my-openagent doctor --verbose` and parse output.
- Compare reported models against `opencode models --refresh` output.
- Surface known doctor bugs:
  - Bullet-points-display-off-for-working-features (observed 2026-05-18).
  - Other doctor display anomalies as they are discovered.

### Skill load verification (the workaround until OmO debug improves)

- Inject a known marker phrase into a skill body ("acknowledge load with 'X loaded.'").
- Start a fresh session, prompt the agent, look for the marker.
- Triage matrix:
  - Marker missing AND `prompt_append` content missing → both paths broken.
  - Marker missing AND `prompt_append` content present → skill injection broken, category fallback working.
  - Marker present → skill injection working.

### Reproducible setup across repos

- Template the `.opencode/opencode.jsonc` + `.opencode/oh-my-openagent.jsonc` + `.opencode/prompts/` shape so other architect-managed repos can adopt it.
- Decide whether to ship as a templater script or as a copy-from-template doc.

## Out of scope

- The OmO source codebase itself. When OmO bugs are confirmed (e.g., skill loading), surface them upstream rather than patching here.
- Writing custom OmO hooks for architect (Studio repo holds the unextracted hook config; revisit after skill restructure stabilizes).
- Claude Code harness configuration (different skill).

## Issues captured 2026-05-18

1. **Project-level OmO is hard to enable cleanly when user-level OmO is also configured.** Workflow gap, not a config bug.
2. **`doctor --verbose` displays "off" bullets for working features.** Status display is misleading even when the feature is operating correctly.
3. **`opencode models --refresh` + `bunx oh-my-openagent refresh-model-capabilities` are the two-step model sync flow.** Document explicitly so it doesn't get lost.
4. **No reliable logs for project-level skill loading.** Until OmO ships better debug output, the marker-phrase load-verification convention is the standard.
5. **`skill:` permission rules cannot be placed on agents or categories.** Only at top-level `permission.skill` in `opencode.jsonc`. Schema confirmed.

## Current shape (post-session 2026-05-18) for this repo

- `skills.enable: ["architect-base"]` — single mandatory load.
- `agents.<each-of-13>.skills: ["architect-base"]` — injected per-agent (suspenders).
- `categories.<each-of-8>.prompt_append: "file://./prompts/architect-kernel-bootstrap.md"` — belt (works even if skill injection fails).
- `permission.skill: { "architect-*": "allow" }` in `.opencode/opencode.jsonc` (NOT in oh-my-openagent.jsonc — schema correct location).

Intentionally redundant while OmO skill-loading bug is being diagnosed. Once load is verified working, drop the category `prompt_append` and keep the per-agent `skills` injection only.
