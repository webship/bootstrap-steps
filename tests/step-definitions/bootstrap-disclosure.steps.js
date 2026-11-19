'use strict';

// Panels (collapse and accordion items), the navigation bar that collapses behind its toggle
// button on a narrow screen, and tabs (tabs, pills and lists that work as tabs, and the tabs a
// server renders as links).
//
// A panel is named by the button or link that shows it (an accordion item by its header), or by
// its own label or id; a navigation bar by its aria-label or its brand (no name: the first one on
// the page); a tab by its label. A panel waits for `shown` / `hidden` and for `.collapsing` to go;
// a tab waits for `shown` AND for its panel's fade, which ends after the event.

const { When, Then } = require('@cucumber/cucumber');
const h = require('./bootstrap-helpers');

async function waitPanel(world, ref, expanded) {
  return h.poll(world, (lib, a) => {
    const s = lib.state('panel', a.ref);
    const done = a.expanded ? lib.isShown('panel', a.ref) : lib.isClosed('panel', a.ref);
    return { done, state: s };
  }, { ref, expanded }, h.budget(world));
}

/**
 * Expand or collapse a panel: a collapse, an accordion item, any content a button or a link shows
 * and hides. The step clicks the button or link the panel is named after when the panel is not
 * already as wanted, then waits for `shown` / `hidden` and for its height (or width) transition to
 * end. In an accordion, expanding an item collapses the one that was open, and the step waits for
 * that too.
 *
 * Example #1: When I expand the "Accordion Item #2" panel
 * Example #2: When I collapse the "Accordion Item #1" panel
 * Example #3: When I expand the "Toggle details" panel
 * Example #4: When I expand the "Toggle width collapse" panel
 * Example #5: When we collapse the "Shipping address" panel
 */
When(/^(?:I |we )?(expand|collapse) the "([^"]*)" panel$/, async function (action, name) {
  const ref = await h.resolve(this, 'panel', name);
  const want = action === 'expand';
  // A panel still moving is let finish first: its button is ignored until then.
  await h.poll(this, (lib, a) => ({ done: lib.state('panel', a.ref).settled }), { ref }, h.budget(this));
  const already = await h.call(this, want ? 'isShown' : 'isClosed', 'panel', ref);
  if (!already) {
    const before = await h.eventSeq(this);
    await h.clickRef(this, ref, `the "${name}" button`);
    const result = await waitPanel(this, ref, want);
    if (!result.done) {
      const events = await h.eventsSince(this, before);
      throw h.failure(this.page, `Expected the "${name}" panel to be ${want ? 'expanded' : 'collapsed'} after clicking its button, but it is ${h.describe(result.state)}.`, {
        found: events.length ? `the component events since the click: ${events.join(', ')}` : 'no component event since the click',
        hint: 'check that the page loads the components script ("the page should use the components script").',
      });
    }
  }
  // An accordion closes its other item in the same transition.
  await h.waitAllSettled(this);
});

/**
 * A panel is expanded (all of its content shown, `shown` come and its transition over) or
 * collapsed (hidden, `hidden` come and its transition over).
 *
 * Example #1: Then the "Accordion Item #1" panel should be expanded
 * Example #2: Then the "Accordion Item #2" panel should be collapsed
 * Example #3: Then the "Toggle both elements" panel should be expanded
 * Example #4: Then the "Billing address" panel should be collapsed
 * Example #5: Then the "Shipping address" panel should be expanded
 */
Then(/^the "([^"]*)" panel should be (expanded|collapsed)$/, async function (name, wanted) {
  const ref = await h.resolve(this, 'panel', name);
  const result = await waitPanel(this, ref, wanted === 'expanded');
  if (!result.done) {
    throw h.failure(this.page, `Expected the "${name}" panel to be ${wanted}, but it is ${h.describe(result.state)}.`, {
      hint: wanted === 'expanded' ? `expand it first: When I expand the "${name}" panel` : `collapse it first: When I collapse the "${name}" panel`,
    });
  }
});

async function resolveNavbar(world, name) {
  const result = await h.poll(world, (lib, a) => {
    const all = lib.navbars();
    if (!a.name) {
      const shown = all.find(lib.isRendered);
      return { done: !!shown, ref: shown ? lib.ref(shown) : 0, names: all.map((n) => lib.navbarNames(n).find(Boolean) || '') };
    }
    const { matches, names } = lib.pick(all, a.name, (n) => lib.navbarNames(n));
    return { done: matches.length > 0, ref: matches.length ? lib.ref(matches[0]) : 0, names };
  }, { name: name || '' }, h.budget(world));
  if (result.ref) return result.ref;
  throw h.failure(world.page, name ? `Expected a navigation bar named "${name}" on the page, but there is none.` : 'Expected a navigation bar on the page, but there is none that is visible.', {
    found: `the navigation bars here: ${h.listed(result.names)}`,
    hint: 'a navigation bar is named by its aria-label or its brand.',
  });
}

async function waitNavbar(world, ref, expanded) {
  return h.poll(world, (lib, a) => {
    const s = lib.navbarState(a.ref);
    return { done: s.exists && s.settled && s.expanded === a.expanded, state: s };
  }, { ref, expanded }, h.budget(world));
}

function navbarLabel(name) {
  return name ? `the "${name}" navigation bar` : 'the navigation bar';
}

/**
 * Expand or collapse a navigation bar with its toggle button, on a screen narrow enough for the
 * bar to hide its links behind it, and wait until the links have finished sliding (`shown` /
 * `hidden` and the end of `.collapsing`; a bar whose button opens a side panel waits for that
 * panel). Without a name, the first navigation bar on the page. At a width where the bar shows its
 * links, expanding does nothing and collapsing fails.
 *
 * Example #1: When I expand the navigation bar
 * Example #2: When I collapse the navigation bar
 * Example #3: When I expand the "Navbar" navigation bar
 * Example #4: When I expand the "Offcanvas navbar" navigation bar
 * Example #5: When we collapse the "Main" navigation bar
 */
When(/^(?:I |we )?(expand|collapse) the (?:"([^"]*)" )?navigation bar$/, async function (action, name) {
  const ref = await resolveNavbar(this, name);
  const want = action === 'expand';
  const now = await h.call(this, 'navbarState', ref);
  if (!now.collapsible) {
    if (want) return;
    const width = await this.page.evaluate(() => window.innerWidth);
    throw h.failure(this.page, `Could not collapse ${navbarLabel(name)}: at ${width} pixels it shows its links and its toggle button is hidden.`, {
      hint: 'make the window narrow first: When I set the viewport to the "xs" breakpoint',
    });
  }
  const settled = await waitNavbar(this, ref, now.expanded);
  if (settled.done && settled.state.expanded === want) return;
  await h.clickRef(this, now.toggler, `the toggle button of ${navbarLabel(name)}`);
  const result = await waitNavbar(this, ref, want);
  if (!result.done) {
    throw h.failure(this.page, `Expected ${navbarLabel(name)} to be ${want ? 'expanded' : 'collapsed'} after clicking its toggle button, but it is ${result.state.expanded ? 'expanded' : 'collapsed'}${result.state.settled ? '' : ' and still moving'}.`, {
      hint: 'check that the page loads the components script ("the page should use the components script").',
    });
  }
});

/**
 * A navigation bar is expanded (its links are shown: either it is wide enough to show them, or its
 * toggle button has opened them and they have finished sliding) or collapsed (its toggle button is
 * shown and its links are hidden). Without a name, the first navigation bar on the page.
 *
 * Example #1: Then the navigation bar should be collapsed
 * Example #2: Then the navigation bar should be expanded
 * Example #3: Then the "Navbar" navigation bar should be collapsed
 * Example #4: Then the "Main" navigation bar should be expanded
 * Example #5: Then the "Offcanvas navbar" navigation bar should be collapsed
 */
Then(/^the (?:"([^"]*)" )?navigation bar should be (expanded|collapsed)$/, async function (name, wanted) {
  const ref = await resolveNavbar(this, name);
  const result = await waitNavbar(this, ref, wanted === 'expanded');
  if (!result.done) {
    const width = await this.page.evaluate(() => window.innerWidth);
    throw h.failure(this.page, `Expected ${navbarLabel(name)} to be ${wanted}, but it is ${result.state.expanded ? 'expanded' : 'collapsed'}${result.state.settled ? '' : ' and still moving'} at ${width} pixels.`, {
      found: `its toggle button is ${result.state.collapsible ? 'shown' : 'hidden'}`,
      hint: wanted === 'collapsed' && !result.state.collapsible ? 'a bar collapses only below its breakpoint: When I set the viewport to the "xs" breakpoint' : `use its toggle button: When I ${wanted === 'expanded' ? 'expand' : 'collapse'} ${navbarLabel(name)}`,
    });
  }
});

/**
 * A navigation bar shows its toggle button (the window is narrower than its breakpoint, so its
 * links are behind the button), or does not (it shows its links). Without a name, the first
 * navigation bar on the page.
 *
 * Example #1: Then the navigation bar should show its toggle button
 * Example #2: Then the navigation bar should not show its toggle button
 * Example #3: Then the "Navbar" navigation bar should show its toggle button
 * Example #4: Then the "Main" navigation bar should not show its toggle button
 * Example #5: Then the "Offcanvas navbar" navigation bar should show its toggle button
 */
Then(/^the (?:"([^"]*)" )?navigation bar should( not)? show its toggle button$/, async function (name, not) {
  const ref = await resolveNavbar(this, name);
  const result = await h.poll(this, (lib, a) => {
    const s = lib.navbarState(a.ref);
    return { done: s.exists && s.collapsible === a.want, state: s };
  }, { ref, want: !not }, h.budget(this));
  if (!result.done) {
    const width = await this.page.evaluate(() => window.innerWidth);
    throw h.failure(this.page, `Expected ${navbarLabel(name)} ${not ? 'not ' : ''}to show its toggle button at ${width} pixels, but it ${result.state.collapsible ? 'does' : 'does not'}.`, {
      hint: 'the button shows below the bar\'s breakpoint (navbar-expand-lg: below 992 pixels); set the width with: When I set the viewport to the "xs" breakpoint',
    });
  }
});

/**
 * Switch to a tab (a tab, a pill, an item of a list that works as tabs) by its label: click it and
 * wait until it is active and its panel has faded in. The `shown` event of a tab comes before its
 * panel has finished fading in, so the step waits for the panel too. A tab that is a link to
 * another page (the tabs a server renders) is followed, and the new page is waited for.
 *
 * Example #1: When I switch to the "Profile" tab
 * Example #2: When I switch to the "Specifications" tab
 * Example #3: When I switch to the "Account settings" tab
 * Example #4: When I switch to the "Contact" tab
 * Example #5: When we switch to the "Reviews" tab
 */
When(/^(?:I |we )?switch to the "([^"]*)" tab$/, async function (name) {
  const ref = await h.resolve(this, 'tab', name);
  if (await h.call(this, 'isShown', 'tab', ref)) return;
  const info = await this.page.evaluate((r) => {
    const el = window.__webshipComponents.lib.deref(r);
    return {
      disabled: el.hasAttribute('disabled') || el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true',
      scripted: !!(el.getAttribute('data-bs-toggle') || el.getAttribute('data-toggle')),
    };
  }, ref);
  if (info.disabled) {
    throw h.failure(this.page, `Could not switch to the "${name}" tab: it is disabled.`, {
      hint: `check that it is not active instead: Then the "${name}" tab should not be active`,
    });
  }
  const url = this.page.url();
  await h.clickRef(this, ref, `the "${name}" tab`);
  let target = ref;
  if (!info.scripted) {
    // A link to another page: the new page has its own tabs.
    if (typeof this.smartSettle === 'function') await this.smartSettle(1500);
    if (this.page.url() !== url) {
      await this.page.waitForLoadState('load').catch(() => {});
      target = await h.resolve(this, 'tab', name);
    }
  }
  const done = await h.waitShown(this, 'tab', target, true);
  if (done !== true) {
    throw h.failure(this.page, `Expected the "${name}" tab to be active after clicking it, but it is ${h.describe(done)}.`, {
      hint: 'check that the page loads the components script ("the page should use the components script").',
    });
  }
});

/**
 * A tab is active (`.active`, `aria-selected`, its panel shown and done fading in) or not.
 *
 * Example #1: Then the "Home" tab should be active
 * Example #2: Then the "Profile" tab should not be active
 * Example #3: Then the "Disabled" tab should not be active
 * Example #4: Then the "Overview" tab should be active
 * Example #5: Then the "Getting started" tab should be active
 */
Then(/^the "([^"]*)" tab should( not)? be active$/, async function (name, not) {
  const ref = await h.resolve(this, 'tab', name);
  const done = await h.waitShown(this, 'tab', ref, !not);
  if (done === true) return;
  const others = await this.page.evaluate(() => {
    const lib = window.__webshipComponents.lib;
    return lib.kinds.tab.all().filter((t) => t.classList.contains('active')).map((t) => lib.nameOf(t));
  });
  throw h.failure(this.page, `Expected the "${name}" tab ${not ? 'not ' : ''}to be active, but it ${not ? 'is' : 'is not'} (${h.describe(done)}).`, {
    found: `the active tabs: ${h.listed(others)}`,
    hint: not ? 'another tab becomes active when it is switched to.' : `switch to it first: When I switch to the "${name}" tab`,
  });
});
