# Changelog

**Purpose:** Project changelog in Keep a Changelog format

---

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- **Lint Process CLI**: :ProcessGuardModule
- **Process State Types**: :MasterDataset
- **Process State API**: :FSMValidator
- **API Module**: Central export for the Process State API, providing a TypeScript
- **FSM Validator**: :PDR005MvpWorkflow
- **FSM Transitions**: :PDR005MvpWorkflow
- **FSM States**: :PDR005MvpWorkflow
- **FSM Module**: :PDR005MvpWorkflow
- **Process Guard Types**: :FSMValidator
- **Process Guard Module**: :FSMValidator,DeriveProcessState,DetectChanges,ProcessGuardDecider
- **Detect Changes**: :DeriveProcessState
- **Derive Process State**: :GherkinScanner,FSMValidator
- **Process Guard Decider**: :FSMValidator,DeriveProcessState,DetectChanges

---

## [Earlier]

### Added

- **Public API**: Main entry point for the @libar-dev/delivery-process package.
- **Workflow Config Schema**: Zod schemas for validating workflow configuration files that define
- **Tag Registry Configuration**: Defines the structure and validation for external tag taxonomy configuration.
- **Output Schemas**: Zod schemas for JSON output formats used by CLI tools.
- **Master Dataset**: Defines the schema for a pre-computed dataset that holds all extracted patterns
- **Generator Config Schema**: Zod schemas for declarative JSON-based generator configuration.
- **Extracted Pattern Schema**: Zod schema for validating complete extracted patterns with code,
- **Dual Source Schemas**: Zod schemas for dual-source extraction types.
- **Doc Directive Schema**: Zod schemas for validating parsed @libar-docs-* directives from JSDoc comments.
- **Codec Utils**: Provides factory functions for creating type-safe JSON parsing and serialization
- **Artefact Set Schema**: Defines the schema for artefact sets - predefined groupings of generators
- **DoD Validation Types**: Types and schemas for Definition of Done (DoD) validation and anti-pattern detection.
- **Validation Module**: Barrel export for validation module providing:
- **DoD Validator**: Validates that completed phases meet Definition of Done criteria:
- **Anti Pattern Detector**: Detects violations of the dual-source documentation architecture and
- **String Utilities**: Provides shared utilities for string manipulation used across the delivery-process package,
- **Utils Module**: Common helper functions used across the delivery-process package.
- **Pattern Id Generator**: Generates unique, deterministic pattern IDs based on file path and line number.
- **Collection Utilities**: Provides shared utilities for working with arrays and collections,
- **Pattern Scanner**: Discovers TypeScript files matching glob patterns and filters to only
- **Gherkin Scanner**: Scans .feature files for pattern metadata encoded in Gherkin tags.
- **Gherkin AST Parser**: Parses Gherkin feature files using @cucumber/gherkin and extracts structured data
- **TypeScript AST Parser**: Parses TypeScript source files using @typescript-eslint/typescript-estree
- **Renderable Utils**: Utility functions for document codecs.
- **Renderable Document**: Universal intermediate format for all generated documentation.
- **Universal Renderer**: Converts RenderableDocument to Markdown.
- **Document Generator**: Simplified document generation using codecs.
- **Lint Rules**: Defines lint rules that check @libar-docs-* directives for completeness
- **Lint Module**: Provides lint rules and engine for pattern annotation quality checking.
- **Lint Engine**: Orchestrates lint rule execution against parsed directives.
- **Generator Types**: Minimal interface for pluggable generators that produce documentation from patterns.
- **Generator Registry**: Manages registration and lookup of document generators (both built-in and custom).
- **Documentation Generation Orchestrator**: Orchestrates the complete documentation generation pipeline:
- **Codec Based Generator**: Adapts the new RenderableDocument Model (RDM) codec system to the
- **CLI Version Helper**: Reads package version from package.json for CLI --version flag.
- **Validate Patterns CLI**: Cross-validates TypeScript patterns vs Gherkin feature files.
- **Lint Patterns CLI**: Validates pattern annotations for quality and completeness.
- **Tag Taxonomy CLI**: Generates TAG_TAXONOMY.md from tag-registry.json.
- **Documentation Generator CLI**: Replaces multiple specialized CLIs with one unified interface that supports
- **CLI Error Handler**: Provides type-safe error handling for all CLI commands using the
- **Workflow Loader**: Loads and validates workflow configuration from JSON files in the catalogue.
- **Configuration Types**: Type definitions for the delivery process configuration system.
- **Tag Registry Loader**: Loads and validates tag registry configuration from external JSON files.
- **Regex Builders**: Type-safe regex factory functions for tag detection and normalization.
- **Configuration Presets**: Predefined configuration presets for common use cases.
- **Delivery Process Factory**: Main factory function for creating configured delivery process instances.
- **Configuration Defaults**: Centralized default constants for the delivery-process package.
- **Config Loader**: Discovers and loads `delivery-process.config.ts` files for hierarchical configuration.
- **Artefact Set Loader**: Loads and validates artefact set configurations from the catalogue directory.
- **Layer Inference**: Infers feature file layer (timeline, domain, integration, e2e, component)
- **Gherkin Extractor**: Transforms scanned Gherkin feature files into ExtractedPattern objects
- **Dual Source Extractor**: Extracts pattern metadata from both TypeScript code stubs (@libar-docs-*)
- **Document Extractor**: Converts scanned file data into complete ExtractedPattern objects with
- **Timeline Codec**: Transforms MasterDataset into RenderableDocuments for timeline outputs:
- **Shared Codec Schema**: Provides a simplified RenderableDocument output schema for use with
- **Session Codec**: Transforms MasterDataset into RenderableDocuments for session/planning outputs:
- **Requirements Codec**: Transforms MasterDataset into RenderableDocument for PRD/requirements output.
- **Reporting Codecs**: Transforms MasterDataset into RenderableDocuments for reporting outputs:
- **Pr Changes Codec**: Transforms MasterDataset into RenderableDocument for PR-scoped output.
- **Planning Codecs**: Transforms MasterDataset into RenderableDocuments for planning outputs:
- **Patterns Codec**: Transforms MasterDataset into a RenderableDocument for pattern registry output.
- **Rich Content Helpers**: Shared helper functions for rendering Gherkin rich content in document codecs.
- **Architecture Codec**: Transforms MasterDataset into a RenderableDocument containing
- **Adr Document Codec**: Transforms MasterDataset into RenderableDocument for Architecture Decision Records.
- **Transform Dataset**: Transforms raw extracted patterns into a MasterDataset with all pre-computed
- **Pipeline Module**: Barrel export for the unified transformation pipeline components.
- **Built In Generators**: Registers all codec-based generators on import using the RDM
- **Codec Generator Registration**: Registers codec-based generators for the RenderableDocument Model (RDM) system.
- **Codec Base Options**: Shared types, interfaces, and utilities for all document codecs.
- **PDR 001 Self Documentation**
- **ADR 005 Configurable Tag Prefix**: The delivery process uses `@libar-docs-*` as the default tag prefix for all metadata annotations.
- **ADR 004 Gherkin Only Testing**: The delivery-process package had dual test approaches creating inconsistency.
- **ADR 003 Ephemeral Persistent Separation**: Generated documentation mixed session-specific content with persistent docs.
- **ADR 002 Progressive Disclosure Architecture**: Single-file PRD documentation became unwieldy at scale.
- **ADR 001 Problem Solution Descriptions**: Feature descriptions in Gherkin files lacked consistent structure.
- **TypeScript Taxonomy Implementation**: As a delivery-process developer
- **Process Guard Linter**: During planning and implementation sessions, accidental modifications occur:
- **Phase State Machine Validation**: Phase lifecycle state transitions are not enforced programmatically despite being documented in PROCESS_SETUP.md.
- **Pattern Relationship Model**: Problem: The delivery process lacks a comprehensive relationship model between artifacts.
- **Mvp Workflow Implementation**: PDR-005 defines a 4-state workflow FSM (`roadmap, active, completed, deferred`)
- **Gherkin Rules Support**: Feature files were limited to flat scenario lists.

---
