@must-fail
Feature: Assertions on forms, lists, pagination, breadcrumbs, badges and the page that must fail
  Each scenario asserts something that is not true on the demo site, at its last step.

  Scenario: An invalid field is not shown as valid
    Fails with: Expected the "City" field to be shown as valid, but it is shown as invalid.
    Given I am on "/validation-server.html"
    Then the "City" field should be shown as valid

  Scenario: A message the field does not show
    Fails with: Expected the "City" field to show the message "Looks good!", but it shows another.
    Given I am on "/validation-server.html"
    Then the "City" field should show the message "Looks good!"

  Scenario: Another count of invalid fields
    Fails with: Expected 3 fields to be shown as invalid, but 5 are.
    Given I am on "/validation-server.html"
    Then 3 fields should be shown as invalid

  Scenario: A field that does not exist
    Fails with: Expected a field labelled "Country" on the page, but there is none.
    Given I am on "/validation.html"
    Then the "Country" field should be shown as invalid

  Scenario: A list item that is not active
    Fails with: Expected the list item "A second item" to be active, but it is not active.
    Given I am on "/list-group.html"
    Then the list item "A second item" should be active

  Scenario: Another current page
    Fails with: Expected the current page of the pagination to be "2", but it is "1".
    Given I am on "/pagination.html"
    Then the current page of the pagination should be "2"

  Scenario: A link of the pagination that can be followed
    Fails with: Expected the "Next" link of the pagination to be disabled, but it is not disabled.
    Given I am on "/pagination.html"
    Then the "Next" link of the pagination should be disabled

  Scenario: Another trail
    Fails with: Expected the breadcrumb to read "Home > Data", but it reads "Home > Library > Data".
    Given I am on "/breadcrumb.html"
    Then the breadcrumb should read "Home > Data"

  Scenario: Another badge
    Fails with: Expected the "Inbox" button to show the badge "100", but it shows another.
    Given I am on "/badges.html"
    Then the "Inbox" button should show the badge "100"

  Scenario: Another version of the components script
    Fails with: Expected the page to use the components script at version 3.4, but it uses
    Given I am on "/index.html"
    Then the page should use the components script at version "3.4"
