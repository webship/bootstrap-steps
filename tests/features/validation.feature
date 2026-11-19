@validation
Feature: Form validation states
  A form shows each field as valid or invalid, with a message under it: after the browser checked
  it on sending, or as a server sent it back.

  @critical
  Scenario: A form sent empty shows each field as valid or invalid, with its message
    Given I am on "/validation.html"
    When I press "Submit form"
    Then 5 fields should be shown as invalid
    And the "City" field should be shown as invalid
    And the "City" field should show the message "Please provide a valid city."
    And the "First name" field should be shown as valid
    And the "First name" field should show the message "Looks good!"
    And the "Agree to terms and conditions" field should show the message "You must agree before submitting."

  Scenario: A field turns valid as soon as it is filled in
    Given I am on "/validation.html"
    When I press "Submit form"
    And I fill in "City" with "Springfield"
    Then the "City" field should be shown as valid
    And 4 fields should be shown as invalid

  Scenario: A form filled in correctly is sent
    Given I am on "/validation.html"
    When I fill in "Username" with "mdo"
    And I fill in "City" with "Springfield"
    And I select "Texas" from "State"
    And I fill in "Zip" with "12345"
    And I check "Agree to terms and conditions"
    And I press "Submit form"
    Then no field should be shown as invalid
    And I should see the success alert "Thanks, the form is valid and was sent."

  Scenario: A form a server sent back with its fields marked
    Given I am on "/validation-server.html"
    Then 5 fields should be shown as invalid
    And the "Username" field should be shown as invalid
    And the "Username" field should show the feedback "Please choose a username."
    And the "Last name" field should be shown as valid
