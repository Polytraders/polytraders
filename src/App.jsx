import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import Navbar from './components/Navbar';
import LeaderboardPage from './pages/LeaderboardPage';
import LiveTradesPage from './pages/LiveTradesPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    const preload = async () => {
      try {
        await Promise.all([
          fetch('/api/leaderboard').catch(() => null),
          new Promise(r => setTimeout(r, 1200))
        ]);
      } finally {
        setDataReady(true);
      }
    };
    preload();
  }, []);

  useEffect(() => {
    if (dataReady) setShowSplash(false);
  }, [dataReady]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LeaderboardPage />} />
        <Route path="/live-trades" element={<LiveTradesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
