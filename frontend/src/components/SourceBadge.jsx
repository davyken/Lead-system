const SOURCE_META = {
  "RemoteOK":      { icon: "🌍", color: "#00e5c3" },
  "Remotive":      { icon: "🌍", color: "#00b8a9" },
  "Jobicy":        { icon: "🌍", color: "#0099cc" },
  "Arbeitnow":     { icon: "🇪🇺", color: "#5c6bc0" },
  "WeWorkRemotely":{ icon: "💼", color: "#7c4dff" },
  "StackOverflow": { icon: "📚", color: "#f48024" },
  "HackerNews":    { icon: "🚀", color: "#ff6600" },
  "Freelancer.com":{ icon: "💰", color: "#29b2fe" },
  "Upwork":        { icon: "💰", color: "#14a800" },
  "LinkedIn":      { icon: "🔵", color: "#0a66c2" },
  "manual":        { icon: "✏️",  color: "#64748b" },
};

export default function SourceBadge({ source }) {
  const meta = SOURCE_META[source] || { icon: "📡", color: "#64748b" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "3px",
      fontSize: "0.65rem", fontFamily: "monospace", padding: "1px 6px",
      borderRadius: "100px", border: `1px solid ${meta.color}33`,
      background: `${meta.color}11`, color: meta.color,
      whiteSpace: "nowrap",
    }}>
      {meta.icon} {source}
    </span>
  );
}
