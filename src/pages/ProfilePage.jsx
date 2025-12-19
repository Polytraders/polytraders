import { useMemo } from 'react';
import { Share2, ExternalLink } from 'lucide-react';
import { formatProfit } from '../lib/format';

const LS_KEY = 'polytraders_tracked_v1';

function loadTrackedList() {
  try {
    const map = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return Object.values(map || {}).sort((a,b) => (b.savedAt || 0) - (a.savedAt || 0));
  } catch {
    return [];
  }
}

export default function ProfilePage() {
  const trackedTrades = useMemo(() => loadTrackedList(), []);

  const stats = useMemo(() => {
    const totalTrades = trackedTrades.length;
    const totalPnL = trackedTrades.reduce((sum, t) => sum + (Number(t.profitLoss) || 0), 0);
    const wins = trackedTrades.filter(t => (Number(t.profitLoss) || 0) > 0).length;
    const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
    return { totalTrades, totalPnL, winRate };
  }, [trackedTrades]);

  function shareOverallStats() {
    const pnl = stats.totalPnL >= 0 ? `+${stats.totalPnL.toFixed(2)}` : `-${Math.abs(stats.totalPnL).toFixed(2)}`;
    const emoji = stats.totalPnL >= 0 ? '🚀' : '📊';
    const text =
      `${emoji} My PolyTraders Stats:\n\n📈 ${stats.totalTrades} trades tracked\n💰 ${pnl} total P&L\n🎯 ${stats.winRate.toFixed(1)}% win rate\n\nTrack top traders and copy their moves.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="container">
      <div style={{ textAlign:'center', margin:'14px 0 14px 0' }}>
        <div style={{ fontSize: 18, fontWeight: 1000 }}>Your Trading Performance</div>
        <div className="small">Track your copied trades and share your wins! 📊</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12 }}>
        <div className="card" style={{ padding: 14, textAlign:'center' }}>
          <div className="small" style={{ fontWeight: 900 }}>Total Trades</div>
          <div className="h1" style={{ fontSize: 28, fontWeight: 1000, color:'var(--purple)' }}>{stats.totalTrades}</div>
        </div>
        <div className="card" style={{ padding: 14, textAlign:'center' }}>
          <div className="small" style={{ fontWeight: 900 }}>Total P&L</div>
          <div className="h1" style={{ fontSize: 28, fontWeight: 1000, color: stats.totalPnL >= 0 ? 'var(--teal)' : 'var(--purple)' }}>
            {stats.totalPnL >= 0 ? '+' : ''}{formatProfit(stats.totalPnL)}
          </div>
        </div>
        <div className="card" style={{ padding: 14, textAlign:'center' }}>
          <div className="small" style={{ fontWeight: 900 }}>Win Rate</div>
          <div className="h1" style={{ fontSize: 28, fontWeight: 1000 }}>{stats.winRate.toFixed(1)}%</div>
        </div>
      </div>

      {stats.totalTrades > 0 && (
        <div style={{ marginTop: 14, textAlign:'center' }}>
          <button
            className="btn"
            onClick={shareOverallStats}
            style={{ background:'#1DA1F2', color:'white', display:'inline-flex', alignItems:'center', gap: 10 }}
          >
            <Share2 size={18} />
            Share My Stats on X
          </button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {trackedTrades.length === 0 ? (
          <div className="card" style={{ padding: 18, textAlign:'center' }}>
            <div style={{ fontWeight: 1000 }}>No Tracked Trades Yet</div>
            <div className="small">Go to Live Trades → Track Trade → enter your P&L.</div>
          </div>
        ) : (
          <div className="grid">
            {trackedTrades.map((trade, idx) => {
              const link = trade.marketSlug ? `https://polymarket.com/event/${trade.marketSlug}` : null;
              return (
                <div key={trade.tradeId || idx} className="card" style={{ padding: 16 }}>
                  <div style={{ display:'flex', gap: 14 }}>
                    {trade.icon && (
                      <img
                        src={trade.icon}
                        alt=""
                        style={{ width: 72, height: 72, borderRadius: 18, objectFit:'cover', boxShadow:'var(--shadow-extruded-small)' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:'flex', gap: 10, flexWrap:'wrap' }}>
                        <span style={{
                          padding:'6px 10px', borderRadius: 14, fontWeight: 1000,
                          background: trade.side === 'BUY' ? 'var(--teal)' : 'var(--purple)',
                          color:'white'
                        }}>
                          {trade.side}
                        </span>
                        <span className="pill" style={{ padding:'6px 10px' }}>
                          <span style={{ fontWeight: 900 }}>{trade.outcome}</span>
                        </span>
                      </div>

                      <div className="h1" style={{ fontSize: 16, fontWeight: 1000, marginTop: 8 }}>
                        {trade.eventTitle}
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                        <div className="pill" style={{ padding: 10, boxShadow:'var(--shadow-extruded-small)' }}>
                          <div className="small">Entry</div>
                          <div style={{ fontWeight: 1000 }}>{formatProfit(trade.entryAmount)}</div>
                        </div>
                        <div className="pill" style={{ padding: 10, boxShadow:'var(--shadow-extruded-small)' }}>
                          <div className="small">P&L</div>
                          <div style={{ fontWeight: 1000, color: trade.profitLoss >= 0 ? 'var(--teal)' : 'var(--purple)' }}>
                            {trade.profitLoss >= 0 ? '+' : ''}{formatProfit(trade.profitLoss)}
                          </div>
                        </div>
                        <div className="pill" style={{ padding: 10, boxShadow:'var(--shadow-extruded-small)' }}>
                          <div className="small">Shares</div>
                          <div style={{ fontWeight: 1000 }}>{Number(trade.shares || 0).toLocaleString()}</div>
                        </div>
                      </div>

                      <div style={{ display:'flex', gap: 10, flexWrap:'wrap', marginTop: 12 }}>
                        {link && (
                          <a className="btn btn-purple" href={link} target="_blank" rel="noreferrer"
                             style={{ display:'inline-flex', alignItems:'center', gap: 10, padding:'10px 14px' }}>
                            <ExternalLink size={18} />
                            View Position
                          </a>
                        )}

                        <button className="btn" style={{ background:'#1DA1F2', color:'white', padding:'10px 14px', display:'inline-flex', alignItems:'center', gap: 10 }}
                          onClick={() => {
                            const pnl = trade.profitLoss >= 0 ? `+${trade.profitLoss.toFixed(2)}` : `-${Math.abs(trade.profitLoss).toFixed(2)}`;
                            const emoji = trade.profitLoss >= 0 ? '🚀' : '📉';
                            const text =
                              `${emoji} Just closed a ${trade.side} position on "${trade.eventTitle}" with ${pnl} P&L using PolyTraders.\n\nTrack top traders and copy their moves.`;
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          <Share2 size={18} />
                          Share
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
