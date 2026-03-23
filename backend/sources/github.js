/**
 * SOURCE: GitHub Jobs (via GitHub's public API — search for hiring repos/gists)
 * + Hacker News "Who is hiring?" monthly thread
 * Method: HN Algolia search API (completely free & open)
 * Focus: Startup/tech company hiring posts — very high quality leads
 */
const axios = require("axios");

// Keywords to search in HN hiring posts
const HN_KEYWORDS = [
  "developer", "engineer", "frontend", "backend", "fullstack",
  "react", "node", "python", "javascript", "remote"
];

async function fetchHackerNews() {
  // HN "Who is hiring?" posts — search Algolia's HN API
  // This finds the most recent "Ask HN: Who is hiring?" thread
  const searchRes = await axios.get("https://hn.algolia.com/api/v1/search", {
    params: {
      query: "Ask HN: Who is hiring?",
      tags: "story",
      hitsPerPage: 1,
    },
    timeout: 10000,
  });

  const thread = searchRes.data?.hits?.[0];
  if (!thread) return [];

  const threadId = thread.objectID;
  console.log(`[HN] Using thread: "${thread.title}" (${threadId})`);

  // Get all top-level comments from the hiring thread
  const commentsRes = await axios.get(`https://hn.algolia.com/api/v1/search`, {
    params: {
      tags: `comment,story_${threadId}`,
      hitsPerPage: 50,
    },
    timeout: 10000,
  });

  const comments = commentsRes.data?.hits || [];

  return comments
    .filter(c => c.comment_text && c.comment_text.length > 50)
    .map(c => {
      // HN hiring posts usually start with "Company | Role | Location | ..."
      const text = c.comment_text.replace(/<[^>]*>/g, " ").trim();
      const firstLine = text.split(/\n/)[0].slice(0, 150);
      const parts = firstLine.split("|").map(p => p.trim());

      const company  = parts[0] || "Unknown";
      const title    = parts[1] || "Developer Position";
      const location = parts[2] || "Remote";

      return {
        source: "HackerNews",
        title: title.slice(0, 100),
        company: company.slice(0, 80),
        link: `https://news.ycombinator.com/item?id=${c.objectID}`,
        location,
        tags: ["startup", "tech"],
        salary: parts.find(p => p.match(/\$[\d,]+/)) || "",
        description: text.slice(0, 400),
        postedAt: c.created_at || new Date().toISOString(),
      };
    });
}

async function fetch() {
  try {
    return await fetchHackerNews();
  } catch (err) {
    console.warn("[HackerNews] Failed:", err.message);
    return [];
  }
}

module.exports = { fetch, name: "HackerNews" };
