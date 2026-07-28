@architect
@architect-pattern:ArchitectPublicContract
@architect-status:active
@architect-product-area:DataAPI
@cli @contracts
Feature: Architect public contract exports
  Freeze the canonical public exports that refactors must preserve.

  Rule: architect-core and architect-projection keep canonical exports importable

    **Invariant:** Key `@libar-dev/architect-core` query exports and canonical
    `@libar-dev/architect-projection` entrypoints remain publicly importable.
    **Rationale:** CLI, MCP, and downstream consumers rely on the current package
    surface while internals continue to evolve.
    **Verified by:** architect-core query contract exports remain available, architect-projection canonical projection entrypoints remain public, architect-projection barrel exposes only the validated architecture entrypoint

    @contract
    Scenario: architect-core query contract exports remain available
      Then architect-core query contract exports remain available

    @contract
    Scenario: architect-projection canonical projection entrypoints remain public
      Then all architect-projection parseAndProject entrypoints remain available

    @contract
    Scenario: architect-projection barrel exposes only the validated architecture entrypoint
      Then architect-projection hides the raw architecture diagram export from the top-level barrel
