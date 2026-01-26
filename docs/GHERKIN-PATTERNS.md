# Gherkin Patterns Guide

> **Rich Gherkin usage patterns for BDD specs in the delivery process.**

This guide describes patterns for writing effective Gherkin feature files that work well with generators and provide clear documentation.

---

## Table of Contents

- [Rule Description Structure](#rule-description-structure)
- [When to Use Each Element](#when-to-use-each-element)
- [DataTable Patterns](#datatable-patterns)
- [DocString Patterns](#docstring-patterns)
- [Scenario Organization](#scenario-organization)
- [Test Type Identification](#test-type-identification)

---

## Rule Description Structure

Every feature spec MUST use `Rule:` blocks to organize business constraints. Rules are extracted by generators to create business rules documentation.

### Required Structure

```gherkin
Rule: Reservations prevent race conditions

  **Invariant:** Only one reservation can claim available inventory at a time.

  **Rationale:** Without atomic claim, concurrent requests create ghost reservations
  that fail at fulfillment time, causing poor UX and support tickets.

  | Scenario | Without Pattern | With Pattern |
  | Concurrent claims | Last-write-wins, overselling | Atomic OCC, deterministic |
  | Timeout handling | Manual cleanup | Auto-expiry |

  **Verified by:** Concurrent reservations, Expired reservation cleanup

  @acceptance-criteria @happy-path
  Scenario: Concurrent reservations resolve deterministically
    ...
```

### Rule Description Elements

| Element | Required | Purpose | Extracted By |
|---------|----------|---------|--------------|
| `**Invariant:**` | Recommended | The business constraint being enforced | Business Rules generator |
| `**Rationale:**` | Recommended | Why this rule exists (business justification) | Business Rules generator |
| Tables | Optional | Comparison, examples, or reference data | Requirements generator |
| Code DocStrings | Optional | API examples with `"""typescript` | Requirements generator |
| `**Verified by:**` | Recommended | Comma-separated scenario names | Traceability generator |

### Minimum Rule Requirements

- At least 2 scenarios per Rule (happy-path + validation)
- Each scenario tagged with `@acceptance-criteria`
- Happy-path scenarios tagged `@happy-path`
- Validation scenarios tagged `@validation`

---

## When to Use Each Element

| Element | Use For | Example |
|---------|---------|---------|
| **Rule:** | Group related scenarios under a business concept | `Rule: Each projection must declare a category` |
| **DataTable in Background** | Structured reference data (deliverables, definitions) | Deliverables table |
| **DataTable in Description** | Guidelines, comparison tables | Category guidelines |
| **Scenario Outline + Examples** | Same pattern with variations | Category-based validation |
| **DocString** | Code examples, multi-line content | TypeScript before/after snippets |
| **Comments (#)** | Section dividers, rationale | `# RULE 1: Category Definitions` |

### Decision Tree: Which Element?

```
Is it a business constraint?
├── Yes ──► Rule: block with Invariant/Rationale
│           └── Has variations? ──► Scenario Outline
└── No ──► Is it reference data?
           ├── Yes ──► DataTable (Background or Description)
           └── No ──► Is it a code example?
                      ├── Yes ──► DocString ("""typescript)
                      └── No ──► Prose in Feature description
```

---

## DataTable Patterns

### Background DataTable (Reference Data)

Use for data that applies to all scenarios:

```gherkin
Background: Category Definitions
  Given the following projection categories:
    | Category    | Purpose                          | Query Pattern  | Example            |
    | Logic       | Minimal data for command validation | Internal only | orderExists(id)    |
    | View        | Denormalized for UI queries      | Client queries | orderSummaries     |
    | Reporting   | Aggregated analytics             | Scheduled      | dailySalesReport   |
    | Integration | External system sync             | Event-driven   | shippingSync       |
```

### Description DataTable (Guidelines)

Use for comparison or guideline tables in the Feature description:

```gherkin
Feature: Projection Categories

  **Category Guidelines:**
  | Category    | Client Exposed | Requires Auth | Typical Size |
  | Logic       | No             | N/A           | Minimal      |
  | View        | Yes            | Per query     | Medium       |
  | Reporting   | Dashboard only | Admin         | Large        |
  | Integration | No             | Service-to-service | Variable |
```

### Scenario DataTable (Test Data)

Use for scenario-specific test inputs:

```gherkin
Scenario: Validate multiple items
  Given the following order items:
    | product_id | quantity | unit_price |
    | SKU-001    | 2        | 29.99      |
    | SKU-002    | 1        | 49.99      |
  When I calculate the total
  Then the total should be 109.97
```

### DataTable Best Practices

| Do | Don't |
|----|-------|
| Use headers that match domain language | Use generic column names |
| Keep tables readable (4-6 columns max) | Create wide tables that scroll |
| Include all required columns | Rely on implicit defaults |
| Use consistent formats | Mix formats (dates, numbers) |

---

## DocString Patterns

### Code Example DocString

Use for showing API usage or code transformations:

```gherkin
Rule: Projections must declare explicit category

  """typescript
  // Current: No category metadata
  defineProjection({
    name: 'orderSummaries',
    subscribes: ['OrderCreated'],
    handler: async (ctx, event) => { ... }
  });

  // Target: Category is explicit
  defineProjection({
    name: 'orderSummaries',
    category: 'view',              // <-- NEW: Required category
    subscribes: ['OrderCreated'],
    handler: async (ctx, event) => { ... }
  });
  """
```

### Configuration DocString

Use for showing configuration examples:

```gherkin
Scenario: Configure circuit breaker
  Given the following configuration:
    """json
    {
      "failureThreshold": 5,
      "timeout": 30000,
      "successThreshold": 2
    }
    """
  When I create a circuit breaker with this config
  Then the breaker should use the specified values
```

### Multi-line Content DocString

Use for content with pipes or special characters:

```gherkin
Scenario: Generate markdown table
  When I generate the report
  Then the output contains:
    """
    | Pattern | Status    | Phase |
    |---------|-----------|-------|
    | MyPattern | completed | 15    |
    """
```

### DocString Best Practices

| Do | Don't |
|----|-------|
| Use language hints (`"""typescript`) | Leave DocStrings untyped |
| Label "Current" vs "Target" states | Assume context is obvious |
| Keep examples focused and minimal | Include full implementation |
| Use for content with pipes/special chars | Escape pipes in regular text |

---

## Scenario Organization

### Tag Conventions

| Tag | Purpose | When to Use |
|-----|---------|-------------|
| `@acceptance-criteria` | Marks as acceptance test | All acceptance scenarios |
| `@happy-path` | Successful flow | Primary success scenarios |
| `@validation` | Error/edge case | Input validation, constraints |
| `@integration` | Requires infrastructure | Database, network, etc. |
| `@unit` | Pure function test | No I/O, pure logic |

### Section Comments

Use comments to organize large feature files:

```gherkin
Feature: Order Management

  # ============================================================================
  # RULE 1: Order Creation
  # ============================================================================

  Rule: Orders must have valid customer
    ...

  # ============================================================================
  # RULE 2: Order Submission
  # ============================================================================

  Rule: Only draft orders can be submitted
    ...
```

### Scenario Outline for Variations

Use when the same pattern applies with different inputs:

```gherkin
@acceptance-criteria
Scenario Outline: Category determines client exposure
  Given a projection with category "<category>"
  When checking client exposure
  Then client accessible should be <exposed>

  Examples:
    | category    | exposed |
    | logic       | false   |
    | view        | true    |
    | reporting   | false   |
    | integration | false   |
```

### Minimum Scenario Requirements

Per Rule block:
- [ ] At least 1 `@happy-path` scenario
- [ ] At least 1 `@validation` scenario
- [ ] All scenarios tagged `@acceptance-criteria`
- [ ] Scenarios named to match `**Verified by:**` list

---

## Test Type Identification

When filling out deliverables tables, identify the appropriate test type:

### Test Type Definitions

| Test Type | Infrastructure | When to Use |
|-----------|----------------|-------------|
| `unit` | Test framework only | Pure functions, type guards, utilities |
| `integration` | Test framework + database/services | Database operations, mutations/queries |
| `e2e` | Full application stack | User workflows, UI interactions |
| No tests | N/A | Types, interfaces (compile-time only) |

### Test Type by Deliverable

| Deliverable Type | Test Type | Reason |
|------------------|-----------|--------|
| Type definitions | No tests | Types are compile-time only |
| Pure validation functions | unit | No I/O, pure logic |
| Projection handlers | integration | Requires database context |
| Decider functions | unit | Pure functions by design |
| Command bus operations | integration | Requires database |
| API endpoints | integration | Requires request context |
| User workflows | e2e | Requires full stack |

### Decision Tree: Test Type

```
Does it have side effects (I/O)?
├── No ──► unit test
└── Yes ──► Does it need database?
           ├── No ──► Does it call external APIs?
           │         ├── Yes ──► integration (mocked)
           │         └── No ──► unit (with stubs)
           └── Yes ──► Does it need full app stack?
                      ├── Yes ──► e2e
                      └── No ──► integration
```

---

## Generator Content Mapping

Feature file elements are extracted by generators:

| Feature File Element | Extracted To |
|---------------------|--------------|
| Feature description (Problem/Solution/Value) | Requirements doc |
| `Rule:` name | Business Rules heading |
| `**Invariant:**` in Rule | Business Rules constraint |
| `**Rationale:**` in Rule | Business Rules justification |
| `**Verified by:**` in Rule | Traceability matrix |
| Tables in Rule description | Both Requirements and Business Rules |
| DocStrings (`"""typescript`) | Code examples in Requirements |
| Scenarios with `@acceptance-criteria` | Acceptance Criteria section |

---

## Complete Example

```gherkin
@<prefix>
@<prefix>-pattern:ProjectionCategories
@<prefix>-status:roadmap
@<prefix>-phase:15
@<prefix>-executable-specs:{package}/tests/features/behavior/projection-categories
Feature: Projection Categories

  **Problem:** Projections lack semantic classification, making it unclear
  which are safe for client exposure vs internal-only.

  **Solution:** Require explicit category declaration with validation.

  **Business Value:**
  | Benefit | How |
  | Security | Clear client exposure rules |
  | Clarity | Obvious purpose per projection |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status  | Location | Tests | Test Type |
      | Category types | planned | src/projections/types.ts | Yes | unit |
      | Validation | planned | src/projections/validate.ts | Yes | unit |

  # ============================================================================
  # RULE 1: Category Declaration
  # ============================================================================

  Rule: Every projection must declare a category

    **Invariant:** A projection without explicit category cannot be registered.

    **Rationale:** Implicit "view" assumptions leak internal data to clients.

    **Verified by:** Projection without category fails, Projection with category succeeds

    @acceptance-criteria @validation
    Scenario: Projection without category fails
      Given a projection definition without category
      When I attempt to register the projection
      Then registration should fail with "Category required"

    @acceptance-criteria @happy-path
    Scenario: Projection with category succeeds
      Given a projection definition with category "view"
      When I register the projection
      Then registration should succeed

  # ============================================================================
  # RULE 2: Client Exposure
  # ============================================================================

  Rule: Category determines client exposure

    **Invariant:** Only "view" category projections are exposed to clients.

    **Rationale:** Logic, reporting, and integration projections contain
    internal data that should not be accessible from client code.

    **Verified by:** View projections are client-accessible, Non-view projections are internal

    @acceptance-criteria @happy-path
    Scenario: View projections are client-accessible
      Given a projection with category "view"
      When checking client exposure
      Then the projection should be client-accessible

    @acceptance-criteria @validation
    Scenario Outline: Non-view projections are internal
      Given a projection with category "<category>"
      When checking client exposure
      Then the projection should NOT be client-accessible

      Examples:
        | category    |
        | logic       |
        | reporting   |
        | integration |
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [METHODOLOGY.md](./METHODOLOGY.md) | Core thesis, FSM, two-tier architecture |
| [SESSION-GUIDES.md](./SESSION-GUIDES.md) | Session workflows |
| [../INSTRUCTIONS.md](../INSTRUCTIONS.md) | Complete tag reference |
