@architect
@architect-pattern:ErrorGuideCodec
@architect-status:completed
@architect-unlock-reason:Initial-commit-with-all-deliverables-complete
@architect-phase:35
@architect-effort:2w
@architect-product-area:Generation
@architect-depends-on:DocsConsolidationStrategy
@architect-business-value:replaces-341-line-manual-PROCESS-GUARD-md-with-auto-generated-error-diagnosis-guides
@architect-priority:medium
Feature: Error Guide Codec

  **Problem:**
  `docs/PROCESS-GUARD.md` (341 lines) is manually maintained with per-error-code
  diagnosis guides, escape hatch documentation, pre-commit setup instructions, and
  programmatic API examples. When validation rules change in `src/lint/`, the manual
  doc drifts. The existing `ValidationRulesCodec` generates `docs-live/validation/`
  files (error-catalog.md, fsm-transitions.md, protection-levels.md) covering ~35%
  of PROCESS-GUARD.md content, but these lack fix rationale ("why this rule exists"),
  alternative approaches, integration recipes (Husky, CI), and the programmatic API.

  **Solution:**
  Enhance the `ValidationRulesCodec` to generate error diagnosis guide content by:
  (1) registering a `process-guard-errors` convention tag in `conventions.ts`,
  (2) annotating error-handling source files in `src/lint/` with structured JSDoc
  convention annotations, (3) adding new `ValidationRulesCodecOptions` toggles for
  error guide sections, (4) adding a `ReferenceDocConfig` entry that composes
  convention-tagged content with the existing error catalog, and (5) using preamble
  for Husky/CI setup content that cannot come from source annotations.

  **Why It Matters:**
  | Benefit | How |
  | Zero-drift error docs | Error codes, causes, fixes, and rationale generated from annotated source |
  | Fix rationale included | Each error code explains why the rule exists, not just how to fix it |
  | Integration recipes | Husky pre-commit and CI pipeline setup carried via preamble |
  | Progressive disclosure | Overview links to per-error detail pages with examples and alternatives |
  | Replaces manual doc | PROCESS-GUARD.md sections replaced with pointers to generated output |

  **Scope:**
  | Content Section | Source | Mechanism |
  | Error codes with cause/fix | RULE_DEFINITIONS constant | Already generated (error-catalog.md) |
  | Fix rationale per error | New convention annotations on src/lint/ | Convention tag extraction |
  | Escape hatch alternatives | New convention annotations | Convention tag extraction |
  | FSM transitions and protection levels | VALID_TRANSITIONS, PROTECTION_LEVELS | Already generated |
  | Pre-commit setup (Husky) | Cannot come from annotations | Preamble SectionBlock[] |
  | Programmatic API guide | Cannot come from annotations | Preamble SectionBlock[] |
  | Architecture diagram (Decider pattern) | Cannot come from annotations | Preamble SectionBlock[] |
  | CLI usage and options | Hardcoded in buildCLISection | Already generated |

  **Design Questions (for design session):**
  | Question | Options | Recommendation |
  | Enhance ValidationRulesCodec or create separate codec? | (A) Extend existing, (B) New ErrorGuideCodec | (A) Extend -- RULE_DEFINITIONS and section builders already exist |
  | Convention tag approach? | (A) New process-guard-errors tag, (B) Reuse fsm-rules | (A) New tag -- error diagnosis content is distinct from FSM rule definitions |
  | Where does rationale come from? | (A) Convention JSDoc on src/lint/, (B) Rule: blocks in ProcessGuardLinter spec | (A) Convention JSDoc -- rationale belongs near the error-handling code |
  | How to handle Husky/CI content? | (A) Preamble, (B) New annotation type | (A) Preamble -- integration recipes are editorial, not code-derived |

  **Design Session Findings (2026-03-06):**
  | Finding | Decision | Rationale |
  | DD-1: Extend ValidationRulesCodec | Confirmed (A) Extend existing | ValidationRulesCodec owns RULE_DEFINITIONS, 4 boolean option toggles, buildDetailFiles(), and 6 section builders. A separate ErrorGuideCodec would duplicate all of these. New includeErrorGuide toggle follows established pattern. |
  | DD-2: New process-guard-errors convention tag | Confirmed (A) New tag | fsm-rules covers FSM structure (transitions, states, protection). Error diagnosis (rationale, alternatives, debugging hints) is a distinct content domain. 13 existing convention values, this becomes the 14th. |
  | DD-3: Convention JSDoc on decider.ts | Confirmed (A) Convention JSDoc | decider.ts already has 450-line JSDoc. Convention extractor decomposes by ## Heading sections into ConventionRuleContent entries. Each of 6 error rules gets a ## heading with Invariant/Rationale/table. Proven by orchestrator.ts and reference.ts convention annotations. |
  | DD-4: Preamble for Husky/CI content | Confirmed (A) Preamble | ReferenceDocConfig.preamble is SectionBlock[] prepended before generated content. Already proven by product-area docs. Husky setup, programmatic API (6 functions), and Decider architecture diagram are editorial content at editorial cadence. |
  | DD-5: Two-document composition strategy | ReferenceDocConfig entry creates unified PROCESS-GUARD.md | The reference codec composes preamble + convention content. The validation-rules generator continues producing error-catalog.md, fsm-transitions.md, protection-levels.md independently. The reference doc links to these detail files. |
  | DD-6: Fallback strategy for missing annotations | description field as fallback rationale | composeRationaleIntoRules() enriches RULE_DEFINITIONS from convention bundles. If no convention annotation exists for a rule ID, rationale defaults to description. No empty rationale sections in output. |

  **Design Stubs:**
  | Stub | Location | Purpose |
  | enhanced-validation-options.ts | architect/stubs/error-guide-codec/ | DD-1: Extended ValidationRulesCodecOptions with includeErrorGuide toggle and EnhancedRuleDefinition interface |
  | error-guide-config.ts | architect/stubs/error-guide-codec/ | DD-2/DD-4: ReferenceDocConfig entry with preamble SectionBlocks and convention tag registration |
  | convention-annotation-example.ts | architect/stubs/error-guide-codec/ | DD-3: Example convention annotation format for all 6 error rules on decider.ts |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Register process-guard-errors convention tag value | complete | src/taxonomy/conventions.ts | Yes | unit |
      | Annotate error-handling source files with convention tags | complete | src/lint/process-guard/decider.ts | No | n/a |
      | Add ValidationRulesCodecOptions toggles for error guide sections | complete | src/renderable/codecs/validation-rules.ts | Yes | unit |
      | ReferenceDocConfig entry for PROCESS-GUARD generated reference | complete | architect.config.ts | Yes | integration |
      | Preamble content for Husky/CI setup and programmatic API | complete | architect.config.ts | Yes | integration |
      | Replace PROCESS-GUARD.md reference sections with pointer to generated output | complete | docs/PROCESS-GUARD.md | No | n/a |
      | Behavior spec with scenarios for error guide generation | n/a | tests/features/generation/error-guide-codec.feature | Yes | acceptance |

  Rule: Error guide extends the existing ValidationRulesCodec

    **Invariant:** Error diagnosis guide content is produced by enhancing the existing
    `ValidationRulesCodec` and its `RULE_DEFINITIONS` constant, not by creating a
    parallel codec. The enhanced codec adds fix rationale, alternative approaches, and
    integration context to the existing error catalog, FSM transitions, and protection
    level detail files. A separate `ErrorGuideCodec` class is not created.

    **Rationale:** `ValidationRulesCodec` already owns `RULE_DEFINITIONS` with error
    codes, causes, and fixes. It generates `error-catalog.md`, `fsm-transitions.md`,
    and `protection-levels.md`. Creating a parallel codec would duplicate RULE_DEFINITIONS
    access and fragment validation documentation across two codecs. Extending the existing
    codec keeps all validation reference content in one place.

    **Verified by:** Enhanced codec produces error guide sections,
    No parallel ErrorGuideCodec class exists

    @acceptance-criteria @happy-path
    Scenario: Enhanced ValidationRulesCodec produces error guide content
      Given the ValidationRulesCodec with error guide options enabled
      And RULE_DEFINITIONS contains error codes with causes and fixes
      And convention-tagged source files provide fix rationale
      When the codec generates the validation rules document
      Then error guide sections appear with rationale for each error code
      And each error code entry includes cause, fix, and why-this-rule-exists

    @acceptance-criteria @validation
    Scenario: Error guide options are independently toggleable
      Given the ValidationRulesCodec with includeErrorGuide set to false
      When the codec generates the validation rules document
      Then no error guide rationale sections appear
      And the existing error catalog, FSM, and protection level sections still render

  Rule: Each error code has fix rationale explaining why the rule exists

    **Invariant:** Every error code in the generated output includes not just a fix
    command but a "why this rule exists" rationale. The rationale is sourced from
    `@architect-convention:process-guard-errors` JSDoc annotations on the error-handling
    code in `src/lint/process-guard/`. The `RuleDefinition` interface is extended with
    a `rationale` field, or rationale is composed from convention-extracted content.

    **Rationale:** The existing `error-catalog.md` tells developers what to do (fix
    command) but not why the rule exists. Without rationale, developers reach for escape
    hatches instead of understanding the workflow constraint. PROCESS-GUARD.md includes
    rationale like "Prevents scope creep during implementation. Plan fully before
    starting; implement what was planned." -- this must survive in the generated output.

    **Verified by:** All error codes have rationale in output,
    Convention annotations are the rationale source

    @acceptance-criteria @happy-path
    Scenario: Generated error catalog includes rationale for each rule
      Given source files in src/lint/process-guard/ annotated with process-guard-errors convention
      And each annotation includes a rationale section in its JSDoc
      When the enhanced ValidationRulesCodec generates the error catalog detail file
      Then each error code entry includes a "Why this rule exists" section
      And the rationale text matches the convention annotation content

    @acceptance-criteria @validation
    Scenario: Missing convention annotation falls back to description
      Given a RULE_DEFINITIONS entry with no matching convention annotation
      When the enhanced ValidationRulesCodec generates the error catalog
      Then the error code entry uses the description field as fallback rationale
      And no empty rationale section appears in the output

  Rule: Preamble carries integration content that cannot come from annotations

    **Invariant:** Pre-commit setup instructions (Husky configuration, package.json
    scripts), CI pipeline patterns, programmatic API examples, and the Decider pattern
    architecture diagram use the `ReferenceDocConfig.preamble` mechanism. These are
    `SectionBlock[]` defined in the config entry, prepended before all generated content.
    Preamble content is manually authored and changes at editorial cadence, not code cadence.

    **Rationale:** Integration recipes (Husky hook setup, CI YAML patterns, API usage
    examples) are not extractable from source annotations because they describe how
    external systems consume Process Guard, not how Process Guard is implemented.
    The preamble mechanism exists precisely for this: editorial prose that lives in
    the config, not in a separate manual file, and appears in the generated output.

    **Verified by:** Preamble includes Husky setup section,
    Preamble includes programmatic API section

    @acceptance-criteria @happy-path
    Scenario: Generated document includes Husky pre-commit setup from preamble
      Given a ReferenceDocConfig with preamble containing Husky setup instructions
      When the reference codec generates the PROCESS-GUARD reference document
      Then the Husky setup section appears before generated validation rules content
      And the section includes package.json script examples

    @acceptance-criteria @happy-path
    Scenario: Generated document includes programmatic API guide from preamble
      Given a ReferenceDocConfig with preamble containing programmatic API examples
      When the reference codec generates the PROCESS-GUARD reference document
      Then the API guide section appears in the preamble area
      And the section includes import paths and function signatures

    @acceptance-criteria @validation
    Scenario: Preamble content appears in both detail levels
      Given a ReferenceDocConfig with preamble and convention tags
      When the reference codec generates at detailed and summary levels
      Then preamble sections appear in both outputs
      And convention-derived content follows the preamble in both outputs

  Rule: Convention tags source error context from annotated lint code

    **Invariant:** Error-handling code in `src/lint/process-guard/` is annotated with
    `@architect-convention:process-guard-errors` using structured JSDoc that includes
    rationale, alternative approaches, and common mistake patterns. The convention tag
    value `process-guard-errors` is registered in `src/taxonomy/conventions.ts` in the
    `CONVENTION_VALUES` array. The `createReferenceCodec` factory extracts this content
    via the existing convention extractor pipeline.

    **Rationale:** Convention-tagged annotations on the error-handling code co-locate
    rationale with implementation. When a developer changes an error rule in the decider,
    the convention JSDoc is right there -- they update both in the same commit. This is
    the same pattern used by `codec-registry`, `pipeline-architecture`, and
    `taxonomy-rules` convention tags, all proven by CodecDrivenReferenceGeneration.

    **Verified by:** Convention tag is registered in CONVENTION_VALUES,
    Convention extraction produces error context sections

    @acceptance-criteria @happy-path
    Scenario: Convention tag value is registered and extractable
      Given the CONVENTION_VALUES array in src/taxonomy/conventions.ts
      When process-guard-errors is added to the array
      Then the convention extractor recognizes the tag value
      And source files tagged with process-guard-errors produce convention sections

    @acceptance-criteria @happy-path
    Scenario: Convention-tagged decider code produces structured error context
      Given the decider.ts file annotated with process-guard-errors convention
      And the JSDoc includes rationale and alternative-approach sections
      When the reference codec extracts convention content
      Then each annotated block produces a section with rationale and alternatives
      And sections are ordered by error code identifier

    @acceptance-criteria @validation
    Scenario: Unannotated error-handling files produce no convention content
      Given error-handling files in src/lint/ without convention tags
      When the reference codec extracts convention content for process-guard-errors
      Then no convention sections are produced for unannotated files
      And the generated document still includes RULE_DEFINITIONS-based content
