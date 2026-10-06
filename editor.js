import { render, validate } from "./render.mjs";
import { discoveryFiles } from './seo.mjs';
let draft;
let dirty = false;
let counter = 0;
const form = document.querySelector("#editor");
const status = document.querySelector("#editor-status");
const preview = document.querySelector("#preview");
const controls = ["preview-button","download-content","download-page","download-robots","download-sitemap"].map(id => document.getElementById(id));
const labelFor = key => key.replace(/([a-z])([A-Z])/g,"$1 $2").replace(/^./,char => char.toUpperCase());
function changed() {
  dirty = true;
  status.textContent = "Unsaved edits. Update the preview, then download both files.";
}
function editorFor(value, key, set, root = false) {
  if (Array.isArray(value)) {
    const group = document.createElement("details");
    group.open = root;
    const summary = document.createElement("summary");
    summary.textContent = labelFor(key) + " (" + value.length + ")";
    group.append(summary);
    value.forEach((item,index) => {
      const row = document.createElement("div"); row.className = "item";
      row.append(editorFor(item,String(index+1),next => { value[index] = next; }));
      const actions = document.createElement("div"); actions.className = "actions";
      [["Move up",-1],["Move down",1],["Remove",0]].forEach(([text,delta]) => {
        const button = document.createElement("button"); button.type = "button"; button.textContent = text;
        button.setAttribute("aria-label", text + " " + key + " item " + (index+1));
        button.disabled = delta !== 0 && (index+delta < 0 || index+delta >= value.length);
        button.addEventListener("click", () => {
          if (delta) [value[index],value[index+delta]] = [value[index+delta],value[index]];
          else value.splice(index,1);
          changed(); refreshForm(key);
        });
        actions.append(button);
      });
      row.append(actions); group.append(row);
    });
    const add = document.createElement("button"); add.type = "button";
    add.textContent = "Add " + labelFor(key);
    add.addEventListener("click", () => {
      const examples = {
        experience:{period:"New period",role:"New role",company:"Company",description:"Describe your responsibilities.",tags:[]},
        projects:{id:"project-" + Date.now(),title:"New project",category:"Research",meta:"Project context",description:"Describe your work.",tags:[],featured:false,url:""},
        skills:{title:"New skill group",items:[]},
        courses:{name:"Course name",grade:"Grade"},
        stats:{value:"Value",label:"Label"},
        sections:{id:"about",label:"About",enabled:false}
      };
      const next = examples[key] || (value[0] && typeof value[0] === "object" ? structuredClone(value[0]) : "New item");
      value.push(structuredClone(next)); changed(); refreshForm(key);
    });
    group.append(add); return group;
  }
  if (value && typeof value === "object") {
    const group = document.createElement("details"); group.open = root;
    const summary = document.createElement("summary");
    summary.textContent = /^\d+$/.test(key) ? (value.title || value.role || value.name || labelFor(key)) : labelFor(key);
    group.append(summary);
    Object.entries(value).forEach(([child,item]) => group.append(editorFor(item,child,next => { value[child] = next; })));
    return group;
  }
  const label = document.createElement("label");
  const field = document.createElement(typeof value === "string" && (value.length > 100 || ["description","intro","focus"].includes(key)) ? "textarea" : "input");
  field.id = "field-" + counter++;
  label.htmlFor = field.id; label.append(document.createTextNode(labelFor(key)));
  if (typeof value === "boolean") { field.type = "checkbox"; field.checked = value; }
  else { field.value = value ?? ""; }
  field.addEventListener("input", () => { set(field.type === "checkbox" ? field.checked : typeof value === "number" ? Number(field.value) : field.value); changed(); });
  label.append(field); return label;
}
function refreshForm(openKey) {
  const open = new Set([...form.querySelectorAll(":scope > details[open]")].map(node => node.dataset.key));
  if (openKey) open.add(openKey);
  form.replaceChildren(); counter = 0;
  Object.entries(draft).forEach(([key,value]) => {
    const group = editorFor(value,key,next => { draft[key] = next; });
    group.dataset.key = key;
    group.open = open.has(key);
    form.append(group);
  });
}
function valid() {
  try { validate(draft); return true; }
  catch (error) { status.textContent = "Please fix: " + error.message; return false; }
}
function updatePreview() {
  if (!valid()) return;
  preview.srcdoc = render(draft);
  status.textContent = "Preview updated. Download both files to keep your edits.";
}
function download(name,content,type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement("a"); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000);
  status.textContent = name + " downloaded. Remember to download the other file too.";
}
document.getElementById("preview-button").addEventListener("click", updatePreview);
document.getElementById("download-content").addEventListener("click", () => {
  if (valid()) download("content.json",JSON.stringify(draft,null,2) + "\n","application/json");
});
document.getElementById("download-page").addEventListener("click", () => {
  if (valid()) download("index.html",render(draft),"text/html");
});
document.getElementById('download-robots').addEventListener('click',()=>{
  if(valid()) download('robots.txt',discoveryFiles(draft).robots,'text/plain');
});
document.getElementById('download-sitemap').addEventListener('click',()=>{
  if(valid()) download('sitemap.xml',discoveryFiles(draft).sitemap,'application/xml');
});
document.getElementById("import").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text()); validate(data);
    draft = data; refreshForm(); changed(); updatePreview();
    controls.forEach(button => { button.disabled = false; });
  } catch(error) { status.textContent = "Import failed: " + error.message; }
});
window.addEventListener("beforeunload",event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
try {
  const response = await fetch("./content.json", {cache:"no-store"});
  if (!response.ok) throw new Error("Content could not be loaded.");
  draft = validate(await response.json()); refreshForm("profile"); updatePreview();
  controls.forEach(button => { button.disabled = false; });
  status.textContent = "Ready. Expand a section to edit; changes are not saved automatically.";
} catch(error) {
  status.textContent = error.message + " Open the editor through a local web server or your hosted website.";
}
