/**
 * SOURCE: Arbeitnow
 * URL: https://www.arbeitnow.com
 * Method: Free public JSON API — no auth
 * Focus: European tech jobs (especially Germany, remote-friendly)
 * Docs: https://www.arbeitnow.com/api/job-board-api
 */
const axios = require("axios");

const DEV_KEYWORDS = [
  "developer","engineer","programmer","software","frontend","backend","fullstack",
  "devops","cloud","mobile","architect","javascript","python","java","react","node"
];

async function fetch() {
  const res = await axios.get("https://www.arbeitnow.com/api/job-board-api", {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LeadBot/2.0)",
      "Accept": "application/json",
    },
    timeout: 15000,
  });

  const jobs = res.data?.data || [];

  return jobs
    .filter(job => {
      const text = `${job.title} ${(job.tags || []).join(" ")}`.toLowerCase();
      return DEV_KEYWORDS.some(kw => text.includes(kw));
    })
    .map(job => ({
      source: "Arbeitnow",
      title: job.title,
      company: job.company_name || "Unknown",
      link: job.url,
      location: job.remote ? "Remote" : (job.location || "Europe"),
      tags: job.tags || [],
      salary: "",
      description: (job.description || "").replace(/<[^>]*>/g, "").slice(0, 400),
      postedAt: job.created_at
        ? new Date(job.created_at * 1000).toISOString()
        : new Date().toISOString(),
    }));
}

module.exports = { fetch, name: "Arbeitnow" };
