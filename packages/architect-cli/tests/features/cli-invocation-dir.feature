@architect
@architect-pattern:CliInvocationDirResolutionExecutableTests
@architect-status:candidate
@architect-product-area:DataAPI
@architect-implements:CLIRuntimePaths
@architect-bounded-context:cli
Feature: CLI invocation directory precedence

  `resolveInvocationDir()` underpins every CLI subcommand's default base-dir.
  Precedence is `process.cwd()` first, with `INIT_CWD` and `PWD` as env-var
  fallbacks. Inverted from the legacy `PWD`-first behavior so that
  `execFile({ cwd })` embedding (required by the W-DOCS-1 runner) is honored.

  Rule: process.cwd() takes precedence over PWD and INIT_CWD

    **Invariant:** When `process.cwd()` resolves successfully, the returned
    invocation directory equals `process.cwd()` regardless of the values of
    `PWD` or `INIT_CWD`.

    **Rationale:** Subprocesses spawned via `execFile({ cwd })` inherit the
    parent's `PWD`. If `PWD` wins, the child ignores the cwd argument it was
    spawned with — silently breaking embedders.

    **Verified by:** scenarios below stub PWD/INIT_CWD to bogus paths and
    assert the function returns process.cwd().

    @happy-path
    Scenario: PWD pointing elsewhere does not override process.cwd()
      Given PWD is set to a bogus path
      When I call resolveInvocationDir
      Then the result equals process.cwd()

    @happy-path
    Scenario: INIT_CWD pointing elsewhere does not override process.cwd()
      Given INIT_CWD is set to a bogus path
      When I call resolveInvocationDir
      Then the result equals process.cwd()

    @happy-path
    Scenario: Both PWD and INIT_CWD set, process.cwd() still wins
      Given PWD is set to a bogus path
      And INIT_CWD is set to a bogus path
      When I call resolveInvocationDir
      Then the result equals process.cwd()
