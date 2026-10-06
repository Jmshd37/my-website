// Reusable case-study data renderer. No project title or employer-specific branches.
import { escapeHtml as e, safeUrl } from './html.mjs';

const link = (url, label, className = 'erp-control') => `<a class="${className}" href="${e(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${e(label)}</a>`;
const tags = items => `<div class="tags">${items.map(item => `<span>${e(item)}</span>`).join('')}</div>`;
const image = (photo, className = 'rbm-photo') => `<div class="${className}"><img src="${e(safeUrl(photo.src))}"${photo.small ? ` srcset="${e(safeUrl(photo.small))} ${photo.smallWidth}w, ${e(safeUrl(photo.src))} ${photo.width}w" sizes="(max-width: 767px) 90vw, 480px"` : ''} alt="${e(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async"></div>`;

function renderBlock(block) {
  if (block.type === 'paragraph') return `<p${block.note ? ' class="erp-status"' : ''}>${block.parts.map(part => part.break ? '<br>' : part.url ? link(part.url,part.text) : part.strong ? `<strong>${e(part.text)}</strong>` : `<span>${e(part.text)}</span>`).join('')}</p>`;
  if (block.type === 'list') return `<ul>${block.items.map(item => `<li>${e(item)}</li>`).join('')}</ul>`;
  if (block.type === 'tags') return tags(block.items);
  if (block.type === 'metrics') return `<div class="industry4-metrics">${block.items.map(item => `<div><strong>${e(item.value)}</strong><span>${e(item.label)}</span></div>`).join('')}</div>`;
  throw new Error('Unknown project block: ' + block.type);
}

export function renderProjectPanel(project) {
  const d = project.details;
  if (!d) return '';
  const gallery = d.layout === 'gallery';
  const titleId = `project-${project.id}-title`;
  const header = `<h2 id="${titleId}">${e(d.title)}</h2>${d.subtitle ? `<p class="erp-subtitle">${e(d.subtitle)}</p>` : ''}<p class="erp-lead">${e(d.lead)}</p>`;
  return `<dialog id="project-${project.id}-panel" class="erp-panel${gallery ? ' rbm-panel' : ''}" aria-labelledby="${titleId}"><div class="erp-bar"><button type="button" class="erp-control" data-project-close>← Back to Projects</button><button type="button" class="erp-control" data-project-close autofocus>× Close</button></div><div class="erp-content${gallery ? ' rbm-content' : ''}"><p class="section-label">${e(d.label || project.category)}</p>` +
    (gallery ? `<div class="rbm-hero-grid"><div class="rbm-hero-copy">${header}${d.facts ? `<div class="rbm-facts">${d.facts.map(f=>`<span>${e(f)}</span>`).join('')}</div>` : ''}</div>${d.cover ? image(d.cover,'rbm-photo rbm-photo-cover') : ''}</div>` : header) +
    (d.question ? `<p class="erp-question">${e(d.question)}</p>` : '') +
    (d.flow ? `<div class="industry4-flow" aria-label="Project system flow">${d.flow.map(f=>`<span>${e(f)}</span>`).join('<b aria-hidden="true">→</b>')}</div>` : '') +
    (d.sections || []).map((section,i) => `<details class="erp-detail"><summary><span class="erp-number">${String(i+1).padStart(2,'0')}</span>${e(section.title)}</summary>${section.blocks.map(renderBlock).join('')}</details>`).join('') +
    (d.gallery ? `<div class="rbm-visit-grid">${d.gallery.map(item=>`<article class="rbm-visit-card">${image(item.image)}<div class="rbm-visit-copy"><p class="rbm-kicker">${e(item.category)}</p><h3>${e(item.title)}</h3><p>${e(item.description)}</p>${item.link ? link(item.link.url,item.link.label,'rbm-source-link') : ''}</div></article>`).join('')}</div>` : '') +
    (d.certificate ? `<div class="erp-benefit rbm-certificate"><div><h3>${e(d.certificate.title)}</h3><p>${e(d.certificate.description)}</p></div>${link(d.certificate.url,d.certificate.label)}</div>` : '') +
    (d.reflection ? `<div class="erp-benefit"><h3>${e(d.reflection.title)}</h3>${d.reflection.blocks.map(renderBlock).join('')}</div>` : '') +
    `<button type="button" class="erp-control erp-back" data-project-close>← Back to Projects</button></div></dialog>`;
}

export function renderProjectCard(project, i) {
  const classes = 'project-card' + (project.featured ? ' project-featured' : '') + (project.priority === 'flagship' ? ' project-flagship' : '') + (project.cover ? ' rbm-card' : '');
  const detailButton = project.details ? `<button type="button" class="project-link erp-trigger" data-project-open aria-label="${e(project.title)}" aria-haspopup="dialog" aria-controls="project-${project.id}-panel" hidden>View Project →</button>` : '';
  const external = project.url ? link(project.url,project.linkLabel || (/\.pdf$/i.test(project.url) ? 'View certificate' : 'View project'),'project-link') : '';
  return `<article class="${classes}" data-category="${e(project.category)}"><div class="project-meta"><span class="project-no">${String(i+1).padStart(2,'0')}</span><span>${e(project.meta)}</span></div>${project.cover ? image(project.cover,'rbm-card-visual') : ''}<div class="project-body"><h3>${e(project.title)}</h3><p>${e(project.description)}</p>${tags(project.tags)}<div class="project-links">${detailButton}${external}</div></div></article>`;
}

export function validateProjects(projects) {
  const seen = new Set();
  const required = (v, path) => { if (typeof v !== 'string' || !v.trim()) throw new Error(path + ' is required'); };
  const list = (v, path) => { if (!Array.isArray(v)) throw new Error(path + ' must be an array'); };
  const strings = (v, path) => { list(v,path); v.forEach(x=>required(x,path)); };
  const photo = p => {
    required(p?.src,'image.src'); safeUrl(p.src); if(p.small) safeUrl(p.small);
    required(p.alt,'image.alt');
    if(p.small && (!Number.isInteger(p.smallWidth) || p.smallWidth < 1)) throw new Error('image.smallWidth must be a positive integer');
    for (const key of ['width','height']) if (!Number.isInteger(p[key]) || p[key]<1) throw new Error('image.'+key+' must be a positive integer');
  };
  const blocks = value => {
    list(value,'section.blocks');
    value.forEach(b=>{
      if (b.type === 'paragraph') {
        list(b.parts,'paragraph.parts'); b.parts.forEach(p=>{if (!p.break) required(p.text,'paragraph text'); if(p.url) safeUrl(p.url);});
      } else if (['list','tags'].includes(b.type)) strings(b.items,'block.items');
      else if (b.type === 'metrics') {list(b.items,'metrics.items'); b.items.forEach(m=>{required(m.value,'metric.value');required(m.label,'metric.label');});}
      else throw new Error('Unknown project block: '+b.type);
    });
  };
  projects.forEach(p=>{
    if (!/^[a-z][a-z0-9-]*$/.test(p.id || '') || seen.has(p.id)) throw new Error('Missing, unsafe or duplicate project id');
    seen.add(p.id);
    if(p.cover) photo(p.cover);
    if(p.priority && !['flagship','supporting'].includes(p.priority)) throw new Error('Unknown project priority');
    const d=p.details; if(!d) return;
    required(d.title,'details.title');required(d.lead,'details.lead');
    if(d.layout && d.layout!=='gallery') throw new Error('Unknown project layout');
    if(d.sections) {list(d.sections,'details.sections');d.sections.forEach(s=>{required(s.title,'section.title');blocks(s.blocks);});}
    if(d.flow) strings(d.flow,'details.flow');
    if(d.facts) strings(d.facts,'details.facts');
    if(d.cover) photo(d.cover);
    if(d.gallery) {list(d.gallery,'details.gallery');d.gallery.forEach(g=>{photo(g.image);required(g.title,'gallery.title');required(g.description,'gallery.description');if(g.link){required(g.link.label,'link.label');required(g.link.url,'link.url');safeUrl(g.link.url);}});}
    if(d.certificate) {for(const key of ['title','description','url','label']) required(d.certificate[key],'certificate.'+key);safeUrl(d.certificate.url);}
    if(d.reflection) {required(d.reflection.title,'reflection.title');blocks(d.reflection.blocks);}
  });
}

export function createCatalog(data) {
  const en={};
  const walk=(value,path='')=>{
    if(typeof value==='string') en[path]=value;
    else if(Array.isArray(value)) value.forEach((v,i)=>walk(v,path+'.'+(v?.id ?? i)));
    else if(value && typeof value==='object') Object.entries(value).forEach(([key,v])=>{if(key!=='locales' && key!=='seo') walk(v,path?path+'.'+key:key);});
  };
  walk(data);
  return {en,uz:data.locales?.uz || {},ru:data.locales?.ru || {}};
}
