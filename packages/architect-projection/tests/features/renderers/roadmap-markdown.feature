@rendering
Feature: renderMarkdown renders roadmap timeline bundles
  The markdown renderer should keep RoadmapTimeline wired through documentation projection and routed markdown output.

  Background:
    Given the roadmap markdown renderer state is initialized

  Rule: Roadmap documentation bundles stay routed as a flat pattern list

    @routing
    Scenario: roadmap documentation bundle renders routed markdown files
      Given a documentation projection context with roadmap and deferred patterns
      When I project and render the roadmap documentation bundle as markdown
      Then the routed markdown output should include the roadmap root file
      And the roadmap root markdown should summarize the roadmap patterns
