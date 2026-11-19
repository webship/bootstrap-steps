@hints
Feature: Tooltips and popovers
  A tooltip fades in when the pointer or the keyboard focus reaches its element and goes when they
  leave; a popover opens and closes with a click. Both are added to the page when they open and
  removed when they close.

  @critical
  Scenario: A tooltip shows on hover and goes when the pointer moves on
    Given I am on "/tooltips.html"
    When I hover over the "Tooltip on top" button
    Then the "Tooltip on top" tooltip should be shown
    When I hover over the "Tooltip on right" button
    Then the "Tooltip on right" tooltip should be shown
    And the "Tooltip on top" tooltip should not be shown

  Scenario: The tooltip of a link and of a disabled button
    Given I am on "/tooltips.html"
    When I hover over the "inline links" link
    Then the "Default tooltip" tooltip should be shown
    When I hover over the "Disabled button" button
    Then the "Disabled tooltip" tooltip should be shown
    And the "Default tooltip" tooltip should not be shown

  Scenario: A tooltip with formatted text
    Given I am on "/tooltips.html"
    When I hover over the "Tooltip with HTML" button
    Then the "Tooltip with HTML" tooltip should be shown
    And no popover should be shown

  Scenario: A popover opens and closes with its button
    Given I am on "/popovers.html"
    When I press "Click to toggle popover"
    Then the "Popover title" popover should be shown
    And the "Popover title" popover should show "And here's some amazing content."
    When I press "Click to toggle popover"
    Then no popover should be shown

  Scenario: A popover that closes on the next click
    Given I am on "/popovers.html"
    When I click "Dismissible popover"
    Then the "Dismissible popover" popover should be shown
    When I click outside the "Dismissible popover" popover
    Then the "Dismissible popover" popover should not be shown

  Scenario: A popover without a title is named by its text
    Given I am on "/popovers.html"
    When I press "Popover on left"
    Then the "Left popover" popover should be shown
    And no tooltip should be shown
