import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;

// Upstream endpoints (your current ones)
const UPSTREAM_LEADERBOARD =
  "https://693ee85255fb0d5e85311330-api.poof.new/api/leaderboard?period=daily&category=all";

const UPSTREAM_TRADES =
  "https://693ee85255fb0d5e85311331-api.poof.new/api/trades";

function safeText(s, max = 5000) {
  const str = typeof s === "string" ? s : JSON.stringify(s);
  return str.slice(0, max);
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/leaderboard", async (_req, res) => {
  try {
    const r = await fetch(UPSTREAM_LEADERBOARD, {
      headers: { "accept": "application/json" }
    });
    if (!r.ok) {
      return res.status(502).json({ error: "upstream_failed", status: r.status });
    }
    const json = await r.json();
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: "server_error", message: safeText(e?.message) });
  }
});

app.get("/api/trades", async (req, res) => {
  try {
    const traders = (req.query.traders || "").toString();
    const limit = Math.min(parseInt(req.query.limit || "50", 10) || 50, 200);

    if (!traders) return res.status(400).json({ error: "missing_traders" });

    const url = `${UPSTREAM_TRADES}?traders=${encodeURIComponent(traders)}&limit=${limit}`;

    const r = await fetch(url, {
      headers: { "accept": "application/json" }
    });
    if (!r.ok) {
      return res.status(502).json({ error: "upstream_failed", status: r.status });
    }
    const json = await r.json();
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: "server_error", message: safeText(e?.message) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
