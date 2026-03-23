require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const axios  = require("axios");
const cron   = require("node-cron");
const { analyze } = require("./ollama");

// ─── Job Sources ──────────────────────────────────────────────────────────────
const sources = [
  require("./sources/remoteok"),
  require("./sources/remotive"),
  require("./sources/jobicy"),
  require("./sources/arbeitnow"),
  require("./sources/weworkremotely"),
  require("./sources/stackoverflow"),
  require("./sources/github"),       // HackerNews "Who's hiring"
  require("./sources/freelance"),    // Freelancer.com + Upwork
  require("./sources/linkedin"),     // LinkedIn public listings
];

const API_BASE = process.env.API_URL || "http://localhost:3000";

// ─── Deduplication ────────────────────────────────────────────────────────────
// Track seen job links in memory to avoid posting duplicates across runs
const seenLinks = new Set();

// Keywords to filter OUT (non-dev jobs that slip through)
const EXCLUDE_KEYWORDS = [
  "sales representative","account executive","marketing manager","hr manager",
  "customer success","customer support","content writer","copywriter","graphic designer",
  "project manager","finance","accounting","recruiter","office manager"
];

function isExcluded(job) {
  const text = `${job.title} ${job.description}`.toLowerCase();
  return EXCLUDE_KEYWORDS.some(kw => text.includes(kw));
}

// ─── Post lead to API ─────────────────────────────────────────────────────────
async function postLead(job) {
  const { score, message } = analyze(job);

  // Don't post low-quality leads (< score 4)
  if (score < 4) return;

  await axios.post(`${API_BASE}/api/lead`, {
    text: `[${job.source}] ${job.title} @ ${job.company} — ${job.location}`,
    link: job.link,
    score,
    message,
    source: job.source,
    // NEW FIELDS:
    description: job.description || "",
    postedAt: job.postedAt || new Date().toISOString(),
    expiresAt: job.expiresAt || null,
    email: job.email || null,
    salary: job.salary || "",
  }, { timeout: 10000 });
}

// ─── Run one source ───────────────────────────────────────────────────────────
async function runSource(source) {
  const start = Date.now();
  let fetched = 0, posted = 0, skipped = 0;

  try {
    console.log(`\n[Scraper] ▶ ${source.name} ...`);
    const jobs = await source.fetch();
    fetched = jobs.length;

    for (const job of jobs) {
      // Skip if no link or already seen
      if (!job.link) { skipped++; continue; }
      if (seenLinks.has(job.link)) { skipped++; continue; }
      if (isExcluded(job)) { skipped++; continue; }

      seenLinks.add(job.link);

      try {
        await postLead(job);
        posted++;
        // Small delay between posts to not spam the API
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.warn(`  ↳ Failed to post: ${job.title?.slice(0, 50)} — ${err.message}`);
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[Scraper] ✓ ${source.name}: ${fetched} fetched, ${posted} posted, ${skipped} skipped (${elapsed}s)`);
    return { source: source.name, fetched, posted, skipped };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`[Scraper] ✗ ${source.name}: ${err.message} (${elapsed}s)`);
    return { source: source.name, fetched: 0, posted: 0, error: err.message };
  }
}

// ─── Run all sources ──────────────────────────────────────────────────────────
async function runAllSources() {
  console.log(`\n${"═".repeat(55)}`);
  console.log(`[Scraper] Starting full scrape — ${new Date().toLocaleString("fr-FR")}`);
  console.log(`[Scraper] Sources: ${sources.map(s => s.name).join(", ")}`);
  console.log(`${"═".repeat(55)}`);

  const totalStart = Date.now();

  // Run sources in parallel batches (3 at a time to be polite)
  const results = [];
  for (let i = 0; i < sources.length; i += 3) {
    const batch = sources.slice(i, i + 3);
    const batchResults = await Promise.all(batch.map(runSource));
    results.push(...batchResults);
    if (i + 3 < sources.length) {
      await new Promise(r => setTimeout(r, 3000)); // 3s pause between batches
    }
  }

  const totalPosted = results.reduce((a, r) => a + (r.posted || 0), 0);
  const totalFetched = results.reduce((a, r) => a + (r.fetched || 0), 0);
  const elapsed = ((Date.now() - totalStart) / 1000).toFixed(1);

  console.log(`\n${"─".repeat(55)}`);
  console.log(`[Scraper] Done in ${elapsed}s — ${totalFetched} fetched, ${totalPosted} leads posted`);
  console.log(`[Scraper] Unique links seen so far: ${seenLinks.size}`);
  console.log(`${"─".repeat(55)}\n`);

  return { totalFetched, totalPosted, sources: results };
}

// ─── Scheduling ───────────────────────────────────────────────────────────────
//
// Runs every 30 minutes between 7am and 11pm (server time)
// Adjust the cron expression to your preference:
//   "*/30 7-23 * * *"  = every 30 min, 7am–11pm
//   "0 */1 * * *"      = every hour
//   "*/15 * * * *"     = every 15 min (aggressive — be careful)
//

if (require.main === module) {
  // Direct execution: run once immediately, then on schedule
  console.log("🕷️  Lead Scraper starting...");
  console.log(`   Configured sources: ${sources.length}`);
  console.log(`   API target: ${API_BASE}\n`);

  // First run immediately
  runAllSources().catch(console.error);

  // Then schedule
  cron.schedule("*/30 7-23 * * *", () => {
    runAllSources().catch(console.error);
  });

  console.log("⏰ Scheduler active: runs every 30 min (7am–11pm server time)");
} else {
  // Imported as module (e.g. from server.js)
  module.exports = { runAllSources, runSource };
}
