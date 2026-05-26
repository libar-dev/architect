@architect
@architect-pattern:SourceCanonical
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: SourceCanonical - the source aggregate colocates with the artifact it describes

  **User Story:** As a maintainer, I want the source aggregate for every doc claim to live in the same file or package as the code or spec it describes, so that the same commit that changes behavior also changes the source the projection reads — there is no parallel-tree narrative file that can silently diverge from the artifact it claims to describe.

  **Open Questions:**
  - Editorial framing prose (positioning paragraphs, narrative intros, "why this exists" sections) — does this also colocate with the artifact, or live in a dedicated preamble file outside the source tree and ride through the projection as an exception?
  - For docs that describe cross-package concepts (e.g., the FSM lives in `architect-guard` but is referenced from formal-spec and four skills), where does the canonical source aggregate live — at the implementation, in a shared kernel, or in a designated owner package?
  - Decision records (`architect/decisions/`) live outside per-package source — are they considered "colocated" with the architectural concern they record, or is that a permitted exception to the rule?
  - Some topics have a code source aggregate (the tag registry → taxonomy) while others are hand-authored doctrine with no code source (spec evolution / the four-tier ladder); for the latter, is the canonical source the skill doctrine treated as a colocated aggregate, or an editorial-framing carve-out?

  Rule: Source aggregates colocate with the artifacts they describe
    **Invariant:** Every doc-claim source — annotated JSDoc, Gherkin Rule, Zod description, decision record — lives in the same file or package as the artifact it describes; no parallel-tree narrative file owns claims about shipped behavior the projection then mirrors.

  @acceptance-criteria @happy-path
  Scenario: changing behavior and its source aggregate happens in one commit
    Given a JSDoc-annotated function is modified
    When the maintainer commits the behavior change
    Then the doc-claim source diff is in the same commit, in the same file, as the behavior diff
