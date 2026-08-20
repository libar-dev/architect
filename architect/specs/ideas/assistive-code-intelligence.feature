@architect
@architect-pattern:AssistiveCodeIntelligence
@architect-status:candidate
@architect-maturity:idea
@architect-product-area:Annotation
@architect-level:epic
Feature: AssistiveCodeIntelligence - automated code-structure intelligence as an assistive layer, never the source of truth

  **User Story:** As an agent or maintainer adopting or working in a codebase, I want architect to leverage automated code-structure intelligence (language-server- or AST-derived) to bootstrap and cross-check annotations and to answer structural queries on the deterministic API, so that onboarding is a guided in-app experience rather than a hosted manual tutorial, and agents stay on-API instead of regressing to grep.

  **Members:**
  - GuidedMassAnnotation
  - AnnotationGapAnalysis
  - AgentStructuralNavigation

  Rule: Automated code-structure intelligence is assistive, never the read model
    **Invariant:** Automated code-structure intelligence (language-server- or AST-derived) is consumed only to propose annotations, validate declared edges against actual structure, and answer structural-navigation queries on-API; it never becomes the PatternGraph read model. The PatternGraph remains the hand-authored annotation event store (ADR-003/006) and builds with zero dependency on any such tool being present.
