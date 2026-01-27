### External Package Sources (deps-packages/)

> **Claude Code Context Only**: This directory contains git subtrees of external packages for **source code exploration during Claude Code sessions**. These are NOT the actual dependencies—those come from npm via `package.json`.

**Purpose:** Enable Claude Code to read implementations, understand APIs, and reference source code without leaving the repo.

**Current Packages:**

| Package           | Namespace                    | Purpose                     |
| ----------------- | ---------------------------- | --------------------------- |
| modular-claude-md | @libar-dev/modular-claude-md | CLAUDE.md generation system |

**Rules:**

| Rule         | Enforcement                                   |
| ------------ | --------------------------------------------- |
| Read freely  | Use Glob/Grep/Read to explore implementations |
| Don't modify | `Edit(deps-packages/**)` denied               |
| Don't push   | `git subtree push` blocked by settings        |

**Updating packages:**

```bash
# Update to a specific tag
git subtree pull --prefix=deps-packages/<name> <remote> <tag> --squash

# Example:
git subtree pull --prefix=deps-packages/modular-claude-md modular-claude-md v1.0.0 --squash
```
