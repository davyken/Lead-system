export default function Stats({ stats }) {
  const items = [
    { label: "Total Leads",   value: stats?.total      ?? "—", cls: "" },
    { label: "New",          value: stats?.newLeads   ?? "—", cls: "accent" },
    { label: "Hot (≥7)",     value: stats?.hotLeads   ?? "—", cls: "gold" },
    { label: "Avg Score",    value: stats ? `${stats.avgScore}/10` : "—", cls: "orange" },
    { label: "⭐ Favorites", value: stats?.favorites  ?? "—", cls: "gold" },
    { label: "👥 Users",     value: stats?.userCount  ?? "—", cls: "accent" },
  ];

  return (
    <section aria-label="Lead statistics">
      <dl className="stats-bar">
        {items.map((item) => (
          <div className="stat-item" key={item.label}>
            <dt className="stat-item__label">{item.label}</dt>
            <dd className={`stat-item__value ${item.cls}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
