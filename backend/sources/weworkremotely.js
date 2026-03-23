/**
 * SOURCE: We Work Remotely
 * URL: https://weworkremotely.com
 * Method: Public RSS feeds — no auth required
 * Focus: Programming, DevOps, design, product jobs
 */
const Parser = require("rss-parser");

const RSS_FEEDS = [
  {
    url: "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    category: "Programming",
  },
  {
    url: "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
    category: "DevOps",
  },
  {
    url: "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss",
    category: "Full Stack",
  },
  {
    url: "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
    category: "Frontend",
  },
  {
    url: "https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss",
    category: "Backend",
  },
];

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; LeadBot/2.0)",
  },
});

async function fetch() {
  const results = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async feed => {
      try {
        const parsed = await parser.parseURL(feed.url);
        for (const item of parsed.items || []) {
          // WWR title format: "Company: Position"
          const parts = (item.title || "").split(": ");
          const company = parts.length > 1 ? parts[0].trim() : "Unknown";
          const title   = parts.length > 1 ? parts.slice(1).join(": ").trim() : item.title;

          results.push({
            source: "WeWorkRemotely",
            title,
            company,
            link: item.link || item.guid,
            location: "Remote",
            tags: [feed.category],
            salary: "",
            description: (item.contentSnippet || item.content || "").slice(0, 400),
            postedAt: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn(`[WWR] Failed to fetch ${feed.category}:`, err.message);
      }
    })
  );

  return results;
}

module.exports = { fetch, name: "WeWorkRemotely" };
