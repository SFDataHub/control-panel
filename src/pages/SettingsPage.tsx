import ContentShell from "../components/ContentShell";

export default function SettingsPage() {
  return (
    <ContentShell title="Settings" description="Konfiguriere Plattform- und Moderationseinstellungen.">
      <div className="placeholder-card">
        <h3>Theme</h3>
        <p>Dark Mode ist aktiviert. Weitere Optionen folgen im nächsten Release.</p>
      </div>
      <div className="placeholder-card">
        <h3>Benachrichtigungen</h3>
        <p>Keine kritischen Alerts. Aktiviert: E-Mail an alle Moderatoren.</p>
      </div>
    </ContentShell>
  );
}
