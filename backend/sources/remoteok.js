/**
 * SOURCE: RemoteOK
 * URL: https://remoteok.com
 * Method: Free public JSON API — no auth required
 * Focus: Remote developer jobs worldwide
 * Rate: Be polite — max 1 request per minute
 */
const axios = require("axios");
const { extractEmail } = require("../ollama");

const DEV_TAGS = [
  "dev","developer","engineer","programmer","javascript","typescript","react","vue","angular",
  "node","nodejs","python","java","php","ruby","go","rust","swift","kotlin","flutter","mobile",
  "ios","android","frontend","backend","fullstack","full-stack","devops","cloud","aws","gcp",
  "azure","architect","software","web","api","database","sql","postgres","mongodb"
];

async function fetch() {
  const res = await axios.get("https://remoteok.com/api", {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LeadBot/2.0; +https://github.com/your-repo)",
      "Accept": "application/json",
    },
    timeout: 15000,
  });

  // First element is a legal notice object — skip it
  const jobs = Array.isArray(res.data) ? res.data.slice(1) : [];

  return jobs
    .filter(job => {
      if (!job.position || !job.url) return false;
      const text = `${job.position} ${(job.tags || []).join(" ")}`.toLowerCase();
      return DEV_TAGS.some(tag => text.includes(tag));
    })
    .map(job => ({
      source: "RemoteOK",
      title: job.position,
      company: job.company || "Unknown",
      link: job.url,
      location: "Remote",
      tags: job.tags || [],
      salary: job.salary || "",
      description: (job.description || "").replace(/<[^>]*>/g, "").slice(0, 800),
      postedAt: job.date ? new Date(job.date).toISOString() : new Date().toISOString(),
      expiresAt: job.date ? new Date(new Date(job.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      email: extractEmail(job.description || ""),
    }));
}

module.exports = { fetch, name: "RemoteOK" };
