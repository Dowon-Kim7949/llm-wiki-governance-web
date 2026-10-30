// Serves out/ the way GitHub Pages does: under an optional base path,
// directory URLs resolve to index.html, and unknown paths get 404.html with a
// 404 status. Used by the browser tests; not a production server.
//   PORT=4173 NEXT_PUBLIC_BASE_PATH=/llm-wiki-governance-web node scripts/serve-out.mjs
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";

const root = join(process.cwd(), "out");
const port = Number(process.env.PORT ?? 4173);
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".ico": "image/x-icon",
};

function send(res, status, file) {
  res.writeHead(status, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let path = decodeURIComponent(url.pathname);
  if (base) {
    if (path === base) {
      res.writeHead(301, { location: `${base}/` });
      return res.end();
    }
    if (!path.startsWith(`${base}/`)) return send(res, 404, join(root, "404.html"));
    path = path.slice(base.length);
  }
  const file = normalize(join(root, path));
  if (!file.startsWith(root + sep) && file !== root) return send(res, 404, join(root, "404.html"));
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith("/")) {
      res.writeHead(301, { location: `${base}${path}/` });
      return res.end();
    }
    const index = join(file, "index.html");
    if (existsSync(index)) return send(res, 200, index);
  } else if (existsSync(file)) {
    return send(res, 200, file);
  }
  return send(res, 404, join(root, "404.html"));
}).listen(port, () => {
  console.log(`serving out/ at http://localhost:${port}${base}/`);
});
