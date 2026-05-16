# 05 — Feature Spec Format

> **Architect Spec v0.1.0** — The Gherkin structure conventions for feature specifications.

---

## Overview

Feature specs are the primary artifact type in the Architect Spec. They combine standard
Gherkin syntax (Features, Rules, Scenarios) with structured metadata (tags, deliverables,
invariants) to create architecture-connected behavioral specifications.

This document defines the normative structure. For complete annotated examples, see
[Appendix A](appendix-a-examples.md).

## Document Structure

A feature spec file has this structure, from top to bottom:

```
1. Tag header block          (§03, §04)
2. Feature title             (this document)
3. Feature description       (this document)
4. Background: Deliverables  (this document)
5. Rule blocks               (this document, repeated)
   a. Rule title
   b. Rule metadata (Invariant / Rationale / Verified by)
   c. Scenarios (repeated)
```

## 1. Tag Header Block

The tag header block appears before the `Feature:` keyword. Tags follow the ordering
convention defined in §03.

**Level 1 minimum (candidate):**

```gherkin
@architect
@architect-pattern:UserRegistration
@architect-status:candidate
```

**Level 1 minimum (accepted):**

```gherkin
@architect
@architect-pattern:UserRegistration
@architect-status:roadmap
```

**Level 2 full set:**

```gherkin
@architect
@architect-pattern:UserRegistration
@architect-status:roadmap
@architect-phase:2
@architect-product-area:Desktop
@architect-effort:5d
@architect-priority:high
@architect-depends-on:UserService,EmailService
@architect-see-also:UserProfile
@architect-business-value:enable-self-service-onboarding
@architect-bounded-context:identity
@architect-arch-layer:domain
@architect-release:vNEXT
```

## 2. Feature Title

The feature title MUST follow this format:

```gherkin
Feature: PatternName - Human Readable Description
```

- The pattern name (PascalCase) MUST match the `@architect-pattern` tag value
- A space-dash-space (`-`) separates the pattern name from the description
- The description SHOULD be concise (under 80 characters)

**Examples:**

```gherkin
Feature: UserRegistration - New user account creation
Feature: McpServerIntegration - MCP server lifecycle and tool dispatch
Feature: ArchitectureDashboard - Project health overview with live data
```

## 3. Feature Description

The feature description appears as indented prose immediately after the `Feature:` line.
The description sections differ between plan-level and design-level specs.

### Plan-Level Description

Plan-level specs use `**Business Value:**` and `**How It Works:**`:

```gherkin
Feature: UserRegistration - New user account creation

  **Business Value:** Self-service registration eliminates manual onboarding,
  reducing time-to-value from days to minutes. Each registered user represents
  a potential $49/seat conversion in the adoption funnel.

  **How It Works:** The registration form collects email and password, validates
  against existing accounts via the UserService, sends a verification email via
  EmailService, and creates a pending account record. Unverified accounts expire
  after 24 hours.
```

**Requirements:**

- `**Business Value:**` — MUST be present. 2-4 sentences connecting the feature to
  the product's value proposition.
- `**How It Works:**` — MUST be present. 2-4 sentences describing the concrete mechanism.

### Design-Level Description

Design-level specs use `**Problem:**` and `**Solution:**`:

```gherkin
Feature: McpServerIntegration - MCP server lifecycle and tool dispatch

  **Problem:** The desktop app needs to query the PatternGraphAPI for live
  architecture data, but the API runs as a Node.js module that must be
  initialized with project configuration, watched for file changes, and
  gracefully shut down.

  **Solution:**
  1. **Initialization** — On project connection, the main process loads
     `architect.config.ts` and calls `buildPatternGraph()`.
  2. **Query dispatch** — Renderer process sends typed IPC requests that
     the main process routes to PatternGraphAPI methods.
  3. **File watching** — A file watcher triggers automatic rebuilds when
     annotated files change.
  4. **Shutdown** — On app close, the watcher is disposed and resources freed.
```

**Requirements:**

- `**Problem:**` — MUST be present. 1-5 paragraphs describing the problem being solved.
- `**Solution:**` — MUST be present. May use numbered lists, sub-headings, or prose.

### Business Value Tables (Optional)

Both levels MAY include structured tables in the description:

```gherkin
  **Why It Matters:**
  | Benefit | Impact |
  | Faster onboarding | Minutes instead of days |
  | Self-service | No admin intervention needed |
```

## 4. Background: Deliverables

The deliverables table links the specification to concrete implementation artifacts.
Every Level 2+ feature spec MUST contain this section.

> _Informative:_ The deliverables table is a **planning artifact**. It is dropped during
> the value transfer to executable specs (§08) because the implementation files ARE the
> deliverables — tracking them in a table would be redundant once they exist as real files.
> Executable specs in `tests/features/` do NOT carry a deliverables table.

### Standard Format (5 Columns)

```gherkin
  Background: Deliverables
    Given the following deliverables:
      | Deliverable           | Status      | Location                                    | Tests | Test Type |
      | RegistrationForm      | pending     | apps/desktop/src/views/RegistrationForm.tsx  | Yes   | unit      |
      | useRegistration       | pending     | apps/desktop/src/lib/use-registration.ts     | Yes   | unit      |
      | registration-service  | pending     | apps/desktop/src/lib/registration-service.ts | Yes   | unit      |
      | registration types    | pending     | apps/desktop/src/lib/types.ts                | No    | n/a       |
```

### Column Definitions

| Column        | Required | Values                               | Description                              |
| ------------- | -------- | ------------------------------------ | ---------------------------------------- |
| `Deliverable` | MUST     | Free text                            | Name of the implementation artifact      |
| `Status`      | MUST     | `pending`, `in-progress`, `complete` | Current delivery status                  |
| `Location`    | MUST     | File path                            | Concrete path to the implementation file |
| `Tests`       | MUST     | `Yes`, `No`                          | Whether tests are required               |
| `Test Type`   | MUST     | `unit`, `integration`, `e2e`, `n/a`  | Type of test coverage                    |

### Deliverable Rules

- Every deliverable MUST name a specific file with a concrete path
- Paths SHOULD follow project conventions (e.g., React components in `views/`, hooks in `lib/`)
- Status values MUST use the exact vocabulary: `pending`, `in-progress`, `complete`
- All new specs MUST have all deliverables in `pending` status
- `Tests: No` is valid for type definition files and configuration

> _Informative:_ Level 1 conformance MAY use a simplified 3-column table
> (`Deliverable | Status | Location`) without the Tests and Test Type columns.
> Level 2+ MUST use the full 5-column format.

## 5. Section Separators

Design-level specs SHOULD use comment-style section separators between rule groups
for readability:

```gherkin
  # ===========================================================================
  # RULE 1: User Registration
  # ===========================================================================
```

These separators are informative comments — they are not parsed by the toolchain.
Plan-level specs typically omit separators due to their shorter length.

## 6. Rule Blocks

Rules are the core structural unit of a feature spec. Each `Rule:` block describes one
user-facing capability or system constraint.

### Rule Title

```gherkin
  Rule: Human-readable capability or constraint description
```

- Rule titles SHOULD be written as declarative statements
- Rule titles SHOULD NOT include numbering (use section separators for visual ordering)
- ADR rules SHOULD use the `Decision:` prefix: `Rule: Decision: features map to lifecycle stages`

### Rule Metadata

Every Level 2+ rule MUST contain these three metadata blocks:

```gherkin
  Rule: Duplicate emails are rejected

    **Invariant:** Each email address maps to exactly one user account.
    **Rationale:** Prevents identity confusion across the platform. Duplicate
    accounts would break audit trails and permission boundaries.
    **Verified by:** Registration with existing email, case-insensitive check.
```

| Block              | Required | Description                                                     |
| ------------------ | -------- | --------------------------------------------------------------- |
| `**Invariant:**`   | MUST     | A single sentence stating the non-negotiable constraint         |
| `**Rationale:**`   | MUST     | 1-3 sentences explaining WHY — what breaks if violated          |
| `**Verified by:**` | MUST     | Comma-separated list of scenario names that prove the invariant |

### Design-Level Rule Additions

Design-level specs MAY add `**Input:**` and `**Output:**` declarations after the
standard metadata:

```gherkin
  Rule: Successful login produces a JWT token

    **Invariant:** Each successful login produces exactly one JWT.
    **Rationale:** Stateless auth for API consumers.
    **Input:** LoginRequest -- email: string, password: string
    **Output:** LoginResult -- token: JWT, expiresAt: DateTime
    **Verified by:** Valid login, expired credentials, revoked tokens.
```

Design-level specs MAY also include:

- `**Algorithm:**` — numbered implementation steps
- `**Assembly steps:**` — ordered processing steps
- Behavior matrices as Gherkin data tables

### Rule Count Guidelines

| Spec Level   | Rules per Spec | Rationale                                    |
| ------------ | -------------- | -------------------------------------------- |
| Plan-level   | 4-6            | Key capabilities and constraints             |
| Design-level | 6-9            | Exhaustive coverage including error handling |

- Rules SHOULD be independent — removing one should not break others
- At least one rule SHOULD cover error, loading, or disconnected states
- Each rule SHOULD have 2-3 scenarios verifying it

## 7. Scenarios

Scenarios are the concrete acceptance criteria within each rule.

### Scenario Structure

```gherkin
    @acceptance-criteria @happy-path
    Scenario: Successful registration with new email
      Given a user with valid email "new@example.com"
      When they submit the registration form
      Then an account is created
      And a verification email is sent
```

### Required Tags

Every scenario MUST have exactly two tags:

1. `@acceptance-criteria` — marks this as a testable acceptance criterion (MUST)
2. One of: `@happy-path`, `@validation`, or `@edge-case` (MUST choose exactly one)

| Tag           | Use For                                               |
| ------------- | ----------------------------------------------------- |
| `@happy-path` | Normal, expected flow — the feature works as designed |
| `@validation` | Input validation, constraint checking, error handling |
| `@edge-case`  | Boundary conditions, unusual states, race conditions  |

### Step Structure

Scenarios use standard Gherkin Given/When/Then steps:

- `Given` — precondition or context setup
- `When` — the action being tested
- `Then` — the expected outcome
- `And` / `But` — additional steps of the same type

**Step writing guidelines:**

- Steps SHOULD be concrete but not implementation-specific
- Plan-level steps describe intent: `When the user registers`
- Design-level steps describe behavior: `When the registration handler receives a CreateUser command`
- Steps MAY include inline data in quotes: `Given a user with email "test@example.com"`
- Steps MAY reference data tables for structured input

### Scenario Count Guidelines

| Spec Level   | Scenarios per Rule | Total per Spec |
| ------------ | ------------------ | -------------- |
| Plan-level   | 2-3                | 9-15           |
| Design-level | 3-5                | 20-40          |

- Each rule MUST have at least one `@happy-path` scenario
- Each rule MUST have at least one `@edge-case` or `@validation` scenario
- Scenarios SHOULD cover the cases listed in the rule's `**Verified by:**` block

### Scenario Outline (Data-Driven)

Design-level specs MAY use `Scenario Outline` with `Examples:` tables for data-driven
testing:

```gherkin
    @acceptance-criteria @validation
    Scenario Outline: Registration with various email formats
      Given a user registers with email "<email>"
      When the registration is submitted
      Then the result is "<result>"

      Examples:
        | email              | result           |
        | user@example.com   | success          |
        | invalid            | validation error |
        | USER@EXAMPLE.COM   | success (normalized) |
```

## Plan-Level vs. Design-Level Comparison

| Aspect               | Plan-Level                          | Design-Level                  |
| -------------------- | ----------------------------------- | ----------------------------- |
| Description sections | Business Value + How It Works       | Problem + Solution            |
| Deliverables table   | 5 columns                           | 5 columns                     |
| Rules                | 4-6                                 | 6-9                           |
| Rule metadata        | Invariant + Rationale + Verified by | + Input + Output + Algorithm  |
| Scenarios per rule   | 2-3                                 | 3-5                           |
| Total scenarios      | 9-15                                | 20-40                         |
| Scenario detail      | Intent-focused                      | Behavior-focused              |
| Section separators   | Typically omitted                   | RECOMMENDED                   |
| Sequence tags        | Not used                            | Used when applicable          |
| Stubs                | Not created                         | Created in `architect/stubs/` |
| File length          | 60-150 lines                        | 200-600 lines                 |
