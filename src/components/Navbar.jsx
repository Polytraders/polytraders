import { Link, useLocation } from 'react-router-dom';
import { Trophy, Activity, Eye } from 'lucide-react';

const LOGO_URL = 'https://cdn.dev.fun/asset/59932f2f0b6d5afa6573/12082_4f0dacc4.png';

function NavLink({ to, icon: Icon, label }) {
  const loc = useLocation();
  const active = loc.pathname === to;

  return (
    <Link to={to} className="btn"
      style={{
        padding: '10px 14px',
        display:'inline-flex',
        alignItems:'center',
        gap:8,
        borderRadius: 16,
        background: active ? 'var(--purple)' : 'var(--bg)',
        color: active ? 'white' : 'var(--text)',
        boxShadow: 'var(--shadow-extruded)',
        fontWeight: 900
      }}>
      <Icon size={18} />
      {label}
    </Link>
  );
}

export default function Navbar() {
  return (
    <div style={{
      position:'sticky', top:0, zIndex:50,
      background:'var(--bg)',
      boxShadow:'var(--shadow-extruded)',
      padding:'10px 12px'
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:44, height:44, borderRadius:999, overflow:'hidden',
            background:'var(--bg)', boxShadow:'var(--shadow-inset-deep)'
          }}>
            <img src={LOGO_URL} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div className="h1" style={{ fontSize: 20, fontWeight: 1000 }}>POLY TRADERS</div>
        </div>

        <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
          <NavLink to="/" icon={Trophy} label="Leaderboard" />
          <NavLink to="/live-trades" icon={Activity} label="Live Trades" />
          <NavLink to="/profile" icon={Eye} label="Profile" />
        </div>
      </div>
    </div>
  );
}
