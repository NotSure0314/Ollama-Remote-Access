const { normalizeTarget } = require("./_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const ac = new AbortController();
  res.on("close", () => ac.abort());

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { server: target, ...chatPayload } = body;
    const origin = normalizeTarget(target);

    const upstream = await fetch(origin + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chatPayload, stream: true }),
      signal: ac.signal,
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({
        error: text || `Ollama responded with HTTP ${upstream.status}.`,
      });
    }

    res.writeHead(200, {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    for await (const chunk of upstream.body) {
      res.write(chunk);
    }
    return res.end();
  } catch (e) {
    if (ac.signal.aborted && res.writableEnded) return;
    const msg = e.name === "TimeoutError" ? "Timed out connecting to the Ollama server."
      : e.cause && e.cause.code ? `Could not reach the server (${e.cause.code}).`
      : e.message;
    if (!res.headersSent) {
      return res.status(502).json({ error: msg });
    }
    return res.end();
  }
};
