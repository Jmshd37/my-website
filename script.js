(() => {
  const tr = (key, fallback, vars = {}) => window.siteI18n?.t(key, vars) || fallback;
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector("#nav-links");
  const navAnchors = [...document.querySelectorAll(".nav-links a[href^='#']")];
  const mobile = window.matchMedia("(max-width: 1024px)");
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

  // Horizontal two-row project rail controls.
  const projectGrid = document.querySelector("#project-grid");
  const projectPrev = document.querySelector('[data-project-scroll="prev"]');
  const projectNext = document.querySelector('[data-project-scroll="next"]');
  // Keep phone controls directly below the active card, not the tallest off-screen card.
  const phoneProjects = window.matchMedia("(max-width: 767px)");
  const fitProjectRailHeight = () => {
    if (!projectGrid) return;
    if (!phoneProjects.matches) {
      projectGrid.style.removeProperty("height");
      projectGrid.parentElement.style.removeProperty("--phone-project-height");
      return;
    }
    const visible = [...projectGrid.querySelectorAll(".project-card:not([hidden])")];
    if (!visible.length) {
      projectGrid.style.removeProperty("height");
      return;
    }
    const left = projectGrid.getBoundingClientRect().left;
    const active = visible.reduce((nearest, card) =>
      Math.abs(card.getBoundingClientRect().left - left) <
      Math.abs(nearest.getBoundingClientRect().left - left) ? card : nearest);
    const style = getComputedStyle(projectGrid);
    const height = Math.ceil(active.getBoundingClientRect().height +
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
    projectGrid.style.height = height + "px";
    projectGrid.parentElement.style.setProperty("--phone-project-height", height + "px");
  };
  const updateProjectScrollControls = () => {
    fitProjectRailHeight();
    if (!projectGrid || !projectPrev || !projectNext) return;
    const maxScroll = Math.max(0, projectGrid.scrollWidth - projectGrid.clientWidth);
    projectPrev.disabled = projectGrid.scrollLeft <= 3;
    projectNext.disabled = projectGrid.scrollLeft >= maxScroll - 3;
  };
  const moveProjectRail = direction => {
    if (!projectGrid) return;
    const distance = Math.max(300, projectGrid.clientWidth * .82);
    projectGrid.scrollBy({ left: distance * direction, behavior: "smooth" });
  };
  if (projectGrid && projectPrev && projectNext) {
    projectPrev.addEventListener("click", () => moveProjectRail(-1));
    projectNext.addEventListener("click", () => moveProjectRail(1));
    projectGrid.addEventListener("scroll", updateProjectScrollControls, { passive: true });
    window.addEventListener("resize", updateProjectScrollControls);
    requestAnimationFrame(updateProjectScrollControls);
    if ("ResizeObserver" in window) {
      const cardSizes = new ResizeObserver(() => requestAnimationFrame(updateProjectScrollControls));
      projectGrid.querySelectorAll(".project-card").forEach(card => cardSizes.observe(card));
    }
    document.fonts?.ready.then(() => requestAnimationFrame(updateProjectScrollControls));
  }

  // MAGMASTORE: make the entire project card behave like its external website link.
  cards.filter(card => card.classList.contains("magma-card-link")).forEach(card => {
    const link = card.querySelector(".project-link[href]");
    if (!link) return;

    card.setAttribute("role", "link");
    card.tabIndex = 0;
    card.setAttribute("aria-label", link.textContent.trim());

    const followLink = () => {
      if (link.target === "_blank") window.open(link.href, "_blank", "noopener,noreferrer");
      else window.location.href = link.href;
    };

    card.addEventListener("click", event => {
      if (event.target.closest("a, button, input, select, textarea, summary")) return;
      followLink();
    });

    card.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest("a, button, input, select, textarea, summary")) return;
      event.preventDefault();
      followLink();
    });
  });
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
    if (projectGrid) {
      projectGrid.scrollTo({ left: 0, behavior: "smooth" });
      requestAnimationFrame(updateProjectScrollControls);
    }
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

/* Project detail overlays: native modal focus containment and reversible scroll lock. */
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setupProjectPanel = ({ panelId, openSelector, closeSelector }) => {
    const panel = document.getElementById(panelId);
    const triggers = [...document.querySelectorAll(openSelector)];
    if (!panel || !triggers.length || typeof panel.showModal !== "function") return;

    let projectLanguagePicker = null;

    const mountPanelLanguagePicker = () => {
      const source = document.querySelector(".site-header [data-language-picker]");
      const bar = panel.querySelector(".erp-bar");
      if (!source || !bar || bar.querySelector(".project-language-picker")) return;

      const picker = source.cloneNode(true);
      picker.classList.add("project-language-picker");
      picker.removeAttribute("data-language-picker");
      picker.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));

      const summary = picker.querySelector("summary");
      if (summary) {
        summary.setAttribute("title", "Choose language");
        summary.setAttribute("aria-label", "Choose language");
      }
      const menu = picker.querySelector(".language-menu");
      if (menu) menu.setAttribute("aria-label", "Language");
      const options = [...picker.querySelectorAll(".language-option")];
      const allowedLanguages = new Set(["en", "uz", "ru"]);

      options.forEach((option, index) => {
        option.addEventListener("click", event => {
          const next = option.dataset.language;
          if (!allowedLanguages.has(next)) return;
          event.preventDefault();
          event.stopPropagation();
          window.siteI18n?.setLanguage?.(next);
          try {
            const url = new URL(window.location.href);
            url.searchParams.set("lang", next);
            history.replaceState(null, "", url);
          } catch {}
          picker.open = false;
          summary?.focus();
        });

        option.addEventListener("keydown", event => {
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          let nextIndex = index;
          if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
          if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
          if (event.key === "Home") nextIndex = 0;
          if (event.key === "End") nextIndex = options.length - 1;
          options[nextIndex]?.focus();
        });
      });

      const controls = [...bar.querySelectorAll(closeSelector)];
      bar.insertBefore(picker, controls[1] || controls[0] || null);
      projectLanguagePicker = picker;

      const currentLanguage = window.siteI18n?.language || "en";
      window.siteI18n?.setLanguage?.(currentLanguage, false);
    };

    mountPanelLanguagePicker();

    let opener, scrollX = 0, scrollY = 0, savedStyle, closing = false;

    const animate = frames => reduced.matches || !panel.animate ? Promise.resolve() :
      panel.animate(frames, { duration: 240, easing: "cubic-bezier(.2,.7,.2,1)" }).finished.catch(() => {});

    const open = async source => {
      if (panel.open || closing) return;
      opener = source;
      scrollX = window.scrollX;
      scrollY = window.scrollY;
      savedStyle = document.body.getAttribute("style");
      const gap = window.innerWidth - document.documentElement.clientWidth;
      const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      Object.assign(document.body.style, {
        position: "fixed",
        top: "-" + scrollY + "px",
        left: "-" + scrollX + "px",
        width: "100%",
        overflow: "hidden",
        paddingRight: (padding + gap) + "px"
      });
      panel.showModal();
      panel.scrollTop = 0;
      await animate([
        { opacity: 0, transform: "translateY(24px)" },
        { opacity: 1, transform: "translateY(0)" }
      ]);
    };

    const close = async () => {
      if (!panel.open || closing) return;
      closing = true;
      await animate([
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(24px)" }
      ]);
      panel.close();
    };

    triggers.forEach(trigger => {
      trigger.hidden = false;
      trigger.addEventListener("click", event => open(event.currentTarget));

      const card = trigger.closest(".project-card");
      if (!card) return;

      card.classList.add("erp-card-clickable");
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      const title = card.querySelector("h3")?.textContent?.trim();
      if (title) card.setAttribute("aria-label", title);

      card.addEventListener("click", event => {
        if (event.target.closest("a, button, input, select, textarea, summary")) return;
        open(card);
      });

      card.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (event.target.closest("a, button, input, select, textarea, summary")) return;
        event.preventDefault();
        open(card);
      });
    });

    panel.querySelectorAll(closeSelector).forEach(button => button.addEventListener("click", close));
    panel.addEventListener("click", event => {
      if (projectLanguagePicker?.open && !projectLanguagePicker.contains(event.target)) {
        projectLanguagePicker.open = false;
      }
    });
    panel.addEventListener("cancel", event => {
      event.preventDefault();
      if (projectLanguagePicker?.open) {
        projectLanguagePicker.open = false;
        projectLanguagePicker.querySelector("summary")?.focus();
        return;
      }
      close();
    });
    panel.addEventListener("close", () => {
      if (savedStyle === null) document.body.removeAttribute("style");
      else document.body.setAttribute("style", savedStyle);
      const previous = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(scrollX, scrollY);
      opener?.focus({ preventScroll: true });
      document.documentElement.style.scrollBehavior = previous;
      closing = false;
    });
  };

  setupProjectPanel({
    panelId: "academic-transcript-panel",
    openSelector: "[data-transcript-open]",
    closeSelector: "[data-transcript-close]"
  });

  setupProjectPanel({
    panelId: "erp-project-panel",
    openSelector: "[data-erp-open]",
    closeSelector: "[data-erp-close]"
  });

  setupProjectPanel({
    panelId: "odoo-erp-panel",
    openSelector: "[data-odoo-erp-open]",
    closeSelector: "[data-odoo-erp-close]"
  });

  setupProjectPanel({
    panelId: "rbm-experience-panel",
    openSelector: "[data-rbm-open]",
    closeSelector: "[data-rbm-close]"
  });

  setupProjectPanel({
    panelId: "industry4-project-panel",
    openSelector: "[data-industry4-open]",
    closeSelector: "[data-industry4-close]"
  });

  setupProjectPanel({
    panelId: "cisco-data-panel",
    openSelector: "[data-cisco-open]",
    closeSelector: "[data-cisco-close]"
  });

  document.querySelectorAll("[data-recommendation-open][aria-controls]").forEach(trigger => {
    const panelId = trigger.getAttribute("aria-controls");
    if (!panelId) return;
    setupProjectPanel({
      panelId,
      openSelector: '[data-recommendation-open][aria-controls="' + panelId + '"]',
      closeSelector: "[data-recommendation-close]"
    });
  });
})();



/* Phone-only Skills carousel; tablet and desktop retain their existing grid. */
(() => {
  const grid = document.querySelector(".skills-grid");
  if (!grid) return;
  const cards = [...grid.querySelectorAll(".skill-card")];
  if (!cards.length) return;
  const phone = window.matchMedia("(max-width: 767px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const controls = document.createElement("div");
  controls.className = "skills-scroll-controls";
  controls.innerHTML = '<button type="button" class="skills-scroll" data-skills-prev>←</button><button type="button" class="skills-scroll" data-skills-next>→</button>';
  grid.after(controls);
  const previous = controls.querySelector("[data-skills-prev]");
  const next = controls.querySelector("[data-skills-next]");
  let frame = 0;
  const activeIndex = () => {
    const left = grid.getBoundingClientRect().left;
    return cards.reduce((best, card, index) =>
      Math.abs(card.getBoundingClientRect().left - left) <
      Math.abs(cards[best].getBoundingClientRect().left - left) ? index : best, 0);
  };
  const update = () => {
    frame = 0;
    controls.hidden = !phone.matches;
    if (!phone.matches) {
      grid.style.removeProperty("height");
      grid.removeAttribute("tabindex");
      return;
    }
    grid.tabIndex = 0;
    const card = cards[activeIndex()];
    const style = getComputedStyle(grid);
    grid.style.height = Math.ceil(card.getBoundingClientRect().height +
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)) + "px";
    previous.disabled = grid.scrollLeft <= 3;
    next.disabled = grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 3;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const move = direction => {
    const index = Math.max(0, Math.min(cards.length - 1, activeIndex() + direction));
    const left = grid.scrollLeft + cards[index].getBoundingClientRect().left - grid.getBoundingClientRect().left;
    grid.scrollTo({left, behavior: reduced.matches ? "instant" : "smooth"});
  };
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  grid.addEventListener("keydown", event => {
    if (!phone.matches || event.target !== grid || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  });
  grid.addEventListener("scroll", schedule, {passive: true});
  window.addEventListener("resize", schedule);
  phone.addEventListener("change", schedule);
  if ("ResizeObserver" in window) {
    const sizes = new ResizeObserver(schedule);
    cards.forEach(card => sizes.observe(card));
  }
  const localize = () => {
    const labels = {
      en: ["Previous skills", "Next skills"],
      uz: ["Oldingi ko‘nikmalar", "Keyingi ko‘nikmalar"],
      ru: ["Предыдущие навыки", "Следующие навыки"]
    }[window.siteI18n?.language || document.documentElement.lang] || ["Previous skills", "Next skills"];
    [previous, next].forEach((button, index) => {
      button.setAttribute("aria-label", labels[index]);
      button.title = labels[index];
    });
    schedule();
  };
  window.addEventListener("site-language-change", localize);
  document.fonts?.ready.then(schedule);
  localize();
})();
