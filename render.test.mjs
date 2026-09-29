import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { render, validate, safeUrl } from "./render.mjs";
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

