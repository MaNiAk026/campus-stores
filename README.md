# Campus Stores

Campus Stores is a Product Engineer work sample set at a fictional campus media equipment desk. Work through a club’s screening, from equipment pickup to a partial return and the next morning’s handover. Open **Candidate brief** in the app for the assignment.

## Run the app

Open `index.html` in a modern browser. The app includes its scripts, styles, and icons and can run offline.

To serve it over local HTTP, run this from the repository folder and visit `http://localhost:8000`.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Each browser stores its own sample shift locally when browser storage is available. **Restart sample shift** restores the fictional starting records.

## Source

- `index.html` contains the desk layout, candidate brief, and bundled icons.
- `app.js` contains the sample records and interactions.
- `styles.css` defines the desktop and mobile layouts.
- `case-study.html`, `case-study.css` and `case-study.js` are the reviewer write-up page.
- `fonts/Geist-Variable.woff2` is bundled so the desk still works offline.

Licence notices for the Phosphor icons and the Geist font are in [third-party/](third-party/).

## My work (reviewers start here)

**Short version:** open [case-study.html](case-study.html) for the write-up, then play the shift in `index.html`. The change is in the **Loan register** (`app.js`, `styles.css`). Every major decision, with its reasoning and the options rejected, is in [decision.md](decision.md).

To play it: issue RQ-214's three units to Kabir, then move to 7:30 pm. Return the projector and speaker, add a handover on the adapter slip, then move to Saturday.

### What the product handles well

At pickup, the issue form won't let me hand over the wrong thing. PR-06 is in repair and never appears as an option. Trying to give the Film Society a second projector is refused because the approved quantity is already out. A tired person at a 3:45 pm counter can't create a bad slip, and I kept every one of these guardrails.

### The moment I would change

Saturday, 9 am. Leela walks in with an adapter, and the job is to find what was outstanding from Friday. The original register answered that badly:

- A slip read only `L-404 · AD-12`, with no model, bin or type.
- Nothing said it was overdue, or that it belonged to a kit that had come back mostly complete.
- Two adapters sit in the same bin (AD-12 and AD-15), so a wrong guess closes the loan on the wrong unit.
- Kabir's "Leela has the adapter" lived only in a free-text Desk book entry, on a different page from the slip it describes.

### The decision

**Organise the register around the kit, and let only the asset tag close a slip.** The desk thinks in kits, but the risk sits with individual units.

- **Kit grouping.** Slips sit under their request, with a header such as "3 of 3 approved units issued · 1 still out" and one status pip per approved item. Kits with an overdue unit sort to the top.
- **Overdue from the desk clock.** Due times and desk time are both parsed into minutes since Friday midnight (`toMins` in `app.js`). There is no hand-kept lookup table, so any return time in the list works. A slip shows how late it is ("Overdue by 13 h").
- **Structured handover on the slip.** The slip has a **Held by** picker, an **Expected back** picker and an optional short note, shown on the slip as "With Leela Das · expected back Sat 9 am". The Desk book now opens with a summary of what is still out.
- **Tag check before closing.** **Record return** shows the unit the slip expects (AD-12, Belkin AVC002, bin C4) and warns that AD-15 shares the bin. **Different tag** keeps the slip open and says where the other unit belongs. The confirmation names the model and the bin it went back to.
- **Issue form.** Choosing a request narrows the units to what it approves, fills in its return time, and shows errors inline in the form.

**The same job with the change:** at 7:30 pm I check the tags and close the projector and speaker. The kit header drops to "1 still out". On the adapter slip I add a handover: held by Leela Das, back Sat 9 am. At 9 am the nav shows one overdue slip, and the Film Society kit sits on top with the handover on it. Leela hands over an adapter, the tag reads AD-12, and I close the slip.

**What I kept:** per-unit slips, the issue guardrails, the shift timeline, and the Desk book for messages that aren't about a slip.

### What I'd observe at a real counter

The main thing is whether the morning person closes the adapter's slip **without opening the Desk book**. If they still scroll through the handover notes to find out who has what, the handover on the slip isn't doing its job.

I'd also count **Different tag** results. They should be rare, and none should end with a closed slip for the wrong unit. If staff confirm the tag check in under a second without looking, it is friction without safety, and I'd move to scanning the tag instead.

### Visual pass

The whole UI was restyled to one visual system:
- one typeface (Geist, bundled locally)
- a fixed type scale and spacing steps
- consistent radii
- flat surfaces with full borders
- Phosphor icons
- one easing curve that respects reduced motion, used only where something changed (see decisions 19–22 in [decision.md](decision.md))
- a skip link
- composed empty states

It was checked at 390 px in light and dark mode.

## Submit your work

1. [Fork Campus Stores](https://github.com/virinchi-healthcare/campus-stores/fork) into your GitHub account. Complete the candidate brief and push your changes to your public fork. In your README, point reviewers to your work and explain the decision you made.
2. In your fork, open **Commits**, select the final commit you want reviewed, and copy the page URL. It should look like `https://github.com/YOUR-USERNAME/campus-stores/commit/COMMIT-SHA`.
3. [Submit your work through the Google Form](https://docs.google.com/forms/d/e/1FAIpQLScvzoh1R4WS-SkiwAVBQbMvniieJYSoOEfLMyVo5CyjOvYUgQ/viewform). Your **roll number**, **email ID**, and **final commit link from your public fork** are required. Enter your roll number and email ID in the form only.
