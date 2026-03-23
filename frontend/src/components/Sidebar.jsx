import { useState } from "react";

export default function Sidebar({ user, onNavigate, currentView, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "favorites", icon: "⭐", label: "Favoris" },
    { id: "add", icon: "➕", label: "Ajouter un lead" },
    { id: "settings", icon: "⚙️", label: "Paramètres" },
  ];

  return (
    <>
      {/* Toggle button - fixed position on left edge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          top: "50%",
          left: isOpen ? "280px" : "0px",
          transform: "translateY(-50%)",
          zIndex: 1001,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderLeft: isOpen ? "none" : "1px solid var(--border)",
          borderRadius: isOpen ? "0 8px 8px 0" : "0 8px 8px 0",
          padding: "0.75rem 0.4rem",
          cursor: "pointer",
          color: "var(--text)",
          transition: "left 0.3s ease",
          fontSize: "1.2rem",
        }}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar - fixed position */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "-280px",
          width: "280px",
          height: "100vh",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          zIndex: 1000,
          transition: "left 0.3s ease",
          display: "flex",
          flexDirection: "column",
          boxShadow: isOpen ? "4px 0 20px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <div style={{ width: "280px", display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header with user info */}
          <div style={{
            padding: "1.5rem",
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, var(--accent) 0%, #00b8a3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#0a0f1e",
                flexShrink: 0,
              }}>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: "1rem" }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {menuItems.map((item) => (
                <li key={item.id} style={{ marginBottom: "0.5rem" }}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      background: currentView === item.id ? "rgba(0, 229, 195, 0.1)" : "transparent",
                      border: "none",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: currentView === item.id ? "var(--accent)" : "var(--text)",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout button at bottom */}
          <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={onLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                background: "rgba(255, 77, 109, 0.1)",
                border: "1px solid rgba(255, 77, 109, 0.3)",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                fontSize: "0.9rem",
                color: "var(--danger)",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>🚪</span>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop when sidebar is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.3)",
          }}
        />
      )}
    </>
  );
}
