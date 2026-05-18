import type { ZodType } from 'zod';

import {
  AnnotationCoverageSchema,
  ArchitectureComparisonSchema,
  ArchitectureDiagramSchema,
  BoundedContextSchema,
  ArchitectureNeighborhoodSchema,
  BusinessRuleReferenceSchema,
  BusinessRuleSchema,
  BusinessRuleSetSchema,
  DecisionCatalogSchema,
  DecisionRecordSchema,
  DeliverableManifestSchema,
  DeliverableSchema,
  DependencyEdgeSchema,
  DependencyEdgeSetSchema,
  DependencyTreeSchema,
  FileReadingListSchema,
  HandoffRecordSchema,
  OpenQuestionListSchema,
  OrphanPatternListSchema,
  OverviewDigestSchema,
  PatternCatalogSchema,
  PatternDetailSchema,
  PatternSummarySchema,
  PhaseProgressSchema,
  PrChangeReviewSchema,
  ProjectConfigSnapshotSchema,
  ReleaseNotesDigestSchema,
  RequirementDigestSchema,
  RoleProfileCollectionSchema,
  RoleProfileSchema,
  ScopeReadinessCheckSchema,
  ScopeReadinessReportSchema,
  SessionContextBundleSchema,
  SourceInventoryDigestSchema,
  SourceInventoryEntrySchema,
  StatusDistributionSchema,
  TagUsageEntrySchema,
  TagUsageMatrixSchema,
  TaxonomyDigestSchema,
  TraceabilityMatrixSchema,
  ValidationRuleDigestSchema,
  type Fragment,
} from '../../src/index.js';

export type PublicFragmentKind =
  | 'PhaseProgress'
  | 'StatusDistribution'
  | 'ReleaseNotesDigest'
  | 'TraceabilityMatrix'
  | 'ProjectConfigSnapshot'
  | 'BusinessRuleReference'
  | 'ArchitectureDiagram'
  | 'PrChangeReview'
  | 'SessionContextBundle'
  | 'ScopeReadinessCheck'
  | 'ScopeReadinessReport'
  | 'HandoffRecord'
  | 'FileReadingList'
  | 'Deliverable'
  | 'DeliverableManifest'
  | 'DecisionRecord'
  | 'DecisionCatalog'
  | 'BusinessRule'
  | 'BusinessRuleSet'
  | 'ValidationRuleDigest'
  | 'TaxonomyDigest'
  | 'OverviewDigest'
  | 'AnnotationCoverage'
  | 'TagUsageEntry'
  | 'TagUsageMatrix'
  | 'SourceInventoryEntry'
  | 'SourceInventoryDigest'
  | 'RoleProfile'
  | 'RoleProfileCollection'
  | 'RequirementDigest'
  | 'PatternCatalog'
  | 'BoundedContext'
  | 'ArchitectureComparison'
  | 'PatternSummary'
  | 'PatternDetail'
  | 'DependencyEdge'
  | 'DependencyEdgeSet'
  | 'DependencyTree'
  | 'ArchitectureNeighborhood'
  | 'OpenQuestionList'
  | 'OrphanPatternList';

const validDeliverable: Fragment = {
  kind: 'Deliverable',
  name: 'Projection schema bundle',
  status: 'active',
  tests: [
    'packages/architect-projection/tests/features/fragments/execution-context-schemas.feature',
  ],
  location:
    'packages/architect-projection/src/fragments/execution-context/session-context-bundle.ts',
  finding: 'Keeps context/session projection contracts strict and JSON-safe.',
  release: '2026-Q2',
};

const validScopeReadinessCheck: Fragment = {
  kind: 'ScopeReadinessCheck',
  checkId: 'dependencies-completed',
  label: 'Dependencies completed',
  severity: 'info',
  passed: true,
  details: '2/2 completed',
};

const validBusinessRule: Fragment = {
  kind: 'BusinessRule',
  id: 'BR-001',
  feature: 'Projection Migration',
  ruleName: 'Fragments stay JSON-safe',
  package: 'architect-projection',
  invariant: 'Projection fragments may only contain JSON-safe values.',
  rationale: 'Renderers and transport layers need stable serialization semantics.',
  verifiedBy: ['governance schema feature', 'package typecheck'],
  scenarioCount: 2,
  pattern: 'ProjectionMigration',
  phase: 5,
  productArea: 'DeliveryProcess',
};

const validBusinessRuleReference: Fragment = {
  kind: 'BusinessRuleReference',
  feature: 'Projection Migration',
  ruleName: 'Fragments stay JSON-safe',
  ownerRouteId: 'business-rules:architect-projection',
};

const validTagUsageEntry: Fragment = {
  kind: 'TagUsageEntry',
  tag: 'status',
  count: 12,
  values: [
    { value: 'active', count: 5 },
    { value: 'completed', count: 4 },
    { value: 'planned', count: 3 },
  ],
};

const validArchitectureDiagramFixture: Fragment = {
  kind: 'ArchitectureDiagram',
  scope: 'bounded-context',
  scopeValue: 'projection',
  diagram: {
    type: 'mermaid',
    content: 'graph TD; A[PatternGraph] --> B[ProjectionContext]; B --> C[ArchitectureDiagram]',
  },
  legend: [
    {
      type: 'heading',
      level: 3,
      text: 'Legend',
    },
    {
      type: 'list',
      items: ['Solid edge = dependency', 'Dashed edge = relationship'],
      ordered: false,
    },
  ],
  patterns: ['PatternGraphAPI', 'ProjectionContext', 'ArchitectureDiagramProjection'],
};

export const FRAGMENT_VALID_FIXTURES: Record<PublicFragmentKind, Fragment> = {
  PhaseProgress: {
    kind: 'PhaseProgress',
    phaseNumber: 4,
    phaseName: 'Projection Cutover',
    completed: 6,
    active: 2,
    planned: 3,
    candidate: 1,
    total: 12,
    completionPercentage: 50,
  },
  StatusDistribution: {
    kind: 'StatusDistribution',
    counts: {
      completed: 20,
      active: 8,
      planned: 6,
      candidate: 2,
      total: 36,
    },
    percentages: {
      completed: 55.6,
      active: 22.2,
      planned: 16.7,
      candidate: 5.5,
    },
  },
  ReleaseNotesDigest: {
    kind: 'ReleaseNotesDigest',
    releases: [
      {
        release: 'v4.7.0',
        date: '2026-04-19',
        patterns: [
          {
            kind: 'PatternSummary',
            patternName: 'ProjectionMigration',
            status: 'completed',
            role: 'service',
            phase: 4,
            file: 'packages/architect-projection/src/index.ts',
            source: 'typescript',
          },
        ],
        deliverables: [
          {
            name: 'Projection package',
            status: 'completed',
            tests: [
              'packages/architect-projection/tests/features/fragments/delivery-reporting-schemas.feature',
            ],
            location: 'packages/architect-projection/src/index.ts',
            finding: 'Consolidates fragment schemas behind one package boundary.',
            release: 'v4.7.0',
          },
        ],
        notes: 'Introduces strict Delivery Reporting fragments for timeline and reporting outputs.',
      },
    ],
  },
  TraceabilityMatrix: {
    kind: 'TraceabilityMatrix',
    rows: [
      {
        pattern: 'ProjectionMigration',
        status: 'active',
        tests: [
          'packages/architect-projection/tests/features/fragments/delivery-reporting-schemas.feature',
        ],
        specs: ['architect/specs/projection-migration.feature'],
        deliverables: [
          'packages/architect-projection/src/fragments/delivery-reporting/traceability-matrix.ts',
        ],
      },
    ],
  },
  ProjectConfigSnapshot: {
    kind: 'ProjectConfigSnapshot',
    baseDir: '/fixtures/architect-studio',
    configPath: '/fixtures/architect-studio/architect.config.ts',
    sourceGlobs: ['src/**/*.ts', 'tests/features/**/*.feature', '!dist/**'],
    buildTimeMs: 184,
    patternCount: 47,
    phaseCount: 7,
    roleCount: 6,
    projectName: 'architect-studio',
  },
  BusinessRuleReference: validBusinessRuleReference,
  ArchitectureDiagram: validArchitectureDiagramFixture,
  PrChangeReview: {
    kind: 'PrChangeReview',
    branch: 'feat/projection-documentation-composition',
    changedFiles: [
      'packages/architect-projection/src/fragments/documentation-composition/documentation-bundle.ts',
      'packages/architect-projection/tests/features/fragments/documentation-composition-schemas.feature',
    ],
    affectedPatterns: ['DocumentationCompositionSchemas', 'DocumentationBundleProjection'],
    recommendations: [
      {
        type: 'paragraph',
        text: 'Confirm routed child views remain domain fragments after serialization.',
      },
      {
        type: 'list',
        ordered: false,
        items: ['Run targeted feature coverage', { text: 'Keep scope enum strict', checked: true }],
      },
    ],
  },
  SessionContextBundle: {
    kind: 'SessionContextBundle',
    patterns: ['SessionContextProjection'],
    sessionType: 'implement',
    metadata: [
      {
        name: 'SessionContextProjection',
        status: 'completed',
        phase: 49,
        role: 'projection',
        file: 'packages/architect-projection/src/projections/execution-context/session-context.ts',
        summary: 'Builds session-oriented context bundles for planning, design, and implement sessions.',
      },
    ],
    specFiles: ['packages/architect-projection/tests/features/projections/execution-context/context-session.feature'],
    stubs: [],
    dependencies: [
      {
        name: 'ExecutionContextProjectionSupport',
        status: 'completed',
        file: 'packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts',
        kind: 'implementation',
      },
    ],
    sharedDependencies: [
      {
        name: 'ProjectionFragmentContracts',
        status: 'active',
        file: 'packages/architect-projection/src/fragments/index.ts',
        kind: 'implementation',
      },
    ],
    consumers: [
      {
        name: 'ArchitectBriefDeterministicBundle',
        status: 'candidate',
        file: 'architect/specs/architect-brief-deterministic-bundle.feature',
        kind: 'planning',
      },
    ],
    architectureNeighbors: [
      {
        name: 'ScopeReadinessProjection',
        status: 'completed',
        role: 'projection',
        archContext: 'execution-context',
        file: 'packages/architect-projection/src/projections/execution-context/scope-readiness.ts',
      },
    ],
    deliverables: [validDeliverable],
    fsm: {
      currentStatus: 'completed',
      validTransitions: [],
      protectionLevel: 'hard',
    },
    fsmByPattern: [
      {
        pattern: 'SessionContextProjection',
        fsm: {
          currentStatus: 'completed',
          validTransitions: [],
          protectionLevel: 'hard',
        },
      },
    ],
    testFiles: ['packages/architect-projection/tests/features/projections/execution-context/context-session.feature'],
  },
  ScopeReadinessCheck: validScopeReadinessCheck,
  ScopeReadinessReport: {
    kind: 'ScopeReadinessReport',
    pattern: 'ScopeReadinessProjection',
    sessionType: 'implement',
    checks: [
      validScopeReadinessCheck,
      {
        kind: 'ScopeReadinessCheck',
        checkId: 'deliverables-defined',
        label: 'Deliverables defined',
        severity: 'info',
        passed: true,
        details: '1 deliverable(s) found',
      },
      {
        kind: 'ScopeReadinessCheck',
        checkId: 'design-decisions-recorded',
        label: 'Design decisions recorded',
        severity: 'warning',
        passed: false,
        details: 'No PDR/AD references found in stubs',
      },
    ],
    verdict: 'WARN',
  },
  HandoffRecord: {
    kind: 'HandoffRecord',
    pattern: 'HandoffProjection',
    status: 'active',
    sessionType: 'review',
    completed: [
      'Execution-context projection bundle (packages/architect-projection/src/projections/execution-context)',
    ],
    inProgress: [
      'Execution-context projection tests (packages/architect-projection/tests/features/projections/execution-context/context-session.feature)',
    ],
    filesModified: [
      'packages/architect-projection/src/projections/execution-context/handoff.ts',
      'packages/architect-projection/tests/features/projections/execution-context/context-session.steps.ts',
    ],
    discovered: [
      'Scope readiness and handoff contracts must align to the plan, not the legacy formatter shape.',
    ],
    blockers: ['None'],
    nextSession:
      'Implement the Execution Context projection bodies against the corrected fragment contracts.',
  },
  FileReadingList: {
    kind: 'FileReadingList',
    pattern: 'FileReadingListProjection',
    primary: [
      'packages/architect-projection/src/projections/execution-context/session-context.ts',
      'packages/architect-projection/src/projections/execution-context/scope-readiness.ts',
    ],
    completedDeps: ['packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts'],
    roadmapDeps: ['packages/architect-projection/src/fragments/index.ts'],
    architectureNeighbors: ['packages/architect-projection/src/projections/execution-context/handoff.ts'],
  },
  Deliverable: validDeliverable,
  DeliverableManifest: {
    kind: 'DeliverableManifest',
    pattern: 'SessionContextProjection',
    items: [
      validDeliverable,
      {
        kind: 'Deliverable',
        name: 'Projection schema tests',
        status: 'planned',
        tests: [
          'packages/architect-projection/tests/features/fragments/execution-context-schemas.feature',
        ],
        location:
          'packages/architect-projection/tests/features/fragments/execution-context-schemas.feature',
      },
    ],
  },
  DecisionRecord: {
    kind: 'DecisionRecord',
    id: 'ADR-006',
    type: 'ADR',
    status: 'accepted',
    title: 'Projection fragments use strict discriminated unions',
    context: [
      {
        type: 'paragraph',
        text: 'Multiple read paths must converge on a single validated fragment model.',
      },
    ],
    decision: [
      {
        type: 'heading',
        level: 2,
        text: 'Decision',
      },
      {
        type: 'paragraph',
        text: 'Adopt strict Zod fragment schemas in the projection package.',
      },
    ],
    consequences: [
      {
        type: 'list',
        ordered: false,
        items: ['All consumers share one JSON-safe contract.', 'Renderers stay format-only.'],
      },
    ],
    alternatives: [
      {
        type: 'paragraph',
        text: 'Keeping ad-hoc codec DTOs would preserve duplication and drift.',
      },
    ],
    relatedDecisions: ['ADR-003', 'ADR-005'],
    affectedPatterns: ['PerspectiveAwareProjections', 'McpOutputSchemaValidation'],
  },
  DecisionCatalog: {
    kind: 'DecisionCatalog',
    decisions: [
      {
        kind: 'DecisionRecord',
        id: 'ADR-006',
        type: 'ADR',
        status: 'accepted',
        title: 'Projection fragments use strict discriminated unions',
        context: [
          {
            type: 'paragraph',
            text: 'Multiple read paths must converge on a single validated fragment model.',
          },
        ],
        decision: [
          {
            type: 'paragraph',
            text: 'Adopt strict Zod fragment schemas in the projection package.',
          },
        ],
        consequences: [
          {
            type: 'list',
            ordered: false,
            items: ['All consumers share one JSON-safe contract.'],
          },
        ],
        relatedDecisions: ['ADR-003'],
        affectedPatterns: ['PerspectiveAwareProjections'],
      },
    ],
  },
  BusinessRule: validBusinessRule,
  BusinessRuleSet: {
    kind: 'BusinessRuleSet',
    scope: 'product-area',
    scopeValue: 'DeliveryProcess',
    rules: [
      validBusinessRule,
      {
        kind: 'BusinessRule',
        feature: 'Projection Migration',
        ruleName: 'Decision sections use blocks',
        package: 'architect-projection',
        verifiedBy: ['governance schema feature'],
        scenarioCount: 1,
        productArea: 'DeliveryProcess',
      },
    ],
    groupedBy: 'feature',
  },
  ValidationRuleDigest: {
    kind: 'ValidationRuleDigest',
    rules: [
      {
        id: 'completed-protection',
        description: 'Completed specs require an unlock reason before edits.',
        severity: 'error',
        appliesToRoles: ['service', 'projection'],
      },
      {
        id: 'session-scope',
        description: 'Warn when a modified file is outside the current session scope.',
        severity: 'warning',
      },
    ],
    fsm: {
      initialState: 'roadmap',
      terminalStates: ['completed'],
      states: ['roadmap', 'active', 'deferred', 'completed'],
      transitions: [
        {
          from: 'roadmap',
          to: 'active',
          description: 'Start implementation work',
        },
        {
          from: 'active',
          to: 'completed',
          description: 'Finish implementation',
        },
      ],
    },
    protectionLevels: [
      {
        level: 'none',
        statuses: ['roadmap', 'deferred'],
        meaning: 'Planning statuses remain editable.',
        canAddDeliverables: true,
        needsUnlock: false,
      },
      {
        level: 'hard',
        statuses: ['completed'],
        meaning: 'Completed work is locked without an explicit unlock reason.',
        canAddDeliverables: false,
        needsUnlock: true,
      },
    ],
  },
  TaxonomyDigest: {
    kind: 'TaxonomyDigest',
    tags: [
      {
        groupName: 'Roles',
        entries: [
          {
            kind: 'role',
            tag: 'service',
            purpose: 'Marks service-level patterns.',
            domain: 'Application',
            priority: 20,
            description: 'Coordinates use cases and delegates to lower layers.',
            aliases: ['application-service'],
          },
        ],
      },
      {
        groupName: 'Metadata Tags',
        entries: [
          {
            kind: 'metadata',
            tag: 'status',
            purpose: 'Defines the delivery workflow status.',
            format: 'enum',
            required: true,
            repeatable: false,
            values: ['roadmap', 'active', 'completed'],
            defaultValue: 'roadmap',
            example: '@architect-status roadmap',
          },
          {
            kind: 'aggregation',
            tag: 'rules',
            purpose: 'Routes patterns into the business rules projection.',
            targetDoc: 'BUSINESS-RULES.md',
          },
        ],
      },
    ],
    formatTypes: [
      {
        format: 'enum',
        description: 'Constrains a tag to one of the allowed values.',
        example: '@architect-status roadmap',
      },
      {
        format: 'csv',
        description: 'Parses comma-separated references into an array of values.',
        example: '@architect-uses A, B, C',
      },
    ],
    exampleOverrides: {
      enum: '@architect-status active',
      csv: '@architect-uses PatternGraphAPI, ProjectionBundle',
    },
  },
  OverviewDigest: {
    kind: 'OverviewDigest',
    progress: {
      total: 14,
      completed: 6,
      active: 4,
      planned: 3,
      candidate: 1,
      percentage: 46,
    },
    activePhases: [
      {
        phase: 4,
        name: 'Projection Cutover',
        patternCount: 5,
        activeCount: 2,
      },
      {
        phase: 5,
        patternCount: 3,
        activeCount: 2,
      },
    ],
    blocking: [
      {
        pattern: 'OperationalInsightsProjectionBodies',
        status: 'planned',
        blockedBy: ['OperationalInsightsSchemas', 'ProjectionBundleContract'],
      },
    ],
  },
  AnnotationCoverage: {
    kind: 'AnnotationCoverage',
    totalSourceFiles: 10,
    annotatedFiles: 7,
    unannotatedFiles: [
      'packages/architect-projection/src/fragments/operational-insights/role-profile.ts',
      'packages/architect-projection/src/fragments/operational-insights/requirement-digest.ts',
      'packages/architect-projection/tests/features/fragments/operational-insights-schemas.feature.steps.ts',
    ],
    coveragePercentage: 70,
    gapsByTag: {
      role: ['operational-insights/role-profile.ts'],
      'arch-layer': ['operational-insights/requirement-digest.ts'],
    },
  },
  TagUsageEntry: validTagUsageEntry,
  TagUsageMatrix: {
    kind: 'TagUsageMatrix',
    tags: [
      validTagUsageEntry,
      {
        kind: 'TagUsageEntry',
        tag: 'role',
        count: 8,
        values: [
          { value: 'service', count: 5 },
          { value: 'cli', count: 3 },
        ],
      },
      {
        kind: 'TagUsageEntry',
        tag: 'quarter',
        count: 0,
        values: null,
      },
    ],
    patternCount: 14,
  },
  SourceInventoryEntry: {
    kind: 'SourceInventoryEntry',
    type: 'TypeScript (annotated)',
    count: 4,
    locationPattern: 'packages/architect-projection/src/fragments/operational-insights/**/*.ts',
    files: [
      'packages/architect-projection/src/fragments/operational-insights/overview-digest.ts',
      'packages/architect-projection/src/fragments/operational-insights/annotation-coverage.ts',
      'packages/architect-projection/src/fragments/operational-insights/tag-usage-entry.ts',
      'packages/architect-projection/src/fragments/operational-insights/requirement-digest.ts',
    ],
  },
  SourceInventoryDigest: {
    kind: 'SourceInventoryDigest',
    items: [
      {
        kind: 'SourceInventoryEntry',
        type: 'TypeScript (annotated)',
        count: 4,
        locationPattern: 'packages/architect-projection/src/fragments/operational-insights/**/*.ts',
        files: [
          'packages/architect-projection/src/fragments/operational-insights/overview-digest.ts',
          'packages/architect-projection/src/fragments/operational-insights/annotation-coverage.ts',
          'packages/architect-projection/src/fragments/operational-insights/tag-usage-entry.ts',
          'packages/architect-projection/src/fragments/operational-insights/requirement-digest.ts',
        ],
      },
    ],
  },
  RoleProfile: {
    kind: 'RoleProfile',
    tag: 'service',
    domain: 'Application',
    priority: 20,
    count: 5,
    description: 'Coordinates use cases and delegates to lower layers.',
    examples: ['PatternGraphAPI', 'ContextAssemblerImpl'],
  },
  RoleProfileCollection: {
    kind: 'RoleProfileCollection',
    items: [
      {
        kind: 'RoleProfile',
        tag: 'service',
        domain: 'Application',
        priority: 20,
        count: 5,
        description: 'Coordinates use cases and delegates to lower layers.',
        examples: ['PatternGraphAPI', 'ContextAssemblerImpl'],
      },
    ],
  },
  RequirementDigest: {
    kind: 'RequirementDigest',
    productArea: 'Projection Platform',
    businessRuleReferences: [
      {
        kind: 'BusinessRuleReference',
        feature: 'Projection Migration',
        ruleName: 'Fragments stay JSON-safe',
        ownerRouteId: 'business-rules:architect-projection',
      },
    ],
    requirements: [
      {
        pattern: 'OperationalInsightsSchemas',
        ownerRouteId:
          'requirements-executable:architect-projection:requirement:operational-insights-schemas',
        status: 'active',
        description: [
          {
            type: 'heading',
            level: 2,
            text: 'Requirement',
          },
          {
            type: 'paragraph',
            text: 'Reporting fragments must remain strict, JSON-safe, and renderer-neutral.',
          },
        ],
        testFiles: [
          'packages/architect-projection/tests/features/fragments/operational-insights-schemas.feature',
        ],
      },
      {
        pattern: 'RequirementProjectionBodies',
        ownerRouteId:
          'requirements-executable:architect-projection:requirement:requirement-projection-bodies',
        description: [
          {
            type: 'paragraph',
            text: 'Requirement descriptions use structured Block[] content instead of markdown strings.',
          },
        ],
        testFiles: ['tests/features/query/context.feature'],
      },
    ],
  },
  PatternCatalog: {
    kind: 'PatternCatalog',
    filters: {
      status: 'active',
      role: 'infra',
      namesOnly: false,
      count: false,
    },
    count: 1,
    names: ['PatternGraphAPI'],
    items: [
      {
        kind: 'PatternSummary',
        patternName: 'PatternGraphAPI',
        status: 'active',
        role: 'infra',
        phase: 2,
        file: 'packages/architect-query/src/pattern-graph-api.ts',
        source: 'typescript',
      },
    ],
  },
  BoundedContext: {
    kind: 'BoundedContext',
    entries: [
      {
        name: 'api',
        patternCount: 2,
        patterns: ['ContextAssemblerImpl', 'PatternGraphAPI'],
        layers: ['application'],
        roles: ['service'],
      },
    ],
  },
  ArchitectureComparison: {
    kind: 'ArchitectureComparison',
    context1: {
      name: 'scanner',
      patternCount: 1,
      patterns: ['ScannerSvc'],
      allDependencies: ['SharedUtil'],
    },
    context2: {
      name: 'codec',
      patternCount: 1,
      patterns: ['CodecSvc'],
      allDependencies: ['SharedUtil'],
    },
    sharedDependencies: ['SharedUtil'],
    uniqueToContext1: [],
    uniqueToContext2: [],
    integrationPoints: [
      {
        from: 'ScannerSvc',
        fromContext: 'scanner',
        to: 'CodecSvc',
        toContext: 'codec',
        relationship: 'dependsOn',
      },
    ],
  },
  PatternSummary: {
    kind: 'PatternSummary',
    patternName: 'PatternGraphAPI',
    status: 'active',
    role: 'service',
    phase: 2,
    file: 'packages/architect-query/src/pattern-graph-api.ts',
    source: 'typescript',
  },
  PatternDetail: {
    kind: 'PatternDetail',
    patternName: 'PatternGraphAPI',
    status: 'active',
    role: 'service',
    phase: 2,
    file: 'packages/architect-query/src/pattern-graph-api.ts',
    source: 'typescript',
    description: 'Primary query facade over the PatternGraph read model.',
    deliverables: [
      {
        name: 'PatternGraph API module',
        status: 'active',
        tests: ['tests/features/query/pattern-graph.feature'],
        location: 'packages/architect-query/src/pattern-graph-api.ts',
        finding: 'Keeps read operations centralized.',
        release: '2026-Q2',
      },
    ],
    relationships: {
      dependsOn: ['PatternGraph'],
      enables: ['ArchitectMcpServer'],
      uses: ['PatternHelpers'],
      usedBy: ['PatternBrowserView'],
      implementsPatterns: ['PatternGraphReadModel'],
      implementedBy: [
        {
          name: 'PatternGraphAPIImpl',
          file: 'packages/architect-query/src/pattern-graph-api.ts',
          description: 'Concrete API adapter',
        },
      ],
      extendsPattern: 'QuerySurface',
      extendedBy: ['PatternGraphSearch'],
      seeAlso: ['ContextAssemblerImpl'],
      apiRef: ['architect_pattern', 'architect_dep_tree'],
    },
    rules: [
      {
        name: 'Pattern relationships come from the graph',
        invariant: 'Relationship data stays graph-derived.',
        rationale: 'Projection fragments must not re-derive relationships.',
        verifiedBy: ['Dependency tree query', 'Pattern detail query'],
        scenarioCount: 2,
      },
    ],
    stubs: [
      {
        stubFile: 'architect/stubs/query/pattern-graph-api.stub.ts',
        targetPath: 'packages/architect-query/src/pattern-graph-api.ts',
        name: 'PatternGraphAPIStub',
      },
    ],
    deliverableManifest: {
      pattern: 'PatternGraphAPI',
      items: [
        {
          name: 'PatternGraph API module',
          status: 'active',
          tests: ['tests/features/query/pattern-graph.feature'],
          location: 'packages/architect-query/src/pattern-graph-api.ts',
          finding: 'Keeps read operations centralized.',
          release: '2026-Q2',
        },
      ],
    },
  },
  DependencyEdge: {
    kind: 'DependencyEdge',
    from: 'PatternGraphAPI',
    to: 'PatternGraph',
    relationKind: 'depends-on',
  },
  DependencyEdgeSet: {
    kind: 'DependencyEdgeSet',
    from: 'PatternGraphAPI',
    items: [
      {
        kind: 'DependencyEdge',
        from: 'PatternGraphAPI',
        to: 'PatternGraph',
        relationKind: 'depends-on',
      },
    ],
  },
  DependencyTree: {
    kind: 'DependencyTree',
    root: 'PatternGraph',
    nodes: [
      {
        name: 'PatternGraph',
        status: 'completed',
        phase: 1,
        isFocal: false,
        truncated: false,
        children: [
          {
            name: 'PatternGraphAPI',
            status: 'active',
            phase: 2,
            isFocal: true,
            truncated: false,
            children: [],
          },
        ],
      },
    ],
    options: {
      maxDepth: 3,
      includeImplementationDeps: true,
    },
  },
  ArchitectureNeighborhood: {
    kind: 'ArchitectureNeighborhood',
    pattern: 'PatternGraphAPI',
    context: 'api',
    role: 'service',
    layer: 'application',
    uses: ['PatternHelpers'],
    usedBy: ['PatternBrowserView'],
    dependsOn: ['PatternGraph'],
    enables: ['ArchitectMcpServer'],
    sameContext: ['ContextAssemblerImpl'],
    implements: ['PatternGraphReadModel'],
    implementedBy: [
      {
        name: 'PatternGraphAPIImpl',
        file: 'packages/architect-query/src/pattern-graph-api.ts',
        description: 'Concrete API adapter',
      },
    ],
  },
  OrphanPatternList: {
    kind: 'OrphanPatternList',
    items: [
      {
        pattern: 'UnrelatedPattern',
        status: 'roadmap',
        file: 'packages/architect-query/src/unrelated.ts',
      },
    ],
  },
  OpenQuestionList: {
    kind: 'OpenQuestionList',
    filters: { parent: 'ParentEpic' },
    count: 1,
    items: [
      {
        pattern: 'ChildAlpha',
        status: 'active',
        file: 'tests/features/cli/list-parent-child-alpha.feature',
        questions: ['Who owns the next implementation slice?'],
      },
    ],
  },
};

export const FRAGMENT_INVALID_FIXTURES: Record<PublicFragmentKind, unknown> = {
  PhaseProgress: {
    kind: 'PhaseProgress',
    phaseNumber: 4,
    phaseName: 'Projection Cutover',
    completed: 6,
    active: 2,
    planned: 3,
    candidate: 1,
    total: 12,
    completionPercentage: 50,
    extraField: true,
  },
  StatusDistribution: {
    kind: 'StatusDistribution',
    counts: {
      completed: 20,
      active: 8,
      planned: 6,
      candidate: 2,
      total: 36,
    },
    percentages: {
      completed: 55.6,
      active: 22.2,
      planned: 16.7,
      candidate: 5.5,
      total: 100,
    },
  },
  ReleaseNotesDigest: {
    kind: 'ReleaseNotesDigest',
    releases: [
      {
        release: 'v4.7.0',
        patterns: [],
        deliverables: [],
        notes: 'strict schema should reject unknown properties',
        markdown: '### forbidden presentation field',
      },
    ],
  },
  TraceabilityMatrix: {
    kind: 'TraceabilityMatrix',
    rows: [
      {
        pattern: 'ProjectionMigration',
        status: 'active',
        tests: [
          'packages/architect-projection/tests/features/fragments/delivery-reporting-schemas.feature',
        ],
        specs: ['architect/specs/projection-migration.feature'],
        deliverables:
          'packages/architect-projection/src/fragments/delivery-reporting/traceability-matrix.ts',
      },
    ],
  },
  ProjectConfigSnapshot: {
    kind: 'ProjectConfigSnapshot',
    baseDir: '/fixtures/architect-studio',
    configPath: '/fixtures/architect-studio/architect.config.ts',
    sourceGlobs: {
      input: ['src/**/*.ts'],
    },
    buildTimeMs: 184,
    patternCount: 47,
    phaseCount: 7,
    roleCount: 6,
  },
  BusinessRuleReference: {
    kind: 'BusinessRuleReference',
    feature: 'Projection Migration',
    ruleName: 'Fragments stay JSON-safe',
    ownerRouteId: '',
  },
  ArchitectureDiagram: {
    kind: 'ArchitectureDiagram',
    scope: 'component',
    diagram: {
      type: 'paragraph',
      text: 'This must be a mermaid block.',
    },
    patterns: ['PatternGraphAPI'],
  },
  PrChangeReview: {
    kind: 'PrChangeReview',
    branch: 'feat/projection-documentation-composition',
    changedFiles: [
      'packages/architect-projection/src/fragments/documentation-composition/pr-change-review.ts',
    ],
    affectedPatterns: ['DocumentationCompositionSchemas'],
    recommendations: ['run tests'],
  },
  SessionContextBundle: {
    kind: 'SessionContextBundle',
    patterns: ['SessionContextProjection'],
    sessionType: 'implement',
    metadata: [
      {
        name: 'SessionContextProjection',
        role: 'service',
        file: 'packages/architect-projection/src/projections/execution-context/session-context.ts',
        summary: 'Builds session-oriented context for implementation work.',
      },
    ],
    specFiles: [],
    stubs: [],
    dependencies: [],
    sharedDependencies: ['ProjectionFragmentContracts'],
    consumers: [],
    architectureNeighbors: [],
    deliverables: [],
    fsmByPattern: [],
    testFiles: [],
    extraField: true,
  },
  ScopeReadinessCheck: {
    kind: 'ScopeReadinessCheck',
    checkId: 'dependencies-completed',
    label: 'Dependencies completed',
    severity: 'ERROR',
    passed: true,
    details: '2/2 completed',
  },
  ScopeReadinessReport: {
    kind: 'ScopeReadinessReport',
    pattern: 'ScopeReadinessProjection',
    sessionType: 'planning',
    checks: [
      {
        kind: 'ScopeReadinessCheck',
        checkId: 'deliverables-defined',
        label: 'Deliverables defined',
        severity: 'info',
        passed: true,
        details: '1 deliverable(s) found',
        unexpected: 'strict schemas reject extras',
      },
    ],
    verdict: 'PASS',
  },
  HandoffRecord: {
    kind: 'HandoffRecord',
    pattern: 'HandoffProjection',
    sessionType: 'review',
    completed: [],
    inProgress: [],
    filesModified: [],
    discovered: [],
    blockers: [],
  },
  FileReadingList: {
    kind: 'FileReadingList',
    pattern: 'FileReadingListProjection',
    primary: [],
    completedDeps: [],
    roadmapDeps: [],
    architectureNeighbors: [],
    extraField: 'not allowed',
  },
  Deliverable: {
    kind: 'Deliverable',
    name: 'Projection schema bundle',
    status: 'active',
    tests:
      'packages/architect-projection/tests/features/fragments/execution-context-schemas.feature',
    location:
      'packages/architect-projection/src/fragments/execution-context/session-context-bundle.ts',
  },
  DeliverableManifest: {
    kind: 'DeliverableManifest',
    pattern: 'SessionContextProjection',
    items: [
      {
        kind: 'Deliverable',
        name: 'Projection schema bundle',
        status: 'active',
        tests: [],
        location:
          'packages/architect-projection/src/fragments/execution-context/session-context-bundle.ts',
        unexpected: 'nested extras must be rejected',
      },
    ],
  },
  DecisionRecord: {
    kind: 'DecisionRecord',
    id: 'ADR-006',
    type: 'XYZ',
    status: 'accepted',
    title: 'Invalid type must be rejected',
    context: [],
    decision: [],
    consequences: [],
    relatedDecisions: [],
    affectedPatterns: [],
  },
  DecisionCatalog: {
    kind: 'DecisionCatalog',
    decisions: [
      {
        kind: 'DecisionRecord',
        id: 'ADR-006',
        type: 'ADR',
        status: 'accepted',
        title: 'Invalid child fragment',
        context: [],
        decision: [],
        consequences: [],
        relatedDecisions: [],
        affectedPatterns: [],
        markdown: '### forbidden presentation field',
      },
    ],
  },
  BusinessRule: {
    kind: 'BusinessRule',
    feature: 'Projection Migration',
    ruleName: 'Fragments stay JSON-safe',
    verifiedBy: ['governance schema feature'],
    scenarioCount: 1,
    markdown: '### forbidden presentation field',
  },
  BusinessRuleSet: {
    kind: 'BusinessRuleSet',
    scope: 'phase',
    scopeValue: 'five',
    rules: [validBusinessRule],
    groupedBy: 'phase',
  },
  ValidationRuleDigest: {
    kind: 'ValidationRuleDigest',
    rules: [
      {
        id: 'completed-protection',
        description: 'Completed specs require an unlock reason before edits.',
        severity: 'fatal',
      },
    ],
    fsm: {
      initialState: 'roadmap',
      terminalStates: ['completed'],
      states: ['roadmap', 'active', 'completed'],
      transitions: [],
    },
    protectionLevels: [],
  },
  TaxonomyDigest: {
    kind: 'TaxonomyDigest',
    tags: [
      {
        groupName: 'Roles',
        entries: [
          {
            kind: 'role',
            tag: 'service',
            purpose: 'Marks service-level patterns.',
            priority: 'high',
          },
        ],
      },
    ],
    formatTypes: [],
  },
  OverviewDigest: {
    kind: 'OverviewDigest',
    progress: {
      total: 14,
      completed: 6,
      active: 4,
      planned: 3,
      candidate: 1,
      percentage: 101,
    },
    activePhases: [],
    blocking: [],
  },
  AnnotationCoverage: {
    kind: 'AnnotationCoverage',
    totalSourceFiles: 10,
    annotatedFiles: 7,
    unannotatedFiles: [],
    coveragePercentage: -1,
    gapsByTag: {
      role: ['operational-insights/role-profile.ts'],
    },
  },
  TagUsageEntry: {
    kind: 'TagUsageEntry',
    tag: 'status',
    count: 12,
    values: [{ value: 'active', count: -2 }],
  },
  TagUsageMatrix: {
    kind: 'TagUsageMatrix',
    tags: [
      {
        kind: 'TagUsageEntry',
        tag: 'status',
        count: 12,
        values: [{ value: 'active', count: 5, unexpected: true }],
      },
    ],
    patternCount: 14,
  },
  SourceInventoryEntry: {
    kind: 'SourceInventoryEntry',
    type: 'TypeScript (annotated)',
    count: 4,
    files: 'packages/architect-projection/src/fragments/operational-insights/overview-digest.ts',
  },
  SourceInventoryDigest: {
    kind: 'SourceInventoryDigest',
    items: 'not-an-array',
  },
  RoleProfile: {
    kind: 'RoleProfile',
    tag: 'service',
    domain: 'Application',
    priority: 'high',
    count: 5,
    examples: [],
  },
  RoleProfileCollection: {
    kind: 'RoleProfileCollection',
    items: [{ wrongShape: true }],
  },
  RequirementDigest: {
    kind: 'RequirementDigest',
    productArea: 'Projection Platform',
    requirements: [
      {
        pattern: 'OperationalInsightsSchemas',
        description: 'must use blocks, not markdown',
        testFiles: [],
      },
    ],
  },
  PatternCatalog: {
    kind: 'PatternCatalog',
    filters: {
      namesOnly: false,
      count: false,
    },
    count: 1,
    names: ['PatternGraphAPI'],
    items: [],
    unexpected: true,
  },
  BoundedContext: {
    kind: 'BoundedContext',
    entries: [
      {
        name: 'api',
        patternCount: '2',
        patterns: ['PatternGraphAPI'],
        layers: ['application'],
        roles: ['service'],
      },
    ],
  },
  ArchitectureComparison: {
    kind: 'ArchitectureComparison',
    context1: {
      name: 'scanner',
      patternCount: 1,
      patterns: ['ScannerSvc'],
      allDependencies: ['SharedUtil'],
    },
    context2: {
      name: 'codec',
      patternCount: 1,
      patterns: ['CodecSvc'],
      allDependencies: ['SharedUtil'],
    },
    sharedDependencies: ['SharedUtil'],
    uniqueToContext1: [],
    uniqueToContext2: [],
    integrationPoints: [
      {
        from: 'ScannerSvc',
        fromContext: 'scanner',
        to: 'CodecSvc',
        toContext: 'codec',
        relationship: 'enables',
      },
    ],
  },
  PatternSummary: {
    kind: 'PatternSummary',
    patternName: 'PatternGraphAPI',
    role: 'service',
    file: 'packages/architect-query/src/pattern-graph-api.ts',
    source: 'typescript',
    extraField: true,
  },
  PatternDetail: {
    kind: 'PatternDetail',
    patternName: 'PatternGraphAPI',
    role: 'service',
    file: 'packages/architect-query/src/pattern-graph-api.ts',
    source: 'typescript',
    deliverables: [],
    relationships: {
      dependsOn: [],
      enables: [],
      uses: [],
      usedBy: [],
      implementsPatterns: [],
      implementedBy: [],
      extendsPattern: 'QuerySurface',
      extendedBy: [],
      seeAlso: [],
      apiRef: [],
    },
    rules: [],
    stubs: [],
    unexpected: 'strict schemas reject extras',
  },
  DependencyEdge: {
    kind: 'DependencyEdge',
    from: 'PatternGraphAPI',
    to: 'PatternGraph',
    relationKind: 'blocked-by',
  },
  DependencyEdgeSet: {
    kind: 'DependencyEdgeSet',
    from: 'PatternGraphAPI',
    items: 'not-an-array',
  },
  DependencyTree: {
    kind: 'DependencyTree',
    root: 'PatternGraph',
    nodes: [
      {
        name: 'PatternGraphAPI',
        status: 'active',
        phase: 2,
        isFocal: true,
        truncated: false,
        children: [],
        extraField: 'not allowed',
      },
    ],
    options: {
      maxDepth: 3,
      includeImplementationDeps: true,
    },
  },
  ArchitectureNeighborhood: {
    kind: 'ArchitectureNeighborhood',
    pattern: 'PatternGraphAPI',
    context: 'api',
    role: 'service',
    layer: 'application',
    uses: ['PatternHelpers'],
    usedBy: ['PatternBrowserView'],
    dependsOn: ['PatternGraph'],
    enables: ['ArchitectMcpServer'],
    sameContext: ['ContextAssemblerImpl'],
    implements: ['PatternGraphReadModel'],
    implementedBy: ['PatternGraphAPIImpl'],
  },
  OpenQuestionList: {
    kind: 'OpenQuestionList',
    filters: {},
    count: 1,
    items: [
      {
        pattern: 'ChildAlpha',
        file: 'tests/features/cli/list-parent-child-alpha.feature',
        questions: [],
      },
    ],
  },
  OrphanPatternList: {
    kind: 'OrphanPatternList',
    items: [
      {
        pattern: 'UnrelatedPattern',
        file: 42,
      },
    ],
  },
};

export const FRAGMENT_SCHEMAS: Record<PublicFragmentKind, ZodType<Fragment>> = {
  PhaseProgress: PhaseProgressSchema,
  StatusDistribution: StatusDistributionSchema,
  ReleaseNotesDigest: ReleaseNotesDigestSchema,
  TraceabilityMatrix: TraceabilityMatrixSchema,
  ProjectConfigSnapshot: ProjectConfigSnapshotSchema,
  ArchitectureDiagram: ArchitectureDiagramSchema,
  PrChangeReview: PrChangeReviewSchema,
  SessionContextBundle: SessionContextBundleSchema,
  ScopeReadinessCheck: ScopeReadinessCheckSchema,
  ScopeReadinessReport: ScopeReadinessReportSchema,
  HandoffRecord: HandoffRecordSchema,
  FileReadingList: FileReadingListSchema,
  Deliverable: DeliverableSchema,
  DeliverableManifest: DeliverableManifestSchema,
  DecisionRecord: DecisionRecordSchema,
  DecisionCatalog: DecisionCatalogSchema,
  BusinessRuleReference: BusinessRuleReferenceSchema,
  BusinessRule: BusinessRuleSchema,
  BusinessRuleSet: BusinessRuleSetSchema,
  ValidationRuleDigest: ValidationRuleDigestSchema,
  TaxonomyDigest: TaxonomyDigestSchema,
  OverviewDigest: OverviewDigestSchema,
  AnnotationCoverage: AnnotationCoverageSchema,
  TagUsageEntry: TagUsageEntrySchema,
  TagUsageMatrix: TagUsageMatrixSchema,
  SourceInventoryEntry: SourceInventoryEntrySchema,
  SourceInventoryDigest: SourceInventoryDigestSchema,
  RoleProfile: RoleProfileSchema,
  RoleProfileCollection: RoleProfileCollectionSchema,
  RequirementDigest: RequirementDigestSchema,
  PatternCatalog: PatternCatalogSchema,
  BoundedContext: BoundedContextSchema,
  ArchitectureComparison: ArchitectureComparisonSchema,
  PatternSummary: PatternSummarySchema,
  PatternDetail: PatternDetailSchema,
  DependencyEdge: DependencyEdgeSchema,
  DependencyEdgeSet: DependencyEdgeSetSchema,
  DependencyTree: DependencyTreeSchema,
  ArchitectureNeighborhood: ArchitectureNeighborhoodSchema,
  OpenQuestionList: OpenQuestionListSchema,
  OrphanPatternList: OrphanPatternListSchema,
};

export const FRAGMENT_KINDS: readonly PublicFragmentKind[] = Object.keys(
  FRAGMENT_SCHEMAS,
) as PublicFragmentKind[];

export const INVALID_ARCHITECTURE_DIAGRAM_SCOPE_FIXTURE: unknown = {
  ...validArchitectureDiagramFixture,
  scope: 'system',
};
