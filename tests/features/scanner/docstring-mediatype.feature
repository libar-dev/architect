Feature: DocString MediaType Preservation

  DocString language hints (mediaType) should be preserved through the parsing
  pipeline from feature files to rendered output. This prevents code blocks
  from being incorrectly escaped when the language hint is lost.

  Background: Gherkin parser test context
    Given a gherkin parser test context

  # ===========================================================================
  # Rule 1: Parser extracts mediaType from DocStrings
  # ===========================================================================

  Rule: Parser preserves DocString mediaType during extraction

    Scenario: Parse DocString with typescript mediaType
      Given a feature file with content:
        """
        Feature: Code Example
          Scenario: Has typed docstring
            Given the following code:
              \"\"\"typescript
              const x: number = 1;
              \"\"\"
        """
      When the feature file is parsed
      Then parsing succeeds
      And scenario 1 step 1 has docString.content containing "const x: number = 1"
      And scenario 1 step 1 has docString.mediaType "typescript"

    Scenario: Parse DocString with json mediaType
      Given a feature file with content:
        """
        Feature: JSON Example
          Scenario: Has JSON docstring
            Given the following data:
              \"\"\"json
              {"key": "value"}
              \"\"\"
        """
      When the feature file is parsed
      Then scenario 1 step 1 has docString.mediaType "json"

    Scenario: Parse DocString with jsdoc mediaType
      Given a feature file with content:
        """
        Feature: JSDoc Example
          Scenario: Has jsdoc docstring
            Given the following documentation:
              \"\"\"jsdoc
              /**
               * @param name - The user name
               * @returns The greeting message
               */
              \"\"\"
        """
      When the feature file is parsed
      Then scenario 1 step 1 has docString.mediaType "jsdoc"

    Scenario: DocString without mediaType has undefined mediaType
      Given a feature file with content:
        """
        Feature: Plain DocString
          Scenario: No language hint
            Given plain text:
              \"\"\"
              Just some plain text
              \"\"\"
        """
      When the feature file is parsed
      Then scenario 1 step 1 has docString.content "Just some plain text"
      And scenario 1 step 1 has docString.mediaType undefined

  # ===========================================================================
  # Rule 2: MediaType flows through to code block rendering
  # ===========================================================================

  Rule: MediaType is used when rendering code blocks

    Scenario: TypeScript mediaType renders as typescript code block
      Given a parsed step with docString:
        | content | const x: number = 1; |
        | mediaType | typescript |
      When the step docString is rendered
      Then the code block language is "typescript"

    Scenario: JSDoc mediaType prevents asterisk escaping
      Given a parsed step with docString:
        | content | /** @param name */ |
        | mediaType | jsdoc |
      When the step docString is rendered
      Then the code block language is "jsdoc"
      And asterisks are not escaped in the output

    Scenario: Missing mediaType falls back to default language
      Given a parsed step with docString:
        | content | some content |
      When the step docString is rendered with default language "markdown"
      Then the code block language is "markdown"

  # ===========================================================================
  # Rule 3: Backward compatibility with string docStrings
  # ===========================================================================

  Rule: renderDocString handles both string and object formats

    Scenario: String docString renders correctly (legacy format)
      Given a docString as plain string "const x = 1"
      When renderDocString is called with language "javascript"
      Then the code block contains "const x = 1"
      And the code block language is "javascript"

    Scenario: Object docString with mediaType takes precedence
      Given a docString object:
        | content | const x = 1 |
        | mediaType | typescript |
      When renderDocString is called with language "javascript"
      Then the code block language is "typescript"
      And the language parameter is ignored
