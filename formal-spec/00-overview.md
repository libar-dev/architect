# 00 — Overview

> **Architect Spec v0.2.0** — Architecture-Connected Specification Format

---

## What Are Architecture-Connected Specifications?

Traditional specifications describe **behavior** — what a system should do. Architecture-
connected specifications describe behavior AND carry **structured metadata** about how
each piece relates to the larger system: its dependencies, bounded context, architecture
layer, delivery status, business rules, and implementation artifacts.

This metadata transforms specifications from passive documents into active nodes in a
**pattern graph** — a queryable model of the entire system's architecture, derived from
the specifications and annotated code themselves.

```
Traditional spec:
  "The system SHALL issue a JWT token upon successful login."
  → A sentence in a document. No relationships. No status. No traceability.

Architecture-connected spec:
  @architect-pattern:UserAuthentication
  @architect-status:active
  @architect-uses:UserService,TokenService
  @architect-bounded-context:identity
  @architect-arch-layer:domain

  Rule: Successful login produces a JWT token
    **Invariant:** Each successful login produces exactly one JWT.
    **Rationale:** Stateless auth for API consumers. Duplicate tokens create session confusion.
    **Verified by:** Valid login scenario, expired credentials scenario.

  → A node in a pattern graph. Dependencies tracked. Status enforced.
    Business rules machine-extractable. AI agents queryable.
```

## Five Core Concepts

### 1. Pattern

A named, tracked unit of architecture with metadata, relationships, and lifecycle state.

Patterns are the atoms of the architecture. Every feature, service, component, decision,
or capability is a pattern. Each pattern has an identity (`@architect-pattern:Name`), a
delivery status (`@architect-status`), relationships to other patterns (`@architect-uses`),
and business rules (extracted from `Rule:` blocks).

Patterns are expressed in two native code formats:

- **Gherkin** — `.feature` files with `@architect-*` tags define behavior, rules, and delivery state
- **TypeScript** — `.ts` files with `@architect-*` JSDoc tags define runtime structure and relationships

### 2. Pattern Graph

The live, queryable model of all patterns and their relationships, computed from annotated code.

The pattern graph is a **projection** of annotated source files — not a separate artifact
maintained by hand. It contains every pattern's identity, status, dependencies, business
rules, deliverables, and architecture position. It is recomputed on every source change
and queryable via CLI, MCP server, or programmatic API.

Pre-computed views enable O(1) lookups: patterns by status, by phase, by bounded context,
by architecture layer, by source type.

### 3. Spec Evolution

The intentional maturation of specifications from candidates through design to executable tests.

Specifications pass through two tracks: **refinement** (candidate specs being explored) and
**delivery** (accepted specs being designed and implemented). Design-level specs and stubs
are **ephemeral** — during implementation, they are deleted as their value transfers to
executable specs and production code. The executable spec is the permanent artifact.

```
Candidate (Gherkin)  →  Plan-level (Gherkin)  →  Design-level (Gherkin)  →  DELETED
  ↑ idea refinement       ↑ accepted feature       ↑ + stubs created          ↓ value transfers to:
  lightweight rules       4-6 rules                6-9 rules
  open questions          9-15 scenarios            20-40 scenarios       Executable spec + step defs
                                                                          (permanent living tests)
```

### 4. Delivery Process

The FSM-governed lifecycle that governs how patterns move from idea to completion.

The delivery process is machine-checked infrastructure, not a wiki page. Five status
values across two tracks — `candidate` (refinement) and `roadmap → active → completed`
with `deferred` as an escape hatch (delivery) — and ProcessGuard rules keep
consequential changes visible without forcing status lies. Active-scope expansion warns,
completed work can reopen to `roadmap` or `active`, and `@architect-unlock-reason`
records intent and suppresses the advisory warning rather than acting as a hard gate.

### 5. Projection

Any read-optimized view computed from the source of truth (annotated code + specs).

Generated documentation, CLI query responses, MCP tool responses, AI context bundles,
and desktop UI views are all projections of the same source. Projections are never maintained
separately — they are always computed, always current, always consistent. This is the same
principle as CQRS read models in domain-driven design.

## Component Map

```
                     ANNOTATED CODE + GHERKIN SPECS
                      (single source of truth)
                               │
                ┌──────────────┼──────────────┐
                │              │              │
           TypeScript      Gherkin         Git
          annotations       specs        history
           (@architect-*)  (@architect-*)
                │              │              │
                └──────────────┼──────────────┘
                               │
                        PATTERN GRAPH
                    (computed projection)
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         DELIVERY         PROJECTIONS       AI CONTEXT
         PROCESS          (docs, UI)        (MCP, bundles)
       (enforcement)
```

## The Architectural Connection

What distinguishes this format from other specification approaches (OpenSpec, Spec Kit, Kiro)
is the **architectural connection** — five layers that link specifications to the living
codebase:

| Layer | Connection              | What It Enables                                                             |
| ----- | ----------------------- | --------------------------------------------------------------------------- |
| **1** | Code ↔ Spec             | Bidirectional traceability between source files and specifications          |
| **2** | Spec ↔ Spec             | Dependency graph across all specifications (blocking chains, neighborhoods) |
| **3** | Spec ↔ Delivery State   | FSM-enforced lifecycle with scope-creep prevention                          |
| **4** | Spec ↔ Business Rules   | Machine-extracted invariants with rationale and verification mapping        |
| **5** | Everything ↔ AI Context | Session-aware context bundles for AI agents                                 |

No other specification format provides all five layers.

## Quick Start: A Minimal Valid Spec

A Level 1 conformant spec requires only the `@architect` gate tag and valid Gherkin:

```gherkin
@architect
@architect-pattern:UserRegistration
@architect-status:roadmap
Feature: UserRegistration - New user account creation

  Rule: Duplicate emails are rejected

    @acceptance-criteria @happy-path
    Scenario: Successful registration with new email
      Given a user with email "new@example.com"
      When they submit the registration form
      Then an account is created

    @acceptance-criteria @edge-case
    Scenario: Registration with existing email is rejected
      Given a user with email "existing@example.com" already exists
      When another user tries to register with "existing@example.com"
      Then the registration is rejected with a duplicate email error
```

This is valid Gherkin, parseable by any Gherkin parser. The `@architect-*` tags add
architecture metadata that the Architect toolchain (or any conforming parser) can extract.

For the full format with deliverables, invariants, and all metadata tags, see
[05 — Feature Spec Format](05-feature-spec-format.md) and
[Appendix A — Examples](appendix-a-examples.md).

## Terminology

| Term                  | Definition                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| **Pattern**           | A named unit of architecture (feature, service, component, decision) with metadata and lifecycle       |
| **Pattern graph**     | The complete, queryable model of all patterns and relationships, computed from code                    |
| **Tag**               | An `@architect-*` metadata annotation on a Gherkin feature or TypeScript JSDoc comment                 |
| **Gate tag**          | The `@architect` tag that opts a file into extraction                                                  |
| **Rule**              | A Gherkin `Rule:` block with structured Invariant/Rationale/Verified-by metadata                       |
| **Invariant**         | A constraint that must always hold, expressed in a Rule block                                          |
| **Deliverable**       | A concrete implementation artifact (file) tracked in the spec's Background table                       |
| **Stub**              | A TypeScript file in `architect/stubs/` containing interfaces and type definitions as design artifacts |
| **ADR**               | Architecture Decision Record — a decision captured in Gherkin format                                   |
| **Projection**        | A read-optimized view generated from the pattern graph (docs, UI, AI context)                          |
| **ProcessGuard**      | The enforcement engine that validates FSM transitions and prevents scope creep                         |
| **Spec evolution**    | The maturation of a `.feature` file from plan-level through design-level to executable                 |
| **Conformance level** | One of three tiers (Minimal, Standard, Full) indicating how much of this spec is implemented           |
