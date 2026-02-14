# ✅ TypeScript Taxonomy Implementation

**Purpose:** Detailed requirements for the TypeScript Taxonomy Implementation feature

---

## Overview

| Property       | Value                            |
| -------------- | -------------------------------- |
| Status         | completed                        |
| Product Area   | Taxonomy                         |
| User Role      | Developer                        |
| Business Value | compile time taxonomy protection |
| Phase          | 99                               |

## Description

As a delivery-process developer
I want taxonomy defined in TypeScript with Zod integration
So that I get compile-time safety and runtime validation

**Note (D12):** Implementation uses TypeScript as the single source of truth,
with consumers importing directly rather than generating intermediate JSON files.

## Acceptance Criteria

**Define status values as TypeScript constant**

- Given a file "src/taxonomy/status-values.ts"
- When I define the status values
- Then it exports PROCESS_STATUS_VALUES as const array
- And it exports ProcessStatusValue type inferred from the array
- And Zod schemas use z.enum() with the constant

**Invalid status value caught at compile time**

- Given code that uses ProcessStatusValue type
- When I assign an invalid value like "draft"
- Then TypeScript compilation fails
- And the error message shows valid options

**Status values match registry purpose**

- Given the package-level taxonomy
- Then PROCESS_STATUS_VALUES contains ["roadmap", "active", "completed", "deferred"]
- And the repo-level taxonomy follows PDR-005 FSM

**Define format types as TypeScript constant**

- Given a file "src/taxonomy/format-types.ts"
- When I define the format types
- Then it exports FORMAT_TYPES as const array
- And it exports FormatType type

```markdown
["value", "enum", "quoted-value", "csv", "number", "flag"]
```

**Define categories as typed array**

- Given a file "src/taxonomy/categories.ts"
- When I define the default categories
- Then each category has tag, domain, priority, description, aliases
- And categories are typed as CategoryDefinition[]
- And category tags can be extracted as a union type (CategoryTag)

**Category satisfies CategoryDefinitionSchema**

- Given a category definition in TypeScript
- When validated against CategoryDefinitionSchema
- Then it passes runtime validation
- And the TypeScript type matches the Zod inference

**Define metadata tags with typed format**

- Given the registry-builder.ts file
- When I define a metadata tag with format "enum"
- Then the values property is provided
- And the values reference TypeScript constants
- And TypeScript enforces type consistency

**Metadata tag with invalid format rejected**

- Given a metadata tag definition
- When format is "enum" but values is missing
- Then Zod runtime validation fails
- And TypeScript provides partial compile-time checking

**Build registry from TypeScript constants**

- Given all taxonomy constants are defined
- When buildRegistry() is called
- Then it returns a valid TagRegistry
- And it uses imported constants for all values
- And the result passes TagRegistrySchema validation

**Registry builder is the single source**

- Given the registry builder function
- When createDefaultTagRegistry() is called
- Then it delegates to buildRegistry()
- And no hardcoded values exist outside taxonomy/

**MetadataTagDefinitionSchema uses FORMAT_TYPES**

- Given the updated validation schema
- When defining the format field
- Then it uses z.enum(FORMAT_TYPES) not hardcoded strings
- And changes to FORMAT_TYPES propagate automatically

**Status field validation uses constant**

- Given a pattern with status field
- When validated against schema
- Then the schema references PROCESS_STATUS_VALUES
- And invalid status values are rejected

**IDE autocomplete for status values**

- Given code that accepts ProcessStatusValue parameter
- When typing the argument
- Then IDE shows autocomplete with all valid values
- And TypeScript inference provides the options

**Refactoring propagates changes**

- Given a status value "roadmap" in constants
- When I rename it to "planned" using IDE refactor
- Then all TypeScript usages are updated automatically

**buildRegistry returns expected structure**

- Given the taxonomy module
- When buildRegistry() is called
- Then it returns the expected TagRegistry structure
- And all existing generators work without modification

## Deliverables

- Status values constants (complete)
- Format types constants (complete)
- Category definitions (complete)
- Metadata tag definitions (complete)
- Registry builder (complete)
- Updated Zod schemas (complete)

## Implementations

Files that implement this pattern:

- [`registry-builder.ts`](../../src/taxonomy/registry-builder.ts) - ## Tag Registry Builder

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
