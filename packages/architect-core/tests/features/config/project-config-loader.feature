@architect
@architect-pattern:ProjectConfigLoader
@architect-implements:ConfigLoader
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Configuration
@behavior @config
Feature: Project Config Loader
  loadProjectConfig loads and resolves configuration from file,
  using the unified defineConfig project configuration format.

  **Problem:**
  - Invalid configs must produce actionable error messages
  - Missing config files should gracefully fall back to defaults

  **Solution:**
  - loadProjectConfig returns ResolvedConfig for both file-backed and default cases
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

    **Invariant:** A file exporting defineConfig must be loaded, validated, and resolved with the correct roles semantics.
    **Rationale:** defineConfig is the primary config format — correct loading is the critical path for all documentation generation.
    **Verified by:** defineConfig export without roles loads default roles, defineConfig export with explicit empty roles disables defaults

    @happy-path
    Scenario: defineConfig export without roles loads default roles
      Given a new-style config file with typescript sources and no roles field
      When loading project config from temp directory
      Then project config loading should succeed
      And project config isDefault should be false
      And project config instance should have 8 roles

    @happy-path
    Scenario: defineConfig export with explicit empty roles disables defaults
      Given a new-style config file with explicit empty roles and typescript sources
      When loading project config from temp directory
      Then project config loading should succeed
      And project config isDefault should be false
      And project config instance should have 0 roles

  Rule: Invalid configs produce clear errors

    **Invariant:** Config files without a default export or with invalid data must produce descriptive error messages.
    **Rationale:** Actionable error messages reduce debugging time — users need to know what to fix, not just that something failed.
    **Verified by:** Config without default export returns error, Config with removed preset field returns Zod error

    @error-handling
    Scenario: Config without default export returns error
      Given a config file without a default export
      When loading project config from temp directory
      Then project config loading should fail
      And the project config error message should contain "default export"

    @error-handling
    Scenario: Config with removed preset field returns Zod error
      Given a config file with removed preset field data
      When loading project config from temp directory
      Then project config loading should fail
      And the project config error message should contain "Invalid project config"
