# 07 — Stub Format

> **Architect Spec v0.2.0** — TypeScript design stub conventions.

---

## Overview

Design stubs are TypeScript files that define interfaces, types, and API shapes as
**design artifacts**. They bridge the gap between specification and implementation — a
stub expresses the contract that implementation code must fulfill.

Stubs are **design-level artifacts**. They are created when a feature spec is promoted
from plan-level to design-level, and they are deleted when implementation is complete.
They MUST NOT be created for plan-level specs.

## Directory Convention

Stubs live in `architect/stubs/`, organized by pattern name:

```
architect/stubs/
  user-registration/          # kebab-case of pattern name
    registration-service.ts   # one or more .ts files
    registration-types.ts
  mcp-integration/
    server.ts
    context-assembler.ts
```

**Rules:**

- Directory name MUST be kebab-case of the pattern name (`UserRegistration` → `user-registration`)
- Each directory contains one or more `.ts` files
- Files within the directory use kebab-case naming
- Stubs are NOT compiled or linted — they live outside the source tree

## JSDoc Annotation Block

Every stub file MUST begin with a JSDoc block containing `@architect-*` annotations:

```typescript
/**
 * @architect
 * @architect-status roadmap
 * @architect-pattern UserRegistration
 * @architect-implements UserRegistration
 * @architect-target apps/desktop/src/lib/registration-service.ts
 * @architect-bounded-context identity
 * @architect-arch-layer domain
 * @architect-product-area Identity
 * @architect-uses UserService, EmailService, EventStore
 *
 * ## UserRegistration -- Account Creation Service
 *
 * Handles new user registration with email validation, duplicate detection,
 * and verification email dispatch.
 *
 * ### Design Decisions
 * DD-1: Email normalization before storage -- prevents case-sensitive duplicates
 * DD-2: Async verification via EmailService -- non-blocking registration flow
 *
 * ### When to Use
 * - New user account creation from any entry point (web, API, CLI)
 * - Batch user import with validation
 *
 * See: architect/specs/identity/user-registration.feature
 */
```

> _Informative:_ Reverse-edge tags such as `@architect-used-by` are derived from the
> declared `@architect-uses` of other patterns and are not authored. Earlier drafts
> showed `@architect-phase`, `@architect-release`, `@architect-depends-on`, and
> `@architect-used-by` in stub JSDoc; those are not part of the v0.2.0 canonical
> taxonomy.

### Tag Syntax in JSDoc

In JSDoc blocks, tags use **space separators** (not colons):

```
Gherkin:    @architect-status:roadmap
JSDoc:      @architect-status roadmap
```

### Required Tags

| Tag                     | Required | Notes                                    |
| ----------------------- | -------- | ---------------------------------------- |
| `@architect`            | MUST     | Gate tag                                 |
| `@architect-status`     | MUST     | Always `roadmap` for stubs               |
| `@architect-pattern`    | MUST     | PascalCase pattern name                  |
| `@architect-implements` | MUST     | Feature spec this realizes               |
| `@architect-target`     | MUST     | Destination file path for implementation |

### JSDoc Markdown Section

After the tags, the JSDoc block SHOULD contain a Markdown-formatted section with:

- `## PatternName -- Short Description` — heading with pattern name
- Prose description of the module's purpose
- `### Design Decisions` — numbered design decisions (DD-N format)
- `### When to Use` — usage guidance
- `See:` reference — link to the feature inventory entry

## Code Conventions

### Interface Definitions

All interface fields MUST use `readonly`:

```typescript
export interface RegistrationConfig {
  readonly maxEmailLength: number;
  readonly verificationTimeoutMs: number;
  readonly allowedDomains: readonly string[];
}

export interface RegistrationResult {
  readonly success: boolean;
  readonly userId?: string;
  readonly error?: RegistrationError;
}
```

### Method Signatures

Methods SHOULD have proper TypeScript signatures with JSDoc descriptions:

```typescript
export class RegistrationService {
  /**
   * Register a new user account.
   * @param request - Registration request with email and password
   * @returns Registration result with user ID or error
   */
  async register(_request: RegistrationRequest): Promise<RegistrationResult> {
    throw new Error('UserRegistration not yet implemented -- roadmap pattern');
  }
}
```

### Placeholder Convention

Method bodies MUST throw with a descriptive message:

```typescript
throw new Error('<PatternName> not yet implemented -- roadmap pattern');
```

### Unused Parameters

Parameters in placeholder methods MUST use underscore prefix to avoid lint errors:

```typescript
async register(_request: RegistrationRequest): Promise<RegistrationResult> {
  throw new Error('UserRegistration not yet implemented -- roadmap pattern');
}
```

### Type Organization

Types within a stub file SHOULD be organized with separator comments:

```typescript
// ---------------------------------------------------------------------------
// Configuration Types
// ---------------------------------------------------------------------------

export interface RegistrationConfig { ... }

// ---------------------------------------------------------------------------
// Request / Response Types
// ---------------------------------------------------------------------------

export interface RegistrationRequest { ... }
export interface RegistrationResult { ... }
```

## Exported Type Surface

Stubs still define the contract surface for downstream tooling, but that surface is carried
by the exported TypeScript declarations themselves. A toolchain that wants shape-level views
should derive them from the stub's public exports instead of relying on a separate authored tag.

## Stub Lifecycle

```
1. PLAN-LEVEL SPEC created
   └── No stubs (stubs are design-level only)

2. DESIGN-LEVEL SPEC created
   └── Stubs created in architect/stubs/<pattern-name>/
       └── Interfaces, types, API shapes defined
       └── Status: @architect-status roadmap

3. IMPLEMENTATION begins
   └── Developer reads stubs as the implementation contract
   └── Implementation created at @architect-target path
   └── Implementation MUST fulfill stub interfaces

4. IMPLEMENTATION complete — the stub is PROMOTED, not discarded
   └── Tests pass against the stub-defined contracts
   └── @architect-pattern identity persists at the @architect-target src/ file (ADR-003)
   └── Pattern @architect-status advances roadmap → active → completed
   └── Staging copy removed from architect/stubs/ (the src/ file IS the realized stub)
```

**Critical rule:** A stub's _staging copy_ in `architect/stubs/` is ephemeral and MUST be removed
once implementation is complete — the implementation at `@architect-target` IS the realized stub,
so keeping both creates confusing duplication. But "removed" is **promotion, not loss of
identity**: the stub's `@architect-pattern` identity (and its role, decisions, and use-cases)
**travels with the code into `src/`** and persists there as a code-originated pattern (ADR-003 —
"identity travels with code from stub through production"). Only the staging duplicate is deleted;
the pattern lives on, its `@architect-status` advancing `roadmap → active → completed`. (This is
distinct from a _step-definition_ stub or a _behavioral design `.feature`_, which carry no durable
code identity and are deleted outright once their value has transferred to the executable feature.)
