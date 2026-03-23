# ⚡ Lead System v2 — Real Job Scraper

Automated developer job lead system that scrapes **10 real job sources** every 30 minutes, scores each lead, sends instant Telegram notifications, and shows everything in a live dashboard.

---

## Job Sources

| Source | Method | Focus |
|---|---|---|
| 🌍 **RemoteOK** | Free JSON API | Remote dev jobs worldwide |
| 🌍 **Remotive** | Free JSON API | Curated remote tech jobs |
| 🌍 **Jobicy** | Free JSON API | Remote tech & dev jobs |
| 🇪🇺 **Arbeitnow** | Free JSON API | European tech jobs |
| 💼 **We Work Remotely** | RSS (5 feeds) | Programming, DevOps, Full-stack, Frontend, Backend |
| 📚 **Stack Overflow** | RSS | Developer jobs from trusted community |
| 🚀 **Hacker News** | Algolia API | "Who is hiring?" monthly thread — startup leads |
| 💰 **Freelancer.com** | Public API | Direct client freelance projects |
| 💰 **Upwork** | RSS | Direct client freelance projects |
| 🔵 **LinkedIn** | HTML scraping | Professional network job listings |

---

## Quick Start

```bash
# 1. Install
npm install
cd frontend && npm install && cd ..

# 2. Configure
cp .env.example .env
# → Edit .env with your TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID

# 3. Run backend (API + Telegram bot)
npm start

# 4. Run frontend (in another terminal)
cd frontend && npm run dev

# 5. Run scraper (in another terminal)
node backend/scraper.js
```

Open **http://localhost:5173** — then click **🕷️ Scrape now** to pull real jobs immediately.

---

## How Scraping Works

```
Every 30 min (7am–11pm)
       │
       ▼
  All 10 sources run in parallel batches
       │
       ├─ RemoteOK API  ─────────┐
       ├─ Remotive API  ─────────┤
       ├─ Jobicy API    ─────────┤
       ├─ Arbeitnow API ─────────┤  → deduplicated by URL
       ├─ WWR RSS feeds ─────────┤
       ├─ StackOverflow RSS ─────┤
       ├─ HackerNews API ────────┤
       ├─ Freelancer.com ────────┤
       ├─ Upwork RSS    ─────────┤
       └─ LinkedIn HTML ─────────┘
              │
              ▼
        Score 0–10 (keyword heuristics or swap in LLM)
              │
              ├─ Score < 4  → dropped silently
              ├─ Score 4–6  → saved to dashboard
              └─ Score 7–10 → saved + 📲 Telegram notification
```

---

## Telegram Commands

| Command | What it does |
|---|---|
| `/start` | Activate bot, get Chat ID |
| `/hot` | Hot leads (score ≥ 7) |
| `/new` | Uncontacted leads |
| `/leads` | Last 5 leads |
| `/stats` | Dashboard summary + breakdown by source |
| `/sources` | List all 10 active sources |
| `/scrape` | Trigger a scrape immediately |
| `/help` | Command list |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check (used by Render) |
| GET | `/api/leads` | List + filter (`?status=new&minScore=7&source=LinkedIn&q=react`) |
| POST | `/api/lead` | Create lead manually |
| PATCH | `/api/leads/:id/status` | Update status |
| DELETE | `/api/leads/:id` | Delete lead |
| GET | `/api/stats` | Aggregated stats by status & source |
| POST | `/api/scrape` | Trigger a scrape run (non-blocking) |

---

## Deploy to Render

1. Push to GitHub
2. [render.com](https://render.com) → **New → Blueprint** → connect repo (detects `render.yaml`)
3. In the Render dashboard → **Environment** → add:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `NODE_ENV` = `production`
4. Deploy ✅

> The scraper runs inside the same process as the server. On Render free tier, the service sleeps after 15 min idle. Ping `/api/health` with UptimeRobot to keep it awake, or upgrade to Starter ($7/mo).

---

## Upgrade: Use a Real LLM for Scoring

In `backend/ollama.js`, the `analyze()` function is heuristic-based.
Swap it for OpenAI or a local Ollama model — instructions are in the file comments.

```bash
# Use local Ollama (free, private)
ollama run llama3

# Use OpenAI (add to .env)
OPENAI_API_KEY=sk-...
```

---

## Adding More Sources

Each source is a file in `backend/sources/` that exports:
- `name` — display name string
- `fetch()` — async function returning an array of job objects

```js
// backend/sources/mysite.js
async function fetch() {
  const res = await axios.get("https://mysite.com/api/jobs");
  return res.data.jobs.map(job => ({
    source: "MySite",
    title: job.title,
    company: job.company,
    link: job.url,
    location: job.location,
    tags: job.skills,
    salary: job.salary,
    description: job.body,
    postedAt: job.createdAt,
  }));
}
module.exports = { fetch, name: "MySite" };
```

Then add it to the `sources` array in `backend/scraper.js`.
