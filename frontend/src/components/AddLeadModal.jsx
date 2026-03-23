import { useEffect, useRef, useState } from "react";

export default function AddLeadModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ text: "", link: "", score: 5, message: "", source: "manual" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const firstInputRef = useRef(null);
  const backdropRef = useRef(null);

  // Focus trap & auto-focus
  useEffect(() => {
    firstInputRef.current?.focus();

    // Close on Escape
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) onClose();
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.text.trim()) {
      setError("Le texte du lead est obligatoire.");
      firstInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.text.trim(),
          link: form.link.trim(),
          score: Number(form.score),
          message: form.message.trim(),
          source: form.source,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const newLead = await res.json();
      onAdded(newLead);
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi du lead.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(10,15,30,0.8)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "var(--shadow)",
          animation: "cardIn 0.2s ease both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 id="modal-title" style={{ fontSize: "1.1rem", fontFamily: "var(--font-display)" }}>
            ➕ Ajouter un lead
          </h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            style={{ padding: "0.3rem 0.6rem" }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: "rgba(255,77,109,0.1)",
              border: "1px solid rgba(255,77,109,0.3)",
              color: "var(--danger)",
              padding: "0.65rem 0.9rem",
              borderRadius: "var(--radius)",
              fontSize: "0.82rem",
              marginBottom: "1.25rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Text */}
            <div>
              <label
                htmlFor="lead-text"
                style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
                         letterSpacing: "0.08em", color: "var(--muted)", fontFamily: "var(--font-mono)",
                         marginBottom: "0.4rem" }}
              >
                Texte du lead *
              </label>
              <textarea
                id="lead-text"
                ref={firstInputRef}
                className="input"
                required
                rows={3}
                value={form.text}
                onChange={set("text")}
                placeholder="Description du besoin client…"
                aria-required="true"
                style={{ width: "100%", resize: "vertical", fontFamily: "var(--font-body)", fontSize: "0.875rem" }}
              />
            </div>

            {/* Link */}
            <div>
              <label
                htmlFor="lead-link"
                style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
                         letterSpacing: "0.08em", color: "var(--muted)", fontFamily: "var(--font-mono)",
                         marginBottom: "0.4rem" }}
              >
                Lien (optionnel)
              </label>
              <input
                id="lead-link"
                type="url"
                className="input"
                value={form.link}
                onChange={set("link")}
                placeholder="https://…"
                style={{ width: "100%" }}
              />
            </div>

            {/* Score */}
            <div>
              <label
                htmlFor="lead-score"
                style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
                         letterSpacing: "0.08em", color: "var(--muted)", fontFamily: "var(--font-mono)",
                         marginBottom: "0.4rem" }}
              >
                Score de qualification : <strong style={{ color: "var(--accent)" }}>{form.score}/10</strong>
              </label>
              <input
                id="lead-score"
                type="range"
                min={0} max={10}
                value={form.score}
                onChange={set("score")}
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={form.score}
                aria-valuetext={`${form.score} sur 10`}
                style={{ width: "100%", accentColor: "var(--accent)" }}
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="lead-message"
                style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
                         letterSpacing: "0.08em", color: "var(--muted)", fontFamily: "var(--font-mono)",
                         marginBottom: "0.4rem" }}
              >
                Message de contact (optionnel)
              </label>
              <textarea
                id="lead-message"
                className="input"
                rows={2}
                value={form.message}
                onChange={set("message")}
                placeholder="Bonjour, je peux…"
                style={{ width: "100%", resize: "vertical", fontFamily: "var(--font-body)", fontSize: "0.875rem" }}
              />
            </div>

            {/* Source */}
            <div>
              <label
                htmlFor="lead-source"
                style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
                         letterSpacing: "0.08em", color: "var(--muted)", fontFamily: "var(--font-mono)",
                         marginBottom: "0.4rem" }}
              >
                Source
              </label>
              <select
                id="lead-source"
                className="select"
                value={form.source}
                onChange={set("source")}
                style={{ width: "100%" }}
              >
                <option value="manual">Manuel</option>
                <option value="scraper">Scraper</option>
                <option value="referral">Référence</option>
                <option value="inbound">Inbound</option>
                <option value="other">Autre</option>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? "Envoi en cours…" : "🚀 Créer le lead"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Annuler
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
