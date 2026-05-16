@architect
@architect-pattern:PerspectiveAwareProjections
@architect-status:roadmap
@architect-product-area:DataAPI
@architect-uses:EnforcementConfiguration
@architect-bounded-context:api
@architect-see-also:ADR007CoordinatedTaxonomyRedesign
Feature: PerspectiveAwareProjections

  **Problem:**
  All consumers of the PatternGraph see the same flat view regardless of their
  purpose. This creates several problems:

  - The OverviewCodec mixes candidate patterns into delivery progress, inflating
    the planned count and depressing completion percentages. When Studio shows
    "34 patterns, 18% complete," stakeholders expect committed delivery work, not
    speculative exploration.
  - The PatternsCodec includes all patterns regardless of maturity level. There is
    no way to filter "show me only design-ready patterns" or "show candidates only."
  - CLI and MCP tools cannot filter by the new maturity or role axes. The --status
    flag is the only pattern filter.
  - There is no pre-filtered API for common queries: "what can I implement next?"
    requires the consumer to compose multiple filters manually.

  **Solution:**
  Define 5 named perspectives with different inclusion criteria:

  | Perspective | Includes | Excludes | Use Case |
  | delivery | roadmap, active, completed, deferred | candidate | Stakeholder progress |
  | architectural-review | design+ maturity (active/completed + roadmap with design) | plan-level, candidates | Real architecture state |
  | planning | everything | nothing | Full picture |
  | implementation-queue | design-ready (roadmap+design) + active | plan-level, candidates, completed | What to work on next |
  | idea-triage | candidates only | all delivery patterns | Idea exploration |

  Completion percentage uses the delivery perspective exclusively. Each codec receives
  a default perspective matching its purpose. New PatternGraphAPI methods provide
  pre-filtered collections. MCP tools gain --maturity, --role, and --perspective
  parameters. CLI gains matching flags plus a `diagnostics` subcommand.

  In DDD/ES terms, perspectives are read-model projections -- the same event store
  (git) produces different materialized views for different query needs. This is
  textbook CQRS: one write model (annotated code), multiple read models.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Perspective API methods | pending | src/api/pattern-graph-api.ts |
      | API types for perspectives | pending | src/api/types.ts |
      | Completion percent excludes candidates | pending | src/generators/pipeline/transform-dataset.ts |
      | PatternsCodec candidate group | pending | src/renderable/codecs/patterns.ts |
      | OverviewCodec delivery perspective | pending | src/renderable/codecs/session.ts |
      | TimelineCodec candidate exclusion | pending | src/renderable/codecs/timeline.ts |
      | Scope validator blocks implement for candidates | pending | src/api/scope-validator.ts |
      | MCP list tool maturity and role and perspective params | pending | src/mcp/tool-registry.ts |
      | MCP diagnostics tool | pending | src/mcp/tool-registry.ts |
      | CLI maturity and role flags | pending | src/cli/pattern-graph-cli.ts |
      | CLI diagnostics subcommand | pending | src/cli/pattern-graph-cli.ts |
      | Maturity distribution in API | pending | src/api/pattern-graph-api.ts |
      | Handoff generator candidate inference | pending | src/api/handoff-generator.ts |
      | Context assembler type widening | pending | src/api/context-assembler.ts |
      | PlanningCodec candidate handling -- planning perspective includes everything; candidates appear in the full pattern listing sorted into a separate group after delivery patterns (similar to OverviewCodec separate candidates section per Rule 6) | pending | src/renderable/codecs/planning.ts |
      | ReferenceDiagramsCodec status string update | pending | src/renderable/codecs/reference-diagrams.ts |
      | IndexCodec completion percent update | pending | src/renderable/codecs/index-codec.ts |
      | MCP status tool candidate count | pending | src/mcp/tool-registry.ts |
      | MCP overview separate candidates section | pending | src/mcp/tool-registry.ts |
      | byPerspective pre-computed view in transform | pending | src/generators/pipeline/transform-dataset.ts |
      | StatusCounts and StatusDistribution candidate fields | pending | src/api/types.ts |
      | Codec decode options interface (CodecDecodeOptions with optional perspective field) | pending | src/renderable/codecs/codec-types.ts |

  # ===========================================================================
  # RULE 1: Named Perspectives with Defined Inclusion Criteria
  # ===========================================================================

  Rule: Different perspectives include different pattern subsets

    **Invariant:** Five perspectives exist, each defined as a predicate function
    on ExtractedPattern: `delivery` (status not candidate), `architectural-review`
    (maturity is design or executable, plus roadmap with design maturity),
    `planning` (all patterns, no filter), `implementation-queue` (roadmap with
    design maturity and deps ready, plus active), `idea-triage` (status is
    candidate only). Each perspective returns a filtered `ExtractedPattern[]`.

    "Deps ready" means all patterns listed in the `dependsOn` field of the
    ExtractedPattern have status `active` or `completed` in the PatternGraph.
    Patterns with empty or undefined `dependsOn` are always considered
    deps-ready. The check uses `PatternGraph.byName` for O(1) lookups.

    **Rationale:** Different consumers need fundamentally different subsets.
    Stakeholders want delivery progress (no candidates). Architects want
    design-level and implemented patterns (no plan-level). Implementers want
    actionable work (design-ready and in-progress). Designers want the full
    picture. Product owners want the candidate inbox.

    **Verified by:** Delivery perspective excludes candidates,
    Planning perspective includes all patterns,
    Architectural review filters by maturity,
    Implementation queue returns actionable patterns,
    Idea triage returns only candidates

    @acceptance-criteria @happy-path
    Scenario: Delivery perspective excludes candidates
      Given 15 delivery patterns and 4 candidate patterns
      When getDeliveryPatterns() is called
      Then it returns exactly the 15 delivery patterns
      And none of the 4 candidates are included

    @acceptance-criteria @happy-path
    Scenario: Planning perspective includes all patterns
      Given 15 delivery patterns and 4 candidate patterns
      When all patterns are queried with the planning perspective
      Then all 19 patterns are returned

    @acceptance-criteria @happy-path
    Scenario: Architectural review filters by maturity
      Given 3 roadmap patterns with plan maturity, 2 roadmap with design maturity, and 5 active patterns
      When getArchitecturalPatterns() is called
      Then it returns the 2 design-maturity roadmap patterns and the 5 active patterns
      And the 3 plan-maturity roadmap patterns are excluded

    @acceptance-criteria @happy-path
    Scenario: Implementation queue returns actionable patterns
      Given 2 roadmap patterns with design maturity, 3 active patterns, and 5 completed patterns
      When getImplementablePatterns() is called
      Then it returns the 2 design-ready roadmap patterns and 3 active patterns
      And the 5 completed patterns are excluded

    @acceptance-criteria @validation
    Scenario: Idea triage returns only candidates
      Given 15 delivery patterns and 4 candidate patterns
      When getCandidates() is called
      Then it returns exactly the 4 candidate patterns

  # ===========================================================================
  # RULE 2: Delivery-Only Completion Percentage
  # ===========================================================================

  Rule: Completion percentage uses delivery perspective exclusively

    **Invariant:** `getCompletionPercentage()` is a new PatternGraphAPI method
    that wraps the existing `completionPercentage()` function in
    `transform-dataset.ts`. It computes `completed / deliveryTotal * 100`
    where `deliveryTotal` excludes candidate patterns. The underlying function
    is also updated to exclude candidates from the denominator. Adding
    speculative ideas (candidates) to the system does not change the
    completion percentage. Zero delivery patterns yields 0%, not NaN.

    **Rationale:** Including pre-acceptance ideas in the denominator would make
    the percentage drop every time someone writes a candidate spec, punishing
    exploration. Stakeholders expect the percentage to reflect committed delivery
    progress. The delivery perspective is the natural denominator.

    **Verified by:** Completion percentage with mixed patterns,
    Adding candidates does not change percentage,
    Zero delivery patterns yields zero percent

    @acceptance-criteria @happy-path
    Scenario: Completion percentage with mixed patterns
      Given 10 delivery patterns with 3 completed and 4 candidate patterns
      When getCompletionPercentage() is called
      Then the result is 30 percent
      And the denominator is 10, not 14

    @acceptance-criteria @validation
    Scenario: Adding candidates does not change percentage
      Given 10 delivery patterns with 3 completed and completion at 30 percent
      When 5 new candidate patterns are added to the project
      And getCompletionPercentage() is recalculated
      Then the result is still 30 percent

    @acceptance-criteria @edge-case
    Scenario: Zero delivery patterns yields zero percent
      Given a project with only 3 candidate patterns and no delivery patterns
      When getCompletionPercentage() is called
      Then the result is 0 percent
      And no division-by-zero error occurs

  # ===========================================================================
  # RULE 3: Codec Default Perspectives
  # ===========================================================================

  Rule: Each codec defaults to its natural perspective

    **Invariant:** Codecs have default perspectives matching their purpose:
    OverviewCodec defaults to delivery, PatternsCodec defaults to planning,
    ArchitectureCodec defaults to architectural-review, BusinessRulesCodec
    defaults to architectural-review, TimelineCodec defaults to delivery,
    PlanningCodec defaults to planning, SessionCodec defaults to delivery.
    The default can be overridden via a `perspective?: PerspectiveName` option
    passed to the codec's `decode()` method. Each codec's `decode()` method
    gains an optional second parameter `options?: { perspective?: PerspectiveName }`.
    If `options.perspective` is provided, it overrides the codec's default
    perspective. The `CodecDecodeOptions` type is defined in a shared location
    (`src/renderable/codecs/codec-types.ts`). The `DEFAULT_CODEC_PERSPECTIVES`
    constant maps codec names to their default perspective.

    **Rationale:** Each codec serves a specific audience. The OverviewCodec
    reports progress to stakeholders (delivery perspective). PatternsCodec
    is a comprehensive registry (planning perspective). ArchitectureCodec
    shows real architecture state (only design+ patterns). Codec consumers
    do not need to manually specify the perspective for the common case.

    **Verified by:** OverviewCodec excludes candidates by default,
    PatternsCodec includes candidates by default,
    Codec perspective overridden via options,
    TimelineCodec excludes candidates by default

    @acceptance-criteria @happy-path
    Scenario: OverviewCodec excludes candidates by default
      Given a PatternGraph with 10 delivery patterns and 3 candidate patterns
      When the OverviewCodec decodes the graph
      Then the progress section shows counts from 10 delivery patterns only
      And candidate patterns do not affect the progress numbers

    @acceptance-criteria @happy-path
    Scenario: PatternsCodec includes candidates by default
      Given a PatternGraph with 10 delivery patterns and 3 candidate patterns
      When the PatternsCodec decodes the graph
      Then all 13 patterns appear in the patterns document
      And candidates appear in a separate candidate group

    @acceptance-criteria @happy-path
    Scenario: Codec perspective overridden via options
      Given a PatternGraph with delivery and candidate patterns
      When the OverviewCodec decodes with perspective set to planning
      Then all patterns including candidates appear in the overview output

    @acceptance-criteria @validation
    Scenario: TimelineCodec excludes candidates by default
      Given a PatternGraph with delivery patterns and 3 candidate patterns
      When the TimelineCodec decodes the graph
      Then the timeline shows only delivery patterns
      And candidates do not appear in any timeline section

  # ===========================================================================
  # RULE 4: Pre-Filtered API Methods
  # ===========================================================================

  Rule: API methods provide pre-filtered perspective collections

    **Invariant:** PatternGraphAPI gains six new methods: `getDeliveryPatterns()`
    (delivery perspective), `getCandidates()` (idea-triage perspective),
    `getArchitecturalPatterns()` (architectural-review perspective),
    `getImplementablePatterns()` (implementation-queue perspective),
    `getPatternsByMaturity(level: MaturityLevel)` (filter by maturity),
    `getMaturityDistribution()` (counts per maturity level). All return
    `ExtractedPattern[]` or structured result objects.

    **Rationale:** Pre-filtered methods eliminate the need for consumers to
    compose multiple filters manually. `getDeliveryPatterns()` is simpler and
    more discoverable than `patterns.filter(p => p.status !== 'candidate')`.
    The methods use pre-computed perspective views for O(1) access.

    **Verified by:** getDeliveryPatterns excludes candidates,
    getCandidates returns only candidates,
    getPatternsByMaturity filters correctly,
    getMaturityDistribution returns counts per level

    @acceptance-criteria @happy-path
    Scenario: getDeliveryPatterns excludes candidates
      Given 12 delivery patterns and 5 candidate patterns
      When getDeliveryPatterns() is called
      Then it returns exactly 12 patterns
      And no pattern has status "candidate"

    @acceptance-criteria @happy-path
    Scenario: getCandidates returns only candidates
      Given 12 delivery patterns and 5 candidate patterns
      When getCandidates() is called
      Then it returns exactly 5 patterns
      And every pattern has status "candidate"

    @acceptance-criteria @happy-path
    Scenario: getPatternsByMaturity filters correctly
      Given 3 idea patterns, 5 plan patterns, 4 design patterns, and 2 executable patterns
      When getPatternsByMaturity("design") is called
      Then it returns exactly the 4 design patterns

    @acceptance-criteria @validation
    Scenario: getMaturityDistribution returns counts per level
      Given 3 idea, 5 plan, 4 design, and 2 executable patterns
      When getMaturityDistribution() is called
      Then the result is idea: 3, plan: 5, design: 4, executable: 2

  # ===========================================================================
  # RULE 5: MCP and CLI Surface
  # ===========================================================================

  Rule: MCP and CLI surface maturity and role as filter parameters

    **Invariant:** `architect_list` MCP tool gains optional `maturity`, `role`,
    and `perspective` parameters. New `architect_diagnostics` MCP tool surfaces
    extraction diagnostics from BuildResult. CLI gains `--maturity <value>`,
    `--role <value>` filter flags and a `diagnostics` subcommand. All filters
    compose cumulatively (AND logic) with existing `--status` and `--phase`.

    **Rationale:** The new maturity and role axes need consumer-facing surfaces
    to be useful. MCP tools are the primary AI context interface; CLI is the
    developer interface. Both need the same filtering capabilities. Diagnostics
    need a dedicated surface for build health monitoring.

    **Verified by:** MCP list with maturity filter,
    MCP list with role filter,
    CLI diagnostics subcommand shows extraction diagnostics,
    Multiple filters compose cumulatively

    @acceptance-criteria @happy-path
    Scenario: MCP list with maturity filter
      Given a PatternGraph with patterns at various maturity levels
      When architect_list is called with maturity set to "design"
      Then only patterns with design maturity are returned

    @acceptance-criteria @happy-path
    Scenario: MCP list with role filter
      Given a PatternGraph with patterns having various roles
      When architect_list is called with role set to "api"
      Then only patterns with role "api" are returned

    @acceptance-criteria @happy-path
    Scenario: CLI diagnostics subcommand shows extraction diagnostics
      Given a project with 2 files that produce extraction diagnostics
      When the CLI diagnostics subcommand is run
      Then both diagnostics are displayed with file path, code, and suggestion

    @acceptance-criteria @validation
    Scenario: Multiple filters compose cumulatively
      Given a PatternGraph with diverse patterns
      When architect_list is called with status "roadmap" and maturity "design"
      Then only patterns that are BOTH roadmap AND design maturity are returned

  # ===========================================================================
  # RULE 6: Separate Candidate Overview
  # ===========================================================================

  Rule: Candidate overview is a separate section in overview output

    **Invariant:** When the OverviewCodec renders the overview, candidate
    patterns appear in a separate "Candidates" section below the delivery
    progress section. The delivery progress section shows only
    delivery-perspective counts and completion percentage. The candidate section
    shows the candidate count and their maturity distribution (idea vs plan).
    If no candidates exist, the candidate section is omitted.

    **Rationale:** Mixing candidates into the delivery progress creates a
    confusing view where "planned" includes both committed roadmap work and
    speculative ideas. A separate section makes the distinction clear:
    "Here is your committed delivery progress. And separately, here are the
    ideas being explored."

    **Verified by:** Overview shows delivery progress without candidates,
    Overview shows separate candidates section,
    Candidates section omitted when none exist

    @acceptance-criteria @happy-path
    Scenario: Overview shows delivery progress without candidates
      Given 10 delivery patterns with 3 completed and 4 candidate patterns
      When the OverviewCodec renders the overview
      Then the progress section shows 30 percent completion
      And the progress section counts show 10 total delivery patterns

    @acceptance-criteria @happy-path
    Scenario: Overview shows separate candidates section
      Given 4 candidate patterns with 2 at idea maturity and 2 at plan maturity
      When the OverviewCodec renders the overview
      Then a Candidates section appears below the delivery progress
      And the section shows 4 candidates with maturity breakdown

    @acceptance-criteria @edge-case
    Scenario: Candidates section omitted when none exist
      Given a PatternGraph with only delivery patterns and no candidates
      When the OverviewCodec renders the overview
      Then no Candidates section appears in the output

  # Step definitions live in the dedicated step-stubs file for this pattern.
