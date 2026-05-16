@architect
@architect-pattern:GherkinExternalRelationshipTagPropagation
@architect-status:active
@architect-product-area:Annotation
@architect-see-also:GherkinRulesSupport
@behavior @taxonomy
Feature: Relationship and hierarchy tags propagate through Gherkin extraction

  Gherkin specs declare canonical relationships and hierarchy metadata on the
  feature header. `@architect-uses` (csv, post-Wave-2 the only relationship
  shape — cross-package targets are auto-classified by the resolver),
  `@architect-bounded-context` (single value), `@architect-level` (enum), and
  `@architect-parent` (value) must flow through the tag registry into the
  trusted extracted pattern shape.

  Background: Default tag registry context
    Given a default tag registry context

  # ============================================================================
  # RULE 1: uses (csv) propagates to ExtractedPattern
  # ============================================================================

  Rule: uses (csv) propagates to ExtractedPattern.uses

    **Invariant:** A feature header carrying `@architect-uses:<process>:<pattern>, ...` must produce an `ExtractedPattern` whose `uses` array contains the parsed values in order.
    **Rationale:** Cross-process pattern references now flow through the canonical `uses` tag, so extraction must preserve those values before later resolver phases derive higher-level relationship views.
    **Verified by:** Single-value tag, multi-value csv tag

    @acceptance-criteria @happy-path
    Scenario: Single cross-process dependency surfaces in uses
      When I extract a Gherkin feature with header tag "uses:pkg:CandidateExtraction"
      Then the extracted pattern's uses equals "pkg:CandidateExtraction"

    @acceptance-criteria @happy-path
    Scenario: Multi-value csv populates uses in order
      When I extract a Gherkin feature with header tag "uses:pkg:CandidateExtraction, studio:PatternBrowserView"
      Then the extracted pattern's uses equals "pkg:CandidateExtraction, studio:PatternBrowserView"

  # ============================================================================
  # RULE 2: bounded-context (value) propagates to ExtractedPattern
  # ============================================================================

  Rule: bounded-context (value) propagates to ExtractedPattern.boundedContext

    **Invariant:** A feature header carrying `@architect-bounded-context:<context>` must produce an `ExtractedPattern` whose `boundedContext` field equals the parsed value.
    **Rationale:** Bounded-context is the canonical authored context field after the Wave 1 taxonomy cut, so extraction must preserve it without routing through retired `archContext` / `archLayer` storage.
    **Verified by:** Single-value bounded-context tag

    @acceptance-criteria @happy-path
    Scenario: bounded-context value surfaces in boundedContext
      When I extract a Gherkin feature with header tag "bounded-context:delivery-reporting"
      Then the extracted pattern's boundedContext equals "delivery-reporting"

  # ============================================================================
  # RULE 3: level (enum) propagates to ExtractedPattern
  # ============================================================================

  Rule: level (enum) propagates to ExtractedPattern.level

    **Invariant:** A feature header carrying `@architect-level:<level>` must produce an `ExtractedPattern` whose `level` field equals the parsed enum value.
    **Rationale:** Epic and slice hierarchy views depend on the canonical level tag surviving extraction instead of being inferred from prose or consumer heuristics.
    **Verified by:** Epic level tag, slice level tag

    @acceptance-criteria @happy-path
    Scenario: epic level surfaces in level
      When I extract a Gherkin feature with header tag "level:epic"
      Then the extracted pattern's level equals "epic"

    @acceptance-criteria @happy-path
    Scenario: slice level surfaces in level
      When I extract a Gherkin feature with header tag "level:slice"
      Then the extracted pattern's level equals "slice"

  # ============================================================================
  # RULE 4: parent (value) propagates to ExtractedPattern
  # ============================================================================

  Rule: parent (value) propagates to ExtractedPattern.parent

    **Invariant:** A feature header carrying `@architect-parent:<PatternName>` must produce an `ExtractedPattern` whose `parent` field equals the parsed value.
    **Rationale:** Structured epic membership derives from explicit parent edges, so extraction must preserve parent references before child lists are computed.
    **Verified by:** Single-value parent tag

    @acceptance-criteria @happy-path
    Scenario: parent value surfaces in parent
      When I extract a Gherkin feature with header tag "parent:LifecycleMvpEpic"
      Then the extracted pattern's parent equals "LifecycleMvpEpic"

