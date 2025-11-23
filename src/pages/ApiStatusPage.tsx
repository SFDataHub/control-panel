import ContentShell from "../components/ContentShell";

const services = [
  { label: "Auth API", status: "Healthy", response: "34 ms" },
  { label: "Player Data API", status: "Healthy", response: "112 ms" },
  { label: "Moderation API", status: "Degraded", response: "287 ms" },
];

export default function ApiStatusPage() {
  return (
    <ContentShell title="API Status" description="Überprüfe die oberen Endpunkte des Backends.">
      <div className="page-grid">
        {services.map((service) => (
          <div key={service.label} className="placeholder-card">
            <h3>{service.label}</h3>
            <p>Status: {service.status}</p>
            <p>Antwortzeit: {service.response}</p>
          </div>
        ))}
      </div>
    </ContentShell>
  );
}
