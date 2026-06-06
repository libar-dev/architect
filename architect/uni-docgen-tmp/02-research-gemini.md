# Universal Document Generator Design Space

## Architecting the Universal Projection Engine: Deriving Composable Documentation, UIs, and Live Diagrams from a Single Source of Truth

### Introduction to the Universal Projection Paradigm

In the modern landscape of software engineering and enterprise information architecture, the disconnect between source code, system specifications, and user-facing documentation creates a critical bottleneck. Traditional documentation processes rely on disparate systems and isolated toolchains, leading to fragmented change management, rampant data duplication, and the rapid deprecation of institutional knowledge.[1] As computing resources and microservices are distributed over vast, decentralized technology landscapes, the risk of misaligned documentation grows exponentially.[1] To resolve this, organizations are migrating toward a Single Source of Truth (SSoT) architecture—a practice in which every data element, from behavioral logic to descriptive prose, is mastered and edited in exactly one place.[2]

When treating annotated code and executable specifications as an SSoT, the engineering challenge shifts fundamentally from authoring static documentation to projecting dynamic views. A "universal document generator" operates not as a mere static site builder, but as a complex, domain-aware projection engine. It ingests an interconnected taxonomy of hand-curated tags, attributes, and structural relationships directly from the codebase, applying domain-specific logic to project materialized views. These generated views serve multiple distinct audiences through highly optimized formats, including Application Programming Interface (API) responses, composable Markdown documentation, interactive React User Interfaces (UIs), and live, zoomable architectural diagrams.[3]

This comprehensive research report provides an exhaustive analysis of the design and solution space for implementing such a system. It evaluates the architectural principles of Command Query Responsibility Segregation (CQRS) and Event Sourcing as they apply to documentation and knowledge management.[4] It details the extraction of metadata via Abstract Semantic Graphs (ASGs) and Tree-sitter parsing, the structural governance provided by domain modeling languages like CUE and AWS Smithy, and the multi-source composition of audience-targeted outputs using frameworks such as Markdoc and the Darwin Information Typing Architecture (DITA).[5] Finally, it examines the cognitive principles of progressive disclosure and verbosity control, particularly their implementation in structural diagrams via the C4 model, ensuring that complex architectures can be communicated without cognitive overload.[9]

### The Philosophy and Mechanics of the Single Source of Truth

To fully realize a universal document generator, the foundational concept of the Single Source of Truth must be rigorously defined and structurally enforced. Historically, information technology relied on centralized computing where programs, data, compilers, and documentation all resided on a single mainframe.[1] The modern shift to distributed architectures and microservices dismantled this centralization, leading to the proliferation of siloed knowledge bases, conflicting document versions, and information overload.[1] A true SSoT reverses this fragmentation by designating one authoritative repository—in this use case, the annotated codebase and its executable specifications—where all information is mastered.[2]

#### Taxonomic Governance and Metadata Overlays

An SSoT is only as powerful as the taxonomy used to organize it. In a code-driven SSoT, the source code itself is heavily augmented with a hand-curated taxonomy of tags, annotations, and attributes. These annotations describe various properties, execution contexts, and relationships that are not inherently required for code compilation but are vital for human understanding and system documentation.[12]

This taxonomy transforms raw code into a rich knowledge graph. Establishing a reasonable taxonomy and information architecture presents a significantly more difficult challenge than the actual assignment of conditional markup.[12] Architects must determine which attributes to create (e.g., audience type, risk level, system domain), what values they should accept, and how these attributes might combine to generate the specific variants and outputs required by different stakeholders.[12] Once this taxonomy is established, the codebase ceases to be merely a set of instructions for a machine; it becomes a comprehensive database of organizational knowledge.

#### SSoT Architectural Patterns

Implementing an SSoT architecture requires specific strategies for managing reads, writes, and updates to ensure absolute data normalization and prevent inconsistencies. Several scenarios dictate how data is handled within an SSoT:

| SSoT Pattern                  | Mechanism                                                                                                                                       | Application in Documentation Generation                                                                                                           |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Direct Reference**          | Master data is never copied; all reads and updates interact directly with the central repository.[2]                                            | Documentation generators read directly from the source code repository at build time, ensuring zero duplication.                                  |
| **Read-Only Replicas (CQRS)** | Master data is copied to read-only models; all updates apply only to the master data.[2]                                                        | The universal doc generator compiles source annotations into highly optimized, read-only materialized views (e.g., UI elements, API schemas).[13] |
| **Reconciled Copies**         | Master data is copied, and copies can be updated, requiring complex consensus algorithms (e.g., manual Git merges or blockchain strategies).[2] | Developers update documentation via Git pull requests, merging changes back into the authoritative main branch.[2]                                |

By adhering to the _Read-Only Replicas_ pattern, the universal document generator acts as a query interface, reading from the SSoT without ever risking the corruption of the underlying executable specifications. This explicitly paves the way for the adoption of CQRS as the primary architectural pattern for the projection engine.

### Command Query Responsibility Segregation (CQRS) and Event Sourcing as the Generative Engine

To comprehend how a single source of truth can effectively generate diverse, audience-specific outputs without code duplication, the principles of Command Query Responsibility Segregation (CQRS) and Event Sourcing must be adapted to knowledge management and document generation.[4] Modern systems must deliver speed, correctness, and smooth user experiences even as business rules become infinitely more complex; CQRS and Event Sourcing are uniquely positioned to handle this scale.[4]

#### Separating the Write Model from the Read Model

In traditional architectures, the system that stores information is often the same system optimized to read and display it. For example, a single database table might handle both the insertion of new orders and the complex querying required for user dashboards.[4] This monolithic approach inevitably fails because a schema optimized for execution or transactional storage is rarely optimized for human consumption or complex analytical queries.[4]

CQRS resolves this tension by explicitly segregating the command operations (writes) from the query operations (reads).[4] Within the context of a universal document generator, the "Write Model" consists of the hand-curated taxonomy, the source code, and the executable specifications.[3] This model enforces strict domain rules, static typing, and structural integrity. Conversely, the "Read Models" are the projections: the generated API responses, the compiled HTML documentation, the composable Markdoc abstractions, and the interactive UI views.[14]

By segregating these responsibilities, the read models can scale independently from the source code.[13] A UI view can utilize a highly denormalized, query-optimized JSON schema, while the write model remains a strictly normalized, deeply nested Abstract Syntax Tree within the codebase. This separation ensures that the focus of developers remains entirely on accurately capturing system behaviors and domain events, completely isolated from the added complexity of how that data should ultimately be queried or displayed to end-users.[15]

#### Event Sourcing and Materialized Views

Event Sourcing acts as the perfect architectural companion to CQRS. In an event-sourced architecture, every state change within the system is recorded as an immutable event in an append-only sequence.[16] In a documentation pipeline, these events are analogous to codebase commits, schema alterations, or updates to the curated taxonomy.

A projection module operates by subscribing to this sequence of events.[14] It processes each domain event in order, updating a "materialized view" asynchronously.[14] Because the source of truth (the event store or version control history) is immutable, projections are inherently deterministic functions of the application's state.[14]

This architecture provides unparalleled flexibility. If a new audience is identified—for example, a sudden business requirement to generate a specialized compliance and audit report from the existing codebase—a new read-only replica or materialized view can be generated simply by replaying the historical events through a new set of projection logic.[13] This eliminates any need to alter the original source code or hand-curated taxonomy to support the new output format, completely preserving the integrity of the SSoT.[15] Furthermore, tracking objects and application subscriptions allow the generator to resume processing exactly from the last processed commit, ensuring that documentation builds are incremental, fast, and robust.[14]

However, architects must account for eventual consistency.[13] Because the write and read data stores are separated, and because documentation generation pipelines require build time, there is a natural delay between a codebase update and the reflection of that update in the final projected UI or diagram.

### Information Extraction: From AST to Semantic Knowledge Graph

Before projections can occur, the universal document generator must accurately ingest the SSoT. This requires parsing the annotated code, extracting human-readable comments, identifying cross-module relationships, and building an intermediate representation that the projection engine can query efficiently.

#### The Limitations of Abstract Syntax Trees (AST)

Traditional parsers build an Abstract Syntax Tree (AST), which maps the strict syntactic structure of the code. For example, the expression `a + b` is represented as a binary operation node with `a` and `b` as its children.[18] ASTs are heavily utilized for code refactoring, code generation, and static analysis because they are relatively easy to generate using standard parsing techniques.[18]

However, real-world software does not operate in isolation. It consists of a massive web of interconnected relationships, polymorphic dependencies, and data flows that span multiple files, disparate modules, and even entirely different programming languages.[19] An AST is intrinsically bound to the syntax of a single file. When a documentation generator attempts to build a comprehensive view of a system solely from isolated ASTs, it lacks the context required to understand how a specific component interacts with the broader architecture.

#### Constructing the Abstract Semantic Graph (ASG)

To support complex domain projections and repository-level context, the isolated ASTs must be merged and enriched into an Abstract Semantic Graph (ASG), also referred to as a Semantic Knowledge Graph.[18]

| Feature                   | Abstract Syntax Tree (AST)                                                  | Abstract Semantic Graph (ASG) / Semantic Knowledge Graph                                    |
| :------------------------ | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **Fundamental Structure** | Hierarchical Tree.[18]                                                      | Directed Graph.[18]                                                                         |
| **Primary Focus**         | Syntactic structure of individual code units (statements, expressions).[18] | Semantic relationships, inheritance, and inter-file dependencies.[18]                       |
| **Typical Use Cases**     | Compilation, static analysis, formatting, localized code generation.[18]    | Program understanding, system verification, Graph-based RAG, system-wide documentation.[18] |
| **Scope of Locality**     | Strictly file-bound.                                                        | Repository-level or system-wide scope.[19]                                                  |

In an ASG, nodes represent high-level semantic entities—such as variables, functions, interfaces, or documentation blocks—and edges denote the specific relationships between these entities (e.g., "implements," "calls," "is documented by").[18] By representing the codebase as a unified knowledge graph, the documentation generator can track inter-file modular dependencies and ensure narrative consistency across the entire projected system.[23]

This graph-based approach adheres to the "locality of change principle." This principle posits that the vast majority of codebase modifications affect only a highly localized portion of the overall semantic graph.[24] Therefore, when a developer commits a change, the projection engine does not need to re-parse the entire repository. It identifies and updates only the affected regions of the graph, enabling highly efficient, sub-millisecond updates to the intermediate representation, allowing the graph engine to index thousands of files per second.[19]

Furthermore, embedding semantic knowledge graphs into the generation pipeline drastically improves integration with Large Language Models (LLMs) and AI agents. Traditional Retrieval-Augmented Generation (RAG) relies on simple vector search, which often retrieves contextually irrelevant snippets. Graph RAG leverages the ASG to follow logical paths in the data—for instance, linking a specific function to its parent class, its parameters, and related domain concepts in the documentation.[21] This structured retrieval ensures that if AI is utilized for summarizing or expanding documentation, its outputs are highly accurate, grounded in the actual architecture, and constrained by the system's explicit ontology.[21]

#### Extracting Annotations with Tree-sitter

To populate this semantic graph, the system requires highly performant parsing tools capable of identifying both structural code and hand-curated metadata tags. Tree-sitter has emerged as an industry-standard, incremental parsing library that generates robust ASTs and provides a powerful, Lisp-like query language (`.scm` files) specifically designed to extract targeted information.[26]

Tree-sitter queries allow developers to extract comments, annotations, and metadata by defining patterns over node types.[26] These queries utilize "predicates" to conditionally capture nodes that meet specific metadata criteria. For example, a projection engine searching for documentation annotations can use predicates such as `#eq?` to check for exact property matches, `#match?` to apply regular expression comparisons across multi-line comment blocks, `#any-of?` to match against a curated list of acceptable taxonomy tags, or `#is-not?` to verify the deliberate absence of certain restrictive tags.[26]

Furthermore, Tree-sitter supports "directives" like `#set!` that can physically inject metadata into the capture during the parsing phase. This allows the parser to automatically classify a comment block as a specific type of documentation (e.g., tagging a node with `injection.language "doxygen"` or marking a struct as an `API_Endpoint`) without requiring the developer to write redundant boilerplate.[27] This precise, query-driven extraction forms the foundational layer of the intermediate ASG, ensuring that all hand-curated tags are preserved and cleanly organized for the subsequent projection engine.

### Multi-Source Composition and AST Grafting

The core philosophy enabling modern projection pipelines is "Docs as Code" (or "Docs as Data"). This practice advocates that documentation should be authored, version-controlled, reviewed, and tested using the exact same workflows and tools as software development.[28] When writers and developers integrate closely, documentation quality improves, and automated tests can block the merging of new features if they lack corresponding documentation.[28]

However, a truly universal document generator must accomplish multi-source document composition. This involves dynamically fusing human-authored prose (often written in Markdown or a similar format) with live code artifacts, executable specifications, and configuration files. Achieving this without manual copy-pasting—which inevitably leads to code duplication and drift—requires sophisticated techniques like AST grafting and merging.[30]

#### The Mechanics of AST Merging

In compiler design and static analysis, AST merging is utilized to combine sequences of operations into a single execution context (such as loop merging or composite folding).[31] In the context of document composition, this concept is adapted to fuse disparate document sources.

By utilizing the Tree-sitter ASTs mentioned previously, a document generator can pinpoint an annotated struct, function, or executable specification within the source code. The generator extracts this specific entity, constructs a localized AST representing it, and seamlessly grafts it into the AST of the destination Markdown document.[31]

Because the projection operates at the AST level rather than executing simple string replacements, the system inherently understands the structure of the injected code. It can automatically strip out internal debugging comments, highlight specific variables referenced in the prose, or reformat the code block to match the styling guidelines of the target UI. This abstraction guarantees that the UI or documentation view embeds executable specs and live code that are perfectly accurate, because the source code is the AST embedded in the document. The abstraction relies on the fusion of human-authored prose with deterministically extracted code fragments, creating a unified, multi-modal narrative that is intrinsically resilient to code drift.[30]

### Domain Modeling and Structural Projection Logic

Once the codebase is parsed and the semantic graph is established, the system must apply rigorous, domain-specific projection logic to filter, combine, and validate the data before it reaches the rendering phase. A universal doc generator cannot simply output raw data; it must enforce structural rules. Two preeminent technologies currently address this solution space: CUE (Configure Unify Execute) and AWS Smithy.

#### CUE: The Value Lattice and Commutativity

CUE is an open-source data validation language and inference engine uniquely suited for multi-source composition, code generation, and schema validation.[33] Unlike purely data-driven standards such as JSON Schema, CDDL, or OpenAPI—which strictly separate schemas from concrete values—CUE utilizes a revolutionary mathematical paradigm where both types and values are ordered within a single hierarchy known as the "value lattice".[7]

In this theoretical framework, a typed feature structure (TFS) subsumes (denoted `⊑`) if `A` represents a more specific, restrictive instance of `B`.[7] Because all values exist on this lattice, validation becomes mathematically synonymous with subsumption.[7] This provides several critical, unparalleled advantages for a universal doc generator:

1. **Additive Constraints and Commutativity**: CUE's logic is fundamentally commutative, associative, and idempotent.[7] This means that constraints, taxonomy tags, and structural definitions can be extracted from multiple disparate sources—such as Go source code, Protobuf files, and localized policy documents—and combined in any order.[33] The unified result will always be identical, completely eliminating race conditions, ordering dependencies, or conflicts during multi-source composition.[7]
2. **Native Backwards Compatibility Verification**: Because schemas and values share the same lattice, evaluating whether a newly generated API schema or document structure breaks compatibility with a previous version is as simple as evaluating a mathematical inequality. If the new schema subsumes the old schema (i.e., it relaxes constraints or adds purely optional fields), it is definitively backwards compatible.[7] If it explicitly disallows a previously allowed field, it fails validation instantly.[7]
3. **Automatic Redundancy Reduction**: When fusing annotations from dozens of developers across a massive semantic graph, redundancy is inevitable. CUE’s logical inference engine automatically processes these piled constraints and reduces them to their absolute simplest "normal form," optimizing the data representation before it is exported.[7]

CUE acts as an ideal "interlingua" in a projection pipeline.[34] It extracts definitions from existing Go or Protobuf sources (including constraints embedded in struct tags like `[(cue.val) = ">5000"]`), unifies them into a coherent structural model, and natively exports them to industry standards like OpenAPI or JSON Schema for downstream UI consumption.[34]

#### AWS Smithy: View Filtering and Projection Artifacts

AWS Smithy provides an alternative, highly opinionated framework for structural projection.[36] Designed at Amazon as a protocol-agnostic Interface Definition Language (IDL), Smithy is optimized for massive-scale API modeling, automated server scaffolding, SDK generation in multiple languages, and documentation projection.[37]

Smithy’s primary advantage for universal document generators lies in its built-in projection system, configured via a `smithy-build.json` file.[39] The Smithy CLI allows software architects to define a primary, massive SSoT model and then apply localized "transforms" to filter or alter the model based precisely on the target audience.[36]

For example, an organization can maintain a single cohesive model containing both highly sensitive internal debugging operations and external customer-facing endpoints. Through Smithy transforms, a projection named `external` can be explicitly configured to filter out all shapes, traits, and documentation strings marked with an `@internal` tag.[37] During the build process, the CLI processes the AST and outputs artifacts tailored strictly for the external audience.[41] This maintains absolute SSoT integrity while physically preventing internal data from ever leaking into public documentation, API gateways, or client SDKs.[36]

#### Comparative Analysis of Structural Projection Languages

| Feature / Capability     | CUE                                                     | AWS Smithy                                                                     | OpenAPI (Baseline)                                    |
| :----------------------- | :------------------------------------------------------ | :----------------------------------------------------------------------------- | :---------------------------------------------------- |
| **Core Paradigm**        | Unified value lattice (Types = Values).[7]              | Protocol-agnostic IDL built for codegen.[38]                                   | Purely data-driven interchange schema.[42]            |
| **Multi-Source Logic**   | Commutative constraint combination.[7]                  | Model composition via extensible traits.[37]                                   | `$ref` based external includes.[43]                   |
| **Projection Mechanism** | Mathematical subsumption, inference, and extraction.[7] | Transforms and filters defined in `smithy-build.json`.[39]                     | Requires complex, bespoke external tooling.[7]        |
| **Validation**           | Native, programmatic backwards-compatibility checks.[7] | Built-in constraints (`@required`, `@length`) and custom model validators.[37] | External third-party schema validation utilities.[43] |

### One Source, Multiple Audiences: Audience-Targeted Projections

With the raw data modeled, validated, and combined into a cohesive semantic graph, the universal doc generator must transform the intermediate representation into final user outputs (interactive UIs, standard Markdown, offline PDFs). To successfully achieve "one-source-multiple-audiences" without resorting to maintaining duplicate files, sophisticated conditional processing and custom rendering pipelines are absolutely essential.

#### Markdoc: AST-Driven Component Rendering for UIs

Developed internally by Stripe to power their industry-leading developer documentation, Markdoc represents a paradigm shift in how Markdown is utilized for enterprise publishing.[6] Unlike traditional Markdown variants, Markdoc parses content into a heavily customizable Abstract Syntax Tree, allowing developers to define custom syntax tags, complex attributes, and deep validation logic.[6]

Markdoc was architected under the strict philosophy of "Docs as Data," deliberately contrasting with frameworks like MDX.[48] While MDX permits arbitrarily complex JavaScript logic and React imports to be embedded directly into Markdown files, this blurs the line between content and code, making documents impossible to statically validate and difficult for non-engineers to edit.[47] Markdoc explicitly separates content from logic. Authors write declarative, HTML-like tags (e.g., `{% callout type="warning" %}`), and the Markdoc framework statically validates these tags against a strongly-typed schema defined by developers before rendering.[6]

The Markdoc pipeline consists of three explicit, highly modular steps:

1. **Parse**: The document is tokenized using the `markdown-it` library to construct the initial AST.[6]
2. **Transform**: The AST is processed against a configuration object. During this phase, custom attributes are validated (e.g., ensuring a `type` attribute only accepts "note" or "warning"), variables are resolved, and the nodes are transformed into a serializable, intermediate "Renderable Tree".[6]
3. **Render**: The Renderable Tree is passed to a specific renderer. Because the tree is entirely decoupled from the final output format, the exact same Markdoc source can be passed to a React renderer to generate an interactive UI with tab switchers and collapsible sections, passed to an HTML renderer to output static strings, or passed to a custom mobile framework for native app display.[6]

This extreme decoupling makes Markdoc exceptional for universal projection architectures. The semantic graph generated from the SSoT can dynamically construct Markdoc ASTs on the fly, which are then rendered differently depending on whether the target audience is viewing a React-based web UI or reading a static Markdown file in a GitHub repository.[50]

#### DITA and Sphinx: Advanced Conditional Processing

While Markdoc excels at component composition and UI generation, traditional technical writing frameworks like DITA (Darwin Information Typing Architecture) and Sphinx focus explicitly on conditional visibility—the ability to filter specific paragraphs, sections, or chapters based on the defined audience profile.

In DITA, content authors apply metadata attributes directly to XML elements. Common attributes include `@audience`, `@platform`, and `@product`.[12] For example, a single topic might contain a paragraph tagged `<p audience="expert" platform="windows">`. When generating the documentation, the architect utilizes a `DITAVAL` profile—a conditional processing file that strictly defines which attribute values should be included, excluded, or flagged during the specific build process.[12]

Furthermore, DITA supports highly advanced transclusion mechanisms through the `@conref` (content reference) and `@conkeyref` attributes.[5] These attributes allow content blocks to be dynamically pulled from other topics. Consequently, a beginner-targeted document and an advanced-targeted document can both pull from the exact same central definition file; the `DITAVAL` profile simply determines which specific paragraphs are injected into which document, entirely eliminating code duplication.[5]

Similarly, the Sphinx documentation generator (the standard within the Python ecosystem) relies on the `.. only::` directive for conditional output.[54] Authors can wrap specific content blocks in directives such as `.. only:: internal` or `.. only:: html`.[55] During the build phase, the Sphinx compiler evaluates these tags and conditionally excludes the blocks from the final output.[55] However, unlike Markdoc's strict, early-stage AST validation, Sphinx historically processes only directives late in the build pipeline. This architectural quirk can occasionally lead to excluded content accidentally leaking into global search indexes or tables of contents, presenting a risk when projecting highly sensitive SSoT data to public audiences.[56]

| Framework   | Primary Composition Mechanism           | Content/Logic Separation    | Audience Filtering Mechanism                                                           |
| :---------- | :-------------------------------------- | :-------------------------- | :------------------------------------------------------------------------------------- |
| **Markdoc** | Custom AST Tags & Modular Renderers.[6] | Strict (Docs as Data).[48]  | Declarative schema tags, custom AST transformations, dynamic React/HTML rendering.[50] |
| **MDX**     | Embedded JSX logic.[48]                 | Blended (Docs as Code).[47] | Inline JavaScript conditionals.[49]                                                    |
| **DITA**    | XML Transclusion (`@conref`).[5]        | Strict (XML Schemas).[12]   | `DITAVAL` profiles matching `@audience`/`@product` element attributes.[52]             |
| **Sphinx**  | ReStructuredText Includes.              | Strict (RST Directives).    | `.. only::` tags evaluated during the build execution.[55]                             |

### Verbosity Control and Progressive Disclosure

A primary challenge in utilizing an SSoT for comprehensive documentation is the immediate threat of information overload. If a single codebase serves as the authoritative source for both high-level business logic and granular, low-level execution details, projecting all of it simultaneously will completely overwhelm the user.[11] Effective verbosity adjustment and control are achieved through a UI/UX and cognitive architectural pattern known as "Progressive Disclosure."

Progressive disclosure is the practice of revealing system complexity gradually, ensuring the user is initially presented only with information relevant to their immediate task or high-level understanding.[9] As the user interacts with the system, they can request deeper levels of detail. This approach minimizes cognitive load, prevents visual UI clutter, and drastically reduces the perceived complexity of a massive system.[9]

#### Implementation in User Interfaces and AI Contexts

In modern UI design frameworks such as PatternFly, progressive disclosure is frequently implemented via conditional form fields and expandable components. A "parent control" dictates the visibility of heavily indented child fields; if the parent toggle is activated, a specific subset of relevant options becomes visible.[9] This visually prevents users from spending time parsing options that are irrelevant to their current operational state.[9]

This crucial cognitive concept has naturally extended to AI agents and the Model Context Protocol (MCP). When exposing massive, comprehensive APIs (like Kubernetes interfaces, cloud SDKs, or entire SSoT knowledge graphs) to Large Language Models (LLMs), injecting the entire API schema into the context window causes severe "context pollution".[59] Context pollution wastes attention budgets, increases query latency, and frequently causes the LLM to hallucinate or lose the core prompt.[59]

To mitigate this, advanced RAG systems utilize progressive disclosure patterns, providing the model with a highly compressed, lightweight metadata index first (Layer 1). The agent is then allowed to dynamically decide to request detailed schemas (Layer 2) or retrieve deep source code files (Layer 3) only when the task explicitly requires it.[60] This mirrors human cognitive processing—scanning headlines before reading articles—and represents the gold standard for projecting SSoT data to autonomous systems.[60]

#### Interactive Diagramming and the C4 Model

For architectural documentation, live diagrams, and visual system representations, progressive disclosure is elegantly formalized and standardized by the C4 Model, created by Simon Brown.[10] The C4 model prevents software diagrams from devolving into incomprehensible, overloaded webs of boxes and lines by establishing a strict, four-level hierarchical abstraction framework [10]:

1. **System Context (Level 1)**: Illustrates the macro view. It shows how users, personas, and completely external systems interact with the core software system, stripped of all technical implementation details.[10]
2. **Container (Level 2)**: Zooms one level deep into the system to reveal independently deployable applications, databases, file systems, and microservices.[10]
3. **Component (Level 3)**: Zooms into a specific container to display its constituent components, internal APIs, and their interactions.[10]
4. **Code (Level 4)**: Zooms into a specific component to show the underlying code elements (e.g., UML class diagrams or database entity models). In practice, this level is frequently omitted from manual drawing because it changes too rapidly and is better suited for automatic generation from the SSoT.[10]

By strictly adhering to this framework, an architecture diagram provides a cohesive visual narrative that scales effortlessly from non-technical business stakeholders (Level 1) down to deep-level engineering teams (Level 3 and 4).[10]

Crucially, within a universal document generator, C4 diagrams should never be drawn manually. Instead, they are programmatically projected directly from the Semantic Knowledge Graph. Dedicated diagramming tools and DSLs (Domain Specific Languages) like Structurizr and IcePanel ingest the structural relationships, tags, and dependencies defined in the SSoT, automatically rendering interactive, highly dynamic diagrams.[62]

Because these diagrams are natively rendered in the browser, users can physically double-click high-level components to "zoom in" through the abstraction layers.[63] Furthermore, these platforms support dynamic views, allowing architects to overlay specific API flows, security boundaries, or deployment environments onto the existing structures without having to draw entirely new diagrams.[62] Because every box and line is projected directly from the underlying code taxonomy, any codebase change or tag update instantly updates all visual models. This achieves absolute diagrammatic fidelity, eliminates the risk of outdated architecture documentation, and perfectly satisfies the requirement for verbosity adjustment and zero code duplication.

### Synthesizing the Universal Document Generator

The conceptualization and implementation of a universal document generator demands a fundamental architectural shift in how an organization perceives, stores, and distributes documentation. By completely abandoning static files, disconnected wikis, and manual diagramming, and instead embracing a strict, projection-based architecture, documentation evolves from a burdensome chore into a highly deterministic, automated output of the system's true state.

The optimal solution space for this implementation relies on the careful integration of several advanced engineering paradigms:

First, the core codebase, augmented with executable specifications and a rigorous, hand-curated taxonomy of tags, must be established as the absolute, immutable Single Source of Truth. This operates as the strict Write Model, structurally supported by CQRS and Event Sourcing patterns, allowing asynchronous modules to construct Read Model projections without risking the integrity of the source.

Second, the information extraction layer must move beyond simple file-bound Abstract Syntax Trees. Utilizing advanced, incremental parsing engines like Tree-sitter, the system must extract metadata and relationships to construct a repository-wide Abstract Semantic Graph. This ASG provides the necessary relational context required for accurate multi-source composition, AST grafting, and AI-driven retrieval.

Third, structural integrity must be maintained by domain modeling languages. Leveraging the mathematical commutativity of the CUE value lattice or the transformative filtering capabilities of AWS Smithy, the architecture can safely combine multi-source data, validate backwards compatibility, and filter internal APIs from external audiences.

When projecting this unified data into human-readable formats, frameworks like Markdoc and DITA provide the necessary decoupling of content from presentation. Utilizing conditional processing attributes and AST-driven rendering logic, a single semantic graph can generate disparate, highly optimized views—be it static Markdown, interactive UIs, or API specifications—tailored for unique audiences.

Finally, cognitive load must be managed through the strict implementation of progressive disclosure. Whether implemented via conditional UI fields in PatternFly, contextual LLM prompting, or interactive, zoomable C4 model diagrams generated by Structurizr and IcePanel, controlling verbosity ensures that users receive precise, actionable insights. By uniting these technologies, an organization can achieve a fully composable, self-updating documentation ecosystem that perfectly reflects reality, eliminating duplication and forever banishing the threat of outdated knowledge.

---

### Works Cited

1. [Implementing single source of truth in an enterprise architecture - Red Hat](https://www.redhat.com/en/blog/single-source-truth-architecture), accessed June 6, 2026
2. [Single source of truth - Wikipedia](https://en.wikipedia.org/wiki/Single_source_of_truth), accessed June 6, 2026
3. [What Is a Single Source of Truth and How to Build One for Seamless Data Management](https://strapi.io/blog/what-is-single-source-of-truth), accessed June 6, 2026
4. [Understanding CQRS and Event Sourcing: A Practical Guide for Modern Systems (With Examples) | by TechnoCraft | Medium](https://medium.com/@TechnoCraft/understanding-cqrs-and-event-sourcing-a-practical-guide-for-modern-systems-with-examples-2a4d9a9d7e4f), accessed June 6, 2026
5. [How are conditional processing attributes defined in DITA? - Stilo](https://www.stilo.com/dita-xml-faqs/how-are-conditional-processing-attributes-defined-in-dita/), accessed June 6, 2026
6. [What is Markdoc?](https://markdoc.dev/docs/overview), accessed June 6, 2026
7. [Schema Definition use case - CUE](https://cuelang.org/docs/concept/schema-definition-use-case/), accessed June 6, 2026
8. [Nodes - Markdoc](https://markdoc.dev/docs/nodes), accessed June 6, 2026
9. [Progressive Disclosure - PatternFly](https://pf3.patternfly.org/v3/pattern-library/forms-and-controls/progressive-disclosure/), accessed June 6, 2026
10. [The Comprehensive Guide to the C4 Model for Software Architecture - ArchiMetric](https://www.archimetric.com/the-comprehensive-guide-to-the-c4-model-for-software-architecture/), accessed June 6, 2026
11. [Building a true Single Source of Truth (SSoT) for your team - Atlassian](https://www.atlassian.com/work-management/knowledge-sharing/documentation/building-a-single-source-of-truth-ssot-for-your-team), accessed June 6, 2026
12. [Conditional content in DITA - Scriptorium](https://www.scriptorium.com/2015/02/conditional-content-dita-premium/), accessed June 6, 2026
13. [CQRS Pattern - Azure Architecture Center | Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs), accessed June 6, 2026
14. [Projections — eventsourcing 9.5.5 documentation - Read the Docs](https://eventsourcing.readthedocs.io/en/stable/topics/projection.html), accessed June 6, 2026
15. [Domain-Driven Design: The Power of CQRS and Event Sourcing - Rico Fritzsche](https://ricofritzsche.me/cqrs-event-sourcing-projections/), accessed June 6, 2026
16. [Event Sourcing Pattern - Azure Architecture Center | Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing), accessed June 6, 2026
17. [Event sourcing pattern - AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/event-sourcing.html), accessed June 6, 2026
18. [davila7/ast-asg-graph-rag - GitHub](https://github.com/davila7/ast-asg-graph-rag), accessed June 6, 2026
19. [Building a Graph-Based Code Analysis Engine: Architecture Deep Dive | Open-source AI Code Intelligence for Every Codebase - GitHub Pages](https://rustic-ai.github.io/codeprism/blog/graph-based-code-analysis-engine/), accessed June 6, 2026
20. [What is Semantics and Why Does it Matter? - Enterprise Knowledge](https://enterprise-knowledge.com/what-is-semantics-and-why-does-it-matter/), accessed June 6, 2026
21. [Code Generation with 'Graph RAG', AstraDB and gpt-oss | by Alain Airom (Ayrom) - Medium](https://alain-airom.medium.com/code-generation-with-graph-rag-astradb-and-gpt-oss-e7ccae9de5fb), accessed June 6, 2026
22. [Bridging Code and Context: A Knowledge Graph-Based Repository-Level Code Generation](https://quantiphi.com/blog/bridging-code-and-context-a-knowledge-graph-based-repository-level-code-generation/), accessed June 6, 2026
23. [Knowledge Graph Based Repository-Level Code Generation - arXiv](https://arxiv.org/html/2505.14394v1), accessed June 6, 2026
24. [SemanticForge: Repository-Level Code Generation through Semantic Knowledge Graphs and Constraint Satisfaction - arXiv](https://arxiv.org/html/2511.07584v1), accessed June 6, 2026
25. [Why are semantic knowledge graphs so rarely talked about? - Reddit](https://www.reddit.com/r/semanticweb/comments/1qe6710/why_are_semantic_knowledge_graphs_so_rarely/), accessed June 6, 2026
26. [Treesitter - Neovim docs](https://neovim.io/doc/user/treesitter/), accessed June 6, 2026
27. [Understanding Tree-sitter Predicates and Directives | by Lince Mathew - Medium](https://medium.com/@linz07m/understanding-tree-sitter-predicates-and-directives-9c27ac62ecfe), accessed June 6, 2026
28. [Docs as Code - Write the Docs](https://www.writethedocs.org/guide/docs-as-code/), accessed June 6, 2026
29. [What is Docs as Code? Your Guide to Modern Technical Documentation - Kong Inc.](https://konghq.com/blog/learning-center/what-is-docs-as-code), accessed June 6, 2026
30. [Hybrid LLM Methods - Emergent Mind](https://www.emergentmind.com/topics/hybrid-llm-based-methods), accessed June 6, 2026
31. [Optimising Purely Functional GPU Programs](https://media.githubusercontent.com/media/tmcdonell/tmcdonell.github.io/master/papers/acc-optim-icfp2013.pdf), accessed June 6, 2026
32. [US6745384B1 - Anticipatory optimization with composite folding - Google Patents](https://patents.google.com/patent/US6745384B1/en), accessed June 6, 2026
33. [Introduction - CUE](https://cuelang.org/docs/introduction/), accessed June 6, 2026
34. [Code Generation and Extraction use case | CUE](https://cuelang.org/docs/concept/code-generation-and-extraction-use-case/), accessed June 6, 2026
35. [How CUE works with OpenAPI](https://cuelang.org/docs/concept/how-cue-works-with-openapi/), accessed June 6, 2026
36. [Smithy 2.0](https://smithy.io/2.0/), accessed June 6, 2026
37. [Creating Smithy Projects with Smithy Init | AWS Developer Tools Blog](https://aws.amazon.com/blogs/developer/creating-smithy-projects-with-smithy-init/), accessed June 6, 2026
38. [Introducing Smithy IDL 2.0 | AWS Developer Tools Blog](https://aws.amazon.com/blogs/developer/introducing-smithy-idl-2-0/), accessed June 6, 2026
39. [smithy-build.json - Smithy 2.0](https://smithy.io/2.0/guides/smithy-build-json.html), accessed June 6, 2026
40. [Smithy Gradle Plugins - Smithy 2.0](https://smithy.io/2.0/guides/gradle-plugin/index.html), accessed June 6, 2026
41. [Introducing the Smithy CLI | AWS Developer Tools Blog](https://aws.amazon.com/blogs/developer/introducing-the-smithy-cli/), accessed June 6, 2026
42. [Exploring CUE - Vishnu Bharathi](https://vishnubharathi.codes/blog/cuelang/), accessed June 6, 2026
43. [Proposal: composable API definitions with CUE · influxdata openapi · Discussion #294](https://github.com/influxdata/openapi/discussions/294), accessed June 6, 2026
44. [smithy/docs/source-2.0/guides/smithy-build-json.rst at main · smithy](https://github.com/smithy-lang/smithy/blob/main/docs/source-2.0/guides/smithy-build-json.rst?plain=true), accessed June 6, 2026
45. [Smithy Server and Client Generator for TypeScript (Developer Preview) - AWS](https://aws.amazon.com/blogs/devops/smithy-server-and-client-generator-for-typescript/), accessed June 6, 2026
46. [Stripe releases MarkDoc and that's a good thing - Nicola Iarocci](https://nicolaiarocci.com/stripe-releases-markdoc-and-thats-a-good-thing/), accessed June 6, 2026
47. [Markdoc Guide: Setup, Custom Tags & Next.js Deployment | DeployHQ](https://www.deployhq.com/guides/markdoc), accessed June 6, 2026
48. [I don't understand how this is fundamentally different than MDX, which can alrea... | Hacker News](https://news.ycombinator.com/item?id=31341348), accessed June 6, 2026
49. [Frequently asked questions - Markdoc](https://markdoc.dev/docs/faq), accessed June 6, 2026
50. [How Stripe builds interactive docs with Markdoc | Stripe Dot Dev Blog](https://stripe.dev/blog/markdoc), accessed June 6, 2026
51. [Phases of rendering - Markdoc](https://markdoc.dev/docs/render), accessed June 6, 2026
52. [Conditional Processing Attributes | Heretto Portal for Self-Service Support](https://help.heretto.com/en/heretto-ccms/create/conditional-processing/conditional-processing-attributes), accessed June 6, 2026
53. [Conditional processing (profiling) - Oxygen XML Editor](https://www.oxygenxml.com/dita/1.3/specs/archSpec/base/condproc.html), accessed June 6, 2026
54. [Directives — Sphinx documentation](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html), accessed June 6, 2026
55. [Conditional output in Sphinx Documentation - python - Stack Overflow](https://stackoverflow.com/questions/2215518/conditional-output-in-sphinx-documentation), accessed June 6, 2026
56. [sphinx-selective-exclude - PyPI](https://pypi.org/project/sphinx-selective-exclude/), accessed June 6, 2026
57. [Conditional execution of directives · Issue #9482 · sphinx-doc/sphinx - GitHub](https://github.com/sphinx-doc/sphinx/issues/9482), accessed June 6, 2026
58. [MDX vs Markdoc, does this sound convincing to you? : r/reactjs - Reddit](https://www.reddit.com/r/reactjs/comments/18ti677/mdx_vs_markdoc_does_this_sound_convincing_to_you/), accessed June 6, 2026
59. [[SEP] Progressive Disclosure for Typed Library Discovery & Introspection #1888 - GitHub](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1888), accessed June 6, 2026
60. [Progressive disclosure - Claude-Mem](https://docs.claude-mem.ai/progressive-disclosure), accessed June 6, 2026
61. [Skill authoring best practices - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), accessed June 6, 2026
62. [Structurizr](https://structurizr.com/), accessed June 6, 2026
63. [C4 Model Example](https://c4model.com/example/), accessed June 6, 2026
64. [Diagrams - C4 model](https://c4model.com/diagrams), accessed June 6, 2026
65. [IcePanel | Collaborative diagramming and modelling tool for software architecture](https://icepanel.io/), accessed June 6, 2026
66. [Top 9 tools for C4 model diagrams | by IcePanel - Medium](https://icepanel.medium.com/top-9-tools-for-c4-model-diagrams-4aef58cf1d80), accessed June 6, 2026
