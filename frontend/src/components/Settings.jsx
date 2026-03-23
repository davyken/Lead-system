export default function Settings({ user }) {
  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "#fff",
        marginBottom: "2rem",
      }}>
        ⚙️ Paramètres du compte
      </h1>

      {/* User Info Card */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}>
        <h2 style={{
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--muted)",
          fontFamily: "var(--font-mono)",
          marginBottom: "1rem",
        }}>
          Informations du profil
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, var(--accent) 0%, #00b8a3 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#0a0f1e",
            }}>
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>
                {user?.email?.split("@")[0] || "User"}
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                Membre
              </p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{
              display: "block",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              marginBottom: "0.4rem",
            }}>
              Email
            </label>
            <div style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.75rem",
              fontSize: "0.9rem",
              color: "var(--text)",
            }}>
              {user?.email || "Non défini"}
            </div>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
      }}>
        <h2 style={{
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--muted)",
          fontFamily: "var(--font-mono)",
          marginBottom: "1rem",
        }}>
          À propos
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text)" }}>
            <strong>Version:</strong> 2.0
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text)" }}>
            <strong>Application:</strong> LeadSystem
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
            Système de gestion de leads avec notifications Telegram
          </p>
        </div>
      </div>
    </div>
  );
}
