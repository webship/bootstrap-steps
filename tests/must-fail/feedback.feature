@must-fail
Feature: Assertions on alerts, spinners, progress bars and carousels that must fail
  Each scenario asserts something that is not true on the demo site, at its last step.

  Scenario: An alert of another kind
    Fails with: Expected a success alert "Holy guacamole!", but there is none.
    Given I am on "/alerts.html"
    Then I should see a success alert "Holy guacamole!"

  Scenario: An alert that is there
    Fails with: Expected no warning alert "Holy guacamole!", but it is shown.
    Given I am on "/alerts.html"
    Then I should not see the warning alert "Holy guacamole!"

  Scenario: An alert without a close button cannot be dismissed
    Fails with: Could not dismiss the alert "A simple primary alert": it has no close button.
    Given I am on "/alerts.html"
    When I dismiss the alert "A simple primary alert"

  Scenario: A dismissible alert
    Fails with: Expected the alert "Holy guacamole!" not to be dismissible, but it has a close button.
    Given I am on "/alerts.html"
    Then the alert "Holy guacamole!" should not be dismissible

  Scenario: A page without a spinner
    Fails with: Expected a loading spinner, but none is shown.
    Given I am on "/loading.html"
    Then I should see a loading spinner

  Scenario: A page whose spinners never stop
    Fails with: Expected no loading spinner, but 3 are shown.
    Given I am on "/spinners.html"
    Then I should not see a loading spinner

  Scenario: A bar at another value
    Fails with: Expected the "Quarter done" progress bar to be at 50%, but it announces 25% and shows 25%.
    Given I am on "/progress.html"
    Then the "Quarter done" progress bar should be at 50%

  Scenario: A bar that does not move by itself
    Fails with: Expected the "Upload" progress bar to reach 100%, but it announces 0% and shows 0%.
    Given I am on "/progress.html"
    Then the "Upload" progress bar should reach 100%

  Scenario: A carousel on another slide
    Fails with: Expected the "Featured" carousel to show slide 2 of 3, but it shows slide 1 of 3.
    Given I am on "/carousel.html"
    Then the "Featured" carousel should show slide 2 of 3

  Scenario: A slide that is not the one shown
    Fails with: Expected the "Featured" carousel to show "Second slide label", but its slide 1 of 3 does not.
    Given I am on "/carousel.html"
    Then the "Featured" carousel should show "Second slide label"

  Scenario: A carousel that does not play by itself
    Fails with: Expected the "Featured" carousel to move to slide 2 by itself
    Given I am on "/carousel.html"
    Then the "Featured" carousel should move to the next slide by itself

  Scenario: A slide the carousel does not have
    Fails with: Could not go to slide 5 of the "Featured" carousel: it has 3 slides.
    Given I am on "/carousel.html"
    When I go to slide 5 of the "Featured" carousel
