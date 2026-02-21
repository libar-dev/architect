# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-pre.0] - 2026-02-21

First npm-published pre-release for monorepo validation.

### Added

- Stable public API with 12 subpath exports (including new `./api`)
- Process Data API with 27 CLI subcommands for AI-native delivery state queries
- FSM-enforced workflow validation via pre-commit hooks
- Codec-based document generation (patterns, roadmap, decisions, product areas, etc.)
- Cross-source validation (TypeScript + Gherkin dual-source merging)
- MasterDataset single read model (ADR-006)

### Changed

- Published to npm registry (previously consumed via `git+https://` only)
- `dist/` removed from git tracking -- built fresh during publish
- `@libar-dev/modular-claude-md` moved from dependencies to devDependencies
- Package size trimmed (removed self-referential docs from tarball)
