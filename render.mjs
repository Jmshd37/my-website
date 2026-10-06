import { renderTranscript, validateTranscript } from "./transcript.mjs";
import { renderProjectCard, renderProjectPanel, validateProjects, createCatalog } from "./projects.mjs";
// Shared, dependency-free renderer. All editable text is escaped before output.
import { escapeHtml, safeUrl } from './html.mjs';
import { canonicalUrl, renderSeo, personSchema } from './seo.mjs';
export { escapeHtml, safeUrl } from './html.mjs';
const e = escapeHtml;
export function validate(data) {
  const required = (value, name) => { if (typeof value !== "string" || !value.trim()) throw new Error(name + " is required"); };
  const list = (value, name) => { if (!Array.isArray(value)) throw new Error(name + " must be an array"); };
  if (!data.profile) throw new Error("profile is required");
  canonicalUrl(data);
  validateTranscript(data.transcript);
  ["firstName","lastName","initials","location","role","intro","availability","headline","focus","email","phone","phoneLabel"].forEach(key => required(data.profile[key], "profile." + key));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email)) throw new Error("Enter a valid profile.email");
  if (!/^\+?[0-9 ()-]+$/.test(data.profile.phone)) throw new Error("Enter a valid profile.phone");
  safeUrl(data.profile.logo); safeUrl(data.profile.github); safeUrl(data.profile.telegram); safeUrl(data.profile.resumeUrl);
  ["sections","experience","projects","recommendations","skills"].forEach(key => list(data[key], key));
  const allowed = ["about","experience","education","projects","recommendations","skills","contact"];
  const seen = new Set();
  data.sections.forEach(section => {
    if (!allowed.includes(section.id) || seen.has(section.id)) throw new Error("Unknown or duplicate section: " + section.id);
    required(section.label, "section label");
    if (typeof section.enabled !== "boolean") throw new Error("section.enabled must be true or false");
    seen.add(section.id);
  });
  required(data.about?.title, "about.title"); list(data.about.paragraphs, "about.paragraphs");
  data.about.paragraphs.forEach(p => required(p,"about paragraph"));
  list(data.profile.stats, "profile.stats");
  for (const stat of data.profile.stats) { required(stat.value,"stat value"); required(stat.label,"stat label"); }
  data.experience.forEach(item => {
    ["period","role","company","description"].forEach(key => required(item[key],"experience." + key));
    list(item.tags,"experience.tags"); item.tags.forEach(tag => required(tag,"experience tag")); safeUrl(item.url);
  });
  data.recommendations.forEach(item => {
    ["title","recommender","position","summary"].forEach(key => required(item[key],"recommendation." + key));
    ["organization","relationship","date"].forEach(key => { if (item[key] !== undefined) required(item[key],"recommendation." + key); });
    list(item.details,"recommendation.details");
    item.details.forEach(detail => { required(detail.heading,"recommendation detail heading"); required(detail.body,"recommendation detail body"); });
    if (item.url !== undefined) safeUrl(item.url);
    if (item.recommenderUrl !== undefined) safeUrl(item.recommenderUrl);
  });
  ["period","location","university","degree","note"].forEach(key => required(data.education?.[key],"education." + key));
  list(data.education.stats,"education.stats"); list(data.education.courses,"education.courses");
  data.education.stats.forEach(stat => { required(stat.value,"education stat"); required(stat.label,"education stat label"); });
  data.education.courses.forEach(course => { required(course.name,"course name"); required(course.grade,"course grade"); });
  validateProjects(data.projects);
  data.projects.forEach(project => {
    ["title","category","meta","description"].forEach(key => required(project[key],"project." + key));
    if (project.category === "All") throw new Error('Project category "All" is reserved for the filter');
    if (typeof project.featured !== "boolean") throw new Error("project.featured must be true or false");
    list(project.tags,"project.tags"); project.tags.forEach(tag => required(tag,"project tag")); if (project.linkLabel !== undefined) required(project.linkLabel,"project.linkLabel"); safeUrl(project.url);
  });
  data.skills.forEach(group => { required(group.title,"skill group"); list(group.items,"skill items"); group.items.forEach(item => required(item,"skill")); });
  required(data.contact?.title,"contact.title"); required(data.contact.intro,"contact.intro");
  return data;
}
const tags = values => values.length ? '<div class="tags">' + values.map(value => "<span>" + e(value) + "</span>").join("") + "</div>" : "";
const stats = (values, className) => values.map(stat => '<div class="' + className + '"><strong>' + e(stat.value) + "</strong><span>" + e(stat.label) + "</span></div>").join("");
const contactIcons = {
  email: '<svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.75 5.75h16.5v12.5H3.75zM4.5 6.5 12 12l7.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone: '<svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.4 3.75 10 7.9 8.3 9.6c1.15 2.25 2.85 3.95 5.1 5.1l1.7-1.7 4.15 2.6c.35.22.52.64.42 1.04-.45 1.78-2.05 3.11-3.94 3.11C9.45 19.75 4.25 14.55 4.25 8.27c0-1.89 1.33-3.49 3.11-3.94.4-.1.82.07 1.04.42Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  github: '<svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.9a9.1 9.1 0 0 0-2.88 17.73c.46.09.63-.2.63-.44v-1.72c-2.57.56-3.11-1.09-3.11-1.09-.42-1.07-1.03-1.35-1.03-1.35-.84-.58.06-.57.06-.57.93.07 1.42.96 1.42.96.83 1.42 2.17 1.01 2.7.77.08-.6.32-1.01.59-1.24-2.05-.23-4.2-1.03-4.2-4.5 0-1 .36-1.81.95-2.45-.1-.23-.41-1.17.09-2.42 0 0 .78-.25 2.5.94A8.7 8.7 0 0 1 12 7.22c.77 0 1.54.1 2.27.3 1.73-1.19 2.5-.94 2.5-.94.5 1.25.19 2.19.09 2.42.59.64.95 1.45.95 2.45 0 3.48-2.16 4.27-4.22 4.5.33.29.63.86.63 1.74v2.5c0 .24.17.53.64.44A9.1 9.1 0 0 0 12 2.9Z" fill="currentColor"/></svg>',
  telegram: '<svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3.25 11.45 16.9-6.52c.78-.3 1.47.19 1.21 1.4l-2.88 13.55c-.2.96-.78 1.2-1.58.75l-4.39-3.24-2.12 2.04c-.23.23-.43.43-.88.43l.31-4.47 8.13-7.35c.35-.31-.08-.49-.55-.18L7.35 14.2l-4.32-1.35c-.94-.29-.96-.94.22-1.4Z" fill="currentColor"/></svg>',
  location: '<svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21s6-5.25 6-11a6 6 0 1 0-12 0c0 5.75 6 11 6 11Zm0-8.25A2.75 2.75 0 1 0 12 7.25a2.75 2.75 0 0 0 0 5.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
const renderRecommendationCard = (item, i) => {
  const panelId = "recommendation-panel-" + (i + 1);
  const meta = [item.relationship, item.organization].filter(Boolean).join(" · ") || "Recommendation";
  const recommendationTags = [item.recommender, item.position].filter(Boolean);
  return '<article class="project-card recommendation-card"><div class="project-meta"><span class="project-no">' + String(i+1).padStart(2,"0") + '</span><span>' + e(meta) + '</span></div><div class="project-body"><h3>' + e(item.title) + '</h3><p>' + e(item.summary) + '</p>' + tags(recommendationTags) + '<button type="button" class="recommendation-trigger" data-recommendation-open aria-haspopup="dialog" aria-controls="' + panelId + '" hidden>View recommendation →</button></div></article>';
};
const renderRecommendationPanel = (item, i) => {
  const panelId = "recommendation-panel-" + (i + 1);
  const context = [item.relationship, item.date].filter(Boolean);
  const contextTags = context.length ? tags(context) : "";
  const initials = item.recommender.split(/\s+/).filter(part => /^[A-Za-z]/.test(part) && !/^(Prof|Dr)\.?$/i.test(part)).slice(-2).map(part => part[0]).join("").toUpperCase() || "R";
  const recommendationNarrative = '<p class="recommendation-narrative-text">' + item.details.map(detail => '<span>' + e(detail.body) + '</span>').join(" ") + '</p>';
  const originalLetter = item.url ? '<a class="recommendation-letter-button" href="' + e(safeUrl(item.url)) + '" target="_blank" rel="noopener noreferrer"><span>View original letter</span><span aria-hidden="true">↗</span></a>' : "";
  return '<dialog id="' + panelId + '" class="erp-panel recommendation-panel" aria-labelledby="' + panelId + '-title"><div class="erp-bar"><button type="button" class="erp-control" data-recommendation-close>← Back to Recommendations</button><button type="button" class="erp-control" data-recommendation-close autofocus>× Close</button></div><div class="erp-content recommendation-content"><section class="recommendation-hero"><div class="recommendation-hero-copy"><p class="section-label">Recommendation · ' + e(item.recommender) + '</p><h2 id="' + panelId + '-title">' + e(item.title) + '</h2><p class="recommendation-quote">' + e(item.summary) + '</p>' + contextTags + '</div><aside class="recommendation-person"><div class="recommendation-person-mark" aria-hidden="true">' + e(initials) + '</div><div>' + (item.recommenderUrl ? '<a class="recommendation-person-name" href="' + e(safeUrl(item.recommenderUrl)) + '" target="_blank" rel="noopener noreferrer"><strong>' + e(item.recommender) + '</strong><span aria-hidden="true">↗</span></a>' : '<strong>' + e(item.recommender) + '</strong>') + '<span>' + e(item.position) + '</span><small>' + e(item.organization) + '</small>' + (item.recommenderUrl ? '<a class="recommendation-person-link" href="' + e(safeUrl(item.recommenderUrl)) + '" target="_blank" rel="noopener noreferrer">Professor website ↗</a>' : '') + '</div></aside></section><div class="recommendation-narrative">' + recommendationNarrative + '</div><div class="recommendation-footer">' + originalLetter + '</div></div></dialog>';
};

export function render(data, year = new Date().getFullYear()) {
  validate(data);
  const p = data.profile;
  const catalog = createCatalog(data);
  const name = p.firstName + " " + p.lastName;
  const enabled = data.sections.filter(section => section.enabled);
  const email = "mailto:" + p.email;
  const phone = "tel:" + p.phone.replace(/[ ()-]/g, "");
  const portrait = p.photo ? '<div class="profile-photo-frame"><img class="profile-photo" src="' + e(safeUrl(p.photo)) + '" alt="Portrait of ' + e(name) + '" width="240" height="300" fetchpriority="high" decoding="async"></div>' : '<div class="monogram" aria-hidden="true">' + e(p.initials) + '</div>';
  const heading = (section, index, title, description) => '<div class="section-header"><div><p class="section-label">' + String(index+1).padStart(2,"0") + " · " + e(section.label) + '</p><h2 class="section-title">' + e(title) + "</h2></div>" + (description ? "<p>" + e(description) + "</p>" : "") + "</div>";
  const sections = enabled.map((section,index) => {
    let body = "";
    if (section.id === "about") body = '<div class="about-grid"><div class="about-number"><strong>' + String(index+1).padStart(2,"0") + '</strong><span>Perspective & purpose</span></div><div class="about-copy"><p class="section-label">' + e(section.label) + '</p><h2 class="lead">' + e(data.about.title) + "</h2>" + data.about.paragraphs.map(text => "<p>" + e(text) + "</p>").join("") + "</div></div>";
    if (section.id === "experience") body = heading(section,index,"Where I’ve worked.","Roles spanning project management, business analysis and international operations.") + '<div class="timeline">' + data.experience.map(item => '<article class="timeline-item"><div class="timeline-date">' + e(item.period) + '</div><div class="timeline-content"><div class="timeline-top"><h3>' + e(item.role) + '</h3>' + (item.url ? '<a class="company company-link" href="' + e(safeUrl(item.url)) + '" target="_blank" rel="noopener noreferrer">' + e(item.company) + ' <span aria-hidden="true">↗</span><span class="sr-only"> (opens in new tab)</span></a>' : '<span class="company">' + e(item.company) + "</span>") + "</div><p>" + e(item.description) + "</p>" + tags(item.tags) + "</div></article>").join("") + "</div>";
    if (section.id === "education") {
      const ed = data.education;
      const courseCards = ed.courses.map(course => '<div class="course"><span class="grade">' + e(course.grade) + "</span><p>" + e(course.name) + "</p></div>");
      const transcriptTile = "<button type=\"button\" class=\"edu-stat edu-transcript transcript-trigger\" data-transcript-open hidden aria-haspopup=\"dialog\" aria-controls=\"academic-transcript-panel\"><span class=\"edu-transcript-icon\" aria-hidden=\"true\">↗</span><strong>Full Academic Transcript</strong><span>Courses · Grades · Grading system</span></button>";
      body = heading(section,index,"Academic foundation.","Management, operations, analytics and business.") + '<div class="education-wrap"><div class="education-main"><div class="edu-copy"><small>' + e(ed.period) + " · " + e(ed.location) + "</small><h3>" + e(ed.university) + '</h3><p class="edu-degree">' + e(ed.degree) + '</p><p class="edu-note">' + e(ed.note) + '</p></div><div class="edu-stats">' + stats(ed.stats,"edu-stat") + transcriptTile + '</div></div><div class="courses">' + courseCards.join("") + "</div></div>";
    }
    if (section.id === "projects") {
      const categories = ["All",...new Set(data.projects.map(project => project.category))];
      body = heading(section,index,"Projects & achievements.","Research and experiences that shaped how I approach complex business problems.") +
        '<div class="project-controls" hidden><div class="filters" role="group" aria-label="Filter projects by category">' +
        categories.map((category,i) => '<button type="button" class="filter-button" data-filter="' + e(category) + '" aria-pressed="' + (i===0) + '">' + e(category) + "</button>").join("") +
        '</div><div class="project-search"><label for="project-search">Search selected work</label><input id="project-search" type="search" placeholder="Try ERP or mathematics" autocomplete="off"></div></div><p id="project-count" class="results-count" role="status" hidden></p><div class="project-carousel"><button type="button" class="project-scroll project-scroll-prev" data-project-scroll="prev" aria-label="Previous projects" title="Previous projects">←</button><div class="project-grid" id="project-grid" tabindex="0" aria-label="Projects and achievements">' +
        data.projects.map(renderProjectCard).join("") +
        '</div><button type="button" class="project-scroll project-scroll-next" data-project-scroll="next" aria-label="Next projects" title="Next projects">→</button></div><div id="project-empty" class="empty-state" hidden><h3>No matching projects</h3><p>Try another keyword or show all selected work.</p><button type="button" class="filter-button" id="reset-projects">Clear filters</button></div>';
    }
    if (section.id === "recommendations") body = heading(section,index,"Recommendations.","Academic and professional recommendations that provide third-party context on my work, character and potential.") + (data.recommendations.length ? '<div class="recommendation-grid">' + data.recommendations.map(renderRecommendationCard).join("") + '</div>' : '<div class="empty-state recommendation-empty"><h3>Recommendation letters</h3><p>Recommendation details will be added here.</p></div>');
    if (section.id === "skills") body = heading(section,index,"Analytical, managerial & digital toolkit.","Capabilities and tools I use across business analysis, research, management and communication.") + '<div class="skills-grid" role="group" aria-label="Skills &amp; Technical Toolkit">' + data.skills.map((group,i) => '<article class="skill-card skill-' + e(group.id || 'general') + '"><div class="skill-icon" aria-hidden="true">' + String(i+1).padStart(2,"0") + "</div><h3>" + e(group.title) + "</h3><ul>" + group.items.map(item => "<li>" + e(item) + "</li>").join("") + "</ul></article>").join("") + "</div>";
    if (section.id === "contact") body = '<div class="contact-card"><div><p class="section-label">' + String(index+1).padStart(2,"0") + " · " + e(section.label) + "</p><h2>" + e(data.contact.title) + '</h2><p class="intro">' + e(data.contact.intro) + '</p><button type="button" id="copy-email" class="filter-button copy-email" data-email="' + e(p.email) + '" hidden>Copy email address</button><p id="copy-status" class="copy-status" role="status"></p></div><div class="contact-list"><a class="contact-row" href="' + e(email) + '"><span class="contact-channel">' + contactIcons.email + 'Email</span><strong>' + e(p.email) + ' ↗</strong></a><a class="contact-row" href="' + e(phone) + '"><span class="contact-channel">' + contactIcons.phone + 'Phone</span><strong>' + e(p.phoneLabel) + "</strong></a>" + (p.github ? '<a class="contact-row" href="' + e(safeUrl(p.github)) + '" target="_blank" rel="noopener noreferrer"><span class="contact-channel">' + contactIcons.github + 'GitHub</span><strong>' + e(p.github.replace(/^https?:\/\//,"")) + ' ↗<span class="sr-only"> (opens in new tab)</span></strong></a>' : "") + (p.telegram ? '<a class="contact-row" href="' + e(safeUrl(p.telegram)) + '" target="_blank" rel="noopener noreferrer"><span class="contact-channel">' + contactIcons.telegram + 'Telegram</span><strong>' + e(p.telegramLabel || p.telegram.replace(/^https?:\/\/t\.me\//,"@")) + ' ↗<span class="sr-only"> (opens in new tab)</span></strong></a>' : "") + '<div class="contact-row"><span class="contact-channel">' + contactIcons.location + 'Location</span><strong>' + e(p.location) + "</strong></div></div></div>";
    return '<section class="section ' + ({experience:"experience",skills:"skills-section",contact:"contact"}[section.id] || "") + '" id="' + section.id + '"><div class="container">' + body + "</div></section>";
  }).join("\n");
  const schema = personSchema(data);
  return '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="description" content="' + e(p.intro + " " + name + " — " + p.role) + '"><meta name="author" content="' + e(name) + '">' +
    renderSeo(data) + '<meta name="theme-color" content="#0a1020"><meta property="og:type" content="profile"><meta property="og:title" content="' + e(name + " | Portfolio") + '"><meta property="og:description" content="' + e(p.intro) + '"><meta name="twitter:card" content="summary"><title>' + e(name) + ' | Portfolio</title><link rel="icon" href="favicon.svg" type="image/svg+xml"><script src="theme.js?v=20261006-portfolio"></script><link rel="stylesheet" href="styles.css?v=20261006-portfolio"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g,"\\u003c") + '</script><script src="i18n.js?v=20261006-portfolio" defer></script><script src="script.js?v=20261006-portfolio" defer></script></head><body>' +
    '<script type="application/json" id="site-catalog">' + JSON.stringify(catalog).replace(/</g, '\\u003c') + '</script><a class="skip-link" href="#main">Skip to content</a><header class="site-header" id="top"><nav class="nav container" aria-label="Main navigation"><a class="brand" href="#home" aria-label="' + e(name) + '"><img class="brand-logo" src="' + e(safeUrl(p.logo || 'assets/jn-moon-logo.webp')) + '" alt="' + e(p.initials) + '" width="50" height="50" decoding="async"></a><button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="nav-links" hidden><span></span><span></span><span></span></button><div class="nav-links" id="nav-links">' +
    enabled.map(section => '<a' + (section.id==="contact" ? ' class="contact-pill"' : "") + ' href="#' + section.id + '">' + e(section.label) + "</a>").join("") +
    '</div><details class="language-picker" data-language-picker><summary id="language-button" class="language-button" title="Choose language" aria-label="Choose language"><span class="language-summary-flags"><span data-current-flag="en"><svg class="flag-svg" viewBox="0 0 60 36" aria-hidden="true" focusable="false"><rect width="60" height="36" rx="3" fill="#012169"/><path d="M0 0 60 36M60 0 0 36" stroke="#fff" stroke-width="8"/><path d="M0 0 60 36M60 0 0 36" stroke="#C8102E" stroke-width="4"/><path d="M30 0v36M0 18h60" stroke="#fff" stroke-width="12"/><path d="M30 0v36M0 18h60" stroke="#C8102E" stroke-width="7"/></svg></span><span data-current-flag="ru" hidden><svg class="flag-svg" viewBox="0 0 60 36" aria-hidden="true" focusable="false"><rect width="60" height="12" y="0" rx="3" fill="#fff"/><rect width="60" height="12" y="12" fill="#0039A6"/><rect width="60" height="12" y="24" rx="3" fill="#D52B1E"/></svg></span><span data-current-flag="uz" hidden><svg class="flag-svg" viewBox="0 0 60 36" aria-hidden="true" focusable="false"><rect width="60" height="10" y="0" rx="3" fill="#1EB6E8"/><rect width="60" height="2" y="10" fill="#CE1126"/><rect width="60" height="12" y="12" fill="#fff"/><rect width="60" height="2" y="24" fill="#CE1126"/><rect width="60" height="10" y="26" rx="3" fill="#1EB53A"/><circle cx="9" cy="5.2" r="3.5" fill="#fff"/><circle cx="10.6" cy="5.2" r="3.2" fill="#1EB6E8"/><g fill="#fff"><circle cx="16" cy="3.2" r=".75"/><circle cx="19" cy="3.2" r=".75"/><circle cx="22" cy="3.2" r=".75"/><circle cx="17.5" cy="5.8" r=".75"/><circle cx="20.5" cy="5.8" r=".75"/><circle cx="23.5" cy="5.8" r=".75"/></g></svg></span></span></summary><div id="language-menu" class="language-menu" role="menu" aria-label="Language"><a class="language-option" role="menuitemradio" data-language="en" aria-checked="true" href="?lang=en"><svg class="flag-svg" viewBox="0 0 60 36" aria-hidden="true" focusable="false"><rect width="60" height="36" rx="3" fill="#012169"/><path d="M0 0 60 36M60 0 0 36" stroke="#fff" stroke-width="8"/><path d="M0 0 60 36M60 0 0 36" stroke="#C8102E" stroke-width="4"/><path d="M30 0v36M0 18h60" stroke="#fff" stroke-width="12"/><path d="M30 0v36M0 18h60" stroke="#C8102E" stroke-width="7"/></svg><span>English</span></a><a class="language-option" role="menuitemradio" data-language="uz" aria-checked="false" href="?lang=uz"><svg class="flag-svg" viewBox="0 0 60 36" aria-hidden="true" focusable="false"><rect width="60" height="10" y="0" rx="3" fill="#1EB6E8"/><rect width="60" height="2" y="10" fill="#CE1126"/><rect width="60" height="12" y="12" fill="#fff"/><rect width="60" height="2" y="24" fill="#CE1126"/><rect width="60" height="10" y="26" rx="3" fill="#1EB53A"/><circle cx="9" cy="5.2" r="3.5" fill="#fff"/><circle cx="10.6" cy="5.2" r="3.2" fill="#1EB6E8"/><g fill="#fff"><circle cx="16" cy="3.2" r=".75"/><circle cx="19" cy="3.2" r=".75"/><circle cx="22" cy="3.2" r=".75"/><circle cx="17.5" cy="5.8" r=".75"/><circle cx="20.5" cy="5.8" r=".75"/><circle cx="23.5" cy="5.8" r=".75"/></g></svg><span>O‘zbek</span></a><a class="language-option" role="menuitemradio" data-language="ru" aria-checked="false" href="?lang=ru"><svg class="flag-svg" viewBox="0 0 60 36" aria-hidden="true" focusable="false"><rect width="60" height="12" y="0" rx="3" fill="#fff"/><rect width="60" height="12" y="12" fill="#0039A6"/><rect width="60" height="12" y="24" rx="3" fill="#D52B1E"/></svg><span>Русский</span></a></div></details></nav></header><main id="main"><section class="hero" id="home" aria-labelledby="profile-name"><div class="container"><div class="hero-shell"><div class="hero-grid"><div class="hero-copy"><p class="eyebrow">' + e(p.location) +
    '</p><h1 id="profile-name">' + e(p.firstName) + '<br><span class="surname">' + e(p.lastName) + '</span></h1><p class="hero-role" data-i18n="profile.role">' + e(p.role) + '</p><p class="hero-intro" data-i18n="profile.intro">' + e(p.intro) +
    '</p><div class="hero-actions"><a class="button button-primary" href="' + e(email) + '">Get in touch <span aria-hidden="true">↗</span></a>' +
    (p.resumeUrl ? '<a class="button button-secondary" href="' + e(safeUrl(p.resumeUrl)) + '" download>Download CV <span aria-hidden="true">↓</span></a>' : '<button class="button button-secondary print-button" type="button" hidden>Print / Save CV <span aria-hidden="true">↓</span></button>') +
    '</div><div class="hero-socials">' + (p.github ? '<a href="' + e(safeUrl(p.github)) + '" target="_blank" rel="noopener noreferrer">GitHub ↗<span class="sr-only"> (opens in new tab)</span></a>' : "") + (p.telegram ? '<a href="' + e(safeUrl(p.telegram)) + '" target="_blank" rel="noopener noreferrer">Telegram ↗<span class="sr-only"> (opens in new tab)</span></a>' : "") + '<span>Personal portfolio / CV</span></div></div><div class="hero-side"><aside class="profile-card" aria-label="Profile at a glance"><div class="availability"><i aria-hidden="true"></i>' + e(p.availability) + '</div>' + portrait + '<h2>' + e(p.headline) + '</h2><p>' + e(p.focus) + '</p><div class="mini-stats">' + stats(p.stats,"mini-stat") +
    '</div></aside></div></div></div><div class="hero-caption"><span>Education. Research. Experience.</span>' + (enabled.length ? '<a href="#' + enabled[0].id + '">Explore the profile <span aria-hidden="true">↓</span></a>' : "") + '</div></div></section>' +
    sections + (enabled.some(section => section.id === 'recommendations') ? data.recommendations.map(renderRecommendationPanel).join("") : '') + (enabled.some(section => section.id === 'education') ? renderTranscript(data.transcript) : '') + (enabled.some(section => section.id === 'projects') ? data.projects.map(renderProjectPanel).join('') : '') + '</main><footer class="footer"><div class="container footer-inner"><span>© <span id="year">' + year + "</span> " + e(name) + '</span><div class="footer-actions"><button type="button" class="print-button text-button" hidden>Print / Save CV</button><a href="#top">Back to top ↑</a></div></div></footer></body></html>\n';
}
