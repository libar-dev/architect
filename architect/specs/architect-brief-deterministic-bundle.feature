@architect
@architect-pattern:ArchitectBriefDeterministicBundle
@architect-status:candidate
@architect-product-area:DataAPI
@architect-uses:ValueTransferState,SessionContextProjection,MCPToolRegistry,GraphHandleCli
@architect-bounded-context:api
@architect-see-also:ModelEnrichedDataAPI,ADR006SingleReadModelArchitecture,ADR005CodecBasedMarkdownRendering
Feature: ArchitectBriefDeterministicBundle

  **Problem:**
  Every Architect Claude Code slash command (`/architect:plan`,
  `/architect:design`, `/architect:implement`, `/architect:review`,
  `/architect:handoff`) formerly enumerated 3-5 raw CLI verbs (retired, ADR-014) --
  `overview`, `scope-validate`, `context --session <T>`, `dep-tree`,
  `files`, `rules`, sometimes `arch blocking` -- and the agent stitches
  the outputs into a working narrative. The stitching is duplicated
  across slash commands, error-prone (each agent rephrases the same
  payload differently), and creates the rephrase pressure that the
  sibling `ModelEnrichedDataAPI` candidate proposes solving with an
  upstream LLM call.

  Most of what the slash commands stitch is **deterministically
  computable** from existing fragments. The rephrase pressure is
  largely a missing-bundling problem, not a missing-narrative problem.
  Today there is no single deterministic MCP read that returns the union of
  what a session-open needs; each consumer composes the union by hand.

  Three secondary observations sharpen the case:

  1. The `SessionContextBundle` fragment already bundles 12 fields
     (patterns, metadata, specFiles, stubs, dependencies,
     sharedDependencies, consumers, architectureNeighbors, deliverables,
     fsm, fsmByPattern, testFiles) but its shape varies by the typed `session`
     option -- planning returns minimal, design adds stubs, implement
     adds tests. Token-budget pressure (the original reason for
     filtering) has lapsed: Gemini Flash Lite handles 31.7k tokens at
     ~1s per `.plans/spec-review-data-api-matrix.md` § 7.9. The filter
     is now overhead, not value.

  2. `ScopeReadinessReport`, `BusinessRuleSet`, and `OverviewDigest`
     already exist and are exposed through typed MCP tools. The sibling
     `ValueTransferState` candidate is a planned dependency: its fragment,
     projection, and `architect_value_transfer` tool are all still pending.
     Once it lands, composing the four is mechanical projection composition.

  3. Agent sessions already collapse to one graph-handle script
     (ADR-014), so the agent-side stitching problem is dissolved. The
     surviving consumers are the MACHINE sinks -- the plugin hook,
     Studio, CI -- which need one deterministic bundle in one typed
     call instead of stitching several reads.

  **Solution:**
  Add a new `ArchitectBrief` fragment in the `execution-context`
  subdomain that composes shipped fragments with the planned
  `ValueTransferState` projection once that sibling candidate lands. A single
  new MCP tool returns the full bundle:

  - `sessionContext: SessionContextBundle` -- existing fragment, **no
    longer filtered by session-type**; uniform shape for every caller
  - `scopeReadiness: ScopeReadinessReport` -- existing fragment, folded
    in (replaces a separate `architect_scope_validate` tool call)
  - `businessRules: BusinessRuleSet` -- existing fragment, folded in
    (replaces a separate `architect_rules` tool call)
  - `valueTransfer: ValueTransferState` -- the sibling candidate's
    fragment, folded in so every brief surfaces anti-patterns
  - `taxonomySlice: TaxonomySlice` -- new pruned slice; tags the
    pattern declares plus group-sibling tags, with a pointer to the
    full taxonomy read. Keeps token budget tight while making the
    tag choice surface visible at every brief.
  - `transitiveBlockers: BlockingEntry[]` -- graph traversal beyond
    the direct `blockedBy` entries exposed by `architect_arch_blocking`.
    Cycle-safe; bounded depth.
  - `nextActions: NextActionHint[]` -- deterministic lookup over
    current bundle state. Each entry is a follow-up read suggestion plus a
    triggering condition observable in the bundle (e.g., "deletionReady
    is true -> suggest `git rm <designSpecPath>`"). Reproducible
    byte-for-byte across runs given identical graph state.

  Surfaces:
  1. `projectArchitectBrief` and `parseAndProjectArchitectBrief` as pure
     projection entry points over the single read model.
  2. An `architect_brief` MCP tool as the typed machine sink, with the
     same validated input and deterministic output shape.
  3. Graph-handle callers continue to use one `architect q` script over
     `g.graph` and trusted pure kernels; this candidate adds no named CLI
     command and does not widen the frozen ADR-014 handle contract.

  The tool accepts an optional `intent: string` parameter that is
  carried through unmodified to downstream consumers. The
  deterministic payload shape does **not** vary by intent; intent is
  forwarded for use by `ModelEnrichedDataAPI`'s LLM enrichment layer
  on top, never interpreted at the deterministic tier.

  **Business Value:**
  | Benefit | Impact |
  | Single round-trip session-open | Typed machine consumers collapse from 5 tool calls to 1; caller context shrinks proportionally |
  | LLM enrichment lands on richer payload | Wave 1 `model_summary` summarises a bundled, anti-pattern-aware payload, not 5 raw fragments |
  | Anti-patterns visible at every session-open | `valueTransfer.antipatterns` is one structured field away from every plan/design/implement/review session |
  | Convention parity | Deterministic-first, LLM-second mirrors the existing "deterministic CLI / optional MCP enrichment" split elsewhere in the codebase |
  | ADR-006 conformant | No fragment data is re-derived; the bundle is composition over the Single Read Model |
  | Reduced drift surface | One typed bundle tool instead of repeated stitching across machine consumers |

  **Relationship to ModelEnrichedDataAPI:**
  This candidate carves out the **deterministic-bundling slice** of
  the work that the existing `model-enriched-data-api.feature` (~426
  lines) currently proposes as a single MVP. After this candidate
  lands, the `ModelEnrichedDataAPI` spec retains only the LLM-specific
  surfaces:

  | Owned by ArchitectBriefDeterministicBundle (this spec) | Owned by ModelEnrichedDataAPI (sibling spec) |
  | `architect_brief` tool proposal | `model_summary` LLM narrative slice |
  | Multi-endpoint deterministic composition | Provenance envelope (source/confidence/prompt-version/latency_ms) |
  | Removal of session-type filtering | `intent` interpretation for prompt biasing |
  | `taxonomySlice`, `transitiveBlockers`, deterministic `nextActions` | BYOK + Vercel AI SDK + OpenRouter wiring |
  | Single bundling round-trip | `architect_query` NL endpoint with tool-calling |
  | Typed-tool consolidation | LLM-advertised `model_hints` (deterministic `nextActions` is the deterministic counterpart) |
  | Composition with `ValueTransferState` | Graceful degradation when `OPENROUTER_API_KEY` absent |
  | `ArchitectBrief` fragment in `execution-context` subdomain | `ArchitectModelService` host-agnostic wrapper, `ModelEnrichedGraph` decorator, `architect-model` package |

  Wave ordering becomes explicit: this candidate ships first
  (deterministic floor), then `ModelEnrichedDataAPI` MVP wraps it
  (LLM ceiling). The LLM enrichment in wave 2 *projects* this richer
  payload -- higher floor, less drift surface.

  **Why "deterministic floor first":**
  If wave 1 ships an LLM `model_summary` over the existing 5-read
  stitch, the LLM has to *infer* anti-patterns from raw fragments
  (sometimes correctly, sometimes not), and the provenance envelope
  can only say "this is what the model thought," never "this is the
  truth from the graph." With this candidate landed first, the bundle
  itself carries `valueTransfer.antipatterns: ['zombie-design-spec']`
  as graph-derived ground truth; the LLM summarises a payload where
  the load-bearing facts are already structured. Provenance becomes
  authoritative because the underlying claim is graph-queryable.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | ArchitectBrief fragment schema | pending | packages/architect-projection/src/fragments/execution-context/architect-brief.ts | Yes | typecheck |
      | TaxonomySlice fragment schema (pruned) | pending | packages/architect-projection/src/fragments/governance/taxonomy-slice.ts | Yes | typecheck |
      | NextActionHint supporting type | pending | packages/architect-projection/src/fragments/execution-context/supporting.ts | Yes | typecheck |
      | Transitive blocker traversal helper | pending | packages/architect-projection/src/projections/_shared/transitive-blockers.internal.ts | Yes | unit |
      | buildArchitectBrief internal function | pending | packages/architect-projection/src/projections/execution-context/architect-brief.internal.ts | Yes | unit |
      | projectArchitectBrief projection function | pending | packages/architect-projection/src/projections/execution-context/architect-brief.ts | Yes | unit |
      | parseAndProjectArchitectBrief wrapper | pending | packages/architect-projection/src/projections/execution-context/architect-brief.ts | Yes | unit |
      | ArchitectBriefOptionsSchema | pending | packages/architect-projection/src/projections/execution-context/architect-brief.internal.ts | Yes | typecheck |
      | execution-context fragment barrel export | pending | packages/architect-projection/src/fragments/execution-context/index.ts | Yes | typecheck |
      | execution-context projection barrel export | pending | packages/architect-projection/src/projections/execution-context/index.ts | Yes | typecheck |
      | top-level fragments barrel export | pending | packages/architect-projection/src/fragments/index.ts | Yes | typecheck |
      | architect_brief MCP tool definition | pending | packages/architect-mcp/src/tool-registry.ts | Yes | integration |
      | architect_brief MCP input shape | pending | packages/architect-mcp/src/tool-input-schemas.ts | Yes | integration |
      | architect_brief MCP handler | pending | packages/architect-mcp/src/tool-registry.ts | Yes | integration |
      | architect_brief metadata entry | pending | packages/architect-mcp/src/tool-metadata.ts | Yes | integration |
      | MCP architect_brief scenarios | pending | packages/architect-mcp/tests/features/architect-mcp-integration.feature.steps.ts | Yes | integration |

  # ============================================================================
  # RULE 1: Bundle Is Uniform Regardless of Caller Intent
  # ============================================================================

  Rule: ArchitectBrief shape does not vary by session intent

    **Invariant:** The `ArchitectBrief` fragment shape is identical for
    every caller. Session-type filtering is removed: planning, design,
    implement, review, and handoff callers all receive the same fields
    populated the same way. The optional `intent: string` parameter is
    carried unmodified to consumers but never alters which fragments
    are composed, which fields are populated, or how data is shaped.

    **Rationale:** Token-budget pressure (the original reason for
    session-type filtering) lapsed when hosted Gemini Flash Lite
    demonstrated ~1s response across the full Studio rule corpus
    (31.7k tokens). Caller intent steers narrative, not evidence. A
    reviewer needs the same facts as an implementer; the reviewer just
    asks different questions of those facts. Forking the deterministic
    bundle by intent introduces drift between what each session type
    sees, makes the brief's contract harder to test, and re-creates
    the per-session-type rephrase pressure the bundle is designed to
    eliminate.

    **Verified by:** Bundle produces identical fields across intent
    values, intent string is round-tripped unchanged, no field is
    omitted based on intent

    @acceptance-criteria @happy-path
    Scenario: Bundle shape is identical across intents
      Given a pattern Foo with full graph state
      When I project ArchitectBrief for Foo with intent "review for rule conflicts"
      And I project ArchitectBrief for Foo with intent "implement"
      And I project ArchitectBrief for Foo with no intent
      Then all three projections produce identical sessionContext, scopeReadiness, businessRules, valueTransfer, taxonomySlice, transitiveBlockers, and nextActions fields

    @acceptance-criteria @happy-path
    Scenario: intent is round-tripped unchanged
      Given an intent string "design for ADR conflict review"
      When I project ArchitectBrief with that intent
      Then the response carries the intent string unchanged in a top-level field

  # ============================================================================
  # RULE 2: Single Typed Call Replaces Multi-Tool Stitching
  # ============================================================================

  Rule: One brief call returns sufficient state for any session type to proceed

    **Invariant:** A single `architect_brief` MCP call returns every field a
    plan, design, implement, review, or handoff consumer needs to begin work
    without invoking other deterministic tools. The bundle is the union (not a
    subset) of the relevant payloads from `architect_overview`,
    `architect_context`, `architect_scope_validate`, `architect_dep_tree`,
    `architect_files`, `architect_rules`, and `architect_arch_blocking`, plus
    the value-transfer state and taxonomy slice. Any additional typed tool call
    after the brief is optional drill-down, not a prerequisite.

    **Rationale:** This is the load-bearing property that justifies the
    candidate's existence. If the bundle is missing fields common sessions
    need, machine consumers keep stitching and the consolidation never lands.
    Exhaustiveness tests compare the composed brief with the existing typed
    projection and MCP outputs rather than relying on a command dispatcher.

    **Verified by:** Bundle exhaustiveness tests cover every constituent
    projection, architect_brief integration returns the full typed bundle

    @acceptance-criteria @happy-path
    Scenario: Bundle covers the union of typed session reads
      Given a pattern Foo
      When I project ArchitectBrief for Foo
      Then the response contains every relevant field from architect_overview, architect_context, architect_scope_validate, architect_dep_tree, architect_files, architect_rules, and architect_arch_blocking for Foo

    @acceptance-criteria @happy-path
    Scenario: Typed machine consumer opens a session in one call
      Given the architect_brief MCP tool is registered
      When a caller invokes architect_brief for "Foo"
      Then the caller receives the complete ArchitectBrief projection without another tool call

  # ============================================================================
  # RULE 3: Bundling Is Composition, Not Re-Derivation
  # ============================================================================

  Rule: ArchitectBrief is composed from existing fragments via projection composition

    **Invariant:** Every field in `ArchitectBrief` is sourced from a
    shipped projection function (`projectSessionContextBundle`,
    `projectScopeReadinessReport`, `projectBusinessRuleSet`), from this
    candidate's planned `projectTaxonomySlice`, from the sibling candidate's
    planned `projectValueTransferState`, or from a deterministic helper
    (`computeTransitiveBlockers`,
    `deriveNextActions`) that itself reads only from the
    `PatternGraph`. No field is computed by re-walking the scanner
    output, re-deriving relationships, or constructing a parallel
    DTO. ADR-006 (Single Read Model) is preserved.

    **Rationale:** "Parallel Pipeline" is the canonical anti-pattern
    ADR-006 calls out. A bundle that re-derives even one field
    becomes the second source of truth for that field. Composition
    keeps every field traceable to a single existing projection;
    when a downstream fragment changes shape, the brief inherits the
    change automatically.

    **Verified by:** Static check that brief's internal builder calls
    only existing projection functions, No imports of scanner
    primitives in brief's projection module, ADR-006 conformance
    test exists

    @acceptance-criteria @happy-path
    Scenario: Brief module imports only existing projections
      Given the projectArchitectBrief module
      Then its imports are limited to existing projection functions and `_shared` helpers
      And it does not import the scanner module directly
      And it does not construct `PatternGraph` views outside the existing API

  # ============================================================================
  # RULE 4: Next-Actions Are Deterministic
  # ============================================================================

  Rule: nextActions is a fixed lookup over current bundle state, reproducible byte-for-byte

    **Invariant:** The `nextActions` list is derived from a documented
    lookup table over current bundle state. Each entry has a
    triggering condition (a predicate observable in the bundle) and a
    suggested follow-up read (a string). The list is reproducible byte-for-
    byte across runs given identical graph state. No randomization,
    no LLM call, no time-dependent value influences ordering or
    contents.

    **Rationale:** The sibling `ModelEnrichedDataAPI` candidate
    proposes `model_hints` as LLM-advertised follow-ups. The
    deterministic counterpart of "what should I do next?" is a
    pure function over current state. Studio Dashboard, future
    GitHub Action, and typed MCP consumers all benefit from this structured
    output without paying the LLM round-trip. When the
    LLM `model_hints` ships in wave 2, it has the deterministic
    `nextActions` as a known floor it cannot regress past.

    **Verified by:** nextActions is reproducible across runs,
    Each entry's triggering condition is observable in the bundle,
    No LLM dependency in nextActions derivation

    @acceptance-criteria @happy-path
    Scenario: nextActions reproduces byte-for-byte
      Given a pattern with stable graph state
      When I project ArchitectBrief twice
      Then both nextActions arrays are byte-for-byte identical

    @acceptance-criteria @happy-path
    Scenario: Zombie spec triggers deletion suggestion
      Given a pattern Bar with valueTransfer.antipatterns containing "zombie-design-spec" and deletionReady true
      When I project ArchitectBrief for Bar
      Then nextActions contains an entry whose action is `git rm <designSpecPath>`

    @acceptance-criteria @happy-path
    Scenario: Blocked pattern triggers blocker drill-down
      Given a pattern Baz with non-empty transitiveBlockers
      When I project ArchitectBrief for Baz
      Then nextActions contains an entry suggesting the `architect_dep_tree` tool for Baz

  # ============================================================================
  # RULE 5: TaxonomySlice Is Pruned, With Pointer to Full Taxonomy
  # ============================================================================

  Rule: taxonomySlice contains tags-in-use plus group siblings, never the full taxonomy

    **Invariant:** `taxonomySlice.declared` lists only tags the focal
    pattern actually uses (resolvable from the pattern's annotations
    and the source spec/file). `taxonomySlice.groupContexts` lists
    every tag in the same groups as `declared`, so reviewers see the
    choice surface for related tags. Format-type entries are never
    included (the brief is per-pattern; format-types are global). The
    fragment carries a one-line `pointer` field referencing the
    `architect_taxonomy` MCP tool for callers who need the full surface.

    **Rationale:** TAXONOMY.md is ~3,500 tokens. Bulk-dumping it into
    every brief wastes budget on tags the pattern doesn't use. The
    pruned slice (typically 30-40 lines, 600-800 tokens) covers the
    review use case ("should this pattern have set X?") by including
    sibling tags in the same group, while staying under the cost
    line. Callers who need the full taxonomy follow the pointer.

    **Verified by:** Pruned slice contains only relevant tags,
    Pointer field references architect_taxonomy, Format-type entries
    are excluded from the slice

    @acceptance-criteria @happy-path
    Scenario: Pruned slice includes only relevant groups
      Given a pattern Qux declaring `@architect-status:active` and `@architect-product-area:Annotation`
      When I project ArchitectBrief for Qux
      Then taxonomySlice.declared includes the status and product-area entries
      And taxonomySlice.groupContexts includes every tag from the Core Tags and PRD Tags groups
      And taxonomySlice.groupContexts does not include tags from groups Qux does not use

  # ============================================================================
  # OPEN QUESTIONS (candidate-tier)
  # ============================================================================

  # Q-PRUNED-TAXONOMY-SHAPE: Include `groupContexts` (sibling tags in
  # same groups, ~600-800 tokens) or only `declared` (tags pattern uses,
  # ~150-300 tokens)? Including siblings enables review use case "should
  # this pattern have set X?" but adds budget. Recommendation: include
  # siblings -- token budget is no longer load-bearing per matrix doc
  # § 7.9, and the review use case is high-value. Settled inside this
  # spec via Rule 5.
  #
  # Q-TRANSITIVE-BLOCKER-DEPTH: Cap depth at N hops, or unbounded with
  # cycle detection? Default depth=3 with cycle detection seems right
  # for the brief use case (deeper than direct, shallow enough to stay
  # under budget). Confirm with empirical measurement once the bundle
  # is wired.
  #
  # Q-BRIEF-VS-CONTEXT: Keep the typed `architect_context` MCP tool
  # alongside `architect_brief` for consumers that want only session context?
  # Brief is a strict superset, but the two tools expose different frozen typed
  # contracts. Recommendation: both tools coexist; document
  # `architect_context` as the narrower projection.
  #
  # Q-NEXT-ACTIONS-CAP: Cap `nextActions` length? E.g., top-3 most
  # relevant by predicate priority. Avoids overwhelming smaller agents.
  # Recommendation: cap at 5; documented order (most-actionable first)
  # ensures reproducibility.
  #
  # Q-MCP-TOOL-NAME-RECONCILIATION: The `model-enriched-data-api.feature`
  # spec already proposes `architect_brief` as an MCP tool name. After
  # this candidate lands, that name belongs to the deterministic MCP tool
  # specified here; the LLM enrichment in `ModelEnrichedDataAPI` decorates
  # it (returning the same shape plus `model_summary` / `model_hints`
  # when configured). Confirm the cleanup sweep removes the deterministic-
  # surface text from `model-enriched-data-api.feature` and leaves only
  # the LLM-decoration claim against `architect_brief`.
  #
  # Q-INTENT-FORWARDING-SHAPE: Where does `intent` live in the response?
  # Top-level `intent: string`, or inside a `requestEcho` envelope?
  # Top-level is simpler; envelope is more extensible if more parameters
  # are added later. Recommendation: top-level for MVP, with the option
  # of moving to an envelope if `architect_query` shares the shape.
  #
  # Q-BRIEF-WITHOUT-FOCAL-PATTERN: Should the tool support a no-pattern
  # form returning a graph-wide brief (overview + blocking + every
  # pattern's value-transfer rollup)? Out of scope for this candidate;
  # may motivate a separate `architect_dashboard_brief` candidate paired
  # with the `ValueTransferRollup` Q from the sibling spec.
  #
  # Q-TOKEN-BUDGET-SIGNAL: Should the brief (and sibling typed MCP tools)
  # emit a deterministic token-budget signal -- an estimated payload size
  # plus an over/under-budget flag -- so a caller can tell whether the
  # response fits its context window before reading, and self-route to a
  # narrower projection when it does not? The
  # estimate is heuristic (chars/4, already shipped through the typed
  # `architect_bundle` input `{ estimateTokens: true }` and the equivalent
  # pure `PatternBundle` projection option); generalising it as a structured
  # field with an
  # overflow/underflow flag is the open part. Keep it deterministic (no
  # model call); defer until the brief payload shape settles so the
  # estimate measures the real bundle.
