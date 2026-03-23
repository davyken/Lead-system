import { useEffect, useState, useCallback } from "react";
import Leads from "./components/Leads";
import Stats from "./components/Stats";
import InstallPrompt from "./components/InstallPrompt";
import { API } from "./api";

export default function App() {
  const [stats, setStats] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/stats`);
      if (res.ok) setStats(await res.json());
    } catch {
      // Silently fail — stats are decorative
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTick]);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setRefreshTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const onLeadChanged = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  return (
    <>
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="header" role="banner">
        <div className="header__inner">
          <div className="header__brand">
            <div className="header__logo" aria-hidden="true">⚡</div>
            <span className="header__title">
              Lead<span>System</span>
            </span>
          </div>

          <div
            className="header__pill"
            role="status"
            aria-live="polite"
            aria-label="Système actif"
          >
            LIVE
          </div>
        </div>
      </header>

      {/* ─── Stats Bar ──────────────────────────────────────────── */}
      <Stats stats={stats} />

      {/* ─── Main ───────────────────────────────────────────────── */}
      <main id="main-content" className="main" role="main">
        <Leads onLeadChanged={onLeadChanged} />
      </main>

      {/* ─── PWA Install Prompt ────────────────────────────────────── */}
      <InstallPrompt />
    </>
  );
}
