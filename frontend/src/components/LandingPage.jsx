import { useState, useEffect } from "react";

export default function LandingPage({ onEnter }) {
  const [visible, setVisible] = useState(false);
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    // Trigger entrance animations
    setTimeout(() => setVisible(true), 100);
    
    // Animate phases
    const t1 = setTimeout(() => setAnimPhase(1), 600);
    const t2 = setTimeout(() => setAnimPhase(2), 1200);
    
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0a0f1e 0%, #1a1f35 50%, #0d1421 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated background particles */}
      <div style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: "rgba(0, 229, 195, 0.3)",
              borderRadius: "50%",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Glow effect */}
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(0,229,195,0.15) 0%, transparent 70%)",
        borderRadius: "50%",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        animation: "pulse 4s ease-in-out infinite",
      }} />

      {/* Main content */}
      <div style={{
        textAlign: "center",
        zIndex: 1,
        padding: "2rem",
        maxWidth: "600px",
      }}>
        {/* Logo with animation */}
        <div style={{
          transform: visible ? "scale(1) rotate(0deg)" : "scale(0) rotate(-180deg)",
          opacity: visible ? 1 : 0,
          transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          marginBottom: "2rem",
        }}>
          <img 
            src="/genie.jpeg" 
            alt="Lead System Logo"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "24px",
              border: "3px solid rgba(0, 229, 195, 0.5)",
              boxShadow: "0 0 40px rgba(0, 229, 195, 0.3), 0 0 80px rgba(0, 229, 195, 0.1)",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          fontWeight: 800,
          color: "#fff",
          margin: 0,
          marginBottom: "0.5rem",
          opacity: animPhase >= 1 ? 1 : 0,
          transform: animPhase >= 1 ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.6s ease-out",
        }}>
          Lead<span style={{ color: "var(--accent)" }}>System</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1rem",
          color: "var(--muted)",
          margin: 0,
          marginBottom: "2rem",
          opacity: animPhase >= 1 ? 1 : 0,
          transform: animPhase >= 1 ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease-out 0.2s",
        }}>
          Gestion intelligente de vos leads
        </p>

        {/* Features */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "3rem",
          opacity: animPhase >= 2 ? 1 : 0,
          transform: animPhase >= 2 ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease-out 0.3s",
        }}>
          {[
            { icon: "⚡", text: "Automatisé" },
            { icon: "🔗", text: "Multi-sources" },
            { icon: "📱", text: "PWA Ready" },
            { icon: "🔔", text: "Notifications" },
          ].map((feat, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "0.75rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
              color: "var(--text)",
              fontFamily: "var(--font-mono)",
            }}>
              <span>{feat.icon}</span>
              <span>{feat.text}</span>
            </div>
          ))}
        </div>

        {/* Enter button */}
        <button
          onClick={onEnter}
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, #00b8a3 100%)",
            border: "none",
            borderRadius: "16px",
            padding: "1rem 3rem",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#0a0f1e",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            opacity: animPhase >= 2 ? 1 : 0,
            transform: animPhase >= 2 ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
            transition: "all 0.4s ease-out 0.5s, transform 0.2s ease",
            boxShadow: "0 4px 20px rgba(0, 229, 195, 0.4)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px) scale(1.02)";
            e.target.style.boxShadow = "0 8px 30px rgba(0, 229, 195, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0) scale(1)";
            e.target.style.boxShadow = "0 4px 20px rgba(0, 229, 195, 0.4)";
          }}
        >
          Entrer dans l'app →
        </button>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute",
        bottom: "1.5rem",
        fontSize: "0.75rem",
        color: "var(--muted)",
        fontFamily: "var(--font-mono)",
        opacity: animPhase >= 2 ? 0.6 : 0,
        transition: "opacity 0.6s ease-out 0.6s",
      }}>
        v2.0 • Built with ⚡
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
