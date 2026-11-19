(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Header border once the page scrolls
  const header = document.querySelector(".site-header");
  const onScrollHeader = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  // Highlight the nav link for the section in view
  const navLinks = Array.from(document.querySelectorAll(".nav a[href^='#']"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) =>
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => navObserver.observe(s));
  }

  // Links like #fieldvision open that project's row
  const openProject = (hash) => {
    const row = hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (!row || !row.classList.contains("project")) return;
    const btn = row.querySelector(".project-toggle");
    if (btn && btn.getAttribute("aria-expanded") !== "true") btn.click();
  };
  document.addEventListener("click", (e) => {
    const a = e.target instanceof Element ? e.target.closest("a[href^='#']") : null;
    if (a) openProject(a.getAttribute("href"));
  });

  // Expandable project rows
  document.querySelectorAll(".project-toggle").forEach((btn) => {
    const body = document.getElementById(btn.getAttribute("aria-controls"));
    if (!body) return;
    body.inert = true;
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      body.classList.toggle("is-open", open);
      body.inert = !open;
    });
  });

  // Experience rail fills as you scroll through it
  const timeline = document.getElementById("timeline");
  if (timeline) {
    let ticking = false;
    const updateRail = () => {
      ticking = false;
      const rect = timeline.getBoundingClientRect();
      const anchor = window.innerHeight * 0.6;
      const p = (anchor - rect.top) / rect.height;
      timeline.style.setProperty("--progress", Math.max(0, Math.min(1, p)).toFixed(3));
    };
    if (reduceMotion) {
      timeline.style.setProperty("--progress", "1");
    } else {
      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateRail);
          }
        },
        { passive: true }
      );
      window.addEventListener("resize", updateRail);
      updateRail();
    }
  }

  // Endeavours slideshow: native scroll-snap, with buttons, counter and arrow keys
  const track = document.getElementById("slides");
  if (track) {
    const slides = Array.from(track.querySelectorAll(".slide"));
    const prev = document.getElementById("slide-prev");
    const next = document.getElementById("slide-next");
    const count = document.getElementById("slide-count");
    let current = 0;
    const setCurrent = (i) => {
      current = i;
      if (count) count.textContent = i + 1 + " of " + slides.length;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    };
    const goTo = (i) => {
      const target = slides[Math.max(0, Math.min(slides.length - 1, i))];
      track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
    };
    const onTrackScroll = () => {
      const left = track.scrollLeft;
      let best = 0;
      slides.forEach((sl, i) => {
        if (Math.abs(sl.offsetLeft - track.offsetLeft - left) <
          Math.abs(slides[best].offsetLeft - track.offsetLeft - left)) best = i;
      });
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = slides.length - 1;
      setCurrent(best);
    };
    track.addEventListener("scroll", () => requestAnimationFrame(onTrackScroll), { passive: true });
    if (prev) prev.addEventListener("click", () => goTo(current - 1));
    if (next) next.addEventListener("click", () => goTo(current + 1));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
    });
    setCurrent(0);
  }

  openProject(window.location.hash);

  // Hero: a map of my projects, from the data they start with to what they ship as
  const flow = document.getElementById("flow");
  const svg = document.getElementById("flow-svg");
  const chipsEl = document.getElementById("flow-chips");
  const noteEl = document.getElementById("flow-note");
  if (!flow || !svg || !chipsEl || !noteEl) return;

  const COLUMNS = [
    { label: "Data in", nodes: [["sat", "Satellite images"], ["video", "Video"], ["logs", "System logs"], ["market", "Market data"], ["web", "APIs & scraping"]] },
    { label: "Modeling", nodes: [["sql", "Data modeling & SQL"], ["ml", "Classical ML"], ["bayes", "Bayesian inference"], ["dl", "Deep learning"], ["llm", "Retrieval & LLMs"]] },
    { label: "Shipped as", nodes: [["dash", "Dashboards"], ["app", "Web apps"], ["report", "Reports & answers"]] },
  ];
  const PROJECTS = [
    { id: "fieldvision", name: "FieldVision", from: ["sat"], via: ["ml", "bayes", "llm"], to: ["report", "app"],
      note: "Calls silage vs grain corn field by field from satellite images. 1st place at Hack the Harvest 2026.", href: "#fieldvision" },
    { id: "explainlog", name: "ExplainLOG", from: ["logs"], via: ["dl", "llm"], to: ["dash"],
      note: "Sorts 11.2M log lines into 8 failure types and explains each one in plain English.", href: "#explainlog" },
    { id: "pairs", name: "Pairs Trading", from: ["market"], via: ["dl", "ml"], to: ["report"],
      note: "Finds S&P 500 stocks that move together with autoencoder embeddings and K-Means, then trades the gaps. 0.93 ROC-AUC.", href: "#pairs" },
    { id: "via", name: "VIA Lab", from: ["video"], via: ["ml", "dl"], to: ["report"],
      note: "Exploring how people perceive short videos, using multimodal time-series models.", href: "#research" },
    { id: "streamrag", name: "streaMRAG", from: ["video"], via: ["llm"], to: ["report"],
      note: "Answers questions about video streams from a compact, grounded memory.", href: "#research" },
    { id: "devar", name: "UC Davis DEVAR", from: ["web"], via: ["sql"], to: ["app", "dash"],
      note: "A workflow platform for 100+ users, built on 20 years of migrated data.", href: "#experience" },
    { id: "spotify", name: "Spotify Automation", from: ["web"], via: ["sql"], to: ["app"],
      note: "Saves Discover Weekly every week, with a job queue, retries and a run history.", href: "#spotify" },
    { id: "gunrock", name: "Gunrock's Grid", from: ["web"], via: ["sql"], to: ["dash"],
      note: "Turns scraped Davis rental listings into a clean dataset and a dashboard.", href: "#gunrock" },
  ];
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };
  const edgesOf = (p) => {
    const out = [];
    p.from.forEach((a) => p.via.forEach((b) => out.push([a, b, 0])));
    p.via.forEach((a) => p.to.forEach((b) => out.push([a, b, 1])));
    return out;
  };
  const nodesOf = (p) => new Set([...p.from, ...p.via, ...p.to]);

  // chips
  const chips = PROJECTS.map((p, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = p.name;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => { userPicked = true; select(i); });
    chipsEl.appendChild(b);
    return b;
  });

  let nodeEls = {};
  let edgeEls = {};
  let packets = [];
  let active = 0;
  let hoverNode = null;
  let userPicked = false;
  let paused = false;
  let narrow = null;

  const layout = () => {
    const w = flow.clientWidth - 24;
    const isNarrow = w < 520;
    if (isNarrow === narrow) return;
    narrow = isNarrow;
    flow.classList.toggle("is-narrow", narrow);
    while (svg.lastChild && svg.lastChild.nodeName !== "title") svg.removeChild(svg.lastChild);
    nodeEls = {};
    edgeEls = {};
    const pos = {};
    let W;
    let H;
    const labels = [];

    if (!narrow) {
      W = 600;
      const nw = 168, nh = 38, top = 34, colX = [0, 216, 432];
      H = top + 5 * nh + 4 * 18;
      COLUMNS.forEach((col, ci) => {
        labels.push([colX[ci] + 2, 14, col.label]);
        const step = (H - top) / col.nodes.length;
        col.nodes.forEach(([id], i) => {
          const y = top + step * (i + 0.5) - nh / 2;
          pos[id] = { x: colX[ci], y, w: nw, h: nh };
        });
      });
    } else {
      W = 320;
      const nw = 152, nh = 34, gx = 16, gy = 10;
      let y = 0;
      COLUMNS.forEach((col) => {
        labels.push([2, y + 13, col.label]);
        y += 24;
        col.nodes.forEach(([id], i) => {
          const r = Math.floor(i / 2), c = i % 2;
          pos[id] = { x: c * (nw + gx), y: y + r * (nh + gy), w: nw, h: nh };
        });
        y += Math.ceil(col.nodes.length / 2) * (nh + gy) + 26;
      });
      H = y - 26;
    }
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    labels.forEach(([x, y, t]) => {
      const tx = el("text", { x, y, class: "f-col-label" }, svg);
      tx.textContent = t;
    });

    // every edge any project uses, drawn faintly as the background network
    const gEdges = el("g", {}, svg);
    const seen = new Set();
    PROJECTS.forEach((p) => edgesOf(p).forEach(([a, b]) => {
      const key = a + ">" + b;
      if (seen.has(key)) return;
      seen.add(key);
      const s = pos[a], t = pos[b];
      let d;
      if (!narrow) {
        const x1 = s.x + s.w, y1 = s.y + s.h / 2, x2 = t.x, y2 = t.y + t.h / 2, mx = (x1 + x2) / 2;
        d = "M" + x1 + " " + y1 + " C" + mx + " " + y1 + " " + mx + " " + y2 + " " + x2 + " " + y2;
      } else {
        const x1 = s.x + s.w / 2, y1 = s.y + s.h, x2 = t.x + t.w / 2, y2 = t.y, my = (y1 + y2) / 2;
        d = "M" + x1 + " " + y1 + " C" + x1 + " " + my + " " + x2 + " " + my + " " + x2 + " " + y2;
      }
      edgeEls[key] = el("path", { d, class: "f-edge" }, gEdges);
    }));

    const gPackets = el("g", {}, svg);
    packets = [];
    for (let i = 0; i < 20; i++) packets.push(el("circle", { r: 3.5, class: "f-packet", opacity: 0 }, gPackets));

    COLUMNS.forEach((col) => col.nodes.forEach(([id, label]) => {
      const p = pos[id];
      const g = el("g", { class: "f-node", tabindex: "0", role: "button", "aria-label": label }, svg);
      el("rect", { x: p.x, y: p.y, width: p.w, height: p.h, rx: p.h / 2 }, g);
      const t = el("text", { x: p.x + 16, y: p.y + p.h / 2 + 5 }, g);
      t.textContent = label;
      const enter = () => { hoverNode = id; paint(); };
      const leave = () => { hoverNode = null; paint(); };
      g.addEventListener("mouseenter", enter);
      g.addEventListener("mouseleave", leave);
      g.addEventListener("focus", enter);
      g.addEventListener("blur", leave);
      g.addEventListener("click", () => {
        const idx = PROJECTS.findIndex((pr, k) => k > active && nodesOf(pr).has(id));
        const first = PROJECTS.findIndex((pr) => nodesOf(pr).has(id));
        userPicked = true;
        select(idx >= 0 ? idx : first);
      });
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); g.dispatchEvent(new Event("click")); }
      });
      nodeEls[id] = g;
    }));
    paint();
  };

  const paint = () => {
    const shown = hoverNode
      ? PROJECTS.filter((p) => nodesOf(p).has(hoverNode))
      : [PROJECTS[active]];
    const onNodes = new Set();
    const onEdges = new Set();
    shown.forEach((p) => {
      nodesOf(p).forEach((n) => onNodes.add(n));
      edgesOf(p).forEach(([a, b]) => onEdges.add(a + ">" + b));
    });
    if (hoverNode) onNodes.add(hoverNode);
    Object.entries(nodeEls).forEach(([id, g]) => {
      g.classList.toggle("is-on", onNodes.has(id));
      g.classList.toggle("is-dim", !onNodes.has(id));
    });
    Object.entries(edgeEls).forEach(([k, path]) => path.classList.toggle("is-on", onEdges.has(k)));
    chips.forEach((c, i) => {
      c.setAttribute("aria-pressed", String(!hoverNode && i === active));
      c.classList.toggle("is-related", !!hoverNode && shown.includes(PROJECTS[i]));
    });
    if (hoverNode) {
      const label = COLUMNS.flatMap((c) => c.nodes).find(([id]) => id === hoverNode)[1];
      noteEl.innerHTML = "";
      const b = document.createElement("b");
      b.textContent = label + ": ";
      noteEl.append(b, "used in " + shown.map((p) => p.name).join(", ") + ".");
    } else {
      const p = PROJECTS[active];
      noteEl.innerHTML = "";
      const b = document.createElement("b");
      b.textContent = p.name + ". ";
      const a = document.createElement("a");
      a.href = p.href;
      a.textContent = "Read more";
      noteEl.append(b, p.note + " ", a);
    }
  };

  const select = (i) => {
    active = (i + PROJECTS.length) % PROJECTS.length;
    hoverNode = null;
    paint();
  };

  // packets travel along the active project's edges: input to model, then model to output
  let visible = true;
  const tick = (now) => {
    const list = (hoverNode ? PROJECTS.filter((p) => nodesOf(p).has(hoverNode)) : [PROJECTS[active]])
      .flatMap(edgesOf);
    const uniq = [];
    const keys = new Set();
    list.forEach((e) => { const k = e[0] + ">" + e[1]; if (!keys.has(k)) { keys.add(k); uniq.push(e); } });
    packets.forEach((dot, i) => {
      const e = uniq[i];
      if (!e) { dot.setAttribute("opacity", 0); return; }
      const path = edgeEls[e[0] + ">" + e[1]];
      const len = path.getTotalLength();
      const t = ((now / 1500 + (e[2] ? 0.5 : 0)) % 1 + 1) % 1;
      const pt = path.getPointAtLength(t * len);
      dot.setAttribute("cx", pt.x);
      dot.setAttribute("cy", pt.y);
      dot.setAttribute("opacity", Math.min(1, Math.sin(t * Math.PI) * 2.2));
    });
    if (visible) requestAnimationFrame(tick);
  };

  layout();
  select(0);
  window.addEventListener("resize", layout);

  if (!reduceMotion) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        const was = visible;
        visible = entries[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(tick);
      }).observe(flow);
    }
    requestAnimationFrame(tick);

    // walk through projects on its own until someone picks one
    const fig = flow.closest(".hero-viz");
    fig.addEventListener("mouseenter", () => { paused = true; });
    fig.addEventListener("mouseleave", () => { paused = false; });
    fig.addEventListener("focusin", () => { paused = true; });
    fig.addEventListener("focusout", () => { paused = false; });
    setInterval(() => {
      if (!userPicked && !paused && visible && !document.hidden) select(active + 1);
    }, 4200);
  }
})();
