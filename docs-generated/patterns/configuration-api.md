# ✅ Configuration API

**Purpose:** Detailed documentation for the Configuration API pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

The createDeliveryProcess factory provides a type-safe way to configure
  the delivery process with custom tag prefixes and presets.

  **Problem:**
  - Different projects need different tag prefixes
  - Default taxonomy may not fit all use cases
  - Configuration should be type-safe and validated

  **Solution:**
  - createDeliveryProcess() factory with preset support
  - Custom tagPrefix and fileOptInTag overrides
  - Type-safe configuration with generics

## Acceptance Criteria

**Create with no arguments uses libar-generic preset**

- When I call createDeliveryProcess without arguments
- Then the registry tagPrefix should be "@libar-docs-"
- And the registry fileOptInTag should be "@libar-docs"
- And the registry should have exactly 3 categories

**Create with generic preset**

- When I call createDeliveryProcess with preset "generic"
- Then the registry tagPrefix should be "@docs-"
- And the registry fileOptInTag should be "@docs"
- And the registry should have exactly 3 categories

**Create with libar-generic preset**

- When I call createDeliveryProcess with preset "libar-generic"
- Then the registry tagPrefix should be "@libar-docs-"
- And the registry fileOptInTag should be "@libar-docs"
- And the registry should have exactly 3 categories

**Create with ddd-es-cqrs preset explicitly**

- When I call createDeliveryProcess with preset "ddd-es-cqrs"
- Then the registry tagPrefix should be "@libar-docs-"
- And the registry fileOptInTag should be "@libar-docs"
- And the registry should have 21 categories

**Custom tag prefix overrides preset**

- When I call createDeliveryProcess with tagPrefix "@custom-"
- Then the registry tagPrefix should be "@custom-"

**Custom file opt-in tag overrides preset**

- When I call createDeliveryProcess with fileOptInTag "@my-docs"
- Then the registry fileOptInTag should be "@my-docs"

**Both prefix and opt-in tag can be customized together**

- When I call createDeliveryProcess with tagPrefix "@proj-" and fileOptInTag "@proj"
- Then the registry tagPrefix should be "@proj-"
- And the registry fileOptInTag should be "@proj"

**Generic preset excludes DDD categories**

- When I call createDeliveryProcess with preset "generic"
- Then the registry should NOT include category "ddd"
- And the registry should NOT include category "event-sourcing"
- And the registry should NOT include category "cqrs"
- And the registry should NOT include category "saga"

**Libar-generic preset excludes DDD categories**

- When I call createDeliveryProcess with preset "libar-generic"
- Then the registry should NOT include category "ddd"
- And the registry should NOT include category "event-sourcing"
- And the registry should NOT include category "cqrs"
- And the registry should NOT include category "saga"

**hasFileOptIn detects configured opt-in tag**

- Given a registry with fileOptInTag "@custom"
- And file content containing the opt-in marker
- When I check hasFileOptIn
- Then it should return true

**hasFileOptIn rejects wrong opt-in tag**

- Given a registry with fileOptInTag "@custom"
- And file content containing a different opt-in marker
- When I check hasFileOptIn
- Then it should return false

**hasDocDirectives detects configured prefix**

- Given a registry with tagPrefix "@my-"
- And file content containing a directive with that prefix
- When I check hasDocDirectives
- Then it should return true

**hasDocDirectives rejects wrong prefix**

- Given a registry with tagPrefix "@my-"
- And file content containing a directive with wrong prefix
- When I check hasDocDirectives
- Then it should return false

**normalizeTag removes configured prefix**

- Given a registry with tagPrefix "@docs-"
- When I normalize tag "@docs-pattern"
- Then the normalized tag should be "pattern"

**normalizeTag handles tag without prefix**

- Given a registry with tagPrefix "@docs-"
- When I normalize tag "pattern"
- Then the normalized tag should be "pattern"

## Business Rules

**Factory creates configured instances with correct defaults**

**Invariant:** The configuration factory must produce a fully initialized instance for any supported preset, with the libar-generic preset as the default when no arguments are provided.
    **Rationale:** A sensible default preset eliminates boilerplate for the common case while still supporting specialized presets (ddd-es-cqrs) for advanced monorepo configurations.
    **Verified by:** Create with no arguments uses libar-generic preset, Create with generic preset, Create with libar-generic preset, Create with ddd-es-cqrs preset explicitly

_Verified by: Create with no arguments uses libar-generic preset, Create with generic preset, Create with libar-generic preset, Create with ddd-es-cqrs preset explicitly_

**Custom prefix configuration works correctly**

**Invariant:** Custom tag prefix and file opt-in tag overrides must be applied to the configuration instance, replacing the preset defaults.
    **Rationale:** Consuming projects may use different annotation prefixes — custom prefixes enable the toolkit to work with any tag convention without forking presets.
    **Verified by:** Custom tag prefix overrides preset, Custom file opt-in tag overrides preset, Both prefix and opt-in tag can be customized together

_Verified by: Custom tag prefix overrides preset, Custom file opt-in tag overrides preset, Both prefix and opt-in tag can be customized together_

**Preset categories replace base categories entirely**

**Invariant:** When a preset defines its own category set, it must fully replace (not merge with) the base categories.
    **Rationale:** Category sets are curated per-preset — merging would include irrelevant categories (e.g., DDD categories in a generic project) that pollute taxonomy reports.
    **Verified by:** Generic preset excludes DDD categories, Libar-generic preset excludes DDD categories

_Verified by: Generic preset excludes DDD categories, Libar-generic preset excludes DDD categories_

**Regex builders use configured prefix**

**Invariant:** All regex builders (hasFileOptIn, hasDocDirectives, normalizeTag) must use the configured tag prefix, not a hardcoded one.
    **Rationale:** Regex patterns that ignore the configured prefix would miss annotations in projects using custom prefixes, silently skipping source files.
    **Verified by:** hasFileOptIn detects configured opt-in tag, hasFileOptIn rejects wrong opt-in tag, hasDocDirectives detects configured prefix, hasDocDirectives rejects wrong prefix, normalizeTag removes configured prefix, normalizeTag handles tag without prefix

_Verified by: hasFileOptIn detects configured opt-in tag, hasFileOptIn rejects wrong opt-in tag, hasDocDirectives detects configured prefix, hasDocDirectives rejects wrong prefix, normalizeTag removes configured prefix, normalizeTag handles tag without prefix_

---

[← Back to Pattern Registry](../PATTERNS.md)
