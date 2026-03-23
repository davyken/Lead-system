const TelegramBot = require("node-telegram-bot-api");

let bot = null;
let leadsRef = null;

function scoreEmoji(score) {
  if (score >= 8) return "🔥";
  if (score >= 5) return "⭐";
  return "❄️";
}

const STATUS_EMOJI = { new:"🆕", contacted:"📞", qualified:"✅", closed:"🎉", rejected:"❌" };

function escMd(text = "") {
  if (!text) return "";
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1")
    .slice(0, 300);
}

function formatLead(lead) {
  const se = scoreEmoji(lead.score);
  const st = STATUS_EMOJI[lead.status] || "❓";

  const posted = lead.postedAt
    ? new Date(lead.postedAt).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })
    : "Unknown";

  const expires = lead.expiresAt
    ? new Date(lead.expiresAt).toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" })
    : null;

  const lines = [
    `${se} *${escMd(lead.text)}*`,
    ``,
    `${st} Status: \`${lead.status}\` \\| 📡 ${escMd(lead.source)}`,
    `💯 Score: *${lead.score}/10*`,
    lead.salary ? `💰 Salary: ${escMd(lead.salary)}` : null,
    ``,
    `📅 Posted: ${posted}`,
    expires ? `⏳ Expires: ~${expires}` : null,
    lead.link ? `🔗 ${escMd(lead.link)}` : null,
    lead.email ? `📧 Contact: \`${escMd(lead.email)}\`` : null,
    ``,
  ];

  if (lead.description) {
    lines.push(`📝 *Description:*`);
    lines.push(escMd(lead.description.slice(0, 500)));
    lines.push(``);
  }

  if (lead.message) {
    lines.push(`💬 *Suggested message:*`);
    lines.push(`_${escMd(lead.message)}_`);
  }

  return lines.filter(l => l !== null).join("\n");
}

function startBot(leads) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === "your_telegram_bot_token_here") {
    console.warn("⚠️  TELEGRAM_BOT_TOKEN not set — bot disabled");
    return;
  }
  leadsRef = leads;
  try {
    bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/start/, msg => {
      bot.sendMessage(msg.chat.id,
        `🤖 *Lead System Bot actif\\!*\n\nNotifications automatiques pour chaque job scrapé\\.\n\n*Commandes :*\n/leads — 5 derniers leads\n/new — Leads non traités\n/hot — Leads score ≥ 7\n/stats — Statistiques\n/scrape — Lancer un scrape maintenant\n/sources — Sources actives\n/help — Aide\n\n📋 Votre Chat ID : \`${msg.chat.id}\``,
        { parse_mode: "MarkdownV2" }
      );
    });

    bot.onText(/\/leads/, msg => {
      const recent = [...leadsRef].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
      if (!recent.length) return bot.sendMessage(msg.chat.id, "📭 Aucun lead encore\\.", { parse_mode: "MarkdownV2" });
      recent.forEach(l => bot.sendMessage(msg.chat.id, formatLead(l), { parse_mode: "MarkdownV2" }));
    });

    bot.onText(/\/new/, msg => {
      const newLeads = leadsRef.filter(l => l.status === "new").slice(0,5);
      if (!newLeads.length) return bot.sendMessage(msg.chat.id, "✅ Aucun lead en attente\\.", { parse_mode: "MarkdownV2" });
      newLeads.forEach(l => bot.sendMessage(msg.chat.id, formatLead(l), { parse_mode: "MarkdownV2" }));
    });

    bot.onText(/\/hot/, msg => {
      const hot = leadsRef.filter(l => l.score >= 7 && !["closed","rejected"].includes(l.status))
        .sort((a,b) => b.score - a.score).slice(0,5);
      if (!hot.length) return bot.sendMessage(msg.chat.id, "❄️ Aucun lead chaud\\.", { parse_mode: "MarkdownV2" });
      hot.forEach(l => bot.sendMessage(msg.chat.id, formatLead(l), { parse_mode: "MarkdownV2" }));
    });

    bot.onText(/\/stats/, msg => {
      const total = leadsRef.length;
      const byStatus = {}, bySource = {};
      let totalScore = 0;
      leadsRef.forEach(l => {
        byStatus[l.status] = (byStatus[l.status] || 0) + 1;
        bySource[l.source] = (bySource[l.source] || 0) + 1;
        totalScore += l.score;
      });
      const avg  = total ? (totalScore/total).toFixed(1) : "—";
      const hot  = leadsRef.filter(l => l.score >= 7).length;
      const srcLines = Object.entries(bySource).sort((a,b)=>b[1]-a[1])
        .map(([s,c]) => `📡 ${escMd(s)} : *${c}*`).join("\n");
      const stLines = Object.entries(byStatus)
        .map(([s,c]) => `${STATUS_EMOJI[s]||"❓"} ${s} : *${c}*`).join("\n");
      bot.sendMessage(msg.chat.id,
        `📊 *Statistiques*\n\n📈 Total : *${total}*\n🔥 Chauds \\(≥7\\) : *${hot}*\n🆕 Non traités : *${byStatus.new||0}*\n💯 Score moyen : *${avg}/10*\n\n*Par source :*\n${srcLines||"—"}\n\n*Par statut :*\n${stLines||"—"}`,
        { parse_mode: "MarkdownV2" }
      );
    });

    bot.onText(/\/sources/, msg => {
      const sources = [
        "🌍 RemoteOK — remoteok\\.com \\(API libre\\)",
        "🌍 Remotive — remotive\\.com \\(API libre\\)",
        "🌍 Jobicy — jobicy\\.com \\(API libre\\)",
        "🇪🇺 Arbeitnow — arbeitnow\\.com \\(API libre\\)",
        "💼 WeWorkRemotely — weworkremotely\\.com \\(RSS\\)",
        "💼 StackOverflow — stackoverflow\\.com \\(RSS\\)",
        "🚀 HackerNews — 'Who is hiring\\?' \\(Algolia API\\)",
        "💰 Freelancer\\.com \\(API publique\\)",
        "💰 Upwork \\(RSS\\)",
        "🔵 LinkedIn \\(scraping HTML public\\)",
      ].join("\n");
      bot.sendMessage(msg.chat.id, `📡 *Sources actives \\(${10}\\) :*\n\n${sources}`, { parse_mode: "MarkdownV2" });
    });

    bot.onText(/\/scrape/, async msg => {
      bot.sendMessage(msg.chat.id, "🕷️ Scrape lancé\\! Vous recevrez les notifications au fur et à mesure\\.", { parse_mode: "MarkdownV2" });
      try {
        const { runAllSources } = require("./scraper");
        runAllSources().catch(err => console.error("[Telegram scrape] Error:", err.message));
      } catch (err) {
        bot.sendMessage(msg.chat.id, `❌ Erreur : ${escMd(err.message)}`, { parse_mode: "MarkdownV2" });
      }
    });

    bot.onText(/\/help/, msg => {
      bot.sendMessage(msg.chat.id,
        `*📖 Aide — Lead System Bot*\n\n/start — Démarrer\n/leads — 5 derniers leads\n/new — Non traités\n/hot — Score ≥ 7\n/stats — Statistiques\n/scrape — Lancer un scrape\n/sources — Liste des sources\n/help — Ce menu`,
        { parse_mode: "MarkdownV2" }
      );
    });

    bot.on("polling_error", err => console.error("Telegram polling error:", err.message));
    bot.on("error",         err => console.error("Telegram error:", err.message));

    console.log("✅ Telegram bot started");
  } catch (err) {
    console.error("❌ Telegram bot failed:", err.message);
  }
}

async function sendLeadToTelegram(lead) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!bot || !chatId || chatId === "your_chat_id_here") return;
  try {
    await bot.sendMessage(chatId, formatLead(lead), { parse_mode: "MarkdownV2" });
  } catch (err) {
    console.error("⚠️  Telegram send failed:", err.message);
  }
}

module.exports = { startBot, sendLeadToTelegram };
