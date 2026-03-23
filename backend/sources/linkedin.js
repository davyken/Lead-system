/**
 * SOURCE: LinkedIn
 * URL: https://linkedin.com/jobs
 * Method: Scrape public job listings (no login needed for basic search)
 * Focus: Professional dev jobs — widest reach
 *
 * ⚠️  Notes:
 * - LinkedIn's public job search is accessible without login
 * - Rotate User-Agent strings & add delays to stay respectful
 * - LinkedIn may start requiring login for some searches over time
 * - If blocked, results simply return empty (doesn't crash the system)
 */
const axios = require("axios");
const cheerio = require("cheerio");

// Keywords to search for — each becomes a separate query
const SEARCH_TERMS = [
  "javascript developer",
  "react developer",
  "node.js developer",
  "fullstack developer",
  "python developer",
  "frontend developer",
  "backend developer",
  "mobile developer",
  "devops engineer",
  "software engineer",
];

// Realistic browser User-Agent strings to rotate
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function scrapeKeyword(keyword) {
  const url = "https://www.linkedin.com/jobs/search/";
  const params = {
    keywords: keyword,
    f_TPR: "r86400",   // last 24 hours
    f_WT: "2",         // remote jobs
    sortBy: "DD",      // most recent
    position: 1,
    pageNum: 0,
  };

  const res = await axios.get(url, {
    params,
    headers: {
      "User-Agent": randomUA(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Cache-Control": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
    },
    timeout: 20000,
  });

  const $ = cheerio.load(res.data);
  const jobs = [];

  // LinkedIn job card selectors (public listings page)
  $(".job-search-card, .base-card, [data-entity-urn]").each((_, el) => {
    const $el = $(el);

    const title = $el.find(".base-search-card__title, h3.base-search-card__title").text().trim()
      || $el.find("h3").first().text().trim();

    const company = $el.find(".base-search-card__subtitle, h4.base-search-card__subtitle").text().trim()
      || $el.find("h4").first().text().trim();

    const location = $el.find(".job-search-card__location, .base-search-card__metadata").text().trim();

    const link = $el.find("a.base-card__full-link, a[href*='/jobs/view/']").attr("href")
      || $el.find("a").first().attr("href");

    const postedAt = $el.find("time").attr("datetime") || new Date().toISOString();

    if (title && (link || company)) {
      jobs.push({
        source: "LinkedIn",
        title: title.replace(/\s+/g, " ").trim(),
        company: company.replace(/\s+/g, " ").trim() || "Unknown",
        link: link?.startsWith("http") ? link : `https://www.linkedin.com${link}`,
        location: location.replace(/\s+/g, " ").trim() || "Remote / On-site",
        tags: [keyword],
        salary: "",
        description: `${keyword} position at ${company}`,
        postedAt: new Date(postedAt).toISOString(),
      });
    }
  });

  return jobs;
}

async function fetch() {
  const results = [];
  // Only pick 3 random keywords per run to stay polite and fast
  const selectedTerms = SEARCH_TERMS
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  for (const term of selectedTerms) {
    try {
      const jobs = await scrapeKeyword(term);
      results.push(...jobs);
      console.log(`[LinkedIn] "${term}" → ${jobs.length} jobs`);
      // Polite delay between requests
      await delay(2000 + Math.random() * 2000);
    } catch (err) {
      // LinkedIn may block — don't crash
      console.warn(`[LinkedIn] Failed for "${term}":`, err.message);
    }
  }

  return results;
}

module.exports = { fetch, name: "LinkedIn" };
