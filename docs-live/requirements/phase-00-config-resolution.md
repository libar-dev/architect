# ✅ Config Resolution

**Purpose:** Detailed requirements for the Config Resolution feature

---

## Overview

| Property     | Value         |
| ------------ | ------------- |
| Status       | completed     |
| Product Area | Configuration |

## Description

resolveProjectConfig transforms a raw DeliveryProcessProjectConfig into
a fully resolved ResolvedConfig with all defaults applied.

**Problem:**

- Raw user config is partial with many optional fields
- Stubs need to be merged into typescript sources transparently
- Defaults must be applied consistently across all consumers

**Solution:**

- resolveProjectConfig applies defaults in a predictable order
- createDefaultResolvedConfig provides a complete fallback
- Stubs are merged into typescript sources at resolution time

## Acceptance Criteria

**Default config has empty sources and isDefault flag**

- When creating default resolved config
- Then isDefault should be true
- And typescript sources should be empty
- And features sources should be empty
- And exclude sources should be empty

**libar-generic preset creates 3 categories**

- Given a raw config with preset "libar-generic"
- When resolving the project config
- Then the instance should have 3 categories
- And the instance tagPrefix should be "@libar-docs-"

**Stubs appended to typescript sources**

- Given a raw config with typescript sources and stubs
- When resolving the project config
- Then resolved typescript sources should contain both original and stub globs

**Default output directory and overwrite**

- Given a raw config with no output specified
- When resolving the project config
- Then output directory should be "docs/architecture"
- And output overwrite should be false

**Explicit output overrides defaults**

- Given a raw config with output directory "custom-docs" and overwrite true
- When resolving the project config
- Then output directory should be "custom-docs"
- And output overwrite should be true

**Generators default to patterns**

- Given a raw config with no generators specified
- When resolving the project config
- Then generators should contain exactly "patterns"

**User rules prepended to defaults**

- Given a raw config with a custom context inference rule
- When resolving the project config
- Then the first context inference rule should be the user rule
- And the default rules should follow after the user rule

**configPath carried from resolution options**

- Given a raw config with preset "libar-generic"
- When resolving the project config with configPath "/my/config.ts"
- Then the resolved configPath should be "/my/config.ts"

## Business Rules

**Default config provides sensible fallbacks**

_Verified by: Default config has empty sources and isDefault flag_

**Preset creates correct taxonomy instance**

_Verified by: libar-generic preset creates 3 categories_

**Stubs are merged into typescript sources**

_Verified by: Stubs appended to typescript sources_

**Output defaults are applied**

_Verified by: Default output directory and overwrite, Explicit output overrides defaults_

**Generator defaults are applied**

_Verified by: Generators default to patterns_

**Context inference rules are prepended**

_Verified by: User rules prepended to defaults_

**Config path is carried from options**

_Verified by: configPath carried from resolution options_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
