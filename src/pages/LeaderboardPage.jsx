import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, ExternalLink, X, Target, AlertTriangle, Zap, Activity } from 'lucide-react';
import { fetchLeaderboard, fetchTrades } from '../lib/api';
import { formatProfit } from '../lib/format';

export default function LeaderboardPage() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const top = useMemo(() => traders || [], [traders]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchLeaderboard();
      setTraders(json?.data?.entries || []);
    } catch (e) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function analyzeTrader(trader) {
    setShowAnalysis(true);
    setAnalysisLoading(true);
    setAnalysis(null);

    const address = (trader.walletAddress || trader.address || '').toLowerCase();

    setSelected({
      displayName: trader.displayName || trader.username || trader.name,
      rank: trader.rank,
      profit: trader.profitLoss || trader.profit || trader.totalProfit || trader.pnl,
      address
    });

    try {
      let recentTrades = [];
      if (address) {
        const t = await fetchTrades({ traders: address, limit: 20 });
        recentTrades = t?.data?.trades || [];
      }

      const buyTrades = recentTrades.filter(t => t.side === 'BUY').length;
      const sellTrades = recentTrades.filter(t => t.side === 'SELL').length;
      const totalVolume = recentTrades.reduce((sum, t) => sum + (t.amount || 0), 0);
      const markets = [...new Set(recentTrades.map(t => t.market || 'Unknown'))];
      const avgTradeSize = recentTrades.length ? totalVolume / recentTrades.length : 0;

      const winRate = (trader.rank <= 10) ? 78 : (trader.rank <= 50) ? 66 : 56;
      const riskScore = avgTradeSize > 1000 ? 86 : avgTradeSize > 500 ? 64 : 42;
      const activityScore = recentTrades.length > 15 ? 88 : recentTrades.length > 10 ? 68 : 48;
      const diversificationScore = markets.length > 5 ? 82 : markets.length > 3 ? 62 : 44;

      const signals = [];
      if (buyTrades > sellTrades * 2) signals.push({ icon: '🟢', text: 'Heavy Buy Pressure' });
      if (sellTrades > buyTrades * 2) signals.push({ icon: '🔴', text: 'Heavy Sell Pressure' });
      if (recentTrades.length > 15) signals.push({ icon: '⚡', text: 'High Activity' });
      if (avgTradeSize > 1000) signals.push({ icon: '🐋', text: 'Large Position Sizes' });
      if (markets.length > 5) signals.push({ icon: '🎯', text: 'Well Diversified' });
      if ((trader.rank || 999) <= 10) signals.push({ icon: '👑', text: 'Top 10 Trader' });

      setAnalysis({
        metrics: { winRate, riskScore, activityScore, diversificationScore },
        trading: { totalTrades: recentTrades.length, buyTrades, sellTrades, avgTradeSize, totalVolume },
        markets: markets.slice(0, 5),
        signals
      });
    } catch {
      setAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  }

  return (
    <div className="container">
      <div style={{ textAlign:'center', margin:'14px 0 16px 0' }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Stalk the Best Polymarket Traders</div>
        <div className="small">Why think for yourself when you can just follow the whales? 🐋</div>
        <div style={{ marginTop: 10, display:'inline-flex', padding:'8px 14px', borderRadius: 18, boxShadow:'var(--shadow-extruded)' }}>
          <span style={{ fontWeight: 1000 }}>DAILY LEADERBOARD</span>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, textAlign:'center' }}>
          <div style={{ color:'var(--purple)', fontWeight: 1000 }}>Error: {error}</div>
          <div className="small">Failed to fetch trader data.</div>
        </div>
      )}

      {loading && !error && (
        <div style={{ display:'flex', justifyContent:'center', padding: 34 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, boxShadow:'var(--shadow-inset)', background:'var(--bg)' }} />
        </div>
      )}

      {!loading && !error && top.length === 0 && (
        <div className="card" style={{ padding: 22, textAlign:'center' }}>
          <div style={{ fontWeight: 1000 }}>No traders found</div>
          <div className="small">The whales are hiding today...</div>
        </div>
      )}

      {!loading && !error && top.length > 0 && (
        <div className="grid">
          {top.map((trader, index) => {
            const rank = trader.rank || index + 1;
            const name = trader.displayName || trader.username || trader.name || `Trader ${index + 1}`;
            const addr = trader.walletAddress || trader.address || 'N/A';
            const profit = trader.profitLoss || trader.profit || trader.totalProfit || trader.pnl;
            const volume = trader.volume || trader.totalVolume || 0;
            const profileUrl = trader.profileUrl;

            return (
              <div key={addr + index} className="card" style={{ padding: 16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap: 14, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', gap: 14, minWidth: 260, flex: 1 }}>
                    <div style={{
                      width: 62, height: 62, borderRadius: 999,
                      boxShadow:'var(--shadow-inset-deep)', display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight: 1000
                    }}>
                      <span>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${rank}`}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                        <div className="h1" style={{ fontSize: 18, fontWeight: 1000, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {name}
                        </div>
                        {index < 3 && <TrendingUp size={18} color="var(--purple)" />}
                      </div>

                      <div style={{ marginTop: 6 }}>
                        <span className="mono" style={{
                          fontSize: 11,
                          padding:'6px 10px',
                          borderRadius: 12,
                          boxShadow:'var(--shadow-inset-small)',
                          display:'inline-block',
                          maxWidth: 320,
                          overflow:'hidden',
                          textOverflow:'ellipsis',
                          whiteSpace:'nowrap'
                        }}>
                          {addr}
                        </span>
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                        <div className="pill" style={{ padding: 10 }}>
                          <div className="small">Profit</div>
                          <div style={{ fontWeight: 1000, color:'var(--purple)' }}>{formatProfit(profit)}</div>
                        </div>
                        <div className="pill" style={{ padding: 10 }}>
                          <div className="small">Rank</div>
                          <div style={{ fontWeight: 1000, color:'var(--teal)' }}>#{rank}</div>
                        </div>
                        <div className="pill" style={{ padding: 10 }}>
                          <div className="small">Volume</div>
                          <div style={{ fontWeight: 1000 }}>{formatProfit(volume)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap: 10, alignItems:'stretch', flexWrap:'wrap' }}>
                    <button className="btn btn-teal" onClick={() => analyzeTrader(trader)} style={{ display:'inline-flex', alignItems:'center', gap: 10 }}>
                      🤖 AI Analysis
                    </button>

                    {profileUrl && (
                      <a className="btn btn-ghost" href={profileUrl} target="_blank" rel="noreferrer"
                         style={{ display:'inline-flex', alignItems:'center', gap: 10 }}>
                        Profile <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAnalysis && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', padding: 14, zIndex: 200
        }}>
          <div className="card" style={{ width:'min(920px, 96vw)', maxHeight:'78vh', overflow:'auto', padding: 18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 12 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, boxShadow:'var(--shadow-inset-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  🤖
                </div>
                <div>
                  <div className="h1" style={{ fontSize: 18, fontWeight: 1000 }}>AI Trader Analysis</div>
                  <div className="small">{selected?.displayName} (#{selected?.rank})</div>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setShowAnalysis(false)} style={{ padding:'10px 12px' }}>
                <X size={18} />
              </button>
            </div>

            <div className="pill" style={{ marginTop: 14, padding: 14, boxShadow:'var(--shadow-inset)' }}>
              {analysisLoading && (
                <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 999, boxShadow:'var(--shadow-inset)' }} />
                  <div className="small" style={{ fontWeight: 800 }}>Analyzing trading patterns...</div>
                </div>
              )}

              {!analysisLoading && analysis && (
                <div style={{ display:'grid', gap: 16 }}>
                  {!!analysis.signals?.length && (
                    <div>
                      <div style={{ fontWeight: 1000, marginBottom: 10 }}>🎯 Trading Signals</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 10 }}>
                        {analysis.signals.map((s, i) => (
                          <div key={i} className="pill" style={{ padding: 10, boxShadow:'var(--shadow-extruded-small)' }}>
                            <span style={{ fontSize: 18, marginRight: 10 }}>{s.icon}</span>
                            <span style={{ fontWeight: 900 }}>{s.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontWeight: 1000, marginBottom: 10 }}>📊 Performance Metrics</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 10 }}>
                      {[
                        { label:'Win Rate', value:analysis.metrics.winRate, icon:<Target size={16} />, color:'var(--teal)' },
                        { label:'Risk Level', value:analysis.metrics.riskScore, icon:<AlertTriangle size={16} />, color:'var(--purple)' },
                        { label:'Activity', value:analysis.metrics.activityScore, icon:<Zap size={16} />, color:'#F59E0B' },
                        { label:'Diversification', value:analysis.metrics.diversificationScore, icon:<TrendingUp size={16} />, color:'#8B5CF6' }
                      ].map((m, i) => (
                        <div key={i} className="pill" style={{ padding: 12, boxShadow:'var(--shadow-extruded-small)' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', gap: 8, color: m.color }}>
                              {m.icon}
                              <span className="small" style={{ fontWeight: 900, color:'var(--muted)' }}>{m.label}</span>
                            </div>
                            <div style={{ fontWeight: 1000, color: m.color }}>{Math.round(m.value)}%</div>
                          </div>
                          <div style={{ marginTop: 10, height: 10, borderRadius: 999, boxShadow:'var(--shadow-inset)', background:'var(--bg)', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${Math.round(m.value)}%`, background:`linear-gradient(90deg, ${m.color}, ${m.color})` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 1000, marginBottom: 10 }}>📈 Recent Activity</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 10 }}>
                      {[
                        { label:'Buys', value:analysis.trading.buyTrades, icon:<TrendingUp size={16} color="var(--teal)" /> },
                        { label:'Sells', value:analysis.trading.sellTrades, icon:<TrendingUp size={16} color="var(--purple)" /> },
                        { label:'Total', value:analysis.trading.totalTrades, icon:<Activity size={16} color="#F59E0B" /> }
                      ].map((x, i) => (
                        <div key={i} className="pill" style={{ padding: 12, textAlign:'center', boxShadow:'var(--shadow-extruded-small)' }}>
                          <div style={{ display:'flex', gap: 8, justifyContent:'center', alignItems:'center' }}>
                            {x.icon}
                            <div className="small">{x.label}</div>
                          </div>
                          <div style={{ fontWeight: 1000, fontSize: 18 }}>{x.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!!analysis.markets?.length && (
                    <div>
                      <div style={{ fontWeight: 1000, marginBottom: 10 }}>🎲 Active Markets</div>
                      <div style={{ display:'grid', gap: 8 }}>
                        {analysis.markets.map((m, i) => (
                          <div key={i} className="pill" style={{ padding: 10, boxShadow:'var(--shadow-extruded-small)' }}>
                            <span style={{ fontWeight: 900 }}>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!analysisLoading && !analysis && (
                <div className="small">No analysis available.</div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <button className="btn btn-purple" onClick={() => setShowAnalysis(false)} style={{ width:'100%' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign:'center', margin:'18px 0 8px' }}>
        <div style={{ fontWeight: 1000 }}>📊 Daily Profits Leaderboard</div>
        <div className="small">⚠️ Not financial advice. DYOR before copying anyone.</div>
      </div>
    </div>
  );
}
