/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern GeneratorConfigSchema
 * @libar-docs-status completed
 * @libar-docs-used-by GeneratorFactory, BuiltInGenerators
 *
 * ## GeneratorConfigSchema - JSON-Based Generator Validation
 *
 * Zod schemas for declarative JSON-based generator configuration.
 * Enables zero-code generator creation via section composition.
 *
 * ### When to Use
 *
 * - Use when creating document formats via JSON configuration
 * - Use when validating generator configuration files
 * - Use when composing documents from built-in sections
 */
import { z } from 'zod';
declare const SectionConfigSchema: z.ZodUnion<readonly [z.ZodObject<{
    type: z.ZodLiteral<"header">;
    title: z.ZodString;
    purpose: z.ZodOptional<z.ZodString>;
    detailLevel: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"core-patterns">;
    format: z.ZodDefault<z.ZodEnum<{
        table: "table";
        list: "list";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"quick-navigation">;
    categoryOrder: z.ZodOptional<z.ZodArray<z.ZodString>>;
    categoryFilesDir: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"use-cases">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"dependencies">;
    format: z.ZodDefault<z.ZodEnum<{
        table: "table";
        mermaid: "mermaid";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"category-details">;
    outputDir: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"pattern-list">;
    filterBy: z.ZodOptional<z.ZodObject<{
        aggregationTag: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    format: z.ZodDefault<z.ZodEnum<{
        list: "list";
        full: "full";
        summary: "summary";
        adr: "adr";
    }>>;
    numberPrefix: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"scenarios">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"cross-references">;
    refs: z.ZodArray<z.ZodObject<{
        resource: z.ZodString;
        location: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"phase-overview">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"fragment-include">;
    fragmentName: z.ZodString;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"roadmap-status-summary">;
    showCounts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"roadmap-phases">;
    includeProcess: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"timeline-summary">;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        quarter: "quarter";
        phase: "phase";
    }>>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"completed-phases">;
    includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"deliverables-summary">;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        table: "table";
        checklist: "checklist";
        "progress-bar": "progress-bar";
    }>>>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        status: "status";
        location: "location";
        phase: "phase";
        none: "none";
    }>>>;
    showStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    filterByStatus: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"prd-features">;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        phase: "phase";
        "product-area": "product-area";
        "user-role": "user-role";
    }>>>;
    includeScenarios: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeScenarioSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeBusinessValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    filterByLayer: z.ZodOptional<z.ZodEnum<{
        unknown: "unknown";
        timeline: "timeline";
        domain: "domain";
        integration: "integration";
        e2e: "e2e";
        component: "component";
    }>>;
    progressiveDisclosure: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        outputDir: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"acceptance-criteria">;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        table: "table";
        gherkin: "gherkin";
        "bullet-points": "bullet-points";
    }>>>;
    filterByLayer: z.ZodOptional<z.ZodEnum<{
        unknown: "unknown";
        timeline: "timeline";
        domain: "domain";
        integration: "integration";
        e2e: "e2e";
        component: "component";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"session-context">;
    includeDescription: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeAcceptanceCriteria: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDependencies: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeRelatedPatterns: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    outputDir: z.ZodOptional<z.ZodString>;
    includeHandoffContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"remaining-work">;
    includeIncomplete: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeBlocked: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeNextActionable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maxNextActionable: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDiscoveredGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    outputDir: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        quarter: "quarter";
        phase: "phase";
        priority: "priority";
        effort: "effort";
    }>>>;
    groupPlannedBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        quarter: "quarter";
        none: "none";
        priority: "priority";
        level: "level";
    }>>>;
    maxPlannedToShow: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"planning-checklist">;
    includePrePlanning: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDoD: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeRiskAssessment: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeValidationSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    forActivePhases: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    forNextActionable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    outputDir: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"session-plan">;
    includeImplementationApproach: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeAcceptanceCriteria: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeExecutionSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includePrePlanning: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeRiskAssessment: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    statusFilter: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    outputDir: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"session-findings">;
    includeGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeImprovements: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeRisks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeLearnings: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    showSourcePhase: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        category: "category";
        phase: "phase";
    }>>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"changelog">;
    includeUnreleased: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    categoryMapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"traceability">;
    includeGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeCovered: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"constraints-index">;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        "product-area": "product-area";
        constraint: "constraint";
    }>>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"adr-list">;
    groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        category: "category";
        status: "status";
    }>>>;
    includeContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDecision: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeConsequences: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    progressiveDisclosure: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        outputDir: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"pr-changes">;
    includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeReviewChecklist: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeBusinessValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDependencies: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        phase: "phase";
        priority: "priority";
        workflow: "workflow";
    }>>>;
    releaseFilter: z.ZodOptional<z.ZodString>;
}, z.core.$strip>]>;
export type SectionConfig = z.infer<typeof SectionConfigSchema>;
declare const BuiltInGeneratorConfigSchema: z.ZodObject<{
    type: z.ZodLiteral<"built-in">;
    output: z.ZodString;
    filterBy: z.ZodOptional<z.ZodObject<{
        aggregationTag: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    sections: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        type: z.ZodLiteral<"header">;
        title: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        detailLevel: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"core-patterns">;
        format: z.ZodDefault<z.ZodEnum<{
            table: "table";
            list: "list";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"quick-navigation">;
        categoryOrder: z.ZodOptional<z.ZodArray<z.ZodString>>;
        categoryFilesDir: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"use-cases">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"dependencies">;
        format: z.ZodDefault<z.ZodEnum<{
            table: "table";
            mermaid: "mermaid";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"category-details">;
        outputDir: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"pattern-list">;
        filterBy: z.ZodOptional<z.ZodObject<{
            aggregationTag: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        format: z.ZodDefault<z.ZodEnum<{
            list: "list";
            full: "full";
            summary: "summary";
            adr: "adr";
        }>>;
        numberPrefix: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"scenarios">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"cross-references">;
        refs: z.ZodArray<z.ZodObject<{
            resource: z.ZodString;
            location: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"phase-overview">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"fragment-include">;
        fragmentName: z.ZodString;
        context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"roadmap-status-summary">;
        showCounts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"roadmap-phases">;
        includeProcess: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"timeline-summary">;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            quarter: "quarter";
            phase: "phase";
        }>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"completed-phases">;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"deliverables-summary">;
        format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            table: "table";
            checklist: "checklist";
            "progress-bar": "progress-bar";
        }>>>;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            status: "status";
            location: "location";
            phase: "phase";
            none: "none";
        }>>>;
        showStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        filterByStatus: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"prd-features">;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            phase: "phase";
            "product-area": "product-area";
            "user-role": "user-role";
        }>>>;
        includeScenarios: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeScenarioSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeBusinessValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        filterByLayer: z.ZodOptional<z.ZodEnum<{
            unknown: "unknown";
            timeline: "timeline";
            domain: "domain";
            integration: "integration";
            e2e: "e2e";
            component: "component";
        }>>;
        progressiveDisclosure: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            outputDir: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"acceptance-criteria">;
        format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            table: "table";
            gherkin: "gherkin";
            "bullet-points": "bullet-points";
        }>>>;
        filterByLayer: z.ZodOptional<z.ZodEnum<{
            unknown: "unknown";
            timeline: "timeline";
            domain: "domain";
            integration: "integration";
            e2e: "e2e";
            component: "component";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"session-context">;
        includeDescription: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeAcceptanceCriteria: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDependencies: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeRelatedPatterns: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        outputDir: z.ZodOptional<z.ZodString>;
        includeHandoffContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"remaining-work">;
        includeIncomplete: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeBlocked: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeNextActionable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        maxNextActionable: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDiscoveredGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        outputDir: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            quarter: "quarter";
            phase: "phase";
            priority: "priority";
            effort: "effort";
        }>>>;
        groupPlannedBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            quarter: "quarter";
            none: "none";
            priority: "priority";
            level: "level";
        }>>>;
        maxPlannedToShow: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"planning-checklist">;
        includePrePlanning: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDoD: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeRiskAssessment: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeValidationSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        forActivePhases: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        forNextActionable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        outputDir: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"session-plan">;
        includeImplementationApproach: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeAcceptanceCriteria: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeExecutionSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includePrePlanning: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeRiskAssessment: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        statusFilter: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        outputDir: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"session-findings">;
        includeGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeImprovements: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeRisks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeLearnings: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        showSourcePhase: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            category: "category";
            phase: "phase";
        }>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"changelog">;
        includeUnreleased: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        categoryMapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"traceability">;
        includeGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeCovered: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"constraints-index">;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            "product-area": "product-area";
            constraint: "constraint";
        }>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"adr-list">;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            category: "category";
            status: "status";
        }>>>;
        includeContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDecision: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeConsequences: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        progressiveDisclosure: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            outputDir: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"pr-changes">;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeReviewChecklist: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeBusinessValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDependencies: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            phase: "phase";
            priority: "priority";
            workflow: "workflow";
        }>>>;
        releaseFilter: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>]>>;
}, z.core.$strip>;
declare const CustomGeneratorConfigSchema: z.ZodObject<{
    type: z.ZodLiteral<"custom">;
    path: z.ZodString;
    options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
declare const GeneratorConfigSchema: z.ZodUnion<readonly [z.ZodObject<{
    type: z.ZodLiteral<"built-in">;
    output: z.ZodString;
    filterBy: z.ZodOptional<z.ZodObject<{
        aggregationTag: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    sections: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        type: z.ZodLiteral<"header">;
        title: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        detailLevel: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"core-patterns">;
        format: z.ZodDefault<z.ZodEnum<{
            table: "table";
            list: "list";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"quick-navigation">;
        categoryOrder: z.ZodOptional<z.ZodArray<z.ZodString>>;
        categoryFilesDir: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"use-cases">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"dependencies">;
        format: z.ZodDefault<z.ZodEnum<{
            table: "table";
            mermaid: "mermaid";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"category-details">;
        outputDir: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"pattern-list">;
        filterBy: z.ZodOptional<z.ZodObject<{
            aggregationTag: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        format: z.ZodDefault<z.ZodEnum<{
            list: "list";
            full: "full";
            summary: "summary";
            adr: "adr";
        }>>;
        numberPrefix: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"scenarios">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"cross-references">;
        refs: z.ZodArray<z.ZodObject<{
            resource: z.ZodString;
            location: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"phase-overview">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"fragment-include">;
        fragmentName: z.ZodString;
        context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"roadmap-status-summary">;
        showCounts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"roadmap-phases">;
        includeProcess: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"timeline-summary">;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            quarter: "quarter";
            phase: "phase";
        }>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"completed-phases">;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"deliverables-summary">;
        format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            table: "table";
            checklist: "checklist";
            "progress-bar": "progress-bar";
        }>>>;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            status: "status";
            location: "location";
            phase: "phase";
            none: "none";
        }>>>;
        showStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        filterByStatus: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"prd-features">;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            phase: "phase";
            "product-area": "product-area";
            "user-role": "user-role";
        }>>>;
        includeScenarios: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeScenarioSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeBusinessValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        filterByLayer: z.ZodOptional<z.ZodEnum<{
            unknown: "unknown";
            timeline: "timeline";
            domain: "domain";
            integration: "integration";
            e2e: "e2e";
            component: "component";
        }>>;
        progressiveDisclosure: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            outputDir: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"acceptance-criteria">;
        format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            table: "table";
            gherkin: "gherkin";
            "bullet-points": "bullet-points";
        }>>>;
        filterByLayer: z.ZodOptional<z.ZodEnum<{
            unknown: "unknown";
            timeline: "timeline";
            domain: "domain";
            integration: "integration";
            e2e: "e2e";
            component: "component";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"session-context">;
        includeDescription: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeAcceptanceCriteria: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDependencies: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeRelatedPatterns: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        outputDir: z.ZodOptional<z.ZodString>;
        includeHandoffContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"remaining-work">;
        includeIncomplete: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeBlocked: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeNextActionable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        maxNextActionable: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDiscoveredGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        outputDir: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            quarter: "quarter";
            phase: "phase";
            priority: "priority";
            effort: "effort";
        }>>>;
        groupPlannedBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            quarter: "quarter";
            none: "none";
            priority: "priority";
            level: "level";
        }>>>;
        maxPlannedToShow: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"planning-checklist">;
        includePrePlanning: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDoD: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeRiskAssessment: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeValidationSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        forActivePhases: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        forNextActionable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        outputDir: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"session-plan">;
        includeImplementationApproach: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeAcceptanceCriteria: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeExecutionSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includePrePlanning: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeRiskAssessment: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        statusFilter: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        outputDir: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"session-findings">;
        includeGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeImprovements: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeRisks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeLearnings: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        showSourcePhase: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            category: "category";
            phase: "phase";
        }>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"changelog">;
        includeUnreleased: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        categoryMapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"traceability">;
        includeGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeCovered: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"constraints-index">;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            "product-area": "product-area";
            constraint: "constraint";
        }>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"adr-list">;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            category: "category";
            status: "status";
        }>>>;
        includeContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDecision: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeConsequences: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        progressiveDisclosure: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            outputDir: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"pr-changes">;
        includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeReviewChecklist: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeBusinessValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeDependencies: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            phase: "phase";
            priority: "priority";
            workflow: "workflow";
        }>>>;
        releaseFilter: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>]>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"custom">;
    path: z.ZodString;
    options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>]>;
export type BuiltInGeneratorConfig = z.infer<typeof BuiltInGeneratorConfigSchema>;
export type CustomGeneratorConfig = z.infer<typeof CustomGeneratorConfigSchema>;
export type GeneratorConfig = z.infer<typeof GeneratorConfigSchema>;
export declare const GeneratorsConfigFileSchema: z.ZodObject<{
    generators: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodObject<{
        type: z.ZodLiteral<"built-in">;
        output: z.ZodString;
        filterBy: z.ZodOptional<z.ZodObject<{
            aggregationTag: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        sections: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
            type: z.ZodLiteral<"header">;
            title: z.ZodString;
            purpose: z.ZodOptional<z.ZodString>;
            detailLevel: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"core-patterns">;
            format: z.ZodDefault<z.ZodEnum<{
                table: "table";
                list: "list";
            }>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"quick-navigation">;
            categoryOrder: z.ZodOptional<z.ZodArray<z.ZodString>>;
            categoryFilesDir: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"use-cases">;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"dependencies">;
            format: z.ZodDefault<z.ZodEnum<{
                table: "table";
                mermaid: "mermaid";
            }>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"category-details">;
            outputDir: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"pattern-list">;
            filterBy: z.ZodOptional<z.ZodObject<{
                aggregationTag: z.ZodOptional<z.ZodString>;
                category: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            format: z.ZodDefault<z.ZodEnum<{
                list: "list";
                full: "full";
                summary: "summary";
                adr: "adr";
            }>>;
            numberPrefix: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"scenarios">;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"cross-references">;
            refs: z.ZodArray<z.ZodObject<{
                resource: z.ZodString;
                location: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"phase-overview">;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"fragment-include">;
            fragmentName: z.ZodString;
            context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"roadmap-status-summary">;
            showCounts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"roadmap-phases">;
            includeProcess: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"timeline-summary">;
            groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                quarter: "quarter";
                phase: "phase";
            }>>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"completed-phases">;
            includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"deliverables-summary">;
            format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                table: "table";
                checklist: "checklist";
                "progress-bar": "progress-bar";
            }>>>;
            groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                status: "status";
                location: "location";
                phase: "phase";
                none: "none";
            }>>>;
            showStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            filterByStatus: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"prd-features">;
            groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                "product-area": "product-area";
                "user-role": "user-role";
            }>>>;
            includeScenarios: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeScenarioSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeBusinessValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            filterByLayer: z.ZodOptional<z.ZodEnum<{
                unknown: "unknown";
                timeline: "timeline";
                domain: "domain";
                integration: "integration";
                e2e: "e2e";
                component: "component";
            }>>;
            progressiveDisclosure: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodDefault<z.ZodBoolean>;
                outputDir: z.ZodDefault<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"acceptance-criteria">;
            format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                table: "table";
                gherkin: "gherkin";
                "bullet-points": "bullet-points";
            }>>>;
            filterByLayer: z.ZodOptional<z.ZodEnum<{
                unknown: "unknown";
                timeline: "timeline";
                domain: "domain";
                integration: "integration";
                e2e: "e2e";
                component: "component";
            }>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"session-context">;
            includeDescription: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeAcceptanceCriteria: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeDependencies: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeRelatedPatterns: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            outputDir: z.ZodOptional<z.ZodString>;
            includeHandoffContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"remaining-work">;
            includeIncomplete: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeBlocked: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeNextActionable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            maxNextActionable: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeDiscoveredGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            outputDir: z.ZodOptional<z.ZodString>;
            sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                quarter: "quarter";
                phase: "phase";
                priority: "priority";
                effort: "effort";
            }>>>;
            groupPlannedBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                quarter: "quarter";
                none: "none";
                priority: "priority";
                level: "level";
            }>>>;
            maxPlannedToShow: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"planning-checklist">;
            includePrePlanning: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeDoD: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeRiskAssessment: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeValidationSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            forActivePhases: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            forNextActionable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            outputDir: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"session-plan">;
            includeImplementationApproach: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeAcceptanceCriteria: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeExecutionSteps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includePrePlanning: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeRiskAssessment: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            statusFilter: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
            outputDir: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"session-findings">;
            includeGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeImprovements: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeRisks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeLearnings: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            showSourcePhase: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                category: "category";
                phase: "phase";
            }>>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"changelog">;
            includeUnreleased: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            categoryMapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            includeLinks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"traceability">;
            includeGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeCovered: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"constraints-index">;
            groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                "product-area": "product-area";
                constraint: "constraint";
            }>>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"adr-list">;
            groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                category: "category";
                status: "status";
            }>>>;
            includeContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeDecision: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeConsequences: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            progressiveDisclosure: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodDefault<z.ZodBoolean>;
                outputDir: z.ZodDefault<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"pr-changes">;
            includeDeliverables: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeReviewChecklist: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeBusinessValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeDependencies: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                priority: "priority";
                workflow: "workflow";
            }>>>;
            releaseFilter: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        path: z.ZodString;
        options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>]>>;
    input: z.ZodOptional<z.ZodArray<z.ZodString>>;
    exclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
    baseDir: z.ZodOptional<z.ZodString>;
    tagRegistry: z.ZodOptional<z.ZodString>;
    features: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GeneratorsConfigFile = z.infer<typeof GeneratorsConfigFileSchema>;
export {};
//# sourceMappingURL=generator-config.d.ts.map