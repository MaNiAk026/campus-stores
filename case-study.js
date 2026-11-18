(() => {
  document.documentElement.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sections rise into place once as they enter the viewport.
  const reveals = document.querySelectorAll(".reveal");
  // Cards inside each section follow one after another, capped at 400ms.
  reveals.forEach((section) =>
    section
      .querySelectorAll(".card, .faq details")
      .forEach((card, i) => card.style.setProperty("--i", Math.min(i, 5))),
  );
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("shown");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add("shown"));

  // Tagline: each word moves from muted to full colour as it crosses a
  // trigger line, in reading order. Scroll work is throttled through rAF.
  const text = document.querySelector("[data-words]");
  if (text) {
    const words = text.textContent.trim().split(/\s+/);
    text.innerHTML = words
      .map((w) => '<span class="word">' + w + "</span>")
      .join(" ");
    const spans = [...text.querySelectorAll(".word")];
    if (reduced) spans.forEach((s) => s.classList.add("on"));
    else {
      let queued = false;
      const update = () => {
        queued = false;
        const trigger = innerHeight * 0.7;
        const box = text.getBoundingClientRect();
        // Progress runs from 0 when the block reaches the trigger line to 1
        // when its bottom passes the middle of the screen.
        const total = box.height + trigger - innerHeight * 0.4;
        const progress = Math.min(1, Math.max(0, (trigger - box.top) / total));
        const lit = Math.round(progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle("on", i < lit));
      };
      addEventListener(
        "scroll",
        () => {
          if (!queued) {
            queued = true;
            requestAnimationFrame(update);
          }
        },
        { passive: true },
      );
      addEventListener("resize", update);
      update();
    }
  }

  // Hero demo: loops the Saturday return (overdue, Record return, tag
  // check, closed). It pauses off screen, has a pause control for
  // WCAG 2.2.2, and does not autoplay when reduced motion is requested.
  const demo = document.querySelector("[data-demo]");
  if (demo) {
    const toggle = demo.querySelector("[data-demo-toggle]");
    const hold = [2800, 1100, 2800, 3000];
    let state = 0;
    let timer = 0;
    let playing = !reduced;
    let onScreen = true;
    const schedule = () => {
      clearTimeout(timer);
      if (!playing || !onScreen) return;
      timer = setTimeout(() => {
        state = (state + 1) % hold.length;
        demo.dataset.state = String(state);
        schedule();
      }, hold[state]);
    };
    const label = () => {
      toggle.textContent = playing ? "Pause demo" : "Play demo";
    };
    toggle.addEventListener("click", () => {
      playing = !playing;
      label();
      schedule();
    });
    if ("IntersectionObserver" in window)
      new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        schedule();
      }).observe(demo);
    label();
    schedule();
  }

  // Mobile menu: full height panel, links arrive one after another.
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    menu.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open)
      menu.querySelectorAll("a").forEach((a, i) => {
        a.style.animationDelay = Math.min(i * 60, 400) + "ms";
      });
  };
  toggle.addEventListener("click", () =>
    setMenu(toggle.getAttribute("aria-expanded") !== "true"),
  );
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      setMenu(false);
      toggle.focus();
    }
  });
})();
