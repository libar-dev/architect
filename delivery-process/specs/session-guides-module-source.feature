@libar-docs
@libar-docs-pattern:SessionGuidesModuleSource
@libar-docs-status:roadmap
@libar-docs-phase:39
@libar-docs-effort:0.5d
@libar-docs-product-area:Generation
@libar-docs-depends-on:ClaudeModuleGeneration,DocsConsolidationStrategy
@libar-docs-business-value:session-workflow-CLAUDE-md-section-generated-from-annotated-specs
@libar-docs-priority:medium
Feature: Session Guides as Annotated Module Source

  **Problem:**
  CLAUDE.md contains a "Session Workflows" section (~220 lines) that is hand-maintained
  with no link to any annotated source. When session workflow guidance changes, both
  `docs/SESSION-GUIDES.md` and `CLAUDE.md` require manual synchronization — exactly
  the drift risk USDP is designed to eliminate. The `_claude-md/workflow/` directory
  (3 files: session-workflows.md, session-details.md, fsm-handoff.md) is equally
  opaque: hand-written blobs with no machine-readable origin.

  The prior plan (Phase 39 as SessionGuidesElimination) proposed deleting
  SESSION-GUIDES.md and merging its Handoff section into CLAUDE.md. This inverted
  the USDP principle: CLAUDE.md should be a derived artifact, not canonical storage.
  SESSION-GUIDES.md is a public-facing document deployed to libar.dev — its audience
  is developers visiting the website, not AI sessions.

  **Solution:**
  Retain SESSION-GUIDES.md as the authoritative public human reference. Express the
  session workflow invariants as annotated Gherkin Rule: blocks in a dedicated behavior
  spec and in the existing session workflow decision specs (ADR-001, ADR-003, PDR-001).
  Annotate these specs with `@libar-docs-claude-module` and
  `@libar-docs-claude-section:workflow` tags so ClaudeModuleGeneration (Phase 25)
  produces the `_claude-md/workflow/` compact modules automatically. The
  hand-maintained CLAUDE.md "Session Workflows" section is replaced with a
  modular-claude-md composition reference.

  Three-layer architecture after Phase 39:

  | Layer | Location | Content | Maintenance |
  | Public human reference | docs/SESSION-GUIDES.md | Full checklists, CLI examples, decision trees | Manual (editorial) |
  | Compact AI context | _claude-md/workflow/ | Invariants, session contracts, FSM reference | Generated from annotated specs |
  | Machine-queryable source | Process Data API | Rules from annotated specs via `rules` command | Derived from annotations |

  **Why It Matters:**
  | Benefit | How |
  | No CLAUDE.md drift | Session workflow section generated, not hand-authored |
  | Single annotated source | Decision specs own session workflow invariants |
  | Correct audience alignment | Public guide stays in docs/, AI context in _claude-md/ |
  | Process API coverage | Session workflow content queryable without reading flat files |
  | USDP applied to itself | The doc system generates its own workflow documentation |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Session workflow behavior spec with Rule blocks and claude-module tags | pending | delivery-process/specs/session-guides-module-source.feature | No | n/a |
      | Add claude-module + claude-section:workflow tags to ADR-001 | pending | delivery-process/decisions/adr-001-taxonomy-canonical-values.feature | No | n/a |
      | Add claude-module + claude-section:workflow tags to ADR-003 | pending | delivery-process/decisions/adr-003-source-first-pattern-architecture.feature | No | n/a |
      | Add claude-module + claude-section:workflow tags to PDR-001 | pending | delivery-process/decisions/pdr-001-session-workflow-commands.feature | No | n/a |
      | Generated _claude-md/workflow/session-workflows.md replaces hand-written version | pending | _claude-md/workflow/session-workflows.md | No | n/a |
      | Generated _claude-md/workflow/fsm-handoff.md replaces hand-written version | pending | _claude-md/workflow/fsm-handoff.md | No | n/a |
      | CLAUDE.md Session Workflows section replaced with modular-claude-md include | pending | CLAUDE.md | No | n/a |

  Rule: SESSION-GUIDES.md is the authoritative public human reference

    **Invariant:** `docs/SESSION-GUIDES.md` exists and is not deleted, shortened, or
    replaced with a redirect. Its comprehensive checklists, CLI command examples, and
    session decision trees serve developers on libar.dev — content that is editorial
    and cannot be expressed as Gherkin invariants without losing operational detail.

    **Rationale:** Session workflow guidance requires two different formats for two
    different audiences. Public developers need comprehensive checklists with full
    examples. AI sessions need compact invariants they can apply without reading 389
    lines. Collapsing both formats into one file — either by deleting SESSION-GUIDES.md
    or by making CLAUDE.md its source — serves neither audience well. The two-format
    approach is exactly what the ClaudeModuleGeneration pattern was designed to enable.

    **Verified by:** SESSION-GUIDES.md exists after Phase 39,
    No broken links after Phase 39

    @acceptance-criteria @happy-path
    Scenario: SESSION-GUIDES.md exists after Phase 39 completes
      Given Phase 39 (SessionGuidesModuleSource) is complete
      Then docs/SESSION-GUIDES.md exists in the repository
      And docs/INDEX.md contains a link to SESSION-GUIDES.md
      And SESSION-GUIDES.md contains no fewer lines than it did before Phase 39

    @acceptance-criteria @validation
    Scenario: No broken links after Phase 39
      Given Phase 39 (SessionGuidesModuleSource) is complete
      Then no retained file in docs/ contains a broken link to a deleted file
      And docs/INDEX.md navigation is consistent with docs/ directory contents

  Rule: CLAUDE.md session workflow content is derived, not hand-authored

    **Invariant:** After Phase 39, the "Session Workflows" section in CLAUDE.md
    contains no manually-authored content. It is composed from generated
    `_claude-md/workflow/` modules via the modular-claude-md framework include
    mechanism.

    **Rationale:** A hand-maintained CLAUDE.md session section creates two copies of
    session workflow guidance with no enforcement mechanism to keep them synchronized.
    Once ClaudeModuleGeneration produces `_claude-md/workflow/` from annotated specs,
    CLAUDE.md becomes a derived view — it cannot drift because regeneration always
    reflects current annotation state. This applies the same principle the package
    uses for all its other documentation: generate, do not manually maintain.

    **Verified by:** CLAUDE.md session section is a generated module reference

    @acceptance-criteria @happy-path
    Scenario: CLAUDE.md session section is a generated module reference
      Given Phase 39 (SessionGuidesModuleSource) is complete
      When inspecting CLAUDE.md under the Session Workflows heading
      Then the section contains a modular-claude-md include reference to the generated module
      And the section contains no manually-authored do/do-not tables or checklist steps

  Rule: Session workflow invariants exist as annotated Gherkin Rule blocks

    **Invariant:** The three canonical session workflow decision specs (ADR-001,
    ADR-003, PDR-001) each carry `@libar-docs-claude-module` and
    `@libar-docs-claude-section:workflow` tags. Their existing Rule: blocks — which
    already capture FSM state invariants (ADR-001), session lifecycle and artifact
    ownership (ADR-003), and session command behavior (PDR-001) — become the
    extractable source for compact _claude-md modules.

    **Rationale:** The decision specs contain machine-readable invariants today.
    Adding two annotation tags to each spec is the minimal change needed to connect
    existing structured content to the ClaudeModuleGeneration pipeline. No new content
    needs to be authored — the annotations reveal structure that already exists.

    **Verified by:** Process Data API returns session workflow invariants

    @acceptance-criteria @happy-path
    Scenario: Process Data API returns session workflow invariants
      Given ADR-001, ADR-003, and PDR-001 are annotated with claude-module tags
      When running "pnpm process:query -- rules ADR001TaxonomyCanonicalValues"
      Then the output contains FSM state invariants including protection levels
      And the output contains valid transition invariants
      And the content is consistent with the FSM Quick Reference table in SESSION-GUIDES.md

  Rule: ClaudeModuleGeneration is the generation mechanism

    **Invariant:** Phase 39 depends on ClaudeModuleGeneration (Phase 25). The
    `@libar-docs-claude-module` and `@libar-docs-claude-section:workflow` tags on
    annotated spec files cause ClaudeModuleGeneration to produce
    `_claude-md/workflow/{module}.md` output files. The three hand-written
    `_claude-md/workflow/` files are deleted after successful verified generation.

    **Rationale:** Phase 39 annotation work (tagging decision specs) can proceed
    immediately and independently. Generation deliverables — the actual produced
    `_claude-md/workflow/` files and the CLAUDE.md section removal — cannot complete
    until Phase 25 ships the ClaudeModuleCodec. This sequencing is intentional: the
    annotation investment is zero-risk because the tags are valid regardless of
    whether the codec exists yet.

    **Verified by:** Generated modules replace hand-written workflow files

    @acceptance-criteria @happy-path
    Scenario: Generated modules replace hand-written workflow files
      Given ClaudeModuleGeneration (Phase 25) is complete
      And the decision specs are annotated with claude-module and claude-section tags
      When running "pnpm docs:claude-modules"
      Then _claude-md/workflow/ contains generated files derived from annotated specs
      And the generated files replace the prior hand-written versions
      And pnpm process:query -- context SessionGuidesModuleSource shows all deliverables complete
