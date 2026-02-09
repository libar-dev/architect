/**
 * @libar-docs
 * @libar-docs-pattern ScopeValidatorImpl
 * @libar-docs-status completed
 * @libar-docs-implements DataAPIDesignSessionSupport
 * @libar-docs-uses ProcessStateAPI, MasterDataset, StubResolverImpl
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-target src/api/scope-validator.ts
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## ScopeValidator — Pre-flight Session Readiness Checker
 *
 * Pure function composition over ProcessStateAPI and MasterDataset.
 * Runs a checklist of prerequisite validations before starting a
 * design or implementation session.
 */
import type { ProcessStateAPI } from './process-state.js';
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
export type CheckSeverity = 'PASS' | 'BLOCKED' | 'WARN';
export type ScopeCheckId = 'dependencies-completed' | 'stubs-from-deps-exist' | 'deliverables-defined' | 'fsm-allows-transition' | 'design-decisions-recorded' | 'executable-specs-set';
export interface ValidationCheck {
    readonly id: ScopeCheckId;
    readonly label: string;
    readonly severity: CheckSeverity;
    readonly detail: string;
    readonly blockerNames?: readonly string[];
}
export type ScopeType = 'implement' | 'design';
export interface ScopeValidationOptions {
    readonly patternName: string;
    readonly scopeType: ScopeType;
    readonly baseDir: string;
    /** When true, WARN checks are promoted to BLOCKED (DD-4, matches lint-process --strict). */
    readonly strict?: boolean;
}
export interface ScopeValidationResult {
    readonly pattern: string;
    readonly scopeType: ScopeType;
    readonly checks: readonly ValidationCheck[];
    readonly verdict: 'ready' | 'blocked' | 'warnings';
    readonly blockerCount: number;
    readonly warnCount: number;
}
export declare function validateScope(api: ProcessStateAPI, dataset: MasterDataset, options: ScopeValidationOptions): ScopeValidationResult;
export declare function formatScopeValidation(result: ScopeValidationResult): string;
export declare function checkDependenciesCompleted(api: ProcessStateAPI, patternName: string): ValidationCheck;
export declare function checkDeliverablesDefined(api: ProcessStateAPI, patternName: string): ValidationCheck;
export declare function checkFsmAllowsTransition(api: ProcessStateAPI, patternName: string): ValidationCheck;
export declare function checkDesignDecisionsRecorded(dataset: MasterDataset, patternName: string): ValidationCheck;
export declare function checkExecutableSpecsSet(api: ProcessStateAPI, patternName: string): ValidationCheck;
export declare function checkStubsFromDepsExist(dataset: MasterDataset, patternName: string, baseDir: string): ValidationCheck;
//# sourceMappingURL=scope-validator.d.ts.map