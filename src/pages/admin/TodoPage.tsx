import { useMemo, useState } from "react";
import ContentShell from "../../components/ContentShell";
import PageHeader from "../../components/PageHeader";

type Priority = "High" | "Medium" | "Low";
type Status = "Open" | "In Progress" | "Blocked" | "Done";
type Category = "Backend" | "Frontend" | "User Management" | "Security" | "Bugfix";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
  owners: string[];
  category: Category;
  dependencies?: string[];
  comments?: number;
  linked?: string[];
};

const tasks: Task[] = [
  {
    id: "TD-1042",
    title: "Proxy für Firestore absichern",
    description: "Service-Account rotation + limitierte IAM-Rollen hinterlegen.",
    priority: "High",
    status: "In Progress",
    dueDate: "2024-06-24",
    owners: ["@anna", "@max"],
    category: "Security",
    dependencies: ["TD-1040"],
    comments: 5,
    linked: ["API-Key-Management"],
  },
  {
    id: "TD-1041",
    title: "API-Key-Management UI",
    description: "Admin-Oberfläche für Key-Erzeugung inkl. Rollen/Scopes.",
    priority: "High",
    status: "Open",
    dueDate: "2024-06-26",
    owners: ["@lisa"],
    category: "Backend",
    dependencies: ["TD-1038"],
    comments: 3,
  },
  {
    id: "TD-1045",
    title: "Session-TTL anheben (Option A)",
    description:
      "Kurzfristig Session-Lifetime hochsetzen (z.B. 8h) fグr Dev/Admin-Betrieb; mittelfristig Option C planen, sobald mehr Nutzer aktiv sind. Folge-Task: Session-TTL von 15 min auf X Stunden (JWT + Cookie) anheben und Stellen dokumentieren (Konstanten/ENV/Set-Cookie).",
    priority: "High",
    status: "Open",
    owners: ["@max"],
    category: "Security",
    comments: 2,
    linked: ["TD-1046"],
  },
  {
    id: "TD-1046",
    title: "Option C vorbereiten: Access + Refresh Token",
    description:
      "Aufbauend auf Option A: Access-Token bleibt kurz (ca. 10–15 min), Refresh-Token als HTTP-only Cookie mit 7–30 Tagen Laufzeit. Frontend holt automatisch neue Access-Tokens, solange Refresh gultig ist. Vorteile: Best Practice wie bei groグen Web-Apps; kurze Tokens, aber lange Sessions. Nachteile: Mehr Implementierungsaufwand (neuer /auth/refresh Endpoint, Token-Rotation, Fehlerhandling).",
    priority: "Medium",
    status: "Open",
    owners: ["@max"],
    category: "Security",
    comments: 1,
    linked: ["TD-1045"],
  },
  {
    id: "TD-1039",
    title: "Dashboard-Ansicht optimieren",
    description: "Responsive Kacheln, mobile Burger-Menü finalisieren.",
    priority: "Medium",
    status: "In Progress",
    dueDate: "2024-06-25",
    owners: ["@sam"],
    category: "Frontend",
    comments: 2,
  },
  {
    id: "TD-1036",
    title: "Rollenmanagement erweitern",
    description: "Moderatoren-Rollen mit eingeschränkten Adminrechten hinzufügen.",
    priority: "High",
    status: "Blocked",
    dueDate: "2024-06-22",
    owners: ["@anna"],
    category: "User Management",
    dependencies: ["TD-1034"],
    comments: 4,
  },
  {
    id: "TD-1034",
    title: "Auth-Flow härten",
    description: "2FA Reminder & Session-Refresh-Tokens begrenzen.",
    priority: "High",
    status: "Open",
    dueDate: "2024-06-21",
    owners: ["@max"],
    category: "Security",
    comments: 6,
  },
  {
    id: "TD-1029",
    title: "Protokollierung fixen",
    description: "Fehlerhafte Log-Level im Scan-Job korrigieren.",
    priority: "Medium",
    status: "Open",
    owners: ["@jamie"],
    category: "Bugfix",
    comments: 1,
  },
  {
    id: "TD-1025",
    title: "Inline-Filter für Tasks",
    description: "Mobile-first Filter UI, schnelle Statuswechsel.",
    priority: "Low",
    status: "Done",
    owners: ["@sam"],
    category: "Frontend",
  },
];

const statusColor: Record<Status, string> = {
  Open: "#8AA5C4",
  "In Progress": "#5C8BC6",
  Blocked: "#F97373",
  Done: "#38B26C",
};

const priorityTone: Record<Priority, string> = {
  High: "#FF6B6B",
  Medium: "#F9A825",
  Low: "#5C8BC6",
};

const categories: Array<{ key: Category; label: string; hint: string }> = [
  { key: "Backend", label: "Backend", hint: "Proxies, APIs, Datenfluss" },
  { key: "Frontend", label: "Frontend", hint: "UI, Responsiveness" },
  { key: "User Management", label: "Nutzerverwaltung", hint: "Rollen, Adminrechte" },
  { key: "Security", label: "Sicherheit", hint: "Auth, Policies" },
  { key: "Bugfix", label: "Fehlerbehebung", hint: "Protokollierung & Fixes" },
];

export default function TodoPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [owner, setOwner] = useState("");
  const [category, setCategory] = useState<Category | "">("");

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = !status || task.status === status;
      const matchesPriority = !priority || task.priority === priority;
      const matchesOwner = !owner || task.owners.some((o) => o.toLowerCase().includes(owner.toLowerCase()));
      const matchesCategory = !category || task.category === category;
      return matchesQuery && matchesStatus && matchesPriority && matchesOwner && matchesCategory;
    });
  }, [category, owner, priority, query, status]);

  const grouped = useMemo(() => {
    return categories.map(({ key, label, hint }) => ({
      key,
      label,
      hint,
      items: filtered.filter((task) => task.category === key),
    }));
  }, [filtered]);

  const openCount = filtered.filter((t) => t.status === "Open").length;
  const inProgressCount = filtered.filter((t) => t.status === "In Progress").length;
  const blockedCount = filtered.filter((t) => t.status === "Blocked").length;
  const doneCount = filtered.filter((t) => t.status === "Done").length;

  return (
    <ContentShell
      title="Todo-Liste & Ops-Tasks"
      description="Priorisierte Aufgaben nach Kategorien, Status und Verantwortlichen."
      headerContent={
        <PageHeader
          title="Todo-Liste & Ops-Tasks"
          subtitle="Filter, Suche und Inline-Aktionen für Admin-Aufgaben."
          hintRight="Konzept: Kategorien, Filter, Responsiveness"
        />
      }
    >
      <div className="admin-top">
        <p className="admin-top__hint">
          Inline-Aktionen (Abhaken/Bearbeiten) und mobile Burger-Navigation sind vorgesehen.
        </p>
        <div className="admin-top__actions">
          <button type="button" className="btn secondary">
            Neue Aufgabe
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <label className="filter-control filter-control--grow">
          <span>Suche</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titel, Beschreibung oder Stichwort"
          />
        </label>
        <label className="filter-control">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as Status | "")}>
            {["", "Open", "In Progress", "Blocked", "Done"].map((option) => (
              <option key={option || "all"} value={option}>
                {option || "Alle"}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Priorität</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority | "")}>
            {["", "High", "Medium", "Low"].map((option) => (
              <option key={option || "all"} value={option}>
                {option || "Alle"}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Kategorie</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as Category | "")}>
            {["", ...categories.map((c) => c.key)].map((option) => (
              <option key={option || "all"} value={option}>
                {option || "Alle"}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Verantwortlicher</span>
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="@user oder Name"
          />
        </label>
      </div>

      <div className="admin-summary">
        <div className="summary-card">
          <p>Offen</p>
          <strong>{openCount}</strong>
        </div>
        <div className="summary-card">
          <p>In Arbeit</p>
          <strong>{inProgressCount}</strong>
        </div>
        <div className="summary-card">
          <p>Blockiert</p>
          <strong>{blockedCount}</strong>
        </div>
        <div className="summary-card">
          <p>Erledigt</p>
          <strong>{doneCount}</strong>
        </div>
      </div>

      <div className="page-grid">
        <div className="placeholder-card">
          <h3>Drag & Drop</h3>
          <p>Tasks zwischen Status-Spalten verschieben.</p>
        </div>
        <div className="placeholder-card">
          <h3>Inline-Edit</h3>
          <p>Status, Priorität oder Due Date direkt anpassen.</p>
        </div>
        <div className="placeholder-card">
          <h3>Benachrichtigungen</h3>
          <p>Statusänderungen werden Verantwortlichen signalisiert.</p>
        </div>
      </div>

      <div className="page-grid">
        {grouped.map((group) => (
          <section key={group.key} className="monitoring-panel">
            <header className="monitoring-panel__header">
              <div>
                <p className="monitoring-panel__eyebrow">{group.label}</p>
                <h2>{group.hint}</h2>
              </div>
              <button type="button" className="btn secondary">
                + Task
              </button>
            </header>
            <div className="log-table">
              {group.items.length === 0 && <div className="placeholder-card">Keine Aufgaben in dieser Kategorie.</div>}
              {group.items.map((task) => (
                <article key={task.id} className="log-row">
                  <div className="log-row__head">
                    <div>
                      <p className="user-id">{task.id}</p>
                      <p className="log-row__service">{task.title}</p>
                    </div>
                    <div className="log-row__body">
                      <span className="log-badge" style={{ color: statusColor[task.status], borderColor: statusColor[task.status] }}>
                        {task.status}
                      </span>
                      <span className="log-badge" style={{ color: priorityTone[task.priority], borderColor: priorityTone[task.priority] }}>
                        Prio {task.priority}
                      </span>
                    </div>
                  </div>
                  <div className="log-row__body">
                    <span className="log-row__message">{task.description}</span>
                    {task.linked?.length ? (
                      <span className="log-row__message">Verknüpft: {task.linked.join(", ")}</span>
                    ) : null}
                    {task.dependencies?.length ? (
                      <span className="log-row__message">Abhängigkeiten: {task.dependencies.join(", ")}</span>
                    ) : null}
                  </div>
                  <div className="log-row__body">
                    <span className="log-row__timestamp">Due: {task.dueDate ?? "—"}</span>
                    <span className="log-row__timestamp">Verantwortliche: {task.owners.join(", ")}</span>
                    {task.comments ? (
                      <span className="log-row__timestamp">{task.comments} Kommentare</span>
                    ) : null}
                  </div>
                  <div className="log-row__head">
                    <div className="log-row__body">
                      <span className="log-badge log-badge--info">Bearbeiten</span>
                      <span className="log-badge log-badge--warning">Abhaken</span>
                    </div>
                    <span className="log-row__timestamp">Inline-Aktion</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ContentShell>
  );
}
