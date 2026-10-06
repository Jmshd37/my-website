import { escapeHtml as e } from './html.mjs';

function table(headers, rows, caption, grading=false) {
  return `<div class="transcript-table-wrap"><table class="transcript-table${grading ? ' grading-table' : ''}"><caption class="sr-only">${e(caption)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>`<td>${i===(grading?1:2) ? `<span class="transcript-grade">${e(cell)}</span>` : e(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export function renderTranscript(t) {
  if (!t) return '';
  return `<dialog id="academic-transcript-panel" class="erp-panel transcript-panel" aria-labelledby="academic-transcript-title"><div class="erp-bar"><button type="button" class="erp-control" data-transcript-close>← Back to Education</button><button type="button" class="erp-control" data-transcript-close autofocus>× Close</button></div><div class="erp-content transcript-content"><p class="section-label">${e(t.label)}</p><h2 id="academic-transcript-title">${e(t.title)}</h2><p class="erp-subtitle">${e(t.subtitle)}</p><p class="erp-lead">${e(t.lead)}</p><div class="transcript-summary">${t.summary.map(s=>`<div><strong>${e(s.value)}</strong><span>${e(s.label)}</span></div>`).join('')}</div><div class="transcript-section-head"><p class="section-label">${e(t.courseworkLabel)}</p><h3>${e(t.courseworkTitle)}</h3></div>` +
    t.years.map(year=>`<section class="transcript-year"><div class="transcript-year-head"><span>Academic year</span><h3>${e(year.year)}</h3></div>${year.semesters.map(s=>`<section class="transcript-semester"><h4>${e(s.title)}</h4>${table(s.headers,s.rows,s.title)}</section>`).join('')}</section>`).join('') +
    `<section class="transcript-grading"><div class="transcript-section-head"><p class="section-label">${e(t.grading.label)}</p><h3>${e(t.grading.title)}</h3><p>${e(t.grading.note)}</p></div>${table(t.grading.headers,t.grading.rows,t.grading.title,true)}</section><button type="button" class="erp-control erp-back" data-transcript-close>← Back to Education</button></div></dialog>`;
}

export function validateTranscript(t) {
  if (!t) return;
  const required = (v,name)=>{if(typeof v!=='string'||!v.trim())throw new Error('transcript.'+name+' is required');};
  for(const key of ['label','title','subtitle','lead','courseworkLabel','courseworkTitle'])required(t[key],key);
  if(!Array.isArray(t.summary)||!Array.isArray(t.years))throw new Error('transcript summary and years must be arrays');
  t.summary.forEach(s=>{required(s.value,'summary.value');required(s.label,'summary.label');});
  const checkTable = table=>{
    if(!Array.isArray(table.headers)||table.headers.length!==4||!Array.isArray(table.rows))throw new Error('Transcript table must have four columns and rows');
    table.headers.forEach(h=>required(h,'header'));
    table.rows.forEach(row=>{if(!Array.isArray(row)||row.length!==4)throw new Error('Transcript row must have four cells');row.forEach(c=>required(c,'cell'));});
  };
  t.years.forEach(y=>{required(y.year,'year');if(!Array.isArray(y.semesters))throw new Error('Transcript semesters must be an array');y.semesters.forEach(s=>{required(s.title,'semester.title');checkTable(s);});});
  if(!t.grading)throw new Error('transcript.grading is required');
  for(const key of ['label','title','note'])required(t.grading[key],'grading.'+key);
  checkTable(t.grading);
}
