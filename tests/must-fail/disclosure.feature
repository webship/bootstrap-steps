@must-fail
Feature: Assertions on panels, the navigation bar and tabs that must fail
  Each scenario asserts something that is not true on the demo site, at its last step.

  Scenario: A collapsed panel is not expanded
    Fails with: Expected the "Toggle details" panel to be expanded, but it is closed
    Given I am on "/collapse.html"
    Then the "Toggle details" panel should be expanded

  Scenario: The open accordion item closes when another opens
    Fails with: Expected the "Accordion Item #1" panel to be expanded, but it is closed
    Given I am on "/collapse.html"
    When I expand the "Accordion Item #3" panel
    Then the "Accordion Item #1" panel should be expanded

  Scenario: A panel that does not exist
    Fails with: Expected a panel named "Shipping options" on the page, but there is none.
    Given I am on "/collapse.html"
    When I expand the "Shipping options" panel

  Scenario: A wide window does not collapse the navigation bar
    Fails with: Expected the navigation bar to be collapsed, but it is expanded at
    Given I am on "/navbar.html"
    Then the navigation bar should be collapsed

  Scenario: The navigation bar cannot be collapsed where it shows its links
    Fails with: Could not collapse the navigation bar: at
    Given I am on "/navbar.html"
    When I collapse the navigation bar

  Scenario: A narrow window shows the toggle button
    Fails with: Expected the navigation bar not to show its toggle button at 375 pixels, but it does.
    When I set the viewport to the "xs" breakpoint
    And I go to "/navbar.html"
    Then the navigation bar should not show its toggle button

  Scenario: The first tab is not active after switching
    Fails with: Expected the "Home" tab to be active, but it is not
    Given I am on "/tabs.html"
    When I switch to the "Contact" tab
    Then the "Home" tab should be active

  Scenario: A disabled tab cannot be switched to
    Fails with: Could not switch to the "Disabled" tab: it is disabled.
    Given I am on "/tabs.html"
    When I switch to the "Disabled" tab

  Scenario: A tab's panel does not show another tab's text
    Fails with: Expected the "Home" tab to show "Height 82 cm", but it does not.
    Given I am on "/tabs.html"
    Then the "Home" tab should show "Height 82 cm"
