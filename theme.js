/* Apply appearance before CSS loads, then enhance the header and detail panels. */
(() => {
  const key = 'portfolio-theme';
  const choices = ['system', 'light', 'dark'];
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { const saved = localStorage.getItem(key); if (choices.includes(saved)) preference = saved; } catch {}
  const labels = {
    en: { title: 'Appearance', system: 'System', light: 'Light', dark: 'Dark' },
    uz: { title: 'Ko‘rinish', system: 'Tizim', light: 'Yorug‘', dark: 'Qorong‘i' },
    ru: { title: 'Оформление', system: 'Системное', light: 'Светлое', dark: 'Тёмное' }
  };
  const icons = {
    system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
    light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    dark: '<path d="M20.5 14a9 9 0 0 1-10.5-10.5A9 9 0 1 0 20.5 14Z"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + '</svg>';
  const language = () => labels[window.siteI18n?.language || document.documentElement.lang] || labels.en;
  const apply = () => {
    const dark = preference === 'dark' || (preference === 'system' && system.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#0d1422' : '#f6f3ed';
    document.querySelectorAll('.theme-picker').forEach(picker => {
      const text = language();
      const summary = picker.querySelector('summary');
      summary.innerHTML = icon(preference);
      summary.setAttribute('aria-label', text.title + ': ' + text[preference]);
      summary.title = text.title + ': ' + text[preference];
      picker.querySelector('.theme-options').setAttribute('aria-label', text.title);
      picker.querySelectorAll('[data-theme-choice]').forEach(button => {
        const choice = button.dataset.themeChoice;
        button.setAttribute('aria-pressed', String(choice === preference));
        button.innerHTML = icon(choice) + '<span>' + text[choice] + '</span>';
      });
    });
  };
  apply();
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = choices.includes(event.newValue) ? event.newValue : 'system';
    apply();
  });
  window.addEventListener('site-language-change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.site-header .nav, .erp-bar').forEach(host => {
      const picker = document.createElement('details');
      picker.className = 'theme-picker';
      picker.innerHTML = '<summary class="theme-button"></summary><div class="theme-options" role="group">' + choices.map(choice => '<button type="button" data-theme-choice="' + choice + '"></button>').join('') + '</div>';
      host.insertBefore(picker, host.querySelector('.nav-toggle') || host.lastElementChild);
      picker.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
        preference = button.dataset.themeChoice;
        try { localStorage.setItem(key, preference); } catch {}
        apply();
        picker.open = false;
        picker.querySelector('summary').focus();
      }));
      picker.addEventListener('toggle', () => {
        if (!picker.open) return;
        host.querySelectorAll('details[open]').forEach(other => { if (other !== picker) other.open = false; });
      });
    });
    document.addEventListener('click', event => {
      document.querySelectorAll('.theme-picker[open]').forEach(picker => { if (!picker.contains(event.target)) picker.open = false; });
    });
    document.addEventListener('keydown', event => {
      const picker = document.querySelector('.theme-picker[open]');
      if (event.key === 'Escape' && picker) {
        event.preventDefault(); event.stopImmediatePropagation();
        picker.open = false; picker.querySelector('summary').focus();
      }
    }, true);
    apply();
  });
})();
