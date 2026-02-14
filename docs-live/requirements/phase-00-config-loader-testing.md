# ✅ Config Loader Testing

**Purpose:** Detailed requirements for the Config Loader Testing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Configuration |

## Description

The config loader discovers and loads `delivery-process.config.ts` files
  for hierarchical configuration, enabling package-level and repo-level
  taxonomy customization.

  **Problem:**
  - Different directories need different taxonomies
  - Package-level config should override repo-level
  - CLI tools need automatic config discovery

  **Solution:**
  - Walk up directories looking for `delivery-process.config.ts`
  - Stop at repo root (.git marker)
  - Fall back to libar-generic preset (3 categories) if no config found

## Acceptance Criteria

**Find config file in current directory**

- Given a directory structure:
- When finding config file from the base directory
- Then config file should be found
- And config path should end with "delivery-process.config.js"

| path | type |
| --- | --- |
| delivery-process.config.js | config |

**Find config file in parent directory**

- Given a directory structure:
- When finding config file from "nested/src"
- Then config file should be found
- And config path should end with "delivery-process.config.js"

| path | type |
| --- | --- |
| delivery-process.config.js | config |
| nested/src/file.ts | source |

**Prefer TypeScript config over JavaScript**

- Given a directory structure:
- When finding config file from the base directory
- Then config file should be found
- And config path should end with "delivery-process.config.ts"

| path | type |
| --- | --- |
| delivery-process.config.ts | config |
| delivery-process.config.js | config |

**Return null when no config file exists**

- Given a directory structure:
- When finding config file from "src"
- Then config file should NOT be found

| path | type |
| --- | --- |
| src/file.ts | source |

**Stop at .git directory marker**

- Given a directory structure:
- When finding config file from "project/nested/src"
- Then config file should be found
- And config path should NOT contain "project/nested"

| path | type |
| --- | --- |
| .git/config | git |
| delivery-process.config.js | config |
| project/nested/src/file.ts | source |

**Load valid config with default fallback**

- Given no config file exists
- When loading config from base directory
- Then config loading should succeed
- And loaded config should be the default
- And loaded registry tagPrefix should be "@libar-docs-"
- And loaded registry should have exactly 3 categories

**Load valid config file**

- Given a valid config file with preset "generic"
- When loading config from base directory
- Then config loading should succeed
- And loaded config should NOT be the default
- And loaded registry tagPrefix should be "@docs-"

**Error on config without default export**

- Given a config file without default export
- When loading config from base directory
- Then config loading should fail
- And config error message should contain "default export"

**Error on config with wrong type**

- Given a config file exporting wrong type
- When loading config from base directory
- Then config loading should fail
- And config error message should contain "DeliveryProcessInstance"

**Format error with path and message**

- Given a config load error with path "/test/config.ts" and message "Invalid export"
- When formatting the config error
- Then formatted error should contain "Config error"
- And formatted error should contain "/test/config.ts"
- And formatted error should contain "Invalid export"

## Business Rules

**Config files are discovered by walking up directories**

_Verified by: Find config file in current directory, Find config file in parent directory, Prefer TypeScript config over JavaScript, Return null when no config file exists_

**Config discovery stops at repo root**

_Verified by: Stop at .git directory marker_

**Config is loaded and validated**

_Verified by: Load valid config with default fallback, Load valid config file, Error on config without default export, Error on config with wrong type_

**Config errors are formatted for display**

_Verified by: Format error with path and message_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
