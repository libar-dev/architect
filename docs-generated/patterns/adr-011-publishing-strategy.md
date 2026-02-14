# 📋 ADR 011 Publishing Strategy

**Purpose:** Detailed documentation for the ADR 011 Publishing Strategy pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | DDD |
| Phase | 99 |

## Description

**Context:**
  Publishing the package to npm requires following specific versioning strategies,
  workflow steps, and troubleshooting procedures:
  - Pre-release and stable release workflows differ significantly
  - Git hooks enforce quality gates before commit and push
  - Dry runs are essential to prevent publishing mistakes
  - Post-publish verification ensures package availability

  **Decision:**
  Standardize publishing with two distribution tags and automated scripts:
  - **pre** tag for pre-releases (testing, 1.0.0-pre.N format)
  - **latest** tag for stable releases (production-ready)
  - Release scripts handle version bump, build, commit, tag, and push
  - Pre-commit and pre-push hooks enforce quality gates
  - Dry run workflow before every actual publish

  **Consequences:**
  - (+) Consistent publishing workflow reduces human error
  - (+) Git hooks catch issues before they reach npm
  - (+) Two-tag strategy allows safe testing before stable release
  - (+) Automated scripts eliminate manual version management
  - (-) Additional tooling to maintain (Husky, release scripts)
  - (-) Hook failures can be frustrating during rapid development

## Acceptance Criteria

**ADR generates Publishing Reference documentation**

- Given this decision document with convention tags
- When the reference codec processes publishing convention
- Then the output contains version strategy and release workflow tables
- And pre-publish checklist and troubleshooting tables are present

## Business Rules

**Prerequisites**

**Context:** Before publishing, developers must meet these prerequisites.

    **Requirements:**

    1. npm account with access to at-libar-dev organization

    2. Logged in to npm (run: npm login)

    3. All tests passing (run: pnpm test)

    4. Build completes successfully (run: pnpm build)

    5. Typecheck passes (run: pnpm typecheck)

**Pre-Publish Checklist**

**Context:** Complete this checklist before every publish to avoid common issues.

    **Checklist:**

    | Step | Command | Expected Result |
    | --- | --- | --- |
    | 1. Verify npm login | npm whoami | Shows your username |
    | 2. Run tests | pnpm test | All tests pass |
    | 3. Run typecheck | pnpm typecheck | No type errors |
    | 4. Build package | pnpm build | Clean compilation |
    | 5. Verify dist/ is current | git status | No uncommitted changes |
    | 6. Run dry-run | npm publish --dry-run --access public | Preview looks correct |
    | 7. Check version | grep version package.json | Version is correct |

    **Common Pre-Publish Mistakes:**

    | Mistake | Prevention |
    | --- | --- |
    | Stale dist/ directory | Always run pnpm build before commit |
    | Wrong version number | Use release scripts, not manual edits |
    | Missing npm login | Run npm whoami before publish |
    | Uncommitted changes | Run git status before publish |

**Package Configuration**

**Context:** The package.json configuration controls what gets published.

    **Key Configuration Fields:**

    | Field | Value | Purpose |
    | --- | --- | --- |
    | name | @libar-dev/delivery-process | Scoped package name |
    | version | X.Y.Z or X.Y.Z-pre.N | Current version |
    | main | dist/index.js | CommonJS entry point |
    | module | dist/index.mjs | ES module entry point |
    | types | dist/index.d.ts | TypeScript declarations |
    | files | ["dist", "bin"] | Files included in package |
    | publishConfig.access | public | Required for scoped packages |

    **Files Array:** The files array controls what gets published. Only dist/
    and bin/ directories are included. Source code (src/) is excluded.

**Version Strategy**

**Context:** The package uses semantic versioning with pre-release tags.

    **Decision:** Two distribution tags are used:

    | Tag | Purpose | Install Command |
    | --- | --- | --- |
    | latest | Stable releases (production-ready) | npm i @libar-dev/delivery-process |
    | pre | Pre-releases (testing, 1.0.0-pre.N) | npm i @libar-dev/delivery-process at-pre |

    **Version Format:**

    | Version Type | Format | Example |
    | --- | --- | --- |
    | Pre-release | X.Y.Z-pre.N | 1.0.0-pre.0, 1.0.0-pre.1 |
    | Patch | X.Y.Z | 1.0.1 |
    | Minor | X.Y.0 | 1.1.0 |
    | Major | X.0.0 | 2.0.0 |

**Pre-releases**

**Context:** Pre-releases allow testing before marking as stable.

    **First Pre-release Workflow:**

```bash
npm version 1.0.0-pre.0 --no-git-tag-version
    pnpm build
    git add -A
    git commit -m "chore: prepare 1.0.0-pre.0"
    git tag v1.0.0-pre.0
    git push && git push --tags

    npm publish --tag pre --access public
```

**What This Does:**

    | Step | Command | Effect |
    | --- | --- | --- |
    | 1 | npm version | Sets version in package.json |
    | 2 | pnpm build | Compiles TypeScript to dist/ |
    | 3 | git add/commit | Stages and commits version bump |
    | 4 | git tag | Creates version tag |
    | 5 | git push | Pushes code and tag to remote |
    | 6 | npm publish | Publishes to npm with pre tag |

**Subsequent Pre-releases**

**Context:** After the first pre-release, subsequent ones use the release:pre script.

    **Subsequent Pre-release Workflow:**

```bash
pnpm release:pre
    npm publish --tag pre --access public
```

**What Happens:**

    - Version bumps from 1.0.0-pre.0 to 1.0.0-pre.1

    - Changes are committed and tagged automatically

    - Push to remote includes tags

**Stable Releases**

**Context:** Stable releases are marked as latest and are production-ready.

    **Patch Release (X.Y.Z to X.Y.Z+1):**

```bash
pnpm release:patch
    npm publish --access public
```

**Minor Release (X.Y.Z to X.Y+1.0):**

```bash
pnpm release:minor
    npm publish --access public
```

**Major Release (X.Y.Z to X+1.0.0):**

```bash
pnpm release:major
    npm publish --access public
```

**When to Use Each:**

    | Release Type | When to Use |
    | --- | --- |
    | Patch | Bug fixes, documentation updates, no new features |
    | Minor | New features, backward-compatible changes |
    | Major | Breaking changes, API incompatibilities |

**Release Scripts**

**Context:** The package provides pnpm scripts for consistent releases.

    **Available Release Scripts:**

    | Script | Command | What It Does |
    | --- | --- | --- |
    | release:pre | pnpm release:pre | Bumps pre-release version, commits, tags, pushes |
    | release:patch | pnpm release:patch | Bumps patch version, commits, tags, pushes |
    | release:minor | pnpm release:minor | Bumps minor version, commits, tags, pushes |
    | release:major | pnpm release:major | Bumps major version, commits, tags, pushes |

    **Script Workflow:** Each release script performs these steps automatically:

    1. Bumps version in package.json

    2. Runs pnpm build

    3. Creates git commit with version message

    4. Creates git tag (e.g., v1.0.1)

    5. Pushes commit and tag to remote

    **After Running Script:** You must still run npm publish manually.

**Automated Publishing**

**Context:** GitHub Actions can automate publishing when creating releases.

    **GitHub Release Workflow:**

    1. Go to GitHub repository

    2. Navigate to Releases

    3. Click Create a new release

    4. Create a tag (e.g., v1.0.0-pre.0)

    5. Check Set as a pre-release for pre-releases

    6. Click Publish release

    **What the Workflow Does:**

    | Step | Action |
    | --- | --- |
    | 1 | Runs test suite |
    | 2 | Builds the package |
    | 3 | Publishes to npm with appropriate tag |

    **Tag Selection:**

    | Release Type | npm Tag |
    | --- | --- |
    | Pre-release | pre |
    | Stable | latest |

    **Required Secret:** NPM_TOKEN - npm automation token with publish permissions.

**Git Hooks**

**Context:** The repository uses Husky for git hooks to prevent common issues.

    **Pre-commit Hook:**

    | Check | Command | Purpose |
    | --- | --- | --- |
    | Lint staged files | lint-staged | ESLint + Prettier on changed files |
    | Type check | pnpm typecheck | Catch type errors before commit |

    **Pre-push Hook:**

    | Check | Command | Purpose |
    | --- | --- | --- |
    | Full test suite | pnpm test | Ensure all tests pass |
    | Build | pnpm build | Verify compilation succeeds |
    | dist/ sync | git diff | Ensures dist/ matches source |

    **Why dist/ Sync Matters:**

    The pre-push hook verifies that committed dist/ files match the current build.
    This ensures the published package always reflects the latest source code.
    If dist/ is stale, the push will fail with an error.

**Dry Run**

**Context:** Always test publishing with --dry-run before actual publish.

    **Dry Run Command:**

```bash
npm publish --dry-run --tag pre --access public
```

**What It Shows:**

    - Package name and version

    - Files that would be included

    - Total package size

    - Any publishing errors (without actually publishing)

**Verification**

**Context:** After publishing, verify the package is correctly available.

    **Check npm Registry:**

```bash
npm view @libar-dev/delivery-process
```

**Verification Checklist:**

    | Check | Expected Result |
    | --- | --- |
    | npm view shows version | Correct version number |
    | Installation succeeds | No dependency errors |
    | Package size reasonable | Similar to previous releases |

**Troubleshooting**

**Context:** Common publishing issues and their solutions.

    **Common Issues:**

    | Issue | Cause | Solution |
    | --- | --- | --- |
    | dist/ is out of sync error | dist/ differs from committed version | pnpm build, git add dist/, git commit --amend --no-edit, git push |
    | Authentication error | Not logged in to npm | npm login, npm whoami |
    | Package not found after publish | npm propagation delay | Wait a few minutes, then npm cache clean --force |
    | Permission denied | No access to at-libar-dev org | Request access from organization admin |
    | Version already exists | Version was previously published | Bump version number and retry |

_Verified by: ADR generates Publishing Reference documentation_

---

[← Back to Pattern Registry](../PATTERNS.md)
