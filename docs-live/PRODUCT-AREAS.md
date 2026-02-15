# Product Areas

**Purpose:** Product area overview index

---

## [Annotation](product-areas/ANNOTATION.md)

> **How do I annotate code?**

The annotation system is the ingestion boundary — it transforms annotated TypeScript and Gherkin files into `ExtractedPattern[]` objects that feed the entire downstream pipeline. Two parallel scanning paths (TypeScript AST + Gherkin parser) converge through dual-source merging. The system is fully data-driven: the `TagRegistry` defines all tags, formats, and categories — adding a new annotation requires only a registry entry, zero parser changes.

## [Configuration](product-areas/CONFIGURATION.md)

> **How do I configure the tool?**

Configuration controls what gets scanned, which tags are recognized, and how output is organized. Three presets define escalating taxonomy complexity — from 3 categories for simple projects to 21 for full DDD/ES/CQRS architectures. The `defineConfig()` function provides type-safe configuration following the Vite convention.

## [Generation](product-areas/GENERATION.md)

> **How does code become docs?**

The generation pipeline transforms annotated source code into markdown documents. It follows a four-stage architecture: Scanner → Extractor → Transformer → Codec. Codecs are pure functions — given a MasterDataset, they produce a RenderableDocument without side effects. CompositeCodec composes multiple codecs into a single document.

## [Validation](product-areas/VALIDATION.md)

> **How is the workflow enforced?**

Validation enforces delivery workflow rules at commit time using a Decider pattern. Process Guard derives state from annotations (no separate state store), validates proposed changes against FSM rules, and blocks invalid transitions. Protection levels escalate with status: roadmap allows free editing, active locks scope, completed requires explicit unlock.

## [DataAPI](product-areas/DATA-API.md)

> **How do I query process state?**

The Data API provides direct terminal access to delivery process state. It replaces reading generated markdown or launching explore agents — targeted queries use 5-10x less context. The `context` command assembles curated bundles tailored to session type (planning, design, implement).

## [CoreTypes](product-areas/CORE-TYPES.md)

> **What foundational types exist?**

Foundation types used across all other areas. The Result monad replaces try/catch with explicit error handling — functions return `Result.ok(value)` or `Result.err(error)` instead of throwing. DocError provides structured error context with type, file, line, and reason fields.

## [Process](product-areas/PROCESS.md)

> **How does the session workflow work?**

Process defines the session workflow and canonical taxonomy. Git is the event store; documentation artifacts are projections; feature files are the single source of truth. TypeScript source owns pattern identity (ADR-003), while Tier 1 specs are ephemeral planning documents that lose value after completion.
