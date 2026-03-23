import { useEffect, useState, useCallback, useRef } from "react";
import LeadCard from "./LeadCard";
import AddLeadModal from "./AddLeadModal";
import { API } from "../api";

const SOURCES = [
  "RemoteOK","Remotive","Jobicy","Arbeitnow",
  "WeWorkRemotely","StackOverflow","HackerNews",
  "Freelancer.com","Upwork","LinkedIn","manual"
];

const STATUS_FILTERS = [
  { value:"",          label:"All statuses" },
  { value:"new",       label:"🆕 New" },
  { value:"contacted", label:"📞 Contacted" },
  { value:"qualified", label:"✅ Qualified" },
  { value:"closed",    label:"🎉 Closed" },
  { value:"rejected",  label:"❌ Rejected" },
];

const SCORE_FILTERS = [
  { value:"",  label:"All scores" },
  { value:"8", label:"🔥 Hot (≥ 8)" },
  { value:"6", label:"⭐ Warm (≥ 6)" },
];

export default function Leads({ onLeadChanged }) {
  const [leads,      setLeads]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [status,     setStatus]     = useState("");
  const [minScore,   setMinScore]   = useState("");
  const [source,     setSource]     = useState("");
  const [query,      setQuery]      = useState("");
  const [showModal,  setShowModal]  = useState(false);
  const [scraping,   setScraping]   = useState(false);
  const [toast,      setToast]      = useState(null);
  const toastTimer = useRef(null);

  const fetchLeads = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (status)        p.set("status",   status);
      if (minScore)      p.set("minScore", minScore);
      if (source)        p.set("source",   source);
      if (query.trim())  p.set("q",        query.trim());
      const res = await fetch(`${API}/api/leads?${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLeads(await res.json());
      setError(null);
    } catch (e) {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [status, minScore, source, query]);

  useEffect(() => { setLoading(true); fetchLeads(); }, [fetchLeads]);
  useEffect(() => { const id = setInterval(fetchLeads, 20_000); return () => clearInterval(id); }, [fetchLeads]);

  function showToast(msg, type = "ok") {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const res = await fetch(`${API}/api/leads/${id}/status`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      onLeadChanged?.();
      showToast(`✅ Status → ${newStatus}`);
    } catch { showToast("❌ Status update failed", "err"); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this lead permanently?")) return;
    try {
      const res = await fetch(`${API}/api/leads/${id}`, { method:"DELETE" });
      if (!res.ok) throw new Error();
      setLeads(prev => prev.filter(l => l.id !== id));
      onLeadChanged?.();
      showToast("🗑 Lead deleted");
    } catch { showToast("❌ Delete failed", "err"); }
  }

  async function handleScrapeNow() {
    setScraping(true);
    showToast("🕷️ Scrape started — new leads will appear shortly…");
    try {
      await fetch(`${API}/api/scrape`, { method:"POST" });
      // Poll for new leads after 10s
      setTimeout(() => { fetchLeads(); onLeadChanged?.(); }, 10000);
      setTimeout(() => { fetchLeads(); onLeadChanged?.(); setScraping(false); }, 30000);
    } catch {
      showToast("❌ Scrape trigger failed", "err");
      setScraping(false);
    }
  }

  function handleLeadAdded(newLead) {
    setLeads(prev => [newLead, ...prev]);
    onLeadChanged?.();
    showToast("🚀 Lead added & Telegram notified!");
  }

  return (
    <>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="toolbar" role="search" aria-label="Filter leads">
        <span className="toolbar__title" aria-live="polite">
          {leads.length} lead{leads.length !== 1 ? "s" : ""}
        </span>

        <input className="input" type="search" placeholder="🔍 Search…"
          value={query} onChange={e => setQuery(e.target.value)} aria-label="Search leads" />

        <select className="select" value={status}
          onChange={e => setStatus(e.target.value)} aria-label="Filter by status">
          {STATUS_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select className="select" value={minScore}
          onChange={e => setMinScore(e.target.value)} aria-label="Filter by score">
          {SCORE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select className="select" value={source}
          onChange={e => setSource(e.target.value)} aria-label="Filter by source">
          <option value="">All sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add lead
        </button>

        <button type="button" className={`btn btn-scrape ${scraping ? "scraping" : ""}`}
          onClick={handleScrapeNow} disabled={scraping} aria-label="Trigger scrape now">
          {scraping ? "🕷️ Scraping…" : "🕷️ Scrape now"}
        </button>

        <button type="button" className="btn btn-ghost" onClick={fetchLeads} aria-label="Refresh">
          ↻
        </button>
      </div>

      {/* ── States ───────────────────────────────────────────── */}
      {loading && (
        <div className="state-box" role="status" aria-live="polite">
          <span className="state-box__icon" aria-hidden="true">⚡</span>
          <p className="state-box__title">Loading…</p>
        </div>
      )}
      {!loading && error && (
        <div className="state-box" role="alert">
          <span className="state-box__icon" aria-hidden="true">⚠️</span>
          <p className="state-box__title">Connection error</p>
          <p className="state-box__sub">{error}</p>
          <br /><button className="btn btn-ghost" onClick={fetchLeads}>Retry</button>
        </div>
      )}
      {!loading && !error && leads.length === 0 && (
        <div className="state-box">
          <span className="state-box__icon" aria-hidden="true">📭</span>
          <p className="state-box__title">No leads found</p>
          <p className="state-box__sub">
            {query || status || minScore || source
              ? "Try adjusting your filters."
              : <>Hit <strong>🕷️ Scrape now</strong> to pull real jobs from 10 sources.</>}
          </p>
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────── */}
      {!loading && !error && leads.length > 0 && (
        <section className="leads-grid"
          aria-label={`${leads.length} lead${leads.length !== 1 ? "s" : ""}`}>
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead}
              onStatusChange={handleStatusChange} onDelete={handleDelete} />
          ))}
        </section>
      )}

      {showModal && (
        <AddLeadModal onClose={() => setShowModal(false)} onAdded={handleLeadAdded} />
      )}

      {toast && (
        <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
          {toast.msg}
        </div>
      )}
    </>
  );
}
