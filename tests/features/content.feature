@content
Feature: Lists, pagination, breadcrumbs and badges
  The states a page draws on its content: the active and disabled items of a list, the current
  page of a pagination and of a breadcrumb, and the badges on buttons, headings and list items.

  Scenario: The active and disabled items of a list
    Given I am on "/list-group.html"
    Then the list item "An active item" should be active
    And the list item "A disabled item" should be disabled
    And the list item "A second item" should not be active
    And the list item "A second link item" should not be disabled
    And the list item "A disabled link item" should be disabled

  @critical
  Scenario: The current page and the disabled links of a pagination
    Given I am on "/pagination.html"
    Then the current page of the pagination should be "1"
    And the "Previous" link of the pagination should be disabled
    And the "Next" link of the pagination should not be disabled
    And the current page of the "Archive pages" pagination should be "2"
    And the "Previous" link of the "Archive pages" pagination should not be disabled
    And the current page of the "Gallery pages" pagination should be "3"
    And the "Next" link of the "Gallery pages" pagination should be disabled

  Scenario: A breadcrumb reads as a trail to the current page
    Given I am on "/breadcrumb.html"
    Then the breadcrumb should read "Home > Library > Data"
    And the current page of the breadcrumb should be "Data"
    And the "Shop breadcrumb" breadcrumb should read "Shop / Chairs / Garden chair"
    And the current page of the "Shop breadcrumb" breadcrumb should be "Garden chair"

  Scenario: Badges on buttons, headings and list items
    Given I am on "/badges.html"
    Then the "Notifications" button should show the badge "4"
    And the "Inbox" button should show the badge "99+"
    And the "Archive" button should not show the badge "1"
    And the "Example heading" heading should show the badge "New"
    When I go to "/list-group.html"
    Then the "Inbox messages" list item should show the badge "14"
    And the "Archived messages" list item should not show the badge "14"
