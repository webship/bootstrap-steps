'use strict';

// Carousels: the next and previous slides, a slide by its number (through its indicators), which
// slide is shown, what it shows, and a carousel that moves on by itself.
//
// A carousel is named by its aria-label (or aria-labelledby), else by its id; without a name, the
// only carousel on the page. The steps wait for `slid` and for the sliding classes
// (`carousel-item-next`, `carousel-item-start` ...) to go: the indicators change at the start of a
// slide, so they are not the sign that it has ended.

const { When, Then } = require('@cucumber/cucumber');
const h = require('./bootstrap-helpers');

function label(name) {
  return name ? `the "${name}" carousel` : 'the carousel';
}

async function resolveCarousel(world, name) {
  const result = await h.poll(world, (lib, a) => {
    const all = lib.carousels().filter(lib.isRendered);
    if (!a.name) return { done: all.length > 0, ref: all.length === 1 ? lib.ref(all[0]) : 0, count: all.length, names: all.map((c) => lib.carouselNames(c).find(Boolean) || '') };
    const { matches, names } = lib.pick(all, a.name, (c) => lib.carouselNames(c));
    return { done: matches.length > 0, ref: matches.length ? lib.ref(matches[0]) : 0, count: all.length, names };
  }, { name: name || '' }, h.budget(world));
  if (result.ref) return result.ref;
  if (!name && result.count > 1) {
    throw h.failure(world.page, `Expected one carousel on the page, but there are ${result.count}.`, {
      found: `their names: ${h.listed(result.names)}`,
      hint: 'name the carousel by its aria-label or its id: When I go to the next slide of the "Featured" carousel',
    });
  }
  throw h.failure(world.page, name ? `Expected a carousel named "${name}" on the page, but there is none.` : 'Expected a carousel on the page, but there is none.', {
    found: `the carousels here: ${h.listed(result.names)}`,
    hint: 'a carousel is named by its aria-label, its aria-labelledby or its id.',
  });
}

async function waitSlide(world, ref, index, timeout) {
  return h.poll(world, (lib, a) => {
    const s = lib.carouselState(a.ref);
    return { done: s.exists && s.settled && (a.index === null || s.index === a.index), state: s };
  }, { ref, index }, timeout || h.budget(world));
}

async function control(world, ref, selector) {
  return world.page.evaluate(([r, sel]) => {
    const lib = window.__webshipComponents.lib;
    const c = lib.deref(r);
    const hit = [...c.querySelectorAll(sel)].find(lib.isRendered) || null;
    if (hit) return lib.ref(hit);
    // Controls may live outside the carousel and target it by id.
    if (c.id) {
      const outside = [...document.querySelectorAll(sel)].filter((el) => lib.targetsOf(el).includes(c)).find(lib.isRendered);
      if (outside) return lib.ref(outside);
    }
    return 0;
  }, [ref, selector]);
}

/**
 * Go to the next or the previous slide of a carousel with its own control, and wait until the
 * slide has ended (`slid` and no sliding class left). A carousel still sliding is let finish
 * first. Without a name, the only carousel on the page.
 *
 * Example #1: When I go to the next slide of the "Featured" carousel
 * Example #2: When I go to the previous slide of the "Featured" carousel
 * Example #3: When I go to the next slide of the carousel
 * Example #4: When I go to the next slide of the "Crossfade" carousel
 * Example #5: When we go to the previous slide of the carousel
 */
When(/^(?:I |we )?go to the (next|previous) slide of the (?:"([^"]*)" )?carousel$/, async function (direction, name) {
  const ref = await resolveCarousel(this, name);
  const before = await waitSlide(this, ref, null);
  const button = await control(this, ref, direction === 'next' ? '[data-bs-slide="next"], [data-slide="next"]' : '[data-bs-slide="prev"], [data-slide="prev"]');
  if (!button) {
    throw h.failure(this.page, `Could not go to the ${direction} slide of ${label(name)}: it has no visible ${direction === 'next' ? 'next' : 'previous'} control.`, {
      hint: 'a control carries data-bs-slide="next" or "prev" (data-slide on version 4).',
    });
  }
  const from = before.state && before.state.index;
  const count = before.state && before.state.count;
  await h.clickRef(this, button, `the ${direction} control of ${label(name)}`);
  const expected = from && count ? (direction === 'next' ? (from % count) + 1 : ((from - 2 + count) % count) + 1) : null;
  const after = await waitSlide(this, ref, expected);
  if (!after.done) {
    throw h.failure(this.page, `Expected ${label(name)} to show slide ${expected} of ${count} after its ${direction} control, but it shows slide ${after.state.index}${after.state.settled ? '' : ' and is still sliding'}.`, {
      hint: 'a carousel that plays by itself may have moved on meanwhile; point at it to pause it, or check the slides with "should show slide ... of ...".',
    });
  }
});

/**
 * Go to a slide by its number (the first is 1) with the carousel's indicators, and wait until the
 * slide has ended. Without a name, the only carousel on the page.
 *
 * Example #1: When I go to slide 3 of the "Featured" carousel
 * Example #2: When I go to slide 1 of the "Featured" carousel
 * Example #3: When I go to slide 2 of the carousel
 * Example #4: When we go to slide 2 of the "Featured" carousel
 * Example #5: When I go to slide 1 of the carousel
 */
When(/^(?:I |we )?go to slide (\d+) of the (?:"([^"]*)" )?carousel$/, async function (number, name) {
  const ref = await resolveCarousel(this, name);
  const before = await waitSlide(this, ref, null);
  const index = Number(number);
  if (before.state && before.state.count && (index < 1 || index > before.state.count)) {
    throw h.failure(this.page, `Could not go to slide ${index} of ${label(name)}: it has ${before.state.count} slides.`, {
      hint: 'slides are numbered from 1.',
    });
  }
  if (before.state && before.state.index === index) return;
  const indicator = await control(this, ref, `[data-bs-slide-to="${index - 1}"], [data-slide-to="${index - 1}"]`);
  if (!indicator) {
    throw h.failure(this.page, `Could not go to slide ${index} of ${label(name)}: it has no indicators to choose a slide with.`, {
      hint: 'use its controls instead: When I go to the next slide of the carousel',
    });
  }
  await h.clickRef(this, indicator, `the indicator of slide ${index} of ${label(name)}`);
  const after = await waitSlide(this, ref, index);
  if (!after.done) {
    throw h.failure(this.page, `Expected ${label(name)} to show slide ${index} after its indicator was clicked, but it shows slide ${after.state.index}${after.state.settled ? '' : ' and is still sliding'}.`, {
      hint: 'check that the page loads the components script ("the page should use the components script").',
    });
  }
});

/**
 * A carousel shows a slide (counted from 1) out of a number of slides, once it has stopped
 * sliding. Without a name, the only carousel on the page.
 *
 * Example #1: Then the "Featured" carousel should show slide 1 of 3
 * Example #2: Then the "Featured" carousel should show slide 2 of 3
 * Example #3: Then the carousel should show slide 3 of 3
 * Example #4: Then the "Crossfade" carousel should show slide 2 of 3
 * Example #5: Then the "Autoplay" carousel should show slide 1 of 3
 */
Then(/^the (?:"([^"]*)" )?carousel should show slide (\d+) of (\d+)$/, async function (name, number, total) {
  const ref = await resolveCarousel(this, name);
  const result = await waitSlide(this, ref, Number(number));
  if (result.done && result.state.count === Number(total)) return;
  const s = result.state || {};
  throw h.failure(this.page, `Expected ${label(name)} to show slide ${number} of ${total}, but it shows slide ${s.index} of ${s.count}${s.settled ? '' : ' and is still sliding'}.`, {
    found: s.text ? `the slide shows: "${h.excerpt(s.text, 120)}"` : undefined,
    hint: s.ride ? 'this carousel plays by itself; point at it to pause it before reading its slide.' : 'slides are counted from 1.',
  });
});

/**
 * The slide a carousel shows has a text (a part of its caption, its text or the alternative text
 * of its image), once the carousel has stopped sliding; with "not", it does not. Without a name,
 * the only carousel on the page.
 *
 * Example #1: Then the "Featured" carousel should show "First slide label"
 * Example #2: Then the "Featured" carousel should show "Some representative placeholder content for the second slide."
 * Example #3: Then the carousel should show "Third slide"
 * Example #4: Then the "Crossfade" carousel should show "A green noon"
 * Example #5: Then the "Featured" carousel should not show "Second slide label"
 */
Then(/^the (?:"([^"]*)" )?carousel should( not)? show "([^"]*)"$/, async function (name, not, text) {
  const ref = await resolveCarousel(this, name);
  const result = await h.poll(this, (lib, a) => {
    const s = lib.carouselState(a.ref);
    const has = lib.norm(s.text).toLowerCase().includes(lib.norm(a.text).toLowerCase());
    return { done: s.exists && s.settled && (a.not ? !has : has), state: s };
  }, { ref, text, not: !!not }, h.budget(this));
  if (result.done) return;
  const s = result.state || {};
  throw h.failure(this.page, `Expected ${label(name)} ${not ? 'not ' : ''}to show "${text}", but its slide ${s.index} of ${s.count} ${not ? 'does' : 'does not'}${s.settled ? '' : ' (it is still sliding)'}.`, {
    found: `the slide shows: "${h.excerpt(s.text, 160)}"`,
    hint: 'the text is a part of the slide\'s caption, its text or the alternative text of its image.',
  });
});

/**
 * A carousel that plays by itself moves to its next slide without being touched: the step waits
 * for its next `slid` event, for at most its interval (`data-bs-interval`, 5 seconds by default)
 * and a little more, and checks it went one slide on. Without a name, the only carousel on the
 * page. The pointer is moved off it first: a carousel pauses while the pointer is over it.
 *
 * Example #1: Then the "Autoplay" carousel should move to the next slide by itself
 * Example #2: Then the carousel should move to the next slide by itself
 * Example #3: And the "Autoplay" carousel should move to the next slide by itself
 * Example #4: Then the "Featured" carousel should move to the next slide by itself
 * Example #5: But the carousel should move to the next slide by itself
 */
Then(/^the (?:"([^"]*)" )?carousel should move to the next slide by itself$/, async function (name) {
  const ref = await resolveCarousel(this, name);
  await this.page.mouse.move(0, 0);
  const start = await waitSlide(this, ref, null);
  const s = start.state || {};
  const timeout = Math.min((s.interval || 5000) + 3000, h.longBudget(this));
  const expected = s.index && s.count ? (s.index % s.count) + 1 : null;
  const result = await h.poll(this, (lib, a) => {
    const now = lib.carouselState(a.ref);
    return { done: now.exists && now.settled && now.index === a.expected, state: now };
  }, { ref, expected }, timeout);
  if (result.done) return;
  throw h.failure(this.page, `Expected ${label(name)} to move to slide ${expected} by itself within ${Math.round(timeout / 1000)} seconds, but it still shows slide ${result.state.index}.`, {
    found: s.ride ? `data-bs-ride="${s.ride}", an interval of ${s.interval} ms` : 'it is not set to play by itself (no data-bs-ride="carousel")',
    hint: 'a carousel plays by itself with data-bs-ride="carousel" (data-ride on version 4), and pauses while the pointer or the focus is in it.',
  });
});
