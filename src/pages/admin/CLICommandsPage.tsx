import { useMemo, useState } from "react";
import ContentShell from "../../components/ContentShell";
import PageHeader from "../../components/PageHeader";
import type { CliCommand } from "./cliCommandsConfig";
import { cliCommands } from "./cliCommandsConfig";

export default function CLICommandsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [repo, setRepo] = useState<string>("all");
  const [environment, setEnvironment] = useState<string>("all");
  const [shell, setShell] = useState<string>("all");
  const [hideDangerous, setHideDangerous] = useState<boolean>(false);

  const hasCommands = cliCommands.length > 0;

  const filteredCommands = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return cliCommands.filter((command) => {
      if (term) {
        const haystack = `${command.title} ${command.description} ${command.command}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (category !== "all" && command.category !== category) return false;
      if (repo !== "all" && command.repo !== repo) return false;
      if (environment !== "all" && command.environment !== environment) return false;
      if (shell !== "all" && command.shell !== shell) return false;
      if (hideDangerous && command.dangerLevel === "dangerous") return false;
      return true;
    });
  }, [category, environment, hideDangerous, repo, searchTerm, shell]);

  const handleCopy = async (command: CliCommand) => {
    try {
      await navigator.clipboard.writeText(command.command);
      setCopiedId(command.id);
      window.setTimeout(() => setCopiedId((current) => (current === command.id ? null : current)), 1400);
    } catch (error) {
      console.error("[CLI Commands] Copy failed", error);
    }
  };

  return (
    <ContentShell
      title="CLI Commands"
      description="Overview of recurring PowerShell and terminal commands for SFDataHub."
      headerContent={
        <PageHeader
          title="CLI Commands"
          subtitle="Internal helper page for deployments, seeds, and admin scripts."
          hintRight="Admins & Developers only"
        />
      }
    >
      <div className="admin-top">
        <p className="admin-top__hint">
          Internal helper page for deployments, seeds and admin scripts. Access is limited to admin and
          developer roles.
        </p>
      </div>

      <div className="admin-filters">
        <label className="filter-control filter-control--grow">
          <span>Search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search commands..."
          />
        </label>

        <label className="filter-control">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All</option>
            <option value="deploy">Deploy</option>
            <option value="seed">Seed</option>
            <option value="git">Git</option>
            <option value="auth">Auth</option>
            <option value="firestore">Firestore</option>
            <option value="setup">Setup</option>
            <option value="misc">Misc</option>
          </select>
        </label>

        <label className="filter-control">
          <span>Repo</span>
          <select value={repo} onChange={(event) => setRepo(event.target.value)}>
            <option value="all">All</option>
            <option value="main">Main</option>
            <option value="control-panel">Control Panel</option>
            <option value="auth-api">Auth API</option>
            <option value="backend">Backend</option>
            <option value="global">Global</option>
          </select>
        </label>

        <label className="filter-control">
          <span>Environment</span>
          <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
            <option value="all">All</option>
            <option value="local">Local</option>
            <option value="test">Test</option>
            <option value="beta">Beta</option>
            <option value="prod">Prod</option>
            <option value="cloud-shell">Cloud Shell</option>
          </select>
        </label>

        <label className="filter-control">
          <span>Shell</span>
          <select value={shell} onChange={(event) => setShell(event.target.value)}>
            <option value="all">All</option>
            <option value="powershell">PowerShell</option>
            <option value="bash">Bash</option>
          </select>
        </label>

        <label className="filter-control">
          <span>Hide dangerous</span>
          <input
            type="checkbox"
            checked={hideDangerous}
            onChange={(event) => setHideDangerous(event.target.checked)}
          />
        </label>
      </div>

      <section className="monitoring-panel">
        <header className="monitoring-panel__header">
          <div>
            <p className="monitoring-panel__eyebrow">Command list</p>
            <h2>Reusable CLI commands</h2>
            <p className="monitoring-panel__subtitle">
              Copy-ready commands for deployments and maintenance. Filters and search are available below.
            </p>
          </div>
          <span className="status-badge status-badge--beta">
            {hasCommands ? `${filteredCommands.length} commands` : "Empty"}
          </span>
        </header>

        {hasCommands ? (
          <div className="monitoring-panel__grid">
            {filteredCommands.map((command) => (
              <CommandCard
                key={command.id}
                command={command}
                onCopy={() => handleCopy(command)}
                copied={copiedId === command.id}
              />
            ))}
            {filteredCommands.length === 0 && (
              <div className="placeholder-card">
                <p className="monitoring-panel__subtitle">
                  No commands match your filters. Adjust search or filters to see results.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="placeholder-card">
            <p className="monitoring-panel__subtitle">
              There are currently no CLI commands configured. Edit <code>cliCommandsConfig.ts</code> to add your first
              entries.
            </p>
          </div>
        )}
      </section>
    </ContentShell>
  );
}

function CommandCard({ command, onCopy, copied }: { command: CliCommand; onCopy: () => void; copied: boolean }) {
  const dangerTone =
    command.dangerLevel === "dangerous"
      ? "status-badge--down"
      : command.dangerLevel === "warning"
        ? "status-badge--warning"
        : "status-badge--ok";

  return (
    <article className="log-row" style={{ borderColor: "#1f3150" }}>
      <div className="log-row__head" style={{ alignItems: "flex-start" }}>
        <div>
          <p className="user-id">{command.title}</p>
          <p className="log-row__message">{command.description}</p>
        </div>
        <div className="log-row__body" style={{ gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span className={`status-badge ${dangerTone}`}>{command.dangerLevel}</span>
          <span className="pill pill--ghost">{command.category}</span>
          <span className="pill pill--ghost">{command.repo}</span>
          <span className="pill pill--ghost">{command.environment}</span>
          <span className="pill pill--ghost">{command.shell}</span>
          {command.updatedAt ? <span className="pill pill--ghost">updated {command.updatedAt}</span> : null}
        </div>
      </div>

      <div className="log-row__body" style={{ display: "grid", gap: "0.5rem" }}>
        {command.placeholders.length ? (
          <div className="log-row__message" style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {command.placeholders.map((placeholder) => (
              <span key={placeholder.name} className="pill pill--ghost" title={placeholder.description}>
                {placeholder.name}
              </span>
            ))}
          </div>
        ) : null}

        <pre
          className="log-row__message"
          style={{
            background: "#0b111d",
            border: "1px solid #1f3150",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            fontSize: "0.9rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "ui-monospace, SFMono-Regular, SFMono, Consolas, Menlo, monospace",
          }}
        >
          {command.command}
        </pre>
      </div>

      <div className="log-row__head">
        <div className="log-row__body" style={{ gap: "0.5rem" }}>
          {command.notes ? <span className="log-row__message">{command.notes}</span> : null}
        </div>
        <button type="button" className="btn secondary" onClick={onCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </article>
  );
}
