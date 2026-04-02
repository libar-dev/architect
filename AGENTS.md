# AGENTS.md

This file helps future Codex sessions ramp up quickly in this repository.

## Project Identity

- Package: `@libar-dev/architect`
- Purpose: context engineering toolkit that extracts patterns from TypeScript + Gherkin into a queryable delivery state, generated docs, and workflow enforcement.
- Core principle: code/spec annotations are the source of truth; generated docs are projections.

## Where To Read First

1. Manual docs index: `/Users/darkomijic/dev-projects/delivery-process/docs/INDEX.md`
2. Config entry point: `/Users/darkomijic/dev-projects/delivery-process/architect.config.ts`
3. Live generated area index: `/Users/darkomijic/dev-projects/delivery-process/docs-live/PRODUCT-AREAS.md`
4. Key generated area docs:
   - `/Users/darkomijic/dev-projects/delivery-process/docs-live/product-areas/ANNOTATION.md`
   - `/Users/darkomijic/dev-projects/delivery-process/docs-live/product-areas/CONFIGURATION.md`
   - `/Users/darkomijic/dev-projects/delivery-process/docs-live/product-areas/CORE-TYPES.md`
   - `/Users/darkomijic/dev-projects/delivery-process/docs-live/product-areas/DATA-API.md`
   - `/Users/darkomijic/dev-projects/delivery-process/docs-live/product-areas/GENERATION.md`
   - `/Users/darkomijic/dev-projects/delivery-process/docs-live/product-areas/PROCESS.md`
   - `/Users/darkomijic/dev-projects/delivery-process/docs-live/product-areas/VALIDATION.md`

## Onboarding Context (Tutorial WIP)

- External tutorial source: `/Users/darkomijic/dev-projects/architect-tutorials/TUTORIAL-ARTICLE-v1.md`
- Tutorial goal: bootstrap from blank project to full docs/query flow (`11 patterns`, `26 generated files` in demo scenario).
- Treat tutorial outputs as illustrative; validate commands against current CLI behavior before codemods/docs changes.
- Important known alignment points from tutorial review:
  - `architect overview` includes the Data API helper section in output (not always shown in article snippets).
  - Current `architect-generate --list-generators` output does not include `product-area-docs`.
  - `architect-generate` accepts both repeated `-g` flags and comma-separated generator lists.
  - Shape-derived entries can affect counts and `stubs` output (shape patterns appear as separate entries).
  - `arch context` groups only patterns carrying explicit `@architect-arch-context`.

## Consumer Repo Setup Conventions

When guiding users in external repos, pick command style based on config format:

- If the repo uses `architect.config.js` (or no config), package binaries are fine:

```bash
npx architect-generate --help
npx architect --help
npx architect-lint-patterns --help
npx architect-guard --help
npx architect-validate --help
```

- If the repo uses `architect.config.ts`, use `tsx`-based wrappers (or switch to `.js` config).
  - Reason: plain Node execution may fail to import `.ts` config files in some environments.

Use `architect.config.ts` or `.js` as the main integration contract and keep scripts thin wrappers around package CLIs.

## Architecture Snapshot

- Pipeline: `Config -> Scanner -> Extractor -> Transformer -> Codec`.
- Central read model: `PatternGraph` (consumed by docs generation, Data API, and validators).
- Preset in this repo config: `libar-generic` (`@architect-*` tags).
- Source ownership invariant:
  - TypeScript owns runtime relationships (`uses`, `used-by`, category-like tags).
  - Gherkin owns planning/process metadata (`depends-on`, quarter, team, phase, deliverables).

## Repository Map

- Source code: `/Users/darkomijic/dev-projects/delivery-process/src`
- Feature specs (roadmap/process/decisions/releases):
  - `/Users/darkomijic/dev-projects/delivery-process/architect/specs`
  - `/Users/darkomijic/dev-projects/delivery-process/architect/decisions`
  - `/Users/darkomijic/dev-projects/delivery-process/architect/releases`
- Design stubs (non-compiled on purpose): `/Users/darkomijic/dev-projects/delivery-process/architect/stubs`
- Tests:
  - Feature files: `/Users/darkomijic/dev-projects/delivery-process/tests/features`
  - Step definitions: `/Users/darkomijic/dev-projects/delivery-process/tests/steps`

## Session Workflow (Project Convention)

Session types and expected outcomes:

1. Planning: create/update roadmap `.feature` spec (status typically `roadmap`).
2. Design: produce decision specs and/or stubs in `architect/stubs/` (no implementation).
3. Implementation: transition `roadmap -> active -> completed` while implementing deliverables.

FSM/protection conventions:

- `roadmap` / `deferred`: fully editable
- `active`: scope-locked (do not add deliverables)
- `completed`: hard-locked (changes require unlock-reason tag)

## Data API First (Preferred Discovery Path)

Use the CLI instead of broad file exploration whenever possible:

```bash
pnpm architect:query -- overview
pnpm architect:query -- scope-validate <PatternName> implement
pnpm architect:query -- context <PatternName> --session implement
pnpm architect:query -- dep-tree <PatternName>
pnpm architect:query -- files <PatternName> --related
```

Useful discovery commands:

```bash
pnpm architect:query -- list --status roadmap --names-only
pnpm architect:query -- arch blocking
pnpm architect:query -- stubs --unresolved
pnpm architect:query -- unannotated --path src
```

## Build, Test, Validation Commands

Core dev:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

Process/quality checks:

```bash
pnpm architect:lint-steps
pnpm architect:lint-patterns
pnpm architect:guard
pnpm validate:patterns
pnpm validate:dod
pnpm validate:all
```

## Docs Generation

- Main generated output root from config: `docs-generated/`
- Product area and ADR outputs are overridden to `docs-live/` in config.

Common commands:

```bash
pnpm docs:product-areas
pnpm docs:reference
pnpm docs:decisions
pnpm docs:all
```

Rule: do not hand-edit generated artifacts when regeneration is the intended flow.

Current built-in generator list is discovered from CLI (`architect-generate --list-generators`).
Do not assume undocumented generator names are available without checking.

## Testing Rules (Important)

- This repo follows strict Gherkin-first testing:
  - Specs in `.feature`
  - Step definitions in `.steps.ts`
  - Avoid introducing classic `*.test.ts` files for new coverage unless explicitly requested.
- Never commit skipped/only tests (`it.skip`, `it.only`, `describe.skip`, `describe.only`).
- For `vitest-cucumber`:
  - `Scenario`: use Cucumber expressions (`{string}`, `{int}`) and function params.
  - `ScenarioOutline`: use `<column>` placeholders and read via `variables.column`.

## Change Hygiene

- Keep edits focused; prefer changing source-of-truth files over generated docs.
- If changing tags/taxonomy/config, run relevant validation and at least targeted docs generation.
- For workflow/status/deliverable changes, run process guard checks before finalizing.

## Practical Start Checklist For New Sessions

1. Read `docs/INDEX.md` and `architect.config.ts`.
2. Run `pnpm architect:query -- overview`.
3. If working on a specific pattern, run:
   - `pnpm architect:query -- scope-validate <PatternName> implement`
   - `pnpm architect:query -- context <PatternName> --session <design|implement>`
4. Make minimal source changes.
5. Run targeted tests + relevant lint/validation.
6. Regenerate docs if source annotations/specs/config changed.

## Future Enhancement Candidate: Interactive Init CLI

There is currently no dedicated interactive onboarding command in this package.
If implementing one, design for existing-repo adoption first:

1. Command shape
   - Add a new bin command (example: `architect-init`) so users can run `npx architect-init`.
2. Wizard responsibilities
   - Detect package manager and module mode (`type: module`).
   - Scaffold `architect.config.ts` with chosen preset and discovered source globs.
   - Offer optional npm scripts for `architect`, docs generation, and validation commands.
   - Optionally scaffold starter folders (`architect/specs`, `architect/stubs`) and sample spec/stub templates.
3. Safety requirements
   - Dry-run mode and explicit overwrite confirmations.
   - Never silently overwrite existing `architect.config.ts` or user scripts.
4. Success criteria
   - User can run `architect overview` and `architect-generate --list-generators` immediately after setup.
