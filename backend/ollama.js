/**
 * Lead Scorer & Message Generator
 * Scores jobs 0-10 based on relevance, urgency, and opportunity signals.
 * Generates a personalized outreach message.
 *
 * To use a real LLM instead of heuristics, replace the analyze() body
 * with an Ollama or OpenAI API call (see comments at the bottom).
 */

// ─── Email Extractor ─────────────────────────────────────────────────────────

function extractEmail(text = "") {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

// ─── Scoring signals ──────────────────────────────────────────────────────────

const URGENCY_SIGNALS = [
  "urgent","asap","immediately","dès que possible","de toute urgence",
  "start immediately","immediate start","needed now","quickly","rapidement"
];

const BUDGET_SIGNALS = [
  "$","€","£","budget","salary","salaire","rate","taux","paid","rémunération",
  "compensation","package","k/year","k/month","per hour","hourly","annual"
];

const DIRECT_CLIENT_SIGNALS = [
  "freelance","mission","contract","contrat","short-term","long-term","mission longue",
  "client direct","our client","we need","looking for","seeking","recherche","projet",
  "project","build","create","develop","besoin"
];

const HIGH_VALUE_TECH = [
  "react","vue","angular","nextjs","next.js","typescript","node","nodejs",
  "python","django","fastapi","flutter","swift","kotlin","aws","gcp","azure",
  "devops","kubernetes","docker","blockchain","web3","ai","machine learning",
  "fullstack","full-stack","senior","lead","architect","staff"
];

const REMOTE_SIGNALS = [
  "remote","full remote","100% remote","télétravail","fully remote","work from home"
];

// ─── Score calculation ────────────────────────────────────────────────────────

function analyze(job) {
  const text = `${job.title} ${job.description} ${(job.tags || []).join(" ")}`.toLowerCase();
  const salaryText = (job.salary || "").toLowerCase();

  let score = 4; // baseline

  // Source bonuses (some sources have higher-quality leads)
  const sourceBonuses = {
    "HackerNews":    2,  // Startup hirings — direct employers
    "Freelancer.com": 2, // Direct client projects
    "Upwork":        2,  // Direct client projects
    "WeWorkRemotely": 1, // Curated jobs
    "Remotive":      1,  // Curated remote jobs
    "LinkedIn":      1,  // Professional network
    "RemoteOK":      0,
    "Jobicy":        0,
    "Arbeitnow":     0,
    "StackOverflow": 1,
  };
  score += (sourceBonuses[job.source] || 0);

  // Urgency: +2
  if (URGENCY_SIGNALS.some(s => text.includes(s))) score += 2;

  // Budget/salary mentioned: +1.5
  if (BUDGET_SIGNALS.some(s => text.includes(s) || salaryText.includes(s))) score += 1.5;

  // Direct freelance opportunity: +1
  if (DIRECT_CLIENT_SIGNALS.some(s => text.includes(s))) score += 1;

  // High-value tech stack: +0.5
  if (HIGH_VALUE_TECH.some(s => text.includes(s))) score += 0.5;

  // Remote: +0.5 (more accessible)
  if (REMOTE_SIGNALS.some(s => text.includes(s)) || job.location?.toLowerCase().includes("remote")) {
    score += 0.5;
  }

  // Description length = more qualified lead
  if (job.description && job.description.length > 200) score += 0.5;
  if (job.title && job.title.length > 20) score += 0.5;

  // Clamp
  score = Math.round(Math.min(10, Math.max(0, score)));

  const message = generateMessage(job, score);
  return { score, message };
}

function generateMessage(job, score) {
  const tech = (job.tags || []).slice(0, 2).join("/") || "web development";
  const company = job.company !== "Unknown" ? job.company : "";

  if (score >= 8) {
    return `Bonjour${company ? ` équipe ${company}` : ""},

J'ai vu votre offre "${job.title}" et elle correspond exactement à mon expertise. Je travaille avec ${tech} depuis plusieurs années avec des résultats concrets.

Seriez-vous disponible pour un échange de 15 minutes cette semaine afin de discuter de votre projet ?

Cordialement`;
  }

  if (score >= 5) {
    return `Bonjour,

Votre annonce pour le poste "${job.title}" a retenu mon attention. Mon profil en ${tech} pourrait correspondre à vos besoins.

N'hésitez pas à me contacter pour en savoir plus sur ma disponibilité et mes références.

Cordialement`;
  }

  return `Bonjour,

Je vous contacte suite à votre annonce "${job.title}". Je serais heureux d'en apprendre davantage sur vos besoins.

Cordialement`;
}

module.exports = { analyze, extractEmail };

/*
── To use Ollama (local LLM, free) ──────────────────────────────────────────

const axios = require("axios");

async function analyze(job) {
  const prompt = `You are a lead scoring assistant. Score this job posting from 0-10 based on how good a freelance opportunity it is, and write a short French outreach message.

Job: ${job.title}
Company: ${job.company}
Description: ${job.description}
Tags: ${(job.tags||[]).join(", ")}

Respond ONLY with JSON: {"score": 8, "message": "Bonjour..."}`;

  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3",
    prompt,
    stream: false,
    format: "json",
  });

  return JSON.parse(res.data.response);
}

── To use OpenAI GPT-4o-mini (paid, ~$0.001 per lead) ───────────────────────

const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function analyze(job) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [{
      role: "user",
      content: `Score this dev job lead 0-10 and write a French outreach message. Job: ${JSON.stringify(job)}. Reply: {"score":N,"message":"..."}`
    }],
  });
  return JSON.parse(res.choices[0].message.content);
}
*/
