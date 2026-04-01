@architect
@architect-pattern:ProcessApiReferenceTests
@architect-implements:CliReferenceGeneration
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:DataAPI
@behavior @cli @cli-reference
Feature: Process API CLI Reference Generation

  Verifies that the declarative CLI schema drives reference table generation
  and stays in sync with the parser implementation.

  Rule: Generated reference file contains all three table sections

    **Invariant:** CLI-REFERENCE.md contains Global Options, Output Modifiers,
    and List Filters tables generated from the CLI schema.

    @acceptance-criteria @happy-path
    Scenario: Generated file contains Global Options table
      Given the CLI schema is loaded
      When the CliReferenceGenerator produces output
      Then the output contains a "Global Options" heading
      And the output contains a table with columns "Flag", "Short", "Description", "Default"
      And the table has 6 rows for global options

    @acceptance-criteria @happy-path
    Scenario: Generated file contains Output Modifiers table
      Given the CLI schema is loaded
      When the CliReferenceGenerator produces output
      Then the output contains an "Output Modifiers" heading
      And the output contains a table with columns "Output Modifier", "Description"
      And the table has 5 rows for output modifiers

    @acceptance-criteria @happy-path
    Scenario: Generated file contains List Filters table
      Given the CLI schema is loaded
      When the CliReferenceGenerator produces output
      Then the output contains a "List Filters" heading
      And the output contains a table with columns "List Filter", "Description"
      And the table has 8 rows for list filters

    @acceptance-criteria @happy-path
    Scenario: Generated file includes inter-table prose
      Given the CLI schema is loaded
      When the CliReferenceGenerator produces output
      Then the output contains the following prose fragments:
        | fragment             |
        | Config auto-detection |
        | Precedence           |
        | composable           |

  Rule: CLI schema stays in sync with parser

    **Invariant:** Every flag recognized by parseArgs() has a corresponding
    entry in the CLI schema. A missing schema entry means the sync test fails.

    @acceptance-criteria @validation
    Scenario: Schema covers all global option flags
      Given the CLI schema is loaded
      Then the schema global options include all expected flags:
        | flag        |
        | --input     |
        | --features  |
        | --base-dir  |
        | --workflow  |
        | --help      |
        | --version   |

    @acceptance-criteria @validation
    Scenario: Schema covers all output modifier flags
      Given the CLI schema is loaded
      Then the schema output modifiers include all expected flags:
        | flag         |
        | --names-only |
        | --count      |
        | --fields     |
        | --full       |
        | --format     |

    @acceptance-criteria @validation
    Scenario: Schema covers all list filter flags
      Given the CLI schema is loaded
      Then the schema list filters include all expected flags:
        | flag            |
        | --status        |
        | --phase         |
        | --category      |
        | --source        |
        | --arch-context  |
        | --product-area  |
        | --limit         |
        | --offset        |

    @acceptance-criteria @validation
    Scenario: Schema covers session option
      Given the CLI schema is loaded
      Then the schema session options include all expected flags:
        | flag      |
        | --session |

  Rule: showHelp output reflects CLI schema

    **Invariant:** The help text rendered by showHelp() includes all options
    from the CLI schema, formatted for terminal display.

    @acceptance-criteria @integration
    Scenario: Help text includes schema-defined options
      Given the CLI schema is loaded
      Then all schema groups contain at least one option:
        | group          |
        | globalOptions  |
        | outputModifiers |
        | listFilters    |
        | sessionOptions |
