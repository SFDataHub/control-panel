import ContentShell from "../components/ContentShell";

const logs = [
  "[14:52] Moderator Lukas Stark markierte 'Harena' als überprüft.",
  "[14:37] Audit Log exportiert (CSV) von Demo Admin.",
  "[14:15] Neue Discord-OAuth-Sitzung für Benutzer Marine_Sky.",
];

export default function LogsPage() {
  return (
    <ContentShell title="Audit Logs" description="Chronologische Übersicht geplanter Änderungen.">
      <div className="placeholder-card">
        <h3>Letzte Audit-Einträge</h3>
        <ul>
          {logs.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>
      </div>
      <div className="placeholder-card">
        <h3>Laufende Alerts</h3>
        <p>Keine kritischen Logs in den letzten 15 Minuten.</p>
      </div>
    </ContentShell>
  );
}
