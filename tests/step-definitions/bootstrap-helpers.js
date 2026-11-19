'use strict';

// Shared helpers for the step files of this pack.
//
// Not a step file: it registers no step definitions and no hooks. It puts the page side of the
// pack (bootstrap-probe.js) into every page the World opens, and holds the plumbing the steps use
// and that a project can require for its own steps: the wait budgets, the poll on the page, finding
// a component by the name a person reads, waiting until it is shown or closed and done moving,
// clicking, pressing Escape in it, clicking outside it, and the failure messages.
//
// The waits are the point of the pack. A component that opens or closes moves for a few hundred
// milliseconds: a dialog fades and slides, a panel grows, a side panel slides, a tab's panel fades
// in, a carousel slides, a notification fades. The steps wait for the component's own end event
// (`shown`, `hidden`, `slid`, `closed`) AND for its transitional classes and CSS transitions to be
// over, never for a fixed time: some of those events fire before the movement ends (a tab's
// `shown`, a notification's `shown`), and some pages load the script after the event was sent.
//
// Everything builds on webship-js's own helpers (`onNewPage`, `friendly`, `failure`) so the steps
// fail the way the core webship-js steps do.

const webship = require('webship-js/tests/step-definitions/webship');
const { componentProbe } = require('./bootstrap-probe');

const { friendly, failure, onNewPage } = webship;

/** The page side as a script: it installs `window.__webshipComponents`. */
const PROBE = `(${componentProbe.toString()})();`;

// Every page the World opens gets the probe before its own scripts run, so the components' events
// are heard from the first one.
if (typeof onNewPage === 'function') {
  onNewPage(async (world, page) => {
    try { await page.addInitScript(PROBE); } catch (e) { /* a closed page needs nothing */ }
  });
}

/**
 * The per-assertion wait budget: `minWaitTime.page` from cucumber.js, at least 10 seconds. Kept
 * below webship-js's 45 second step timeout. COMPONENT_WAIT_MS sets it outright (the run of the
 * assertions that must fail uses a short one: each of them waits its whole budget).
 *
 * @param {object} world
 * @returns {number}
 */
function budget(world) {
  const fixed = Number(process.env.COMPONENT_WAIT_MS);
  if (Number.isFinite(fixed) && fixed > 0) return Math.min(fixed, 40000);
  const page = world && world.minWaitTime && world.minWaitTime.page;
  return Math.min(Math.max(page || 0, 10000), 40000);
}

/** The budget of the waits for something the page does by itself: a notification that hides, a
 * carousel that moves on, a spinner that goes, a bar that fills (at least 30 seconds). */
function longBudget(world) {
  const fixed = Number(process.env.COMPONENT_WAIT_MS);
  if (Number.isFinite(fixed) && fixed > 0) return Math.min(fixed * 3, 40000);
  return Math.min(Math.max(budget(world), 30000), 40000);
}

/** White space collapsed, typographic quotes made plain: the way the page side compares texts. */
function norm(text) {
  return String(text === null || text === undefined ? '' : text)
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[   ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A list for a failure message: `"a", "b"` or `(none)`. */
function listed(values, max) {
  const items = [...new Set((values || []).map(norm).filter(Boolean))];
  const limit = max || 12;
  if (!items.length) return '(none)';
  const shown = items.slice(0, limit).map((v) => `"${v}"`).join(', ');
  return items.length > limit ? `${shown} and ${items.length - limit} more` : shown;
}

/** Shorten a text for a message. */
function excerpt(text, max) {
  const clean = norm(text);
  const limit = max || 160;
  return clean.length > limit ? `${clean.slice(0, limit)}…` : clean;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Put the probe into the current page when it is not there yet (a page opened before this pack
 * was loaded, a World that does not extend webship-js's), and bind jQuery if it came late. */
async function ensureProbe(world) {
  const page = world.page;
  let there = false;
  try {
    there = await page.evaluate(() => !!(window.__webshipComponents && window.__webshipComponents.lib));
  } catch (e) {
    there = false;
  }
  if (!there) {
    try { await page.evaluate(PROBE); } catch (e) { /* the page is navigating: the next call retries */ }
  } else {
    try { await page.evaluate(() => window.__webshipComponents.lib.bindJquery()); } catch (e) { /* idem */ }
  }
}

/**
 * Run a function of the page side's library: `call(world, 'find', 'dialog', 'Settings')`.
 *
 * @returns {Promise<*>}
 */
async function call(world, name, ...args) {
  await ensureProbe(world);
  return world.page.evaluate(([fn, list]) => window.__webshipComponents.lib[fn](...list), [name, args]);
}

/**
 * Look at the page every 50 ms, from Node (a timer in the page would be counted by webship-js as
 * pending work), until `probe` returns a value with `done: true` or the time is up. The probe runs
 * in the page with `lib` (the page side's library) and `arg`. Returns the last value it gave.
 *
 * @param {object} world
 * @param {Function} probe - (lib, arg) => ({ done, ... }), run in the page.
 * @param {*} arg
 * @param {number} timeout
 * @returns {Promise<object>}
 */
async function poll(world, probe, arg, timeout) {
  const deadline = Date.now() + timeout;
  const source = probe.toString();
  let last = { done: false };
  for (;;) {
    let value;
    try {
      value = await world.page.evaluate(([src, a]) => {
        const C = window.__webshipComponents;
        if (!C || !C.lib) return { done: false, missing: true };
        // eslint-disable-next-line no-new-func
        return (new Function(`return (${src})`))()(C.lib, a);
      }, [source, arg]);
    } catch (e) {
      value = { done: false, error: e.message };
    }
    if (value && value.missing) await ensureProbe(world);
    else if (value) last = value;
    if (value && value.done) return value;
    if (Date.now() + 50 >= deadline) return last;
    await sleep(50);
  }
}

/** The words a step uses for a kind, and the names it reads. */
const KIND_WORDS = {
  dialog: { noun: 'dialog', named: 'its title' },
  'side panel': { noun: 'side panel', named: 'its title' },
  'drop-down menu': { noun: 'drop-down menu', named: 'the name of the button that opens it' },
  notification: { noun: 'notification', named: 'its title, or its text when it has no header' },
  tooltip: { noun: 'tooltip', named: 'its text' },
  popover: { noun: 'popover', named: 'its title, or its text when it has no title' },
  panel: { noun: 'panel', named: 'the name of the button or link that shows it' },
  tab: { noun: 'tab', named: 'its label' },
};

/** The kind a step names: "drop-down menu" and "dropdown menu" are one. */
function kindOf(word) {
  const w = String(word || '').toLowerCase().replace(/\s+/g, ' ');
  if (/^drop-?down menu$/.test(w)) return 'drop-down menu';
  return w;
}

/**
 * Find a component by its name, waiting for it to be on the page. Returns its ref (the page side's
 * number for it).
 *
 * @returns {Promise<number>}
 */
async function resolve(world, kind, name, options) {
  const opts = options || {};
  const result = await poll(world, (lib, a) => {
    const r = lib.find(a.kind, a.name);
    return { done: !!r.ref, ref: r.ref, names: r.names, found: r.found };
  }, { kind, name }, opts.timeout || budget(world));
  if (result.ref) return result.ref;
  const words = KIND_WORDS[kind] || { noun: kind, named: 'its name' };
  throw failure(world.page, `Expected a ${words.noun} named "${name}" on the page, but there is none.`, {
    found: `the ${words.noun}s here: ${listed(result.names)}`,
    hint: opts.hint || `a ${words.noun} is named by ${words.named}; check the spelling, or that the page has finished loading.`,
  });
}

/** The state the page side reads for a component. */
async function stateOf(world, kind, ref) {
  return call(world, 'state', kind, ref);
}

/** Describe a state for a failure message. */
function describe(state) {
  if (!state || !state.exists) return state && state.removed ? 'it was removed from the page' : 'it is not on the page';
  const parts = [state.open ? 'open' : 'closed'];
  if (!state.settled) parts.push('still moving');
  if (state.lastEvent) parts.push(`last event ${state.lastEvent}`);
  if (state.classes) parts.push(`classes "${excerpt(state.classes, 80)}"`);
  return parts.join(', ');
}

/**
 * Wait until a component is shown and done moving (`want` true) or closed and done moving (false).
 * Returns true, or the last state when the time is up.
 */
async function waitShown(world, kind, ref, want, timeout) {
  const result = await poll(world, (lib, a) => {
    const done = a.want ? lib.isShown(a.kind, a.ref) : lib.isClosed(a.kind, a.ref);
    return { done, state: lib.state(a.kind, a.ref) };
  }, { kind, ref, want }, timeout || budget(world));
  return result.done ? true : result.state;
}

/** An element handle for a ref, to click or hover it with Playwright's own checks. */
async function handleOf(world, ref) {
  await ensureProbe(world);
  const handle = await world.page.evaluateHandle((r) => window.__webshipComponents.lib.deref(r), ref);
  const element = handle.asElement();
  if (!element) {
    await handle.dispose();
    return null;
  }
  return element;
}

/** Click an element found by the page side. */
async function clickRef(world, ref, what) {
  const element = await handleOf(world, ref);
  if (!element) throw failure(world.page, `Could not click ${what}: it is no longer on the page.`, { hint: 'the page changed while the step ran; check what replaced it.' });
  try {
    await element.click({ timeout: budget(world) });
  } catch (e) {
    throw friendly({ action: 'click', target: what, cause: e, hint: 'it may be hidden, disabled or covered by another element (a backdrop that has not gone yet).' });
  } finally {
    await element.dispose();
  }
}

/** The visible buttons or links with a name, the way a person reads them (in a component, or on
 * the page). */
async function byRole(world, roles, name, scopeRef) {
  const base = scopeRef ? scopeLocator(world, scopeRef) : world.page;
  const out = [];
  for (const role of roles) {
    const locator = base.getByRole(role, { name, exact: true });
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const candidate = locator.nth(i);
      if (await candidate.isVisible().catch(() => false)) out.push(candidate);
    }
  }
  return out;
}

/** A locator for the element a ref stands for: tagged for the time of the step. */
function scopeLocator(world, ref) {
  return world.page.locator(`[data-webship-component="${ref}"]`);
}

/** Tag an element so a Playwright locator can reach into it; untag with untag(). */
async function tag(world, ref) {
  await world.page.evaluate((r) => {
    const el = window.__webshipComponents.lib.deref(r);
    if (el) el.setAttribute('data-webship-component', String(r));
  }, ref);
}
async function untag(world, ref) {
  try {
    await world.page.evaluate((r) => {
      const el = window.__webshipComponents.lib.deref(r);
      if (el) el.removeAttribute('data-webship-component');
    }, ref);
  } catch (e) { /* the page moved on */ }
}

/** Click the button or link a person names; fails when there is none. */
async function clickNamed(world, name, roles, scopeRef, what) {
  const kinds = roles || ['button', 'link'];
  if (scopeRef) await tag(world, scopeRef);
  try {
    let found = [];
    const deadline = Date.now() + budget(world);
    for (;;) {
      found = await byRole(world, kinds, name, scopeRef);
      if (found.length || Date.now() >= deadline) break;
      await sleep(100);
    }
    if (!found.length) {
      const names = await namedControls(world, kinds, scopeRef);
      throw failure(world.page, `Expected a ${kinds.join(' or ')} named "${name}"${what ? ` in ${what}` : ''}, but there is none that is visible.`, {
        found: `the ${kinds.join(' and ')} names: ${listed(names)}`,
        hint: 'a button or a link is named by its text or its aria-label; check the spelling.',
      });
    }
    try {
      await found[0].click({ timeout: budget(world) });
    } catch (e) {
      throw friendly({ action: 'click', target: name, cause: e, hint: 'it may be disabled or covered by another element.' });
    }
  } finally {
    if (scopeRef) await untag(world, scopeRef);
  }
}

/** The names of the visible buttons or links (in a component, or on the page). */
async function namedControls(world, roles, scopeRef) {
  return world.page.evaluate(([kinds, r]) => {
    const lib = window.__webshipComponents && window.__webshipComponents.lib;
    const root = r && lib ? lib.deref(r) : document;
    if (!root) return [];
    const selector = kinds.map((k) => (k === 'button' ? 'button, [role="button"], input[type="submit"], input[type="button"]' : 'a[href], [role="link"]')).join(', ');
    return [...root.querySelectorAll(selector)].filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden').map((el) => (lib ? lib.nameOf(el) : el.textContent));
  }, [roles, scopeRef || 0]).catch(() => []);
}

/** The page side's event counter, to tell the events of an action from those before it. */
async function eventSeq(world) {
  return call(world, 'seq');
}

/** The component events since a point: "show.bs.modal, shown.bs.modal" for a message. */
async function eventsSince(world, seq) {
  const events = await call(world, 'eventsSince', seq).catch(() => []);
  return events.map((e) => e.name);
}

/**
 * Wait until no component on the page is moving (a dialog, a panel, a side panel, a menu, a tab,
 * a notification, a tooltip, a popover, a carousel, an alert being dismissed, a backdrop).
 */
async function waitAllSettled(world, timeout) {
  const result = await poll(world, (lib) => {
    const busy = lib.anyMoving();
    return { done: busy.length === 0, busy };
  }, null, timeout || budget(world));
  return result.done ? true : result.busy || [];
}

/**
 * Press Escape with the keyboard focus inside a component (its own element, or the button of a
 * drop-down menu), as a person who uses the keyboard does. The components listen for Escape on
 * their own element: after a click on a backdrop the focus is on the page's body, and Escape does
 * nothing there.
 */
async function pressEscapeIn(world, kind, ref) {
  await world.page.evaluate(([k, r]) => {
    const lib = window.__webshipComponents.lib;
    const el = lib.deref(r);
    if (!el) return;
    const holder = k === 'drop-down menu' ? el : el;
    const menu = k === 'drop-down menu' ? lib.kinds['drop-down menu'].menu(el) : null;
    const inside = (node) => node && (holder.contains(node) || (menu && menu.contains(node)));
    if (!inside(document.activeElement)) {
      if (!holder.hasAttribute('tabindex') && k !== 'drop-down menu') holder.setAttribute('tabindex', '-1');
      holder.focus({ preventScroll: true });
    }
  }, [kind, ref]);
  await world.page.keyboard.press('Escape');
}

/**
 * A point of the window outside a component (and outside what opens it) where a click lands on
 * nothing a person would act on: a backdrop, a heading, a paragraph, empty page.
 */
async function pointOutside(world, kind, ref) {
  return world.page.evaluate(([k, r]) => {
    const lib = window.__webshipComponents.lib;
    const el = lib.deref(r);
    const spec = lib.kinds[k];
    const region = spec ? spec.region(el) : el;
    const boxes = [region, el].filter(Boolean).map((n) => n.getBoundingClientRect());
    if (k === 'popover' || k === 'tooltip') {
      const trigger = spec.trigger(el);
      if (trigger) boxes.push(trigger.getBoundingClientRect());
    }
    if (k === 'dialog') boxes.splice(0, boxes.length, (el.querySelector('.modal-dialog') || el).getBoundingClientRect());
    const inside = (x, y) => boxes.some((b) => x >= b.left - 4 && x <= b.right + 4 && y >= b.top - 4 && y <= b.bottom + 4);
    const active = 'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [tabindex]:not([tabindex="-1"]), [data-bs-toggle], [data-toggle], iframe, video';
    const w = window.innerWidth;
    const h = window.innerHeight;
    const points = [];
    for (let fy = 0.95; fy >= 0.05; fy -= 0.15) for (let fx = 0.95; fx >= 0.05; fx -= 0.15) points.push([Math.round(w * fx), Math.round(h * fy)]);
    for (const [x, y] of points) {
      if (inside(x, y)) continue;
      const hit = document.elementFromPoint(x, y);
      if (!hit) continue;
      if (hit.closest(active) && !hit.matches('.modal, .modal-backdrop, .offcanvas-backdrop')) continue;
      if (region && region.contains(hit)) continue;
      return { x, y, on: hit.tagName.toLowerCase() + (hit.className && typeof hit.className === 'string' ? `.${hit.className.trim().split(/\s+/).join('.')}` : '') };
    }
    return null;
  }, [kind, ref]);
}

module.exports = {
  PROBE,
  budget,
  longBudget,
  norm,
  listed,
  excerpt,
  sleep,
  ensureProbe,
  call,
  poll,
  KIND_WORDS,
  kindOf,
  resolve,
  stateOf,
  describe,
  waitShown,
  handleOf,
  clickRef,
  clickNamed,
  namedControls,
  tag,
  untag,
  scopeLocator,
  eventSeq,
  eventsSince,
  waitAllSettled,
  pressEscapeIn,
  pointOutside,
  friendly,
  failure,
};
