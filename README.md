<p align="center"><img src="https://raw.githubusercontent.com/webship/bootstrap-steps/2.0.x/assets/logo.svg" alt="Bootstrap logo" width="96"></p>

# bootstrap-steps

Cucumber step definitions for the components of any site that uses Bootstrap,
for [webship-js](https://webship.co/docs/webship-js/2.0.x), a BDD browser
automation harness built on Playwright and Cucumber-js.

`@webship-js/bootstrap-steps` works on any site whose theme is built on
Bootstrap 5.3, whatever its CMS or framework, and on 4.6 wherever the same step
holds (many older themes use it): dialogs (modals), side panels (offcanvas),
drop-down menus, panels and accordions (collapse), tabs and pills, the
navigation bar that hides its links behind a toggle button on a narrow screen,
alerts, notifications (toasts), carousels, tooltips and popovers, the validation
states of a form, list groups, pagination, breadcrumbs, badges, spinners and
progress bars.

The point of the pack is the waits. A component that opens or closes moves for a
few hundred milliseconds: a dialog fades and slides down, a panel grows, a side
panel slides in, a tab's panel fades in, a carousel slides, a notification
fades. Every step waits on the component's own signals: its end event
(`shown.bs.modal`, `hidden.bs.collapse`, `slid.bs.carousel` ...), the classes it
carries while it moves (`collapsing`, `showing`, `carousel-item-next` ...) and
the CSS transitions still running in it. No step sleeps for a fixed time.

No step phrase names the framework: a scenario reads `When I open the
"Settings" dialog`, `Then the "Shipping" panel should be expanded` and `When I
choose "Profile" from the "Account" drop-down menu`.

CI serves the pack's demo site (`demo-site/`, built from the framework's own
documentation and examples) with DDEV on the runner and runs the whole suite
against its 5.3 pages twice, then against its 4.6 pages, then the assertions
that must fail; and it builds a real Drupal site with a free theme built on
Bootstrap 5 and runs the pack's steps there too; see
[`.github/workflows/test.yml`](.github/workflows/test.yml).

## From nothing to a green run

What the machine needs: git, Node.js 24 or later with npm, and Docker with
[DDEV](https://ddev.com) for the demo site (or no container at all: `npx
http-server` serves the same pages).

**1. A site.** Any site that uses the components works (step 5 points the suite
at it). To start, use the demo site of this repository: static pages, one per
component, with the markup of the documentation and the examples of version
5.3 (and the same pages on 4.6 under `/4.6/`). Start it with DDEV:

```bash
git clone https://github.com/webship/bootstrap-steps.git
cd bootstrap-steps/demo-site
ddev start
```

The site answers at `http://bootstrap-steps-demo.ddev.site`. Without DDEV, from
the `bootstrap-steps` folder, `npx --yes http-server@14.1.1 demo-site -p 8080
-s` serves it at `http://127.0.0.1:8080`; leave it running in its own terminal.

In the [Webship Workspace](https://github.com/webship/workspace), its Bootstrap
plugin serves the same demo site in a container instead, in a sites folder of
the workspace (`dev/` here; `test/`, `sandboxes/` and `demos/` work the same):

```bash
bash core/scripts/plugins.sh --require bootstrap --with-needs
bash core/scripts/plugins.sh --activate bootstrap --with-needs
bash core/scripts/plugins.sh --install bootstrap
bash dev/cmd-bootstrap-project.sh bssite --install
```

That site answers at `https://bssite.ddev.site` (`--bootstrap 4.6` serves the
4.6 pages there instead). Neither site has accounts: the steps need none.

**2. A test project**, in another folder:

```bash
mkdir bootstrap-tests && cd bootstrap-tests
npm init -y
npm install --save-dev webship-js @webship-js/bootstrap-steps
npx init-webship-js
```

`npx init-webship-js` writes `cucumber.js`, `playwright.config.ts`, the
`tests/` folders with a first feature and the `npm test` scripts, and installs
Chromium. npm usually runs it already when it installs webship-js; a second run
changes nothing.

**3. `cucumber.js`.** Replace the file with the wiring of the pack: the step
files of webship-js and of the pack, the tags that keep the lanes of this
repository out of a normal run, and the address of the site. The suite needs no
account.

```javascript
module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'node_modules/@webship-js/bootstrap-steps/tests/step-definitions/*.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/**/*.feature'],
    // Work in progress, the assertions that must fail, and the scenarios of the 4.6 pages only
    // stay out of a normal run (for the 4.6 pages: 'not @wip and not @must-fail and not @v5').
    tags: 'not @wip and not @must-fail and not @v4',
    format: ['@cucumber/pretty-formatter', 'json:tests/reports/cucumber_report.json'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://bootstrap-steps-demo.ddev.site',
      // Browser errors are reported, not failed: the demo site raises none.
      javascript: { mode: 'warn', levels: ['error'] },
      // The waits webship-js adds around each page, scenario and step (milliseconds).
      minWaitTime: { page: 3000, before_scenario: 0, after_scenario: 0, before_step: 0, after_step: 0 },
    },
  },
};
```

**4. A first feature**, `tests/features/first-run.feature`:

```gherkin
Feature: First run
  Scenario: A dialog opens, shows its text and closes
    Given I am on "/modal.html"
    When I open the "Modal title" dialog
    Then the "Modal title" dialog should show "you're reading this text in a modal"
    When I close the "Modal title" dialog
    Then no dialog should be shown

  Scenario: Opening an accordion item closes the one that was open
    Given I am on "/collapse.html"
    When I expand the "Accordion Item #2" panel
    Then the "Accordion Item #2" panel should be expanded
    And the "Accordion Item #1" panel should be collapsed
```

**5. Run it.** Set `LAUNCH_URL` to the address of the site:
`http://bootstrap-steps-demo.ddev.site` for the demo started with DDEV,
`http://127.0.0.1:8080` for the one `npx http-server` serves, and
`https://bssite.ddev.site` for the Workspace's.

```bash
LAUNCH_URL=http://bootstrap-steps-demo.ddev.site npm test
```

A green first run prints every step, then the summary (the starter feature of
`npx init-webship-js` and the two scenarios above, passed) and the HTML report
it wrote:

```
3 scenarios (3 passed)
11 steps (11 passed)
0m03.683s (executing steps: 0m03.645s)
[webship-js] HTML report → …/bootstrap-tests/tests/reports/cucumber_report.html
```

From there, copy the features of [`tests/features/`](tests/features/) (they
also ship in the package, under
`node_modules/@webship-js/bootstrap-steps/tests/features/`): together they use
every step of the pack, against the pages of the demo site.

### On a site of your own

The steps read the components' standard markup, so the features of your site
name its own components: the titles of its dialogs, the buttons of its menus,
the headers of its accordions. Point `LAUNCH_URL` at the site and write them
from what its pages show. A page whose theme loads only the style sheet and not
the components script has dialogs and menus that never open: `Then the page
should use the components script` says so first.

In the Webship Workspace, any project with a testing setup takes the pack
beside its platform's own (the Drupal, WordPress, Joomla ... step packs): the
pack goes in the same profile, since none of its phrases is shared with them.

```bash
bash dev/cmd-tools-testing.sh mysite --add-steps bootstrap
```

### What the suite tests

The features of this repository run every step of the pack against the demo
site, in CI on every change: dialogs (open with their button or by another
step, Escape, a click outside, a static backdrop that refuses both, a dialog
that fills itself in from the button that opened it, one dialog switching to
another, long and scrollable dialogs, the keyboard focus inside), side panels
(the four edges, a static backdrop, a panel without a backdrop, a menu inside a
panel), drop-down menus (the menu of a button, of a link and of a split button,
active and disabled items, a choice that changes the page, the keyboard, the
ways a menu closes, a form in a menu, the menus of the navigation bar), panels
and accordions (a link and a button for one panel, a panel that grows
sideways, one button for two panels, an accordion that closes the open item and
one that does not), the navigation bar at a wide and a narrow width (its
toggle button, two bars on one page, a bar that opens a side panel), tabs (the
panel of each tab, a disabled tab, the arrow keys, pills, a list that works as
tabs), alerts (each kind, dismissing, an alert added by a click), notifications
(shown, hiding by themselves, staying, stacking, without a header), carousels
(controls, indicators, a crossfade, a carousel that plays by itself), tooltips
and popovers (on hover, on a link, on a disabled button, with formatted text,
open and closed by a click and by the next click), the validation states of a
form checked in the browser and of one a server sent back, list groups,
pagination, breadcrumbs, badges, spinners while a list loads and a progress
bar during an upload; and an accessibility audit of a page and of an open
dialog. The 4.6 lane runs the same features against the 4.6 pages, but for
what 4.6 does not have (side panels, menus that close in other ways, a panel
that grows sideways, the arrow keys in tabs, one dialog switching to another).

Not tested: scrollspy, button toggles, placeholders and the other components
without a state to wait for, and dark colour modes (the steps read classes and
events, not colours).

## Requirements

- Node.js 24 or later
- A webship-js 2.0 test project (webship-js 2.0.16 or later)
- A site that uses the components of version 5.3 (or 4.6), with their script

## Install

```bash
npm install --save-dev @webship-js/bootstrap-steps
```

## Quick start

1. Add the step files to the `require` list of your webship-js `cucumber.js`,
   after webship-js's own:

   ```javascript
   require: [
     'node_modules/webship-js/tests/step-definitions/**/*.js',
     'node_modules/@webship-js/bootstrap-steps/tests/step-definitions/*.js',
     'tests/step-definitions/**/*.js',
   ],
   ```

2. Point `launchUrl` at the site:

   ```javascript
   worldParameters: {
     launchUrl: process.env.LAUNCH_URL || 'https://your-site.example.com',
   },
   ```

3. Write a feature from what your pages show:

```gherkin
Feature: The account menu
  Scenario: The account menu leads to the profile
    Given I am on "/"
    When I choose "Profile" from the "Account" drop-down menu
    Then I should be on "/user/profile"
```

Run `npx cucumber-js --dry-run` once: it reports any undefined or ambiguous
step before a browser opens.

## Test users

None. The demo site is static and has no sign-in; the steps need no account on
any site (log in with your platform's own step pack when a page needs it).
`cucumber.js` lists no accounts and no scenario signs in:

```json
{}
```

## What is included

| File | Steps | Covers |
| --- | --- | --- |
| `bootstrap-overlays.steps.js` | 12 | Dialogs, side panels, drop-down menus, notifications, tooltips and popovers: open (with their own button or a named one), close, Escape, a click outside, shown or not, what they show, a button pressed in one, an item chosen from a menu, the active and disabled items of a menu, a hint on hover, none of a kind shown, and the wait for every component to stop moving. |
| `bootstrap-disclosure.steps.js` | 7 | Panels and accordions (expand, collapse, their state), the navigation bar (expand, collapse, its state, its toggle button), tabs (switch to one, active or not). |
| `bootstrap-feedback.steps.js` | 8 | Alerts (of a kind, dismissed, dismissible), a notification that hides by itself, loading spinners (shown, gone), progress bars (at a value, reaching one). |
| `bootstrap-carousel.steps.js` | 5 | Carousels: the next and the previous slide, a slide by its number, the slide shown, what it shows, a carousel that moves on by itself. |
| `bootstrap-forms.steps.js` | 3 | A field shown as valid or invalid, the message under it, how many fields are invalid. |
| `bootstrap-content.steps.js` | 6 | List items (active, disabled), the current page of a pagination or a breadcrumb, the disabled links of a pagination, a breadcrumb's trail, badges, and the components script the page loads. |
| `bootstrap-helpers.js` | | Shared plumbing for the files above and for your own steps: the wait budgets, the poll on the page, finding a component by the name a person reads, waiting for it to be shown or closed and done moving, clicks, Escape, a click outside, the failure messages. It registers no step. |
| `bootstrap-probe.js` | | The page side: put into every page before its own scripts, it records the components' events (as DOM events on version 5, through jQuery on 4.6) and reads their states. It registers no step. |

Text, links, buttons, the plain filling of fields, the keyboard, the viewport and
the accessibility audit are webship-js's own steps (`I should see "..."`, `I
press "..."`, `I fill in "..." with "..."`, `I press the key "ArrowDown"`, `I
set the viewport to the "xs" breakpoint`, `the page should have no serious
accessibility violations`): this pack adds only the components, their states
and their waits.

## How the steps find things and wait

- **By what a person reads.** A dialog or a side panel by its title (its
  `aria-labelledby`, its `.modal-title` or `.offcanvas-title`), a drop-down menu
  by its button (for a split button, the main button of the group), a panel by
  the button or link that shows it (an accordion item by its header), a tab by
  its label, a notification by its title (or its text when it has no header),
  a tooltip by its text, a popover by its title (or its text), a carousel by its
  `aria-label` (or its id), a navigation bar by its `aria-label` or its brand, a
  field by its label, a pagination or a breadcrumb by the `aria-label` of its
  `nav`. A name matches exactly, then without regard to case, then by its start.
  The stable hooks of the components are the fallback: `data-bs-toggle` and
  `data-bs-target` (`data-toggle` and `data-target` on 4.6), the state classes.
- **On the components' own signals.** Each component has a start event and an
  end event: `show` / `shown`, `hide` / `hidden`, `slide` / `slid`, `close` /
  `closed`. The page side of the pack listens for all of them from the first
  moment of every page (on 4.6, where they go through jQuery only, as soon as
  jQuery is there), and a step waits until the end event has come, the
  transitional classes have gone and no CSS transition is running in the
  component. Three of those events come early, and the steps wait past them:
  a tab's `shown` comes before its panel has faded in, a notification's `shown`
  before it has faded in, and a dialog's `.show` class 300 milliseconds before
  its `shown`. A progress bar's value changes at once and its width follows with
  a transition: the steps wait until both agree.
- **Actions wait for the answer.** `When I press Escape in ...` and `When I
  click outside ...` wait for the component to close, or to refuse (a static
  backdrop: `hidePrevented` and the dialog's bounce), or to stay, and to stop
  moving. Escape is pressed with the keyboard focus in the component, as a
  keyboard user's is: after a click on a backdrop the focus is on the page's
  body, where Escape does nothing.
- **A short notification can be gone before the next step.** webship-js's own
  steps let the page settle after a click (longer while a timer of the page is
  pending), so a notification that hides itself in less than about two seconds
  can be gone before `should be shown` looks. Assert that it hides by itself
  (`Then the "..." notification should hide by itself`), or give it a longer
  delay; the demo's quick notification hides after four seconds.
- **No fixed sleeps.** A step waits at most `minWaitTime.page` (at least 10
  seconds); a notification that hides by itself, a carousel that moves on by
  itself, a spinner and a progress bar at most 30. The page is looked at every
  50 milliseconds from Node.js, never with a timer of the page (webship-js counts
  those as pending work).
- **Failures say what was found.** `Expected the "Static backdrop" dialog to be
  closed, but it is open, last event hidePrevented.bs.modal, classes "modal fade
  show" after 10 seconds.` with a hint on where to look.

## Steps

One example of each step; the JSDoc block above each definition holds five or
more.

### `bootstrap-overlays.steps.js` (12)

- `When I open the "Modal title" dialog`
- `When I close the "Offcanvas" side panel`
- `When I press Escape in the "Modal title" dialog`
- `When I click outside the "Static backdrop" dialog`
- `Then the "Reminder" notification should be shown`
- `Then the "Popover title" popover should show "And here's some amazing content."`
- `When I press "Save changes" in the "Modal title" dialog`
- `When I choose "Medium" from the "Choose a size" drop-down menu`
- `Then "Disabled link" should be disabled in the "Item states" drop-down menu`
- `When I hover over the "Tooltip on top" button`
- `Then no tooltip should be shown`
- `When I wait for the transitions to finish`

### `bootstrap-disclosure.steps.js` (7)

- `When I expand the "Accordion Item #2" panel`
- `Then the "Accordion Item #1" panel should be collapsed`
- `When I expand the navigation bar`
- `Then the "Main" navigation bar should be collapsed`
- `Then the navigation bar should show its toggle button`
- `When I switch to the "Profile" tab`
- `Then the "Home" tab should not be active`

### `bootstrap-feedback.steps.js` (8)

- `Then I should see a success alert "Well done!"`
- `When I dismiss the alert "Holy guacamole!"`
- `Then the alert "Holy guacamole!" should be dismissible`
- `Then the "Draft saved" notification should hide by itself`
- `Then I should see a loading spinner`
- `When I wait for the loading spinner to disappear`
- `Then the "Quarter done" progress bar should be at 25%`
- `Then the "Upload" progress bar should reach 100%`

### `bootstrap-carousel.steps.js` (5)

- `When I go to the next slide of the "Featured" carousel`
- `When I go to slide 3 of the "Featured" carousel`
- `Then the "Featured" carousel should show slide 2 of 3`
- `Then the "Featured" carousel should show "First slide label"`
- `Then the "Autoplay" carousel should move to the next slide by itself`

### `bootstrap-forms.steps.js` (3)

- `Then the "City" field should be shown as invalid`
- `Then the "City" field should show the message "Please provide a valid city."`
- `Then 5 fields should be shown as invalid`

### `bootstrap-content.steps.js` (6)

- `Then the list item "An active item" should be active`
- `Then the current page of the "Archive pages" pagination should be "2"`
- `Then the "Previous" link of the pagination should be disabled`
- `Then the breadcrumb should read "Home > Library > Data"`
- `Then the "Inbox" button should show the badge "99+"`
- `Then the page should use the components script at version "5.3"`

## Testing this package

```bash
npm install
npm run demo:serve &       # the demo site at http://127.0.0.1:8080 (or: cd demo-site && ddev start)
npm run test:examples      # the examples and the features against the step patterns
npm run test:paths         # a feature or a scenario named on the command line runs alone
npx cucumber-js --dry-run  # no undefined and no ambiguous step
LAUNCH_URL=http://127.0.0.1:8080 npm test              # the suite, against the 5.3 pages
LAUNCH_URL=http://127.0.0.1:8080 npm run test:v4       # the suite, against the 4.6 pages
LAUNCH_URL=http://127.0.0.1:8080 npm run test:must-fail   # assertions that must fail, each with its message
```

`tests/must-fail/` holds scenarios that assert something that is not true on the
demo site. `npm run test:must-fail` runs them and checks that each one fails at
its last step, with the message it announces and a hint: a step that cannot
fail proves nothing. It runs them with a wait of 3 seconds
(`COMPONENT_WAIT_MS`), since each of them waits its whole budget;
`MUST_FAIL_TAGS="@must-fail and not @v5"` runs them against the 4.6 pages.

`tests/cms/` holds the features of the real site of CI: a Drupal site with a
free theme built on Bootstrap 5, built by
[`.github/scripts/build-drupal-site.sh`](.github/scripts/build-drupal-site.sh)
with a page of components, a front page with a pager and the theme's own
navigation bar, messages, forms and tabs:

```bash
SITE_DIR="$PWD/../drupal-site" .github/scripts/build-drupal-site.sh
LAUNCH_URL=https://bootstrapstepsdrupal.ddev.site npx cucumber-js tests/cms
```

`LAUNCH_URL` points the suite at another site; `npx cucumber-js
tests/features/dialogs.feature` runs one feature and `npx cucumber-js
tests/features/dialogs.feature:<line>` one scenario (the line of its
`Scenario:`); `FEATURES` runs a subset too
(`FEATURES=tests/features/dialogs.feature npm test`); `CUCUMBER_TAGS=@critical`
runs the smoke lane; `HEADLESS=false` shows the browser.

The suite leaves the site as it found it: the demo site is static, and every
change a scenario makes lives in its own browser.

## The demo site

[`demo-site/`](demo-site/) is a set of static pages, one per component, built
from the documentation and the examples of Bootstrap 5.3.9 (and 4.6.2 under
[`demo-site/4.6/`](demo-site/4.6/)): the markup of the docs' examples, with
their texts adapted so that every component has a name a person can read (two
dialogs titled "Modal title" in the docs are "Modal title" and "Static
backdrop" here), and a few small scripts that stand in for what a site does (a
choice that changes the page, a list that takes three seconds to load, an
upload, the answer to a valid form). Each page loads the framework's own
compiled files, kept unchanged in `demo-site/vendor/` and
`demo-site/4.6/vendor/`.

- Bootstrap's code is released under the
  [MIT licence](https://github.com/twbs/bootstrap/blob/main/LICENSE), copyright
  The Bootstrap Authors; its compiled files are in this repository with their
  `LICENSE` beside them.
- Bootstrap's documentation, where the demo's markup and many of its texts come
  from, is released under
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), by The Bootstrap
  Authors ([getbootstrap.com](https://getbootstrap.com/docs/5.3/)). The demo's
  markup is adapted from it: the texts are changed and the pages are put
  together for testing.
- jQuery 3.5.1 (the slim build the 4.6 documentation uses) is released under the
  [MIT licence](https://jquery.org/license/), copyright the OpenJS Foundation
  and other contributors; its `LICENSE.txt` is beside it.

## How the steps were written

Every component a step touches was opened in a real browser first, and its
events and states were recorded while it moved: which event comes when, which
classes it carries meanwhile, how long its transitions run, where the keyboard
focus goes. The steps were written from that, and are proven on Bootstrap 5.3.9
and 4.6.2 (the demo site) and on a Drupal 11 site with the free theme
`bootstrap5`, in English, with Chromium.

## License

MIT

## Logo

The Bootstrap logo in this README comes from Simple Icons 16.37.0, filled with the colour the set lists for the brand; the set is CC0-1.0 and lists this icon under the MIT licence of its source. The Bootstrap name and logo are trademarks of their owner; this pack is not affiliated with or endorsed by them.
