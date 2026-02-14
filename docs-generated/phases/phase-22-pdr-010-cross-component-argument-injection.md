# PDR010CrossComponentArgumentInjection

**Purpose:** Detailed patterns for PDR010CrossComponentArgumentInjection

---

## Summary

**Progress:** [████████████████████] 2/2 (100%)

| Status | Count |
| --- | --- |
| ✅ Completed | 2 |
| 🚧 Active | 0 |
| 📋 Planned | 0 |
| **Total** | 2 |

---

## ✅ Completed Patterns

### ✅ PDR 009 Design Session Methodology

| Property | Value |
| --- | --- |
| Status | completed |
| Quarter | Q1-2026 |

#### Acceptance Criteria

**Design session produces decision specs not documents**

- Given a design session for a new bounded context component
- When architectural decisions are made during the session
- Then each lasting decision is recorded as a PDR in delivery-process/decisions/
- And no markdown design documents are created in docs/

**Design session produces code stubs**

- Given a design session that defines API contracts
- When handler signatures and schemas are specified
- Then code stubs are created in delivery-process/stubs/{pattern-name}/
- And each stub has @libar-docs-implements linking to the parent pattern
- And the real destination is indicated by "Target:" plain text in the JSDoc

**Stub file has target annotation**

- Given a code stub in delivery-process/stubs/agent-component-isolation/
- When reviewing the stub file
- Then @libar-docs-* tags appear first in the JSDoc block
- And it contains @libar-docs-implements linking to the parent pattern
- And the real destination is indicated by "Target:" plain text

**Stubs use pattern-based folder naming**

- Given a design session for agent handler architecture
- When creating stubs
- Then the folder is named "agent-handler-architecture" not "ds-2-handler-architecture"

**Design-session decision uses design category**

- Given a PDR recording an API shape decision from a design session
- When creating the decision record
- Then it uses @libar-docs-adr-category:design

#### Business Rules

**Context - Design sessions needed structured outputs beyond plan-level specs**

Plan-level specs (Gherkin feature files) capture WHAT to build: rules, acceptance criteria,
    deliverables. But design sessions also need to produce HOW decisions and interface contracts
    that bridge planning to implementation.

    Without a defined methodology:
    - Design documents (markdown) were created that duplicated spec content
    - Code stubs placed in real source folders broke compilation (missing _generated/server)
    - No clear pattern for where design-time artifacts live vs implementation artifacts
    - Architectural decisions scattered across prose documents without structured traceability

**Decision - Design sessions produce decision specs and code stubs**

Design sessions produce two types of outputs:

    | Output | Format | Location | Purpose |
    | Decision specs | Gherkin .feature | delivery-process/decisions/ | Architectural decisions with lasting value |
    | Code stubs | TypeScript .ts | delivery-process/stubs/{pattern-name}/ | Interface contracts, schemas, handler signatures |

    Design sessions do NOT produce:
    | Avoided Output | Why |
    | Design documents (markdown) | Decision specs provide better traceability with structured tags |
    | Implementation code | Design defines contracts; implementation is a separate session |

_Verified by: Design session produces decision specs not documents, Design session produces code stubs_

**Decision - Stubs live outside compilation in delivery-process/stubs/**

Code stubs created during design sessions would break compilation and linting if
    placed in real source folders:

    | Problem | Example |
    | Missing _generated/server | Convex component handler stubs import from generated code |
    | Unused variables | Handler args in stub bodies trigger eslint |
    | Progressive compilation | Cannot selectively enable parts of stub files |

    Solution: All stubs live in delivery-process/stubs/{pattern-name}/ which is outside
    all package tsconfig and eslint scopes. Zero configuration changes needed.

    Stub rules:
    | Rule | Description |
    | @libar-docs-implements | Each stub uses @libar-docs-implements to link to the parent pattern |
    | Target: annotation | Each stub has a "Target:" plain text line indicating its real destination path |
    | @libar-docs-* tags first | All @libar-docs-* tags MUST appear first in the JSDoc block |
    | Pattern-based naming | Folder names use the pattern/feature name, not session numbers |
    | Implementation moves stubs | During implementation, stubs move from stubs/ to Target: locations |
    | Step definition stubs | Use existing tests/planning-stubs/ pattern (already excluded from test runner) |

    Naming convention: delivery-process/stubs/{pattern-name-kebab-case}/

    | Correct | Incorrect |
    | agent-component-isolation/ | ds-1-component-isolation/ |
    | agent-handler-architecture/ | ds-2-handler-architecture/ |
    | agent-llm-integration/ | ds-3-llm-integration/ |

    Session numbers (ds-1, ds-2) are ephemeral internal designations. Pattern names
    are stable and meaningful beyond the current planning cycle.

_Verified by: Stub file has target annotation, Stubs use pattern-based folder naming_

**Decision - Add design category for decision records**

The existing @libar-docs-adr-category values (process, architecture) do not cover
    design-session scoped decisions about API shapes, schema strategies, and interface
    contracts that are specific to a feature but have lasting reference value.

    Updated category taxonomy:

    | Category | Scope | Examples |
    | process | Delivery methodology | Spec structure, FSM rules, tooling |
    | architecture | System-level technical | Data flow, component boundaries, protocols |
    | design | Design-session scoped | API shape, handler patterns, schema decisions |

    Additional categories (testing, integration) may be added when needed by future
    design sessions.

    Note: ADR/PDR numbering unification is deferred until after the Agent-as-BC
    design sessions complete. New decisions continue from PDR-009+ with appropriate
    category tags.

_Verified by: Design-session decision uses design category_

**Consequences - Clean separation of design-time and implementation artifacts**

Positive outcomes:
    - Stubs never break compilation or linting
    - Zero tsconfig/eslint configuration changes for design sessions
    - Decision specs provide structured traceability with tags
    - Pattern-based naming is stable across planning cycles
    - @libar-docs-implements + Target: annotations create clear link from design to implementation

    Negative outcomes:
    - Stubs are not type-checked until implementation moves them to target locations
    - Additional step needed during implementation to move stubs
    - Design category adds a third taxonomy value to track

---

### ✅ PDR 010 Cross Component Argument Injection

| Property | Value |
| --- | --- |
| Status | completed |
| Quarter | Q1-2026 |

#### Dependencies

- Depends on: AgentBCComponentIsolation

#### Acceptance Criteria

**Agent handler receives projection data as argument**

- Given the agent component needs customer cancellation history
- And the customerCancellations projection lives at the app level
- When the app-level subscription handler triggers the agent
- Then it pre-loads cancellation data from the projection
- And passes it as an argument to the agent component handler
- And the agent handler does not query any app-level tables

**Missing external data is handled gracefully**

- Given a new customer with no cancellation history in the projection
- When the agent handler receives an event for this customer
- Then the injected customerHistory field is undefined
- And the handler proceeds with available data
- And no error is thrown

**InjectedData interface is extensible**

- Given the agent component currently only needs cancellation history
- When a future pattern requires order frequency data
- Then a new optional field is added to AgentEventHandlerInjectedData
- And existing handlers continue to work without changes

#### Business Rules

**Context - Components cannot query outside their isolated database**

Convex components have isolated databases. A component's handlers can only access
    tables defined in that component's schema. This is by design — it enforces bounded
    context isolation at the infrastructure level.

    When a component needs data from outside its boundary (e.g., an app-level projection
    or another component's data), it cannot query that data directly:

    | Constraint | Implication |
    | Isolated databases | Component handlers cannot ctx.db.query app-level tables |
    | No cross-component joins | Cannot combine component data with app data in a single query |
    | API boundary only | All cross-component data access goes through handler arguments or return values |

    This creates a challenge: How does a component receive data it needs from outside
    its boundary without violating isolation?

    Alternatives considered:

    | Option | Pros | Cons |
    | A: Argument injection (chosen) | Caller controls data loading; component stays pure; no coupling | Caller must know what data to load; additional handler args |
    | B: Callback pattern | Component requests data via callback | Complex; breaks transactional guarantees; component aware of external schema |
    | C: Duplicate data into component | Fast reads; no cross-boundary queries | Redundant storage; consistency risk; event subscription needed |
    | D: Shared database layer | Simplest queries | Violates BC isolation; defeats purpose of components |

**Decision - Caller pre-loads external data and passes as handler arguments**

When a component handler needs data from outside its boundary, the app-level caller
    loads that data and passes it as an argument to the handler.

    The pattern:

    | Step | Actor | Action |
    | 1 | App-level code | Queries app-level projection or other component |
    | 2 | App-level code | Shapes data into typed container |
    | 3 | App-level code | Passes container as argument to component handler |
    | 4 | Component handler | Receives pre-loaded data; processes without external queries |

    Type contract: Each component defines an InjectedData interface that declares
    what external data its handlers may receive. All fields are optional (data may
    not be available for all invocations).

    This keeps the component "pure" — it processes data it receives without
    knowledge of where that data came from or how it was loaded.

_Verified by: Agent handler receives projection data as argument, Missing external data is handled gracefully, InjectedData interface is extensible_

**Consequences - Clean isolation at the cost of caller complexity**

Positive outcomes:
    - Component remains truly isolated — no knowledge of external schema
    - Caller has full control over data loading (can optimize, cache, batch)
    - Typed InjectedData interface provides compile-time safety
    - Pattern is testable — inject mock data in tests without projections
    - Applicable to any BC component, not just Agent

    Negative outcomes:
    - Caller must know what data the component needs (coupling at orchestration layer)
    - Additional argument overhead on handler signatures
    - If component needs different external data for different operations,
      the InjectedData container may grow large

---

[← Back to Roadmap](../ROADMAP.md)
