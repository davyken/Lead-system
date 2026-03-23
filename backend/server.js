require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const { startBot, sendLeadToTelegram } = require("./telegram");

const app     = express();
const PORT    = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const DATA_FILE = path.join(__dirname, "leads.json");

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

if (IS_PROD) {
  const staticPath = path.join(__dirname, "../frontend/dist");
  if (fs.existsSync(staticPath)) app.use(express.static(staticPath));
}

// ─── Persistence ──────────────────────────────────────────────────────────────
function loadLeads() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (e) { console.error("⚠️  Could not load leads.json:", e.message); }
  return [];
}

function saveLeads(leads) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2)); }
  catch (e) { console.error("⚠️  Could not save leads.json:", e.message); }
}

let leads = loadLeads();
const VALID_STATUSES = ["new","contacted","qualified","closed","rejected"];

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", leads: leads.length, uptime: Math.round(process.uptime()) })
);

app.get("/api/leads", (req, res) => {
  const { status, minScore, maxScore, q, source } = req.query;
  let result = [...leads];
  if (status && VALID_STATUSES.includes(status)) result = result.filter(l => l.status === status);
  if (minScore) result = result.filter(l => l.score >= Number(minScore));
  if (maxScore) result = result.filter(l => l.score <= Number(maxScore));
  if (source)   result = result.filter(l => l.source?.toLowerCase() === source.toLowerCase());
  if (q) {
    const lower = q.toLowerCase();
    result = result.filter(l => l.text?.toLowerCase().includes(lower) || l.message?.toLowerCase().includes(lower));
  }
  result.sort((a, b) => b.score - a.score || new Date(b.created_at) - new Date(a.created_at));
  res.json(result);
});

app.get("/api/leads/:id", (req, res) => {
  const lead = leads.find(l => l.id === Number(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json(lead);
});

app.post("/api/lead", async (req, res) => {
  const { text, link, score, message, source } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "'text' is required" });

  const lead = {
    id: Date.now(),
    text: text.trim(),
    link: link?.trim() || "",
    score: Math.min(10, Math.max(0, Number(score) || 0)),
    message: message?.trim() || "",
    source: source?.trim() || "manual",
    status: "new",
    assigned_to: null,
    // ADD THESE:
    description: req.body.description?.trim() || "",
    postedAt: req.body.postedAt || new Date().toISOString(),
    expiresAt: req.body.expiresAt || null,
    email: req.body.email || null,
    salary: req.body.salary || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  leads.push(lead);
  saveLeads(leads);
  sendLeadToTelegram(lead).catch(() => {});
  res.status(201).json(lead);
});

app.patch("/api/leads/:id/status", (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid status", valid: VALID_STATUSES });
  const idx = leads.findIndex(l => l.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Lead not found" });
  leads[idx] = { ...leads[idx], status, updated_at: new Date().toISOString() };
  saveLeads(leads);
  res.json(leads[idx]);
});

app.delete("/api/leads/:id", (req, res) => {
  const idx = leads.findIndex(l => l.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Lead not found" });
  leads.splice(idx, 1);
  saveLeads(leads);
  res.json({ success: true });
});

app.get("/api/stats", (req, res) => {
  const byStatus = {}, bySource = {};
  let totalScore = 0;
  leads.forEach(l => {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    bySource[l.source] = (bySource[l.source] || 0) + 1;
    totalScore += l.score;
  });
  res.json({
    total: leads.length,
    byStatus,
    bySource,
    avgScore: leads.length ? parseFloat((totalScore / leads.length).toFixed(1)) : 0,
    hotLeads: leads.filter(l => l.score >= 7).length,
    newLeads: byStatus.new || 0,
  });
});

// ─── Manual scrape trigger (from dashboard or Telegram) ───────────────────────
app.post("/api/scrape", async (req, res) => {
  // Respond immediately — scrape runs in background
  res.json({ ok: true, message: "Scrape started in background" });
  try {
    const { runAllSources } = require("./scraper");
    runAllSources().catch(err => console.error("[API scrape] Error:", err.message));
  } catch (err) {
    console.error("[API scrape] Could not load scraper:", err.message);
  }
});

// ─── Serve React app in production ────────────────────────────────────────────
if (IS_PROD) {
  app.get("*", (req, res) => {
    const indexPath = path.join(__dirname, "../frontend/dist/index.html");
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send("Frontend not built. Run: cd frontend && npm run build");
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Lead System API on port ${PORT}`);
  console.log(`   Mode  : ${IS_PROD ? "production" : "development"}`);
  console.log(`   Leads : ${leads.length} loaded`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  startBot(leads);
});

module.exports = { leads };
