@dialogs
Feature: Dialogs
  A dialog opens over the page: its backdrop fades in, then the dialog fades in and slides down,
  and only then does it take the keyboard focus. A test waits until that is over before it reads
  or clicks anything in it, and until the dialog and its backdrop have gone before it goes on with
  the page.

  Background:
    Given I am on "/modal.html"

  @critical
  Scenario: A dialog opens with its button and closes with its close button
    When I open the "Modal title" dialog
    Then the "Modal title" dialog should be shown
    And the "Modal title" dialog should show "Woo-hoo, you're reading this text in a modal!"
    When I close the "Modal title" dialog
    Then the "Modal title" dialog should not be shown
    And no dialog should be shown

  Scenario: A dialog opened by another step is waited for
    When I press "Launch demo modal"
    Then the "Modal title" dialog should be shown
    When I press "Save changes" in the "Modal title" dialog
    Then the "Modal title" dialog should not be shown

  Scenario: Escape and a click outside close a dialog
    When I open the "Modal title" dialog
    And I press Escape in the "Modal title" dialog
    Then the "Modal title" dialog should not be shown
    When I open the "Modal title" dialog
    And I click outside the "Modal title" dialog
    Then the "Modal title" dialog should not be shown

  Scenario: A dialog with a static backdrop refuses Escape and a click outside
    When I open the "Static backdrop" dialog
    And I click outside the "Static backdrop" dialog
    Then the "Static backdrop" dialog should be shown
    When I press Escape in the "Static backdrop" dialog
    Then the "Static backdrop" dialog should be shown
    When I press "Close" in the "Static backdrop" dialog
    Then the "Static backdrop" dialog should not be shown

  Scenario: A dialog fills itself in from the button that opened it
    When I open the "New message to @fat" dialog with the "Open modal for @fat" button
    Then the "New message to @fat" dialog should show "Recipient:"
    And the "Recipient:" field should contain "@fat"
    When I close the "New message to @fat" dialog
    And I open the "New message to @mdo" dialog with the "Open modal for @mdo" button
    Then the "Recipient:" field should contain "@mdo"

  @v5
  Scenario: A button in one dialog switches to another
    When I open the "Modal 1" dialog with the "Open first modal" button
    And I press "Open second modal" in the "Modal 1" dialog
    Then the "Modal 2" dialog should be shown
    And the "Modal 1" dialog should not be shown
    When I press "Back to first" in the "Modal 2" dialog
    Then the "Modal 1" dialog should be shown
    When I close the "Modal 1" dialog
    Then no dialog should be shown

  Scenario: A long dialog and a scrollable one
    When I open the "Long content" dialog
    Then the "Long content" dialog should show "This is some placeholder content to show the scrolling behavior for modals."
    When I close the "Long content" dialog
    And I open the "Scrollable dialog" dialog
    Then the "Scrollable dialog" dialog should show "This content should appear at the bottom after you scroll."
    When I press Escape in the "Scrollable dialog" dialog
    Then no dialog should be shown

  Scenario: A dialog in the middle of the window
    When I open the "Centered dialog" dialog with the "Vertically centered modal" button
    Then the "Centered dialog" dialog should show "This is a vertically centered modal."
    And the focused element should match "#exampleModalCenter"
