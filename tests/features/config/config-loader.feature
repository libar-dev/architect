@architect
@architect-pattern:ConfigLoaderTesting
@architect-implements:ConfigLoader
@architect-status:completed
@architect-product-area:Configuration
@behavior @config
Feature: Config Loader - TypeScript Configuration Discovery
  The config loader discovers and loads `architect.config.ts` files
  for hierarchical configuration, enabling package-level and repo-level
  taxonomy customization.

  **Problem:**
  - Different directories need different taxonomies
  - Package-level config should override repo-level
  - CLI tools need automatic config discovery

  **Solution:**
  - Walk up directories looking for `architect.config.ts`
  - Stop at repo root (.git marker)
  - Fall back to libar-generic preset (3 categories) if no config found

  Background:
    Given a config loader test context with temp directory

  # ==========================================================================
  # Config File Discovery
  # ==========================================================================

  Rule: Config files are discovered by walking up directories

    **Invariant:** The config loader must search for configuration files starting from the current directory and walking up parent directories until a match is found or the filesystem root is reached.
    **Rationale:** Projects may run CLI commands from subdirectories — upward traversal ensures the nearest config file is always found regardless of working directory.
    **Verified by:** Find config file in current directory, Find config file in parent directory, Prefer TypeScript config over JavaScript, Return null when no config file exists

    @happy-path
    Scenario: Find config file in current directory
      Given a directory structure:
        | path                          | type   |
        | architect.config.js    | config |
      When finding config file from the base directory
      Then config file should be found
      And config path should end with "architect.config.js"

    @happy-path
    Scenario: Find config file in parent directory
      Given a directory structure:
        | path                          | type    |
        | architect.config.js    | config  |
        | nested/src/file.ts            | source  |
      When finding config file from "nested/src"
      Then config file should be found
      And config path should end with "architect.config.js"

    @happy-path
    Scenario: Prefer TypeScript config over JavaScript
      Given a directory structure:
        | path                          | type   |
        | architect.config.ts    | config |
        | architect.config.js    | config |
      When finding config file from the base directory
      Then config file should be found
      And config path should end with "architect.config.ts"

    @edge-case
    Scenario: Return null when no config file exists
      Given a directory structure:
        | path           | type   |
        | src/file.ts    | source |
      When finding config file from "src"
      Then config file should NOT be found

  # ==========================================================================
  # Repo Root Boundary
  # ==========================================================================

  Rule: Config discovery stops at repo root

    **Invariant:** Directory traversal must stop at repository root markers (e.g., .git directory) and not search beyond them.
    **Rationale:** Searching beyond the repo root could find unrelated config files from parent projects, producing confusing cross-project behavior.
    **Verified by:** Stop at .git directory marker

    @boundary
    Scenario: Stop at .git directory marker
      Given a directory structure:
        | path                               | type    |
        | .git/config                        | git     |
        | architect.config.js         | config  |
        | project/nested/src/file.ts         | source  |
      When finding config file from "project/nested/src"
      Then config file should be found
      And config path should NOT contain "project/nested"

  # ==========================================================================
  # Config Loading
  # ==========================================================================

  Rule: Config is loaded and validated

    **Invariant:** Loaded config files must have a valid default export matching the expected configuration schema, with appropriate error messages for invalid formats.
    **Rationale:** Invalid configurations produce cryptic downstream errors — early validation with clear messages prevents debugging wasted on malformed config.
    **Verified by:** Load valid config with default fallback, Load valid config file, Error on config without default export, Error on config with wrong type

    @happy-path
    Scenario: Load valid config with default fallback
      Given no config file exists
      When loading config from base directory
      Then config loading should succeed
      And loaded config should be the default
      And loaded registry tagPrefix should be "@architect-"
      And loaded registry should have exactly 3 categories

    @happy-path
    Scenario: Load valid config file
      Given a valid config file with preset "generic"
      When loading config from base directory
      Then config loading should succeed
      And loaded config should NOT be the default
      And loaded registry tagPrefix should be "@architect-"

    @error-handling
    Scenario: Error on config without default export
      Given a config file without default export
      When loading config from base directory
      Then config loading should fail
      And config error message should contain "default export"

    @error-handling
    Scenario: Error on config with wrong type
      Given a config file exporting wrong type
      When loading config from base directory
      Then config loading should fail
      And config error message should contain "defineConfig"

  # ==========================================================================
  # Error Formatting
  # ==========================================================================

  Rule: Config errors are formatted for display

    **Invariant:** Configuration loading errors must be formatted as human-readable messages including the file path and specific error description.
    **Rationale:** Raw error objects are not actionable — developers need the config file path and a clear description to diagnose and fix configuration issues.
    **Verified by:** Format error with path and message

    @utility
    Scenario: Format error with path and message
      Given a config load error with path "/test/config.ts" and message "Invalid export"
      When formatting the config error
      Then formatted error should contain "Config error"
      And formatted error should contain "/test/config.ts"
      And formatted error should contain "Invalid export"
