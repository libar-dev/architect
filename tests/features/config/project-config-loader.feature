@libar-docs
@libar-docs-pattern:ProjectConfigLoader
@libar-docs-status:completed
@libar-docs-product-area:Configuration
@behavior @config
Feature: Project Config Loader - Unified Configuration Loading
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

  Background:
    Given a project config loader test context with temp directory

  Rule: Missing config returns defaults

    @happy-path
    Scenario: No config file returns default resolved config
      Given no config file in the temp directory
      When loading project config from temp directory
      Then project config loading should succeed
      And project config isDefault should be true

  Rule: New-style config is loaded and resolved

    @happy-path
    Scenario: defineConfig export loads and resolves correctly
      Given a new-style config file with preset "libar-generic" and typescript sources
      When loading project config from temp directory
      Then project config loading should succeed
      And project config isDefault should be false
      And project config instance should have 3 categories

  Rule: Legacy config is loaded with backward compatibility

    @happy-path
    Scenario: Legacy createDeliveryProcess export loads correctly
      Given a legacy config file with registry and regexBuilders
      When loading project config from temp directory
      Then project config loading should succeed
      And project config isDefault should be false

  Rule: Invalid configs produce clear errors

    @error-handling
    Scenario: Config without default export returns error
      Given a config file without a default export
      When loading project config from temp directory
      Then project config loading should fail
      And the project config error message should contain "default export"

    @error-handling
    Scenario: Config with invalid project config returns Zod error
      Given a config file with invalid project config data
      When loading project config from temp directory
      Then project config loading should fail
      And the project config error message should contain "Invalid project config"
