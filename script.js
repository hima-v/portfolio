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

  // FieldVision bars grow when they come into view
  const bars = document.getElementById("state-bars");
  if (bars) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      bars.classList.add("is-visible");
    } else {
      const barObserver = new IntersectionObserver(
        (entries, obs) => {
          if (entries[0].isIntersecting) {
            bars.classList.add("is-visible");
            obs.disconnect();
          }
        },
        { threshold: 0.35 }
      );
      barObserver.observe(bars);
    }
  }

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

  // Hero: scattered points settle into clusters, plus a few that stay noise
  const canvas = document.getElementById("cluster-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const N = 520;
  const NOISE = 46;
  const K = 8;
  const ACCENT_CLUSTER = 5;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let points = [];
  let centers = [];
  let pointer = { x: -9999, y: -9999, active: false };
  let running = false;
  let visible = true;
  let startTime = 0;

  // Seeded random so the layout is the same on every visit
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const gauss = () => {
    const u = Math.max(rand(), 1e-9);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const makeCenters = () => {
    // hand-placed so the groups read clearly and never overlap
    const spots = [
      [0.2, 0.24], [0.5, 0.17], [0.8, 0.26], [0.3, 0.55],
      [0.67, 0.5], [0.86, 0.72], [0.16, 0.8], [0.5, 0.82],
    ];
    const sizes = [1.1, 0.8, 1.0, 1.25, 0.9, 1.15, 0.7, 1.0];
    centers = spots.map(([x, y], i) => ({ x, y, s: sizes[i] }));
  };

  const build = () => {
    seed = 7;
    makeCenters();
    const weights = centers.map((c) => c.s);
    const total = weights.reduce((a, b) => a + b, 0);
    points = [];
    for (let i = 0; i < N; i++) {
      const isNoise = i < NOISE;
      let k = -1;
      let tx;
      let ty;
      if (isNoise) {
        tx = 0.05 + rand() * 0.9;
        ty = 0.05 + rand() * 0.9;
      } else {
        let r = rand() * total;
        k = 0;
        while (r > weights[k]) {
          r -= weights[k];
          k++;
        }
        const spread = 0.045 * centers[k].s;
        tx = centers[k].x + gauss() * spread;
        ty = centers[k].y + gauss() * spread * 0.9;
      }
      points.push({
        k,
        tx,
        ty,
        x: rand(),
        y: rand(),
        vx: 0,
        vy: 0,
        r: isNoise ? 1.6 : 2 + rand() * 1.6,
        delay: rand() * 700,
        phase: rand() * Math.PI * 2,
      });
    }
  };

  const scatter = () => {
    points.forEach((p) => {
      p.x = Math.random();
      p.y = Math.random();
      p.vx = 0;
      p.vy = 0;
      p.delay = Math.random() * 700;
    });
    startTime = performance.now();
    start();
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  };

  const colorFor = (p) => {
    if (p.k === -1) return "rgba(80, 86, 95, 0.32)";
    if (p.k === ACCENT_CLUSTER) return "#ff5aa8";
    return "rgba(21, 23, 28, " + (0.55 + (p.k % 3) * 0.15) + ")";
  };

  const draw = (now) => {
    ctx.clearRect(0, 0, W, H);
    const settled = Math.min(1, (now - startTime) / 2600);

    // faint hulls once clusters have formed
    if (settled > 0.6) {
      const a = (settled - 0.6) / 0.4;
      centers.forEach((c, i) => {
        ctx.beginPath();
        ctx.arc(c.x * W, c.y * H, Math.min(W, H) * 0.115 * c.s, 0, Math.PI * 2);
        ctx.strokeStyle =
          i === ACCENT_CLUSTER ? "rgba(255, 90, 168," + 0.55 * a + ")" : "rgba(21, 23, 28," + 0.1 * a + ")";
        ctx.setLineDash([3, 5]);
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
      ctx.fillStyle = colorFor(p);
      ctx.fill();
    }
  };

  const step = (now) => {
    if (!running) return;
    const t = now - startTime;
    let energy = 0;
    const px = pointer.x / W;
    const py = pointer.y / H;
    const reach = 70;

    for (const p of points) {
      if (t < p.delay) continue;
      // spring toward target, with a slow idle drift
      const drift = 0.004;
      const gx = p.tx + Math.cos(now / 1400 + p.phase) * drift;
      const gy = p.ty + Math.sin(now / 1700 + p.phase) * drift;
      p.vx += (gx - p.x) * 0.018;
      p.vy += (gy - p.y) * 0.018;

      if (pointer.active) {
        const dx = (p.x - px) * W;
        const dy = (p.y - py) * H;
        const d2 = dx * dx + dy * dy;
        if (d2 < reach * reach && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / reach) * 0.9;
          p.vx += ((dx / d) * f) / W;
          p.vy += ((dy / d) * f) / H;
        }
      }
      p.vx *= 0.86;
      p.vy *= 0.86;
      p.x += p.vx;
      p.y += p.vy;
      energy += Math.abs(p.vx) + Math.abs(p.vy);
    }

    draw(now);
    if (visible) requestAnimationFrame(step);
    else running = false;
  };

  const start = () => {
    if (reduceMotion) return;
    if (running) return;
    running = true;
    requestAnimationFrame(step);
  };

  build();

  if (reduceMotion) {
    points.forEach((p) => {
      p.x = p.tx;
      p.y = p.ty;
    });
    startTime = -1e9;
  } else {
    startTime = performance.now();
  }

  resize();
  window.addEventListener("resize", resize);

  if (!reduceMotion) {
    canvas.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    });
    canvas.addEventListener("pointerleave", () => {
      pointer.active = false;
    });
    canvas.addEventListener("click", scatter);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(canvas);
    }
    start();
  }

  const again = document.getElementById("rescatter");
  if (again) {
    if (reduceMotion) again.hidden = true;
    else again.addEventListener("click", scatter);
  }
})();
