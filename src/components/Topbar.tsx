import useAuth from "../hooks/useAuth";

export default function Topbar() {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar__branding">
        <span className="topbar__logo">SFDataHub</span>
        <span className="topbar__subtitle">Control Panel</span>
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
