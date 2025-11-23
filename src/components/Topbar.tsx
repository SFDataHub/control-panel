import useAuth from "../hooks/useAuth";

type TopbarProps = {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
};

export default function Topbar({ onToggleSidebar, isSidebarOpen }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__burger"
          aria-label="Toggle navigation"
          aria-expanded={isSidebarOpen ?? false}
          onClick={onToggleSidebar}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="topbar__branding">
          <span className="topbar__logo">SFDataHub</span>
          <span className="topbar__subtitle">Control Panel</span>
        </div>
      </div>
      <div className="topbar__user">
        <div className="topbar__avatar">{user?.displayName?.[0] ?? "A"}</div>
        <div className="topbar__meta">
          <p>{user?.displayName}</p>
          <small>{user?.role}</small>
        </div>
      </div>
    </header>
  );
}
