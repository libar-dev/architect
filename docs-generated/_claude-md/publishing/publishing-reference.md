# PublishingReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Version Strategy

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

### Pre-releases

**Context:** Pre-releases allow testing before marking as stable. Recommended for initial releases.

    **First Pre-release Workflow:**

    """bash
    npm version 1.0.0-pre.0 --no-git-tag-version
    pnpm build
    git add -A
    git commit -m "chore: prepare 1.0.0-pre.0"
    git tag v1.0.0-pre.0
    git push && git push --tags

    npm publish --tag pre --access public
    """

    **What This Does:**

| Step | Command | Effect |
| --- | --- | --- |
| 1 | npm version | Sets version in package.json |
| 2 | pnpm build | Compiles TypeScript to dist/ |
| 3 | git add/commit | Stages and commits version bump |
| 4 | git tag | Creates version tag |
| 5 | git push | Pushes code and tag to remote |
| 6 | npm publish | Publishes to npm with pre tag |

### Stable Releases

**Context:** Stable releases are marked as latest and are production-ready.

    **Patch Release (X.Y.Z to X.Y.Z+1):**

    """bash
    pnpm release:patch
    npm publish --access public
    """

    **Minor Release (X.Y.Z to X.Y+1.0):**

    """bash
    pnpm release:minor
    npm publish --access public
    """

    **Major Release (X.Y.Z to X+1.0.0):**

    """bash
    pnpm release:major
    npm publish --access public
    """

    **When to Use Each:**

| Release Type | When to Use |
| --- | --- |
| Patch | Bug fixes, documentation updates, no new features |
| Minor | New features, backward-compatible changes |
| Major | Breaking changes, API incompatibilities |

### Automated Publishing

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

### Git Hooks

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

### Verification

**Context:** After publishing, verify the package is correctly available.

    **Check npm Registry:**

    """bash
    npm view @libar-dev/delivery-process
    """

    **Test Installation:**

    """bash
    mkdir /tmp/test-install && cd /tmp/test-install
    npm init -y
    npm install @libar-dev/delivery-process at-pre
    """

    **Verification Checklist:**

| Check | Expected Result |
| --- | --- |
| npm view shows version | Correct version number |
| Installation succeeds | No dependency errors |
| Package size reasonable | Similar to previous releases |

### Troubleshooting

**Context:** Common publishing issues and their solutions.

    **Common Issues:**

| Issue | Cause | Solution |
| --- | --- | --- |
| dist/ is out of sync error | dist/ differs from committed version | pnpm build && git add dist/ && git commit --amend --no-edit && git push |
| Authentication error | Not logged in to npm | npm login && npm whoami |
| Package not found after publish | npm propagation delay | Wait a few minutes, then npm cache clean --force |
| Permission denied | No access to at-libar-dev org | Request access from organization admin |
| Version already exists | Version was previously published | Bump version number and retry |

    **Fixing dist/ Out of Sync:**

    """bash
    pnpm build
    git add dist/
    git commit --amend --no-edit
    git push
    """

    **Fixing Authentication:**

    """bash
    npm login
    npm whoami
    """

    **Fixing Cache Issues:**

    """bash
    npm cache clean --force
    npm view @libar-dev/delivery-process
    """
