# Session Workflow Guides

> Quick reference for each session type. For concepts (FSM, two-tier architecture), see [METHODOLOGY.md](./METHODOLOGY.md).

---

## Session Decision Tree

```
Starting from pattern brief?
├── Yes → Need code stubs now? → Yes → Planning + Design
│                              → No  → Planning
└── No  → Ready to code? → Yes → Complex decisions? → Yes → Design first
                                                    → No  → Implementation
                        → No  → Planning
```

| Session           | Input               | Output                      | FSM Change                 |
| ----------------- | ------------------- | --------------------------- | -------------------------- |
| Planning          | Pattern brief       | Roadmap spec (`.feature`)   | Creates `roadmap`          |
| Design            | Complex requirement | Decision specs + code stubs | None                       |
| Implementation    | Roadmap spec        | Code + tests                | `roadmap→active→completed` |
| Planning + Design | Pattern brief       | Spec + stubs                | Creates `roadmap`          |

---

## Planning Session

**Goal:** Create a roadmap spec. Do not write implementation code.

### Checklist

- [ ] **Extract metadata** from pattern brief:
  - Phase number → `@<prefix>-phase`
  - Dependencies → `@<prefix>-depends-on`
  - Status → `@<prefix>-status:roadmap` (always `roadmap`)

- [ ] **Create spec file** at `{specs-directory}/{product-area}/{pattern}.feature`

- [ ] **Structure the feature:**

  ```gherkin
  @<prefix>
  @<prefix>-pattern:MyPattern
  @<prefix>-status:roadmap
  @<prefix>-phase:15
  Feature: My Pattern

    **Problem:** One sentence.

    **Solution:**
    - Key mechanism 1
    - Key mechanism 2
  ```

- [ ] **Add deliverables table:**

  ```gherkin
  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status  | Location | Tests | Test Type |
      | Core types  | planned | src/types.ts | Yes | unit |
  ```

- [ ] **Convert tables to Rules** — Each business constraint becomes a `Rule:` block

- [ ] **Add scenarios per Rule** — Minimum: 1 `@happy-path` + 1 `@validation`

- [ ] **Set executable specs location:**
  ```gherkin
  @<prefix>-executable-specs:{package}/tests/features/behavior/{pattern}
  ```

### Do NOT

- Create `.ts` implementation files
- Transition to `active`
- Ask "Ready to implement?"

### Example: delivery-process dogfood

See [`tests/features/validation/fsm-validator.feature`](../tests/features/validation/fsm-validator.feature) for a complete roadmap spec with Rules, ScenarioOutlines, and proper tagging.

---

## Design Session

**Goal:** Make architectural decisions. Create code stubs with interfaces. Do not implement.

### When Required

| Use Design Session         | Skip Design Session |
| -------------------------- | ------------------- |
| Multiple valid approaches  | Single obvious path |
| New patterns/capabilities  | Bug fix             |
| Cross-context coordination | Clear requirements  |

### Checklist

- [ ] **Record decisions** as PDR `.feature` files in `delivery-process/decisions/`

- [ ] **Document options** — At least 2-3 approaches with pros/cons

- [ ] **Get approval** — User must approve recommended approach

- [ ] **Create code stubs** in `delivery-process/stubs/{pattern-name}/`:

  ```typescript
  // delivery-process/stubs/{pattern-name}/my-function.ts
  /**
   * @<prefix>
   * @<prefix>-status roadmap
   * @<prefix>-implements MyPattern
   * @<prefix>-uses Workpool, EventStore
   *
   * ## My Pattern - Description
   *
   * Target: src/path/to/final/location.ts
   * See: PDR-001 (Design Decision)
   * Since: DS-1
   */
  export interface MyResult {
    id: string;
  }

  export function myFunction(args: MyArgs): Promise<MyResult> {
    throw new Error('MyPattern not yet implemented - roadmap pattern');
  }
  ```

  Stubs live outside `src/` to avoid TypeScript compilation and ESLint issues. They are scanned by the documentation pipeline via `-i 'delivery-process/stubs/**/*.ts'`.

- [ ] **Verify stub identifier spelling** — Check all exported function/type/interface names for typos before committing stubs

- [ ] **List canonical helpers in `@<prefix>-uses`** — If the function does status matching, reference `isDeliverableStatusComplete`/`isDeliverableStatusPending` from `taxonomy/deliverable-status.ts`

### Do NOT

- Create markdown design documents (use decision specs instead)
- Create implementation plans
- Transition spec to `active`
- Write full implementations (stubs only)

---

## Implementation Session

**Goal:** Write code. The roadmap spec is the source of truth.

### Pre-flight

- [ ] Roadmap spec exists with `@<prefix>-status:roadmap`
- [ ] Decision specs approved (if needed)
- [ ] Implementation plan exists (for multi-session work)

### Execution Checklist

1. **Transition to active FIRST** (before any code):

   ```gherkin
   # Change in roadmap spec:
   @<prefix>-status:active
   ```

   > Protection: `active` = scope-locked (no new deliverables)

2. **Create executable spec stubs** (if `@<prefix>-executable-specs` present):

   ```gherkin
   @<prefix>-implements:MyPattern
   Feature: My Pattern Behavior
   ```

3. **For each deliverable:**
   - [ ] Read acceptance criteria from spec
   - [ ] Implement code (replace `throw new Error`)
   - [ ] Preserve `@<prefix>-*` annotations in JSDoc
   - [ ] Write tests
   - [ ] Update deliverable status:
     ```gherkin
     | Core types | completed | src/types.ts | Yes | unit |
     ```

4. **Verify all design decisions addressed:**
   - [ ] Run `pnpm process:query -- decisions <SpecName>` and confirm each DD-N has a corresponding `// DD-N:` comment in the implementation

5. **Transition to completed** (only when ALL done):

   ```gherkin
   @<prefix>-status:completed
   ```

   > Protection: `completed` = hard-locked (requires `@<prefix>-unlock-reason` to modify)

6. **Regenerate docs:**
   ```bash
   pnpm docs:all
   ```

### Do NOT

- Add new deliverables to an `active` spec
- Mark `completed` with incomplete work
- Skip FSM transitions
- Edit generated docs directly

---

## Planning + Design Session

**Goal:** Create spec AND code stubs in one session. For immediate implementation handoff.

### When to Use

| Use Planning + Design               | Use Planning Only            |
| ----------------------------------- | ---------------------------- |
| Need stubs for implementation       | Only enhancing spec          |
| Preparing for immediate handoff     | Still exploring requirements |
| Want complete two-tier architecture | Don't need Tier 2 yet        |

### Checklist

1. **Complete Planning checklist** (above)

2. **Add `@<prefix>-executable-specs` tag** pointing to Tier 2 location

3. **Create code stubs** (see Design Session checklist)

4. **Create Tier 2 directory:**

   ```
   {package}/tests/features/behavior/{pattern-name}/
   ```

5. **Create Tier 2 feature stubs:**

   ```gherkin
   @<prefix>-implements:MyPattern
   @acceptance-criteria
   Feature: My Pattern - Rule Name

     @happy-path
     Scenario: Happy path from roadmap spec
       # Implementation placeholder
       Given {precondition}
       When {action}
       Then {outcome}
   ```

6. **Create step definitions stub** at `tests/planning-stubs/{pattern}.steps.ts`:

   ```typescript
   /**
    * @<prefix>-implements:MyPattern
    *
    * NOTE: In tests/planning-stubs/ (excluded from test runner).
    * Move to tests/steps/ during implementation.
    */

   interface TestState {
     result: unknown;
     error: Error | null;
   }

   let state: TestState;
   // Steps with: throw new Error("Not implemented: description");
   ```

### Handoff Complete When

**Tier 1:**

- [ ] All `@<prefix>-*` tags present
- [ ] `@<prefix>-executable-specs` points to Tier 2
- [ ] Deliverables table complete
- [ ] Status is `roadmap`

**Tier 2:**

- [ ] Directory created with `.feature` files
- [ ] Each file has `@<prefix>-implements`
- [ ] Step definitions stub compiles

**Validation:**

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes

---

## Handoff Documentation

For multi-session work, capture state at session boundaries.

### Handoff Template

```markdown
## Session State

- **Last completed:** Phase 1 - Core types
- **In progress:** Phase 2 - Validation
- **Blockers:** None

### Files Modified

- `src/types.ts` - Added core types
- `src/validate.ts` - Started validation (incomplete)

## Next Session

1. **FIRST:** Complete validation in `src/validate.ts`
2. Add integration tests
3. Update deliverable statuses
```

### Discovery Tags

Capture learnings inline during sessions:

```gherkin
# In feature file comments or code:
# @<prefix>-discovered-gap: Missing-edge-case-for-empty-input
# @<prefix>-discovered-improvement: Cache-parsed-results
# @<prefix>-discovered-learning: Gherkin-requires-strict-indentation
```

See [`tests/features/behavior/session-handoffs.feature`](../tests/features/behavior/session-handoffs.feature) for the full handoff specification.

---

## Quick Reference: FSM Protection

| State       | Protection   | Can Add Deliverables | Needs Unlock |
| ----------- | ------------ | -------------------- | ------------ |
| `roadmap`   | None         | Yes                  | No           |
| `active`    | Scope-locked | No                   | No           |
| `completed` | Hard-locked  | No                   | Yes          |
| `deferred`  | None         | Yes                  | No           |

Valid transitions: See [METHODOLOGY.md#fsm-enforced-workflow](./METHODOLOGY.md#fsm-enforced-workflow)

---

## Related Documentation

| Document                                     | Content                                        |
| -------------------------------------------- | ---------------------------------------------- |
| [METHODOLOGY.md](./METHODOLOGY.md)           | Core thesis, FSM states, two-tier architecture |
| [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | DataTables, DocStrings, Rule blocks            |
| [CONFIGURATION.md](./CONFIGURATION.md)       | Tag prefixes, presets                          |
| [../INSTRUCTIONS.md](../INSTRUCTIONS.md)     | CLI commands, full tag reference               |
