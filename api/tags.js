const { normalizeTarget } = require("./_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const target = body.server;
    const origin = normalizeTarget(target);

    const r = await fetch(origin + "/api/tags", {
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: `Ollama responded with HTTP ${r.status}.` });
    }

    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    const msg = e.name === "TimeoutError" ? "Timed out connecting to the Ollama server."
      : e.cause && e.cause.code ? `Could not reach the server (${e.cause.code}).`
      : e.message;
    return res.status(502).json({ error: msg });
  }
};
