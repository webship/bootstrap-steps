@side-panels @v5
Feature: Side panels
  A side panel slides in from an edge of the page over a backdrop and takes the keyboard focus
  when it has arrived. A test waits for the slide before it uses the panel, and for the slide back
  before it uses the page again.

  Background:
    Given I am on "/offcanvas.html"

  @critical
  Scenario: A side panel opens with a link styled as a button and closes with its close button
    When I open the "Offcanvas" side panel with the "Link with href" button
    Then the "Offcanvas" side panel should be shown
    And the "Offcanvas" side panel should show "Some text as placeholder."
    When I close the "Offcanvas" side panel
    Then the "Offcanvas" side panel should not be shown

  Scenario: Escape and a click outside close a side panel
    When I open the "Offcanvas" side panel
    And I press Escape in the "Offcanvas" side panel
    Then the "Offcanvas" side panel should not be shown
    When I open the "Offcanvas" side panel with the "Button with data-bs-target" button
    And I click outside the "Offcanvas" side panel
    Then no side panel should be shown

  Scenario: A side panel with a static backdrop stays when the page behind it is clicked
    When I open the "Static offcanvas" side panel
    And I click outside the "Static offcanvas" side panel
    Then the "Static offcanvas" side panel should be shown
    When I press Escape in the "Static offcanvas" side panel
    Then the "Static offcanvas" side panel should not be shown

  Scenario: A side panel without a backdrop
    When I open the "Offcanvas with body scrolling" side panel
    Then the "Offcanvas with body scrolling" side panel should show "Try scrolling the rest of the page"
    When I press "Close" in the "Offcanvas with body scrolling" side panel
    Then the "Offcanvas with body scrolling" side panel should not be shown

  Scenario Outline: A side panel slides in from the <edge> edge
    When I open the "<panel>" side panel with the "<button>" button
    Then the "<panel>" side panel should show "<text>"
    When I close the "<panel>" side panel
    Then no side panel should be shown

    Examples:
      | edge   | panel            | button                  | text                                  |
      | top    | Offcanvas top    | Toggle top offcanvas    | This panel slides down from the top.  |
      | right  | Offcanvas right  | Toggle right offcanvas  | This panel slides in from the right.  |
      | bottom | Offcanvas bottom | Toggle bottom offcanvas | This panel slides up from the bottom. |

  Scenario: A menu inside a side panel
    When I open the "Offcanvas" side panel
    And I choose "Another action" from the "Panel actions" drop-down menu
    Then the "Panel actions" drop-down menu should not be shown
    And the "Offcanvas" side panel should be shown
