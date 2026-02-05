# SessionGuidesReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Session Decision Tree

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
| Design | Complex requirement | Design doc + code stubs | None |
| Implementation | Roadmap spec | Code + tests | roadmap to active to completed |
| Planning + Design | Pattern brief | Spec + stubs | Creates roadmap |

### Planning Session

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

### Design Session

**Goal:** Make architectural decisions. Create code stubs with interfaces. Do NOT implement.

    **When Required:**

| Use Design Session | Skip Design Session |
| --- | --- |
| Multiple valid approaches | Single obvious path |
| New patterns/capabilities | Bug fix |
| Cross-context coordination | Clear requirements |

    **Checklist:**

    1. Create design doc at plans/designs/draft/DESIGN-name.md

    2. Document options (at least 2-3 approaches with pros/cons)

    3. Get approval (user must approve recommended approach)

    4. Create code stubs with interfaces (throw new Error pattern)

    5. Move to approved after user approval (designs/draft to designs/approved)

    **Code Stub Pattern:**

    """typescript
    /**
     * at-prefix
     * at-prefix-status roadmap
     * at-prefix-uses Workpool, EventStore
     *
     * MyPattern - Description
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
| Create implementation plans | Design focuses on architecture |
| Transition spec to active | Requires implementation session |
| Write full implementations | Stubs only |

### Implementation Session

**Goal:** Write code. The roadmap spec is the source of truth.

    **Pre-flight Requirements:**

| Requirement | Why |
| --- | --- |
| Roadmap spec exists with at-prefix-status:roadmap | Cannot implement without spec |
| Design doc approved (if needed) | Complex decisions need approval |
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

### Planning + Design Session

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

### FSM Transitions

- `VALID_TRANSITIONS` - const
- `isValidTransition` - function
- `getValidTransitionsFrom` - function
- `getTransitionErrorMessage` - function

### Handoff Documentation

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

### Discovery Tags

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
