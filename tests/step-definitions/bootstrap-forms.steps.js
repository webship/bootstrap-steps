'use strict';

// Form validation states, the way a person sees them after sending a form: a field shown as valid
// or invalid (the class `is-valid` / `is-invalid` a server sets, or the form's `was-validated` with
// the field's own validity), the message under it (`.invalid-feedback`, `.valid-feedback` and their
// tooltip forms), and how many fields are shown as invalid.
//
// A field is found by its label (the label's text, with a trailing colon or star ignored), else by
// its aria-label or placeholder. The borders change colour with a transition: the steps wait for it.

const { Then } = require('@cucumber/cucumber');
const h = require('./bootstrap-helpers');

async function resolveField(world, label) {
  const result = await h.poll(world, (lib, a) => {
    const all = lib.fields(a.label);
    const shown = all.filter((f) => lib.isRendered(f) || (f.type === 'checkbox' && lib.isRendered(f.parentElement)) || (f.type === 'radio' && lib.isRendered(f.parentElement)));
    const pickOne = shown[0] || all[0];
    return { done: !!pickOne, ref: pickOne ? lib.ref(pickOne) : 0, labels: [...document.querySelectorAll('label')].map((l) => lib.norm(l.textContent)).filter(Boolean) };
  }, { label }, h.budget(world));
  if (result.ref) return result.ref;
  throw h.failure(world.page, `Expected a field labelled "${label}" on the page, but there is none.`, {
    found: `the labels here: ${h.listed(result.labels)}`,
    hint: 'a field is found by its label, else by its aria-label or its placeholder.',
  });
}

/**
 * A field is shown as valid or invalid: a server marked it (`is-valid`, `is-invalid`), or the form
 * was checked in the browser (`was-validated`) and the field is valid or not. The step waits for
 * the state and for the field's transition to end.
 *
 * Example #1: Then the "City" field should be shown as invalid
 * Example #2: Then the "First name" field should be shown as valid
 * Example #3: Then the "Username" field should be shown as invalid
 * Example #4: Then the "Agree to terms and conditions" field should be shown as invalid
 * Example #5: Then the "State" field should be shown as valid
 */
Then(/^the "([^"]*)" field should be shown as (valid|invalid)$/, async function (label, wanted) {
  const ref = await resolveField(this, label);
  const result = await h.poll(this, (lib, a) => {
    const s = lib.fieldState(a.ref);
    return { done: s.exists && s[a.wanted] && s.settled, state: s };
  }, { ref, wanted }, h.budget(this));
  if (result.done) return;
  const s = result.state || {};
  throw h.failure(this.page, `Expected the "${label}" field to be shown as ${wanted}, but it is shown as ${s.invalid ? 'invalid' : (s.valid ? 'valid' : 'neither valid nor invalid')}.`, {
    found: s.messages && s.messages.length ? `its messages: ${h.listed(s.messages.map((m) => m.text))}` : 'no message under it',
    hint: s.validated || s.invalid || s.valid ? 'check the value of the field.' : 'a form checked in the browser shows the states once it is sent (the class was-validated); a server marks the fields with is-valid or is-invalid.',
  });
});

/**
 * A field shows a message under it (or beside it, as a tooltip): its invalid or valid feedback,
 * shown by the page because the field is in that state. The text is a part of the message,
 * compared without regard to letter case and white space.
 *
 * Example #1: Then the "City" field should show the message "Please provide a valid city."
 * Example #2: Then the "First name" field should show the message "Looks good!"
 * Example #3: Then the "Username" field should show the feedback "Please choose a username."
 * Example #4: Then the "Agree to terms and conditions" field should show the message "You must agree before submitting."
 * Example #5: Then the "Zip" field should show the feedback "Please provide a valid zip."
 */
Then(/^the "([^"]*)" field should show the (?:message|feedback) "([^"]*)"$/, async function (label, text) {
  const ref = await resolveField(this, label);
  const result = await h.poll(this, (lib, a) => {
    const s = lib.fieldState(a.ref);
    const want = lib.norm(a.text).toLowerCase();
    return { done: s.exists && s.messages.some((m) => lib.norm(m.text).toLowerCase().includes(want)), state: s };
  }, { ref, text }, h.budget(this));
  if (result.done) return;
  const s = result.state || {};
  throw h.failure(this.page, `Expected the "${label}" field to show the message "${text}", but it ${s.messages && s.messages.length ? 'shows another' : 'shows none'}.`, {
    found: s.messages && s.messages.length ? `its messages: ${h.listed(s.messages.map((m) => m.text))}` : `the field is shown as ${s.invalid ? 'invalid' : (s.valid ? 'valid' : 'neither valid nor invalid')}`,
    hint: 'a message is shown only in its state: the invalid feedback of an invalid field, the valid feedback of a valid one.',
  });
});

/**
 * How many fields of the page are shown as invalid: a number, or "no". The step waits for the
 * count.
 *
 * Example #1: Then 5 fields should be shown as invalid
 * Example #2: Then no field should be shown as invalid
 * Example #3: Then 1 field should be shown as invalid
 * Example #4: Then no fields should be shown as invalid
 * Example #5: Then 6 fields should be shown as invalid
 */
Then(/^(\d+|no) fields? should be shown as invalid$/, async function (count) {
  const wanted = count === 'no' ? 0 : Number(count);
  const result = await h.poll(this, (lib, a) => {
    const invalid = lib.invalidFields();
    return { done: invalid.length === a.wanted, invalid };
  }, { wanted }, h.budget(this));
  if (result.done) return;
  throw h.failure(this.page, `Expected ${wanted === 0 ? 'no field' : `${wanted} field${wanted === 1 ? '' : 's'}`} to be shown as invalid, but ${result.invalid.length} ${result.invalid.length === 1 ? 'is' : 'are'}.`, {
    found: `the invalid fields: ${h.listed(result.invalid, 20)}`,
    hint: 'fields count once the form shows its states (was-validated, or is-invalid from a server).',
  });
});
