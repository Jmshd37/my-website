import { readFile, writeFile } from "node:fs/promises";
import { render } from "./render.mjs";
import { discoveryFiles } from "./seo.mjs";
const root = new URL("./", import.meta.url);
const data = JSON.parse(await readFile(new URL("content.json", root), "utf8"));
const html = render(data);
await writeFile(new URL("index.html", root), html);
const {robots, sitemap} = discoveryFiles(data);
await writeFile(new URL("robots.txt", root), robots);
await writeFile(new URL("sitemap.xml", root), sitemap);
console.log("Built index.html, robots.txt and sitemap.xml from content.json.");

