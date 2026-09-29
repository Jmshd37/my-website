(() => {
  const tr = (key, fallback, vars = {}) => window.siteI18n?.t(key, vars) || fallback;
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector("#nav-links");
  const navAnchors = [...document.querySelectorAll(".nav-links a[href^='#']")];
  const mobile = window.matchMedia("(max-width: 1000px)");
  const setMenu = open => {
    navLinks.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? tr("closeNavigation", "Close navigation") : tr("openNavigation", "Open navigation"));
    navLinks.hidden = mobile.matches && !open;
  };
  if (navToggle && navLinks) {
    document.documentElement.classList.add("has-navigation");
    navToggle.hidden = false;
    setMenu(false);
    navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
    navAnchors.forEach(link => link.addEventListener("click", () => {
      setMenu(false);
      // Move keyboard focus out of the collapsed mobile menu to the destination.
      const target = document.querySelector(link.getAttribute("href"));
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    }));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setMenu(false); navToggle.focus();
      }
    });
    document.addEventListener("click", event => {
      if (mobile.matches && !event.target.closest(".nav")) setMenu(false);
    });
    mobile.addEventListener("change", () => setMenu(false));
  }
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Content is always visible. Observers only enhance navigation.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach(link => {
          const active = link.hash === "#" + entry.target.id;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
  }
  const cards = [...document.querySelectorAll(".project-card")];
  const search = document.querySelector("#project-search");
  const filters = [...document.querySelectorAll("[data-filter]")];
  const counter = document.querySelector("#project-count");
  const empty = document.querySelector("#project-empty");
  let category = "All";
  const normalize = text => text.normalize("NFKC").toLocaleLowerCase().trim();
  const filterProjects = () => {
    const query = normalize(search.value);
    let count = 0;
    cards.forEach(card => {
      const matches = (category === "All" || card.dataset.category === category) && normalize(card.textContent).includes(query);
      card.hidden = !matches;
      if (matches) count++;
    });
    filters.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === category)));
    counter.textContent = tr("projectCount", "Showing " + count + " of " + cards.length + " projects", { count, total: cards.length });
    empty.hidden = count !== 0;
  };
  if (search) {
    document.querySelector(".project-controls").hidden = false;
    counter.hidden = false;
    search.addEventListener("input", filterProjects);
    filters.forEach(button => button.addEventListener("click", () => { category = button.dataset.filter; filterProjects(); }));
    document.querySelector("#reset-projects").addEventListener("click", () => {
      category = "All"; search.value = ""; filterProjects(); search.focus();
    });
    filterProjects();
  }
  document.querySelectorAll(".print-button").forEach(button => {
    button.hidden = false;
    button.addEventListener("click", () => window.print());
  });
  const copy = document.querySelector("#copy-email");
  if (copy) {
    copy.hidden = false;
    copy.addEventListener("click", async () => {
      const status = document.querySelector("#copy-status");
      try {
        await navigator.clipboard.writeText(copy.dataset.email);
        status.textContent = tr("emailCopied", "Email address copied.");
      } catch {
        status.textContent = tr("copyFallback", "Copy this address: " + copy.dataset.email, { email: copy.dataset.email });
      }
    });
  }
  window.addEventListener("site-language-change", () => {
    if (navToggle) {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-label", open ? tr("closeNavigation", "Close navigation") : tr("openNavigation", "Open navigation"));
    }
    if (search) filterProjects();
    const status = document.querySelector("#copy-status");
    if (status) status.textContent = "";
  });
})();

