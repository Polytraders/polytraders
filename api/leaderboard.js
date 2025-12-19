export default async function handler(req, res) {
  try {
    const upstream =
      "https://693ee85255fb0d5e85311330-api.poof.new/api/leaderboard?period=daily&category=all";

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
