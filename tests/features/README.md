# Features

Reference features for the demo site of this repository (`demo-site/`, a page for every
component, with the markup of Bootstrap's documentation and examples). Copy a feature into your
project and replace the pages, names and texts with those of your site: a dialog's title, a menu's
button, a panel's button, a tab's label.

| Feature | Covers |
| --- | --- |
| `dialogs` | Opening a dialog with its button or by another step, closing it, Escape, a click outside, a static backdrop that refuses both, a dialog that fills itself in from its button, one dialog switching to another, long and scrollable dialogs, the keyboard focus. |
| `side-panels` | `@v5`. Side panels: opened by a link and by a button, Escape, a click outside, a static backdrop, a panel without a backdrop, the four edges, a menu inside a panel. |
| `menus` | Drop-down menus: a button's, a link's and a split button's, active and disabled items, a choice that changes the page, the keyboard, a click on the page, the ways a menu closes (`@v5`), a form in a menu (`@v5`), the menus of the navigation bar. |
| `panels` | Panels and accordions: a link and a button for one panel, a panel that grows sideways (`@v5`), one button for two panels, an accordion that closes its open item and one that does not. |
| `navigation-bar` | The navigation bar at a wide and a narrow width, its toggle button, two bars on one page, a bar that opens a side panel (`@v5`). |
| `tabs` | Tabs and the panel of each, a disabled tab, the arrow keys (`@v5`), pills, a list that works as tabs. |
| `alerts` | Alerts of each kind, dismissing one, an alert added by a click. |
| `notifications` | A notification that hides by itself, one that stays, the live notification, two that stack, one without a header. |
| `carousels` | The controls, the indicators, the last slide leading back to the first, a crossfade, a carousel that plays by itself. |
| `hints` | Tooltips on hover (a button, a link, a disabled button, formatted text) and popovers (opened and closed by a click, closed by the next click, without a title). |
| `validation` | A form sent empty, a field that turns valid, a form filled in correctly, a form a server sent back. |
| `content` | List groups, pagination, breadcrumbs and badges. |
| `loading` | A spinner while a list loads, the kinds of spinners, a progress bar during an upload, the value and the width of a bar. |
| `page` | The components script of each version, an accessibility audit of a page and of an open dialog (`@v5`). |

`@v5` marks a scenario that holds on version 5 only, `@v4` one for the 4.6 pages only; the default
run of `cucumber.js` leaves out `@v4`, the 4.6 lane (`npm run test:v4`) leaves out `@v5`. A run
leaves the site as it found it: the demo site is static, and every change a scenario makes lives in
its own browser.
