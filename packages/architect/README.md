# @libar-dev/architect

Kitchen-sink meta-package for the Libar Architect toolchain.

Installing this package gives you the full toolchain in one dependency:

- `@libar-dev/architect-core` — model, ingestion, read API
- `@libar-dev/architect-projection` — projection pipeline, fragments, renderers
- `@libar-dev/architect-guard` — policy, validation, process guard
- `@libar-dev/architect-cli` — CLI bins
- `@libar-dev/architect-mcp` — MCP server

All seven bins (`architect`, `architect-generate`, `architect-guard`, `architect-lint-patterns`, `architect-lint-steps`, `architect-validate`, `architect-mcp`) are re-exported from this package.

## When to install this vs. the granular splits

Install the meta-package when you want the full toolchain with no thinking. Install the granular splits when you want a narrower dependency footprint — e.g. a CI job that only needs `architect-validate` can depend on `@libar-dev/architect-cli` directly.

## Migrating from `1.0.0-pre.3`

`v1` was a monolith published as `@libar-dev/architect`. `v2` is the same name with a split internal structure. For most consumers, the migration is a version bump:

```diff
- "@libar-dev/architect": "1.0.0-pre.3"
+ "@libar-dev/architect": "^2.0.0-pre.1"
```

If you imported internal modules in `v1`, check the [migration notes](https://github.com/libar-dev/architect#migrating-from-v1) — most public APIs are preserved, but a few have moved between modules.

## License

`MIT AND BUSL-1.1`. See [LICENSE](https://github.com/libar-dev/architect/blob/main/LICENSE) and [LICENSE-MCP](https://github.com/libar-dev/architect/blob/main/LICENSE-MCP).
