@libar-docs
@libar-docs-pattern:FuzzyMatchTests
@libar-docs-status:active
@libar-docs-product-area:DataAPI
Feature: Fuzzy Pattern Matching

  Validates tiered fuzzy matching: exact > prefix > substring > Levenshtein.

  Rule: Fuzzy matching uses tiered scoring

    **Invariant:** Pattern matching must use a tiered scoring system: exact match (1.0) > prefix match (0.9) > substring match (0.7) > Levenshtein distance, with results sorted by score descending and case-insensitive matching.
    **Rationale:** Tiered scoring ensures the most intuitive match wins — an exact match should always rank above a substring match, preventing surprising suggestions for common pattern names.
    **Verified by:** Exact match scores 1.0, Exact match is case-insensitive, Prefix match scores 0.9, Substring match scores 0.7, Levenshtein match for close typos, Results are sorted by score descending, Empty query matches all patterns as prefix, No candidate patterns returns no results

    @acceptance-criteria @happy-path
    Scenario: Exact match scores 1.0
      Given pattern names "OrderSaga", "EventStore", "ProcessGuard"
      When I fuzzy match "OrderSaga"
      Then the top result is "OrderSaga" with score "1.0" and matchType "exact"

    @acceptance-criteria @happy-path
    Scenario: Exact match is case-insensitive
      Given pattern names "OrderSaga", "EventStore"
      When I fuzzy match "ordersaga"
      Then the top result is "OrderSaga" with score "1.0" and matchType "exact"

    @acceptance-criteria @happy-path
    Scenario: Prefix match scores 0.9
      Given pattern names "AgentCommandInfrastructure", "EventStore"
      When I fuzzy match "AgentCommand"
      Then the top result is "AgentCommandInfrastructure" with score "0.9" and matchType "prefix"

    @acceptance-criteria @happy-path
    Scenario: Substring match scores 0.7
      Given pattern names "AgentCommandInfrastructure", "EventStore"
      When I fuzzy match "Command"
      Then the top result is "AgentCommandInfrastructure" with score "0.7" and matchType "substring"

    @acceptance-criteria @happy-path
    Scenario: Levenshtein match for close typos
      Given pattern names "OrderSaga", "EventStore"
      When I fuzzy match "OrdrSaga"
      Then the top result is "OrderSaga" with matchType "fuzzy"
      And the top result score is above "0.3"

    @acceptance-criteria @happy-path
    Scenario: Results are sorted by score descending
      Given pattern names "Command", "AgentCommandInfrastructure", "CommandHandler"
      When I fuzzy match "Command"
      Then the first result has score "1.0"
      And the second result has score at least "0.7"

    @edge-case
    Scenario: Empty query matches all patterns as prefix
      Given pattern names "OrderSaga", "EventStore"
      When I fuzzy match with query ""
      Then all 2 patterns are returned with matchType "prefix"

    @edge-case
    Scenario: No candidate patterns returns no results
      Given no pattern names exist
      When I fuzzy match with query "OrderSaga"
      Then no matches are returned

  Rule: findBestMatch returns single suggestion

    **Invariant:** findBestMatch must return the single highest-scoring match above the threshold, or undefined when no match exceeds the threshold.
    **Rationale:** A single best suggestion simplifies "did you mean?" prompts in the CLI — returning multiple matches would require additional UI to disambiguate.
    **Verified by:** Best match returns suggestion above threshold, No match returns undefined when below threshold

    @acceptance-criteria @happy-path
    Scenario: Best match returns suggestion above threshold
      Given pattern names "OrderSaga", "EventStore", "ProcessGuard"
      When I find the best match for "OrderSag"
      Then the suggestion is "OrderSaga"

    @acceptance-criteria @edge-case
    Scenario: No match returns undefined when below threshold
      Given pattern names "OrderSaga", "EventStore"
      When I find the best match for "zzCompletelyDifferent"
      Then no suggestion is returned

  Rule: Levenshtein distance computation

    **Invariant:** The Levenshtein distance function must correctly compute edit distance between strings, returning 0 for identical strings.
    **Rationale:** Levenshtein distance is the fallback matching tier — incorrect distance computation would produce wrong fuzzy match scores for typo correction.
    **Verified by:** Identical strings have distance 0, Single character difference

    @acceptance-criteria @happy-path
    Scenario: Identical strings have distance 0
      Given strings "hello" and "hello"
      When I compute the Levenshtein distance
      Then the distance is 0

    @acceptance-criteria @happy-path
    Scenario: Single character difference
      Given strings "kitten" and "sitten"
      When I compute the Levenshtein distance
      Then the distance is 1
