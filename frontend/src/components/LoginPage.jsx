import { useState } from "react";
import { API } from "../api";

export default function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (!isLogin && form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }
      
      // If registering, show success message and switch to login
      if (!isLogin) {
        alert("Compte créé avec succès ! Veuillez vous connecter.");
        setIsLogin(true);
        setForm({ email: "", password: "", confirmPassword: "" });
      } else {
        onLogin({ email: form.email });
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    }
    
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0a0f1e 0%, #1a1f35 50%, #0d1421 100%)",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "2rem",
        boxShadow: "var(--shadow)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "60px",
            height: "60px",
            margin: "0 auto 1rem",
            borderRadius: "16px",
            overflow: "hidden",
            border: "2px solid rgba(0, 229, 195, 0.5)",
          }}>
            <img 
              src="/genie.jpeg" 
              alt="Logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#fff",
            margin: 0,
          }}>
            {isLogin ? "Connexion" : "Créer un compte"}
          </h1>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            color: "var(--muted)",
            margin: "0.5rem 0 0",
          }}>
            {isLogin ? "Accédez à votre dashboard" : "Rejoignez LeadSystem"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: "rgba(255,77,109,0.1)",
            border: "1px solid rgba(255,77,109,0.3)",
            color: "var(--danger)",
            padding: "0.75rem",
            borderRadius: "var(--radius)",
            fontSize: "0.8rem",
            marginBottom: "1rem",
            textAlign: "center",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
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
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="john@example.com"
              style={{ width: "100%" }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{
              display: "block",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              marginBottom: "0.4rem",
            }}>
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                value={form.password}
                onChange={handleChange("password")}
                placeholder="••••••••"
                style={{ width: "100%", paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: "var(--muted)",
                  padding: "0",
                }}
              >
                {showPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
          </div>

          {/* Confirm Password (only for register) */}
          {!isLogin && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{
                display: "block",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
                marginBottom: "0.4rem",
              }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="input"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  placeholder="••••••••"
                  style={{ width: "100%", paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1rem",
                    color: "var(--muted)",
                    padding: "0",
                  }}
                >
                  {showConfirmPassword ? "👁" : "👁‍🗨"}
                </button>
              </div>
            </div>
          )}

          {/* Forgot password (only for login) */}
          {isLogin && (
            <div style={{ textAlign: "right", marginBottom: "1rem" }}>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", marginBottom: "1rem" }}
          >
            {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer un compte"}
          </button>

          {/* Toggle login/register */}
          <div style={{
            textAlign: "center",
            fontSize: "0.85rem",
            color: "var(--muted)",
          }}>
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
