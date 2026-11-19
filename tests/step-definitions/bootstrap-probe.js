'use strict';

// The page side of this pack: one function, injected into every page the World opens (an init
// script, so it runs before the page's own scripts) and into the current page when a step finds it
// missing. It registers no step.
//
// It does two things:
//
//   1. It records the components' own events. Version 5 dispatches them as DOM events
//      (`show.bs.modal`, `shown.bs.modal`, `hidden.bs.collapse`, `slid.bs.carousel` ...), which a
//      capturing listener on the document hears; version 4 triggers them through jQuery only, so a
//      jQuery listener is bound as soon as jQuery is on the page. For every element it keeps the last
//      event of each component: a `show`, `hide`, `slide` or `close` without its `shown`, `hidden`,
//      `slid` or `closed` means the component is still moving.
//   2. It reads the components by what a person sees (a dialog by its title, a menu by its button,
//      a panel by the button that opens it ...) and says whether each one is open or closed, and
//      whether it has finished moving: its own event pairs, its transitional classes (`collapsing`,
//      `showing`, `hiding`, `carousel-item-next` ...) and the CSS transitions still running in it.
//      Infinite CSS animations (a spinner, the stripes of a progress bar) are not movement.
//
// Everything is reached through `window.__webshipComponents.lib`; elements found by one call are
// kept under a number (`ref`) for the next ones, without touching the page's DOM.

function componentProbe() {
  const VERSION = 3;
  if (window.__webshipComponents && window.__webshipComponents.version === VERSION) return;

  const C = { version: VERSION, seq: 0, refs: new Map(), nextRef: 1, events: [] };
  const LAST = new WeakMap();
  const START = { show: 'shown', hide: 'hidden', slide: 'slid', close: 'closed' };
  const NAMES = ['show', 'shown', 'hide', 'hidden', 'hidePrevented', 'slide', 'slid', 'close', 'closed', 'inserted'];
  const COMPONENTS = ['modal', 'offcanvas', 'collapse', 'dropdown', 'tab', 'alert', 'toast', 'carousel', 'tooltip', 'popover'];

  function note(type, component, target, event, source) {
    if (!target || target.nodeType !== 1) return;
    C.seq += 1;
    const entry = { seq: C.seq, type, component, event, source };
    const all = LAST.get(target) || {};
    all[component] = entry;
    LAST.set(target, all);
    C.events.push({ seq: C.seq, name: `${type}.bs.${component}`, target });
    if (C.events.length > 400) C.events.splice(0, C.events.length - 400);
    // A dismissed alert is removed from the page before its `closed` event, which then reaches no
    // document listener: listen on the alert itself.
    if (component === 'alert' && type === 'close') {
      if (source === 'jquery' && window.jQuery) {
        window.jQuery(target).one('closed.bs.alert', (e) => note('closed', 'alert', target, e, 'jquery'));
      } else {
        target.addEventListener('closed.bs.alert', (e) => note('closed', 'alert', target, e, 'native'), { once: true });
      }
    }
  }

  for (const component of COMPONENTS) {
    for (const name of NAMES) {
      document.addEventListener(`${name}.bs.${component}`, (e) => note(name, component, e.target, e, 'native'), true);
    }
  }

  function bindJquery() {
    const $ = window.jQuery;
    if (typeof $ !== 'function' || !$.fn || C.jquery === $) return;
    C.jquery = $;
    const all = [];
    for (const component of COMPONENTS) for (const name of NAMES) all.push(`${name}.bs.${component}`);
    $(document).on(all.join(' '), (e) => {
      const component = String(e.namespace || '').replace(/^bs\./, '');
      if (COMPONENTS.includes(component)) note(e.type, component, e.target, e, 'jquery');
    });
  }
  bindJquery();
  document.addEventListener('DOMContentLoaded', bindJquery);
  window.addEventListener('load', bindJquery);

  // ------------------------------------------------------------------ reading the page

  const norm = (text) => String(text === null || text === undefined ? '' : text)
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[   ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const textOf = (el) => norm(el ? el.textContent : '');
  const data = (el, name) => {
    if (!el) return null;
    const v5 = el.getAttribute(`data-bs-${name}`);
    return v5 !== null ? v5 : el.getAttribute(`data-${name}`);
  };
  const toggles = (kind) => [...document.querySelectorAll(`[data-bs-toggle="${kind}"], [data-toggle="${kind}"]`)];

  function css(el) {
    try { return window.getComputedStyle(el); } catch (e) { return null; }
  }

  // Shown to a person: in the page, laid out, not hidden by display or visibility.
  function isRendered(el) {
    if (!el || !el.isConnected) return false;
    const style = css(el);
    if (!style || style.display === 'none' || style.visibility === 'hidden') return false;
    return el.getClientRects().length > 0;
  }

  // A finite CSS transition or animation still running in the element or its descendants.
  function moving(el) {
    if (!el || !el.isConnected || typeof el.getAnimations !== 'function') return false;
    return el.getAnimations({ subtree: true }).some((a) => {
      if (a.playState !== 'running' && a.playState !== 'pending') return false;
      const timing = a.effect && typeof a.effect.getComputedTiming === 'function' ? a.effect.getComputedTiming() : null;
      return !(timing && timing.iterations === Infinity);
    });
  }

  // The component's last event on this element: a start event (show, hide, slide, close) that was
  // not prevented and has no end event yet means it is still moving.
  function lastEvent(el, component) {
    const all = el ? LAST.get(el) : null;
    return all ? all[component] || null : null;
  }
  function prevented(entry) {
    const e = entry && entry.event;
    if (!e) return false;
    if (e.defaultPrevented) return true;
    return typeof e.isDefaultPrevented === 'function' && e.isDefaultPrevented();
  }
  function pending(el, component) {
    const entry = lastEvent(el, component);
    return !!entry && !!START[entry.type] && !prevented(entry);
  }
  function eventsSince(seq) {
    return C.events.filter((e) => e.seq > seq);
  }

  function ref(el) {
    if (!el) return 0;
    for (const [id, known] of C.refs) if (known === el) return id;
    const id = C.nextRef++;
    C.refs.set(id, el);
    return id;
  }
  const deref = (id) => C.refs.get(id) || null;

  function idTarget(selector) {
    if (!selector) return null;
    const value = String(selector).trim();
    if (!value || value === '#') return null;
    try {
      if (value.startsWith('#') || value.startsWith('.') || value.startsWith('[')) return value;
      const hash = value.indexOf('#');
      if (hash >= 0) return value.slice(hash);
    } catch (e) { return null; }
    return null;
  }
  function targetsOf(trigger) {
    const selector = idTarget(data(trigger, 'target')) || idTarget(trigger.getAttribute('href'));
    if (!selector) return [];
    try { return [...document.querySelectorAll(selector)]; } catch (e) { return []; }
  }
  function labelledText(el) {
    const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    const text = ids.map((id) => document.getElementById(id)).filter(Boolean).map(textOf).join(' ');
    return norm(text);
  }
  // The accessible name a person reads on a button or a link.
  function nameOf(el) {
    if (!el) return '';
    return norm(el.getAttribute('aria-label') || labelledText(el) || el.textContent || el.getAttribute('title') || el.getAttribute('value'));
  }

  // Pick the elements whose names match, the way a person would: exactly, then ignoring case, then
  // by the start of the name. Returns { matches, names }.
  function pick(items, wanted, namesOf) {
    const want = norm(wanted);
    const lower = want.toLowerCase();
    const named = items.map((el) => ({ el, names: namesOf(el).map(norm).filter(Boolean) }));
    const by = (test) => named.filter((n) => n.names.some(test)).map((n) => n.el);
    let matches = by((n) => n === want);
    if (!matches.length) matches = by((n) => n.toLowerCase() === lower);
    if (!matches.length && want.length >= 3) matches = by((n) => n.toLowerCase().startsWith(lower));
    const names = [...new Set(named.map((n) => n.names[0]).filter(Boolean))];
    return { matches, names };
  }
  // Several matches: keep the rendered ones when that settles it.
  function narrow(matches) {
    if (matches.length <= 1) return matches;
    const rendered = matches.filter(isRendered);
    return rendered.length >= 1 ? rendered : matches;
  }

  // ------------------------------------------------------------------ the components

  const OFFCANVAS = '.offcanvas, .offcanvas-sm, .offcanvas-md, .offcanvas-lg, .offcanvas-xl, .offcanvas-xxl';

  const kinds = {
    dialog: {
      component: 'modal',
      all: () => [...document.querySelectorAll('.modal')],
      names: (m) => [labelledText(m) || textOf(m.querySelector('.modal-title')), m.getAttribute('aria-label'), m.id, m.id ? `#${m.id}` : ''],
      open: (m) => m.classList.contains('show') && (css(m) || {}).display !== 'none',
      closedSettled: (m) => {
        if (m.classList.contains('show') || (css(m) || {}).display !== 'none') return false;
        // The backdrop goes after the dialog: it is gone unless another dialog is open.
        const others = [...document.querySelectorAll('.modal.show')].filter((o) => o !== m);
        return others.length > 0 || !document.querySelector('.modal-backdrop');
      },
      settled: (m) => !pending(m, 'modal') && !moving(m) && !m.classList.contains('modal-static'),
      triggers: (m) => toggles('modal').filter((t) => targetsOf(t).includes(m)),
      dismiss: (m) => [...m.querySelectorAll('[data-bs-dismiss="modal"], [data-dismiss="modal"]')],
      region: (m) => m.querySelector('.modal-content') || m,
    },
    'side panel': {
      component: 'offcanvas',
      all: () => [...document.querySelectorAll(OFFCANVAS)],
      names: (o) => [labelledText(o) || textOf(o.querySelector('.offcanvas-title')), o.getAttribute('aria-label'), o.id, o.id ? `#${o.id}` : ''],
      open: (o) => o.classList.contains('show') || o.classList.contains('showing'),
      closedSettled: (o) => !o.classList.contains('show') && !o.classList.contains('showing') && !o.classList.contains('hiding'),
      settled: (o) => !pending(o, 'offcanvas') && !moving(o) && !o.classList.contains('showing') && !o.classList.contains('hiding'),
      triggers: (o) => toggles('offcanvas').filter((t) => targetsOf(t).includes(o)),
      dismiss: (o) => [...o.querySelectorAll('[data-bs-dismiss="offcanvas"]')],
      region: (o) => o,
    },
    'drop-down menu': {
      component: 'dropdown',
      all: () => toggles('dropdown'),
      names: (t) => {
        const names = [nameOf(t)];
        // A split button: the person names the main button of the group.
        const group = t.closest('.btn-group, .dropdown, .dropup, .dropend, .dropstart');
        if (group) {
          const main = [...group.querySelectorAll('.btn, button, a')].find((b) => b !== t && !b.closest('.dropdown-menu'));
          if (main) names.push(nameOf(main));
        }
        return names;
      },
      menu: (t) => {
        for (let s = t.nextElementSibling; s; s = s.nextElementSibling) if (s.classList.contains('dropdown-menu')) return s;
        for (let s = t.previousElementSibling; s; s = s.previousElementSibling) if (s.classList.contains('dropdown-menu')) return s;
        return t.parentElement ? t.parentElement.querySelector('.dropdown-menu') : null;
      },
      open: (t) => { const m = kinds['drop-down menu'].menu(t); return !!m && m.classList.contains('show'); },
      closedSettled: (t) => { const m = kinds['drop-down menu'].menu(t); return !m || !m.classList.contains('show'); },
      settled: (t) => !pending(t, 'dropdown') && !pending(t.parentElement, 'dropdown') && !moving(kinds['drop-down menu'].menu(t)),
      dismiss: () => [],
      region: (t) => kinds['drop-down menu'].menu(t) || t,
    },
    notification: {
      component: 'toast',
      all: () => [...document.querySelectorAll('.toast')],
      names: (t) => {
        const header = t.querySelector('.toast-header');
        const title = header ? (header.querySelector('strong, .me-auto, .mr-auto') || header) : null;
        return [title ? textOf(title) : '', textOf(t.querySelector('.toast-body')), t.id];
      },
      open: (t) => t.classList.contains('show') || t.classList.contains('showing'),
      shownSettled: (t) => t.classList.contains('show') && !t.classList.contains('showing') && Number((css(t) || {}).opacity) > 0.5,
      closedSettled: (t) => !t.classList.contains('show') || t.classList.contains('hide'),
      settled: (t) => !pending(t, 'toast') && !moving(t),
      dismiss: (t) => [...t.querySelectorAll('[data-bs-dismiss="toast"], [data-dismiss="toast"]')],
      region: (t) => t,
    },
    tooltip: {
      component: 'tooltip',
      all: () => [...document.querySelectorAll('.tooltip')],
      names: (t) => [textOf(t.querySelector('.tooltip-inner') || t)],
      trigger: (t) => (t.id ? document.querySelector(`[aria-describedby~="${t.id}"]`) : null),
      open: (t) => t.classList.contains('show'),
      closedSettled: (t) => !t.isConnected || !t.classList.contains('show'),
      settled: (t) => !moving(t) && !pending(kinds.tooltip.trigger(t), 'tooltip'),
      dismiss: () => [],
      region: (t) => t,
    },
    popover: {
      component: 'popover',
      all: () => [...document.querySelectorAll('.popover')],
      names: (p) => [textOf(p.querySelector('.popover-header')), textOf(p.querySelector('.popover-body'))],
      trigger: (p) => (p.id ? document.querySelector(`[aria-describedby~="${p.id}"]`) : null),
      open: (p) => p.classList.contains('show'),
      closedSettled: (p) => !p.isConnected || !p.classList.contains('show'),
      settled: (p) => !moving(p) && !pending(kinds.popover.trigger(p), 'popover'),
      dismiss: () => [],
      region: (p) => p,
    },
    panel: {
      component: 'collapse',
      all: () => toggles('collapse'),
      names: (t) => {
        const names = [nameOf(t)];
        for (const target of targetsOf(t)) names.push(labelledText(target), target.getAttribute('aria-label'), target.id, target.id ? `#${target.id}` : '');
        return names;
      },
      targets: (t) => targetsOf(t),
      open: (t) => { const ts = targetsOf(t); return ts.length > 0 && ts.every((x) => x.classList.contains('show')); },
      closedSettled: (t) => targetsOf(t).every((x) => !x.classList.contains('show') && !x.classList.contains('collapsing')),
      settled: (t) => targetsOf(t).every((x) => !x.classList.contains('collapsing') && !pending(x, 'collapse') && !moving(x)),
      dismiss: () => [],
      region: (t) => targetsOf(t)[0] || t,
    },
    tab: {
      component: 'tab',
      all: () => {
        const scripted = [...document.querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"], [data-toggle="tab"], [data-toggle="pill"], [data-toggle="list"]')];
        // Tabs a server renders (links to other pages), as in the local tasks of many CMS themes.
        const linked = [...document.querySelectorAll('.nav-tabs .nav-link, .nav-pills .nav-link, .nav-underline .nav-link')].filter((l) => !scripted.includes(l) && !data(l, 'toggle'));
        return scripted.concat(linked);
      },
      names: (t) => [nameOf(t)],
      pane: (t) => targetsOf(t).find((x) => x.classList.contains('tab-pane')) || null,
      open: (t) => t.classList.contains('active') && t.getAttribute('aria-selected') !== 'false',
      closedSettled: (t) => !t.classList.contains('active'),
      settled: (t) => {
        const pane = kinds.tab.pane(t);
        if (pending(t, 'tab')) return false;
        if (!pane) return true;
        if (moving(pane)) return false;
        // The panel of the active tab has faded in: `.active` and, with `.fade`, `.show`.
        if (t.classList.contains('active')) return pane.classList.contains('active') && (!pane.classList.contains('fade') || pane.classList.contains('show'));
        return true;
      },
      dismiss: () => [],
      region: (t) => kinds.tab.pane(t) || t,
    },
  };

  function find(kind, wanted) {
    const k = kinds[kind];
    if (!k) return { found: 0, error: `unknown kind ${kind}` };
    const items = k.all();
    const { matches, names } = pick(items, wanted, (el) => k.names(el));
    const chosen = narrow(matches);
    if (chosen.length === 1 || (chosen.length > 1 && kind !== 'panel')) {
      return { found: matches.length, ref: ref(chosen[0]), names };
    }
    if (chosen.length > 1) return { found: matches.length, ref: ref(chosen[0]), names };
    return { found: 0, names };
  }

  // The state of a component: { exists, open, settled, closedSettled, rendered, text, ... }.
  function state(kind, id) {
    const k = kinds[kind];
    const el = deref(id);
    if (!k || !el) return { exists: false };
    if (!el.isConnected) return { exists: false, removed: true };
    const region = k.region(el);
    const out = {
      exists: true,
      open: k.open(el),
      settled: k.settled(el),
      closedSettled: k.closedSettled(el),
      text: region && isRendered(region) ? norm(region.innerText || region.textContent) : '',
      name: norm(k.names(el)[0] || ''),
      classes: el.className && el.className.baseVal === undefined ? String(el.className) : '',
    };
    if (k.shownSettled) out.shownSettled = k.shownSettled(el);
    const last = lastEvent(kind === 'panel' ? (targetsOf(el)[0] || el) : el, k.component);
    out.lastEvent = last ? `${last.type}.bs.${last.component}${prevented(last) ? ' (prevented)' : ''}` : '';
    return out;
  }

  // Shown and done moving / closed and done moving.
  function isShown(kind, id) {
    const s = state(kind, id);
    if (!s.exists) return false;
    if (s.shownSettled === false) return false;
    return s.open && s.settled && (kind !== 'dialog' || isRendered(deref(id)));
  }
  function isClosed(kind, id) {
    const s = state(kind, id);
    if (!s.exists) return true;
    return !s.open && s.settled && s.closedSettled;
  }

  // The tooltips or popovers a trigger owns (aria-describedby), and its trigger options.
  function hintOf(id) {
    const el = deref(id);
    if (!el) return null;
    const owner = [el, el.parentElement].find((x) => x && (data(x, 'toggle') === 'tooltip' || data(x, 'toggle') === 'popover'));
    if (!owner) return null;
    return { ref: ref(owner), kind: data(owner, 'toggle'), trigger: data(owner, 'trigger') || 'hover focus', title: norm(data(owner, 'title') || owner.getAttribute('title') || data(owner, 'original-title') || '') };
  }
  function describedBy(id, kind) {
    const el = deref(id);
    if (!el) return 0;
    const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    const tip = ids.map((i) => document.getElementById(i)).find((t) => t && t.classList.contains(kind));
    return tip ? ref(tip) : 0;
  }

  // Any component of a kind that is still moving, anywhere on the page.
  function anyMoving() {
    const busy = [];
    for (const [kind, k] of Object.entries(kinds)) {
      for (const el of k.all()) {
        if (!k.settled(el)) busy.push(`${kind} "${norm(k.names(el)[0] || '')}"`);
        if (busy.length > 5) return busy;
      }
    }
    for (const c of document.querySelectorAll('.carousel')) if (!carouselSettled(c)) busy.push('carousel');
    for (const a of document.querySelectorAll('.alert.fade:not(.show)')) if (a.isConnected) busy.push('alert being dismissed');
    for (const b of document.querySelectorAll('.modal-backdrop.fade:not(.show), .offcanvas-backdrop.fade:not(.show)')) busy.push('backdrop');
    return busy;
  }

  function shownOfKind(kind) {
    const k = kinds[kind];
    return k.all().filter((el) => k.open(el) || !k.settled(el)).map((el) => norm(k.names(el)[0] || '') || '(no name)');
  }

  // ------------------------------------------------------------------ carousels

  const SLIDING = ['carousel-item-next', 'carousel-item-prev', 'carousel-item-start', 'carousel-item-end', 'carousel-item-left', 'carousel-item-right'];
  function carousels() { return [...document.querySelectorAll('.carousel')]; }
  function carouselNames(c) {
    return [c.getAttribute('aria-label'), labelledText(c), c.id, c.id ? `#${c.id}` : ''];
  }
  function carouselItems(c) { return [...c.querySelectorAll('.carousel-item')].filter((i) => i.closest('.carousel') === c); }
  function carouselSettled(c) {
    return !carouselItems(c).some((i) => SLIDING.some((s) => i.classList.contains(s))) && !pending(c, 'carousel') && !moving(c.querySelector('.carousel-inner'));
  }
  function carouselState(id) {
    const c = deref(id);
    if (!c || !c.isConnected) return { exists: false };
    const items = carouselItems(c);
    const active = items.findIndex((i) => i.classList.contains('active'));
    const item = items[active];
    const alts = item ? [...item.querySelectorAll('img[alt]')].map((img) => img.getAttribute('alt')) : [];
    return {
      exists: true,
      index: active + 1,
      count: items.length,
      settled: carouselSettled(c),
      text: item ? norm([item.innerText || '', ...alts].join(' ')) : '',
      ride: data(c, 'ride') || '',
      interval: Number((item && data(item, 'interval')) || data(c, 'interval') || 5000),
      lastSlid: (lastEvent(c, 'carousel') || {}).seq || 0,
      hasIndicators: !!c.querySelector('[data-bs-slide-to], [data-slide-to]'),
    };
  }

  // ------------------------------------------------------------------ alerts

  const ALERT_KINDS = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
  function alertText(a) {
    const copy = a.cloneNode(true);
    copy.querySelectorAll('[data-bs-dismiss="alert"], [data-dismiss="alert"], .btn-close, .close, .visually-hidden, .sr-only').forEach((b) => b.remove());
    return norm(copy.textContent);
  }
  function alerts(text, kind) {
    const want = norm(text).toLowerCase();
    return [...document.querySelectorAll('.alert')].filter((a) => alertText(a).toLowerCase().includes(want) && (!kind || a.classList.contains(`alert-${kind}`)));
  }
  function alertInfo(a) {
    return {
      ref: ref(a),
      kind: ALERT_KINDS.find((k) => a.classList.contains(`alert-${k}`)) || '',
      text: alertText(a),
      rendered: isRendered(a) && Number((css(a) || {}).opacity) > 0,
      settled: !moving(a) && !pending(a, 'alert'),
      dismissible: !!a.querySelector('[data-bs-dismiss="alert"], [data-dismiss="alert"]'),
    };
  }
  function allAlerts() { return [...document.querySelectorAll('.alert')].filter(isRendered).map(alertInfo); }

  // ------------------------------------------------------------------ navigation bars

  function navbars() { return [...document.querySelectorAll('.navbar')]; }
  function navbarNames(n) { return [n.getAttribute('aria-label'), labelledText(n), textOf(n.querySelector('.navbar-brand'))]; }
  function navbarState(id) {
    const n = deref(id);
    if (!n || !n.isConnected) return { exists: false };
    const toggler = n.querySelector('.navbar-toggler');
    const target = toggler ? targetsOf(toggler)[0] : null;
    const collapsible = !!toggler && isRendered(toggler);
    let shown = true;
    let settled = true;
    if (target) {
      const isOffcanvas = target.matches(OFFCANVAS);
      const kind = isOffcanvas ? kinds['side panel'] : null;
      if (isOffcanvas) {
        shown = target.classList.contains('show');
        settled = kind.settled(target);
      } else {
        shown = target.classList.contains('show') || !collapsible;
        settled = !target.classList.contains('collapsing') && !pending(target, 'collapse') && !moving(target);
      }
    }
    return { exists: true, collapsible, expanded: !collapsible || shown, settled, toggler: toggler ? ref(toggler) : 0, hasTarget: !!target, offcanvas: !!target && target.matches(OFFCANVAS) };
  }

  // ------------------------------------------------------------------ forms

  function labelsNamed(wanted) {
    const want = norm(wanted).toLowerCase();
    return [...document.querySelectorAll('label')].filter((l) => textOf(l).toLowerCase() === want || textOf(l).toLowerCase().replace(/[:*]\s*$/, '').trim() === want);
  }
  function controlOf(label) {
    if (label.control) return label.control;
    const id = label.getAttribute('for');
    if (id) return document.getElementById(id);
    return label.querySelector('input, select, textarea');
  }
  function fields(wanted) {
    const found = labelsNamed(wanted).map(controlOf).filter(Boolean);
    if (found.length) return found;
    const want = norm(wanted).toLowerCase();
    return [...document.querySelectorAll('input, select, textarea')].filter((f) => norm(f.getAttribute('aria-label')).toLowerCase() === want || norm(f.getAttribute('placeholder')).toLowerCase() === want || labelledText(f).toLowerCase() === want);
  }
  function feedbackOf(f) {
    const out = [];
    for (let s = f.nextElementSibling; s; s = s.nextElementSibling) {
      if (s.matches('.invalid-feedback, .valid-feedback, .invalid-tooltip, .valid-tooltip')) out.push(s);
    }
    // In a check, the label sits between the input and the feedback; in an input group with
    // `.has-validation`, the feedback is the group's last child; and the field may point at it.
    const group = f.closest('.input-group, .form-check, .form-floating');
    if (group) for (const s of group.querySelectorAll('.invalid-feedback, .valid-feedback, .invalid-tooltip, .valid-tooltip')) if (!out.includes(s)) out.push(s);
    for (const id of (f.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)) {
      const s = document.getElementById(id);
      if (s && !out.includes(s) && s.matches('.invalid-feedback, .valid-feedback, .invalid-tooltip, .valid-tooltip')) out.push(s);
    }
    return out;
  }
  function fieldState(id) {
    const f = deref(id);
    if (!f || !f.isConnected) return { exists: false };
    const validated = !!f.closest('.was-validated');
    const invalid = f.classList.contains('is-invalid') || (validated && f.matches(':invalid'));
    const valid = f.classList.contains('is-valid') || (validated && f.matches(':valid'));
    const messages = feedbackOf(f).filter(isRendered).map((s) => ({ text: textOf(s), kind: s.className.includes('invalid') ? 'invalid' : 'valid' }));
    return { exists: true, invalid, valid, validated, messages, settled: !moving(f), rendered: isRendered(f) };
  }
  function invalidFields() {
    return [...document.querySelectorAll('input, select, textarea')].filter((f) => isRendered(f) || (f.type === 'checkbox' && isRendered(f.parentElement))).filter((f) => f.classList.contains('is-invalid') || (f.closest('.was-validated') && f.matches(':invalid'))).map((f) => {
      const label = f.labels && f.labels[0] ? textOf(f.labels[0]) : norm(f.getAttribute('aria-label') || f.name || f.id);
      return label;
    });
  }

  // ------------------------------------------------------------------ lists, pagination, breadcrumb, badges

  function listItems(wanted) {
    const items = [...document.querySelectorAll('.list-group-item')];
    const names = (i) => {
      const copy = i.cloneNode(true);
      copy.querySelectorAll('.badge').forEach((b) => b.remove());
      return [norm(copy.textContent)];
    };
    return pick(items, wanted, names);
  }
  function itemState(id) {
    const i = deref(id);
    if (!i) return { exists: false };
    return {
      exists: true,
      active: i.classList.contains('active') || i.getAttribute('aria-current') === 'true' || i.getAttribute('aria-current') === 'page',
      disabled: i.classList.contains('disabled') || i.getAttribute('aria-disabled') === 'true' || i.hasAttribute('disabled') || !!(i.parentElement && i.parentElement.classList.contains('disabled')),
    };
  }

  function containerNamed(selector, wanted) {
    const all = [...document.querySelectorAll(selector)].filter(isRendered);
    if (!wanted) return { all, chosen: all[0] || null };
    const named = (el) => {
      const nav = el.closest('nav') || el;
      return [nav.getAttribute('aria-label'), labelledText(nav), el.getAttribute('aria-label')];
    };
    const { matches } = pick(all, wanted, named);
    return { all, chosen: matches[0] || null };
  }
  function trail(id) {
    const b = deref(id);
    if (!b) return null;
    const items = [...b.querySelectorAll('.breadcrumb-item')];
    const current = items.find((i) => i.getAttribute('aria-current') === 'page') || items.find((i) => i.classList.contains('active'));
    return { items: items.map(seenText), current: current ? seenText(current) : '' };
  }
  // What a person sees (the words for screen readers only left out) and what a screen reader
  // reads (what is aria-hidden left out).
  function seenText(el) {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('.visually-hidden, .sr-only').forEach((x) => x.remove());
    return norm(copy.textContent);
  }
  function heardText(el) {
    if (el.getAttribute('aria-label')) return norm(el.getAttribute('aria-label'));
    const copy = el.cloneNode(true);
    copy.querySelectorAll('[aria-hidden="true"]').forEach((x) => x.remove());
    return norm(copy.textContent);
  }
  function pagination(id) {
    const p = deref(id);
    if (!p) return null;
    const items = [...p.querySelectorAll('.page-item')];
    const current = items.find((i) => i.classList.contains('active') || i.getAttribute('aria-current') === 'page' || (i.querySelector('[aria-current="page"]')));
    const links = items.map((i) => {
      const link = i.querySelector('.page-link') || i;
      return {
        names: [...new Set([seenText(link), heardText(link), norm(link.getAttribute('title'))].filter(Boolean))],
        disabled: i.classList.contains('disabled') || link.getAttribute('aria-disabled') === 'true' || (link.tagName === 'A' && !link.hasAttribute('href')),
        current: i === current,
      };
    });
    const node = current ? (current.querySelector('.page-link') || current) : null;
    return { current: node ? seenText(node) : '', currentNames: node ? [seenText(node), heardText(node)] : [], links };
  }
  function badgeHolders(kind, wanted) {
    const selectors = {
      button: 'button, .btn, [role="button"]',
      link: 'a[href]',
      heading: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
      'list item': '.list-group-item',
      tab: '.nav-link, [role="tab"]',
    };
    const all = [...document.querySelectorAll(selectors[kind] || '*')].filter(isRendered);
    const names = (el) => {
      const copy = el.cloneNode(true);
      copy.querySelectorAll('.badge, .visually-hidden, .sr-only, .rounded-circle').forEach((b) => b.remove());
      return [norm(copy.textContent), nameOf(el)];
    };
    return pick(all, wanted, names);
  }
  function badgesOf(id) {
    const el = deref(id);
    if (!el) return [];
    return [...el.querySelectorAll('.badge')].filter(isRendered).map((b) => {
      const copy = b.cloneNode(true);
      copy.querySelectorAll('.visually-hidden, .sr-only').forEach((h) => h.remove());
      const hidden = [...b.querySelectorAll('.visually-hidden, .sr-only')].map(textOf).join(' ');
      return { text: norm(copy.textContent), hidden: norm(hidden) };
    });
  }

  // ------------------------------------------------------------------ spinners and progress

  function spinners() {
    return [...document.querySelectorAll('.spinner-border, .spinner-grow')].filter((s) => isRendered(s) && Number((css(s) || {}).opacity) > 0).map((s) => {
      const holder = s.closest('[role="status"]') || s;
      return norm(textOf(holder) || s.getAttribute('aria-label') || (s.parentElement ? textOf(s.parentElement) : ''));
    });
  }
  function progressBars() {
    const withRole = [...document.querySelectorAll('[role="progressbar"]')];
    const bare = [...document.querySelectorAll('.progress')].filter((p) => !p.matches('[role="progressbar"]') && !p.querySelector('[role="progressbar"]'));
    return withRole.concat(bare).filter(isRendered);
  }
  function progressNames(p) {
    const label = p.getAttribute('aria-label') || labelledText(p);
    const outer = p.closest('.progress, .progress-stacked');
    return [label, outer && outer !== p ? outer.getAttribute('aria-label') : '', p.id];
  }
  function progressState(id) {
    const p = deref(id);
    if (!p || !p.isConnected) return { exists: false };
    const holder = p.matches('[aria-valuenow]') ? p : p.querySelector('[aria-valuenow]');
    const bar = p.classList.contains('progress-bar') ? p : p.querySelector('.progress-bar');
    const track = p.closest('.progress') || p;
    const min = Number(holder ? holder.getAttribute('aria-valuemin') || 0 : 0);
    const max = Number(holder ? holder.getAttribute('aria-valuemax') || 100 : 100);
    const now = holder ? Number(holder.getAttribute('aria-valuenow')) : NaN;
    const announced = Number.isFinite(now) && max > min ? ((now - min) / (max - min)) * 100 : NaN;
    const trackWidth = track.getBoundingClientRect().width;
    const shown = bar && trackWidth > 0 ? (bar.getBoundingClientRect().width / trackWidth) * 100 : NaN;
    return { exists: true, announced, shown, moving: moving(bar || p), label: bar ? textOf(bar) : '' };
  }

  // ------------------------------------------------------------------ the components script

  function scriptVersion() {
    const b = window.bootstrap;
    const fromGlobal = b && ['Modal', 'Tooltip', 'Collapse', 'Dropdown', 'Tab', 'Alert'].map((n) => b[n] && b[n].VERSION).find(Boolean);
    if (fromGlobal) return { version: fromGlobal, via: 'bootstrap' };
    const $ = window.jQuery;
    if ($ && $.fn) {
      const plugin = ['modal', 'tooltip', 'collapse', 'dropdown', 'tab', 'alert'].map((n) => $.fn[n] && $.fn[n].Constructor && $.fn[n].Constructor.VERSION).find(Boolean);
      if (plugin) return { version: plugin, via: 'jquery' };
    }
    return { version: '', via: '' };
  }

  C.lib = {
    norm, find, state, isShown, isClosed, ref, deref, hintOf, describedBy, anyMoving, shownOfKind, eventsSince, seenText, heardText,
    seq: () => C.seq, bindJquery, isRendered, moving, pending, nameOf, pick, toggles, targetsOf,
    carousels, carouselNames, carouselState, carouselItems,
    alerts, alertInfo, allAlerts,
    navbars, navbarNames, navbarState,
    fields, fieldState, invalidFields,
    listItems, itemState, containerNamed, trail, pagination, badgeHolders, badgesOf,
    spinners, progressBars, progressNames, progressState, scriptVersion, kinds,
  };
  window.__webshipComponents = C;
}

module.exports = { componentProbe };
