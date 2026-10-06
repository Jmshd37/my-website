(() => {
  // Semantic catalog is generated from content.json, including all case studies.
  const catalog = JSON.parse(document.getElementById('site-catalog')?.textContent || '{}');
  const phraseKeys = new Map();
  Object.entries(catalog.en || {}).forEach(([key,value]) => {
    if (!phraseKeys.has(value) || catalog.uz?.[key] || catalog.ru?.[key]) phraseKeys.set(value,key);
  });
  const translate = (text,lang) => {
    const exact = catalog[lang]?.[phraseKeys.get(text)];
    if (exact) return exact;
    // Composed labels keep the same independently translated semantic fragments.
    if (text.includes(' · ')) return text.split(' · ').map(part=>translate(part,lang)).join(' · ');
    return text;
  };
  const messages = {
    en: {
      openNavigation: "Open navigation",
      closeNavigation: "Close navigation",
      projectCount: "Showing {count} of {total} projects",
      emailCopied: "Email address copied.",
      copyFallback: "Copy this address: {email}"
    },
    ru: {
      openNavigation: "Открыть меню",
      closeNavigation: "Закрыть меню",
      projectCount: "Показано: {count} из {total}",
      emailCopied: "Email скопирован.",
      copyFallback: "Скопируйте адрес: {email}"
    },
    uz: {
      openNavigation: "Menyuni ochish",
      closeNavigation: "Menyuni yopish",
      projectCount: "{total} ta loyihadan {count} tasi ko‘rsatilmoqda",
      emailCopied: "Email manzili nusxalandi.",
      copyFallback: "Ushbu manzilni nusxalang: {email}"
    }
  };

  const allowed = new Set(["en", "ru", "uz"]);
  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  let language = "en";

  const preserveWhitespace = (raw, translated) => {
    const lead = (raw.match(/^\s*/) || [""])[0];
    const trail = (raw.match(/\s*$/) || [""])[0];
    return lead + translated + trail;
  };

  const translatePhrase = (raw, lang) => {
    const trimmed = raw.trim();
    if (!trimmed || lang === "en") return trimmed;
    const prefixed = trimmed.match(/^(\d{2}) · (.+)$/);
    if (prefixed) {
      const translatedLabel = translate(prefixed[2], lang);
      return translatedLabel ? prefixed[1] + " · " + translatedLabel : trimmed;
    }
    return translate(trimmed, lang);
  };

  const applyText = lang => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest("script,style,.language-picker,.theme-picker")) continue;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const base = originalText.get(node);
      const trimmed = base.trim();
      if (!trimmed) continue;
      const semanticKey = node.parentElement?.dataset.i18n;
      const translated = semanticKey ? (catalog[lang]?.[semanticKey] || catalog.en?.[semanticKey] || base) : translatePhrase(base, lang);
      node.nodeValue = preserveWhitespace(base, translated);
    }
  };

  const applyAttributes = lang => {
    document.querySelectorAll("[aria-label],[placeholder],[title]").forEach(element => {
      let stored = originalAttrs.get(element);
      if (!stored) {
        stored = {};
        ["aria-label", "placeholder", "title"].forEach(name => {
          if (element.hasAttribute(name)) stored[name] = element.getAttribute(name);
        });
        originalAttrs.set(element, stored);
      }
      Object.entries(stored).forEach(([name, base]) => {
        const translated = lang === "en" ? base : translate(base, lang);
        element.setAttribute(name, translated);
      });
    });
  };

  const applyMeta = lang => {
    const value = key => catalog[lang]?.[key] || catalog.en?.[key] || '';
    const name = value('profile.firstName') + ' ' + value('profile.lastName');
    const title = name + (lang === 'ru' ? ' | Портфолио' : ' | Portfolio');
    const intro = value('profile.intro');
    document.title = title;
    for (const [selector, content] of [
      ['meta[name="description"]', intro + ' ' + name + ' — ' + value('profile.role')],
      ['meta[property="og:title"]', title], ['meta[property="og:description"]', intro],
      ['meta[name="twitter:title"]', title], ['meta[name="twitter:description"]', intro],
      ['meta[property="og:locale"]', {en:'en_US',uz:'uz_UZ',ru:'ru_RU'}[lang]]
    ]) document.querySelector(selector)?.setAttribute('content',content);
  };

  const t = (key, vars = {}) => {
    const table = messages[language] || messages.en;
    let value = table[key] || messages.en[key] || "";
    Object.entries(vars).forEach(([name, replacement]) => {
      value = value.replaceAll("{" + name + "}", String(replacement));
    });
    return value;
  };

  const setLanguage = (next, notify = true) => {
    language = allowed.has(next) ? next : "en";
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    applyText(language);
    applyAttributes(language);
    applyMeta(language);
    document.querySelectorAll("[data-current-flag]").forEach(flag => {
      flag.hidden = flag.dataset.currentFlag !== language;
    });
    document.querySelectorAll(".language-option").forEach(option => {
      option.setAttribute("aria-checked", String(option.dataset.language === language));
    });
    try { localStorage.setItem("portfolio-language", language); } catch {}
    if (notify) window.dispatchEvent(new CustomEvent("site-language-change", { detail: { language } }));
  };

  let initial = "en";
  try {
    const queryLanguage = new URLSearchParams(window.location.search).get("lang");
    const saved = localStorage.getItem("portfolio-language");
    if (allowed.has(queryLanguage)) initial = queryLanguage;
    else if (allowed.has(saved)) initial = saved;
  } catch {}

  window.siteI18n = {
    get language() { return language; },
    t,
    setLanguage
  };

  const picker = document.querySelector("[data-language-picker]");
  const languageButton = document.querySelector("#language-button");
  const languageOptions = [...document.querySelectorAll(".language-option")];

  languageOptions.forEach((option, index) => {
    option.addEventListener("click", event => {
      const next = option.dataset.language;
      if (!allowed.has(next)) return;
      event.preventDefault();
      event.stopPropagation();
      setLanguage(next);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", next);
        history.replaceState(null, "", url);
      } catch {}
      if (picker) picker.open = false;
      languageButton?.focus();
    });

    option.addEventListener("keydown", event => {
      if (!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowDown") next = (index + 1) % languageOptions.length;
      if (event.key === "ArrowUp") next = (index - 1 + languageOptions.length) % languageOptions.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = languageOptions.length - 1;
      languageOptions[next]?.focus();
    });
  });

  document.addEventListener("click", event => {
    if (picker?.open && !picker.contains(event.target)) picker.open = false;
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && picker?.open) {
      picker.open = false;
      languageButton?.focus();
    }
  });

  setLanguage(initial, false);
})();
