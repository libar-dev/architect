# @libar-dev/architect

Meta-package for the Libar Architect toolchain — installs the full package family in one dependency and exposes all 7 CLI bins.

Installing this package installs:

- `@libar-dev/architect-core` — model, ingestion, read API
- `@libar-dev/architect-projection` — projection pipeline, fragments, renderers
- `@libar-dev/architect-guard` — policy, validation, process guard
- `@libar-dev/architect-cli` — CLI bins
- `@libar-dev/architect-mcp` — MCP server

…and exposes all 7 bins on your `node_modules/.bin`: `architect`, `architect-generate`, `architect-guard`, `architect-lint-patterns`, `architect-lint-steps`, `architect-validate`, `architect-mcp`.

## When to install this vs. the granular splits

Install the meta-package when you want the full toolchain with no thinking. Install the granular splits when you want a narrower dependency footprint — e.g. a CI job that only needs `architect-validate` can depend on `@libar-dev/architect-cli` directly.

## This package has no JavaScript API

The meta-package is **bin-only**. There is no `import { … } from '@libar-dev/architect'` — to use the JS API, import directly from the split that owns the symbol:

```ts
import { createArchitect } from '@libar-dev/architect-core';
import { renderMarkdown } from '@libar-dev/architect-projection/renderers';
import { runProcessGuard } from '@libar-dev/architect-guard';
```

This is a deliberate change from `v1`, which was a monolith published at this same name with a JS barrel. See [MIGRATION.md](https://github.com/libar-dev/architect/blob/main/MIGRATION.md) for the v1→v2 import-path map.

## Migrating from `1.0.0-pre.3`

`v1` was a monolith published as `@libar-dev/architect`. `v2` is the same name with a split internal structure.

If you only consumed bins (`npx architect …`), the migration is a version bump:

```diff
- "@libar-dev/architect": "1.0.0-pre.3"
+ "@libar-dev/architect": "^2.0.0-pre.1"
```

If you imported JS APIs from `'@libar-dev/architect'`, update each import to point at the split that now owns the symbol. See [MIGRATION.md](https://github.com/libar-dev/architect/blob/main/MIGRATION.md).

## License

MIT. See [LICENSE](https://github.com/libar-dev/architect/blob/main/LICENSE).
