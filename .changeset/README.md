# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets). Versions for `@libar-dev/architect`, `-core`, `-projection`, `-guard`, `-cli`, and `-mcp` are kept in lockstep via the `fixed` group in `config.json` — bumping one bumps all six. The spec and the self-host example are ignored.

## Authoring a changeset

```bash
pnpm changeset
```

Pick the bump level (`patch` / `minor` / `major`) and write a one-line summary. Pre-release tags (e.g. `next`) are configured at publish time via `pnpm changeset pre enter next`.
