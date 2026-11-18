# Decision log

The major decisions behind this submission, in the order they were made, with the reason for each and what was rejected. For the short version, read the README's "My work" section or `case-study.html`.

## Context

The brief asks: *Would you keep this product?* Play the shift, name one moment the product handles well and one you would change, prototype the change, walk through the same job with it, say what you'd keep, and name one observation at a real counter that would show whether it helped.

---

## Product decisions

### 1. Change the Saturday 9 am handover, not the pickup

**Decision.** The moment to change is the morning shift working out what was still out from Friday and closing the right loan.
**Why.** This is where the original register failed:

- A slip read only `L-404 · AD-12`, with no model or bin.
- Nothing said it was overdue.
- "Leela has the adapter" lived only in the Desk book, on another page.
- AD-12 and AD-15 share bin C4, so a guess could close the wrong loan.

**Rejected.** Reworking pickup. That is the moment the product already handles well (see 2).

### 2. Keep the issue guardrails and one slip per unit

**Decision.** Leave the pickup rules untouched:

- PR-06 (in repair) is never offered.
- A second projector is refused once the approved one is out.
- Each physical unit gets its own slip.

**Why.** A tired person at a 3:45 pm counter can't create a bad slip. Per-unit slips are also what make a partial return recordable.

### 3. Organise the register around the kit

**Decision.** Slips sit under their request:

- The header reads "3 of 3 approved units issued · 1 still out".
- There is one status pip per approved item.
- Kits with an overdue unit sort to the top.

**Why.** Desk staff talk about "the Film Society's kit", not slip 404. Grouping makes a partial return readable at a glance without giving up per-unit slips.
**Rejected.** A flat list sorted by due time. It hides that three slips belong to one job.

### 4. Work out overdue from the desk clock

**Decision.** `toMins()` in `app.js` converts both desk time ("Friday · 3:45 pm") and due times ("Sat noon") into minutes since Friday midnight and compares them. A slip shows how late it is ("Overdue by 13 h").
**Why.** The first version used a hand-kept table of due times, which would silently fail for any new time.
**Trade-off.** The parser only understands the day-plus-time format the app uses. To keep it safe, due times can only come from one shared list (`returnTimes`), and restoring a saved shift rejects any due time outside that list.

### 5. Structured handover on the slip

**Decision.** The free-text slip note became three fields:

- **Held by**, a picker of known people
- **Expected back**, a picker of return times
- an optional short note (120 characters)

The slip shows "With Leela Das · expected back Sat 9 am".
**Why.** A free-text note works only if people write good ones. "Who has it" and "when it's coming back" are the two facts the morning shift needs, so they are pickers. The short note covers anything else.
**Rejected.** Keeping free text only. That was the first version, and its weakness was clear: it depends on everyone writing well.
**Compatibility.** Shifts saved with the old free-text note still show it as the note line.

### 6. Check the tag before a slip closes

**Decision.** **Record return** opens a check:

- It shows the unit the slip expects in large type: AD-12, Belkin AVC002, home bin C4.
- It warns when another unit of the same type shares the bin.
- The slip closes only through "Tag reads AD-12, close slip".

**Why.** Showing the model and bin helps, but it still lets a tired person close the wrong loan. The tag is the only safe way to tell AD-12 from AD-15.
**Rejected.**

- *Typing the unit ID.* Stronger, but slower at a busy counter.
- *Barcode scanning.* Best long term, but it needs hardware and labels. The check is shaped so a scan can replace the tap later.

### 7. A wrong tag keeps the slip open and explains why

**Decision.** "Different tag" never closes anything. It tells staff what to do for each case:

- If the other unit is out on another slip, record the return on that slip.
- If it isn't out on any slip, put it back in its bin and ask where the right unit is.
- If it's in repair, say so.
- For any other tag, hold the unit at the desk and add a handover note.

**Why.** A dead-end "No" would push staff back to guessing.

### 8. Link the Desk book to the register instead of removing it

**Decision.** The Desk book opens with a "Still out on the loan register" summary that lists overdue slips first and links to the register. Messages from clubs stay where they are.
**Why.** The Desk book still holds messages that aren't about a slip. The aim is that no one has to read it to find out who has what.

### 9. Make the issue form do more of the work

**Decision.** Choosing a request:

- narrows the units to what it approves and hasn't already got out
- fills in its return time
- shows a one-line summary of what is approved

Errors appear inside the form, not only in the status bar.
**Why.** This keeps the existing guardrails and catches mistakes before they reach a slip.

### 10. The one observation at a real counter

**Decision.** Watch whether the morning person closes the adapter's slip **without opening the Desk book**.
**Supporting signals:**

- "Different tag" results should be rare, and none should end in a closed slip for the wrong unit.
- If tag checks are confirmed in under a second, staff are tapping through without looking. In that case, move to scanning.

---

## Design decisions

### 11. Apply the design skill's visual rules to the app, and its page structure only to the case study

**Decision.** The `landing-page-design` skill (github.com/elayadesign/ai-design-skills) was used in two ways:

- **Visual rules (Part B), across the whole desk app:** type scale, spacing steps, rounded-corner sizes, flat surfaces with full borders, one animation curve, every button state, and composed empty states.
- **Marketing page structure (Part A), only for a new `case-study.html`:** hero, problem, change, tagline reveal, walkthrough, counter test, FAQ, final call to action.

**Why.** Campus Stores is a desk tool for tired staff, and the brief grades product judgment. A marketing landing page in place of the app would read as polish over substance. A separate case study page gives reviewers the walkthrough the brief asks for.

### 12. Bundle Geist and Phosphor locally

**Decision.** Inter was replaced with Geist and Lucide icons with Phosphor, as the skill specifies. Both are bundled in the repo (`fonts/`, inline SVG symbols) instead of loaded from a CDN. The Lucide licence was removed; the Geist (OFL) and Phosphor (MIT) licences are in `third-party/`.
**Why.** The README promises the app runs offline.

### 13. Where the design skill was deliberately not followed


- **Coloured status chips and the amber memo surface in dark mode.** The skill limits dark backgrounds to six neutral colours. These colours carry meaning (overdue, handover), so they stay. Page surfaces do use the approved colours.
- **Hyphens in data.** The skill bans hyphens in copy. Product data such as "USB-C → HDMI adapter" keeps its real name, while all written copy avoids hyphens.
- **Sales-page items skipped on the case study:** risk reversal, legal links, a custom 404 and cookie consent don't apply to a work sample.
- **Hero size.** The case study headline uses the skill's Heading 2 size (48px), stepping down to 30px on phones, so the hero fits beside the register mock-up.

### 14. Keep the case study out of search engines

**Decision.** Both pages are marked `noindex`.
**Why.** It's a fictional work sample, not a real product page.

---

## Process decisions

### 15. Install the design skill at user level

**Decision.** The skill lives in `~/.claude/skills/landing-page-design`, not in this repo.
**Why.** It's a tool used to make the work, not part of the submission, and it stays out of the public fork.

### 16. The author makes the final commit

**Decision.** Nothing is committed or pushed by the assistant. The author reviews the work and makes one final commit, which is the commit link the submission form asks for.
**Note.** `origin` currently points at the upstream repo (`virinchi-healthcare/campus-stores`), not a fork. Point it at your fork before pushing.

### 17. Keep saved shifts working

**Decision.** The storage key and `version: 1` are unchanged, and the new fields are optional.
**Why.** A reviewer who opened the app before can reload it without losing their sample shift.

### 18. Personal details stay out of the repo

**Decision.** Roll number and email go only into the submission form, as the README instructs.

---

## Motion decisions

### 19. Motion only where something changed

**Decision.** Every animation in the desk app answers "what just changed?":

- the tab you opened (content arrives in reading order, 60ms apart, capped)
- the desk time (the clock ticks in and the shift timeline fills to the new moment)
- the slip you closed (it slides out of the kit, and that kit's pip pops green)
- the slip you issued or the handover you saved (it rises in with a brief highlight)
- the outstanding count (the nav badge pops when it changes)
- Saturday's overdue adapter (its tag rings twice when the morning shift starts)

**Why.** This is a counter tool, so motion has to point at the change. Because the app redraws a page on every action, animations are one-shot hints (`fx` in `app.js`) that name only the changed element. Nothing replays when it shouldn't.
**Rejected.** Hover lifts on every card and looping attention effects. They add noise for a tired person.

### 20. Elements that glide are built once

**Decision.** The nav and the shift timeline are now built once and only updated, rather than redrawn. That lets one pill glide between tabs and the timeline fill slide between moments.
**Why.** An element that is recreated on every action cannot transition smoothly.

### 21. A looping demo in the case study hero

**Decision.** The hero mock-up now plays the Saturday return: overdue, then Record return, then the tag check sheet, then closed with "returned to bin C4". It has a step label strip and a **Pause demo** button.
**Why.** Reviewers see the change working before they open the app.
**Guardrails.**

- The demo pauses when off screen.
- The pause button meets WCAG 2.2.2 (content that moves for more than 5 seconds needs a pause control).
- It doesn't autoplay when reduced motion is requested; the button reads "Play demo" instead.

### 22. All motion follows the skill's rules

**Decision.**

- One easing curve, `cubic-bezier(0.22, 1, 0.36, 1)`.
- Only `transform` and `opacity` animate.
- Hover colour changes take 300ms.
- Scroll reveals use `IntersectionObserver`, and the tagline uses a scroll handler throttled to one update per animation frame.
- With reduced motion requested, movement becomes a plain fade, returns close instantly, and the pill and timeline jump instead of gliding.

---

## How it was checked

- The full shift was played through the real UI in a browser:
  - issue the three units, then try a second unit of an already-issued type and see it refused
  - at 7:30 pm, return two units and add the handover
  - on Saturday, see "Overdue by 13 h", try a wrong tag (slip stays open), then close with the right tag
- Both pages were checked at 390px and 1280px, in light and dark mode, with no horizontal overflow and no console errors.
- The case study's tagline reveal, mobile menu and scroll reveals were checked, and they respect reduced motion.
- Motion was checked in the same shift replay:
  - each animation fires only for the element that changed
  - a fast double tap on "close slip" still closes it once
  - the demo loops through all four states and holds when paused
  - with reduced motion, the demo waits for Play and returns close instantly
