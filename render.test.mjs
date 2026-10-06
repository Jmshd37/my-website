import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { render, validate, safeUrl } from "./render.mjs";
import { renderProjectPanel, createCatalog } from './projects.mjs';
import { discoveryFiles } from './seo.mjs';
import { access, readdir } from 'node:fs/promises';
const original = JSON.parse(await readFile(new URL("./content.json", import.meta.url),"utf8"));
test("static output includes full CV and matching navigation", () => {
  const html = render(original,2026);
  for (const section of original.sections) {
    assert.ok(html.includes('id="' + section.id + '"'));
    assert.ok(html.includes('href="#' + section.id + '"'));
  }
  for (const item of original.experience) assert.ok(html.includes(item.company.replaceAll("&","&amp;")));
  for (const project of original.projects) assert.ok(html.includes(project.title.replaceAll("&","&amp;")));
  assert.equal((html.match(/<h1 /g)||[]).length,1);
});
test("section order and visibility control both content and navigation", () => {
  const data=structuredClone(original);
  data.sections.reverse();
  data.sections.find(section=>section.id==="projects").enabled=false;
  const html=render(data);
  assert.ok(!html.includes('id="projects"'));
  assert.ok(!html.includes('href="#projects"'));
  assert.ok(html.indexOf('id="contact"')<html.indexOf('id="experience"'));
});
test("editing text cannot inject HTML or structured-data script", () => {
  const data=structuredClone(original);
  data.profile.firstName='</script><img src=x onerror=alert(1)>';
  data.projects[0].title='" onclick="bad <script>';
  const html=render(data);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x'));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.ok(schema.name.startsWith('</script>'));
});
test("unsafe links and duplicate sections fail clearly", () => {
  for (const link of ["javascript:alert(1)","//example.com","data:text/html,test","../secret"]) assert.throws(()=>safeUrl(link));
  assert.equal(safeUrl("https://example.com/project"),"https://example.com/project");
  assert.equal(safeUrl("assets/cv.pdf"),"assets/cv.pdf");
  assert.equal(safeUrl("assets/HKUST(GZ).pdf"),"assets/HKUST(GZ).pdf");
  const data=structuredClone(original);
  data.sections.push(data.sections[0]);
  assert.throws(()=>validate(data),/duplicate section/);
});
test("optional links and empty collections remain valid", () => {
  const data=structuredClone(original);
  data.profile.resumeUrl="assets/cv.pdf";
  data.projects=[];data.experience=[];data.skills=[];
  const html=render(data);
  assert.ok(html.includes('href="assets/cv.pdf"'));
  assert.ok(html.includes("Download CV"));
  assert.ok(!html.includes("undefined"));
});
test("all-category filter label is reserved", () => {
  const data=structuredClone(original);data.projects[0].category="All";
  assert.throws(()=>validate(data),/reserved/);
});

test('case studies are data-driven and remain editable without title matching', () => {
  const data=structuredClone(original);
  data.projects[0].title='A renamed study';
  data.projects[0].details.title='An editable detail title';
  const html=render(data);
  assert.ok(html.includes('An editable detail title'));
  assert.ok(html.includes('aria-controls="project-erp-panel"'));
  const project={id:'future',title:'Future work',category:'Research',meta:'Context',description:'Summary',tags:[],featured:false,details:{title:'Future detail',lead:'Documented work',sections:[]}};
  data.projects.push(project);
  assert.ok(render(data).includes('id="project-future-panel"'));
});

test('project schema rejects duplicate IDs, incomplete sections, unsafe galleries and links', () => {
  for(const mutate of [
    d=>d.projects[1].id=d.projects[0].id,
    d=>delete d.projects[0].id,
    d=>delete d.projects[0].details.lead,
    d=>d.projects[0].details.sections[0].blocks=[{type:'html',html:'<script>'}],
    d=>d.projects[0].details.sections[0].blocks=[{type:'paragraph',parts:[{text:'Bad link',url:'javascript:alert(1)'}]}],
    d=>d.projects.find(p=>p.cover).cover.src='//evil.test/image',
    d=>d.projects.find(p=>p.cover).cover.width=0
  ]) {const d=structuredClone(original);mutate(d);assert.throws(()=>render(d));}
});

test('URL safety rejects encoded traversal, credentials and malformed URLs',()=>{
  for(const url of ['assets/%2e%2e/private.pdf','assets/%5cfile','https://user:secret@example.com/','https://','https://example.com/"onclick="bad','assets/%00.pdf']) assert.throws(()=>safeUrl(url),url);
  assert.equal(safeUrl('assets/Recommendation%20letter.pdf'),'assets/Recommendation%20letter.pdf');
});

test('project blocks escape text and embedded catalogs cannot close their script',()=>{
  const data=structuredClone(original);
  data.projects[0].details.sections[0].blocks=[{type:'paragraph',parts:[{text:'<img src=x onerror=bad>'}]}];
  data.locales.uz['profile.intro']='</script><script>alert(1)</script>';
  const html=render(data);
  assert.ok(!html.includes('<img src=x'));
  const catalog=JSON.parse(html.match(/<script type="application\/json" id="site-catalog">([\s\S]*?)<\/script>/)[1]);
  assert.equal(catalog.uz['profile.intro'],data.locales.uz['profile.intro']);
});

test('rendered IDs, dialog labels, anchors and external link protections agree',()=>{
  const html=render(original), ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const m of html.matchAll(/(?:aria-controls|aria-labelledby|href)="#?([a-z][a-z0-9-]+)"/g)) assert.ok(ids.includes(m[1]),m[1]);
  for(const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(m[0],/rel="noopener noreferrer"/);
  for(const m of html.matchAll(/<th\b[^>]*>/g)) assert.match(m[0],/scope="col"/);
});

test('SEO uses one confirmed canonical page and valid Person JSON',()=>{
  const html=render(original);
  assert.match(html,/<link rel="canonical" href="https:\/\/jmshd37.github.io\/my-website\/">/);
  assert.ok(!html.includes('hreflang='));
  for(const field of ['og:url','og:image','og:locale','twitter:title','twitter:description','twitter:image']) assert.ok(html.includes('"'+field+'"'));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@type'],'Person');assert.equal(schema.alumniOf.name,original.education.university);
  assert.equal(schema.knowsLanguage.length,3);
  const files=discoveryFiles(original);assert.ok(files.robots.includes('/my-website/sitemap.xml'));assert.ok(!files.sitemap.includes('?lang='));
  const data=structuredClone(original);data.seo.canonicalUrl='https://example.com/?lang=ru';assert.throws(()=>render(data));
});

test('new and strengthened professional content has all three languages',()=>{
  const catalog=createCatalog(original);
  const keys=['profile.role','profile.intro','profile.focus',...original.experience.map((_,i)=>`experience.${i}.description`),...Object.keys(catalog.en).filter(k=>k.startsWith('projects.magmastore.details') && !k.endsWith('.type'))];
  for(const key of keys) for(const lang of ['en','uz','ru']) assert.ok(catalog[lang][key],lang+': '+key);
});

test('optional project details and absent CV do not create empty windows or downloads',()=>{
  const d=structuredClone(original);d.projects.forEach(p=>delete p.details);d.profile.resumeUrl='';
  assert.equal(renderProjectPanel(d.projects[0]),'');
  const html=render(d);assert.ok(!html.includes('data-project-open'));assert.ok(!html.includes('download>Download CV'));
  d.profile.resumeUrl='assets/Jamshidbek-Nurmukhammadov-CV.pdf';
  assert.match(render(d),/href="assets\/Jamshidbek-Nurmukhammadov-CV.pdf" download/);
  assert.match(render(d),/print-button text-button/);
});

test('existing JN moon branding and academic facts survive every rebuild',()=>{
  const html=render(original);
  assert.match(html,/<img class="brand-logo" src="assets\/jn-moon-logo.webp"/);
  assert.equal(original.transcript.years.length,4);
  assert.equal(original.transcript.summary[0].value,'4.01 / 4.5');
  assert.equal(original.transcript.summary[1].value,'248 ECTS');
  assert.ok(!JSON.stringify(original.transcript).includes('â'));
  assert.ok(html.includes('~$120k')&&html.includes('~$68k')&&html.includes('~21 mo.'));
  assert.ok(html.includes('not audited results'));
  assert.ok(html.includes('its name is not disclosed publicly'));
  assert.ok(!html.match(/class="hero-socials">([\s\S]*?)<\/div>/)[1].includes('href="tel:'));
});

test('all generated local assets and linked documents exist with exact filename casing',async()=>{
  const html=render(original);
  const paths=new Set([...html.matchAll(/(?:src|href)="(assets\/[^"?]+)(?:\?[^"\s]*)?"/g)].map(m=>m[1]));
  for(const path of paths) {
    await access(new URL(path,import.meta.url));
    let parent=new URL('./',import.meta.url);
    for(const segment of decodeURIComponent(path).split('/')) {
      assert.ok((await readdir(parent)).includes(segment),'Exact case: '+path);
      parent=new URL(encodeURIComponent(segment)+'/',parent);
    }
  }
  for(const p of original.projects.filter(p=>p.cover)) assert.ok(html.includes('loading="lazy"'));
});

test('malformed transcript rows fail before replacing the generated page',()=>{
  const data=structuredClone(original);data.transcript.years[0].semesters[0].rows[0].pop();
  assert.throws(()=>render(data),/four cells/);
});

