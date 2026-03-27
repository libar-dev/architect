### Available Codecs Reference

#### ValidationRulesCodec

| Option                  | Type    | Default | Description                                         |
| ----------------------- | ------- | ------- | --------------------------------------------------- |
| includeFSMDiagram       | boolean | true    | Include FSM state diagram                           |
| includeCLIUsage         | boolean | true    | Include CLI usage section                           |
| includeEscapeHatches    | boolean | true    | Include escape hatches section                      |
| includeProtectionMatrix | boolean | true    | Include protection levels matrix                    |
| includeErrorGuide       | boolean | true    | Include error guide with rationale and alternatives |

#### RoadmapDocumentCodec

| Option              | Type                     | Default | Description                         |
| ------------------- | ------------------------ | ------- | ----------------------------------- |
| generateDetailFiles | boolean                  | true    | Create phase detail files           |
| filterStatus        | NormalizedStatusFilter[] | []      | Filter by status                    |
| includeProcess      | boolean                  | true    | Show quarter, effort, team metadata |
| includeDeliverables | boolean                  | true    | List deliverables per phase         |
| filterPhases        | number[]                 | []      | Filter to specific phases           |

#### CompletedMilestonesCodec

#### CurrentWorkCodec

#### TaxonomyDocumentCodec

| Option             | Type    | Default | Description                     |
| ------------------ | ------- | ------- | ------------------------------- |
| includePresets     | boolean | true    | Include preset comparison table |
| includeFormatTypes | boolean | true    | Include format type reference   |
| includeArchDiagram | boolean | true    | Include architecture diagram    |
| groupByDomain      | boolean | true    | Group metadata tags by domain   |

#### SessionContextCodec

#### RemainingWorkCodec

| Option                | Type                                           | Default | Description                   |
| --------------------- | ---------------------------------------------- | ------- | ----------------------------- |
| includeIncomplete     | boolean                                        | true    | Include planned items         |
| includeBlocked        | boolean                                        | true    | Show blocked items analysis   |
| includeNextActionable | boolean                                        | true    | Next actionable items section |
| maxNextActionable     | number                                         | 5       | Max items in next actionable  |
| sortBy                | "phase" \| "priority" \| "effort" \| "quarter" | "phase" | Sort order                    |
| groupPlannedBy        | "quarter" \| "priority" \| "level" \| "none"   | "none"  | Group planned items           |

#### RequirementsDocumentCodec

| Option               | Type                                     | Default        | Description                      |
| -------------------- | ---------------------------------------- | -------------- | -------------------------------- |
| generateDetailFiles  | boolean                                  | true           | Create product area detail files |
| groupBy              | "product-area" \| "user-role" \| "phase" | "product-area" | Primary grouping                 |
| filterStatus         | NormalizedStatusFilter[]                 | []             | Filter by status (empty = all)   |
| includeScenarioSteps | boolean                                  | true           | Show Given/When/Then steps       |
| includeBusinessValue | boolean                                  | true           | Display business value metadata  |
| includeBusinessRules | boolean                                  | true           | Show Gherkin Rule: sections      |

#### ChangelogCodec

| Option            | Type                   | Default | Description                       |
| ----------------- | ---------------------- | ------- | --------------------------------- |
| includeUnreleased | boolean                | true    | Include unreleased section        |
| includeLinks      | boolean                | true    | Include links                     |
| categoryMapping   | Record<string, string> | {}      | Map categories to changelog types |

#### TraceabilityCodec

#### OverviewCodec

#### ReferenceDocumentCodec

| Option             | Type            | Description                                                  |
| ------------------ | --------------- | ------------------------------------------------------------ |
| conventionTags     | string[]        | Convention tag values to extract from decision records       |
| diagramScopes      | DiagramScope[]  | Multiple diagrams                                            |
| shapeSelectors     | ShapeSelector[] | Fine-grained declaration-level shape filtering               |
| behaviorCategories | string[]        | Category tags for behavior pattern content                   |
| includeTags        | string[]        | Cross-cutting content routing via include tags               |
| preamble           | SectionBlock[]  | Static editorial sections prepended before generated content |
| productArea        | string          | Pre-filter all content sources to matching product area      |
| excludeSourcePaths | string[]        | Exclude patterns by source path prefix                       |

| Type            | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| graph (default) | Flowchart with subgraphs by archContext, custom node shapes    |
| sequenceDiagram | Sequence diagram with typed messages between participants      |
| stateDiagram-v2 | State diagram with transitions from dependsOn relationships    |
| C4Context       | C4 context diagram with boundaries, systems, and relationships |
| classDiagram    | Class diagram with archRole stereotypes and typed arrows       |

| Variant        | Example                                         | Behavior                    |
| -------------- | ----------------------------------------------- | --------------------------- |
| group only     | `{ group: "api-types" }`                        | Match shapes by group tag   |
| source + names | `{ source: "src/types.ts", names: ["Config"] }` | Named shapes from file      |
| source only    | `{ source: "src/path/*.ts" }`                   | All tagged shapes from glob |

#### PrChangesCodec

#### PlanningChecklistCodec

#### SessionPlanCodec

#### SessionFindingsCodec

#### PatternsDocumentCodec

| Option                 | Type                                  | Default    | Description                                 |
| ---------------------- | ------------------------------------- | ---------- | ------------------------------------------- |
| generateDetailFiles    | boolean                               | true       | Create category detail files                |
| detailLevel            | "summary" \| "standard" \| "detailed" | "standard" | Output verbosity                            |
| includeDependencyGraph | boolean                               | true       | Render Mermaid dependency graph             |
| includeUseCases        | boolean                               | true       | Show use cases section                      |
| filterCategories       | string[]                              | []         | Filter to specific categories (empty = all) |

#### IndexCodec

| Option                   | Type            | Default | Description                                                      |
| ------------------------ | --------------- | ------- | ---------------------------------------------------------------- |
| preamble                 | SectionBlock[]  | []      | Editorial sections (reading paths, document roles, key concepts) |
| documentEntries          | DocumentEntry[] | []      | Static document inventory entries                                |
| includeProductAreaStats  | boolean         | true    | Product area statistics table                                    |
| includePhaseProgress     | boolean         | true    | Phase progress summary                                           |
| includeDocumentInventory | boolean         | true    | Unified document inventory                                       |
| includePackageMetadata   | boolean         | true    | Package metadata header                                          |

#### DesignReviewCodec

#### CompositeCodec

#### ClaudeModuleCodec

#### BusinessRulesCodec

| Option               | Type                                       | Default             | Description                               |
| -------------------- | ------------------------------------------ | ------------------- | ----------------------------------------- |
| groupBy              | "domain" \| "phase" \| "domain-then-phase" | "domain-then-phase" | Primary grouping strategy                 |
| includeCodeExamples  | boolean                                    | false               | Include code examples from DocStrings     |
| includeTables        | boolean                                    | true                | Include markdown tables from descriptions |
| includeRationale     | boolean                                    | true                | Include rationale section per rule        |
| filterDomains        | string[]                                   | []                  | Filter by domain categories (empty = all) |
| filterPhases         | number[]                                   | []                  | Filter by phases (empty = all)            |
| onlyWithInvariants   | boolean                                    | false               | Show only rules with explicit invariants  |
| includeSource        | boolean                                    | true                | Include source feature file link          |
| includeVerifiedBy    | boolean                                    | true                | Include Verified by scenario links        |
| maxDescriptionLength | number                                     | 150                 | Max description length in standard mode   |
| excludeSourcePaths   | string[]                                   | []                  | Exclude patterns by source path prefix    |

#### ArchitectureDocumentCodec

| Option                   | Type                     | Default     | Description                                    |
| ------------------------ | ------------------------ | ----------- | ---------------------------------------------- |
| diagramType              | "component" \| "layered" | "component" | Type of diagram to generate                    |
| includeInventory         | boolean                  | true        | Include component inventory table              |
| includeLegend            | boolean                  | true        | Include legend for arrow styles                |
| filterContexts           | string[]                 | []          | Filter to specific contexts (empty = all)      |
| diagramKeyComponentsOnly | boolean                  | true        | Only show components with archRole in diagrams |

#### AdrDocumentCodec
