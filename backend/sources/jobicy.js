/**
 * SOURCE: Jobicy
 * URL: https://jobicy.com
 * Method: Free public JSON API
 * Focus: Remote tech & developer jobs
 * Docs: https://jobicy.com/api/v2/remote-jobs
 */
const axios = require("axios");

const DEV_INDUSTRIES = ["engineering","design","data","devops","qa","product","mobile","marketing"];

async function fetch() {
  const res = await axios.get("https://jobicy.com/api/v2/remote-jobs", {
    params: { count: 50, industry: "engineering" },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LeadBot/2.0)",
      "Accept": "application/json",
    },
    timeout: 15000,
  });

  const jobs = res.data?.jobs || [];

  return jobs.map(job => ({
    source: "Jobicy",
    title: job.jobTitle,
    company: job.companyName || "Unknown",
    link: job.url,
    location: job.jobGeo || "Remote",
    tags: Array.isArray(job.jobIndustry) ? job.jobIndustry : [job.jobIndustry || ""],
    salary: job.annualSalaryMin
      ? `$${job.annualSalaryMin}–$${job.annualSalaryMax}`
      : "",
    description: (job.jobExcerpt || "").slice(0, 400),
    postedAt: job.pubDate
      ? new Date(job.pubDate).toISOString()
      : new Date().toISOString(),
  }));
}

module.exports = { fetch, name: "Jobicy" };
