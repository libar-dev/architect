# Documentation composition documentation types

`parseAndProjectDocumentationBundle(context, options)` accepts exactly these document types:

| Type                      | Source projection/composition                                              | Notes                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `architecture`            | `parseAndProjectArchitectureDiagram()` + documentation composition adapter | Defaults to `component` scope unless explicit architecture scope options are supplied.                 |
| `decisions`               | `projectDecisionCatalog()`                                                 | Preserves decision child fragments through bundle children.                                            |
| `business-rules`          | `projectBusinessRuleSet({ groupedBy: 'feature' })`                         | Uses grouped child fragments for feature-specific drill-down.                                          |
| `patterns`                | projectPatternCatalog()                                                    | Returns the domain pattern catalog bundle directly.                                                    |
| `roadmap`                 | `parseAndProjectDocumentationBundle({ documentType: 'roadmap' })`          | Internal roadmap quarter children are normalized into routed bundle children.                          |
| `requirements-executable` | `projectRequirementExecutableDigest()`                                     | Lists value-transfer-complete requirement coverage with routed package index and pattern-detail files. |
| `requirements-specs`      | `projectRequirementSpecsDigest()`                                          | Lists design/spec-tier requirement coverage with flat routed pattern-detail files.                     |
| `validation-rules`        | `projectValidationRuleDigest()`                                            | Returns the domain validation-rule digest bundle directly.                                             |
| `taxonomy`                | `projectTaxonomyDigest()`                                                  | Supports explicit example overrides through projection options.                                        |
| `changelog`               | `projectReleaseNotesDigest()`                                              | Release buckets remain domain child fragments.                                                         |
| `traceability`            | `projectTraceabilityMatrix()`                                              | Row children are preserved as routed domain bundle children.                                           |
| `current-work`            | `projectCurrentWork()`                                                     | Current-quarter children are preserved as routed domain bundle children.                               |

## Explicitly rejected

These strings must throw `UnknownDocumentType` and must not be silently accepted or reintroduced:

- `reference`
- `product-areas`
- `design-review`
- `product-requirements`
- any arbitrary unsupported value
