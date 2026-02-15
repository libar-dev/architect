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

**Invariant:** A config created without user input must have isDefault=true and empty source collections.
**Rationale:** Downstream consumers need a safe starting point when no config file exists.
**Verified by:** Default config has empty sources and isDefault flag

_Verified by: Default config has empty sources and isDefault flag_

**Preset creates correct taxonomy instance**

**Invariant:** Each preset must produce a taxonomy with the correct number of categories and tag prefix.
**Rationale:** Presets are the primary user-facing configuration — wrong category counts break downstream scanning.
**Verified by:** libar-generic preset creates 3 categories

_Verified by: libar-generic preset creates 3 categories_

**Stubs are merged into typescript sources**

**Invariant:** Stub glob patterns must appear in resolved typescript sources alongside original globs.
**Rationale:** Stubs extend the scanner's source set without requiring users to manually list them.
**Verified by:** Stubs appended to typescript sources

_Verified by: Stubs appended to typescript sources_

**Output defaults are applied**

**Invariant:** Missing output configuration must resolve to "docs/architecture" with overwrite=false.
**Rationale:** Consistent defaults prevent accidental overwrites and establish a predictable output location.
**Verified by:** Default output directory and overwrite, Explicit output overrides defaults

_Verified by: Default output directory and overwrite, Explicit output overrides defaults_

**Generator defaults are applied**

**Invariant:** A config with no generators specified must default to the "patterns" generator.
**Rationale:** Patterns is the most commonly needed output — defaulting to it reduces boilerplate.
**Verified by:** Generators default to patterns

_Verified by: Generators default to patterns_

**Context inference rules are prepended**

**Invariant:** User-defined inference rules must appear before built-in defaults in the resolved array.
**Rationale:** Prepending gives user rules priority during context matching without losing defaults.
**Verified by:** User rules prepended to defaults

_Verified by: User rules prepended to defaults_

**Config path is carried from options**

**Invariant:** The configPath from resolution options must be preserved unchanged in resolved config.
**Rationale:** Downstream tools need the original config file location for error reporting and relative path resolution.
**Verified by:** configPath carried from resolution options

_Verified by: configPath carried from resolution options_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
