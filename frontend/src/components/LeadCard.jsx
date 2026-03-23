import { useState } from "react";
import SourceBadge from "./SourceBadge";

const STATUS_OPTIONS = ["new","contacted","qualified","closed","rejected"];
const STATUS_EMOJI   = { new:"🆕", contacted:"📞", qualified:"✅", closed:"🎉", rejected:"❌" };

function scoreMeta(score) {
  if (score >= 8) return { cls:"score-badge--hot",  cardCls:"lead-card--hot",  label:"High priority" };
  if (score >= 5) return { cls:"score-badge--warm", cardCls:"",                label:"Medium priority" };
  return              { cls:"score-badge--cold", cardCls:"",                label:"Low priority" };
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"
  });
}

// Extract clean title/company from the structured text field
function parseText(text = "") {
  // Format: "[Source] Title @ Company — Location — Salary"
  const match = text.match(/^\[.*?\]\s*(.+?)\s*@\s*(.+?)\s*(?:—|$)/);
  if (match) return { title: match[1].trim(), company: match[2].trim() };
  return { title: text, company: "" };
}

export default function LeadCard({ lead, onStatusChange, onDelete }) {
  const [open,     setOpen]     = useState(false);
  const [copying,  setCopying]  = useState(false);
  const [updating, setUpdating] = useState(false);
  const meta = scoreMeta(lead.score);
  const { title, company } = parseText(lead.text);

  async function handleStatusChange(e) {
    setUpdating(true);
    await onStatusChange(lead.id, e.target.value);
    setUpdating(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(lead.message);
      setCopying(true);
      setTimeout(() => setCopying(false), 1800);
    } catch {}
  }

  // Extract salary hint from text
  const salaryMatch = lead.text?.match(/—\s*(\$[\d,]+[^—\n]*)/);
  const salary = salaryMatch ? salaryMatch[1].trim() : "";

  return (
    <article className={`lead-card ${meta.cardCls}`}
      aria-label={`Lead: ${title}, score ${lead.score}/10`}>

      {/* Header */}
      <div className="lead-card__header">
        <div className={`score-badge ${meta.cls}`}
          aria-label={`Score ${lead.score}/10 — ${meta.label}`}>
          {lead.score}
        </div>
        <div className="lead-card__meta">
          <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", marginBottom:"4px" }}>
            <SourceBadge source={lead.source} />
            {salary && (
              <span style={{
                fontSize:"0.62rem", fontFamily:"monospace", padding:"1px 6px",
                borderRadius:"100px", background:"rgba(255,209,102,0.1)",
                border:"1px solid rgba(255,209,102,0.3)", color:"#ffd166",
              }}>
                💰 {salary}
              </span>
            )}
          </div>
          <span className={`status-badge status-badge--${lead.status}`}>
            {STATUS_EMOJI[lead.status]} {lead.status}
          </span>
        </div>
      </div>

      {/* Title + Company */}
      <div>
        <p style={{ fontSize:"0.92rem", fontWeight:"600", color:"var(--text)", marginBottom:"2px", lineHeight:"1.3" }}>
          {title}
        </p>
        {company && (
          <p style={{ fontSize:"0.78rem", color:"var(--muted)", fontFamily:"monospace" }}>
            🏢 {company}
          </p>
        )}
      </div>

      {/* Link */}
      {lead.link && (
        <a href={lead.link} className="lead-card__link"
          target="_blank" rel="noopener noreferrer"
          aria-label={`View job on ${lead.source} (opens new tab)`}>
          🔗 View job posting ↗
        </a>
      )}

      {/* Description */}
      {lead.description && (
        <details style={{ fontSize:"0.82rem", color:"var(--muted)" }}>
          <summary style={{ cursor:"pointer", color:"var(--accent)", fontSize:"0.78rem" }}>
            📝 View description
          </summary>
          <p style={{ marginTop:"0.5rem", lineHeight:"1.55", color:"var(--text)" }}>
            {lead.description}
          </p>
        </details>
      )}

      {/* Meta row */}
      <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", fontSize:"0.7rem", fontFamily:"monospace", color:"var(--muted)" }}>
        {lead.postedAt && <span>📅 Posted {new Date(lead.postedAt).toLocaleDateString()}</span>}
        {lead.expiresAt && <span>⏳ Expires {new Date(lead.expiresAt).toLocaleDateString()}</span>}
        {lead.salary && <span style={{ color:"var(--gold)" }}>💰 {lead.salary}</span>}
        {lead.email && (
          <a href={`mailto:${lead.email}`} style={{ color:"var(--accent)", textDecoration:"none" }}>
            📧 {lead.email}
          </a>
        )}
      </div>

      {/* Message */}
      {lead.message && (
        <div className="message-box">
          <button type="button" className="message-box__toggle"
            aria-expanded={open} aria-controls={`msg-${lead.id}`}
            onClick={() => setOpen(o => !o)}>
            💬 Outreach message
            <span className={`message-box__toggle-arrow ${open ? "open" : ""}`} aria-hidden="true">▼</span>
          </button>
          {open && (
            <div id={`msg-${lead.id}`} className="message-box__content">
              <p className="message-box__text">{lead.message}</p>
              <button type="button" className="btn btn-ghost" onClick={handleCopy} aria-live="polite">
                {copying ? "✅ Copied!" : "📋 Copy"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="lead-card__footer">
        <time className="lead-card__date" dateTime={lead.created_at}>
          🕐 {formatDate(lead.created_at)}
        </time>
        <label htmlFor={`status-${lead.id}`} className="sr-only">Change status</label>
        <select id={`status-${lead.id}`} className="status-select"
          value={lead.status} onChange={handleStatusChange}
          disabled={updating} aria-label={`Status for lead ${lead.id}`}>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_EMOJI[s]} {s}</option>
          ))}
        </select>
        <button type="button" className="btn btn-danger"
          onClick={() => onDelete(lead.id)} aria-label={`Delete lead ${lead.id}`}>🗑</button>
      </div>
      <style>{`.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}`}</style>
    </article>
  );
}
