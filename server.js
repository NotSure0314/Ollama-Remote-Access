// Prototype proxy: serves index.html and forwards chat requests to any Ollama address.
// No SSRF protection on purpose (prototype). Requires Node 18+.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

// "192.168.1.50" -> "http://192.168.1.50:11434"
function normalizeTarget(input) {
  let s = String(input || "").trim();
  if (!s) throw new Error("Enter a server address.");
  if (!/^https?:\/\//i.test(s)) s = "http://" + s;
  const u = new URL(s);
  if (!u.port && u.protocol === "http:") u.port = "11434";
  return u.origin;
}

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
  }

  const isTags = req.url === "/api/tags" || req.url === "/proxy/tags";
  const isChat = req.url === "/api/chat" || req.url === "/proxy/chat";

  if (req.method === "POST" && (isTags || isChat)) {
    const ac = new AbortController();
    res.on("close", () => ac.abort());

    try {
      const { server: target, ...body } = await readJson(req);
      const origin = normalizeTarget(target);

      if (isTags) {
        const r = await fetch(origin + "/api/tags", {
          signal: AbortSignal.any([ac.signal, AbortSignal.timeout(8000)]),
        });
        if (!r.ok) throw new Error(`Ollama responded with ${r.status}.`);
        return sendJson(res, 200, await r.json());
      }

      const upstream = await fetch(origin + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, stream: true }),
        signal: ac.signal,
      });
      if (!upstream.ok) {
        const text = await upstream.text();
        return sendJson(res, upstream.status, { error: text || `Ollama responded with ${upstream.status}.` });
      }
      res.writeHead(200, { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" });
      for await (const chunk of upstream.body) res.write(chunk);
      return res.end();
    } catch (e) {
      if (ac.signal.aborted && res.writableEnded) return;
      const msg = e.name === "TimeoutError" ? "Timed out reaching the server."
        : e.cause && e.cause.code ? `Could not reach the server (${e.cause.code}).`
        : e.message;
      if (!res.headersSent) return sendJson(res, 502, { error: msg });
      return res.end();
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => console.log(`Open http://localhost:${PORT}`));
