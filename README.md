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

## Examples

- [`examples/self-host/`](./examples/self-host/) — the toolchain applied to itself. Real specs, decisions, releases, stubs, and a working `architect.config.ts`. Use this as the reference for setting up Architect in your own project.

## Workspace layout

```
architect/
├── packages/
│   ├── architect/                # @libar-dev/architect (meta)
│   ├── architect-core/
│   ├── architect-projection/
│   ├── architect-guard/
│   ├── architect-cli/
│   └── architect-mcp/
├── examples/
│   └── self-host/                # dogfooding harness
├── spec/                          # @libar-dev/architect-spec (private)
└── docs/
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
