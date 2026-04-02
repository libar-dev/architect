@architect
@architect-pattern:WorkflowConfigSchemasValidation
@architect-implements:ConfigBasedWorkflowDefinition
@architect-status:active
@architect-product-area:Validation
@validation @workflow
Feature: Workflow Config Schema Validation
  The workflow configuration module defines Zod schemas for validating
  delivery workflow definitions with statuses, phases, and metadata.
  It provides runtime type guards and efficient lookup map construction
  for loaded workflows.

  Background:
    Given a workflow config test context

  Rule: WorkflowConfigSchema validates workflow configurations

    **Invariant:** WorkflowConfigSchema accepts objects with a name, semver version, at least one status, and at least one phase, and rejects objects missing any required field or with invalid semver format.
    **Rationale:** Workflow configurations drive FSM validation and phase-based document routing. Malformed configs would cause silent downstream failures in process guard and documentation generation.
    **Verified by:** Valid workflow config passes schema validation, Config without name is rejected, Config with invalid semver version is rejected, Config without statuses is rejected, Config without phases is rejected

    @schema:WorkflowConfigSchema @happy-path
    Scenario: Valid workflow config passes schema validation
      When I validate a workflow config with name "standard" and version "1.0.0" with 1 status and 1 phase
      Then the workflow config should be valid

    @schema:WorkflowConfigSchema @error-case
    Scenario: Config without name is rejected
      When I validate a workflow config without a name
      Then the workflow config should be invalid

    @schema:WorkflowConfigSchema @error-case
    Scenario: Config with invalid semver version is rejected
      When I validate a workflow config with name "standard" and version "not-semver"
      Then the workflow config should be invalid

    @schema:WorkflowConfigSchema @error-case
    Scenario: Config without statuses is rejected
      When I validate a workflow config with name "standard" and version "1.0.0" with 0 statuses
      Then the workflow config should be invalid

    @schema:WorkflowConfigSchema @error-case
    Scenario: Config without phases is rejected
      When I validate a workflow config with name "standard" and version "1.0.0" with 0 phases
      Then the workflow config should be invalid

  Rule: createLoadedWorkflow builds efficient lookup maps

    **Invariant:** createLoadedWorkflow produces a LoadedWorkflow whose statusMap and phaseMap contain all statuses and phases from the config, keyed by lowercase name for case-insensitive lookup.
    **Rationale:** O(1) status and phase lookup eliminates repeated linear scans during validation and rendering, where each pattern may reference multiple statuses.
    **Verified by:** Loaded workflow has status lookup map, Status lookup is case-insensitive, Loaded workflow has phase lookup map, Phase lookup is case-insensitive

    @function:createLoadedWorkflow @happy-path
    Scenario: Loaded workflow has status lookup map
      Given a valid workflow config with status "roadmap" and status "active"
      When I create a loaded workflow
      Then the status map should contain "roadmap"
      And the status map should contain "active"
      And the status map should have 2 entries

    @function:createLoadedWorkflow
    Scenario: Status lookup is case-insensitive
      Given a valid workflow config with status "Roadmap" and status "Active"
      When I create a loaded workflow
      Then the status map should contain "roadmap"
      And the status map should contain "active"

    @function:createLoadedWorkflow
    Scenario: Loaded workflow has phase lookup map
      Given a valid workflow config with phase "Inception" and phase "Construction"
      When I create a loaded workflow
      Then the phase map should contain "inception"
      And the phase map should contain "construction"
      And the phase map should have 2 entries

    @function:createLoadedWorkflow
    Scenario: Phase lookup is case-insensitive
      Given a valid workflow config with phase "Inception" and phase "Construction"
      When I create a loaded workflow
      Then the phase map should contain "inception"
      And the phase map should contain "construction"

  Rule: isWorkflowConfig type guard validates at runtime

    **Invariant:** isWorkflowConfig returns true only for values that conform to WorkflowConfigSchema and false for all other values including null, undefined, primitives, and partial objects.
    **Rationale:** Runtime type guards enable safe narrowing in dynamic contexts (config loading, API responses) where TypeScript compile-time types are unavailable.
    **Verified by:** Type guard accepts valid workflow config, Type guard rejects null, Type guard rejects partial config, Type guard rejects non-object

    @function:isWorkflowConfig @happy-path
    Scenario: Type guard accepts valid workflow config
      When I check isWorkflowConfig with a valid config
      Then isWorkflowConfig should return true

    @function:isWorkflowConfig @error-case
    Scenario: Type guard rejects null
      When I check isWorkflowConfig with null
      Then isWorkflowConfig should return false

    @function:isWorkflowConfig
    Scenario: Type guard rejects partial config
      When I check isWorkflowConfig with a partial config missing statuses
      Then isWorkflowConfig should return false

    @function:isWorkflowConfig
    Scenario: Type guard rejects non-object
      When I check isWorkflowConfig with the string "not a config"
      Then isWorkflowConfig should return false
