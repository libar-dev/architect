=== REFERENCE GENERATION SAMPLE ===

Purpose: Reference document: Reference Generation Sample
Detail Level: Compact summary

=== API TYPES ===

| Type | Kind |
| --- | --- |
| SectionBlock | type |
| normalizeStatus | function |
| DELIVERABLE_STATUS_VALUES | const |
| CategoryDefinition | interface |


=== BEHAVIOR SPECIFICATIONS ===

--- DeliveryProcessFactory ---

--- DefineConfig ---

--- ADR001TaxonomyCanonicalValues ---

| Rule | Description |
| --- | --- |
| Product area canonical values | **Invariant:** The product-area tag uses one of 7 canonical values.<br>    Each value represents a reader-facing... |
| ADR category canonical values | **Invariant:** The adr-category tag uses one of 4 values.<br><br>    \| Value \| Purpose \|<br>    \| architecture \| System... |
| FSM status values and protection levels | **Invariant:** Pattern status uses exactly 4 values with defined<br>    protection levels. These are enforced by Process... |
| Valid FSM transitions | **Invariant:** Only these transitions are valid. All others are<br>    rejected by Process Guard.<br><br>    \| From \| To \|... |
| Tag format types | **Invariant:** Every tag has one of 6 format types that determines<br>    how its value is parsed.<br><br>    \| Format \|... |
| Source ownership | **Invariant:** Relationship tags have defined ownership by source type.<br>    Anti-pattern detection enforces these... |
| Quarter format convention | **Invariant:** The quarter tag uses `YYYY-QN` format (e.g., `2026-Q1`).<br>    ISO-year-first sorting works... |
| Deliverable status canonical values | **Invariant:** Deliverable status (distinct from pattern FSM status)<br>    uses exactly 6 values, enforced by Zod... |

--- ProcessGuardTesting ---

| Rule | Description |
| --- | --- |
| Completed files require unlock-reason to modify |  |
| Status transitions must follow PDR-005 FSM |  |
| Active specs cannot add new deliverables |  |
| Files outside active session scope trigger warnings |  |
| Explicitly excluded files trigger errors |  |
| Multiple rules validate independently |  |
