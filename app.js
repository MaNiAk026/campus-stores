(() => {
  const storageKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const returnTimes = ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"];
  const days = { fri: 0, friday: 0, sat: 1, saturday: 1, sun: 2, sunday: 2 };
  // Reads desk times ("Friday · 3:45 pm") and return times ("Sat noon") as
  // minutes since Friday 00:00, so overdue follows the desk clock for any
  // time written this way instead of a hand-kept lookup table.
  const toMins = (when) => {
    const m =
      /^([a-z]+)\W+(?:(noon)|(\d{1,2})(?::(\d{2}))?\s*(am|pm))$/i.exec(
        String(when).trim(),
      );
    const day = m && m[1].toLowerCase();
    if (!m || !Object.hasOwn(days, day)) return NaN;
    const hour = m[2]
      ? 12
      : (Number(m[3]) % 12) + (m[5].toLowerCase() === "pm" ? 12 : 0);
    return days[day] * 1440 + hour * 60 + Number(m[4] || 0);
  };
  const pages = [
    ["Requests", "clipboard-text"],
    ["Inventory", "package"],
    ["Loan register", "book-open-text"],
    ["Desk book", "chat-centered-text"],
  ];
  const filters = ["All items", "On shelf", "On loan", "In repair"];
  const original = () => ({
    version: 1,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    editing: false,
    noting: 0,
    checking: 0,
    mismatch: false,
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const getLoan = (num) => s.loans.find((l) => l.num === Number(num));
  const deskNow = () => toMins(shifts[s.phase].time);
  const lateBy = (l) => (l.back ? 0 : Math.max(0, deskNow() - toMins(l.due)));
  const overdue = (l) => lateBy(l) > 0;
  const span = (mins) =>
    mins < 60
      ? mins + " min"
      : Math.floor(mins / 60) + " h" + (mins % 60 ? " " + (mins % 60) + " min" : "");
  // Handover details for an outstanding slip. Older saved shifts kept a
  // single free text note, which still shows as the note line.
  const holdOf = (l) => ({
    who: (l.hold && l.hold.who) || "",
    back: (l.hold && l.hold.back) || "",
    text: (l.hold ? l.hold.text : l.note) || "",
  });
  const holdLine = (l) => {
    const h = holdOf(l);
    if (!h.who && !h.back) return "";
    return (
      (h.who ? "With " + h.who : "Location unknown") +
      (h.back ? " · expected back " + h.back : "")
    );
  };
  // Units that can leave the desk, narrowed to what a request approves
  // (and has not already got out) once a request is chosen.
  const unitChoices = (reqId) => {
    const r = getReq(reqId);
    return assets
      .filter(
        (a) =>
          !a.repair &&
          !out(a.id) &&
          (!r ||
            (r.items.includes(a.type) &&
              !s.loans.some(
                (l) =>
                  l.req === r.id &&
                  !l.back &&
                  getAsset(l.asset).type === a.type,
              ))),
      )
      .map((a) => [
        a.id,
        a.id + " · " + a.type + " · " + a.model + " · bin " + a.bin,
      ]);
  };
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icon = (name) =>
    '<svg aria-hidden="true" class="store-icon"><use href="#icon-' +
    name +
    '"></use></svg>';
  const opts = (list, selected = "") =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === selected ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("");
  const btn = (label, act, val = "", style = "", ico = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    (ico ? icon(ico) : "") +
    esc(label) +
    "</button>";
  const select = (label, key, options, selected = "", required = true) =>
    "<label><span>" +
    label +
    '</span><select name="' +
    key +
    '"' +
    (required ? " required" : "") +
    '><option value="">Select…</option>' +
    opts(options, selected) +
    "</select></label>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, tone = "") =>
    '<span class="tag' + (tone ? " " + tone : "") + '">' + esc(t) + "</span>";
  const empty = (ico, title, text) =>
    '<div class="empty">' +
    icon(ico) +
    "<strong>" +
    esc(title) +
    "</strong><p>" +
    esc(text) +
    "</p></div>";
  const segmented = (label, items, current, act) =>
    '<div class="segmented" role="group" aria-label="' +
    esc(label) +
    '">' +
    items
      .map(
        ([val, text]) =>
          '<button type="button" data-action="' +
          act +
          '" data-val="' +
          esc(val) +
          '" aria-pressed="' +
          (val === current) +
          '">' +
          esc(text) +
          "</button>",
      )
      .join("") +
    "</div>";
  // What happened to each approved equipment type on a request.
  const itemState = (r, type) => {
    const slips = s.loans.filter(
      (l) => l.req === r.id && getAsset(l.asset).type === type,
    );
    const live = slips.find((l) => !l.back);
    if (live) return { key: overdue(live) ? "late" : "out", slip: live };
    return { key: slips.length ? "back" : "none", slip: slips.at(-1) };
  };
  const stateLabel = {
    late: "Overdue",
    out: "Out",
    back: "Returned",
    none: "Not issued",
  };
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html +=
        btn("All requests", "close", "", "ghost", "arrow-left") +
        '<div class="record"><small>' +
        esc(r.id) +
        " · Approved</small><h3>" +
        esc(r.event) +
        "</h3><p>" +
        esc(r.club) +
        " · Filed by " +
        esc(r.owner) +
        "</p><p><b>Return by</b> " +
        esc(r.due) +
        '</p><p><b>Approved equipment</b></p><ul class="itemlist">' +
        r.items
          .map((type) => {
            const st = itemState(r, type);
            return (
              "<li><span>" +
              esc(type) +
              "</span>" +
              badge(
                stateLabel[st.key] +
                  (st.slip ? " · " + st.slip.asset + " on L-" + st.slip.num : ""),
                st.key,
              ) +
              "</li>"
            );
          })
          .join("") +
        "</ul><p class=\"memo\">" +
        esc(r.note) +
        "</p></div>";
    } else
      html += requests
        .map((r) => {
          const open = s.loans.filter((l) => l.req === r.id && !l.back);
          const late = open.some(overdue);
          return row(
            r.event,
            r.id +
              " · " +
              r.club +
              " · " +
              r.items.length +
              (r.items.length > 1 ? " items" : " item") +
              (open.length ? " · " + open.length + " still out" : ""),
            (late ? badge("Overdue", "late") + " " : "") +
              btn("View form", "request", r.id),
          );
        })
        .join("");
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html += segmented(
      "Show units",
      filters.map((f) => [f, f]),
      s.filter,
      "filter",
    );
    let shown = 0;
    for (const a of assets) {
      const loan = out(a.id);
      const status = a.repair ? "In repair" : loan ? "On loan" : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      shown++;
      html += row(
        a.id + " · " + a.type,
        a.model +
          " · bin " +
          a.bin +
          (loan
            ? " · slip L-" + loan.num + " · " + (holdOf(loan).who || loan.who)
            : ""),
        badge(
          loan && overdue(loan) ? "Overdue" : status,
          loan && overdue(loan)
            ? "late"
            : status === "On shelf"
              ? "good"
              : status === "On loan"
                ? "out"
                : "",
        ),
      );
    }
    if (!shown)
      html += empty(
        "package",
        "No units " + s.filter.toLowerCase(),
        "Choose another filter to see the rest of the stock.",
      );
    return html;
  }
  function issueForm() {
    return (
      '<form data-issue class="panel reveal"><div class="form">' +
      select(
        "Approved request",
        "req",
        requests.map((r) => [r.id, r.id + " · " + r.club]),
      ) +
      select("Unit leaving the desk", "asset", unitChoices("")) +
      select(
        "Collected by",
        "who",
        people.map((p) => [p, p]),
      ) +
      select(
        "Return by",
        "due",
        returnTimes.map((d) => [d, d]),
      ) +
      '</div><p class="hint" data-req-hint hidden></p><p class="formerror" data-form-error role="alert" hidden></p><button type="submit" class="primary">Save issue slip</button></form>'
    );
  }
  function register() {
    const open = s.loans.filter((l) => !l.back);
    const late = open.filter(overdue).length;
    let html = head(
      "Loan register",
      open.length
        ? open.length +
            (open.length > 1 ? " units out" : " unit out") +
            (late ? " · " + late + " overdue" : "") +
            " · one slip per physical unit"
        : "Every issued unit is back · one slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) return html + issueForm();
    html += segmented(
      "Slips to show",
      [
        ["0", "Outstanding"],
        ["1", "All slips"],
      ],
      s.onlyOpen ? "0" : "1",
      "scope",
    );
    const shown = s.loans.filter((l) => !s.onlyOpen || !l.back);
    if (!shown.length)
      return (
        html +
        empty(
          "check-circle",
          "Nothing is out",
          "Every unit issued this shift is back on its shelf. New loans appear here, grouped under the request they belong to.",
        )
      );
    // Kits with an overdue unit come first, so the morning shift sees them
    // before anything else.
    const kits = requests
      .filter((r) => shown.some((l) => l.req === r.id))
      .sort(
        (a, b) =>
          Number(s.loans.some((l) => l.req === b.id && overdue(l))) -
          Number(s.loans.some((l) => l.req === a.id && overdue(l))),
      );
    for (const r of kits) {
      const issued = s.loans.filter((l) => l.req === r.id);
      const still = issued.filter((l) => !l.back);
      const lateHere = still.filter(overdue).length;
      html +=
        '<section class="kit' +
        (lateHere ? " haslate" : "") +
        '" aria-label="' +
        esc(r.club + " " + r.event) +
        '"><div class="kithead"><div><strong>' +
        esc(r.club + " · " + r.event) +
        "</strong><small>" +
        esc(
          r.id +
            " · " +
            issued.length +
            " of " +
            r.items.length +
            " approved units issued · " +
            (still.length ? still.length + " still out" : "all returned"),
        ) +
        '</small></div><div class="pips" aria-hidden="true">' +
        r.items
          .map((type, i) => {
            const st = itemState(r, type);
            return (
              '<span class="pip ' +
              st.key +
              '" data-pip="' +
              esc(r.id + "-" + i) +
              '" title="' +
              esc(type + ": " + stateLabel[st.key]) +
              '"></span>'
            );
          })
          .join("") +
        "</div></div>";
      for (const l of shown.filter((l) => l.req === r.id)) html += slipRow(l);
      html += "</section>";
    }
    return html;
  }
  function slipRow(l) {
    const a = getAsset(l.asset);
    const late = lateBy(l);
    const h = holdOf(l);
    const where = holdLine(l);
    const status = l.back
      ? badge("Returned" + (l.backAt ? " · " + l.backAt : ""), "good")
      : late
        ? '<span class="tag late">' +
          icon("warning-circle") +
          "Overdue by " +
          esc(span(late)) +
          "</span>"
        : badge("Due " + l.due);
    let html =
      '<div class="slip' +
      (s.checking === l.num || s.noting === l.num ? " active" : "") +
      '" data-slip="' +
      l.num +
      '"><div class="slipmain"><div class="sliptitle"><strong>' +
      esc(l.asset + " · " + a.type) +
      "</strong>" +
      status +
      '</div><small class="meta">' +
      icon("map-pin") +
      esc(a.model + " · home bin " + a.bin) +
      '</small><small class="meta">' +
      icon("user") +
      esc("Slip L-" + l.num + " · issued to " + l.who + " · due " + l.due) +
      "</small>" +
      (!l.back && (where || h.text)
        ? '<div class="handover">' +
          (where ? "<strong>" + icon("clock") + esc(where) + "</strong>" : "") +
          (h.text ? "<span>" + esc(h.text) + "</span>" : "") +
          "</div>"
        : "") +
      "</div>";
    if (!l.back)
      html +=
        '<div class="slipactions">' +
        btn(
          where || h.text ? "Edit handover" : "Add handover",
          "note",
          String(l.num),
          "",
          "note-pencil",
        ) +
        btn("Record return", "return", String(l.num), "strong") +
        "</div>";
    html += "</div>";
    if (!l.back && s.noting === l.num) html += holdForm(l);
    if (!l.back && s.checking === l.num) html += checkPanel(l);
    return html;
  }
  function holdForm(l) {
    const h = holdOf(l);
    return (
      '<form data-hold data-num="' +
      l.num +
      '" class="panel reveal" aria-label="Handover for slip L-' +
      l.num +
      '"><p class="paneltitle">Where is ' +
      esc(l.asset) +
      " now, and when is it coming back?</p><div class=\"form\">" +
      select(
        "Held by",
        "who",
        people.map((p) => [p, p]),
        h.who,
        false,
      ) +
      select(
        "Expected back",
        "back",
        returnTimes.map((d) => [d, d]),
        h.back,
        false,
      ) +
      '<label class="full"><span>Anything else the next shift should know <em class="optional">Optional</em></span><input name="text" maxlength="120" value="' +
      esc(h.text) +
      '" placeholder="Dropping it at the counter before her 9:30 class" /></label></div><div class="buttons"><button type="submit" class="primary">Save handover</button>' +
      btn("Cancel", "cancelnote") +
      (h.who || h.back || h.text
        ? btn("Clear handover", "clearnote", String(l.num), "ghost")
        : "") +
      "</div></form>"
    );
  }
  // Closing a slip needs the unit in hand to match it. Two adapters share
  // bin C4, so the asset tag is the only safe way to tell them apart.
  function checkPanel(l) {
    const a = getAsset(l.asset);
    const twins = assets.filter((x) => x.id !== a.id && x.type === a.type);
    if (s.mismatch)
      return (
        '<div class="panel warn reveal" role="group" aria-label="Unit does not match slip L-' +
        l.num +
        '"><p class="paneltitle">' +
        icon("warning-circle") +
        "Keep slip L-" +
        l.num +
        " open</p><p>This slip is for <b>" +
        esc(a.id + " · " + a.model) +
        "</b>. Find the tag on the unit you were handed:</p><ul>" +
        twins
          .map((t) => {
            const o = out(t.id);
            const where = t.repair
              ? "is in repair, so it cannot be on this loan. Check where it came from."
              : o
                ? "is out on slip L-" +
                  o.num +
                  " (" +
                  o.who +
                  "). Record the return on that slip instead."
                : "is not out on any slip and belongs in bin " +
                  t.bin +
                  ". Put it back and ask where " +
                  a.id +
                  " is.";
            return (
              "<li><b>" + esc(t.id + " · " + t.model) + "</b> " + esc(where) + "</li>"
            );
          })
          .join("") +
        "<li><b>Any other tag</b> Hold the unit at the desk and add a handover note on this slip.</li></ul><div class=\"buttons\">" +
        btn("Check again", "return", String(l.num), "primary") +
        btn("Cancel", "cancelcheck") +
        "</div></div>"
      );
    const binmates = twins.filter((t) => t.bin === a.bin);
    return (
      '<div class="panel reveal" role="group" aria-label="Check the unit for slip L-' +
      l.num +
      '"><p class="paneltitle">Check the tag before closing L-' +
      l.num +
      '</p><div class="unitcard"><b>' +
      esc(a.id) +
      "</b><span>" +
      esc(a.model + " · " + a.type) +
      "</span><small>" +
      esc("Home bin " + a.bin) +
      "</small></div>" +
      (binmates.length
        ? '<p class="caution">' +
          icon("warning-circle") +
          esc(
            binmates.map((t) => t.id + " (" + t.model + ")").join(", ") +
              " is the same type and shares bin " +
              a.bin +
              ". Only the tag tells them apart.",
          ) +
          "</p>"
        : "") +
      '<div class="buttons">' +
      btn(
        "Tag reads " + a.id + ", close slip",
        "confirmreturn",
        String(l.num),
        "primary",
        "check-circle",
      ) +
      btn("Different tag", "mismatch", String(l.num)) +
      btn("Cancel", "cancelcheck", "", "ghost") +
      "</div></div>"
    );
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const open = s.loans
      .filter((l) => !l.back)
      .sort((a, b) => lateBy(b) - lateBy(a));
    if (open.length)
      html +=
        '<div class="panel summary"><p class="paneltitle">' +
        icon("book-open-text") +
        "Still out on the loan register</p><ul>" +
        open
          .map((l) => {
            const a = getAsset(l.asset);
            return (
              "<li><b>" +
              esc("L-" + l.num + " · " + l.asset) +
              "</b> " +
              esc(
                a.model +
                  " · " +
                  (holdLine(l) || "issued to " + l.who + ", due " + l.due),
              ) +
              (overdue(l) ? " " + badge("Overdue", "late") : "") +
              "</li>"
            );
          })
          .join("") +
        "</ul>" +
        btn("Open loan register", "tab", "Loan register", "", "arrow-right") +
        "</div>";
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([shifts[n.phase].time, "Counter handover", n.text]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note class="panel"><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required placeholder="Anything that is not tied to a single slip"></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  // Motion. Every paint rebuilds the page, so animations are one-shot hints
  // (fx) naming only what just changed: a new tab, a new desk time, the slip
  // that was issued, the pip that turned green. Nothing replays on its own.
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let fx = {};
  let lastCount = -1;
  let lastNotice = "";
  let leaving = false;
  const replay = (el, cls) => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };
  // The nav and the shift timeline are built once, so the active pill and
  // the timeline fill can glide between positions instead of being redrawn.
  const nav = q("[data-nav]");
  nav.innerHTML =
    '<span class="navpill" aria-hidden="true"></span>' +
    pages
      .map(
        ([n, ico]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '">' +
          icon(ico) +
          "<span>" +
          n +
          "</span>" +
          (n === "Loan register"
            ? '<span class="count" data-count hidden></span>'
            : "") +
          "</button>",
      )
      .join("");
  const pill = nav.querySelector(".navpill");
  const placePill = () => {
    const b = nav.querySelector('button[aria-pressed="true"]');
    if (!b) return;
    pill.style.width = b.offsetWidth + "px";
    pill.style.height = b.offsetHeight + "px";
    pill.style.transform =
      "translate(" + b.offsetLeft + "px, " + b.offsetTop + "px)";
  };
  if ("ResizeObserver" in window) new ResizeObserver(placePill).observe(nav);
  const stepper = q("[data-stepper]");
  stepper.innerHTML = shifts
    .map(
      (sh) =>
        '<li><span class="dot"></span><small>' +
        esc(sh.time.replace(/^(\w{3})\w*\s·\s/, "$1 ")) +
        "</small></li>",
    )
    .join("");
  function applyFx() {
    const page = q("[data-page]");
    if (fx.page)
      [...page.children].forEach((el, i) => {
        el.style.setProperty("--i", Math.min(i, 6));
        el.classList.add("enter");
      });
    if (fx.shift) {
      replay(q(".clock"), "tick");
      replay(q(".shift"), "tick");
      page.querySelectorAll(".tag.late").forEach((t) => t.classList.add("alert"));
    }
    if (fx.slip)
      page.querySelector('[data-slip="' + fx.slip + '"]')?.classList.add("fresh");
    if (fx.handover)
      page
        .querySelector('[data-slip="' + fx.handover + '"] .handover')
        ?.classList.add("fresh");
    if (fx.pip)
      page.querySelector('[data-pip="' + fx.pip + '"]')?.classList.add("pop");
    fx = {};
  }
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    stepper.style.setProperty("--p", s.phase / (shifts.length - 1));
    stepper.querySelectorAll("li").forEach((li, i) => {
      li.className = i < s.phase ? "done" : i === s.phase ? "now" : "";
      if (i === s.phase) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.innerHTML = phase.next
      ? esc(phase.next) + icon("arrow-right")
      : "";
    const open = s.loans.filter((l) => !l.back);
    const late = open.some(overdue);
    for (const b of nav.querySelectorAll("button")) {
      const on = b.dataset.val === s.tab;
      b.setAttribute("aria-pressed", String(on));
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    }
    const count = nav.querySelector("[data-count]");
    count.hidden = !open.length;
    count.className = "count" + (late ? " late" : "");
    count.innerHTML =
      open.length +
      '<span class="sr"> slips outstanding' +
      (late ? ", some overdue" : "") +
      "</span>";
    if (lastCount >= 0 && open.length !== lastCount) replay(count, "pop");
    lastCount = open.length;
    placePill();
    q("[data-page]").innerHTML = screens[s.tab]();
    const status = q("[data-status]");
    status.textContent = s.notice;
    if (lastNotice && s.notice !== lastNotice) replay(status, "toast");
    lastNotice = s.notice;
    applyFx();
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  const closePanels = () => {
    s.noting = 0;
    s.checking = 0;
    s.mismatch = false;
  };
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        s = original();
        fx.page = true;
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        closePanels();
        s.notice = "Desk time is now " + shifts[s.phase].time + ".";
        fx.shift = true;
        break;
      case "tab":
        if (s.tab !== v) fx.page = true;
        s.tab = v;
        s.editing = false;
        closePanels();
        break;
      case "close":
        s.selected = "";
        fx.page = true;
        break;
      case "request":
        s.selected = v;
        fx.page = true;
        break;
      case "filter":
        if (filters.includes(v) && s.filter !== v) fx.page = true;
        if (filters.includes(v)) s.filter = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        if (s.onlyOpen !== (v === "0")) fx.page = true;
        s.onlyOpen = v === "0";
        break;
      case "note":
        closePanels();
        s.noting = Number(v);
        break;
      case "cancelnote":
        s.noting = 0;
        break;
      case "clearnote": {
        const l = getLoan(v);
        if (!l || l.back) return;
        delete l.hold;
        delete l.note;
        s.noting = 0;
        s.notice = "Handover cleared on slip L-" + l.num + ".";
        break;
      }
      case "return":
        closePanels();
        s.checking = Number(v);
        break;
      case "mismatch":
        s.mismatch = true;
        s.notice = "Slip L-" + v + " is still open.";
        break;
      case "cancelcheck":
        s.checking = 0;
        s.mismatch = false;
        break;
      case "confirmreturn": {
        const l = getLoan(v);
        if (!l || l.back || s.checking !== l.num || leaving) return;
        const a = getAsset(l.asset);
        const r = getReq(l.req);
        const close = () => {
          leaving = false;
          if (l.back) return;
          l.back = true;
          l.backAt = shifts[s.phase].time;
          closePanels();
          fx.slip = l.num;
          fx.pip = r.id + "-" + r.items.indexOf(a.type);
          commit(
            l.asset +
              " (" +
              a.model +
              ") checked and returned to bin " +
              a.bin +
              ". Slip L-" +
              l.num +
              " closed.",
          );
        };
        // The closed slip slides out before the register redraws, so the
        // eye follows it leaving the kit.
        const row = q('[data-slip="' + l.num + '"]');
        if (!row || reduceMotion.matches) return close();
        leaving = true;
        row.classList.add("leaving");
        row.nextElementSibling?.classList.add("leaving");
        setTimeout(close, 320);
        return;
      }
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (!e.target.matches('[data-issue] select[name="req"]')) return;
    // Narrow the unit list to the request's approved equipment and fill in
    // the return time the request already states.
    const f = e.target.form;
    const r = getReq(e.target.value);
    const unit = f.elements.asset;
    const keep = unit.value;
    unit.innerHTML =
      '<option value="">Select…</option>' + opts(unitChoices(e.target.value));
    unit.value = keep;
    const hint = f.querySelector("[data-req-hint]");
    hint.hidden = !r;
    if (r) {
      f.elements.due.value = r.due;
      hint.textContent =
        r.club + " is approved for " + r.items.join(", ") + ". Return by " + r.due + ".";
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-hold]")) {
      const l = getLoan(f.dataset.num);
      if (!l || l.back) return;
      const who = String(form.get("who") || "");
      const back = String(form.get("back") || "");
      const text = String(form.get("text") || "").trim().slice(0, 120);
      delete l.note;
      if (who || back || text)
        l.hold = {
          who: people.includes(who) ? who : "",
          back: returnTimes.includes(back) ? back : "",
          text,
        };
      else delete l.hold;
      s.noting = 0;
      fx.handover = l.num;
      commit(
        l.hold
          ? "Handover saved on slip L-" + l.num + "."
          : "Handover cleared on slip L-" + l.num + ".",
      );
      return;
    }
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const fail = (msg) => {
      const box = f.querySelector("[data-form-error]");
      box.hidden = false;
      box.textContent = msg;
    };
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || !people.includes(who) || !returnTimes.includes(due))
      return fail("Fill in every field before saving the slip.");
    if (unit.repair || out(asset))
      return fail(asset + " is not on the shelf. Choose another unit.");
    if (!r.items.includes(unit.type))
      return fail(
        "This equipment type is outside the approved request. Choose an approved unit.",
      );
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    )
      return fail(
        "The approved quantity of this equipment type is already on loan.",
      );
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({ num, req, asset, who, due, back: false });
    s.editing = false;
    fx.slip = num;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 1 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          returnTimes.includes(l.due),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      filter: filters.includes(d.filter) ? d.filter : "All items",
      loans: d.loans.map((l) => ({
        ...l,
        hold: l.hold ? { ...l.hold } : undefined,
      })),
      notes: d.notes.map((n) => ({ ...n })),
    };
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
  // First load: the page content arrives in a short stagger. The nav pill
  // starts gliding only after it has been placed once.
  fx.page = true;
  paint();
  requestAnimationFrame(() => pill.classList.add("ready"));
})();
