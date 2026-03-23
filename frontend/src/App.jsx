import { useEffect, useState, useCallback } from "react";
import Leads from "./components/Leads";
import Stats from "./components/Stats";
import InstallPrompt from "./components/InstallPrompt";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Settings from "./components/Settings";
import { API } from "./api";

// Get saved user from localStorage
const getSavedUser = () => {
  try {
    const saved = localStorage.getItem("leadSystemUser");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export default function App() {
  const [view, setView] = useState(() => {
    // Start at app if user is already logged in
    return getSavedUser() ? "app" : "landing";
  });
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard, favorites, add, settings
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [user, setUser] = useState(getSavedUser);
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

  // Show landing page first
  if (view === "landing") {
    return <LandingPage onEnter={() => setView("login")} />;
  }

  // Show login page
  if (view === "login") {
    return <LoginPage onLogin={(userData) => { 
      localStorage.setItem("leadSystemUser", JSON.stringify(userData));
      setUser(userData); 
      setView("app"); 
      setCurrentView("dashboard"); 
    }} />;
  }

  // Show main app
  return (
    <>
      <Sidebar 
        user={user} 
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={() => { 
          localStorage.removeItem("leadSystemUser");
          setUser(null); 
          setView("landing"); 
        }}
      />
      
      <div style={{ paddingLeft: "20px" }}>
        {/* Header and Stats - shown on dashboard and favorites */}
        {(currentView === "dashboard" || currentView === "favorites") && (
          <>
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

            <Stats stats={stats} />
          </>
        )}

        {/* Main content */}
        <main id="main-content" className="main" role="main" style={{ paddingTop: currentView === "settings" ? "4rem" : 0 }}>
          {currentView === "dashboard" && (
            <Leads onLeadChanged={onLeadChanged} view="dashboard" />
          )}
          {currentView === "favorites" && (
            <Leads onLeadChanged={onLeadChanged} view="favorites" />
          )}
          {currentView === "add" && (
            <Leads onLeadChanged={onLeadChanged} view="add" />
          )}
          {currentView === "settings" && (
            <Settings user={user} />
          )}
        </main>
      </div>

      <InstallPrompt />
    </>
  );
}
