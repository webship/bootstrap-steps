@cms
Feature: The components on a site made with a CMS and a free theme
  The site of this lane is a Drupal 11 site whose default theme is the free theme bootstrap5, built
  by .github/scripts/build-drupal-site.sh (or by the Webship Workspace's Drupal plugin): the
  theme's own navigation bar, messages, pager and tabs, and a page of components an editor wrote
  with the framework's markup. Nobody signs in.

  Scenario: The theme loads the components script
    Given I am on "/components"
    Then the page should use the components script at version "5.3"

  @critical
  Scenario: The navigation bar folds on a narrow screen, and its drop-down menu opens
    When I set the viewport to the "xs" breakpoint
    And I go to "/components"
    Then the navigation bar should show its toggle button
    And the navigation bar should be collapsed
    When I expand the navigation bar
    Then the navigation bar should be expanded
    When I open the "Services" drop-down menu
    Then the "Services" drop-down menu should show "Development"
    When I collapse the navigation bar
    Then the navigation bar should be collapsed

  Scenario: A wide window shows the links of the navigation bar
    Given I am on "/components"
    Then the navigation bar should not show its toggle button
    And the navigation bar should be expanded

  @critical
  Scenario: A dialog an editor wrote in a page
    Given I am on "/components"
    When I open the "Opening hours" dialog
    Then the "Opening hours" dialog should show "Monday to Friday, from 9:00 to 17:00."
    When I press Escape in the "Opening hours" dialog
    Then no dialog should be shown

  Scenario: An accordion, tabs and a carousel an editor wrote in a page
    Given I am on "/components"
    Then the "How long does delivery take?" panel should be expanded
    When I expand the "Can I return an item?" panel
    Then the "How long does delivery take?" panel should be collapsed
    And the "Can I return an item?" panel should show "within thirty days"
    When I switch to the "Support" tab
    Then the "Support" tab should show "We answer within one working day."
    And the "Design" tab should not be active
    When I go to the next slide of the "Projects" carousel
    Then the "Projects" carousel should show slide 2 of 3
    And the "Projects" carousel should show "A shop"

  Scenario: A dismissible alert, and a form as the server sent it back
    Given I am on "/components"
    When I dismiss the alert "Our office is closed on public holidays."
    Then I should not see the alert "Our office is closed on public holidays."
    And the "Your email" field should be shown as invalid
    And the "Your email" field should show the message "Please enter a valid email address."
    And the "Your name" field should be shown as valid
    And 1 field should be shown as invalid

  @critical
  Scenario: The theme shows the site's messages as alerts
    Given I am on "/user/login"
    When I fill in "Username" with "nobody"
    And I fill in "Password" with "not-the-password"
    And I click the "Log in" button
    Then I should see a danger alert "Unrecognized username or password."
    And the alert "Unrecognized username or password." should be dismissible
    When I dismiss the alert "Unrecognized username or password."
    Then I should not see the alert "Unrecognized username or password."

  Scenario: The tabs of a page are links to other pages
    Given I am on "/user/login"
    Then the "Log in" tab should be active
    When I switch to the "Reset your password" tab
    Then the "Reset your password" tab should be active
    And the "Log in" tab should not be active
    And the breadcrumb should read "Home"

  Scenario: The front page's pager
    Given I am on "/node"
    Then the current page of the pagination should be "1"
    And the "Next" link of the pagination should not be disabled
    When I go to "/node?page=1"
    Then the current page of the pagination should be "2"
