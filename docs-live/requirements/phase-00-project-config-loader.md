# ✅ Project Config Loader

**Purpose:** Detailed requirements for the Project Config Loader feature

---

## Overview

| Property     | Value         |
| ------------ | ------------- |
| Status       | completed     |
| Product Area | Configuration |

## Description

loadProjectConfig loads and resolves configuration from file,
supporting both new-style defineConfig and legacy createDeliveryProcess formats.

**Problem:**

- Two config formats exist (new-style and legacy) that need unified loading
- Invalid configs must produce actionable error messages
- Missing config files should gracefully fall back to defaults

**Solution:**

- loadProjectConfig returns ResolvedConfig for both formats
- Zod validation errors are formatted with field paths
- No config file returns default resolved config with isDefault=true

## Acceptance Criteria

**No config file returns default resolved config**

- Given no config file in the temp directory
- When loading project config from temp directory
- Then project config loading should succeed
- And project config isDefault should be true

**defineConfig export loads and resolves correctly**

- Given a new-style config file with preset "libar-generic" and typescript sources
- When loading project config from temp directory
- Then project config loading should succeed
- And project config isDefault should be false
- And project config instance should have 3 categories

**Legacy createDeliveryProcess export loads correctly**

- Given a legacy config file with registry and regexBuilders
- When loading project config from temp directory
- Then project config loading should succeed
- And project config isDefault should be false

**Config without default export returns error**

- Given a config file without a default export
- When loading project config from temp directory
- Then project config loading should fail
- And the project config error message should contain "default export"

**Config with invalid project config returns Zod error**

- Given a config file with invalid project config data
- When loading project config from temp directory
- Then project config loading should fail
- And the project config error message should contain "Invalid project config"

## Business Rules

**Missing config returns defaults**

**Invariant:** When no config file exists, loadProjectConfig must return a default resolved config with isDefault=true.
**Rationale:** Graceful fallback enables zero-config usage — new projects work without requiring config file creation.
**Verified by:** No config file returns default resolved config

_Verified by: No config file returns default resolved config_

**New-style config is loaded and resolved**

**Invariant:** A file exporting defineConfig must be loaded, validated, and resolved with correct preset categories.
**Rationale:** defineConfig is the primary config format — correct loading is the critical path for all documentation generation.
**Verified by:** defineConfig export loads and resolves correctly

_Verified by: defineConfig export loads and resolves correctly_

**Legacy config is loaded with backward compatibility**

**Invariant:** A file exporting createDeliveryProcess must be loaded and produce a valid resolved config.
**Rationale:** Backward compatibility prevents breaking existing consumers during migration to the new config format.
**Verified by:** Legacy createDeliveryProcess export loads correctly

_Verified by: Legacy createDeliveryProcess export loads correctly_

**Invalid configs produce clear errors**

**Invariant:** Config files without a default export or with invalid data must produce descriptive error messages.
**Rationale:** Actionable error messages reduce debugging time — users need to know what to fix, not just that something failed.
**Verified by:** Config without default export returns error, Config with invalid project config returns Zod error

_Verified by: Config without default export returns error, Config with invalid project config returns Zod error_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
