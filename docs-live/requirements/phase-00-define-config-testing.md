# ✅ Define Config Testing

**Purpose:** Detailed requirements for the Define Config Testing feature

---

## Overview

| Property     | Value         |
| ------------ | ------------- |
| Status       | completed     |
| Product Area | Configuration |

## Description

The defineConfig identity function and DeliveryProcessProjectConfigSchema
provide type-safe configuration authoring with runtime validation.

**Problem:**

- Users need type-safe config authoring without runtime overhead
- Invalid configs must be caught at load time, not at usage time
- New-style vs legacy config must be distinguishable programmatically

**Solution:**

- defineConfig() is a zero-cost identity function for TypeScript autocompletion
- Zod schema validates at load time with precise error messages
- isProjectConfig() and isLegacyInstance() type guards disambiguate config formats

## Acceptance Criteria

**defineConfig returns input unchanged**

- Given a project config with preset "libar-generic"
- When calling defineConfig with the config
- Then the result should be the exact same object

**Valid minimal config passes validation**

- Given a config object with only preset "libar-generic"
- When validating against DeliveryProcessProjectConfigSchema
- Then validation should succeed

**Valid full config passes validation**

- Given a config object with all fields populated
- When validating against DeliveryProcessProjectConfigSchema
- Then validation should succeed

**Empty glob pattern rejected**

- Given a config with an empty string in typescript sources
- When validating against DeliveryProcessProjectConfigSchema
- Then validation should fail
- And the validation error should contain "empty"

**Parent directory traversal rejected in globs**

- Given a config with a glob containing ".."
- When validating against DeliveryProcessProjectConfigSchema
- Then validation should fail
- And the validation error should contain "parent directory traversal"

**replaceFeatures and additionalFeatures mutually exclusive**

- Given a generator override with both replaceFeatures and additionalFeatures
- When validating the generator override against schema
- Then validation should fail
- And the validation error should contain "mutually exclusive"

**Invalid preset name rejected**

- Given a config object with preset "nonexistent-preset"
- When validating against DeliveryProcessProjectConfigSchema
- Then validation should fail

**Unknown fields rejected in strict mode**

- Given a config object with an unknown field "foobar"
- When validating against DeliveryProcessProjectConfigSchema
- Then validation should fail

**isProjectConfig returns true for new-style config**

- Given a new-style config object with sources field
- When checking isProjectConfig
- Then the result should be true

**isProjectConfig returns false for legacy instance**

- Given a legacy instance object with registry and regexBuilders
- When checking isProjectConfig
- Then the result should be false

**isLegacyInstance returns true for legacy objects**

- Given a legacy instance object with registry and regexBuilders
- When checking isLegacyInstance
- Then the result should be true

**isLegacyInstance returns false for new-style config**

- Given a new-style config object with sources field
- When checking isLegacyInstance
- Then the result should be false

## Business Rules

**defineConfig is an identity function**

_Verified by: defineConfig returns input unchanged_

**Schema validates correct configurations**

_Verified by: Valid minimal config passes validation, Valid full config passes validation_

**Schema rejects invalid configurations**

_Verified by: Empty glob pattern rejected, Parent directory traversal rejected in globs, replaceFeatures and additionalFeatures mutually exclusive, Invalid preset name rejected, Unknown fields rejected in strict mode_

**Type guards distinguish config formats**

_Verified by: isProjectConfig returns true for new-style config, isProjectConfig returns false for legacy instance, isLegacyInstance returns true for legacy objects, isLegacyInstance returns false for new-style config_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
