/**
 * SOURCE: Stack Overflow / Overflow Jobs
 * URL: https://stackoverflow.com/jobs (RSS)
 * Method: Public RSS feed
 * Focus: Developer jobs from the most trusted dev community
 */
const Parser = require("rss-parser");

const FEEDS = [
  "https://stackoverflow.com/jobs/feed?r=true&sort=p&c=&ms=Intern&mxs=Senior&j=Permanent,Contract",
  "https://stackoverflow.com/jobs/feed?r=true&t=javascript,typescript,react,vue,angular,nodejs",
  "https://stackoverflow.com/jobs/feed?r=true&t=python,django,fastapi,flask",
];

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadBot/2.0)" },
  customFields: {
    item: [
      ["a10:salary", "salary"],
      ["location", "location"],
    ],
  },
});

async function fetch() {
  const results = [];

  await Promise.allSettled(
    FEEDS.map(async url => {
      try {
        const parsed = await parser.parseURL(url);
        for (const item of parsed.items || []) {
          // Extract company from author field or title
          const company = item.author || item.creator || "Unknown";
          const tags = (item.categories || []).map(c =>
            typeof c === "string" ? c : c._ || ""
          ).filter(Boolean);

          results.push({
            source: "StackOverflow",
            title: item.title || "",
            company,
            link: item.link || item.guid,
            location: item.location || "Remote",
            tags,
            salary: item.salary || "",
            description: (item.contentSnippet || "").slice(0, 400),
            postedAt: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn(`[StackOverflow] Feed failed:`, err.message);
      }
    })
  );

  return results;
}

module.exports = { fetch, name: "StackOverflow" };
