// Shared utilities for Ollama proxy endpoints on Vercel and local server
function normalizeTarget(input) {
  let s = String(input || "").trim();
  if (!s) throw new Error("Enter a server address.");
  if (!/^https?:\/\//i.test(s)) s = "http://" + s;
  const u = new URL(s);
  if (!u.port && u.protocol === "http:") u.port = "11434";
  return u.origin;
}

function checkAuth(req) {
  const secret = process.env.ACCESS_PASSWORD;
  if (!secret) return true; // If not configured in environment, allow through
  const provided = req.headers["x-access-key"] || (req.headers["authorization"] ? req.headers["authorization"].replace(/^Bearer\s+/i, "") : "");
  return provided === secret;
}

module.exports = {
  normalizeTarget,
  checkAuth,
};
