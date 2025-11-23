import ContentShell from "../components/ContentShell";

const metrics = [
  { label: "Active users", value: "1,242" },
  { label: "New signups", value: "53" },
  { label: "Pending verifications", value: "11" },
  { label: "System alerts", value: "2" },
];

export default function DashboardPage() {
  return (
    <ContentShell
      title="Dashboard"
      description="Überwache aktuell gesammelte Nutzer-Metriken und Systemstatus."
    >
      <div className="page-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="placeholder-card">
            <h3>{metric.label}</h3>
            <p>{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="placeholder-card">
        <h3>Activity snapshot</h3>
        <p>Letzte 24 Stunden: 432 neue Scans, 19 Moderationseinträge, 3 Server-Neustarts.</p>
      </div>
    </ContentShell>
  );
}
