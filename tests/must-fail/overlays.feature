@must-fail
Feature: Assertions on dialogs, side panels, menus, notifications and hints that must fail
  Each scenario asserts something that is not true on the demo site, at its last step.
  tests/check-must-fail.js runs them and checks the message of each failure.

  Scenario: A closed dialog is not shown
    Fails with: Expected the "Modal title" dialog to be shown, but it is closed
    Given I am on "/modal.html"
    Then the "Modal title" dialog should be shown

  Scenario: An open dialog is shown
    Fails with: Expected the "Modal title" dialog to be closed, but it is open
    Given I am on "/modal.html"
    When I open the "Modal title" dialog
    Then the "Modal title" dialog should not be shown

  Scenario: A dialog that does not exist
    Fails with: Expected a dialog named "Settings" on the page, but there is none.
    Given I am on "/modal.html"
    Then the "Settings" dialog should not be shown

  Scenario: A dialog with a static backdrop does not close with Escape
    Fails with: Expected the "Static backdrop" dialog to be closed, but it is open
    Given I am on "/modal.html"
    When I open the "Static backdrop" dialog
    And I press Escape in the "Static backdrop" dialog
    Then the "Static backdrop" dialog should not be shown

  Scenario: A text the dialog does not show
    Fails with: Expected the "Modal title" dialog to show "Goodbye", but it does not.
    Given I am on "/modal.html"
    When I open the "Modal title" dialog
    Then the "Modal title" dialog should show "Goodbye"

  Scenario: A button in a dialog that is not open
    Fails with: Could not press "Save changes" in the "Modal title" dialog: it is closed
    Given I am on "/modal.html"
    Then I press "Save changes" in the "Modal title" dialog

  Scenario: An open dialog is a dialog shown
    Fails with: Expected no dialog to be shown, but one is: "Modal title".
    Given I am on "/modal.html"
    When I open the "Modal title" dialog
    Then no dialog should be shown

  @v5
  Scenario: A side panel with a static backdrop stays after a click outside
    Fails with: Expected the "Static offcanvas" side panel to be closed, but it is open
    Given I am on "/offcanvas.html"
    When I open the "Static offcanvas" side panel
    And I click outside the "Static offcanvas" side panel
    Then the "Static offcanvas" side panel should not be shown

  Scenario: An item the menu does not have
    Fails with: Expected the "Dropdown button" drop-down menu to show "Delete", but it does not.
    Given I am on "/dropdowns.html"
    When I open the "Dropdown button" drop-down menu
    Then the "Dropdown button" drop-down menu should show "Delete"

  Scenario: A disabled item cannot be chosen
    Fails with: Could not choose "Disabled link" from the "Item states" drop-down menu: the item is disabled.
    Given I am on "/dropdowns.html"
    When I choose "Disabled link" from the "Item states" drop-down menu

  Scenario: A regular item is not active
    Fails with: Expected "Regular link" to be active in the "Item states" drop-down menu, but it is not active.
    Given I am on "/dropdowns.html"
    Then "Regular link" should be active in the "Item states" drop-down menu

  Scenario: A notification that stays does not hide by itself
    Fails with: Expected the "Sticky note" notification to hide by itself, but its automatic hiding is off.
    Given I am on "/toasts.html"
    When I press "Show sticky toast"
    Then the "Sticky note" notification should hide by itself

  Scenario: A notification that was never shown
    Fails with: Expected the "Reminder" notification to be shown, but it is closed
    Given I am on "/toasts.html"
    Then the "Reminder" notification should be shown

  Scenario: A tooltip that nobody pointed at
    Fails with: Expected a tooltip named "Tooltip on top" on the page, but there is none.
    Given I am on "/tooltips.html"
    Then the "Tooltip on top" tooltip should be shown

  Scenario: A tooltip that is shown
    Fails with: Expected no tooltip to be shown, but one is: "Tooltip on top".
    Given I am on "/tooltips.html"
    When I hover over the "Tooltip on top" button
    Then no tooltip should be shown

  Scenario: A popover that is open
    Fails with: Expected the "Popover title" popover not to be shown, but it is open
    Given I am on "/popovers.html"
    When I press "Click to toggle popover"
    Then the "Popover title" popover should not be shown
