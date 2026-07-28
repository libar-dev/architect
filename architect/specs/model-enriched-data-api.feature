@architect
@architect-pattern:ModelEnrichedDataAPI
@architect-status:candidate
@architect-product-area:DataAPI
@architect-uses:ArchitectBriefDeterministicBundle
@architect-bounded-context:api
@architect-see-also:ADR006SingleReadModelArchitecture,ADR005CodecBasedMarkdownRendering
Feature: ModelEnrichedDataAPI

  **Problem:**
  Every consumer of the PatternGraph Data API (the Claude Code architect plugin,
  Studio's Dashboard / Bundler / DriftFindings views, future GitHub Action) ends
  up rephrasing the same deterministic JSON into natural language. Either the
  consumer hand-rolls the narrative (Studio Dashboard E-03 in
  `packages/context/ideation/11-embedded-edge-model/02-feature-enhancements.md`)
  or it pays an upstream LLM round-trip to do so. Six already-named features
  across that ideation pack (E-01, E-03, E-04, N-01, N-03 and the matrix-doc
  derivation in `.plans/spec-review-data-api-matrix.md` § 7.4) converge on the
  same shape: a short narrative panel grounded in deterministic data. The work
  is duplicated across consumers and the rephrase is not reproducible.

  **Empirical context (matrix doc § 7.9, 2026-05-02):**
  Hosted `google/gemini-3.1-flash-lite-preview` via OpenRouter responded in
  ~1s regardless of prompt size between 320 tokens and 31,700 tokens (the full
  Studio rule corpus). Local 26B inference at the same workload scaled
  3.5s -> 7.8s -> 162.8s. Cost: ~$0.0002 per typical call, ~$0.008 for the
  whole-graph case. This flipped the original "embedded Gemma 4 default"
  ideation in `packages/context/ideation/11-embedded-edge-model/`: the embedded
  path is no longer the default backend, only an enterprise opt-in. Hosted
  Gemini 3.1 Flash Lite via Vercel AI SDK + OpenRouter is the candidate's
  load-bearing backend.

  **Solution:**
  `ModelEnrichedDataAPI` is a **decoration layer** over the deterministic
  Data API. The `architect_brief` MCP tool (specified in the sibling
  `ArchitectBriefDeterministicBundle` candidate) and the existing five
  deterministic MCP reads (pattern, scope-validate, rules, dep-tree,
  overview) keep their deterministic response shapes; this candidate wraps those
  responses with optional model-generated slices when configured. The
  Brief's optional `intent: string` parameter is forwarded unchanged at
  the deterministic tier and interpreted here at the LLM tier — biasing
  the narrative slice without altering the deterministic bundle.

  Introduce an `ArchitectModelService` host-agnostic wrapper that calls
  `google/gemini-3.1-flash-lite-preview` via Vercel AI SDK (`ai` package) +
  OpenRouter (`@ai-sdk/openrouter` provider). Use `generateText` with
  `Output.object` and a Zod schema for the provenance envelope - the SDK
  passes the schema to the model for guided structured output, and validates
  the response against it before returning. The deprecated `generateObject`
  primitive is explicitly rejected in favour of this pattern (verified via
  DeepWiki against the `vercel/ai` repo, 2026-05-02). The 10-second timeout
  in Rule 3 maps directly to `AbortController` + `abortSignal` on
  `generateText` - no custom timeout wiring required.

  The MVP ships **two LLM-tier surfaces** on top of the deterministic floor:

  1. **Decorated `architect_brief` response.** When `OPENROUTER_API_KEY`
     is present, every `architect_brief` call returns the Brief's
     deterministic bundle (sessionContext + scopeReadiness +
     businessRules + valueTransfer + taxonomySlice + transitiveBlockers
     + nextActions) **unchanged** plus a `model_summary` narrative slice
     and `model_hints` advertisement field, both wrapped in a
     provenance envelope. The decoration is purely additive; no
     deterministic field is replaced or shadowed. The Brief's `intent`
     parameter, forwarded uninterpreted at the deterministic tier, is
     consumed here to bias narrative phrasing. When the key is absent
     or upstream fails, the deterministic payload is returned with
     `model_summary: null`, `model_hints: null`, and a typed
     `model_status`.

  2. **`architect_query <prompt>` (new verb).** Free-form natural-language
     query routed through Vercel AI SDK tool-calling (`generateText` with
     `tools: {...}` and `toolChoice: 'required'`). The model picks exactly
     one existing typed verb, args validated against Zod input schemas,
     and the typed verb's deterministic payload (plus its `model_summary`
     when the verb is itself enriched) is returned with provenance
     describing which verb was chosen and why. The tool choice IS the
     provenance. A sibling LLM-tier surface to the brief decoration —
     the Brief candidate explicitly does not claim NL routing.

  Existing five verbs (`pattern`, `scope-validate`, `rules`, `dep-tree`,
  `overview`) accept the additive `intent: string` parameter for prompt
  biasing once they fan out, on the same provenance contract; the
  fan-out itself is a follow-up wave (see "MVP fan-out boundary"
  below).

  Every model-enriched response carries a `model_hints` field that
  **advertises** the NL endpoint and any follow-up queries the model
  considered relevant given the current payload. Discoverability is by
  design: callers learn the NL surface from successful deterministic calls,
  not from documentation. The hint is provenance-tagged just like
  `model_summary` - it never claims authority over deterministic state.

  When `OPENROUTER_API_KEY` is absent, every enriched response shape is
  preserved with `model_summary: null`, `model_hints: null`, and a typed
  `model_status` so the deterministic payload (or the bundled
  session-brief payload) is never withheld. The free CLI and open-source
  MCP package work fully without an API key.

  **MVP fan-out boundary:** The existing five deterministic MCP reads (`pattern`,
  `scope-validate`, `rules`, `dep-tree`, `overview`) keep their current
  deterministic-only response shapes for MVP, except that they accept
  the additive `intent` field for narrative biasing once decorated.
  Adding `model_summary` to each verb's response is a follow-up wave -
  the contract under test is identical and fanning out before the
  brief decoration and NL endpoint are validated dilutes the
  user-research signal.

  **Why deferred from a plan-tier scope:**
  Several architectural decisions remain open after MVP scope refinement
  (see Open Questions section below — four settled in candidate phase,
  six still open, three new and still open). Promoting to plan-tier
  before the open set resolves would force authoring rationale and
  verified-by clauses in retrospect. The matrix doc settled the
  direction (hosted-default, provenance-as-load-bearing); the candidate
  phase has additionally settled default-on posture, intent inclusion,
  NL endpoint inclusion, and streaming (deferred indefinitely; MCP
  transport limit). What remains open is package ownership shape, BYOK
  vs bundled pricing, slice catalogue beyond `model_summary`, cache
  key composition, phase ordering, failure-verb sanitization, and
  three new questions raised by the MVP refinement (provenance
  placement, NL flavour, advertisement shape).

  **Why not the broader architect_semantic_* namespace yet:**
  The matrix doc § 7.3 maps a model layer to ~7 fully-closable gaps
  (semantic search GAP-1, rule-conflict GAP-10, type-reuse GAP-12, soft-duplicate
  detection in §A, retroactive-spec smell GAP-22, coverage diff narration GAP-25,
  source provenance GAP-16). Those need their own deliverable surface (a
  separate sidecar MCP namespace per § 7.8 Shape C). This candidate ships
  two LLM-tier surfaces — decorated brief response and NL endpoint —
  each carrying the same provenance envelope, so the contract is exercised
  from two angles before the semantic namespace lands. Existing-verb
  fan-out (`model_summary` on `pattern`, `scope-validate`, etc.) is also a
  follow-up; the contract under test there is identical and fans out
  trivially once validated on the new surfaces.

  **Open Questions and Settled Decisions:**

  Of the original eight open questions, four are settled in candidate
  phase (Q-DEFAULT, Q-INTENT, Q-NL-ENDPOINT, Q-STREAMING). Two further
  candidate-phase settlements (Q-WAVE-ORDER and Q-BRIEF-COMPOSITION)
  moved to the sibling `ArchitectBriefDeterministicBundle` spec when
  the deterministic-bundling slice was carved out of this candidate's
  scope. Six original questions remain open here. Three new questions
  remain open (Q-META-PLACEMENT, Q-NL-FLAVOUR, Q-ADVERTISE-SHAPE).

  **Settled in candidate phase:**

  - Q-DEFAULT (settled): Default-on for the two LLM-tier MVP surfaces
    (decorated `architect_brief` response and `architect_query`).
    Existing five verbs keep deterministic-only response shape until
    the follow-up wave; they accept `intent` immediately for
    prompt-construction biasing on the decorated surfaces only.
    Latency at ~1s does not justify gating the surfaces behind a flag.
    The Brief's deterministic bundle is uniform regardless of intent
    (Brief spec Rule 1) — the LLM tier biases narrative phrasing only.

  - Q-INTENT (settled): Ship in MVP. Additive optional `intent: string`
    field on every existing verb input schema, threaded into prompt
    construction for narrative biasing. Distinct from tool-calling: the
    deterministic payload shape is unchanged, only the narrative slice
    is steered. Flag for early user-research feedback whether biasing is
    helpful or noisy.

  - Q-NL-ENDPOINT (settled, reversed from earlier defer): Ship
    `architect_query <prompt>` in MVP using Vercel AI SDK tool-calling
    (`generateText` with `tools: {...}` and `toolChoice: 'required'`).
    The model picks exactly one existing typed verb; args validated
    against Zod input schemas; no free-text output. Earlier deferral
    rationale (different blast radius, different observability) still
    applies but is outweighed by the value of validating three surfaces
    in parallel rather than serially.

  - Q-STREAMING (settled, deferred indefinitely): Stable MCP transport
    does not support streaming partial structured-content fields. The
    `ExperimentalClientTasks.callToolStream` mechanism in the MCP SDK
    streams task lifecycle (`taskCreated`, `taskStatus`), not partial
    fields of the structured payload — the final `CallToolResult` carries
    the complete `structuredContent`. Studio-UI streaming would require
    a second non-MCP transport. Defer as a transport-layer follow-up,
    not a candidate-spec design choice. (Verified via DeepWiki against
    `modelcontextprotocol/typescript-sdk`, 2026-05-02.)

  **Still open (block promotion to plan tier):**

  - Q-OWNERSHIP: Which package owns ArchitectModelService? Recommendation
    refined to a **split**: interface and `ModelEnrichedPatternGraphAPI`
    wrapper in `architect-core` (no LLM dependencies); OpenRouter / Vercel
    AI SDK implementation in a new `@libar-dev/architect-model` package
    (or `architect-ai`); composition roots (`architect-cli`,
    `architect-mcp`, `apps/desktop`) wire impl through the interface.
    `architect-core` today has zero LLM deps — adding `ai` +
    `@ai-sdk/openrouter` directly would balloon the dep graph for every
    consumer of the read API. The split mirrors the existing
    host-agnostic pattern (`ArchitectMainProcessMcp` taking
    `EventBroadcaster` / `StoragePaths` adapters in
    `apps/desktop/src/main/architect-mcp.ts`).

  - Q-BYOK: Pricing posture - Bring-Your-Own-Key (user supplies
    OPENROUTER_API_KEY directly) vs bundled inference (Studio paid-tier
    proxies through Libar's account)? § 7.9 pegs heavy use at $24/mo and
    typical use at $2.40/mo against the $49/seat Studio price. BYOK ships
    simplest; bundled is a paid-tier moat. Recommendation: BYOK for MVP;
    bundled-inference billing is its own surface.

  - Q-SLICE-SHAPE: Beyond `model_summary` (narrative paragraph), do we ship
    `model_risks` (flag list per § 7.4) or `model_relatedness` (top-N adjacent
    patterns) in this candidate, or hold them for a follow-up? Recommendation:
    hold; the three MVP surfaces (`session_brief`, `query`, `intent`) carry
    only `model_summary`. Risks and relatedness ship in the follow-up
    semantic-namespace candidate where they have purpose-built verbs.

  - Q-CACHE: The deterministic payload is stable per file-watcher tick. Cache
    `model_summary` keyed on a hash of the deterministic payload plus
    `prompt-version`? Recommendation: yes, in-memory LRU cache with
    file-watcher invalidation; the ~$0.0002 per-call cost makes correctness
    the priority over cost. For decorated `architect_brief` responses,
    the cache key must include the Brief's deterministic response hash
    (the Brief spec owns the underlying composition) plus the optional
    `intent` string and `prompt-version` — same Brief response with
    different intent must miss cache. For `architect_query`, cache by
    prompt hash + selected-tool name + tool-args hash (the model's
    tool choice is part of the response identity).

  - Q-ORDER: Where should this candidate sit in edge-derived delivery
    navigation once its blockers are resolved? Recommendation: keep ordering
    structural, via `@architect-uses` / `@architect-parent` and status, never
    via a numeric phase tag.

  - Q-FAILURE-VERB: When `model_status: failed`, do we surface the underlying
    OpenRouter error message (helpful for debugging) or sanitize it (privacy /
    leak risk against API keys, model identifiers, prompt fragments)?
    Recommendation: include a typed `model_error_code` enum, never raw error
    text.

  **New (raised by MVP refinement):**

  - Q-META-PLACEMENT (new): Where does the provenance envelope live in
    MCP responses? Option A: top-level fields (`model_summary`,
    `model_status`, `model_hints`) on each tool's structured output.
    Option B: top-level `model_summary` + provenance (`source`,
    `confidence`, `prompt-version`, `latency_ms`) in MCP's `_meta` field
    — the `z.record(z.string(), z.unknown()).optional()` side-channel
    that the SDK provides for exactly this purpose. Option B is more
    idiomatic MCP (typed clients ignore `_meta`; debug clients render
    it) but harder to enforce in tests because `_meta` is `z.unknown()`.
    Option A keeps provenance typed and test-friendly. Recommendation:
    Option A for MVP (typed Zod schema is the load-bearing test
    surface); revisit if MCP clients complain about schema noise.
    (Surfaced via DeepWiki against
    `modelcontextprotocol/typescript-sdk`, 2026-05-02.)

  - Q-NL-FLAVOUR (new): What shape does `architect_query` take?
    (a) Tool-calling router (Vercel AI SDK `tools` + `toolChoice:
    'required'`) — model picks one typed verb, args validated against
    Zod input schema, deterministic payload returned. The tool choice
    IS the provenance.
    (b) Citations-grounded NL response — model returns prose with
    explicit citations to pattern-IDs, rule-IDs, fragment-keys
    (deepwiki-style).
    (c) Both — tool-calling for "do X" prompts, citations-grounded for
    "explain Y" prompts.
    Recommendation: (a) for MVP — typed-verb routing has a cleaner
    provenance story and matches the spec's no-free-text-output
    principle. (b) is the long-term shape but needs grounded-citation
    infrastructure that does not exist yet (matrix doc § 7.3
    source-provenance GAP-16 has to close first).

  - Q-ADVERTISE-SHAPE (new): What does the `model_hints` advertisement
    field look like in practice? Options:
    (a) free-text "you can also ask architect_query about ..." appended
    to `model_summary`.
    (b) structured `model_hints: { suggested_queries: string[],
    related_verbs: string[] }`.
    (c) per-payload heuristic — only advertise when the deterministic
    response indicates the user is likely missing context (e.g.,
    `dep-tree` with unresolved blockers suggests `architect_query "why
    is X blocked"`).
    Recommendation: (b) for MVP — structured shape is queryable and
    testable; (c) is a later heuristic refinement once usage data shows
    where advertisements actually help.

  **Out of Scope (deferred to follow-up candidates):**

  - Semantic-namespace verbs (`architect_semantic_search`,
    `architect_semantic_rule_conflicts`, `architect_semantic_type_reuse`,
    `architect_semantic_provenance`) - separate candidate, ships as a sidecar
    MCP server per matrix doc § 7.8 Shape C.
  - Embedded-Gemma backend - explicitly no-go for the default per § 7.9; can
    return as an enterprise-only opt-in via the ArchitectModelService interface
    later, no redesign required.
  - Studio UI surfaces consuming `model_summary` (Dashboard narrative panel,
    Bundler "AI suggested" badges, DriftFindings panel) - those live in
    `apps/desktop` and form their own design pass per `.design/lifecycle-mvp/`.
  - Provider abstraction beyond OpenRouter - the candidate locks to Vercel AI
    SDK + OpenRouter as the first concrete backend.
  - Cost telemetry / billing meter for bundled inference - Q-BYOK resolution
    determines whether this is even needed.
  - `model_summary` fan-out to existing five verbs (`pattern`,
    `scope-validate`, `rules`, `dep-tree`, `overview`) - separate
    follow-up candidate (wave-ordering settled in the sibling
    `ArchitectBriefDeterministicBundle` spec). Same provenance
    contract as the two MVP surfaces; trivial fan-out once the
    decorated brief and `architect_query` validate the contract in
    real sessions.
  - Citations-grounded NL flavour for `architect_query` - per
    Q-NL-FLAVOUR, MVP ships tool-calling-router only. Citations-grounded
    prose ships after source-provenance GAP-16 closes (matrix doc § 7.3).
  - Streaming partial fields of `model_summary` - per Q-STREAMING, MCP
    transport doesn't support it; would require a second non-MCP
    transport.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | ArchitectModelService interface + ModelEnrichedPatternGraphAPI wrapper (host-agnostic, no LLM deps) | pending | packages/architect-core/src/model-service/ (new) |
      | OpenRouter / Vercel AI SDK implementation of ArchitectModelService (Output.object + Zod schema + AbortSignal timeout, prompt-version registry) | pending | packages/architect-model/ (new package) |
      | architect_brief decoration - wraps the Brief's deterministic response with optional model_summary slice + provenance envelope when configured (intent biases narrative; no deterministic field replaced) | pending | packages/architect-core/src/model-service/brief-decoration.ts (new) |
      | architect_query verb - Vercel AI SDK tool-calling routes free-form prompts to existing typed verbs with Zod-validated args | pending | packages/architect-core/src/read-api/pattern-graph-api.ts |
      | Optional intent string field on every existing verb input schema - additive, biases narrative slice prompt construction on enriched surfaces | pending | packages/architect-core/src/read-api/pattern-graph-api.ts |
      | model_hints advertisement field on every enriched response - structured shape exposing suggested_queries + related_verbs | pending | packages/architect-core/src/read-api/pattern-graph-api.ts |
      | MCP tool propagation - new verbs registered, existing verb input schemas widened with intent, response schemas widened with model_summary + model_status + model_hints on enriched surfaces | pending | packages/architect-mcp/src/tool-registry.ts |
      | OPENROUTER_API_KEY config sourcing + graceful degradation (returns deterministic payload intact with model_summary null and model_hints null when key absent or upstream fails) | pending | packages/architect-core/src/config/ |
      | Provenance contract Zod schema + integration tests covering happy-path, missing-key, timeout, upstream-failure for all three MVP surfaces (session_brief, query, intent-biased) | pending | packages/architect-core/tests/features/model-enriched-data-api.feature |
      | In-memory LRU cache for model_summary keyed on bundled deterministic-input hash + prompt-version (per Q-CACHE) with file-watcher invalidation | pending | packages/architect-core/src/model-service/cache.ts (new) |

  Rule: Provenance is mandatory and visible on every model-generated payload slice

    **Invariant:** No model-generated payload slice ships without a complete
    provenance envelope: `source: "model"`, `confidence` (0..1 float),
    `prompt-version` (semver string), and `latency_ms`. The slice always sits
    in a named field (`model_summary`), never inlined into deterministic fields.
    Consumers can ignore the model slice entirely and still consume the
    deterministic payload unchanged. Tooling that pretty-prints API output
    must render the model-generated slice in a visually distinct block.

    **Rationale:** "Architect State is Code" - annotated source plus executable
    specs are the only durable artifact (CLAUDE.md, ADR-003 source-first
    principle). If model-generated facts blend into the deterministic payload,
    downstream consumers (Claude Code, Studio UI, future GitHub Action) treat
    them as authoritative truth. The matrix doc § 7.5 reframed provenance -
    not latency - as the load-bearing constraint. Visible attribution and a
    reproducible `prompt-version` are what keep the source-first principle
    intact while still letting the model improve every call.

    **Verified by:** Provenance envelope schema validation, MCP response shape
    contract test, pretty-print rendering test

    @acceptance-criteria @happy-path
    Scenario: Brief call returns enriched response with provenance envelope
      Given a pattern with rules and dependencies in the graph
      And OPENROUTER_API_KEY is configured
      When the caller invokes architect_brief for that pattern
      Then the response includes the uniform bundled deterministic payloads (overview + context + dep-tree + files + rules) unchanged
      And the response includes a model_summary field
      And model_summary carries source equal to "model"
      And model_summary carries a confidence score between 0 and 1
      And model_summary carries a prompt-version semver string
      And model_summary carries a latency_ms numeric measurement
      And the response includes a model_hints field advertising the architect_query NL endpoint

  Rule: Deterministic payload is the source of truth; model output is a layer on top

    **Invariant:** The model layer never substitutes for a missing deterministic
    verb. Counts, references, and structural metadata are owned by the wrapping
    verb, not the model. When a future caller asks "do any rules conflict?"
    and only `model_summary` exists (no `architect_semantic_rule_conflicts`
    verb yet), the answer surface phrases findings as "no conflicts the model
    could find in the rule corpus", never "no conflicts". The model receives
    the deterministic payload as its sole grounded input - it does not perform
    independent file reads, graph traversals, or count derivations.

    **Rationale:** Matrix doc § 7.9 measured all three benchmarked backends
    (Gemma E2B, local 26B, hosted Flash Lite) hallucinating structural counts
    at the all-rules size (10/20, 184/330, 150/330 scanned). Structural
    counting is not what LLMs are reliably for. Letting the model "fill in"
    gaps that belong to deterministic verbs trains consumers to trust narrative
    answers to structural questions, which is exactly what makes downstream
    agent reasoning drift over multi-session work.

    **Verified by:** Contract test that asserts model output never produces
    structural counts independent of deterministic input, regression test
    against hallucinated count from a fixture payload

  Rule: API responses degrade gracefully when the model layer is unavailable

    **Invariant:** When `OPENROUTER_API_KEY` is absent, OpenRouter returns an
    error, or the call exceeds a 10-second timeout, the API response succeeds
    with the deterministic payload intact, `model_summary: null`, and a typed
    `model_status` of `unconfigured`, `failed`, or `timeout`. The deterministic
    payload is never withheld because the model enrichment failed. The free
    CLI and open-source MCP package work fully without an API key.

    **Rationale:** The architect package family ships free + open-source; the
    enrichment is augmentation, not gate. Studio's air-gapped enterprise story
    (per `packages/context/ideation/11-embedded-edge-model/04-technical-architecture.md`
    privacy posture) also depends on this. A failure mode that withholds
    deterministic data because the optional model layer broke would propagate
    every OpenRouter outage into every CLI / MCP session.

    **Verified by:** Failure-mode integration tests covering missing key,
    network failure, timeout, and OpenRouter 4xx/5xx responses

    @acceptance-criteria @validation
    Scenario: Missing API key degrades gracefully without withholding deterministic payload
      Given OPENROUTER_API_KEY is not configured
      When the caller invokes architect_brief for a known pattern
      Then the response succeeds with the bundled deterministic payloads intact
      And model_summary is null
      And model_hints is null
      And model_status equals "unconfigured"
      And no upstream model request is attempted
