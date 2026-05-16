# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

- Waves 1 through 4 of the taxonomy campaign removed retired authored tags from the live
  package story, including the old external dependency and parent tags, the sequence-tag
  family, and `@architect-extract-shapes`. See
  `packages/architect-claude-plugin/MIGRATION.md` for the full migration record.
- `@libar-dev/architect-presentation` package deleted in its entirety. Doc
  generation is now owned by `@libar-dev/architect-projection`'s Fragment /
  Projection / Renderer pipeline (see ADR-006).
- `@libar-dev/architect-query` package dissolved. `PatternGraphAPI`,
  `pattern-helpers`, `fuzzy-match`, `session-helpers`, and read primitives
  moved into `@libar-dev/architect-core/read-api/` and `/utils/`.
- Lifecycle-management projections (briefs, ideas, lifecycle boards, candidate
  pipelines, promotion gates, scenario coverage, etc.) pruned — zero consumers
  in CLI/MCP/desktop/docs-gen. Re-introduce when the spec-lifecycle work
  begins. `LifecycleProjectionContext` type deleted.

### Added

- `@libar-dev/architect-projection` package with 30+ Fragments across six
  subdomains and four renderers (compact-text, json, markdown, ui).
- ADR-006 (`architect/decisions/adr-006-fragment-projection-renderer-architecture.feature`)
  documenting the Fragment/Projection/Renderer architecture and the ADR-006
  boundary lint rule.
- ESLint `no-restricted-syntax` rules banning direct `session.dataset.patterns`,
  `context.graph.patterns`, `context.graph.archIndex`, and
  `context.graph.relationshipIndex` access from `architect-cli`,
  `architect-mcp`, and `apps/desktop`.

### Changed

- Waves 1 through 4 of the taxonomy campaign narrowed the surviving authored tag story.
  `@architect-uses` is now the canonical dependency vocabulary, and the hierarchy axis is
  carried by the narrowed `@architect-level` and `@architect-parent` semantics documented
  in `packages/architect-claude-plugin/MIGRATION.md`.
- Desktop main process (`apps/desktop/src/main/*.ts`) switched from tsup CJS
  to ESM (`index.mjs`) so split architect packages import statically. Preload
  script stays CJS because Electron sandboxed preload must be CommonJS.
- Projection W7 naming wave aligned public entrypoints with fragment kinds:
  `projectOverviewDigest`, `parseAndProjectSessionContext`,
  `projectReleaseNotesDigest`, `projectRoadmapTimeline`, and
  `parseAndProjectScopeReadinessReport`. See
  `packages/architect-projection/docs/MIGRATION.md` for the compatibility map.

## [1.0.0-pre.3] - 2026-03-27

First publication as `@libar-dev/architect` (renamed from `@libar-dev/delivery-process`).

### Changed

- Package renamed from `@libar-dev/delivery-process` to `@libar-dev/architect`
- All annotation prefixes changed from `@libar-docs-*` to `@architect-*`
- CLI bin entries renamed: `process-api` → `architect`, `lint-process` → `architect-guard`, etc.
- MCP server tools renamed to `architect_*` prefix (25 tools)
- Configuration file renamed to `architect.config.ts`

### Added

- MCP server with 25 tools, stdio transport, file watcher, sub-millisecond dispatch
- `@modelcontextprotocol/sdk` and `chokidar` dependencies for MCP server
- BSL 1.1 license for `src/mcp/` directory (LICENSE-MCP)

## [1.0.0-pre.0] - 2026-02-21

First npm-published pre-release for monorepo validation.

### Added

- Stable public API with 12 subpath exports (including new `./api`)
- Process Data API with 27 CLI subcommands for AI-native delivery state queries
- FSM-enforced workflow validation via pre-commit hooks
- Codec-based document generation (patterns, roadmap, decisions, product areas, etc.)
- Cross-source validation (TypeScript + Gherkin dual-source merging)
- PatternGraph single read model (ADR-006)

### Changed

- Published to npm registry (previously consumed via `git+https://` only)
- `dist/` removed from git tracking -- built fresh during publish
- `@libar-dev/modular-claude-md` moved from dependencies to devDependencies
- Package size trimmed (removed self-referential docs from tarball)

[Unreleased]: https://github.com/libar-dev/delivery-process/compare/v1.0.0-pre.3...HEAD
[1.0.0-pre.3]: https://github.com/libar-dev/delivery-process/compare/v1.0.0-pre.0...v1.0.0-pre.3
[1.0.0-pre.0]: https://github.com/libar-dev/delivery-process/releases/tag/v1.0.0-pre.0
