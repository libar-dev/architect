@libar-docs
@libar-docs-pattern:SessionGuidesReference
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-core
@libar-docs-claude-md-section:sessions
Feature: Session Guides Reference - Auto-Generated Documentation

  **Problem:**
  Session workflows guide developers through Planning, Design, and Implementation
  sessions. Each session type has specific checklists, rules, and FSM transitions.
  Maintaining this documentation manually leads to drift from actual process.

  **Solution:**
  Auto-generate the Session Guides reference documentation from annotated source.
  The FSM states and transitions are derived from src/validation/fsm/, while
  session checklists and rules are defined in this decision document.
  Documentation becomes a projection of the implementation, always in sync.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/SESSIONGUIDESREFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/sessions/sessionguidesreference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Session Decision Tree | THIS DECISION (Rule: Session Decision Tree) | Rule block table |
| Planning Session | THIS DECISION (Rule: Planning Session) | Rule block lists |
| Design Session | THIS DECISION (Rule: Design Session) | Rule block lists |
| Implementation Session | THIS DECISION (Rule: Implementation Session) | Rule block lists |
| Planning + Design Session | THIS DECISION (Rule: Planning + Design Session) | Rule block lists |
| FSM Protection | THIS DECISION (Rule: FSM Protection) | Rule block tables |
| FSM Error Messages and Fixes | THIS DECISION (Rule: FSM Error Messages and Fixes) | Rule block table |
| Escape Hatches | THIS DECISION (Rule: Escape Hatches) | Rule block table |
| Handoff Documentation | THIS DECISION (Rule: Handoff Documentation) | Rule block content |
| Discovery Tags | THIS DECISION (Rule: Discovery Tags) | Rule block table |
| Common Mistakes | THIS DECISION (Rule: Common Mistakes) | Rule block tables |
| Related Documentation | THIS DECISION (Rule: Related Documentation) | Rule block table |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Session guides reference feature file | Complete | delivery-process/recipes/session-guides-reference.feature |
      | Generated detailed docs | Pending | docs-generated/docs/SESSIONGUIDESREFERENCE.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/sessions/sessionguidesreference.md |

  Rule: Session Decision Tree

    **Context:** Developers need to choose the correct session type based on their current situation.

    **Decision Tree (ASCII):**

    """
    Starting from pattern brief?
    |-- Yes --> Need code stubs now? --> Yes --> Planning + Design
    |                                --> No  --> Planning
    |-- No  --> Ready to code? --> Yes --> Complex decisions? --> Yes --> Design first
                                                               --> No  --> Implementation
                               --> No  --> Planning
    """

    **Decision:** Session types map to inputs, outputs, and FSM changes:

| Session | Input | Output | FSM Change |
| --- | --- | --- | --- |
| Planning | Pattern brief | Roadmap spec (.feature) | Creates roadmap |
| Design | Complex requirement | Decision specs + code stubs | None |
| Implementation | Roadmap spec | Code + tests | roadmap to active to completed |
| Planning + Design | Pattern brief | Spec + stubs | Creates roadmap |

  Rule: Planning Session

    **Goal:** Create a roadmap spec. Do NOT write implementation code.

    **Checklist:**

    1. Extract metadata from pattern brief
       - Phase number to at-prefix-phase
       - Dependencies to at-prefix-depends-on
       - Status to at-prefix-status:roadmap (always roadmap)

    2. Create spec file at specs/product-area/pattern.feature

    3. Structure the feature with at-prefix tags

    4. Add deliverables table in Background section

    5. Convert tables to Rule blocks (each business constraint becomes a Rule)

    6. Add scenarios per Rule (minimum: 1 happy-path + 1 validation)

    7. Set executable specs location with at-prefix-executable-specs tag

    **Do NOT:**

| Forbidden Action | Rationale |
| --- | --- |
| Create .ts implementation files | Planning only creates specs |
| Transition to active | Active requires implementation readiness |
| Ask Ready to implement? | Planning session ends at roadmap spec |
| Write full implementations | Stubs only if Planning + Design |

  Rule: Design Session

    **Goal:** Make architectural decisions. Create code stubs with interfaces. Do NOT implement.

    **When Required:**

| Use Design Session | Skip Design Session |
| --- | --- |
| Multiple valid approaches | Single obvious path |
| New patterns/capabilities | Bug fix |
| Cross-context coordination | Clear requirements |

    **Checklist:**

    1. Record architectural decisions as PDR .feature files in delivery-process/decisions/

    2. Document options (at least 2-3 approaches with pros/cons in Rule blocks)

    3. Get approval (user must approve recommended approach)

    4. Create code stubs in delivery-process/stubs/{pattern-name}/ with at-prefix-implements and Target: annotations

    **Code Stub Pattern:**

    """typescript
    /**
     * at-prefix
     * at-prefix-status roadmap
     * at-prefix-implements MyPattern
     *
     * MyPattern - Description
     *
     * Target: src/path/to/final/location.ts
     * See: PDR-001 (Design Decision)
     */
    export interface MyResult {
      id: string;
    }

    export function myFunction(args: MyArgs): Promise<MyResult> {
      throw new Error('MyPattern not yet implemented - roadmap pattern');
    }
    """

    **Do NOT:**

| Forbidden Action | Rationale |
| --- | --- |
| Create markdown design documents | Decision specs provide better traceability with structured tags |
| Create implementation plans | Design focuses on architecture |
| Transition spec to active | Requires implementation session |
| Write full implementations | Stubs only |

  Rule: Implementation Session

    **Goal:** Write code. The roadmap spec is the source of truth.

    **Pre-flight Requirements:**

| Requirement | Why |
| --- | --- |
| Roadmap spec exists with at-prefix-status:roadmap | Cannot implement without spec |
| Decision specs approved (if needed) | Complex decisions need approval |
| Implementation plan exists (for multi-session work) | Prevents scope drift |

    **Execution Checklist (CRITICAL - Order Matters):**

    1. Transition to active FIRST (before any code)
       - Change at-prefix-status:roadmap to at-prefix-status:active
       - Protection: active = scope-locked (no new deliverables)

    2. Create executable spec stubs (if at-prefix-executable-specs present)
       - Use at-prefix-implements:PatternName tag

    3. For each deliverable:
       - Read acceptance criteria from spec
       - Implement code (replace throw new Error)
       - Preserve at-prefix-* annotations in JSDoc
       - Write tests
       - Update deliverable status to completed

    4. Transition to completed (only when ALL done)
       - Change at-prefix-status:active to at-prefix-status:completed
       - Protection: completed = hard-locked (requires at-prefix-unlock-reason)

    5. Regenerate docs with: pnpm docs:all

    **Do NOT:**

| Forbidden Action | Rationale |
| --- | --- |
| Add new deliverables to active spec | Scope-locked state prevents this |
| Mark completed with incomplete work | Hard-locked state cannot be undone |
| Skip FSM transitions | Process Guard will reject |
| Edit generated docs directly | Regenerate from source |

  Rule: Planning + Design Session

    **Goal:** Create spec AND code stubs in one session. For immediate implementation handoff.

    **When to Use:**

| Use Planning + Design | Use Planning Only |
| --- | --- |
| Need stubs for implementation | Only enhancing spec |
| Preparing for immediate handoff | Still exploring requirements |
| Want complete two-tier architecture | Do not need Tier 2 yet |

    **Checklist:**

    1. Complete Planning checklist (see Planning Session rule)

    2. Add at-prefix-executable-specs tag pointing to Tier 2 location

    3. Create code stubs (see Design Session code stub pattern)

    4. Create Tier 2 directory: package/tests/features/behavior/pattern-name/

    5. Create Tier 2 feature stubs with at-prefix-implements:PatternName

    6. Create step definitions stub at tests/planning-stubs/pattern.steps.ts

    **Handoff Complete When:**

    Tier 1:
    - All at-prefix-* tags present
    - at-prefix-executable-specs points to Tier 2
    - Deliverables table complete
    - Status is roadmap

    Tier 2:
    - Directory created with .feature files
    - Each file has at-prefix-implements
    - Step definitions stub compiles

    Validation:
    - pnpm lint passes
    - pnpm typecheck passes

  Rule: FSM Protection

    **Context:** The FSM (Finite State Machine) protects work integrity through state-based restrictions.

    **Decision:** Protection levels and valid transitions are defined in TypeScript source:
    - Protection levels: See `PROTECTION_LEVELS` in `src/validation/fsm/states.ts`
    - Valid transitions: See `VALID_TRANSITIONS` in `src/validation/fsm/transitions.ts`

    **Protection Levels:**

| State | Protection | Can Add Deliverables | Needs Unlock | Allowed Actions | Blocked Actions |
| --- | --- | --- | --- | --- | --- |
| roadmap | None | Yes | No | Full editing, add deliverables | None |
| deferred | None | Yes | No | Full editing, add deliverables | None |
| active | Scope-locked | No | No | Edit existing deliverables | Adding new deliverables |
| completed | Hard-locked | No | Yes | Nothing | Any change without unlock tag |

    **Valid FSM Transitions:**

| From | To | Trigger | Notes |
| --- | --- | --- | --- |
| roadmap | active | Start work | Locks scope |
| roadmap | deferred | Postpone | For deprioritized work |
| active | completed | Finish | Terminal state |
| active | roadmap | Regress | For blocked work |
| deferred | roadmap | Resume | To restart planning |

    **Invalid Transitions (will fail validation):**

| Attempted | Why Invalid | Valid Path |
| --- | --- | --- |
| roadmap to completed | Must go through active | roadmap to active to completed |
| deferred to active | Must return to roadmap first | deferred to roadmap to active |
| deferred to completed | Cannot skip two states | deferred to roadmap to active to completed |
| completed to any | Terminal state | Use unlock-reason tag to modify |

  Rule: FSM Error Messages and Fixes

    **Context:** Process Guard validates FSM rules and provides specific error messages with fixes.

    **Error Reference:**

| Error | Cause | Fix |
| --- | --- | --- |
| completed-protection | File has completed status but no unlock tag | Add unlock-reason tag with hyphenated reason |
| invalid-status-transition | Skipped FSM state (e.g., roadmap to completed) | Follow path: roadmap to active to completed |
| scope-creep | Added deliverable to active spec | Remove deliverable OR revert to roadmap |
| session-scope (warning) | Modified file outside session scope | Add to scope OR use --ignore-session |
| session-excluded | Modified excluded pattern during session | Remove from exclusion OR override |
| deliverable-removed (warning) | Deliverable was removed from spec | Informational only, verify intentional |

  Rule: Escape Hatches

    **Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Available Escape Hatches:**

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI treats warnings as errors | Use --strict flag | lint-process --all --strict |
| Emergency hotfix | Combine unlock + ignore | @libar-docs-unlock-reason:'Hotfix' plus --ignore-session |

    **Unlock Reason Constraints:**

    - Values cannot contain spaces (use hyphens)
    - Must describe why modification is needed
    - Is committed with the change for audit trail

  Rule: Handoff Documentation

    **Context:** Multi-session work requires state capture at session boundaries.

    **Template:**

    """markdown
    Session State

    - Last completed: Phase 1 - Core types
    - In progress: Phase 2 - Validation
    - Blockers: None

    Files Modified

    - src/types.ts - Added core types
    - src/validate.ts - Started validation (incomplete)

    Next Session

    1. FIRST: Complete validation in src/validate.ts
    2. Add integration tests
    3. Update deliverable statuses
    """

    **Required Elements:**

| Element | Purpose |
| --- | --- |
| Last completed | What finished this session |
| In progress | What is partially done |
| Blockers | What prevents progress |
| Files Modified | Track changes for review |
| Next Session | Clear starting point |

  Rule: Discovery Tags

    **Context:** Learnings discovered during sessions should be captured inline.

    **Decision:** Three discovery tag types are available:

| Tag | Purpose | Example |
| --- | --- | --- |
| at-prefix-discovered-gap | Missing edge case or feature | Missing-validation-for-empty-input |
| at-prefix-discovered-improvement | Performance or DX enhancement | Cache-parsed-results |
| at-prefix-discovered-learning | Knowledge gained | Gherkin-requires-strict-indentation |

    **Usage:** Add discovery tags as comments in feature files or code:

    """gherkin
    at-prefix-discovered-gap: Missing-edge-case-for-empty-input
    at-prefix-discovered-improvement: Cache-parsed-results
    at-prefix-discovered-learning: Gherkin-requires-strict-indentation
    """

    **Note:** Discovery tags use hyphens instead of spaces (tag values cannot contain spaces).

  Rule: Common Mistakes

    **Context:** Developers frequently make these mistakes when following session workflows.

    **Planning Session Mistakes:**

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Creating .ts implementation files | Planning only creates specs | Create spec file only, no code |
| Transitioning to active | Active requires implementation readiness | Keep status as roadmap |
| Asking Ready to implement? | Planning session ends at roadmap spec | End session after spec complete |
| Writing full implementations | Stubs only if Planning + Design | Save implementation for Implementation session |

    **Implementation Session Mistakes:**

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Writing code before transition | FSM must be active first | Change status to active FIRST |
| Adding deliverables to active spec | Scope-locked state prevents this | Revert to roadmap to add scope |
| Marking completed with incomplete work | Hard-locked state cannot be undone | Finish ALL deliverables first |
| Skipping FSM transitions | Process Guard will reject | Follow roadmap to active to completed |
| Editing generated docs directly | Will be overwritten | Regenerate from source |

    **Design Session Mistakes:**

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Creating markdown design documents | Decision specs provide better traceability | Record decisions as PDR .feature files in delivery-process/decisions/ |
| Creating implementation plans | Design focuses on architecture | Document options and decisions only |
| Transitioning spec to active | Requires implementation session | Keep status as roadmap |
| Writing full implementations | Design creates stubs only | Use throw new Error pattern |

  Rule: Related Documentation

    **Context:** Session guides connect to other documentation.

    **Decision:** Related docs by topic:

| Document | Content |
| --- | --- |
| METHODOLOGY.md | Core thesis, FSM states, two-tier architecture |
| GHERKIN-PATTERNS.md | DataTables, DocStrings, Rule blocks |
| CONFIGURATION.md | Tag prefixes, presets |
| INSTRUCTIONS.md | CLI commands, full tag reference |
| PROCESS-GUARD-REFERENCE.md | FSM validation rules and CLI usage |
| VALIDATION-REFERENCE.md | DoD validation and anti-pattern detection |

  @acceptance-criteria
  Scenario: Reference generates Session Guides documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with session decision tree
    And detailed docs are generated with planning session checklist
    And detailed docs are generated with implementation session checklist
    And compact docs are generated with FSM protection table
    And FSM error messages and fixes are included
    And escape hatches reference is included
    And common mistakes tables are included
    And discovery tags reference is included
