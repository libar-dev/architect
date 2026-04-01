@ideation
@ideation-status:active
@ideation-scope:process-api,pipeline-factory,process-guard,adr-006-enforcement
@relates-to:ProcessAPILayeredExtraction,ADR006SingleReadModelArchitecture,ProcessGuardLinter,ValidatorReadModelConsolidation
Feature: Process API Layered Extraction — Investigation Findings

  Trigger: ADR-006 architectural investigation revealed concrete violations
  in process-api.ts (1,703 lines, three responsibilities), pipeline duplication
  across four consumers, and a previously undocumented fifth consumer in the
  Process Guard. These findings inform the design session for
  ProcessAPILayeredExtraction.

  Rule: Three responsibilities confirmed in process-api.ts

    Investigation verified the spec claim. The file contains:

    **CLI Shell** (~200 lines): parseArgs, printHelp, output formatting,
    error envelope. This is the only part that belongs in src/cli/.

    **Pipeline Orchestration** (~70 lines): buildPipeline() wires scan ->
    extract -> merge -> hierarchy -> transform. This sequence is duplicated
    in orchestrator.ts and validate-patterns.ts.

    **Domain Logic** (~500+ lines): handleRules (183 lines), handleStubs
    (42 lines), handleDecisions (39 lines), handlePdr (65 lines), plus
    supporting types and helpers. These are feature consumers of the
    PatternGraph that belong in src/api/ modules.

    | Handler | Lines | Complexity | API Counterpart Exists? |
    | handleRules | 1096-1279 | High: nested Map hierarchies, parseBusinessRuleAnnotations | No — needs src/api/rules-query.ts |
    | handleStubs | 945-987 | Low: delegates to findStubPatterns + resolveStubs | Partial — stub-resolver.ts exists |
    | handleDecisions | 989-1027 | Low: delegates to findStubPatterns + extractDecisionItems | Partial — via stub-resolver.ts |
    | handlePdr | 1029-1093 | Medium: PDR reference search + grouping | No — needs extraction |
    | handleContext | 1297+ | Already delegates | Yes — context-assembler.ts |
    | handleArch | delegates | Already delegates | Yes — arch-queries.ts |
    | handleScope | delegates | Already delegates | Yes — scope-validator.ts |

    Key insight: the handlers that already delegate (context, arch, scope)
    demonstrate the target pattern. The ones that do not (rules, stubs,
    decisions, pdr) are the refactoring targets.

  Rule: Pipeline duplication is four consumers, not three

    The spec identifies orchestrator.ts, process-api.ts, and
    validate-patterns.ts. Investigation found a fourth:

    | Consumer | File | What It Imports |
    | Orchestrator | src/generators/orchestrator.ts:51-55 | scanPatterns, extractPatterns, scanGherkinFiles, extractPatternsFromGherkin |
    | Process API CLI | src/cli/process-api.ts:45-47 | scanPatterns, extractPatterns, scanGherkinFiles |
    | Validate Patterns CLI | src/cli/validate-patterns.ts:32-35 | scanPatterns, scanGherkinFiles, extractPatterns, extractProcessMetadata |
    | Process Guard | src/lint/process-guard/derive-state.ts:33 | scanGherkinFiles, extractDeliverables |

    The Process Guard (derive-state.ts) is a partial consumer. It only
    scans Gherkin files and extracts deliverables for FSM state derivation.
    It does NOT need a full PatternGraph — its use case is lightweight
    state derivation from annotations, not feature consumption.

    **Design question for the pipeline factory:** Should derive-state.ts
    consume the factory? Two perspectives:

    | Option | Argument |
    | Include it | Unified pipeline, no scanner imports outside factory |
    | Exclude it | derive-state.ts is a pure stage-1 consumer (like lint-patterns.ts), ADR-006 exception applies |

    The lint-patterns.ts exception in ADR-006 says: "Pure stage-1 consumers
    that validate annotation syntax on scanned files" may import scanner
    directly. derive-state.ts fits this description — it reads annotations
    to derive FSM state, it never needs relationships or cross-source data.

    Recommendation: Exclude derive-state.ts from the pipeline factory.
    Document it as a second ADR-006 exception alongside lint-patterns.ts.

  Rule: handleRules is the highest-complexity extraction target

    handleRules builds a three-level grouping hierarchy:
    areaMap (product area) -> features (phase::pattern) -> rules (parsed).

    It also calls parseBusinessRuleAnnotations() which extracts
    Invariant/Rationale/VerifiedBy from Rule description text.

    The target module is src/api/rules-query.ts. The function signature
    should be:

    | Input | Type | Source |
    | dataset | RuntimePatternGraph | Pipeline output |
    | filters | RulesFilters | Parsed from subArgs |
    | modifiers | OutputModifiers | --count, --names-only |

    The parseRulesFilters() and deduplicateScenarioNames() helpers should
    move with the domain logic. parseBusinessRuleAnnotations() is already
    in src/api/ or should be extracted there.

  Rule: Orchestrator pipeline differs from process-api pipeline

    The orchestrator (src/generators/orchestrator.ts) has a richer pipeline
    than process-api.ts. Key differences:

    | Step | orchestrator.ts | process-api.ts |
    | Gherkin extraction | extractPatternsFromGherkin (full) | extractProcessMetadata + extractDeliverables (partial) |
    | Pattern merging | mergePatterns() | mergePatterns() |
    | Hierarchy | computeHierarchyChildren() | computeHierarchyChildren() |
    | Workflow | loadDefaultWorkflow() | loadDefaultWorkflow() or loadWorkflowFromPath() |
    | Transform | transformToPatternGraph() | transformToPatternGraphWithValidation() |

    The pipeline factory must accommodate both: orchestrator needs the
    basic PatternGraph, process-api needs the validation summary too.
    transformToPatternGraphWithValidation returns both — the factory
    should return TransformResult and let callers destructure what they need.

  Rule: Suggestions for deeper analysis in a dedicated design session

    The following topics require focused investigation before writing the
    ProcessAPILayeredExtraction design spec:

    **1. Output pipeline integration**
    process-api.ts has an output pipeline (src/cli/output-pipeline.ts) for
    formatting, field selection, and output modifiers. The CLI shell needs
    to apply this after getting results from API modules. The interface
    between API module return values and the output pipeline is a design
    decision.

    **2. Error handling patterns**
    The CLI uses QueryApiError (thrown) + handleCliError (caught). API
    modules should return Result types instead of throwing, with the CLI
    shell converting to exit codes. This aligns with the project's Result
    monad pattern.

    **3. RouteContext type**
    process-api.ts defines RouteContext (line 1285) as the parameter type
    for handlers. When domain logic moves to src/api/, the context type
    either moves too or is replaced by explicit parameters. The cleaner
    option is explicit parameters (dataset, filters, modifiers) — RouteContext
    is a CLI concern.

    **4. Scope of "slim CLI" target**
    The spec says "under 500 lines." With help text (70 lines), arg parsing
    (~200 lines), output pipeline integration, and routing, 500 lines is
    achievable but tight. The buildPipeline extraction alone removes ~70
    lines, and the four handler extractions remove ~330 lines. That brings
    the file from ~1,700 to ~1,300 — still needs routing simplification
    to hit 500.

    **5. Test strategy**
    The extracted API modules (rules-query.ts, etc.) become independently
    testable with mock PatternGraph inputs. This is a major testability
    improvement. The design session should define the test approach:
    Gherkin feature files (consistent with project policy) using factory
    helpers to build test PatternGraph instances.
