export default async function handler(req, res) {
  try {
    const traders = (req.query.traders || "").toString();
    const limitRaw = parseInt(req.query.limit || "50", 10);
    const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 50, 200);

    if (!traders) return res.status(400).json({ error: "missing_traders" });

    const upstreamBase = "https://693ee85255fb0d5e85311331-api.poof.new/api/trades";
    const upstream = `${upstreamBase}?traders=${encodeURIComponent(traders)}&limit=${limit}`;

    const r = await fetch(upstream, { headers: { accept: "application/json" } });

    if (!r.ok) {
      return res.status(502).json({ error: "upstream_failed", status: r.status });
    }

    const json = await r.json();
    res.status(200).json(json);
  } catch (e) {
    res.status(500).json({ error: "server_error", message: String(e?.message || e) });
  }
}
