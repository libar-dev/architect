/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern PlanningCodecs
 * @libar-docs-status completed
 *
 * ## Planning Document Codecs
 *
 * Transforms MasterDataset into RenderableDocuments for planning outputs:
 * - PLANNING-CHECKLIST.md (pre-planning questions and DoD)
 * - SESSION-PLAN.md (implementation plans for phases)
 * - SESSION-FINDINGS.md (retrospective discoveries)
 *
 * ### When to Use
 *
 * - When generating planning documentation for implementation sessions
 * - When creating pre-planning checklists with Definition of Done
 * - When documenting session findings and retrospective discoveries
 */
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { heading, paragraph, separator, table, list, document, } from '../schema.js';
import { renderScenarioContent, renderBusinessRulesSection } from './helpers.js';
import { getStatusEmoji, getDisplayName } from '../utils.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import { getDeliverableStatusEmoji, isDeliverableStatusComplete, } from '../../taxonomy/deliverable-status.js';
import { normalizeStatus, isPatternPlanned } from '../../taxonomy/index.js';
import { groupBy } from '../../utils/index.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions, } from './types/base.js';
/**
 * Default options for PlanningChecklistCodec
 */
export const DEFAULT_PLANNING_CHECKLIST_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    includePrePlanning: true,
    includeDoD: true,
    includeRiskAssessment: true,
    includeValidationSteps: true,
    forActivePhases: true,
    forNextActionable: true,
};
/**
 * Default options for SessionPlanCodec
 */
export const DEFAULT_SESSION_PLAN_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    includeImplementationApproach: true,
    includeDeliverables: true,
    includeAcceptanceCriteria: true,
    includeExecutionSteps: true,
    includePrePlanning: true,
    includeRiskAssessment: true,
    statusFilter: ['planned', 'active'],
};
/**
 * Default options for SessionFindingsCodec
 */
export const DEFAULT_SESSION_FINDINGS_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    includeGaps: true,
    includeImprovements: true,
    includeRisks: true,
    includeLearnings: true,
    showSourcePhase: true,
    includeLinks: true,
    groupBy: 'category',
};
import { RenderableDocumentOutputSchema } from './shared-schema.js';
// ═══════════════════════════════════════════════════════════════════════════
// Planning Checklist Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create a PlanningChecklistCodec with custom options.
 */
export function createPlanningChecklistCodec(options) {
    const opts = mergeOptions(DEFAULT_PLANNING_CHECKLIST_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildPlanningChecklistDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('PlanningChecklistCodec is decode-only. See zod-codecs.md');
        },
    });
}
export const PlanningChecklistCodec = createPlanningChecklistCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Session Plan Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create a SessionPlanCodec with custom options.
 */
export function createSessionPlanCodec(options) {
    const opts = mergeOptions(DEFAULT_SESSION_PLAN_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildSessionPlanDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('SessionPlanCodec is decode-only. See zod-codecs.md');
        },
    });
}
export const SessionPlanCodec = createSessionPlanCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Session Findings Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create a SessionFindingsCodec with custom options.
 */
export function createSessionFindingsCodec(options) {
    const opts = mergeOptions(DEFAULT_SESSION_FINDINGS_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildSessionFindingsDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('SessionFindingsCodec is decode-only. See zod-codecs.md');
        },
    });
}
export const SessionFindingsCodec = createSessionFindingsCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Planning Checklist Builder
// ═══════════════════════════════════════════════════════════════════════════
function buildPlanningChecklistDocument(dataset, options) {
    const sections = [];
    const completedNames = new Set(dataset.byStatus.completed.map((p) => getPatternName(p)));
    // Collect phases for checklists
    const phasesToCheck = [];
    if (options.forActivePhases) {
        phasesToCheck.push(...dataset.byStatus.active);
    }
    if (options.forNextActionable) {
        const actionable = dataset.byStatus.planned.filter((p) => {
            const deps = p.dependsOn ?? [];
            return deps.every((dep) => completedNames.has(dep));
        });
        for (const pattern of actionable) {
            if (!phasesToCheck.some((p) => p.name === pattern.name)) {
                phasesToCheck.push(pattern);
            }
        }
    }
    if (phasesToCheck.length === 0) {
        sections.push(heading(2, 'Planning Checklists'), paragraph('*No active or actionable phases found.*'));
        return document('Planning Checklist', sections, {
            purpose: 'Pre-planning questions and Definition of Done validation',
        });
    }
    // Sort by phase number
    phasesToCheck.sort((a, b) => (a.phase ?? 0) - (b.phase ?? 0));
    // Summary
    sections.push(heading(2, 'Summary'), table(['Metric', 'Value'], [
        ['Phases to Plan', String(phasesToCheck.length)],
        ['Active', String(dataset.byStatus.active.filter((p) => phasesToCheck.includes(p)).length)],
        ['Next Actionable', String(phasesToCheck.filter((p) => isPatternPlanned(p.status)).length)],
    ]), separator());
    // Generate checklist for each phase
    for (const pattern of phasesToCheck) {
        sections.push(...buildPhaseChecklist(pattern, options, completedNames));
    }
    return document('Planning Checklist', sections, {
        purpose: 'Pre-planning questions and Definition of Done validation',
    });
}
function buildPhaseChecklist(pattern, options, completedNames) {
    const sections = [];
    const name = getDisplayName(pattern);
    const emoji = getStatusEmoji(pattern.status);
    sections.push(heading(3, `${emoji} ${name}`));
    // Pre-planning questions
    if (options.includePrePlanning) {
        const prePlanningItems = [
            '- [ ] Context and requirements understood?',
            '- [ ] Dependencies identified and verified?',
            '- [ ] Implementation approach chosen?',
            '- [ ] Risks assessed and mitigated?',
        ];
        // Add dependency status
        if (pattern.dependsOn && pattern.dependsOn.length > 0) {
            const depStatus = pattern.dependsOn.map((dep) => {
                const met = completedNames.has(dep);
                return `  - ${met ? '✅' : '⏳'} ${dep}`;
            });
            prePlanningItems.push('**Dependencies:**');
            prePlanningItems.push(...depStatus);
        }
        sections.push(heading(4, 'Pre-Planning'), paragraph(prePlanningItems.join('\n')));
    }
    // Definition of Done
    if (options.includeDoD) {
        const dodItems = ['**Deliverables:**'];
        if (pattern.deliverables && pattern.deliverables.length > 0) {
            for (const d of pattern.deliverables) {
                const status = isDeliverableStatusComplete(d.status) ? '✅' : '- [ ]';
                dodItems.push(`${status} ${d.name}`);
            }
        }
        else {
            dodItems.push('- [ ] (No deliverables defined)');
        }
        // Acceptance criteria from scenarios
        if (pattern.scenarios && pattern.scenarios.length > 0) {
            dodItems.push('\n**Acceptance Criteria:**');
            for (const s of pattern.scenarios) {
                dodItems.push(`- [ ] ${s.scenarioName}`);
            }
        }
        sections.push(heading(4, 'Definition of Done'), paragraph(dodItems.join('\n')));
    }
    // Risk assessment
    if (options.includeRiskAssessment) {
        sections.push(heading(4, 'Risk Assessment'), paragraph([
            '- [ ] Technical risks identified?',
            '- [ ] Scope creep controls in place?',
            '- [ ] Fallback options available?',
        ].join('\n')));
    }
    sections.push(separator());
    return sections;
}
// ═══════════════════════════════════════════════════════════════════════════
// Session Plan Builder
// ═══════════════════════════════════════════════════════════════════════════
function buildSessionPlanDocument(dataset, options) {
    const sections = [];
    // Filter by status
    const patterns = dataset.patterns.filter((p) => options.statusFilter.includes(normalizeStatus(p.status)));
    if (patterns.length === 0) {
        sections.push(heading(2, 'No Phases to Plan'), paragraph('*No phases match the status filter.*'));
        return document('Session Implementation Plan', sections, {
            purpose: 'Structured implementation plan for coding sessions',
        });
    }
    // Sort by phase
    patterns.sort((a, b) => (a.phase ?? 0) - (b.phase ?? 0));
    // Summary
    const byStatus = groupBy(patterns, (p) => normalizeStatus(p.status));
    sections.push(heading(2, 'Summary'), table(['Status', 'Count'], [
        ['Active', String(byStatus.get('active')?.length ?? 0)],
        ['Planned', String(byStatus.get('planned')?.length ?? 0)],
        ['Total', String(patterns.length)],
    ]), separator());
    // Implementation plans by phase
    for (const pattern of patterns) {
        sections.push(...buildPhasePlan(pattern, options));
    }
    return document('Session Implementation Plan', sections, {
        purpose: 'Structured implementation plan for coding sessions',
    });
}
function buildPhasePlan(pattern, options) {
    const sections = [];
    const name = getDisplayName(pattern);
    const emoji = getStatusEmoji(pattern.status);
    sections.push(heading(3, `${emoji} ${name}`));
    // Metadata
    const metaRows = [['Status', normalizeStatus(pattern.status)]];
    if (pattern.phase !== undefined)
        metaRows.push(['Phase', String(pattern.phase)]);
    if (pattern.effort)
        metaRows.push(['Effort', pattern.effort]);
    sections.push(table(['Property', 'Value'], metaRows));
    // Description
    if (pattern.directive.description) {
        sections.push(paragraph(pattern.directive.description));
    }
    // Implementation approach
    if (options.includeImplementationApproach && pattern.useCases && pattern.useCases.length > 0) {
        sections.push(heading(4, 'Implementation Approach'), list([...pattern.useCases]));
    }
    // Deliverables
    if (options.includeDeliverables && pattern.deliverables && pattern.deliverables.length > 0) {
        const items = pattern.deliverables.map((d) => {
            const emoji = getDeliverableStatusEmoji(d.status);
            return `${emoji} ${d.name}`;
        });
        sections.push(heading(4, 'Deliverables'), list(items));
    }
    // Acceptance criteria with full steps, DataTables, and DocStrings
    if (options.includeAcceptanceCriteria && pattern.scenarios && pattern.scenarios.length > 0) {
        sections.push(heading(4, 'Acceptance Criteria'));
        for (const scenario of pattern.scenarios) {
            sections.push(...renderScenarioContent(scenario));
        }
    }
    // Business Rules from Gherkin Rule: keyword
    sections.push(...renderBusinessRulesSection(pattern.rules));
    sections.push(separator());
    return sections;
}
// ═══════════════════════════════════════════════════════════════════════════
// Session Findings Builder
// ═══════════════════════════════════════════════════════════════════════════
function buildSessionFindingsDocument(dataset, options) {
    const sections = [];
    // Collect findings from completed patterns
    const findings = [];
    for (const pattern of dataset.byStatus.completed) {
        const sourceName = getPatternName(pattern);
        const sourcePhase = pattern.phase;
        // Extract gaps from pattern metadata if available
        if (options.includeGaps && pattern.discoveredGaps) {
            for (const gapText of pattern.discoveredGaps) {
                findings.push({
                    type: 'gap',
                    text: gapText,
                    ...(sourcePhase !== undefined && { sourcePhase }),
                    sourceName,
                });
            }
        }
        // Extract improvements
        if (options.includeImprovements && pattern.discoveredImprovements) {
            for (const improvementText of pattern.discoveredImprovements) {
                findings.push({
                    type: 'improvement',
                    text: improvementText,
                    ...(sourcePhase !== undefined && { sourcePhase }),
                    sourceName,
                });
            }
        }
        // Extract risks (both explicit discoveredRisks and the risk field)
        if (options.includeRisks) {
            if (pattern.discoveredRisks) {
                for (const riskText of pattern.discoveredRisks) {
                    findings.push({
                        type: 'risk',
                        text: riskText,
                        ...(sourcePhase !== undefined && { sourcePhase }),
                        sourceName,
                    });
                }
            }
            // Also include the single risk field if present
            if (pattern.risk) {
                findings.push({
                    type: 'risk',
                    text: pattern.risk,
                    ...(sourcePhase !== undefined && { sourcePhase }),
                    sourceName,
                });
            }
        }
        // Extract learnings
        if (options.includeLearnings && pattern.discoveredLearnings) {
            for (const learningText of pattern.discoveredLearnings) {
                findings.push({
                    type: 'learning',
                    text: learningText,
                    ...(sourcePhase !== undefined && { sourcePhase }),
                    sourceName,
                });
            }
        }
    }
    if (findings.length === 0) {
        sections.push(heading(2, 'No Findings'), paragraph('*No gaps, improvements, risks, or learnings discovered yet.*'));
        return document('Session Findings', sections, {
            purpose: 'Retrospective discoveries for roadmap refinement',
        });
    }
    // Summary
    const byType = groupBy(findings, (f) => f.type);
    sections.push(heading(2, 'Summary'), table(['Finding Type', 'Count'], [
        ['Gaps', String(byType.get('gap')?.length ?? 0)],
        ['Improvements', String(byType.get('improvement')?.length ?? 0)],
        ['Risks', String(byType.get('risk')?.length ?? 0)],
        ['Learnings', String(byType.get('learning')?.length ?? 0)],
        ['**Total**', String(findings.length)],
    ]), separator());
    // Group by category or type
    if (options.groupBy === 'category' || options.groupBy === 'type') {
        for (const [type, typeFindings] of byType.entries()) {
            const emoji = type === 'gap' ? '🔍' : type === 'improvement' ? '💡' : type === 'risk' ? '⚠️' : '📚';
            const title = type.charAt(0).toUpperCase() + type.slice(1) + 's';
            sections.push(heading(3, `${emoji} ${title}`));
            const items = typeFindings.map((f) => {
                const source = options.showSourcePhase && f.sourcePhase !== undefined
                    ? ` *(Phase ${f.sourcePhase})*`
                    : '';
                return `${f.text}${source}`;
            });
            sections.push(list(items));
        }
    }
    else {
        // Group by phase
        const byPhase = groupBy(findings, (f) => f.sourcePhase ?? 0);
        const sortedPhases = [...byPhase.keys()].sort((a, b) => a - b);
        for (const phase of sortedPhases) {
            const phaseFindings = byPhase.get(phase) ?? [];
            sections.push(heading(3, `Phase ${phase}`));
            const items = phaseFindings.map((f) => {
                const emoji = f.type === 'gap'
                    ? '🔍'
                    : f.type === 'improvement'
                        ? '💡'
                        : f.type === 'risk'
                            ? '⚠️'
                            : '📚';
                return `${emoji} ${f.text}`;
            });
            sections.push(list(items));
        }
    }
    sections.push(separator());
    return document('Session Findings', sections, {
        purpose: 'Retrospective discoveries for roadmap refinement',
    });
}
//# sourceMappingURL=planning.js.map