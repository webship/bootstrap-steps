'use strict';

// The states that content components carry: the active and disabled items of a list group, the
// current page and the disabled links of a pagination, the trail and the current page of a
// breadcrumb, the badges of a button, a link, a heading, a list item or a tab, and the components
// script the page loads.
//
// A pagination or a breadcrumb is named by the aria-label of its `nav`; without a name, the first
// one on the page. The breadcrumb's dividers are drawn by the style sheet, so a trail is written
// with any of ">", "/", "›" or "»" between its items.

const { Then } = require('@cucumber/cucumber');
const h = require('./bootstrap-helpers');

/**
 * A list group item is active (`.active`, `aria-current`) or disabled (`.disabled`,
 * `aria-disabled`, the `disabled` attribute), or not. The item is named by its text, without its
 * badge.
 *
 * Example #1: Then the list item "An active item" should be active
 * Example #2: Then the list item "A disabled item" should be disabled
 * Example #3: Then the list item "A second item" should not be active
 * Example #4: Then the list item "A second link item" should not be disabled
 * Example #5: Then the list item "Account settings" should be active
 */
Then(/^the list item "([^"]*)" should( not)? be (active|disabled)$/, async function (name, not, wanted) {
  const result = await h.poll(this, (lib, a) => {
    const { matches, names } = lib.listItems(a.name);
    const hit = matches.find(lib.isRendered) || matches[0];
    if (!hit) return { done: false, names };
    const s = lib.itemState(lib.ref(hit));
    return { done: s[a.wanted] === !a.not, found: true, state: s, names };
  }, { name, wanted, not: !!not }, h.budget(this));
  if (result.done) return;
  if (!result.found) {
    throw h.failure(this.page, `Expected a list item "${name}" on the page, but there is none.`, {
      found: `the list items here: ${h.listed(result.names)}`,
      hint: 'a list item is named by its text, without its badge.',
    });
  }
  throw h.failure(this.page, `Expected the list item "${name}" ${not ? 'not ' : ''}to be ${wanted}, but it is ${result.state[wanted] ? '' : 'not '}${wanted}.`, {
    found: `active: ${result.state.active ? 'yes' : 'no'}, disabled: ${result.state.disabled ? 'yes' : 'no'}`,
    hint: wanted === 'active' ? 'the active item carries the class "active" and aria-current.' : 'a disabled item carries the class "disabled" or aria-disabled="true".',
  });
});

async function resolveContainer(world, selector, name, noun) {
  const result = await h.poll(world, (lib, a) => {
    const { all, chosen } = lib.containerNamed(a.selector, a.name);
    const names = all.map((el) => { const nav = el.closest('nav') || el; return nav.getAttribute('aria-label') || ''; });
    return { done: !!chosen, ref: chosen ? lib.ref(chosen) : 0, names };
  }, { selector, name: name || '' }, h.budget(world));
  if (result.ref) return result.ref;
  throw h.failure(world.page, name ? `Expected a ${noun} named "${name}" on the page, but there is none.` : `Expected a ${noun} on the page, but there is none that is visible.`, {
    found: `the ${noun}s here: ${h.listed(result.names)}`,
    hint: `a ${noun} is named by the aria-label of its nav element.`,
  });
}

function label(noun, name) {
  return name ? `the "${name}" ${noun}` : `the ${noun}`;
}

/**
 * The current page of a pagination (its active item, `aria-current="page"`) or of a breadcrumb
 * (its last, active item) is the one named. Without a name, the first pagination or breadcrumb on
 * the page.
 *
 * Example #1: Then the current page of the pagination should be "1"
 * Example #2: Then the current page of the "Archive pages" pagination should be "2"
 * Example #3: Then the current page of the breadcrumb should be "Data"
 * Example #4: Then the current page of the "Shop breadcrumb" breadcrumb should be "Garden chair"
 * Example #5: Then the current page of the "Gallery pages" pagination should be "3"
 */
Then(/^the current page of the (?:"([^"]*)" )?(pagination|breadcrumb) should be "([^"]*)"$/, async function (name, noun, wanted) {
  const ref = await resolveContainer(this, noun === 'pagination' ? '.pagination' : '.breadcrumb', name, noun);
  const result = await h.poll(this, (lib, a) => {
    const info = a.noun === 'pagination' ? lib.pagination(a.ref) : lib.trail(a.ref);
    const names = info ? (info.currentNames || [info.current]) : [];
    return { done: names.some((n) => lib.norm(n).toLowerCase() === lib.norm(a.wanted).toLowerCase()), info };
  }, { ref, noun, wanted }, h.budget(this));
  if (result.done) return;
  const info = result.info || {};
  throw h.failure(this.page, `Expected the current page of ${label(noun, name)} to be "${wanted}", but it is ${info.current ? `"${info.current}"` : 'none'}.`, {
    found: noun === 'pagination' ? `its links: ${h.listed((info.links || []).map((l) => l.names[0]))}` : `its trail: ${(info.items || []).join(' > ') || '(empty)'}`,
    hint: noun === 'pagination' ? 'the current page is the item with the class "active" (aria-current="page").' : 'the current page is the last item, with aria-current="page" (or the class "active").',
  });
});

/**
 * A link of a pagination is disabled (its item has the class `disabled`, or the link
 * `aria-disabled="true"`, or it has no address), or with "not" can be followed. A link is named by
 * its text or its aria-label ("Previous", "Next", "2"). Without a name, the first pagination on
 * the page.
 *
 * Example #1: Then the "Previous" link of the pagination should be disabled
 * Example #2: Then the "Next" link of the pagination should not be disabled
 * Example #3: Then the "Next" link of the "Gallery pages" pagination should be disabled
 * Example #4: Then the "Previous" link of the "Archive pages" pagination should not be disabled
 * Example #5: Then the "2" link of the "Search results pages" pagination should not be disabled
 */
Then(/^the "([^"]*)" link of the (?:"([^"]*)" )?pagination should( not)? be disabled$/, async function (link, name, not) {
  const ref = await resolveContainer(this, '.pagination', name, 'pagination');
  const info = await h.call(this, 'pagination', ref);
  const want = h.norm(link).toLowerCase();
  // Exactly, then by the start of a name: "Next" is the link a screen reader names "Next page".
  const links = info.links || [];
  const hit = links.find((l) => l.names.some((n) => h.norm(n).toLowerCase() === want))
    || links.find((l) => l.names.some((n) => h.norm(n).toLowerCase().startsWith(want)));
  if (!hit) {
    throw h.failure(this.page, `Expected a link "${link}" in ${label('pagination', name)}, but there is none.`, {
      found: `its links: ${h.listed(links.map((l) => l.names[0]))}`,
      hint: 'a link is named by its text or its aria-label (an arrow link by its aria-label: "Previous", "Next").',
    });
  }
  if (hit.disabled === !not) return;
  throw h.failure(this.page, `Expected the "${link}" link of ${label('pagination', name)} ${not ? 'not ' : ''}to be disabled, but it is ${hit.disabled ? '' : 'not '}disabled.`, {
    hint: 'a disabled link sits in an item with the class "disabled" (aria-disabled="true" on the link).',
  });
});

/**
 * A breadcrumb reads as a trail of items, from the first to the current page, with any of ">",
 * "/", "›" or "»" between them in the step (the page draws its own divider with the style sheet).
 * Without a name, the first breadcrumb on the page.
 *
 * Example #1: Then the breadcrumb should read "Home > Library > Data"
 * Example #2: Then the "Shop breadcrumb" breadcrumb should read "Shop > Chairs > Garden chair"
 * Example #3: Then the breadcrumb should read "Home / Library / Data"
 * Example #4: Then the "breadcrumb" breadcrumb should read "Home › Library › Data"
 * Example #5: Then the breadcrumb should read "Home » Library » Data"
 */
Then(/^the (?:"([^"]*)" )?breadcrumb should read "([^"]*)"$/, async function (name, trailText) {
  const ref = await resolveContainer(this, '.breadcrumb', name, 'breadcrumb');
  const wanted = trailText.split(/\s*[>/›»]\s*/).map((s) => h.norm(s)).filter(Boolean);
  const result = await h.poll(this, (lib, a) => {
    const info = lib.trail(a.ref);
    const items = info ? info.items.map((s) => lib.norm(s).toLowerCase()) : [];
    const done = items.length === a.wanted.length && items.every((s, i) => s === a.wanted[i].toLowerCase());
    return { done, items: info ? info.items : [] };
  }, { ref, wanted }, h.budget(this));
  if (result.done) return;
  throw h.failure(this.page, `Expected ${label('breadcrumb', name)} to read "${wanted.join(' > ')}", but it reads "${result.items.join(' > ')}".`, {
    hint: 'write the items in order, from the first to the current page, with ">" between them.',
  });
});

/**
 * A button, a link, a heading, a list item or a tab shows a badge with a text (its visible text,
 * not the words it has for screen readers only), or with "not" does not. The element is named by
 * its own text, without the badge ("Inbox" for a button that reads "Inbox 99+").
 *
 * Example #1: Then the "Inbox" button should show the badge "99+"
 * Example #2: Then the "Notifications" button should show the badge "4"
 * Example #3: Then the "Example heading" heading should show the badge "New"
 * Example #4: Then the "Inbox messages" list item should show the badge "14"
 * Example #5: Then the "Archive" button should not show the badge "1"
 */
Then(/^the "([^"]*)" (button|link|heading|list item|tab) should( not)? show the badge "([^"]*)"$/, async function (name, kind, not, badge) {
  const result = await h.poll(this, (lib, a) => {
    const { matches, names } = lib.badgeHolders(a.kind, a.name);
    if (!matches.length) return { done: false, names };
    const badges = lib.badgesOf(lib.ref(matches[0]));
    const has = badges.some((b) => lib.norm(b.text).toLowerCase() === lib.norm(a.badge).toLowerCase());
    return { done: a.not ? !has : has, found: true, badges, names };
  }, { kind, name, badge, not: !!not }, h.budget(this));
  if (result.done) return;
  if (!result.found) {
    throw h.failure(this.page, `Expected a ${kind} named "${name}" on the page, but there is none that is visible.`, {
      found: `the ${kind} names here: ${h.listed(result.names)}`,
      hint: `a ${kind} is named by its own text, without its badge.`,
    });
  }
  throw h.failure(this.page, `Expected the "${name}" ${kind} ${not ? 'not ' : ''}to show the badge "${badge}", but it ${not ? 'does' : (result.badges.length ? 'shows another' : 'shows none')}.`, {
    found: `its badges: ${h.listed(result.badges.map((b) => b.text))}`,
    hint: 'a badge is an element with the class "badge"; its words for screen readers only (visually-hidden) are not part of its text.',
  });
});

/**
 * The page has loaded the script of the components (the one that opens dialogs and menus, slides
 * carousels and fades notifications), at a version when one is named ("5.3" matches 5.3.9). When a
 * component step finds nothing moving, this tells whether the script is there at all.
 *
 * Example #1: Then the page should use the components script
 * Example #2: Then the page should use the components script at version "5.3"
 * Example #3: Then the page should use the components script at version "4.6"
 * Example #4: Then the page should use the components script at version "5"
 * Example #5: And the page should use the components script at version "5.3.9"
 */
Then(/^the page should use the components script(?: at version "([^"]*)")?$/, async function (version) {
  const result = await h.poll(this, (lib) => {
    const v = lib.scriptVersion();
    return { done: !!v.version, version: v.version, via: v.via };
  }, null, h.budget(this));
  if (!result.done) {
    throw h.failure(this.page, 'Expected the page to load the components script, but it does not.', {
      found: 'no bootstrap object and no jQuery plugin of the components on the page',
      hint: 'the theme loads only the style sheet, or loads the script late or under another name; dialogs, menus and panels need the script (bootstrap.bundle.js).',
    });
  }
  if (!version) return;
  const wanted = String(version).trim();
  if (result.version === wanted || result.version.startsWith(`${wanted}.`)) return;
  throw h.failure(this.page, `Expected the page to use the components script at version ${wanted}, but it uses ${result.version}.`, {
    found: `the version read from ${result.via === 'jquery' ? 'its jQuery plugins' : 'its bootstrap object'}: ${result.version}`,
    hint: 'a version is matched by its start: "5.3" is any 5.3.x.',
  });
});
