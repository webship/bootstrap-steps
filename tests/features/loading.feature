@loading
Feature: Spinners and progress bars
  A spinner turns while the page waits for something; a progress bar announces how far a task has
  come and draws it, its width following the value with a short movement.

  @critical
  Scenario: A spinner turns while a list loads
    Given I am on "/loading.html"
    When I press "Load results"
    Then I should see a loading spinner
    When I wait for the loading spinner to disappear
    Then I should not see a loading spinner
    And I should see "3 results found."

  Scenario: The kinds of spinners
    Given I am on "/spinners.html"
    Then I should see a loading spinner

  Scenario: A progress bar fills during an upload
    Given I am on "/progress.html"
    Then the "Upload" progress bar should be at 0%
    When I press "Start upload"
    Then the "Upload" progress bar should reach 100%
    And I should see "Upload complete."

  Scenario: The value of a bar and its width agree
    Given I am on "/progress.html"
    Then the "Quarter done" progress bar should be at 25%
    And the "Disk space" progress bar should be at 40%
    And the "Complete" progress bar should be at 100%
    And the "Not started" progress bar should be at 0%
