# 07 — Stub Format

> **Architect Spec v0.1.0** — TypeScript design stub conventions.

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
 * @architect-phase 2
 * @architect-product-area Desktop
 * @architect-depends-on UserService,EmailService
 * @architect-uses EventStore
 * @architect-used-by APIGateway
 * @architect-release vNEXT
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
 * See: feature-inventory.md F-02 UserRegistration
 */
```

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

4. IMPLEMENTATION complete
   └── Tests pass against the stub-defined contracts
   └── Stub directory deleted from architect/stubs/
   └── Pattern status transitions to active or completed
```

**Critical rule:** Stubs are ephemeral design artifacts. They MUST be deleted when
implementation is complete. The implementation IS the realized stub — keeping both
creates confusing duplication.
