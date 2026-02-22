# Publishing Guide

This guide covers how to publish `@libar-dev/delivery-process` to npm.

## Prerequisites

1. npm account with access to `@libar-dev` organization
2. Logged in to npm: `npm login`
3. All tests passing: `pnpm test`

## Version Strategy

We use semantic versioning with pre-release tags:

| Tag      | Purpose                  | Install Command                         |
| -------- | ------------------------ | --------------------------------------- |
| `latest` | Stable releases          | `npm i @libar-dev/delivery-process`     |
| `pre`    | Pre-releases (1.0.0-pre) | `npm i @libar-dev/delivery-process@pre` |

## Publishing Workflow

### Pre-releases (Recommended for Initial Releases)

Pre-releases allow testing before marking as stable.

```bash
# First pre-release (e.g., 1.0.0-pre.0)
npm version 1.0.0-pre.0 --no-git-tag-version
git add package.json
git commit -m "chore: prepare 1.0.0-pre.0"
git tag v1.0.0-pre.0
git push && git push --tags

# Publish to npm with 'pre' tag
npm publish --tag pre --access public
```

### Subsequent Pre-releases

```bash
# Bump pre-release version (1.0.0-pre.0 → 1.0.0-pre.1)
pnpm release:pre
npm publish --tag pre --access public
```

### Stable Releases

**Before the first stable release**, update `publishConfig` in `package.json`:

1. Remove `"tag": "pre"` from `publishConfig` (or change to `"tag": "latest"`)
2. Verify with `npm publish --dry-run --access public` (should show tag `latest`, not `pre`)

If you skip this step, stable versions will be published under the `pre` dist-tag and users running `npm install @libar-dev/delivery-process` won't get them.

```bash
# Patch release (1.0.0 → 1.0.1)
pnpm release:patch
npm publish --access public

# Minor release (1.0.0 → 1.1.0)
pnpm release:minor
npm publish --access public

# Major release (1.0.0 → 2.0.0)
pnpm release:major
npm publish --access public
```

## Automated Publishing (GitHub Actions)

The repository includes a GitHub Actions workflow that publishes automatically when you create a GitHub release:

1. Go to GitHub → Releases → "Create a new release"
2. Create a tag (e.g., `v1.0.0-pre.0`)
3. Check "Set as a pre-release" for pre-releases
4. Click "Publish release"

The workflow will:

- Build the package fresh (`pnpm build`)
- Run tests
- Publish to npm with the appropriate tag (`pre` for pre-releases, `latest` for stable)
- Include provenance attestation for supply chain security

**Required secret:** `NPM_TOKEN` - npm automation token with publish permissions.

## Pre-commit and Pre-push Hooks

The repository uses Husky for git hooks:

### Pre-commit

- Runs `lint-staged` (ESLint + Prettier on staged files)
- Runs `typecheck`
- Runs `lint:process` (FSM validation on staged files)

### Pre-push

- Runs full test suite

## Dry Run

Always test with `--dry-run` before publishing:

```bash
npm publish --dry-run --tag pre --access public
```

This shows what would be published without actually publishing.

## Verifying a Published Package

After publishing, verify the package:

```bash
# Check npm registry
npm view @libar-dev/delivery-process

# Check dist-tags
npm view @libar-dev/delivery-process dist-tags

# Install in a test project
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y
npm install @libar-dev/delivery-process@pre
```

## Troubleshooting

### npm publish fails with authentication error

```bash
npm login
npm whoami  # Verify you're logged in
```

### Package not found after publishing

npm can take a few minutes to propagate. If still not found:

```bash
npm cache clean --force
npm view @libar-dev/delivery-process
```
