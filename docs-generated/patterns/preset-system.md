# ✅ Preset System

**Purpose:** Detailed documentation for the Preset System pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

Presets provide pre-configured taxonomies for different project types.

  **Problem:**
  - New users need sensible defaults for their project type
  - DDD projects need full taxonomy
  - Simple projects need minimal configuration

  **Solution:**
  - GENERIC_PRESET for non-DDD projects
  - DDD_ES_CQRS_PRESET for full DDD/ES/CQRS taxonomy
  - PRESETS lookup map for programmatic access

## Acceptance Criteria

**Generic preset has correct prefix configuration**

- Given the generic preset
- Then it should have tagPrefix "@docs-"
- And it should have fileOptInTag "@docs"

**Generic preset has core categories only**

- Given the generic preset
- Then it should include category "core"
- And it should include category "api"
- And it should include category "infra"
- And it should NOT include category "ddd"
- And it should NOT include category "event-sourcing"
- And it should NOT include category "cqrs"
- And it should NOT include category "saga"
- And it should have exactly 3 categories

**Libar generic preset has correct prefix configuration**

- Given the libar-generic preset
- Then it should have tagPrefix "@libar-docs-"
- And it should have fileOptInTag "@libar-docs"

**Libar generic preset has core categories only**

- Given the libar-generic preset
- Then it should include category "core"
- And it should include category "api"
- And it should include category "infra"
- And it should NOT include category "ddd"
- And it should NOT include category "event-sourcing"
- And it should NOT include category "cqrs"
- And it should NOT include category "saga"
- And it should have exactly 3 categories

**Full preset has correct prefix configuration**

- Given the ddd-es-cqrs preset
- Then it should have tagPrefix "@libar-docs-"
- And it should have fileOptInTag "@libar-docs"

**Full preset has all DDD categories**

- Given the ddd-es-cqrs preset
- Then it should include category "ddd"
- And it should include category "event-sourcing"
- And it should include category "cqrs"
- And it should include category "saga"
- And it should include category "projection"
- And it should include category "decider"
- And it should include category "command"
- And it should include category "bounded-context"

**Full preset has infrastructure categories**

- Given the ddd-es-cqrs preset
- Then it should include category "core"
- And it should include category "api"
- And it should include category "infra"
- And it should include category "arch"
- And it should include category "validation"
- And it should include category "testing"

**Full preset has all 21 categories**

- Given the ddd-es-cqrs preset
- Then it should have exactly 21 categories

**Generic preset accessible via PRESETS map**

- When I access PRESETS with key "generic"
- Then the preset tagPrefix should be "@docs-"

**DDD preset accessible via PRESETS map**

- When I access PRESETS with key "ddd-es-cqrs"
- Then the preset tagPrefix should be "@libar-docs-"

**Libar generic preset accessible via PRESETS map**

- When I access PRESETS with key "libar-generic"
- Then the preset tagPrefix should be "@libar-docs-"

## Business Rules

**Generic preset provides minimal taxonomy**

_Verified by: Generic preset has correct prefix configuration, Generic preset has core categories only_

**Libar generic preset provides minimal taxonomy with libar prefix**

_Verified by: Libar generic preset has correct prefix configuration, Libar generic preset has core categories only_

**DDD-ES-CQRS preset provides full taxonomy**

_Verified by: Full preset has correct prefix configuration, Full preset has all DDD categories, Full preset has infrastructure categories, Full preset has all 21 categories_

**Presets can be accessed by name**

_Verified by: Generic preset accessible via PRESETS map, DDD preset accessible via PRESETS map, Libar generic preset accessible via PRESETS map_

---

[← Back to Pattern Registry](../PATTERNS.md)
