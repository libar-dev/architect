@behavior @config
@libar-docs-pattern:ConfigLoader
@libar-docs-product-area:Configuration
Feature: Config Loader - TypeScript Configuration Discovery
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

  Background:
    Given a config loader test context with temp directory

  # ==========================================================================
  # Config File Discovery
  # ==========================================================================

  Rule: Config files are discovered by walking up directories

    @happy-path
    Scenario: Find config file in current directory
      Given a directory structure:
        | path                          | type   |
        | delivery-process.config.js    | config |
      When finding config file from the base directory
      Then config file should be found
      And config path should end with "delivery-process.config.js"

    @happy-path
    Scenario: Find config file in parent directory
      Given a directory structure:
        | path                          | type    |
        | delivery-process.config.js    | config  |
        | nested/src/file.ts            | source  |
      When finding config file from "nested/src"
      Then config file should be found
      And config path should end with "delivery-process.config.js"

    @happy-path
    Scenario: Prefer TypeScript config over JavaScript
      Given a directory structure:
        | path                          | type   |
        | delivery-process.config.ts    | config |
        | delivery-process.config.js    | config |
      When finding config file from the base directory
      Then config file should be found
      And config path should end with "delivery-process.config.ts"

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

    @boundary
    Scenario: Stop at .git directory marker
      Given a directory structure:
        | path                               | type    |
        | .git/config                        | git     |
        | delivery-process.config.js         | config  |
        | project/nested/src/file.ts         | source  |
      When finding config file from "project/nested/src"
      Then config file should be found
      And config path should NOT contain "project/nested"

  # ==========================================================================
  # Config Loading
  # ==========================================================================

  Rule: Config is loaded and validated

    @happy-path
    Scenario: Load valid config with default fallback
      Given no config file exists
      When loading config from base directory
      Then config loading should succeed
      And loaded config should be the default
      And loaded registry tagPrefix should be "@libar-docs-"
      And loaded registry should have exactly 3 categories

    @happy-path
    Scenario: Load valid config file
      Given a valid config file with preset "generic"
      When loading config from base directory
      Then config loading should succeed
      And loaded config should NOT be the default
      And loaded registry tagPrefix should be "@docs-"

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
      And config error message should contain "DeliveryProcessInstance"

  # ==========================================================================
  # Error Formatting
  # ==========================================================================

  Rule: Config errors are formatted for display

    @utility
    Scenario: Format error with path and message
      Given a config load error with path "/test/config.ts" and message "Invalid export"
      When formatting the config error
      Then formatted error should contain "Config error"
      And formatted error should contain "/test/config.ts"
      And formatted error should contain "Invalid export"
