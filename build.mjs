import { readFile, writeFile } from "node:fs/promises";
import { render } from "./render.mjs";
const root = new URL("./", import.meta.url);
const data = JSON.parse(await readFile(new URL("content.json", root), "utf8"));
const html = render(data);
await writeFile(new URL("index.html", root), html);
console.log("Built index.html from content.json.");

