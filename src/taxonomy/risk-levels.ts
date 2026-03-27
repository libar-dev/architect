/**
 * @architect
 * @architect-pattern RiskLevels
 * @architect-status completed
 * @architect-core
 * @architect-extract-shapes RISK_LEVELS, RiskLevel
 *
 * ## Risk Levels for Planning and Assessment
 *
 * Three-tier risk classification for roadmap planning.
 *
 * **When to Use:** When classifying or validating risk levels in roadmap specs and planning sessions.
 */
export const RISK_LEVELS = ['low', 'medium', 'high'] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
