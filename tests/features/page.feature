@page
Feature: The pages of the demo
  Every page of the demo loads the components script, names its parts for assistive technology,
  and passes an accessibility audit with its components open. The audits run on version 5 only:
  the default colours of 4.6 (its navigation links and its link colour) fail the contrast rule.

  @v5 @critical
  Scenario: A page loads the components script of version 5.3
    Given I am on "/index.html"
    Then the page should use the components script at version "5.3"

  @v4
  Scenario: A page loads the components script of version 4.6
    Given I am on "/index.html"
    Then the page should use the components script at version "4.6"

  @v5
  Scenario: The home page lists every component page
    Given I am on "/index.html"
    Then I should see "Overlays"
    And I should see "Collapse and accordion"
    And the page should have no serious accessibility violations

  @v5
  Scenario: An open dialog passes an accessibility audit
    Given I am on "/modal.html"
    When I open the "Modal title" dialog
    Then the page should have no serious accessibility violations
