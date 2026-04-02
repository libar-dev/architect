# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
