import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

const LOGO_URL = 'https://cdn.dev.fun/asset/59932f2f0b6d5afa6573/12082_4f0dacc4.png';

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 450);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--bg)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999
    }}>
      <div style={{ textAlign:'center', padding:'0 16px', maxWidth: 720 }}>
        <div style={{ marginBottom: 26, position:'relative' }}>
          <div style={{
            width: 170, height:170, margin:'0 auto', borderRadius:'999px',
            background:'var(--bg)', overflow:'hidden',
            boxShadow:'var(--shadow-inset-deep)', display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <img src={LOGO_URL} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <Eye size={34} color="var(--teal)" />
          </div>
        </div>

        <div className="h1" style={{ fontSize: 52, marginBottom: 8 }}>POLY TRADERS</div>
        <div style={{ fontWeight: 900, color:'var(--purple)', marginBottom: 8 }}>
          Stalk the Best Polymarket Traders
        </div>
        <div className="small" style={{ maxWidth: 560, margin:'0 auto 18px auto' }}>
          Watch real-time trades from top performers. See exactly what they’re betting on and copy their moves before the market catches up.
        </div>

        <div style={{
          width:'100%', maxWidth: 420, margin:'0 auto 10px auto', height: 14,
          borderRadius: 999, background:'var(--bg)', boxShadow:'var(--shadow-inset)'
        }}>
          <div style={{
            height:'100%',
            width:`${progress}%`,
            borderRadius: 999,
            background: 'linear-gradient(90deg, var(--purple), var(--teal))',
            transition:'width .2s ease'
          }} />
        </div>

        <div className="small" style={{ fontWeight: 700 }}>
          Loading whale data... {progress}%
        </div>
      </div>
    </div>
  );
}
