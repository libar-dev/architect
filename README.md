# Libar Architect

Engineering lifecycle platform for AI-assisted development — annotate your code, get structured AI context, enforced delivery workflows, and a design workbench that makes AI implementation near-deterministic.

> **Status:** v2.0 pre-release. The package family was originally shipped as a monolith (`v1.0.0-pre.3`). It has since been split into five focused packages plus a meta-package. The monolith history lives on the `archive/monolith` branch and the `legacy/v1.0.0-pre.3-monolith` tag.

## Packages

| Package                            | Purpose                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `@libar-dev/architect`             | Meta-package — depends on all five splits and re-exports their bins. The "kitchen sink" install. |
| `@libar-dev/architect-core`        | Canonical model, ingestion, graph build, scanner/extractor, taxonomy, config, read API.       |
| `@libar-dev/architect-projection`  | Fragment-based projection pipeline — Named Domain Fragments, block types, renderers.          |
| `@libar-dev/architect-guard`       | Policy, validation, process guard, step-lint, DoD, anti-pattern detection, git helpers.       |
| `@libar-dev/architect-cli`         | Thin composition root for `architect`, `architect-generate`, `architect-guard`, etc.          |
| `@libar-dev/architect-mcp`         | MCP server (18 tools), tool registry, file watcher, pipeline session.                         |
| `@libar-dev/architect-spec`        | Architect Spec — formal specification (currently `private: true`; promotes to standalone at v1.0). |

**Dependency direction (acyclic):** `core ← projection`, `core ← guard ← cli`, `core,projection ← mcp`. The meta-package depends on all five and has no inbound runtime deps.

## Dogfood

The architect package family runs its own delivery process. The dogfood instance lives at the repo root: `architect.config.ts`, the `architect/` directory (specs, decisions, releases, stubs), `docs-sources/`, and the `tests/` suite. The toolchain is exercised against itself, so every release verifies the methodology end-to-end. Use this as the reference for setting up Architect in your own project.

## Workspace layout

```
architect/
├── architect.config.ts           # dogfood config
├── architect/                    # dogfood specs, decisions, releases, stubs
├── docs/                         # manual documentation
├── docs-sources/                 # inputs for doc generation
├── docs-live/                    # gitignored — generated docs output
├── scripts/                      # dogfood scripts
├── tests/                        # dogfood smoke + regression suite
├── packages/
│   ├── architect/                # @libar-dev/architect (meta — bin-only)
│   ├── architect-core/
│   ├── architect-projection/
│   ├── architect-guard/
│   ├── architect-cli/
│   └── architect-mcp/
└── formal-spec/                  # @libar-dev/architect-spec — methodology RFC (private)
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```

Versioning is managed by [changesets](https://github.com/changesets/changesets). The six publishable packages move in lockstep via the `fixed` group in `.changeset/config.json`.

## License

`MIT AND BUSL-1.1`. See [LICENSE](./LICENSE) and [LICENSE-MCP](./LICENSE-MCP).
