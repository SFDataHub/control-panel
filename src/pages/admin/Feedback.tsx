import React, { useMemo, useState } from "react";
import ContentShell from "../../components/ContentShell";
import PageHeader from "../../components/PageHeader";
import { MessageSquare, Smile, Meh, Frown } from "lucide-react";

type Sentiment = "positive" | "neutral" | "negative";

type FeedbackItem = {
  id: string;
  user: string;
  channel: string;
  submittedAt: string;
  sentiment: Sentiment;
  summary: string;
  detail: string;
  status: string;
};

const feedback: FeedbackItem[] = [
  {
    id: "FDB-3401",
    user: "@ArcaneScout",
    channel: "in-app",
    submittedAt: "2024-06-19 21:45 UTC",
    sentiment: "positive",
    summary: "Guild Hub revamp",
    detail: "Really like the new roles overview. Could we pin favorite members?",
    status: "triaged",
  },
  {
    id: "FDB-3398",
    user: "@ShadowScribe",
    channel: "discord",
    submittedAt: "2024-06-19 20:18 UTC",
    sentiment: "neutral",
    summary: "Scan delays",
    detail: "Scans seemed slower tonight (~5m). Was there maintenance?",
    status: "investigating",
  },
  {
    id: "FDB-3394",
    user: "@GuildLeader87",
    channel: "email",
    submittedAt: "2024-06-19 18:02 UTC",
    sentiment: "negative",
    summary: "Roster export",
    detail: "Export CSV is missing player class data after last update.",
    status: "open",
  },
  {
    id: "FDB-3389",
    user: "@PotionMaster",
    channel: "in-app",
    submittedAt: "2024-06-19 16:50 UTC",
    sentiment: "positive",
    summary: "New timeline",
    detail: "Timeline filters are great! Would love to save custom presets.",
    status: "in review",
  },
];

export default function AdminFeedback() {
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return feedback.filter((item) => {
      if (sentimentFilter !== "all" && item.sentiment !== sentimentFilter) return false;
      if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter) return false;
      if (channelFilter !== "all" && item.channel.toLowerCase() !== channelFilter) return false;
      if (query && !`${item.summary} ${item.detail} ${item.user}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [channelFilter, searchTerm, sentimentFilter, statusFilter]);

  const summary = useMemo(
    () => ({
      positive: filtered.filter((f) => f.sentiment === "positive").length,
      neutral: filtered.filter((f) => f.sentiment === "neutral").length,
      negative: filtered.filter((f) => f.sentiment === "negative").length,
      total: filtered.length,
    }),
    [filtered],
  );

  return (
    <ContentShell
      title="Feedback overview"
      description="Monitor and triage incoming player feedback"
      headerContent={
        <PageHeader
          title="Feedback overview"
          subtitle="Monitor and triage incoming player feedback"
          hintRight="Sample data"
        />
      }
    >
      <div className="admin-top">
        <p className="admin-top__hint">Realtime wiring möglich; aktuell Demo-Daten.</p>
        <div className="admin-top__actions">
          <button type="button" className="btn secondary">
            Export thread
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <label className="filter-control">
          <span>Sentiment</span>
          <select value={sentimentFilter} onChange={(event) => setSentimentFilter(event.target.value as Sentiment | "all")}>
            <option value="all">All</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </label>
        <label className="filter-control">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="triaged">Triaged</option>
            <option value="investigating">Investigating</option>
            <option value="in review">In review</option>
          </select>
        </label>
        <label className="filter-control">
          <span>Channel</span>
          <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value.toLowerCase())}>
            <option value="all">All</option>
            <option value="in-app">In-app</option>
            <option value="discord">Discord</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="filter-control filter-control--grow">
          <span>Search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Stichwort, User oder Channel"
          />
        </label>
      </div>

      <div className="admin-summary">
        <div className="summary-card">
          <p>Positive</p>
          <strong>{summary.positive}</strong>
        </div>
        <div className="summary-card">
          <p>Neutral</p>
          <strong>{summary.neutral}</strong>
        </div>
        <div className="summary-card">
          <p>Negative</p>
          <strong>{summary.negative}</strong>
        </div>
        <div className="summary-card">
          <p>Total</p>
          <strong>{summary.total}</strong>
        </div>
      </div>

      <div className="page-grid">
        <SentimentBreakdown />
        <FollowUpQueue />
      </div>

      <div className="log-table">
        {filtered.map((item) => (
          <article key={item.id} className="log-row">
            <div className="log-row__head">
              <div>
                <p className="user-id">{item.id}</p>
                <p className="log-row__service">{item.summary}</p>
              </div>
              <div className="log-row__body">
                <SentimentBadge value={item.sentiment} />
                <span className="log-badge">{item.status}</span>
              </div>
            </div>
            <div className="log-row__body">
              <span className="log-row__message">{item.detail}</span>
            </div>
            <div className="log-row__body">
              <span className="log-row__timestamp">Channel: {item.channel}</span>
              <span className="log-row__timestamp">Submitted: {item.submittedAt}</span>
              <span className="log-row__timestamp">User: {item.user}</span>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="placeholder-card">
            <p>No feedback matches your filters.</p>
          </div>
        )}
      </div>
    </ContentShell>
  );
}

function SentimentBadge({ value }: { value: Sentiment }) {
  const map: Record<Sentiment, { label: string; color: string; Icon: React.ComponentType<any> }> = {
    positive: { label: "Positive", color: "#38B26C", Icon: Smile },
    neutral: { label: "Neutral", color: "#F9A825", Icon: Meh },
    negative: { label: "Negative", color: "#FF6B6B", Icon: Frown },
  };

  const { label, color, Icon } = map[value];

  return (
    <span className="log-badge" style={{ color, borderColor: color }}>
      <Icon className="h-4 w-4" aria-hidden="true" /> {label}
    </span>
  );
}

function SentimentBreakdown() {
  const entries: Array<{ label: string; value: string; color: string }> = [
    { label: "Positive", value: "48%", color: "#38B26C" },
    { label: "Neutral", value: "32%", color: "#F9A825" },
    { label: "Negative", value: "20%", color: "#FF6B6B" },
  ];

  return (
    <div className="placeholder-card">
      <h3>Sentiment mix</h3>
      <ul className="content-shell__list">
        {entries.map((entry) => (
          <li key={entry.label} style={{ color: entry.color }}>
            {entry.label}: {entry.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FollowUpQueue() {
  const actions = [
    { label: "Assign to product", detail: "2 waiting" },
    { label: "Reply templates", detail: "Updated yesterday" },
    { label: "Quarterly NPS", detail: "Survey closes in 3 days" },
  ];

  return (
    <div className="placeholder-card">
      <h3>Follow-ups</h3>
      <ul className="content-shell__list">
        {actions.map((action) => (
          <li key={action.label}>
            <strong>{action.label}</strong> – {action.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
