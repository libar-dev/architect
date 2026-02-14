# ✅ Doc String Media Type

**Purpose:** Detailed requirements for the Doc String Media Type feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Annotation |

## Description

DocString language hints (mediaType) should be preserved through the parsing
pipeline from feature files to rendered output. This prevents code blocks
from being incorrectly escaped when the language hint is lost.

## Acceptance Criteria

**Parse DocString with typescript mediaType**

- Given a feature file containing a typescript docstring
- When the feature file is parsed
- Then parsing succeeds
- And scenario 1 step 1 has docString.content containing "const x: number = 1"
- And scenario 1 step 1 has docString.mediaType "typescript"

**Parse DocString with json mediaType**

- Given a feature file containing a json docstring
- When the feature file is parsed
- Then scenario 1 step 1 has docString.mediaType "json"

**Parse DocString with jsdoc mediaType**

- Given a feature file containing a jsdoc docstring
- When the feature file is parsed
- Then scenario 1 step 1 has docString.mediaType "jsdoc"

**DocString without mediaType has undefined mediaType**

- Given a feature file containing a plain docstring without mediaType
- When the feature file is parsed
- Then scenario 1 step 1 has docString.content "Just some plain text"
- And scenario 1 step 1 has docString.mediaType undefined

**TypeScript mediaType renders as typescript code block**

- Given a docString with content "const x: number = 1;" and mediaType "typescript"
- When the step docString is rendered
- Then the code block language is "typescript"

**JSDoc mediaType prevents asterisk escaping**

- Given a docString with content "/\*_ @param name _/" and mediaType "jsdoc"
- When the step docString is rendered
- Then the code block language is "jsdoc"
- And asterisks are not escaped in the output

**Missing mediaType falls back to default language**

- Given a docString with content "some content" and no mediaType
- When the step docString is rendered with default language "markdown"
- Then the code block language is "markdown"

**String docString renders correctly (legacy format)**

- Given a docString as plain string "const x = 1"
- When renderDocString is called with language "javascript"
- Then the code block contains "const x = 1"
- And the code block language is "javascript"

**Object docString with mediaType takes precedence**

- Given a docString with content "const x = 1" and mediaType "typescript"
- When renderDocString is called with language "javascript"
- Then the code block language is "typescript"
- And the language parameter is ignored

## Business Rules

**Parser preserves DocString mediaType during extraction**

_Verified by: Parse DocString with typescript mediaType, Parse DocString with json mediaType, Parse DocString with jsdoc mediaType, DocString without mediaType has undefined mediaType_

**MediaType is used when rendering code blocks**

_Verified by: TypeScript mediaType renders as typescript code block, JSDoc mediaType prevents asterisk escaping, Missing mediaType falls back to default language_

**renderDocString handles both string and object formats**

_Verified by: String docString renders correctly (legacy format), Object docString with mediaType takes precedence_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
