import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ExternalLink, Filter, Trophy, X, Bookmark, Share2, DollarSign } from 'lucide-react';
import { fetchLeaderboard, fetchTrades } from '../lib/api';
import { formatProfit } from '../lib/format';

const LS_KEY = 'polytraders_tracked_v1';

function loadTracked() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveTracked(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

export default function LiveTradesPage() {
  const [liveTrades, setLiveTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [countdown, setCountdown] = useState(30);
  const [traderRankings, setTraderRankings] = useState({});
  const [top100Traders, setTop100Traders] = useState([]);
  const [selectedTraders, setSelectedTraders] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [trackedTrades, setTrackedTrades] = useState(() => loadTracked());
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedTradeForTracking, setSelectedTradeForTracking] = useState(null);
  const [trackPnL, setTrackPnL] = useState('');

  const tradersToFetch = useMemo(() => {
    if (selectedTraders.length) return selectedTraders;
    return top100Traders.map(t => t.address);
  }, [selectedTraders, top100Traders]);

  const fetchLeaderboardRankings = useCallback(async () => {
    try {
      const json = await fetchLeaderboard();
      const entries = json?.data?.entries || [];
      const top100 = entries.slice(0, 100);

      const rankings = {};
      const list = [];

      top100.forEach((t, index) => {
        const address = (t.walletAddress || t.address || '').toLowerCase();
        if (!address) return;
        rankings[address] = {
          rank: t.rank || index + 1,
          displayName: t.displayName || t.username || t.name,
          profit: t.profitLoss || t.profit || t.totalProfit || t.pnl
        };
        list.push({
          address,
          displayName: t.displayName || t.username || t.name || `Trader #${t.rank || index + 1}`,
          rank: t.rank || index + 1
        });
      });

      setTraderRankings(rankings);
      setTop100Traders(list);
      setSelectedTraders(prev => (prev.length ? prev : list.map(x => x.address)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchLiveTrades = useCallback(async () => {
    if (!tradersToFetch.length) return;

    if (liveTrades.length === 0) setLoading(true);
    setError(null);

    try {
      const encoded = tradersToFetch.join(',');
      const json = await fetchTrades({ traders: encoded, limit: 50 });
      const fetched = (json?.data?.trades || []).map(trade => ({
        ...trade,
        idKey: trade.id || trade.transactionHash,
        shares: trade.size || trade.amount || 0,
        outcome: trade.outcome || 'Unknown',
        eventTitle: trade.market || 'Unknown Market',
        marketSlug: trade.eventSlug || '',
        side: trade.side || 'Unknown',
        traderDisplayName: trade.traderName || trade.traderAddress || 'Unknown Trader',
        value: trade.amount || 0,
        icon: trade.icon || null
      }));

      setLiveTrades(prev => {
        const seen = new Set(prev.map(t => t.idKey));
        const news = fetched.filter(t => t.idKey && !seen.has(t.idKey));
        return [...news, ...prev].slice(0, 250);
      });
    } catch (e) {
      setError(e?.message || 'Failed to fetch live trades');
    } finally {
      setLoading(false);
    }
  }, [tradersToFetch, liveTrades.length]);

  useEffect(() => { fetchLeaderboardRankings(); }, [fetchLeaderboardRankings]);

  useEffect(() => {
    if (!top100Traders.length) return;

    fetchLiveTrades();
    setCountdown(30);

    const refresh = setInterval(() => {
      fetchLiveTrades();
      setCountdown(30);
    }, 30000);

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(refresh);
      clearInterval(timer);
    };
  }, [top100Traders, fetchLiveTrades]);

  function toggleTraderSelection(address) {
    setSelectedTraders(prev => prev.includes(address) ? prev.filter(a => a !== address) : [...prev, address]);
  }
  function selectAllTraders() { setSelectedTraders(top100Traders.map(t => t.address)); }
  function clearAllTraders() { setSelectedTraders([]); }

  function handleTrackTrade(trade) {
    setSelectedTradeForTracking(trade);
    setTrackPnL('');
    setShowTrackModal(true);
  }

  function saveTrackedTrade() {
    if (!selectedTradeForTracking) return;
    const pnl = Number(trackPnL);
    if (Number.isNaN(pnl)) return;

    const key = selectedTradeForTracking.idKey;
    const next = {
      ...trackedTrades,
      [key]: {
        tradeId: key,
        eventTitle: selectedTradeForTracking.eventTitle,
        side: selectedTradeForTracking.side,
        outcome: selectedTradeForTracking.outcome,
        shares: selectedTradeForTracking.shares,
        entryAmount: selectedTradeForTracking.value,
        profitLoss: pnl,
        marketSlug: selectedTradeForTracking.marketSlug,
        traderName: selectedTradeForTracking.traderDisplayName,
        icon: selectedTradeForTracking.icon,
        savedAt: Date.now()
      }
    };

    setTrackedTrades(next);
    saveTracked(next);
    setShowTrackModal(false);
    setSelectedTradeForTracking(null);
  }

  function shareOnX(tracked) {
    const pnl = tracked.profitLoss >= 0 ? `+${tracked.profitLoss.toFixed(2)}` : `-${Math.abs(tracked.profitLoss).toFixed(2)}`;
    const emoji = tracked.profitLoss >= 0 ? '🚀' : '📉';
    const text =
      `${emoji} Just closed a ${tracked.side} position on "${tracked.eventTitle}" with ${pnl} P&L using PolyTraders.\n\nTrack top traders and copy their moves.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="container">
      <div style={{ textAlign:'center', margin:'14px 0 14px 0' }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Watch the Whales’ Every Move in Real-Time</div>
        <div className="small">Catch the market before it catches up! 🌊</div>

        <div style={{ marginTop: 10, display:'flex', gap: 10, justifyContent:'center', flexWrap:'wrap' }}>
          <div className="pill" style={{ padding:'8px 12px', display:'inline-flex', alignItems:'center', gap: 8 }}>
            <span className="small" style={{ fontWeight: 900 }}>Next refresh in:</span>
            <span style={{ fontWeight: 1000, color:'var(--purple)' }}>{countdown}s</span>
          </div>

          <button className="btn btn-purple"
            onClick={() => setShowFilterModal(true)}
            style={{ display:'inline-flex', alignItems:'center', gap: 10 }}>
            <Filter size={18} />
            Filter ({selectedTraders.length})
          </button>
        </div>
      </div>

      {showFilterModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', padding: 14, zIndex: 220
        }}>
          <div className="card" style={{ width:'min(860px, 96vw)', maxHeight:'78vh', overflow:'auto', padding: 18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div className="h1" style={{ fontSize: 18, fontWeight: 1000 }}>Select Traders to Track</div>
              <button className="btn btn-ghost" onClick={() => setShowFilterModal(false)} style={{ padding:'10px 12px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display:'flex', gap: 10, marginTop: 14 }}>
              <button className="btn btn-teal" onClick={selectAllTraders}>Select All</button>
              <button className="btn btn-purple" onClick={clearAllTraders}>Clear All</button>
            </div>

            <div style={{ display:'grid', gap: 10, marginTop: 14 }}>
              {top100Traders.map(t => {
                const checked = selectedTraders.includes(t.address);
                return (
                  <div key={t.address}
                    className="pill"
                    style={{ padding: 12, boxShadow: checked ? 'var(--shadow-inset-small)' : 'var(--shadow-extruded-small)' }}>
                    <label style={{ display:'flex', alignItems:'center', gap: 12, cursor:'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTraderSelection(t.address)}
                      />
                      <div style={{ display:'flex', gap: 10, minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 1000, color:'var(--purple)' }}>#{t.rank}</div>
                        <div style={{ fontWeight: 800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {t.displayName}
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 14 }}>
              <button className="btn btn-purple" onClick={() => setShowFilterModal(false)} style={{ width:'100%' }}>
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: 16, textAlign:'center' }}>
          <div style={{ color:'var(--purple)', fontWeight: 1000 }}>Error: {error}</div>
          <div className="small">Failed to fetch live trade data.</div>
        </div>
      )}

      {loading && !error && (
        <div style={{ display:'flex', justifyContent:'center', padding: 34 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, boxShadow:'var(--shadow-inset)', background:'var(--bg)' }} />
        </div>
      )}

      {!loading && !error && liveTrades.length === 0 && (
        <div className="card" style={{ padding: 22, textAlign:'center' }}>
          <div style={{ fontWeight: 1000 }}>No live trades found</div>
          <div className="small">The market is quiet... too quiet.</div>
        </div>
      )}

      {!loading && !error && liveTrades.length > 0 && (
        <div className="grid">
          {liveTrades.map((trade, index) => {
            const polymarketUrl = trade.marketSlug ? `https://polymarket.com/event/${trade.marketSlug}` : `https://polymarket.com`;
            const addr = (trade.traderAddress || '').toLowerCase();
            const rankInfo = traderRankings[addr];
            const tracked = trackedTrades[trade.idKey];

            return (
              <div key={trade.idKey || index} className="card" style={{ padding: 16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap: 12, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', gap: 14, minWidth: 280, flex: 1 }}>
                    {trade.icon && (
                      <img
                        src={trade.icon}
                        alt=""
                        style={{ width: 88, height: 88, borderRadius: 18, objectFit:'cover', boxShadow:'var(--shadow-extruded-small)' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:'flex', gap: 10, flexWrap:'wrap', alignItems:'center' }}>
                        <div style={{
                          padding:'6px 10px', borderRadius: 14, fontWeight: 1000,
                          background: trade.side === 'BUY' ? 'var(--teal)' : 'var(--purple)',
                          color:'white', boxShadow:'var(--shadow-extruded-small)'
                        }}>
                          {trade.side === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
                        </div>
                        <div className="pill" style={{ padding:'6px 10px', boxShadow:'var(--shadow-inset-small)' }}>
                          <span style={{ fontWeight: 900 }}>{trade.outcome}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: 10, display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap' }}>
                        <span className="small" style={{ fontWeight: 900 }}>Trader</span>
                        {rankInfo && (
                          <span className="pill" style={{ padding:'6px 10px', display:'inline-flex', alignItems:'center', gap: 8 }}>
                            <Trophy size={16} color="var(--purple)" />
                            <span style={{ fontWeight: 1000, color:'var(--purple)' }}>#{rankInfo.rank}</span>
                          </span>
                        )}
                      </div>

                      <div className="h1" style={{ fontSize: 18, fontWeight: 1000, marginTop: 6, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {trade.traderDisplayName || trade.traderAddress || 'Unknown Trader'}
                      </div>

                      <div className="small" style={{ marginTop: 8, fontWeight: 900 }}>Event Market</div>
                      <div style={{ fontWeight: 900, marginTop: 4 }}>
                        {trade.eventTitle}
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                        <div className="pill" style={{ padding: 10, boxShadow:'var(--shadow-extruded-small)' }}>
                          <div className="small">Shares</div>
                          <div style={{ fontWeight: 1000 }}>{Number(trade.shares || 0).toLocaleString()}</div>
                        </div>
                        <div className="pill" style={{ padding: 10, boxShadow:'var(--shadow-extruded-small)' }}>
                          <div className="small">Amount</div>
                          <div style={{ fontWeight: 1000, color:'var(--purple)' }}>{formatProfit(trade.value || 0)}</div>
                        </div>
                        <div className="pill" style={{ padding: 10, boxShadow:'var(--shadow-extruded-small)' }}>
                          <div className="small">Price</div>
                          <div style={{ fontWeight: 1000, color:'var(--teal)' }}>{formatProfit(trade.price || 0)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap: 10, justifyContent:'flex-end', flexWrap:'wrap', alignItems:'end' }}>
                    {!tracked && (
                      <button className="btn btn-teal" onClick={() => handleTrackTrade(trade)} style={{ display:'inline-flex', alignItems:'center', gap: 10 }}>
                        <Bookmark size={18} />
                        Track Trade
                      </button>
                    )}

                    {tracked && (
                      <div style={{ display:'flex', gap: 10, alignItems:'center', flexWrap:'wrap' }}>
                        <div className="pill" style={{ padding:'8px 12px', display:'inline-flex', alignItems:'center', gap: 10 }}>
                          <DollarSign size={18} color="var(--teal)" />
                          <span style={{ fontWeight: 1000, color: tracked.profitLoss >= 0 ? 'var(--teal)' : 'var(--purple)' }}>
                            {tracked.profitLoss >= 0 ? '+' : ''}{formatProfit(tracked.profitLoss)}
                          </span>
                        </div>

                        <button className="btn"
                          onClick={() => shareOnX(tracked)}
                          style={{ background:'#1DA1F2', color:'white', display:'inline-flex', alignItems:'center', gap: 10 }}>
                          <Share2 size={18} />
                          Share
                        </button>
                      </div>
                    )}

                    <a className="btn btn-purple" href={polymarketUrl} target="_blank" rel="noreferrer"
                       style={{ display:'inline-flex', alignItems:'center', gap: 10 }}>
                      Trade on Polymarket <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showTrackModal && selectedTradeForTracking && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', padding: 14, zIndex: 230
        }}>
          <div className="card" style={{ width:'min(620px, 96vw)', padding: 18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div className="h1" style={{ fontSize: 18, fontWeight: 1000 }}>Track Trade</div>
              <button className="btn btn-ghost" onClick={() => setShowTrackModal(false)} style={{ padding:'10px 12px' }}>
                <X size={18} />
              </button>
            </div>

            <div className="pill" style={{ marginTop: 14, padding: 12 }}>
              <div className="small" style={{ fontWeight: 900 }}>Trade Details</div>
              <div style={{ fontWeight: 1000, marginTop: 6 }}>{selectedTradeForTracking.eventTitle}</div>
              <div style={{ display:'flex', gap: 10, marginTop: 10, flexWrap:'wrap' }}>
                <span style={{
                  padding:'6px 10px', borderRadius: 14, fontWeight: 1000,
                  background: selectedTradeForTracking.side === 'BUY' ? 'var(--teal)' : 'var(--purple)',
                  color:'white'
                }}>
                  {selectedTradeForTracking.side}
                </span>
                <span className="pill" style={{ padding:'6px 10px' }}>
                  <span style={{ fontWeight: 900 }}>{selectedTradeForTracking.outcome}</span>
                </span>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="small" style={{ fontWeight: 900, marginBottom: 8 }}>Profit/Loss ($)</div>
              <input
                value={trackPnL}
                onChange={(e) => setTrackPnL(e.target.value)}
                type="number"
                step="0.01"
                placeholder="e.g., 150.50 or -75.25"
                style={{
                  width:'100%',
                  border:'none',
                  outline:'none',
                  padding:'12px 14px',
                  borderRadius: 18,
                  background:'var(--bg)',
                  boxShadow:'var(--shadow-inset)',
                  fontWeight: 900,
                  color:'var(--text)'
                }}
              />
            </div>

            <div style={{ display:'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowTrackModal(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btn-purple" onClick={saveTrackedTrade} style={{ flex: 1 }}>
                Save Trade
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign:'center', margin:'18px 0 8px' }}>
        <div style={{ fontWeight: 1000 }}>⚡ Real-time Trades</div>
        <div className="small">⚠️ Not financial advice. DYOR before copying anyone.</div>
      </div>
    </div>
  );
}
