@architect
@architect-pattern:ArchitectPublicContract
@architect-status:active
@architect-product-area:DataAPI
@cli @contracts
Feature: Architect public contract exports
  Freeze the canonical public exports that refactors must preserve and reject
  removed facade compatibility paths.

  Rule: architect-core and architect-projection keep canonical exports importable

    **Invariant:** `@libar-dev/architect-core/graph`, graph construction, FSM,
    dependency, rule, decision, and package kernels remain public while every
    legacy facade and result-envelope export is absent at runtime.
    **Rationale:** Callers should use the frozen Graph and named pure kernels,
    with no parallel compatibility API that can drift from the canonical graph.
    **Verified by:** architect-core graph and pure-kernel exports replace the legacy facade, architect-projection canonical projection entrypoints remain public, architect-projection barrel exposes only the validated architecture entrypoint

    @contract
    Scenario: architect-core graph and pure-kernel exports replace the legacy facade
      Then architect-core graph and pure-kernel exports are available
      And architect-core legacy facade exports are absent

    @contract
    Scenario: architect-projection canonical projection entrypoints remain public
      Then all architect-projection parseAndProject entrypoints remain available

    @contract
    Scenario: architect-projection barrel exposes only the validated architecture entrypoint
      Then architect-projection hides the raw architecture diagram export from the top-level barrel
