@menus
Feature: Drop-down menus
  A menu drops down from its button or link, is named after it, and closes when an item is chosen,
  when the page is clicked, or with Escape, unless it was made to close in another way.

  Background:
    Given I am on "/dropdowns.html"

  @critical
  Scenario: A menu opens, lists its items and closes
    When I open the "Dropdown button" drop-down menu
    Then the "Dropdown button" drop-down menu should be shown
    And the "Dropdown button" drop-down menu should show "Another action"
    And the "Dropdown button" drop-down menu should not show "Separated link"
    When I close the "Dropdown button" drop-down menu
    Then the "Dropdown button" drop-down menu should not be shown

  Scenario: Choosing an item closes the menu and changes the page
    When I choose "Medium" from the "Choose a size" drop-down menu
    Then the "Choose a size" drop-down menu should not be shown
    And I should see "Size: Medium."

  Scenario: The menu of a link, and the menu of a split button
    When I open the "Dropdown link" drop-down menu
    Then the "Dropdown link" drop-down menu should show "Second link"
    When I open the "Publish" drop-down menu
    Then the "Publish" drop-down menu should show "Schedule"
    And the "Dropdown link" drop-down menu should not be shown

  Scenario: The active and the disabled items of a menu
    Then "Active link" should be active in the "Item states" drop-down menu
    And "Disabled link" should be disabled in the "Item states" drop-down menu
    And "Regular link" should not be active in the "Item states" drop-down menu
    And "Regular link" should not be disabled in the "Item states" drop-down menu

  Scenario: The keyboard moves in a menu and Escape closes it
    When I open the "Dropdown button" drop-down menu
    And I press the key "ArrowDown"
    Then the focused element should be labeled "Action"
    When I press Escape in the "Dropdown button" drop-down menu
    Then the "Dropdown button" drop-down menu should not be shown
    And the focused element should be labeled "Dropdown button"

  Scenario: A click on the page closes a menu
    When I open the "Dropdown button" drop-down menu
    And I click outside the "Dropdown button" drop-down menu
    Then the "Dropdown button" drop-down menu should not be shown

  @v5
  Scenario: Menus that close from inside only, from outside only, or by hand
    When I open the "Clickable inside" drop-down menu
    And I click outside the "Clickable inside" drop-down menu
    Then the "Clickable inside" drop-down menu should be shown
    When I choose "Inside item" from the "Clickable inside" drop-down menu
    Then the "Clickable inside" drop-down menu should not be shown
    When I open the "Clickable outside" drop-down menu
    And I choose "Outside item" from the "Clickable outside" drop-down menu
    Then the "Clickable outside" drop-down menu should be shown
    When I click outside the "Clickable outside" drop-down menu
    Then the "Clickable outside" drop-down menu should not be shown
    When I open the "Manual close" drop-down menu
    And I click outside the "Manual close" drop-down menu
    And I choose "Manual item" from the "Manual close" drop-down menu
    Then the "Manual close" drop-down menu should be shown
    When I close the "Manual close" drop-down menu
    Then no drop-down menu should be shown

  @v5
  Scenario: A form in a menu stays open while it is filled in
    When I open the "Dropdown form" drop-down menu
    And I fill in "Email address" with "visitor@example.com"
    And I check "Remember me"
    Then the "Dropdown form" drop-down menu should be shown

  Scenario: The menus of the navigation bar lead to the pages
    When I choose "Modal" from the "Overlays" drop-down menu
    Then I should be on "/modal.html"
    And "Modal" should be active in the "Overlays" drop-down menu
    And "Toasts" should not be active in the "Overlays" drop-down menu
