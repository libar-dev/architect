# Session Workflow Guides

> **Reference document for AI sessions and developers working with the delivery process.**

This guide defines workflows for different session types: planning, design, implementation, and combined sessions. Each session type has specific inputs, outputs, and constraints.

---

## Table of Contents

- [Session Type Decision Tree](#session-type-decision-tree)
- [Planning Session](#planning-session)
- [Design Session](#design-session)
- [Implementation Session](#implementation-session)
- [Planning + Design Session](#planning--design-session)
- [Handoff Documentation](#handoff-documentation)

---

## Session Type Decision Tree

Use this decision tree to determine which session type fits your current task:

```
Starting from pattern brief?
├── Yes ──► Need Tier 2 stubs now?
│           ├── Yes ──► Planning + Design Session
│           └── No ──►  Planning Session
└── No ──► Ready to code?
           ├── Yes ──► Complex architecture decisions?
           │           ├── Yes ──► Design Session first
           │           └── No ──►  Implementation Session
           └── No ──►  Need implementation plan? ──► Planning Session
```

### Session Overview

| Session Type | Input | Output | FSM Impact |
|--------------|-------|--------|------------|
| **Planning** | Pattern brief | Roadmap spec (Tier 1) | Creates `roadmap` spec |
| **Design** | Complex requirement | Design document | None |
| **Implementation** | Roadmap spec | Code + tests | `roadmap→active→completed` |
| **Planning + Design** | Pattern brief | Roadmap spec + Tier 2 stubs | Creates `roadmap` spec |
| **Handoff** | Session state | Handoff documentation | None |

---

## Planning Session

**Core concept:** Planning sessions create specs. Implementation sessions create code.

### What You MUST Do

1. **DO** produce a complete roadmap spec in `{specs-directory}/{product-area}/`
2. **DO** convert all pattern brief tables to Gherkin DataTables
3. **DO** convert code examples to DocStrings
4. **DO** create at least one acceptance scenario per Rule
5. **DO** use `@<prefix>-status:roadmap` (not `active`)

### What You MUST NOT Do

1. **DO NOT** create implementation files (`.ts`, `.js`, etc.)
2. **DO NOT** modify existing code
3. **DO NOT** ask "Ready to implement?"
4. **DO NOT** transition the spec to `active` status

### Pattern Brief → Spec Conversion Checklist

#### 1. Extract Metadata

- [ ] Phase number from header
- [ ] Priority → estimate effort (`@<prefix>-effort`)
- [ ] Status → `@<prefix>-status:roadmap`
- [ ] Dependencies from "Depends On" section (`@<prefix>-depends-on`)

#### 2. Structure Feature Description

```gherkin
Feature: My Pattern

  **Problem:** Current pain point in 1-2 sentences.

  **Solution:**
  - Key mechanism 1
  - Key mechanism 2

  **Business Value:**
  | Benefit | How |
  | ...     | ... |
```

#### 3. Build Deliverables Table

- [ ] Extract from "Key Files" section
- [ ] Add implementation locations (best guess for packages)
- [ ] Mark all as `planned` status
- [ ] Identify which need tests (`Yes`/`No`)
- [ ] Identify test type (`unit`/`integration`)

#### 4. Convert Tables to Rules (Mandatory)

- [ ] Each major business constraint → one `Rule:` block
- [ ] Table content becomes DataTable under Rule description
- [ ] At least 2 scenarios per Rule (happy-path + validation)

#### 5. Add Acceptance Scenarios

- [ ] One `@happy-path` scenario per Rule (minimum)
- [ ] One `@validation` scenario for constraints
- [ ] All scenarios tagged `@acceptance-criteria`

#### 6. Set Traceability

- [ ] Add `@<prefix>-executable-specs` tag with target package location
- [ ] Ensure pattern name matches convention

### Handoff Criteria

A planning session is complete when:

- [ ] Spec file created at `{specs-directory}/{product-area}/{pattern-name}.feature`
- [ ] All required `@<prefix>-*` tags present
- [ ] Deliverables table lists all expected outputs with locations
- [ ] Acceptance scenarios cover all major concepts from pattern brief
- [ ] Executable spec location specified in `@<prefix>-executable-specs`
- [ ] Status is `roadmap` (not `active` or `completed`)

---

## Design Session

**Core concept:** Design sessions create architectural decisions. Implementation sessions create code.

### When to Use Design Session

| Use Design Session When... | Skip When... |
|---------------------------|--------------|
| Multiple valid approaches exist | Roadmap spec is straightforward |
| Architectural changes needed | Single obvious implementation path |
| New patterns or capabilities | Bug fix or documentation update |
| Cross-context coordination | Feature with clear requirements |
| Performance-critical decisions | — |

### What You MUST Do

1. **DO** focus on the "WHY" — capture reasoning, trade-offs, alternatives
2. **DO** present at least 2-3 different approaches with pros/cons
3. **DO** reference the roadmap spec this design addresses
4. **DO** create structured output that enables future implementation
5. **DO** create code stubs with interfaces and annotated JSDoc

### What You MUST NOT Do

1. **DO NOT** create an implementation plan with file-by-file changes
2. **DO NOT** ask "Ready to code?" or "Should I implement this?"
3. **DO NOT** transition the roadmap spec to `active` status
4. **DO NOT** create full implementations (stubs only)

### Design Document Sections

| Section | Purpose |
|---------|---------|
| **Problem Statement** | What problem does this design solve? |
| **Related Roadmap Spec** | Link to the `.feature` spec being implemented |
| **Current State Analysis** | Honest assessment of what exists |
| **Strategic Context** | How this fits with architecture/roadmap |
| **Options Considered** | Each option with pros/cons |
| **Recommended Approach** | Which option and WHY |
| **Impact Assessment** | High-level affected areas |
| **Open Questions** | What still needs resolution |

### Code Stubs in Design Sessions

Design sessions create code stubs, not just documentation:

```typescript
/**
 * @<prefix>
 * @<prefix>-infra
 * @<prefix>-uses Workpool, ActionRetrier
 *
 * ## Circuit Breaker - Fault Tolerance for External Dependencies
 *
 * Prevents cascade failures when external services are unavailable.
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  successThreshold: number;
}

export function withCircuitBreaker<T>(
  name: string,
  operation: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  throw new Error("CircuitBreaker not yet implemented - roadmap pattern");
}
```

### Handoff to Implementation

A design session is complete when:

- [ ] Design document created at `{plans-directory}/designs/draft/DESIGN-*.md`
- [ ] Related Roadmap Spec section links to the `.feature` file
- [ ] User approves the recommended approach
- [ ] Code stubs created with interfaces and JSDoc annotations
- [ ] Design moved to `designs/approved/` after approval

---

## Implementation Session

**Core concept:** Implementation sessions create code. The roadmap spec is the source of truth.

### Pre-Requisites

Before starting an implementation session, verify:

1. **Roadmap spec exists** with `@<prefix>-status:roadmap`
2. **Implementation plan exists** (optional for single-session work)
3. **Design document approved** (if complex architecture decisions needed)

### Step 1: Transition to Active

**CRITICAL:** Before writing any code, transition the spec:

```gherkin
# Before:
@<prefix>-status:roadmap

# After:
@<prefix>-status:active
```

**FSM Protection:** `active` = Scope-locked (no new deliverables allowed)

### Step 2: Create Executable Spec Stubs

If the roadmap spec has `@<prefix>-executable-specs`, create package-level stubs:

```bash
# Target from roadmap spec tag
@<prefix>-executable-specs:{package}/tests/features/behavior/{pattern}
```

Use templates and ensure `@<prefix>-implements:{PatternName}` links back.

### Step 3: Execution Loop

For each deliverable in the roadmap spec:

1. **Check for existing code stubs** in the deliverable location
2. **Read** the acceptance criteria and `Rule:` invariants from the spec
3. **Implement** the code (replace `throw new Error` with real logic)
4. **Preserve** `@<prefix>-*` annotations in JSDoc
5. **Write tests** in the executable spec location
6. **Update** the deliverable status in the roadmap spec

```gherkin
# Before:
| ProjectionCategory type | planned | {package}/src/... |

# After:
| ProjectionCategory type | completed | {package}/src/... |
```

### Step 4: Transition to Completed

After all deliverables are done:

```gherkin
# Before:
@<prefix>-status:active

# After:
@<prefix>-status:completed
```

**FSM Protection:** `completed` = Hard-locked (requires `@<prefix>-unlock-reason` to modify)

### Step 5: Regenerate Documentation

```bash
# Regenerate all living docs
npx generate-docs -g patterns,roadmap -i "src/**/*.ts" --features "specs/**/*.feature" -o docs -f
```

### Session Constraints

| MUST DO | MUST NOT DO |
|---------|-------------|
| Transition roadmap spec to `active` BEFORE coding | Add new deliverables to an `active` spec |
| Create executable spec stubs with `@<prefix>-implements` | Transition to `completed` with incomplete work |
| Update deliverable statuses as work progresses | Skip the FSM transitions |
| Transition to `completed` only when ALL done | Modify generated docs directly |

---

## Planning + Design Session

**Core concept:** Planning sessions create specs. Design sessions create stubs. This guide combines both.

Use this workflow when you need to complete ALL spec artifacts before handing off to implementation.

### When to Use This Workflow

| Use This Guide When... | Use Planning Session Instead When... |
|------------------------|-------------------------------------|
| Need executable spec stubs for implementation | Only enhancing roadmap spec |
| Want complete two-tier spec architecture | Don't need Tier 2 stubs yet |
| Preparing for immediate implementation handoff | Still exploring/defining requirements |

### Step 1: Assess Current State

1. Read the existing roadmap spec (if any)
2. Identify gaps compared to reference specs
3. Read the pattern brief for source content

### Step 2: Enhance Tier 1 Roadmap Spec

Follow the Planning Session checklist, plus:

- [ ] Add `@<prefix>-executable-specs` tag pointing to Tier 2 location
- [ ] Deliverables table has `Tests` and `Test Type` columns
- [ ] Benefits table from pattern brief
- [ ] Code examples as DocStrings (`"""typescript ... """`)

### Step 3: Create Code Stubs (Critical)

Code stubs define APIs before implementation:

```typescript
/**
 * @<prefix>
 * @<prefix>-status roadmap
 * @<prefix>-uses EventStoreFoundation, Workpool
 *
 * ## My Pattern - Description
 */
export interface MyResult {
  id: string;
  // ...
}

export function myFunction(args: MyArgs): Promise<MyResult> {
  throw new Error("MyPattern not yet implemented - roadmap pattern");
}
```

### Step 4: Create Tier 2 Directory Structure

```bash
{packages-directory}/{package}/tests/features/behavior/{pattern-name}/
```

### Step 5: Create Tier 2 Feature Stubs

For each Rule in the roadmap spec, create a corresponding `.feature` file:

```gherkin
@<prefix>-implements:{PatternName}
@acceptance-criteria
Feature: {Rule Title}

  As a {role}
  I want {capability}
  So that {benefit}

  Background: {Setup context}
    Given {common setup step - placeholder}

  @happy-path
  Scenario: {Happy path from roadmap spec}
    # Implementation placeholder - stub scenario
    Given {precondition}
    When {action}
    Then {outcome}

  @validation
  Scenario: {Validation case from roadmap spec}
    # Implementation placeholder - stub scenario
    Given {invalid precondition}
    When {action}
    Then {error outcome}
```

### Step 6: Create Step Definitions Stub

**Location:** `{packages-directory}/{package}/tests/planning-stubs/{path}/{pattern}.steps.ts`

> **IMPORTANT:** Planning stubs go to `tests/planning-stubs/` (excluded from test runner).
> During implementation, move to `tests/steps/` and replace `throw` with real logic.

```typescript
/**
 * {Pattern Name} - Step Definitions Stub
 *
 * @<prefix>
 * @<prefix>-implements:{PatternName}
 *
 * NOTE: This file is in tests/planning-stubs/ and excluded from test runner.
 * Move to tests/steps/ during implementation.
 */

// ============================================================================
// Test State
// ============================================================================

interface TestState {
  result: unknown;
  error: Error | null;
}

let state: TestState;

function resetState(): void {
  state = { result: null, error: null };
}

// ============================================================================
// Feature Tests
// ============================================================================

// TODO: Import and configure test framework
// Implement steps with: throw new Error("Not implemented: description");
```

### Handoff Criteria

**Tier 1 Complete:**
- [ ] All required `@<prefix>-*` tags present
- [ ] `@<prefix>-executable-specs` points to Tier 2 location
- [ ] Deliverables table has Tests and Test Type columns
- [ ] At least 2 acceptance scenarios per Rule
- [ ] Code examples in DocStrings
- [ ] Status remains `roadmap`

**Tier 2 Complete:**
- [ ] Directory created with `.feature` files
- [ ] Each file has `@<prefix>-implements` linking to Tier 1
- [ ] Stub scenarios with placeholder comments
- [ ] Step definitions stub compiles without errors

**Validation Complete:**
- [ ] Lint passes
- [ ] TypeScript compiles
- [ ] Documentation regenerates without errors

---

## Handoff Documentation

For work spanning multiple sessions, use structured handoff documentation.

### Handoff Format

```markdown
### Current Session State

- **Last completed:** Phase 1 - Core types
- **In progress:** Phase 2 - Category metadata
- **Blockers:** None
- **Files modified this session:**
  - `src/path/types.ts` - Added core type definitions
  - `src/path/registry.ts` - Added category field

### Next Session TODO

1. **FIRST:** Complete category metadata in defineProjection()
2. Add query routing validation
3. Write integration tests
```

### Multi-Session Implementation

For multi-session work:

1. **Create implementation plan** with clear phases
2. **Update plan after each session** with current state
3. **Resume from plan** — the plan contains all context needed

### Deliverable Status Workflow

```
planned → in-progress → completed
    │          │
    │          ↓
    │      blocked → planned (rescheduled)
    ↓
deferred → planned (resumed)
```

---

## Quick Reference: FSM States

| State | Protection | What's Allowed |
|-------|------------|----------------|
| `roadmap` | None | Full editing |
| `active` | Scope-locked | Implementation only, no new deliverables |
| `completed` | Hard-locked | Requires `@<prefix>-unlock-reason` to modify |
| `deferred` | None | Full editing |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [METHODOLOGY.md](./METHODOLOGY.md) | Core thesis, FSM, two-tier architecture |
| [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | Rich Gherkin patterns for BDD specs |
| [CONFIGURATION.md](./CONFIGURATION.md) | Tag prefixes, presets |
| [../INSTRUCTIONS.md](../INSTRUCTIONS.md) | Complete tag reference, CLI commands |
