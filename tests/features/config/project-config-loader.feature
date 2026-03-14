@architect
@architect-pattern:ProjectConfigLoader
@architect-status:completed
@architect-product-area:Configuration
@behavior @config
Feature: Project Config Loader - Unified Configuration Loading
  loadProjectConfig loads and resolves configuration from file,
  supporting both new-style defineConfig and legacy createArchitect formats.

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

    **Invariant:** When no config file exists, loadProjectConfig must return a default resolved config with isDefault=true.
    **Rationale:** Graceful fallback enables zero-config usage — new projects work without requiring config file creation.
    **Verified by:** No config file returns default resolved config

    @happy-path
    Scenario: No config file returns default resolved config
      Given no config file in the temp directory
      When loading project config from temp directory
      Then project config loading should succeed
      And project config isDefault should be true

  Rule: New-style config is loaded and resolved

    **Invariant:** A file exporting defineConfig must be loaded, validated, and resolved with correct preset categories.
    **Rationale:** defineConfig is the primary config format — correct loading is the critical path for all documentation generation.
    **Verified by:** defineConfig export loads and resolves correctly

    @happy-path
    Scenario: defineConfig export loads and resolves correctly
      Given a new-style config file with preset "libar-generic" and typescript sources
      When loading project config from temp directory
      Then project config loading should succeed
      And project config isDefault should be false
      And project config instance should have 3 categories

  Rule: Legacy config is loaded with backward compatibility

    **Invariant:** A file exporting createArchitect must be loaded and produce a valid resolved config.
    **Rationale:** Backward compatibility prevents breaking existing consumers during migration to the new config format.
    **Verified by:** Legacy createArchitect export loads correctly

    @happy-path
    Scenario: Legacy createArchitect export loads correctly
      Given a legacy config file with registry and regexBuilders
      When loading project config from temp directory
      Then project config loading should succeed
      And project config isDefault should be false

  Rule: Invalid configs produce clear errors

    **Invariant:** Config files without a default export or with invalid data must produce descriptive error messages.
    **Rationale:** Actionable error messages reduce debugging time — users need to know what to fix, not just that something failed.
    **Verified by:** Config without default export returns error, Config with invalid project config returns Zod error

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
