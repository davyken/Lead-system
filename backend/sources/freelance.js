/**
 * SOURCE: Freelance Platforms
 * - Malt (French RSS feed)
 * - Upwork (public RSS)
 * - Freelancer.com (public search)
 * Method: RSS feeds + public JSON
 * Focus: Freelance developer missions — direct client leads!
 */
const Parser = require("rss-parser");
const axios  = require("axios");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadBot/2.0)" },
});

const DEV_KEYWORDS = [
  "developer","développeur","engineer","ingénieur","programmer","programmer",
  "javascript","react","vue","angular","node","python","php","java","mobile",
  "frontend","backend","fullstack","wordpress","shopify","application","site web",
  "web","api","devops","cloud"
];

function isDevJob(text) {
  const lower = text.toLowerCase();
  return DEV_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── Freelancer.com public project search API ─────────────────────────────────
async function fetchFreelancerCom() {
  try {
    // Freelancer.com has a public API for project search (no auth for basic search)
    const res = await axios.get("https://www.freelancer.com/api/projects/0.1/projects/active/", {
      params: {
        job_details: true,
        limit: 50,
        offset: 0,
        // Search for developer projects
        query: "developer web application",
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LeadBot/2.0)",
        "Accept": "application/json",
      },
      timeout: 15000,
    });

    const projects = res.data?.result?.projects || [];

    return projects
      .filter(p => isDevJob(`${p.title} ${p.description || ""}`))
      .map(p => {
        const budgetMin = p.budget?.minimum || 0;
        const budgetMax = p.budget?.maximum || 0;
        return {
          source: "Freelancer.com",
          title: p.title,
          company: "Client (Freelancer.com)",
          link: `https://www.freelancer.com/projects/${p.seo_url || p.id}`,
          location: "Remote",
          tags: (p.jobs || []).map(j => j.name).filter(Boolean),
          salary: budgetMin ? `$${budgetMin}–$${budgetMax}` : "",
          description: (p.description || "").slice(0, 400),
          postedAt: p.time_submitted
            ? new Date(p.time_submitted * 1000).toISOString()
            : new Date().toISOString(),
        };
      });
  } catch (err) {
    console.warn("[Freelancer.com] Failed:", err.message);
    return [];
  }
}

// ─── Upwork RSS ───────────────────────────────────────────────────────────────
async function fetchUpwork() {
  try {
    // Upwork public RSS for job listings
    const feeds = [
      "https://www.upwork.com/ab/feed/jobs/rss?paging=0%3B10&sort=recency&q=javascript+developer",
      "https://www.upwork.com/ab/feed/jobs/rss?paging=0%3B10&sort=recency&q=react+developer",
      "https://www.upwork.com/ab/feed/jobs/rss?paging=0%3B10&sort=recency&q=python+developer",
      "https://www.upwork.com/ab/feed/jobs/rss?paging=0%3B10&sort=recency&q=fullstack+developer",
    ];

    const results = [];

    await Promise.allSettled(
      feeds.map(async feedUrl => {
        try {
          const parsed = await parser.parseURL(feedUrl);
          for (const item of parsed.items || []) {
            results.push({
              source: "Upwork",
              title: item.title || "",
              company: "Client (Upwork)",
              link: item.link || item.guid,
              location: "Remote",
              tags: (item.categories || []).filter(Boolean),
              salary: "",
              description: (item.contentSnippet || item.content || "").replace(/<[^>]*>/g, "").slice(0, 400),
              postedAt: item.pubDate
                ? new Date(item.pubDate).toISOString()
                : new Date().toISOString(),
            });
          }
        } catch {
          // Upwork sometimes blocks RSS — silently fail per feed
        }
      })
    );

    return results;
  } catch (err) {
    console.warn("[Upwork] Failed:", err.message);
    return [];
  }
}

// ─── Malt RSS (French freelance platform) ────────────────────────────────────
async function fetchMalt() {
  try {
    // Malt doesn't have an official RSS but their sitemap/search is public
    // Use their public project listings if available
    const res = await axios.get("https://www.malt.fr/api/1/search", {
      params: {
        query: "développeur web",
        page: 0,
        size: 20,
        availability: true,
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LeadBot/2.0)",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      timeout: 10000,
    });

    const profiles = res.data?.profiles || res.data?.results || [];
    // Malt search returns freelancer profiles, not jobs
    // We'll treat them as potential clients looking for devs... not a great fit
    return [];
  } catch {
    return [];
  }
}

async function fetch() {
  const [freelancerJobs, upworkJobs] = await Promise.all([
    fetchFreelancerCom(),
    fetchUpwork(),
  ]);

  return [...freelancerJobs, ...upworkJobs];
}

module.exports = { fetch, name: "Freelance" };
