@architect
@architect-pattern:ValueTransferState
@architect-status:candidate
@architect-product-area:Projection
@architect-uses:MCPToolRegistry,PatternGraphCliSubcommands
@architect-bounded-context:projection
@architect-see-also:ADR006SingleReadModelArchitecture,ArchitectBriefDeterministicBundle
Feature: ValueTransferState

  **Problem:**
  Three load-bearing rules about the design-level spec lifecycle exist
  today only as prose in CLAUDE.md and the
  `architect-claude-plugin` skills: **zombie design spec**,
  **broken forward/reverse link**, and **retroactive plan-level spec**.
  All three are fully computable from existing scanner output (specs,
  executable Gherkin, annotated TS) but no Data API verb returns the
  derivation, so cleanup is a manual audit. The doctrine itself lives
  in
  `packages/architect-claude-plugin/skills/_shared/value-transfer.md`
  — this spec mechanizes the detection so consumers (skills, brief
  bundle, future Studio Dashboard) get a deterministic verdict.

  **Solution:**
  Add a governance-subdomain projection that joins per-pattern data
  across the three source surfaces and returns a `ValueTransferState`
  fragment:

  - `designSpecPath` -- path to `architect/specs/<P>.feature`, or null
  - `executableSpecPaths` -- `tests/features/**/*.feature` files with
    `@architect-implements:<P>` (zero or more)
  - `annotatedSourcePaths` -- production TS files with
    `@architect-pattern:<P>` (zero or more, excludes test/spec files)
  - `forwardLink` -- the `@architect-executable-specs:<path>` value on
    the design spec, or null
  - `reverseLinks` -- the `@architect-implements` lists declared on each
    executable feature, expanded
  - `antipatterns` -- enum array of detected anti-patterns
    (`zombie-design-spec`, `broken-forward-link`, `broken-reverse-link`,
    `retroactive-plan`)
  - `deletionReady` -- boolean; true only when all transfer invariants
    hold (see Rule 3)
  - `transferComplete` -- boolean; true when executable specs and
    annotated source both carry the rich content the design spec used
    to host

  Surfaces:
  1. `pkg:query value-transfer <pattern>` CLI verb (governance sibling
     of `rules` and `taxonomy`).
  2. `architect_value_transfer` MCP tool with the same input shape.
  3. The fragment is consumed by `ArchitectBriefDeterministicBundle`
     (sibling candidate) so every brief response surfaces the
     value-transfer state of the focal pattern, making the load-bearing
     anti-patterns visible at every session-open instead of only on
     explicit query.

  **Business Value:**
  | Benefit | Impact |
  | Anti-patterns become enforceable | `architect-implement-spec` and `architect-review-implementation` skills can refuse to delete a spec when `deletionReady` is false |
  | Zombie cleanup is mechanical | Listing every pattern with `zombie-design-spec` becomes one query, not a manual audit |
  | Pre-deletion link integrity is binary | Replaces "I think this is safe to delete" with a deterministic verdict |
  | Retroactive plan-level is detectable | Catches the inverted-pipeline anti-pattern at scope-validate time |
  | Reuses existing scanner output | No new extraction work; pure composition over what `buildPatternGraph()` already produces |

  **Worked example:**
  The MCPServerIntegration cleanup completed manually in 2026-04 is the
  motivating case — `pkg:query value-transfer MCPServerIntegration`
  would have returned `deletionReady: true` with the forward/reverse
  links resolved, instead of requiring a hand audit. Future cleanups
  (the overview implies several — 37 active patterns out of 174 total,
  some likely retroactively completed) become a single query away.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | ValueTransferState fragment schema | pending | packages/architect-projection/src/fragments/governance/value-transfer-state.ts | Yes | typecheck |
      | Supporting types (paths, antipatterns, links) | pending | packages/architect-projection/src/fragments/governance/supporting.ts | Yes | typecheck |
      | buildValueTransferState internal function | pending | packages/architect-projection/src/projections/governance/value-transfer-state.internal.ts | Yes | unit |
      | projectValueTransferState projection function | pending | packages/architect-projection/src/projections/governance/value-transfer-state.ts | Yes | unit |
      | parseAndProjectValueTransferState wrapper | pending | packages/architect-projection/src/projections/governance/value-transfer-state.ts | Yes | unit |
      | ValueTransferStateOptionsSchema | pending | packages/architect-projection/src/projections/governance/value-transfer-state.internal.ts | Yes | typecheck |
      | governance fragment barrel export | pending | packages/architect-projection/src/fragments/governance/index.ts | Yes | typecheck |
      | governance projection barrel export | pending | packages/architect-projection/src/projections/governance/index.ts | Yes | typecheck |
      | top-level fragments barrel export | pending | packages/architect-projection/src/fragments/index.ts | Yes | typecheck |
      | value-transfer CLI verb registration | pending | packages/architect-cli/src/cli/pattern-graph-cli-commands.ts | Yes | integration |
      | value-transfer CLI command definition | pending | packages/architect-cli/src/cli/commands/governance.ts | Yes | integration |
      | architect_value_transfer MCP input shape | pending | packages/architect-mcp/src/tool-input-schemas.ts | Yes | integration |
      | architect_value_transfer MCP handler | pending | packages/architect-mcp/src/tool-registry.ts | Yes | integration |
      | architect_value_transfer metadata entry | pending | packages/architect-mcp/src/tool-metadata.ts | Yes | integration |
      | CLI value-transfer scenarios | pending | packages/architect/tests/features/cli/data-api-help.feature | Yes | integration |
      | MCP architect_value_transfer scenarios | pending | packages/architect-mcp/tests/features/architect-mcp-integration.feature.steps.ts | Yes | integration |

  # ============================================================================
  # RULE 1: Detection Is Graph-Derived, Never Speculative
  # ============================================================================

  Rule: Anti-pattern flags are emitted only from observed scanner output

    **Invariant:** The fragment never reports an anti-pattern unless every
    source artifact required for that anti-pattern has been observed in
    the pattern graph. Absence of a file is reported as "unknown" or
    represented as `null`/empty array; absence is never silently
    inferred to mean "missing." Each anti-pattern entry has a fixed,
    documented set of source-path prerequisites; if any prerequisite
    is unobservable from current graph state, the flag is omitted
    rather than guessed.

    **Rationale:** False-positive anti-pattern reports erode trust in the
    fragment as an enforcement input. ADR-006 (Single Read Model)
    requires every consumer to read from the graph; this rule extends
    that principle to derivation: the fragment derives only from the
    graph, never from speculation.

    **Verified by:** Anti-pattern detection unit tests cover the
    "absent-source" cases per anti-pattern, Anti-pattern detection
    refuses to emit flags when prerequisites are unobservable

    @acceptance-criteria @happy-path
    Scenario: Pattern with no observed design spec returns null designSpecPath
      Given a pattern Foo with no file at architect/specs/foo.feature
      When I project ValueTransferState for Foo
      Then designSpecPath is null
      And the antipatterns array does not include "zombie-design-spec"

    @acceptance-criteria @edge-case
    Scenario: Anti-pattern omitted when prerequisite source is unobservable
      Given a pattern Bar with annotated production source but no executable feature observed
      When I project ValueTransferState for Bar
      Then the antipatterns array does not include "broken-reverse-link"
      And the antipatterns array does not include "broken-forward-link"

  # ============================================================================
  # RULE 2: Anti-Patterns Are Independently Testable
  # ============================================================================

  Rule: Each anti-pattern is independently detectable and may co-occur

    **Invariant:** A pattern can carry multiple anti-pattern flags
    simultaneously. `zombie-design-spec`, `broken-forward-link`,
    `broken-reverse-link`, and `retroactive-plan` are evaluated
    independently against the source surfaces; the antipatterns array
    is the set of flags that hold, not a single classification. Order
    of evaluation is fixed and documented but produces the same set
    regardless of detection order.

    **Rationale:** A spec can be both a zombie (executable + annotated
    source exist) AND have a broken forward link (the
    `@architect-executable-specs` value points at a path that does not
    exist). Collapsing these into a single classification loses
    actionable information.

    **Verified by:** Multi-flag detection scenarios exercise
    co-occurrence cases, Each anti-pattern's detection logic is its
    own unit test, antipatterns array order is stable across runs

    @acceptance-criteria @happy-path
    Scenario: Pattern with multiple anti-patterns reports all of them
      Given a pattern Baz with a design spec, executable spec, annotated source, and a stale forward link
      When I project ValueTransferState for Baz
      Then the antipatterns array contains "zombie-design-spec"
      And the antipatterns array contains "broken-forward-link"

    @acceptance-criteria @happy-path
    Scenario: antipatterns array order is stable
      Given a pattern with two co-occurring anti-patterns
      When I project ValueTransferState twice on identical graph state
      Then both projections produce identical antipatterns arrays

  # ============================================================================
  # RULE 3: Pre-Deletion Safety Is Binary
  # ============================================================================

  Rule: deletionReady is true only when every transfer invariant holds

    **Invariant:** `deletionReady` is true only when ALL of the following
    hold: (a) the design spec carries a non-null `forwardLink`; (b) at
    least one executable feature carries a `@architect-implements`
    declaration that resolves to the focal pattern; (c) the
    `forwardLink` path matches one of the `executableSpecPaths`; (d) at
    least one production source file carries `@architect-pattern:<P>`
    OR the executable feature carries the rule content the design spec
    used to host (annotations are additive per split-ownership; see
    `packages/architect-claude-plugin/skills/_shared/annotation-ownership.md`);
    (e) the antipatterns array does not contain `broken-forward-link`
    or `broken-reverse-link`. If any condition fails, `deletionReady`
    is false. There is no partial readiness.

    **Rationale:** The full doctrine for ephemerality and the
    deletion gate lives at
    `packages/architect-claude-plugin/skills/_shared/value-transfer.md`.
    This rule mechanizes that gate.

    **Verified by:** deletionReady is true for fully-transferred
    patterns, deletionReady is false when any link condition fails,
    The MCPServerIntegration historical case (now deleted) would have
    returned deletionReady true under this rule

    @acceptance-criteria @happy-path
    Scenario: Fully-transferred pattern is deletionReady
      Given a pattern Qux with a design spec carrying @architect-executable-specs:tests/features/qux.feature
      And the file tests/features/qux.feature exists with @architect-implements:Qux
      And at least one production TS file carries @architect-pattern:Qux
      When I project ValueTransferState for Qux
      Then deletionReady is true

    @acceptance-criteria @edge-case
    Scenario: Missing forward link prevents deletionReady
      Given a pattern Quux with a design spec but no @architect-executable-specs tag
      And executable and annotated source both exist
      When I project ValueTransferState for Quux
      Then deletionReady is false
      And the antipatterns array contains "broken-forward-link"

  # ============================================================================
  # RULE 4: Output Behaviour Matches Governance-Subdomain Conventions
  # ============================================================================

  Rule: value-transfer verb and architect_value_transfer tool follow rules / taxonomy conventions

    **Invariant:** The CLI verb supports `--format json` (pretty JSON)
    and the default text rendering via `writeProjectionOutput`,
    mirroring `pkg:query rules` and `pkg:query taxonomy`. The MCP tool
    returns the fragment via `renderJsonToolResult`, mirroring
    `architect_rules` and `architect_taxonomy`. The MCP input shape is
    composed via `createStrictReadonlyObjectSchema` referencing
    `ValueTransferStateOptionsSchema.shape` -- single source of truth
    for the option contract.

    **Rationale:** Sibling projections in the same DDD subdomain
    (governance) expose identical surface conventions. Convention
    parity > novelty.

    **Verified by:** CLI value-transfer scenarios in data-api-help.feature,
    MCP architect_value_transfer scenario, MCP input schema is the
    spread of ValueTransferStateOptionsSchema.shape

    @acceptance-criteria @happy-path
    Scenario: CLI verb supports --format json
      When running "pkg:query value-transfer <pattern> --format json"
      Then the output is valid JSON parseable as ValueTransferState
      And the output has "kind": "ValueTransferState"

    @acceptance-criteria @happy-path
    Scenario: MCP tool returns valid JSON via renderJsonToolResult
      When invoking the "architect_value_transfer" tool with {"pattern": "<pattern>"}
      Then the tool result text parses as JSON
      And the parsed JSON has "kind": "ValueTransferState"

  # ============================================================================
  # OPEN QUESTIONS (candidate-tier)
  # ============================================================================

  # Q-FRAGMENT-LOCATION: Place the fragment in the governance subdomain
  # (alongside taxonomy-digest, business-rule, decision-record) or in
  # execution-context (alongside session-context-bundle)? Governance fits
  # because the fragment is about graph-governance enforcement; execution-
  # context fits because the fragment is consumed at session-open by the
  # brief. Recommendation: governance -- the fragment exists independent
  # of any session, and the brief is just one consumer.
  #
  # Q-RETROACTIVE-DETECTION: The "retroactive plan-level" anti-pattern is
  # the trickiest to detect deterministically. Simplest test: plan-tier
  # spec exists AND annotated production source exists AND no executable
  # feature exists. Are there false positives? E.g., a refactor that
  # backfilled a plan spec for legacy code (refactoring carve-out at
  # spec/08-spec-evolution.md:456-468). Should the fragment expose a
  # `retroactiveLikely` boolean instead of a flag, and let the consumer
  # decide?
  #
  # Q-ROLLUP-FRAGMENT: Per-pattern fragment is the MVP. Should there also
  # be a `ValueTransferRollup` fragment that lists every pattern in the
  # graph carrying any anti-pattern? Studio Dashboard would consume the
  # rollup; the brief consumes the per-pattern. Defer to a follow-up
  # candidate or include in MVP?
  #
  # Q-ANNOTATED-SOURCE-CLASSIFICATION: "Production source" means
  # non-spec, non-test source carrying `@architect-pattern:<P>`. The
  # scanner already classifies file kind. Confirm that the existing
  # classification (likely on `ExtractedPattern.file` + the source kind
  # registry) is sufficient, or whether we need a new `isProductionSource`
  # helper. Note: per split-ownership, the production-TS may carry
  # zero `@architect-*` JSDoc legitimately -- the gate accepts that
  # via Rule 3 condition (d) accepting "executable feature carries the
  # content" as an alternative.
  #
  # Q-STUB-INTEGRATION: Stubs in `architect/stubs/` are part of the
  # design-spec scaffolding lifecycle. Should `ValueTransferState` also
  # report `stubFiles` and gate `deletionReady` on stubs being
  # deleted/transferred? Likely yes -- a design spec with surviving stubs
  # is also scaffolding-not-yet-torn-down.
