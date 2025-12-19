export async function fetchLeaderboard() {
  const r = await fetch('/api/leaderboard');
  if (!r.ok) throw new Error('Failed to fetch leaderboard');
  return r.json();
}

export async function fetchTrades({ traders, limit = 50 }) {
  const qs = new URLSearchParams({ traders, limit: String(limit) });
  const r = await fetch(`/api/trades?${qs.toString()}`);
  if (!r.ok) throw new Error('Failed to fetch trades');
  return r.json();
}
