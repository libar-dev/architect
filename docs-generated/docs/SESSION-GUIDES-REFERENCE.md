# SessionGuidesReference

**Purpose:** Full documentation generated from decision document
**Detail Level:** detailed

---

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
| FSM Protection | src/validation/fsm/states.ts | at-extract-shapes tag |
| FSM Transitions | src/validation/fsm/transitions.ts | at-extract-shapes tag |
| Handoff Documentation | THIS DECISION (Rule: Handoff Documentation) | Rule block content |
| Discovery Tags | THIS DECISION (Rule: Discovery Tags) | Rule block table |
| Related Documentation | THIS DECISION (Rule: Related Documentation) | Rule block table |

---

## Implementation Details

### Session Decision Tree

**Context:** Developers need to choose the correct session type based on their current situation.

    **Decision Tree (ASCII):**

```text
Starting from pattern brief?
    |-- Yes --> Need code stubs now? --> Yes --> Planning + Design
    |                                --> No  --> Planning
    |-- No  --> Ready to code? --> Yes --> Complex decisions? --> Yes --> Design first
                                                               --> No  --> Implementation
                               --> No  --> Planning
```

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

```typescript
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
```

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

### FSM Protection

```typescript
/**
 * Protection level mapping per PDR-005
 *
 * | State     | Protection | Meaning                          |
 * |-----------|------------|----------------------------------|
 * | roadmap   | none       | Planning phase, fully editable   |
 * | active    | scope      | In progress, no new deliverables |
 * | completed | hard       | Done, requires unlock to modify  |
 * | deferred  | none       | Parked, fully editable           |
 */
const PROTECTION_LEVELS: Readonly<Record<ProcessStatusValue, ProtectionLevel>>;
```

```typescript
/**
 * Protection level types for FSM states
 *
 * - `none`: Fully editable, no restrictions
 * - `scope`: Scope-locked, prevents adding new deliverables
 * - `hard`: Hard-locked, requires explicit unlock-reason annotation
 */
type ProtectionLevel = 'none' | 'scope' | 'hard';
```

```typescript
/**
 * Get the protection level for a status
 *
 * @param status - Process status value
 * @returns Protection level for the status
 *
 * @example
 * ```typescript
 * getProtectionLevel("active"); // → "scope"
 * getProtectionLevel("completed"); // → "hard"
 * ```
 */
function getProtectionLevel(status: ProcessStatusValue): ProtectionLevel;
```

```typescript
/**
 * Check if a status is a terminal state (cannot transition out)
 *
 * Terminal states require explicit unlock to modify.
 *
 * @param status - Process status value
 * @returns true if the status is terminal
 *
 * @example
 * ```typescript
 * isTerminalState("completed"); // → true
 * isTerminalState("active"); // → false
 * ```
 */
function isTerminalState(status: ProcessStatusValue): boolean;
```

```typescript
/**
 * Check if a status is fully editable (no protection)
 *
 * @param status - Process status value
 * @returns true if the status has no protection
 */
function isFullyEditable(status: ProcessStatusValue): boolean;
```

```typescript
/**
 * Check if a status is scope-locked
 *
 * @param status - Process status value
 * @returns true if the status prevents scope changes
 */
function isScopeLocked(status: ProcessStatusValue): boolean;
```

### FSM Transitions

```typescript
/**
 * Valid FSM transitions matrix
 *
 * Maps each state to the list of states it can transition to.
 *
 * | From      | Valid Targets              | Notes                        |
 * |-----------|----------------------------|------------------------------|
 * | roadmap   | active, deferred, roadmap  | Can start, park, or stay     |
 * | active    | completed, roadmap         | Can finish or regress        |
 * | completed | (none)                     | Terminal state               |
 * | deferred  | roadmap                    | Must go through roadmap      |
 */
const VALID_TRANSITIONS: Readonly<
  Record<ProcessStatusValue, readonly ProcessStatusValue[]>
>;
```

```typescript
/**
 * Check if a transition between two states is valid
 *
 * @param from - Current status
 * @param to - Target status
 * @returns true if the transition is allowed
 *
 * @example
 * ```typescript
 * isValidTransition("roadmap", "active"); // → true
 * isValidTransition("roadmap", "completed"); // → false (must go through active)
 * isValidTransition("completed", "active"); // → false (terminal state)
 * ```
 */
function isValidTransition(from: ProcessStatusValue, to: ProcessStatusValue): boolean;
```

```typescript
/**
 * Get all valid transitions from a given state
 *
 * @param status - Current status
 * @returns Array of valid target states (empty for terminal states)
 *
 * @example
 * ```typescript
 * getValidTransitionsFrom("roadmap"); // → ["active", "deferred", "roadmap"]
 * getValidTransitionsFrom("completed"); // → []
 * ```
 */
function getValidTransitionsFrom(status: ProcessStatusValue): readonly ProcessStatusValue[];
```

```typescript
/**
 * Get a human-readable description of why a transition is invalid
 *
 * @param from - Current status
 * @param to - Attempted target status
 * @param options - Optional message options with registry for prefix
 * @returns Error message describing the violation
 *
 * @example
 * ```typescript
 * getTransitionErrorMessage("roadmap", "completed");
 * // → "Cannot transition from 'roadmap' to 'completed'. Must go through 'active' first."
 *
 * getTransitionErrorMessage("completed", "active");
 * // → "Cannot transition from 'completed' (terminal state). Use unlock-reason tag to modify."
 * ```
 */
function getTransitionErrorMessage(
  from: ProcessStatusValue,
  to: ProcessStatusValue,
  options?: TransitionMessageOptions
): string;
```

### Handoff Documentation

**Context:** Multi-session work requires state capture at session boundaries.

    **Template:**

```markdown
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
```

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

```gherkin
at-prefix-discovered-gap: Missing-edge-case-for-empty-input
    at-prefix-discovered-improvement: Cache-parsed-results
    at-prefix-discovered-learning: Gherkin-requires-strict-indentation
```

**Note:** Discovery tags use hyphens instead of spaces (tag values cannot contain spaces).

### Related Documentation

**Context:** Session guides connect to other documentation.

    **Decision:** Related docs by topic:

| Document | Content |
| --- | --- |
| METHODOLOGY.md | Core thesis, FSM states, two-tier architecture |
| GHERKIN-PATTERNS.md | DataTables, DocStrings, Rule blocks |
| CONFIGURATION.md | Tag prefixes, presets |
| INSTRUCTIONS.md | CLI commands, full tag reference |
