@notifications
Feature: Notifications
  A notification fades in, in a corner of the page, and hides itself after its delay unless that
  is turned off. Its "shown" event comes before it has faded in: a test waits for the fade.

  Background:
    Given I am on "/toasts.html"

  @critical
  Scenario: A notification appears and hides by itself
    When I press "Save draft"
    Then the "Draft saved" notification should be shown
    And the "Draft saved" notification should show "Your draft was saved."
    And the "Draft saved" notification should hide by itself
    And no notification should be shown

  Scenario: A notification that stays until it is closed
    When I press "Show sticky toast"
    Then the "Sticky note" notification should be shown
    When I close the "Sticky note" notification
    Then the "Sticky note" notification should not be shown

  Scenario: The live notification hides after five seconds
    When I press "Show live toast"
    Then the "Reminder" notification should show "Hello, world! This is a toast message."
    And the "Reminder" notification should hide by itself

  Scenario: Two notifications stack
    When I press "Show two toasts"
    Then the "Upload started" notification should be shown
    And the "Upload finished" notification should be shown
    When I close the "Upload started" notification
    Then the "Upload started" notification should not be shown
    And the "Upload finished" notification should be shown

  Scenario: A notification without a header is named by its text
    When I press "Show plain toast"
    Then the "A notification without a header." notification should be shown
    When I press "Close" in the "A notification without a header." notification
    Then no notification should be shown
