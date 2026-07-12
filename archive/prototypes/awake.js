/* Campaign Factory v3 — single-page ladder runtime.
   Rungs activate on scroll (IntersectionObserver) or keyboard (←/→, 1–6).
   Activation is one-way per rung: animations play once. ?all reveals everything. */

(function () {
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const rungs = $$(".rung");
  const rail = $$(".rail a");
  const ALL = new URLSearchParams(location.search).has("all");
  let cur = -1;

  function setCurrent(i) {
    if (i < 0 || i >= rungs.length) return;
    cur = i;
    rungs.forEach((r, j) => {
      r.classList.toggle("active", j === i);
      if (j <= i) r.classList.add("on"); // reveal everything up to here
    });
    rail.forEach((a, j) => a.classList.toggle("cur", j === i));
  }

  if (ALL) {
    rungs.forEach((r) => r.classList.add("on"));
    setCurrent(rungs.length - 1);
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setCurrent(rungs.indexOf(e.target));
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    rungs.forEach((r) => io.observe(r));
  }

  function goto(i) {
    if (i < 0 || i >= rungs.length) return;
    rungs[i].scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrent(i);
  }

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); goto(cur + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goto(Math.max(cur - 1, 0)); }
    else if (/^[1-6]$/.test(e.key)) goto(+e.key - 1);
    else if (e.key === "[" && window.PROTO && window.PROTO.prev) location.href = window.PROTO.prev;
    else if (e.key === "]" && window.PROTO && window.PROTO.next) location.href = window.PROTO.next;
  });

  rail.forEach((a, i) => a.addEventListener("click", (e) => { e.preventDefault(); goto(i); }));
})();
