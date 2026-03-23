require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const { connectDB, Lead, User, startCleanupInterval } = require("./db");
const { startBot, sendLeadToTelegram } = require("./telegram");

const app     = express();
const PORT    = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";

// ─── Middleware ───────────────────────────────────────────────────────────────
// Allow all origins for development - in production, restrict this
app.use(cors({
  origin: process.env.FRONTEND_URLS?.split(',') || ['https://lead-system-pi.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Explicit preflight handler
app.options('*', cors());

if (IS_PROD) {
  const staticPath = path.join(__dirname, "../frontend/dist");
  if (fs.existsSync(staticPath)) app.use(express.static(staticPath));
}

// CORS safety net headers (after all middleware)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (process.env.FRONTEND_URLS?.split(',').includes(origin) || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

const VALID_STATUSES = ["new", "contacted", "qualified", "closed", "rejected"];

// ─── Routes ───────────────────────────────────────────────────────────────────

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  const total = await Lead.countDocuments();
  res.json({ status: "ok", leads: total, uptime: Math.round(process.uptime()) });
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────────

// Register new user
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: password // In production, hash this with bcrypt!
    });
    
    res.status(201).json({ message: "Account created successfully", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    res.json({ message: "Login successful", user: { email: user.email, id: user._id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET all leads (with filters) ─────────────────────────────────────────────
app.get("/api/leads", async (req, res) => {
  try {
    const { status, minScore, maxScore, source, q, favorite } = req.query;
    const filter = {};

    if (status)   filter.status = status;
    if (source)   filter.source = source;
    if (minScore) filter.score  = { ...filter.score, $gte: Number(minScore) };
    if (maxScore) filter.score  = { ...filter.score, $lte: Number(maxScore) };
    if (favorite === "true") filter.favorite = true;
    if (q) filter.$or = [
      { text:        { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { message:     { $regex: q, $options: "i" } },
      { source:      { $regex: q, $options: "i" } },
    ];

    const leads = await Lead.find(filter)
      .sort({ favorite: -1, score: -1, created_at: -1 })
      .limit(200);

    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single lead ───────────────────────────────────────────────────────────
app.get("/api/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST — Add new lead ───────────────────────────────────────────────────────
app.post("/api/lead", async (req, res) => {
  const { text, link, score, message, source, description, salary, email } = req.body;

  if (!text?.trim()) return res.status(400).json({ error: "'text' is required" });

  try {
    const lead = await Lead.create({
      text:        text.trim(),
      link:        link?.trim() || "",
      score:       Math.min(10, Math.max(0, Number(score) || 0)),
      message:     message?.trim() || "",
      source:      source?.trim() || "manual",
      description: description?.trim() || "",
      salary:      salary?.trim() || "",
      email:       email || null,
      favorite:    false,
      status:      "new",
      assigned_to: null,
    });

    sendLeadToTelegram(lead).catch(() => {});
    res.status(201).json(lead);
  } catch (err) {
    // Duplicate link — silently skip
    if (err.code === 11000) return res.status(200).json({ duplicate: true });
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH — Update status ─────────────────────────────────────────────────────
app.patch("/api/leads/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status", valid: VALID_STATUSES });
  }
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status, updated_at: new Date() },
      { new: true }
    );
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH — Toggle favorite ───────────────────────────────────────────────────
app.patch("/api/leads/:id/favorite", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    lead.favorite   = !lead.favorite;
    lead.updated_at = new Date();
    await lead.save();

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE — Remove lead ──────────────────────────────────────────────────────
app.delete("/api/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET stats ─────────────────────────────────────────────────────────────────
app.get("/api/stats", async (req, res) => {
  try {
    const [total, newLeads, hotLeads, favorites, avgResult, bySource, byStatus, userCount] =
      await Promise.all([
        Lead.countDocuments(),
        Lead.countDocuments({ status: "new" }),
        Lead.countDocuments({ score: { $gte: 7 } }),
        Lead.countDocuments({ favorite: true }),
        Lead.aggregate([{ $group: { _id: null, avg: { $avg: "$score" } } }]),
        Lead.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }]),
        Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        User.countDocuments(),
      ]);

    res.json({
      total,
      newLeads,
      hotLeads,
      favorites,
      userCount,
      avgScore:  parseFloat(avgResult[0]?.avg?.toFixed(1) || 0),
      bySource:  Object.fromEntries(bySource.map(s => [s._id, s.count])),
      byStatus:  Object.fromEntries(byStatus.map(s => [s._id, s.count])),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// ─── Start ──────────────────────────────────────────────────────────────────
// Start server even if DB is not ready - handle connection in routes
app.listen(PORT, '0.0.0.0', () => {
  try {
    console.log(`\n🚀 Lead System API on port ${PORT}`);
    console.log(`   Mode  : ${IS_PROD ? "production" : "development"}`);
    
    // Try to get lead count, but don't fail if DB not ready
    Lead.countDocuments()
      .then(total => {
        console.log(`   Leads : ${total} loaded`);
        startCleanupInterval();
        console.log(`   Auto-cleanup: enabled (12h)`);
      })
      .catch(err => {
        console.warn("   ⚠️  Database not ready yet:", err.message);
        console.log("   API will work, but some features may be limited");
      });

// Start Telegram bot safely (non-blocking)
    Promise.resolve()
      .then(async () => {
        try {
          const leads = await Lead.find({}).limit(100).catch(() => []);
          if (typeof startBot === 'function') {
            await startBot(leads);
          }
        } catch (err) {
          console.warn("   ⚠️  Telegram bot disabled:", err.message);
        }
      });
    
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  } catch (err) {
    console.error("❌ Server startup error:", err.message);
  }
});

module.exports = app;
