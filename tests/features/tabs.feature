@tabs
Feature: Tabs
  A tab shows its panel and hides the others. Its "shown" event comes before the panel has
  finished fading in: a test waits for the panel.

  Background:
    Given I am on "/tabs.html"

  @critical
  Scenario: Switching tabs shows each tab's panel
    Then the "Home" tab should be active
    When I switch to the "Profile" tab
    Then the "Profile" tab should be active
    And the "Home" tab should not be active
    And the "Profile" tab should show "This is some placeholder content the Profile tab's associated content."

  Scenario: A disabled tab is never active
    Then the "Disabled" tab should not be active

  @v5
  Scenario: The arrow keys move between the tabs
    When I switch to the "Profile" tab
    And I press the key "ArrowRight"
    Then the "Contact" tab should be active
    And the "Profile" tab should not be active

  Scenario: Pills work as tabs
    When I switch to the "Specifications" tab
    Then the "Specifications" tab should show "Height 82 cm"
    And the "Overview" tab should not be active
    And the "Home" tab should be active

  Scenario: A list that works as tabs
    Given I am on "/list-group.html"
    When I switch to the "Account settings" tab
    Then the "Account settings" tab should show "Change your name"
    And the list item "Account settings" should be active
    And the list item "Getting started" should not be active
