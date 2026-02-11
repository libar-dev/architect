# Publishing Reference

**Purpose:** Reference document: Publishing Reference
**Detail Level:** Compact summary

---

## Prerequisites

---

## Pre-Publish Checklist

| Step | Command | Expected Result |
| --- | --- | --- |
| 1. Verify npm login | npm whoami | Shows your username |
| 2. Run tests | pnpm test | All tests pass |
| 3. Run typecheck | pnpm typecheck | No type errors |
| 4. Build package | pnpm build | Clean compilation |
| 5. Verify dist/ is current | git status | No uncommitted changes |
| 6. Run dry-run | npm publish --dry-run --access public | Preview looks correct |
| 7. Check version | grep version package.json | Version is correct |

| Mistake | Prevention |
| --- | --- |
| Stale dist/ directory | Always run pnpm build before commit |
| Wrong version number | Use release scripts, not manual edits |
| Missing npm login | Run npm whoami before publish |
| Uncommitted changes | Run git status before publish |

---

## Package Configuration

| Field | Value | Purpose |
| --- | --- | --- |
| name | @libar-dev/delivery-process | Scoped package name |
| version | X.Y.Z or X.Y.Z-pre.N | Current version |
| main | dist/index.js | CommonJS entry point |
| module | dist/index.mjs | ES module entry point |
| types | dist/index.d.ts | TypeScript declarations |
| files | ["dist", "bin"] | Files included in package |
| publishConfig.access | public | Required for scoped packages |

---

## Version Strategy

| Tag | Purpose | Install Command |
| --- | --- | --- |
| latest | Stable releases (production-ready) | npm i @libar-dev/delivery-process |
| pre | Pre-releases (testing, 1.0.0-pre.N) | npm i @libar-dev/delivery-process at-pre |

| Version Type | Format | Example |
| --- | --- | --- |
| Pre-release | X.Y.Z-pre.N | 1.0.0-pre.0, 1.0.0-pre.1 |
| Patch | X.Y.Z | 1.0.1 |
| Minor | X.Y.0 | 1.1.0 |
| Major | X.0.0 | 2.0.0 |

---

## Pre-releases

| Step | Command | Effect |
| --- | --- | --- |
| 1 | npm version | Sets version in package.json |
| 2 | pnpm build | Compiles TypeScript to dist/ |
| 3 | git add/commit | Stages and commits version bump |
| 4 | git tag | Creates version tag |
| 5 | git push | Pushes code and tag to remote |
| 6 | npm publish | Publishes to npm with pre tag |

---

## Subsequent Pre-releases

---

## Stable Releases

| Release Type | When to Use |
| --- | --- |
| Patch | Bug fixes, documentation updates, no new features |
| Minor | New features, backward-compatible changes |
| Major | Breaking changes, API incompatibilities |

---

## Release Scripts

| Script | Command | What It Does |
| --- | --- | --- |
| release:pre | pnpm release:pre | Bumps pre-release version, commits, tags, pushes |
| release:patch | pnpm release:patch | Bumps patch version, commits, tags, pushes |
| release:minor | pnpm release:minor | Bumps minor version, commits, tags, pushes |
| release:major | pnpm release:major | Bumps major version, commits, tags, pushes |

---

## Automated Publishing

| Step | Action |
| --- | --- |
| 1 | Runs test suite |
| 2 | Builds the package |
| 3 | Publishes to npm with appropriate tag |

| Release Type | npm Tag |
| --- | --- |
| Pre-release | pre |
| Stable | latest |

---

## Git Hooks

| Check | Command | Purpose |
| --- | --- | --- |
| Lint staged files | lint-staged | ESLint + Prettier on changed files |
| Type check | pnpm typecheck | Catch type errors before commit |

| Check | Command | Purpose |
| --- | --- | --- |
| Full test suite | pnpm test | Ensure all tests pass |
| Build | pnpm build | Verify compilation succeeds |
| dist/ sync | git diff | Ensures dist/ matches source |

---

## Dry Run

---

## Verification

| Check | Expected Result |
| --- | --- |
| npm view shows version | Correct version number |
| Installation succeeds | No dependency errors |
| Package size reasonable | Similar to previous releases |

---

## Troubleshooting

| Issue | Cause | Solution |
| --- | --- | --- |
| dist/ is out of sync error | dist/ differs from committed version | pnpm build, git add dist/, git commit --amend --no-edit, git push |
| Authentication error | Not logged in to npm | npm login, npm whoami |
| Package not found after publish | npm propagation delay | Wait a few minutes, then npm cache clean --force |
| Permission denied | No access to at-libar-dev org | Request access from organization admin |
| Version already exists | Version was previously published | Bump version number and retry |

---
