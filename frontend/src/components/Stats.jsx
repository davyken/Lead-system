export default function Stats({ stats }) {
  const items = [
    { label: "Total Leads",   value: stats?.total      ?? "—", cls: "" },
    { label: "Non traités",   value: stats?.newLeads   ?? "—", cls: "accent" },
    { label: "Leads chauds",  value: stats?.hotLeads   ?? "—", cls: "gold" },
    { label: "Score moyen",   value: stats ? `${stats.avgScore}/10` : "—", cls: "orange" },
  ];

  return (
    <section aria-label="Statistiques des leads">
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
