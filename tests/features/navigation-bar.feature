@navigation-bar
Feature: The navigation bar on a narrow screen
  Below its breakpoint, a navigation bar hides its links behind a toggle button; the links slide
  open under it and slide closed again.

  Scenario: A wide window shows the links
    Given I am on "/navbar.html"
    Then the navigation bar should not show its toggle button
    And the navigation bar should be expanded

  @critical
  Scenario: A narrow window hides the links behind the toggle button
    When I set the viewport to the "xs" breakpoint
    And I go to "/navbar.html"
    Then the navigation bar should show its toggle button
    And the navigation bar should be collapsed
    When I expand the navigation bar
    Then the navigation bar should be expanded
    When I choose "Modal" from the "Overlays" drop-down menu
    Then I should be on "/modal.html"

  Scenario: Each bar of a page toggles on its own
    When I set the viewport to the "xs" breakpoint
    And I go to "/navbar.html"
    And I expand the "Navbar" navigation bar
    Then the "Navbar" navigation bar should be expanded
    And the "Main" navigation bar should be collapsed
    When I collapse the "Navbar" navigation bar
    Then the "Navbar" navigation bar should be collapsed

  @v5
  Scenario: A bar whose toggle button opens a side panel
    Given I am on "/navbar.html"
    Then the "Offcanvas navbar" navigation bar should show its toggle button
    When I expand the "Offcanvas navbar" navigation bar
    Then the "Site menu" side panel should be shown
    And the "Offcanvas navbar" navigation bar should be expanded
    When I close the "Site menu" side panel
    Then the "Offcanvas navbar" navigation bar should be collapsed
