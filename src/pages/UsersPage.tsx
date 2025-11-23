import ContentShell from "../components/ContentShell";

const demoUsers = [
  { name: "Astra Vigil", role: "admin", lastActive: "2m ago" },
  { name: "Lukas Stark", role: "moderator", lastActive: "10m ago" },
  { name: "Marin Sol", role: "guest", lastActive: "1h ago" },
];

export default function UsersPage() {
  return (
    <ContentShell title="User Management" description="Verwalte Rollen, Status und Zugriffe.">
      <div className="placeholder-card">
        <h3>Aktive Moderatoren</h3>
        <ul>
          {demoUsers.map((user) => (
            <li key={user.name}>
              <strong>{user.name}</strong> • {user.role} • {user.lastActive}
            </li>
          ))}
        </ul>
      </div>
      <div className="placeholder-card">
        <h3>Monitoring</h3>
        <p>Letzte Änderung: Benutzerrolle für eingehende Tickets prüfen.</p>
      </div>
    </ContentShell>
  );
}
