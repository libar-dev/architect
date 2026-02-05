# PublishingReference

**Purpose:** Full documentation generated from decision document
**Detail Level:** detailed

---

**Problem:**
  Publishing the package to npm requires following specific versioning strategies,
  workflow steps, and troubleshooting procedures. Maintaining this documentation
  manually leads to drift from actual workflow and scripts.

  **Solution:**
  Auto-generate the Publishing reference documentation from this decision document.
  Publishing procedures are procedural and rarely change, making them ideal for
  documentation-as-code. The documentation becomes a projection of the workflow.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/PUBLISHINGREFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/publishing/publishingreference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Prerequisites | THIS DECISION (Rule: Prerequisites) | Rule block list |
| Version Strategy | THIS DECISION (Rule: Version Strategy) | Rule block table |
| Pre-releases | THIS DECISION (Rule: Pre-releases) | Rule block with DocString |
| Subsequent Pre-releases | THIS DECISION (Rule: Subsequent Pre-releases) | Rule block with DocString |
| Stable Releases | THIS DECISION (Rule: Stable Releases) | Rule block with DocString |
| Automated Publishing | THIS DECISION (Rule: Automated Publishing) | Rule block list |
| Git Hooks | THIS DECISION (Rule: Git Hooks) | Rule block table |
| Dry Run | THIS DECISION (Rule: Dry Run) | Rule block with DocString |
| Verification | THIS DECISION (Rule: Verification) | Rule block with DocString |
| Troubleshooting | THIS DECISION (Rule: Troubleshooting) | Rule block table |

---

## Implementation Details

### Prerequisites

**Context:** Before publishing, developers must meet these prerequisites.

    **Requirements:**

    1. npm account with access to at-libar-dev organization

    2. Logged in to npm (run: npm login)

    3. All tests passing (run: pnpm test)

    4. Build completes successfully (run: pnpm build)

    5. Typecheck passes (run: pnpm typecheck)

### Version Strategy

**Context:** The package uses semantic versioning with pre-release tags.

    **Decision:** Two distribution tags are used:

| Tag | Purpose | Install Command |
| --- | --- | --- |
| latest | Stable releases (production-ready) | npm i at-libar-dev/delivery-process |
| pre | Pre-releases (testing, 1.0.0-pre.N) | npm i at-libar-dev/delivery-process at-pre |

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

### Subsequent Pre-releases

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

### Stable Releases

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

### Dry Run

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

### Verification

**Context:** After publishing, verify the package is correctly available.

    **Check npm Registry:**

```bash
npm view at-libar-dev/delivery-process
```

**Test Installation:**

```bash
mkdir /tmp/test-install && cd /tmp/test-install
    npm init -y
    npm install at-libar-dev/delivery-process at-pre
```

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

```bash
pnpm build
    git add dist/
    git commit --amend --no-edit
    git push
```

**Fixing Authentication:**

```bash
npm login
    npm whoami
```

**Fixing Cache Issues:**

```bash
npm cache clean --force
    npm view at-libar-dev/delivery-process
```
