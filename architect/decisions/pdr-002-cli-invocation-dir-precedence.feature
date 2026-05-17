@architect
@architect-pdr:002
@architect-pdr-status:accepted
@architect-pdr-category:process
@architect-pattern:PDR002CliInvocationDirPrecedence
@architect-status:completed
@architect-product-area:DataAPI
Feature: PDR-002 - CLI Invocation Directory Precedence

  **Context:**
  `resolveInvocationDir()` in `@libar-dev/architect-cli` and
  `@libar-dev/architect-mcp` underpins the default base-dir for every CLI
  subcommand and every MCP tool. The legacy precedence preferred the `PWD`
  environment variable over `process.cwd()`. This broke `execFile({ cwd })`
  embedding — subprocesses inherit the parent's `PWD`, so the spawned child
  ignored the `cwd` argument it was actually given.

  The W-DOCS-1 runner integration into `architect-generate` will embed the
  CLI via `execFile`. The legacy precedence had to invert before that work
  could land cleanly; tests had been compensating by stripping `PWD` and
  `INIT_CWD` from the child environment (see
  `packages/architect-cli/tests/support/run-cli.ts` pre-cleanup).

  **Decision:**
  Invert the precedence to `process.cwd()` → `INIT_CWD` → `PWD`. Throw if
  none resolves.

  # ===========================================================================
  # DECISION CONTEXT
  # ===========================================================================

  Background: Options considered
    Given the following options were considered:
      | Option | Approach | Verdict |
      | A | Invert to cwd-first; INIT_CWD then PWD as fallbacks; throw if none | Accepted — embedding now correct; symlinked-shell cost is cosmetic |
      | B | Keep PWD-first; document the env-stripping workaround for embedders | Rejected — every embedder pays the same hidden cost forever |
      | C | Add an `--invocation-dir` CLI flag; leave default unchanged | Rejected — defers the trap and lets it persist by default |

  # ===========================================================================
  # RULE 1: DD-1 - process.cwd() is canonical
  # ===========================================================================

  Rule: DD-1 - process.cwd() takes precedence

    **Invariant:** When `process.cwd()` resolves to a non-empty string,
    `resolveInvocationDir()` returns that value, regardless of the values
    of `PWD` and `INIT_CWD`.

    **Rationale:** Subprocesses spawned via `execFile({ cwd })` inherit the
    parent's `PWD`. PWD-first precedence ignored the `cwd` argument the
    embedder explicitly set, silently breaking the contract.

    **Verified by:** `cli-invocation-dir.feature` scenarios cover PWD set,
    INIT_CWD set, and both set; in every case the function returns
    `process.cwd()`.

  # ===========================================================================
  # RULE 2: DD-2 - Env vars are fallbacks, not overrides
  # ===========================================================================

  Rule: DD-2 - INIT_CWD and PWD remain as fallbacks

    **Invariant:** When `process.cwd()` throws, `resolveInvocationDir()`
    falls through to `INIT_CWD`, then `PWD`. If none of the three yields
    a non-empty string, the function throws.

    **Rationale:** `process.cwd()` can throw `ENOENT` if the working
    directory was deleted underneath the process — a real failure mode for
    long-running daemons (MCP servers, file watchers). Falling through to
    env vars gives the process a fighting chance instead of crashing on
    every subsequent path operation.

    **Verified by:** N/A — fallback paths exercised by code review (no
    realistic test fixture for a deleted-cwd state); function structure
    pinned via type-system + lint.

  # ===========================================================================
  # RULE 3: DD-3 - Symlinked-shell cost is acceptable
  # ===========================================================================

  Rule: DD-3 - Logical-path display is acceptably lost

    **Invariant:** Interactive symlinked-shell users see the physical
    (resolved) path in error messages and path-display surfaces, not the
    logical (PWD) path. No CLI flag re-enables PWD-first.

    **Rationale:** PWD-first preserved logical paths for shell users who
    `cd`-d through symlinks. With the invert, that cosmetic benefit is
    lost. Embedding is the canonical surface; logical-path display is a
    nice-to-have that fewer users notice and none rely on for correctness.

    **Verified by:** N/A — explicitly accepted as a tradeoff in this
    decision; no surface is added to opt back in.

  # ===========================================================================
  # ACCEPTANCE CRITERIA
  # ===========================================================================

  @acceptance-criteria @happy-path
  Scenario: Embedder via execFile cwd honored
    Given a parent process with PWD set to "/parent/dir"
    When the parent spawns the CLI via execFile with cwd "/target/dir"
    Then the CLI's resolveInvocationDir returns "/target/dir"

  @acceptance-criteria @happy-path
  Scenario: Test harness no longer strips env
    Given the architect-cli test harness in tests/support/run-cli.ts
    When inspecting the harness env construction
    Then it passes process.env directly without deleting PWD or INIT_CWD
