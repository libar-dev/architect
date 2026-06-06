# Practical design space for a projection-driven universal doc generator

## Problem framing

What you are building is closer to a **viewpoint and projection system over a semantic model** than to a conventional doc generator. Mature architecture-documentation practice treats a view as the organizing unit of communication: SEI’s Views and Beyond explicitly says architecture documentation should be organized around the relevant views plus cross-view information, ISO/IEC/IEEE 42010 centers architecture description on stakeholders, concerns, viewpoints, and views, Kruchten’s 4+1 model uses multiple concurrent views, and the C4 model distinguishes the underlying model from the diagrams rendered from it. Smithy then makes the same idea operational by defining **projections** that apply transforms and plugins to a source model. citeturn28view2turn27search27turn27search1turn11view8turn7view5turn18search3

That distinction matters because it suggests the right abstraction boundary for your system: the core should not be “Markdown generation,” “OpenAPI generation,” or “UI generation.” The core should be a **canonical semantic layer** with named projection rules that can slice, reshape, filter, enrich, and render the same underlying truth for different audiences and channels. The C4 tooling guidance is explicit that the model is non-visual structured data while diagrams are subsets of that graph; Smithy similarly separates model, transforms, and emitted artifacts. citeturn11view8turn19view2turn7view2turn7view5

A practical implication is that **single source of truth should mean a single canonical identity and semantics layer, not necessarily a single physical file**. Antora is built to compose documentation from multiple Git repositories, Smithy supports top-level and projection-specific imports, AsyncAPI permits one document or multiple connected parts via references, and Backstage processors ingest, transform, and validate metadata from external sources. Inference: for your use case, “single source” should be the canonical semantic graph and provenance model that sits above multiple curated inputs such as annotated code, executable specs, taxonomies, and doc fragments. citeturn6view9turn7view5turn34view1turn11view1

## Mature building blocks

For **machine-readable API and message contracts**, the mature standards stack is strong but specialized. OpenAPI 3.1 aligns its Schema Object with JSON Schema 2020-12, supports callbacks, webhooks, examples, links, and composition; AsyncAPI 3.1 does the analogous job for message-driven APIs with channels, operations, reusable components, bindings, and specification extensions; GraphQL makes schema introspection and documentation first-class, exposing descriptions and deprecations directly through the schema; Protobuf remains a language-neutral contract language and supports both custom options and source-location metadata useful to documentation generators and similar tools. These are proven targets for emitted artifacts, but they are still target-specific. citeturn16view0turn16view1turn16view2turn16view4turn16view5turn34view1turn34view0turn17view1turn17view4turn11view12turn13view0turn13view2

For **model-first authoring and projection-oriented generation**, Smithy is the most directly relevant precedent. Its build model supports imports, abstract projections, ordered transforms, projection composition via `apply`, per-projection plugins, and selectors over a graph-like semantic model. It can emit OpenAPI, but its own documentation is explicit that the translation to OpenAPI is lossy. TypeSpec offers a similar pattern through custom decorators and multiple emitters, including OpenAPI, JSON Schema, and Protobuf. CUE is especially useful as an interlingua: it has first-class support for JSON Schema, can both import and export JSON Schema, can generate and consume OpenAPI data schemas, and describes one of its goals as acting as a bidirectional bridge across formats. citeturn7view5turn7view0turn7view2turn7view3turn19view0turn19view1turn19view2turn11view9turn6view7turn20view0turn6view8turn21view0turn22search3

For **taxonomy, relationships, and graph-native semantics**, the W3C stack is highly relevant. SKOS is specifically meant for taxonomies, thesauri, classifications, and concept schemes; it gives you direct and transitive broader/narrower relations plus label semantics. JSON-LD gives you a JSON-native linked-data serialization format, and JSON-LD Framing provides a standardized way to take one graph and deterministically shape it into different tree layouts for downstream applications. Backstage provides a practical industry example of code-adjacent metadata harvesting plus typed relations between catalog entities. If your curated taxonomy and tags are central to the design, this graph-oriented layer is likely more natural as a canonical representation than any pure document tree. citeturn6view16turn31view1turn31view2turn6view17turn32view0turn6view15turn11view0turn11view1turn6view18

## Reuse and verbosity control

For **single-sourcing, conditional output, and document reuse**, DITA remains the most mature standard to study. Its architecture includes content reference mechanisms such as `conref`, `conkeyref`, range reuse, key-based indirection, conditional processing, branch filtering, and chunking for output reshaping. DITA’s normative model is still one of the clearest proofs that reuse, filtering, and multiple deliverables can be handled systematically rather than with ad hoc template conditionals. citeturn9view0turn8view0turn8view2turn8view3

A modern practical counterpart is Writerside. Its documentation explicitly supports single sourcing and content reuse, conditional content by instance or custom filter, reusable snippets and snippet libraries, variables, and mixed Markdown plus semantic XML markup. It also supports generated API documentation from OpenAPI/Swagger and built-in Mermaid, PlantUML, and D2 diagrams, though its current API-doc importer has important limitations, including lack of support for webhooks, security schemas, and external references. That combination is useful because it shows both the power and the limits of downstream renderers: strong delivery features, but not a sufficient canonical model by themselves. citeturn29view0turn29view1turn29view2turn29view3turn29view4turn29view5turn30search0turn30search1turn33view0

For **audience-specific organization**, Diátaxis is worth borrowing as a packaging principle rather than as a storage model. It distinguishes tutorials, how-to guides, technical reference, and explanation as different documentation needs. For **verbosity control**, progressive disclosure is the strongest established interaction pattern: GitHub Primer describes it as hiding and showing information based on user interaction, Microsoft describes it as revealing additional information, options, or commands as needed, and Apple explicitly presents progressive disclosure as a core API-design principle in SwiftUI. That applies as much to generated interfaces and docs as it does to UI controls. citeturn6view14turn11view4turn11view5turn10search15

The data/schema ecosystems already provide useful **verbosity and audience signals**. JSON Schema annotations like `title`, `description`, `default`, `examples`, `readOnly`, `writeOnly`, and `deprecated` are specifically intended to support documentation and UI hints rather than only validation. OpenAPI adds explicit example objects and design-time links from responses to operations. GraphQL goes further by making documentation and deprecation available through introspection and recommending that tools respect deprecations through information hiding or warnings. Inference: the least duplicative approach is to store semantic atoms once, then layer explanations, examples, advanced details, and visibility rules above them instead of cloning content per audience. citeturn15view0turn15view3turn15view1turn16view4turn16view5turn17view1

## Reference architecture for your generator

Because your source of truth includes **attributes, tags, relationships, and curated taxonomy**, a **graph-shaped canonical model** is the safest core design. Smithy describes its model as a traversable labeled multidigraph; C4’s tooling guidance says the underlying architecture model is structured data and diagrams are subsets of that graph; SKOS and RDF are graph-native by design; JSON-LD Framing then gives you a standards-based way to reshuffle one graph into different trees and embeddings. citeturn19view2turn11view8turn6view16turn32view0

```text
annotated code + executable specs + taxonomy + doc fragments
            │
            ▼
      extractors and normalizers
            │
            ▼
 canonical semantic graph + stable IDs + provenance
            │
            ▼
   named projection manifests and transforms
 (audience, concern, intent, output, verbosity)
            │
            ├── API emitters: OpenAPI / AsyncAPI / GraphQL / Protobuf
            ├── Docs emitters: Markdown / Writerside / Structurizr docs
            ├── Diagram emitters: Structurizr / Mermaid / PlantUML / D2
            └── UI emitters: JSON Schema + UI schema / component views
            │
            ▼
   validation, linting, executable-spec and contract checks
```

A practical extraction strategy is to treat annotations as **typed semantics**, not as informal comments. The closest established mechanisms are Smithy traits, TypeSpec decorators, Protobuf custom options, JSON Schema annotations, and Backstage’s descriptor format stored alongside code. Protobuf’s `SourceCodeInfo` is particularly instructive because it preserves source locations for definitions and is explicitly intended to help IDEs, code indexers, and documentation generators. Inference: preserve source spans, original identifiers, and semantic attachments in your IR from the start so every emitted artifact can trace back to the hand-curated source. citeturn19view1turn20view0turn13view0turn13view2turn15view0turn6view15turn6view18

The projection layer should be **domain-first and concern-first**, not renderer-first. Smithy already gives you the essential vocabulary: imports, named projections, abstract projections, ordered transforms, `apply`, selectors, and plugins. JSON-LD Framing gives you a standards-based tree-shaping mechanism for graph data. DITA branch filtering and Writerside conditional content show how output profiles can filter or enrich one body of source material. Inference: define projections in terms of domain concepts such as capability, workflow, stakeholder, concern, sensitivity, lifecycle stage, and audience—not in terms of “Markdown variant A” or “accordion layout B.” citeturn7view5turn7view0turn7view2turn19view2turn32view0turn8view2turn29view1

For rendering, treat standards and tools as **downstream targets**. Emit OpenAPI 3.1 for synchronous API surfaces, AsyncAPI 3.1 for event/message surfaces, GraphQL schema when client-selected response shaping is relevant, and Protobuf when strongly typed RPC or compact cross-language contracts matter. For architecture and system structure, Structurizr is unusually strong because it couples a single model to multiple C4 views, supports embedded live diagrams in Markdown/AsciiDoc documentation, and can export static sites. For broad documentation portability, Mermaid is the safest text-to-diagram choice today because GitHub, GitLab, and Writerside all officially support it; PlantUML is better where UML breadth matters and is supported by GitLab, Writerside, and Structurizr exports; D2 is promising and supported by Writerside, but it is less broadly portable across current docs platforms. That portability judgment is an inference from current official support pages. citeturn19view0turn34view1turn17view1turn11view12turn36view0turn36view1turn36view2turn36view3turn26search0turn26search1turn29view5turn30search1turn30search0

For schema-driven UI views, the clearest proven pattern is **data schema plus UI schema**. JSON Forms defines the data schema as the underlying data model and a separate UI schema for layout, ordering, visibility, and rules; react-jsonschema-form uses the same split, introducing `uiSchema` precisely because JSON Schema alone cannot fully describe rendering. If you want composable UI projections from the same canonical model, this two-layer pattern is the one to borrow: semantic schema determines truth, and UI schema determines presentation. citeturn37view0turn37view1turn37view3turn37view2

Validation should have at least four lanes: **schema/spec validation, organizational linting, executable behavior validation, and interface contract validation**. AsyncAPI distinguishes validation against the specification from validation against company governance rules and explicitly recommends linting for internal standards; Cucumber treats plain-text executable specifications as a way to validate that software does what the scenarios say; Pact uses code-first consumer-driven contract tests so only the communication actually used by consumers is enforced. Inference: your executable specs should not just generate prose—they should participate directly in gating projections and emitted artifacts in CI. citeturn34view3turn6view12turn6view13

## Assessment criteria

The quickest way to prune the design space is to reject any candidate canonical format or architecture that fails these tests.

- **Target neutrality.** If the source format is already biased toward one delivery target, it is risky as a universal canonical model. Smithy documents that conversion to OpenAPI is lossy, CUE says not every CUE constraint can be represented precisely as OpenAPI, and Writerside’s generated API importer has feature gaps. That strongly suggests OpenAPI, AsyncAPI, Markdown, or a downstream docs tool should usually be emitted artifacts, not the ultimate truth store. citeturn19view0turn21view0turn33view0

- **Relationship fidelity.** If your taxonomy, tags, and relationships are central, the core model must support them natively and query them easily. SKOS, RDF/JSON-LD, Backstage relations, and Smithy’s graph-based selectors all point toward a graph-shaped IR rather than a pure document tree. citeturn31view1turn6view17turn11view0turn19view2

- **Projection composability.** Mature systems let you layer projections instead of forking them. Smithy supports abstract projections, ordered transforms, `apply`, and per-projection plugins; DITA supports conditional processing and branch filtering; Writerside supports instance and custom filtering. If your design cannot compose profiles orthogonally, duplication will return quickly. citeturn7view0turn7view2turn7view3turn8view2turn29view1

- **Multi-source composition.** If you need composition across repositories, modules, specs, and generated fragments, that should be first-class rather than a late add-on. Antora is built around multiple content source repositories, Smithy supports imports, AsyncAPI supports connected parts via references, and Backstage processors are explicitly ingestion pipelines. citeturn6view9turn7view5turn34view1turn11view1

- **Traceability and provenance.** The system should preserve where every emitted field, paragraph, diagram node, or UI control came from. Protobuf’s `SourceCodeInfo` is a strong precedent for source spans, and Backstage’s descriptor/API duality shows the value of one semantic shape across human-maintained YAML and machine-facing JSON. If you cannot answer “where did this come from?” with precision, your universal generator will be hard to trust. citeturn13view2turn6view18

- **Portability of visuals and docs.** If portability matters, prefer the text-to-diagram technologies already supported by your likely publication surfaces. Official support today is strongest for Mermaid across GitHub, GitLab, and Writerside, with PlantUML also supported by GitLab and Writerside and exportable from Structurizr. D2 is viable when you control the renderer, but it is not yet the safest default interop choice. This is an inference from current official support pages. citeturn26search0turn26search1turn29view5turn30search1turn36view0

- **Governance and testability.** Strong systems separate format validity from organization rules and behavioral correctness. AsyncAPI explicitly separates spec validation from linting, while Cucumber and Pact represent executable and interface-level checks. If your generator only renders content but cannot validate it at multiple levels, the design space will look broader than it really is because unsafe options will not be eliminated early. citeturn34view3turn6view12turn6view13

## Recommendations for your iteration

For your current iteration, the most defensible architecture is a **hybrid model**: a canonical graph-shaped semantic layer fed by typed annotations and executable specs, with named domain projections that emit downstream standards and docs formats. That direction is the one most aligned with the proven evidence from architecture-view standards, Smithy-style projections, graph-native taxonomies, DITA-style reuse, and schema-plus-UI rendering patterns. citeturn28view2turn11view8turn19view2turn32view0turn9view0turn37view0

- **Make the canonical layer graph-first.** Model your domain entities, concepts, concerns, actors, workflows, attributes, and relationships as stable nodes and edges with opaque IDs. Use SKOS-like semantics for taxonomy and JSON-LD-compatible serialization when you need interchange or framing across tools. citeturn6view16turn31view1turn6view17turn32view0

- **Use typed annotation channels, not prose comments, for machine-meaningful semantics.** Borrow the shape of Smithy traits, TypeSpec decorators, Protobuf custom options, JSON Schema annotations, and Backstage metadata files. Keep prose comments for explanation, but keep projection-driving semantics in structured fields. citeturn19view1turn20view0turn13view0turn15view0turn6view15

- **Define a projection manifest format early.** A projection should declare at least: audience, concern, intent, output type, verbosity level, filters, framing rules, chosen renderers, and validation gates. Smithy’s build model is the most practical precedent for this manifest structure. citeturn7view5turn7view0turn7view2

- **Keep standards as emitted artifacts, not canonical truth.** Emit OpenAPI 3.1, AsyncAPI 3.1, GraphQL schemas, Protobuf descriptors, Markdown, Structurizr workspaces, and UI schemas from the semantic core. Do not let any one downstream format become the only place where essential metadata survives, because several of the major transformations are documented as lossy or feature-limited. citeturn19view0turn21view0turn33view0

- **Separate domain projection from channel projection.** First decide _what slice of the domain_ a stakeholder needs, then decide _how to package it_ as reference docs, explanation, how-to, UI view, API contract, or diagram. Diátaxis, progressive disclosure, DITA filtering, and Writerside conditional content all support this two-step model better than renderer-specific branching. citeturn6view14turn11view4turn11view5turn8view2turn29view1

- **Adopt a two-track diagram strategy.** Use Structurizr when the source material is architecture-like and benefits from one model generating multiple live C4 views. Use Mermaid as the default text diagram syntax for Markdown portability, PlantUML when UML depth matters, and D2 only where you control enough of the toolchain to accept lower portability in exchange for layout quality and ergonomics. citeturn36view0turn36view1turn36view2turn26search0turn26search1turn30search1turn30search0

- **Bake validation into the projection pipeline from day one.** Run format validation, linting, executable-scenario checks, and consumer-driven contract checks in CI. This turns projections from “generated views” into “trusted generated views,” which is the real threshold between an interesting generator and an operationally reliable one. citeturn34view3turn6view12turn6view13

A minimal but high-leverage manifest for your system could look like this:

```yaml
projection: support-runbook
audience: ops
concerns: [incident-response, topology, dependencies]
intent: how-to
outputs: [markdown, mermaid, ui-summary]
verbosity: standard
filters:
  lifecycle: [ga]
  sensitivity: [internal]
framing:
  include: [service, dependency, failure-mode, runbook-step]
  expand: [direct-dependencies]
renderers:
  docs: markdown
  diagrams: mermaid
  ui: jsonforms
validators:
  - schema
  - org-lint
  - executable-spec
  - contract
```

That is not copied from any one standard, but it is closely aligned with the proven patterns above: concerns and viewpoints from architecture-description practice, transforms and plugins from Smithy, framing from JSON-LD, filtering from DITA/Writerside, and separate semantic/UI schemas from schema-driven UI systems. citeturn28view2turn19view2turn32view0turn29view1turn37view0

## Open questions and limitations

I did **not** find a single mature, de facto standard that already unifies **annotated code + executable specs + taxonomy + API contracts + live diagrams + UI views + narrative docs** end to end. The practical state of the art is still a **composition of standards and tools**: Smithy/TypeSpec/CUE/Protobuf/GraphQL/OpenAPI/AsyncAPI for contracts, SKOS/JSON-LD/Backstage for metadata and relationships, DITA/Antora/Writerside for reuse and publication, Structurizr/Mermaid/PlantUML/D2 for diagrams, and JSON Forms/rjsf for schema-driven UI. That fragmentation is not a weakness in your idea; it is the strongest evidence that your universal generator should be a semantic/projection layer above existing ecosystems rather than a replacement for them. citeturn19view0turn20view0turn21view0turn11view12turn17view1turn16view2turn34view1turn6view16turn32view0turn6view15turn9view0turn6view9turn29view0turn36view0turn26search0turn30search1turn30search0turn37view0turn37view2

The biggest unresolved implementation choice is whether your **annotated code** can carry enough semantics for non-code-oriented projections on its own. The evidence suggests code-centric systems are excellent for contracts and strongly typed semantics, while DITA/Writerside-style systems are stronger for heavy narrative reuse and large documentation sets. If your taxonomy and cross-cutting relationships are foundational, the safer design remains a hybrid: code and specs feed the semantic graph, but the graph—not raw code—becomes the canonical projection source. That is a reasoned inference from the strengths and limits of the ecosystems above. citeturn19view1turn20view0turn13view0turn9view0turn29view0turn33view0turn6view16turn32view0
