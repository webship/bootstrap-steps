@panels
Feature: Panels and accordions
  A panel grows open and shrinks closed under the button or link that shows it. In an accordion,
  opening one item closes the one that was open, in the same movement.

  Background:
    Given I am on "/collapse.html"

  @critical
  Scenario: A panel expands and collapses with its button
    Then the "Toggle details" panel should be collapsed
    When I expand the "Toggle details" panel
    Then the "Toggle details" panel should be expanded
    And the "Toggle details" panel should show "This panel is hidden by default"
    When I collapse the "Toggle details" panel
    Then the "Toggle details" panel should be collapsed

  Scenario: A link and a button show the same panel
    When I expand the "Show details" panel
    Then the "Toggle details" panel should be expanded
    When I collapse the "Toggle details" panel
    Then the "Show details" panel should be collapsed

  @v5
  Scenario: A panel that grows sideways
    When I expand the "Toggle width collapse" panel
    Then the "Toggle width collapse" panel should show "horizontal collapse"

  Scenario: One button shows two panels
    When I expand the "Toggle both elements" panel
    Then the "Toggle first element" panel should be expanded
    And the "Toggle second element" panel should be expanded
    When I collapse the "Toggle first element" panel
    Then the "Toggle second element" panel should be expanded
    And the "Toggle first element" panel should be collapsed

  Scenario: Opening an accordion item closes the one that was open
    Then the "Accordion Item #1" panel should be expanded
    When I expand the "Accordion Item #2" panel
    Then the "Accordion Item #2" panel should be expanded
    And the "Accordion Item #1" panel should be collapsed
    And the "Accordion Item #2" panel should show "This is the second item's accordion body."

  Scenario: The items of an accordion without a parent open on their own
    When I expand the "Billing address" panel
    Then the "Shipping address" panel should be expanded
    And the "Billing address" panel should be expanded
    When I collapse the "Shipping address" panel
    Then the "Shipping address" panel should be collapsed
    And the "Payment" panel should be collapsed
