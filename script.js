(() => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile menu
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("mobile-menu");
  const closeBtn = document.querySelector(".mobile-menu-close");
  const panel = document.querySelector(".mobile-menu-panel");
  if (!(toggle instanceof HTMLButtonElement)) return;
  if (!(menu instanceof HTMLDivElement)) return;

  let lastActive = null;
  let hideTimer = null;

  const isOpen = () => menu.classList.contains("is-open");

  const setOpen = (open) => {
    window.clearTimeout(hideTimer);

    if (open) {
      lastActive = document.activeElement;
      menu.hidden = false;
      // Ensure the transition runs after un-hiding
      requestAnimationFrame(() => menu.classList.add("is-open"));
      document.body.classList.add("menu-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");

      // Move focus to the panel close button for accessibility
      if (closeBtn instanceof HTMLButtonElement) closeBtn.focus();
      return;
    }

    menu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");

    // Allow slide-out animation to finish before hiding
    hideTimer = window.setTimeout(() => {
      menu.hidden = true;
    }, 260);

    // Restore focus
    if (lastActive instanceof HTMLElement) lastActive.focus();
  };

  toggle.addEventListener("click", () => setOpen(!isOpen()));

  if (closeBtn instanceof HTMLButtonElement) {
    closeBtn.addEventListener("click", () => setOpen(false));
  }

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) setOpen(false);
  });

  // Close after clicking a menu link
  menu.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName.toLowerCase() === "a") setOpen(false);
  });

  // Close if clicking outside the panel (overlay area)
  menu.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (panel && panel.contains(target)) return;
    setOpen(false);
  });

  // Close if resizing to desktop nav
  const mq = window.matchMedia("(min-width: 761px)");
  mq.addEventListener?.("change", (ev) => {
    if (ev.matches && isOpen()) setOpen(false);
  });
})();
