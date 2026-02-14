# ✅ Arch Generator Registration

**Purpose:** Detailed requirements for the Arch Generator Registration feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

As a CLI user
I want an architecture generator registered in the generator registry
So that I can run pnpm docs:architecture to generate diagrams

## Acceptance Criteria

**Generator is available in registry**

- When checking available generators
- Then the registry contains generator "architecture"
- And the generator description includes "Architecture"

**Default generation produces component diagram**

- Given patterns with architecture annotations:
- When the architecture generator runs
- Then the output contains file "ARCHITECTURE.md"
- And the file contains required elements:

| name         | archRole        | archContext |
| ------------ | --------------- | ----------- |
| OrderHandler | command-handler | orders      |
| InvHandler   | command-handler | inventory   |

| text            |
| --------------- |
| System Overview |
| subgraph        |

**Generate layered diagram with options**

- Given patterns with architecture annotations:
- And codec options for diagram type "layered"
- When the architecture generator runs
- Then the output contains file "ARCHITECTURE.md"
- And the file contains "Layered Architecture"

| name     | archRole        | archContext | archLayer   |
| -------- | --------------- | ----------- | ----------- |
| Decider1 | decider         | orders      | domain      |
| Handler1 | command-handler | orders      | application |

**Filter to specific contexts**

- Given patterns with architecture annotations:
- And codec options filtering to contexts "orders"
- When the architecture generator runs
- Then the file contains "Orders BC"
- And the file does not contain "Inventory BC"

| name         | archRole        | archContext |
| ------------ | --------------- | ----------- |
| OrderHandler | command-handler | orders      |
| OrderProj    | projection      | orders      |
| InvHandler   | command-handler | inventory   |

## Business Rules

**Architecture generator is registered in the registry**

The architecture generator must be registered like other built-in
generators so it can be invoked via CLI.

_Verified by: Generator is available in registry_

**Architecture generator produces component diagram by default**

Running the architecture generator without options produces
a component diagram (bounded context view).

_Verified by: Default generation produces component diagram_

**Architecture generator supports diagram type options**

The generator accepts options to specify diagram type
(component or layered).

_Verified by: Generate layered diagram with options_

**Architecture generator supports context filtering**

The generator can filter to specific bounded contexts
for focused diagram output.

_Verified by: Filter to specific contexts_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
