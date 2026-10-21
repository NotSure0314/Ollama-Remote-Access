function normalizeTarget(input) {
  let s = String(input || "").trim();
  if (!s) throw new Error("Enter a server address.");
  if (!/^https?:\/\//i.test(s)) s = "http://" + s;
  const u = new URL(s);
  if (!u.port && u.protocol === "http:") u.port = "11434";
  return u.origin;
}

module.exports = {
  normalizeTarget,
};
