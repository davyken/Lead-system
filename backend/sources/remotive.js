/**
 * SOURCE: Remotive
 * URL: https://remotive.com
 * Method: Free public JSON API — no auth required
 * Focus: Curated remote tech jobs
 * Docs: https://remotive.com/api/remote-jobs
 */
const axios = require("axios");

async function fetch() {
  // Fetch software dev category directly
  const res = await axios.get("https://remotive.com/api/remote-jobs", {
    params: { category: "software-dev", limit: 50 },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LeadBot/2.0)",
      "Accept": "application/json",
    },
    timeout: 15000,
  });

  const jobs = res.data?.jobs || [];

  return jobs.map(job => ({
    source: "Remotive",
    title: job.title,
    company: job.company_name || "Unknown",
    link: job.url,
    location: job.candidate_required_location || "Remote",
    tags: job.tags || [],
    salary: job.salary || "",
    description: (job.description || "").replace(/<[^>]*>/g, "").slice(0, 400),
    postedAt: job.publication_date
      ? new Date(job.publication_date).toISOString()
      : new Date().toISOString(),
  }));
}

module.exports = { fetch, name: "Remotive" };
