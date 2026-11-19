@carousels
Feature: Carousels
  A carousel slides from one slide to the next. Its indicators change at the start of the slide,
  its "slid" event comes at the end: a test reads the slide once it has stopped.

  Background:
    Given I am on "/carousel.html"

  @critical
  Scenario: The controls move to the next and the previous slide
    Then the "Featured" carousel should show slide 1 of 3
    And the "Featured" carousel should show "First slide label"
    When I go to the next slide of the "Featured" carousel
    Then the "Featured" carousel should show slide 2 of 3
    And the "Featured" carousel should show "Some representative placeholder content for the second slide."
    When I go to the previous slide of the "Featured" carousel
    Then the "Featured" carousel should show slide 1 of 3

  Scenario: The indicators go to a slide, and the last slide leads back to the first
    When I go to slide 3 of the "Featured" carousel
    Then the "Featured" carousel should show "Third slide label"
    And the "Featured" carousel should not show "Second slide label"
    When I go to the next slide of the "Featured" carousel
    Then the "Featured" carousel should show slide 1 of 3

  Scenario: Slides that fade into each other
    When I go to the next slide of the "Crossfade" carousel
    Then the "Crossfade" carousel should show "A green noon"
    And the "Crossfade" carousel should not show "A blue morning"

  Scenario: A carousel that plays by itself
    Then the "Autoplay" carousel should move to the next slide by itself
