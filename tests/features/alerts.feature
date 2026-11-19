@alerts
Feature: Alerts
  An alert tells the person something, in the colour of its kind; a dismissible one fades out and
  leaves the page when its close button is clicked.

  Background:
    Given I am on "/alerts.html"

  Scenario: Alerts of each kind
    Then I should see the primary alert "A simple primary alert"
    And I should see a success alert "Well done!"
    And I should see an error alert "A simple danger alert"
    And I should see the info alert "A simple info alert"
    And I should not see a danger alert "Well done!"

  @critical
  Scenario: A dismissible alert goes away with its close button
    Then the alert "Holy guacamole!" should be dismissible
    And the alert "A simple primary alert" should not be dismissible
    When I dismiss the alert "Holy guacamole!"
    Then I should not see the alert "Holy guacamole!"
    And I should see the alert "Our office is closed on Friday."

  Scenario: An alert the page adds after a click
    When I press "Show live alert"
    Then I should see a success alert "Nice, you triggered this alert message!"
    When I dismiss the alert "Nice, you triggered this alert message!"
    Then I should not see the alert "Nice, you triggered this alert message!"
