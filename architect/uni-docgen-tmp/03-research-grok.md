**Practical, industry-standard approaches for building your "universal doc generator"** center on treating your annotated code + executable specs + hand-curated taxonomy (tags, attributes, relationships) as a **Single Source of Truth (SSOT)** model. From this, you generate ("project") multiple outputs: API responses (structured JSON/YAML), Markdown/docs, live diagrams, interactive UI views, and composable components.

The core patterns that match your key features (multi-source composition, one-source-multiple-audiences, verbosity/progressive disclosure control, domain-specific projection logic, and reduced duplication) are:

- **Single-source authoring/publishing** with structured reuse and conditional processing.
- **Model-Driven Engineering (MDE/MDA)** and **projectional systems** (central model → transformations/projections to artifacts).
- **Structured metadata/taxonomy management** (tags, attributes, relationships, traceability).
- **Docs-as-code pipelines** with modern static site generators and extensions for developer-friendly integration with annotated code.

These are proven in technical documentation (large enterprises, regulated industries, open-source projects), API ecosystems, safety-critical systems, and modeling tools. They directly support your goals while minimizing duplication through reuse, filtering, and generation rather than copying content.

### 1. DITA (Darwin Information Typing Architecture) — Gold Standard for Structured Doc Composition & Variants

DITA is an OASIS XML-based open standard specifically designed for **topic-oriented, reusable content** with single-sourcing, multi-audience outputs, and conditional processing.

**Core mechanics that map to your needs**:

- **Topics** as small, reusable units (concept, task, reference, etc.) — your annotated code snippets, spec examples, or taxonomy entries become topics.
- **Maps** (including bookmaps) for **multi-source document composition** — assemble larger docs from many topics (or generated fragments) without duplication.
- **Conditional processing** (profiling attributes like `audience`, `platform`, `product`, verbosity level + DITAVAL files) — one source → multiple audiences/verbosity levels (e.g., novice vs. expert, summary vs. full details). Content is filtered/included/excluded or styled differently at build time.
- **Specialization** — extend base elements for your custom taxonomy (tags, attributes, relationships, domain-specific elements).
- **Multi-channel publishing** via DITA-OT (Open Toolkit) or commercial tools: HTML, PDF, EPUB, help systems, etc. Relationships/linking are native.
- **CCMS (Component Content Management Systems)** often pair with it for managing the topic library as SSOT with versioning, search, and reuse.

**Fit for your SSOT (annotated code + executable specs + taxonomy)**: Generate DITA topics programmatically from parsed annotations/specs (or embed OpenAPI JSON directly — Oxygen XML has built-in support for this). Maintain hand-curated taxonomy as specialized DITA elements or metadata. Use maps + conditionals for audience/verbosity projections.

**Pros**: Mature, scalable for complex/reusable content, excellent duplication reduction via reuse + filtering, strong on relationships/traceability.  
**Cons**: XML authoring overhead (mitigated by editors like Oxygen XML or generating from your model); primarily prose-oriented (hybrid with generated code/API content works well).  
**When to choose**: Enterprise-scale docs needing heavy reuse, variants, and structured taxonomy. Many large orgs use it successfully for exactly "create once, publish many" with audience-specific outputs.

_Example DITA flow: Topics + Maps (in CCMS) transform to multiple outputs._

### 2. Projectional Editing & Language Workbenches (e.g., JetBrains MPS) — Native "Projections" from a Model

**Projectional editing** (pioneered/popularized in MPS) lets you edit a central **Abstract Syntax Tree (AST)/model** directly. The UI is a _projection_ of the model — you can have **multiple projections** (textual, tabular, diagrammatic, form-based, etc.) of the _same_ underlying structure. Generators then transform the model to outputs (code, Markdown, diagrams, JSON, etc.).

**Direct relevance**:

- Your taxonomy/entities/specs/relationships become the model (define a custom DSL or language in MPS).
- **Domain projection-based projection logic** — custom projections or generators per domain, audience, or verbosity level.
- **Multiple outputs from one source** without duplication: different notations/views + generators for Markdown docs, API JSON responses, live diagrams (graphical projections or generated Mermaid/PlantUML), UI descriptions/components.
- **Live diagrams & composable views** — MPS supports non-textual notations (diagrams, tables, math) natively; switch projections on the fly.
- Executable specs and annotated code can be imported/synced or modeled directly.

**Pros**: Extremely powerful for complex domains; true model-as-SSOT with no parsing ambiguity; excellent for reducing duplication via central model + smart generators.  
**Cons**: Steep learning curve and investment (language definition, generators); projectional editing feels different from plain text (though MPS mitigates with intentions/quick-fixes); best when you can model or import your specs rather than purely parsing existing annotated code in standard languages.  
**Proven use**: Embedded systems (mbeddr), insurance DSLs, requirements engineering, complex modeling.

_Example of projectional editing in MPS (structured model with multiple views/projections possible)._

This is one of the closest conceptual matches to your "domain projection-based projection logic" and multi-view generation.

### 3. Model-Driven Engineering (MDE/MDA) — Transformations from Central Model

Treat your annotated code + specs + taxonomy as (or transform into) a **formal model** (metamodel with entities, attributes, tags, relationships). Use **model-to-text (M2T)** or **model-to-model** transformations to generate all projections.

**Tools/patterns**:

- Eclipse EMF/Ecore (metamodeling) + Acceleo/Xtend or template engines for generators.
- SysML/UML profiles or custom metamodels for your taxonomy.
- Roundtrip or one-way sync with code annotations (via processors or importers).

**Fit**: Perfect for your verbosity control (conditional logic in transformations based on tags/attributes), audience-specific outputs (different transformation parameters/chains), domain-specific projections, diagrams (from relationship graphs), and API responses (structured exports). Reduces duplication because the model drives everything.

**Pros**: Systematic, traceable, automatable; scales to complex systems.  
**Cons**: Upfront metamodeling effort; sync with "live" annotated code requires robust parsing/importers.  
**Proven in**: Automotive, aerospace, embedded, data warehousing, safety-critical systems.

### 4. Practical Docs-as-Code Implementations with Taxonomy & Code Integration

For faster iteration while achieving similar features (especially if your team is developer-heavy):

- **AsciiDoc + Antora**: Lightweight markup with native **includes** (multi-source composition), **conditional processing** (`ifdef` based on attributes for audience/verbosity), attributes for customization, and excellent diagram support (Mermaid, PlantUML via extensions/Kroki). Antora excels at **multi-component** (multi-repo) sites from Git — ideal for modular docs. Multi-output via Asciidoctor. Popular in open-source/dev projects.

- **Sphinx (Python ecosystem) + autodoc + Sphinx-Needs (or Open-Needs)**:
  - Pulls directly from **annotated code/docstrings** (autodoc).
  - **Sphinx-Needs**: Define structured "needs" (requirements, specs, features, etc.) with **IDs, tags, custom attributes, status, and links/relationships** — exactly your hand-curated taxonomy. Creates traceability matrices, filtered views, and diagrams (needflow graphs). Supports safety standards.
  - Progressive disclosure via HTML (collapsibles) or multiple builds/filters.
  - Multiple builders/outputs; extensible for custom projections.

- **Docusaurus (React/MDX-based)**: Excellent for **composable UI views** (MDX lets you embed React components directly in docs). Pull data from your parsed model (JSON export of taxonomy/entities). Built-in tabs, accordions, versioning, search. Easy to add interactive diagrams (Mermaid) and custom filters for audience/verbosity. Great for "live" feel in web output and API-like JSON endpoints if you add a thin backend.

**Progressive disclosure & verbosity techniques** (common across these):

- Build-time: Conditionals/filters (DITA DITAVAL, AsciiDoc `ifdef`, template `if` based on tags/attributes, Sphinx-Needs filters).
- Content structuring: Layered topics (overview vs. detail) or "lite/full" map variants.
- Runtime (HTML/UI): Accordions, `<details>`, tabs, "show more", progressive loading, user-preference filters (JS + model data). This keeps primary views clean while allowing depth on demand.
- Domain projection: Query/filter the model by domain tags/attributes before rendering.

**Code integration patterns** (your annotated code + executable specs):

- Parse annotations (Java Annotation Processing, Python `ast` + custom tags/docstrings, TS TSDoc/doctrine, etc.) + executable specs (Gherkin/Cucumber parsers) into a unified internal model (Pydantic/Zod schemas, graph, or RDF).
- Or use spec-first (e.g., generalize OpenAPI pattern): Define structured specs/taxonomy as the authoritative artifact; generate code + docs.
- Sphinx-Needs or custom pipelines bridge code and structured taxonomy beautifully.

### Recommended Solution Space Assessment & Hybrid Path for Your Universal Doc Generator

**Best fit depends on scale and team**:

- **Heavy reuse + structured taxonomy + enterprise**: Start with **DITA** (or hybrid generate DITA fragments) + CCMS. Add code/API integration via transforms (e.g., OpenAPI → DITA).
- **Complex domains + true multiple projections/views + diagrams**: **MPS** or MDE stack for the modeling/projection core.
- **Developer-friendly, fast iteration, code integration, composable UI**: **Sphinx + Sphinx-Needs** (for taxonomy/relationships) **or Docusaurus/Antora** (for composition + modern UI). Layer a central model layer (parsed annotations + taxonomy graph) that feeds generators.
- **Universal/hybrid**: Build a **lightweight internal model** (from your SSOT sources) + projection layer (templates + logic or transformations). Use Docusaurus/Antora/Sphinx for the doc/UI surface, with custom generators for API responses (JSON projections), diagrams (Mermaid from relationships), and composable components.

**Key techniques to implement your features**:

- **Multi-source composition**: Maps/includes (DITA/Antora), modular components, or model composition.
- **One-source → multiple audiences/outputs**: Conditionals + multiple build profiles/generators + client-side filtering.
- **Verbosity control & reduced duplication**: Conditionals/filters (build-time) + progressive disclosure patterns (runtime) + reuse via references/includes + model-driven generation (no copy-paste).
- **Domain projection logic**: Model queries/filters or dedicated generator strategies per domain/tag set.
- **Live diagrams**: Generate Mermaid/PlantUML syntax from relationship graph traversal; embed in outputs (interactive in web UIs).
- **API responses & UI views**: Structured exports from model queries; interactive web docs with filters/search; embed composable React/web components (Docusaurus MDX shines here).
- **Executable specs integration**: Parse into needs/topics or model elements; generate reports/tests/docs from them.

**Additional proven elements**:

- Graph-based or queryable model for relationships (traversal for diagrams, filtering for projections).
- Traceability (links between specs, code annotations, docs, tests) — Sphinx-Needs or DITA linking excels.
- Versioning + Git-native workflows (docs-as-code tools).
- For very advanced: Combine with knowledge graph tech (RDF/OWL + SPARQL for rich taxonomy queries) or GraphQL layer for dynamic projections.

These approaches are widely adopted and battle-tested. Many organizations combine them (e.g., generate structured content from code/models into DITA or AsciiDoc, then compose/publish with conditionals).

**Next steps for you**: Prototype a small pipeline — parse a subset of your annotations/taxonomy into a simple model (e.g., Python dataclasses or JSON), then generate 2-3 projections (Markdown overview, filtered "novice" version, Mermaid diagram of relationships, sample JSON API response). Evaluate Docusaurus/Sphinx-Needs or Antora for the output layer first (quickest wins), then layer in heavier modeling (MPS/MDE) or DITA if reuse/scale demands it.

This gives you a solid, practical design space assessment grounded in industry standards. If you share more details about your primary languages, scale, or specific constraints (e.g., existing tools, team skills), I can refine recommendations or help sketch a concrete architecture/pipeline.
